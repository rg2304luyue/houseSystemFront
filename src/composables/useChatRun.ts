import { computed, ref, shallowRef } from "vue";
import {
  ChatApiError,
  chatAiApi,
  type AgentRunSnapshot,
  type ChatAiApi,
  type ChatSessionSummary,
  type ChatStreamEvent,
} from "@/api/chatAiApi";
import { CHAT_PENDING_PREFIX, LEGACY_CHAT_PENDING_KEY } from "@/utils/authSession";

export const PENDING_CHAT_RUN_KEY = LEGACY_CHAT_PENDING_KEY;
export const pendingChatRunKey = (ownerId: string) =>
  `${CHAT_PENDING_PREFIX}${encodeURIComponent(ownerId)}`;

export interface ChatViewMessage {
  clientId: string;
  serverId?: number;
  content: string;
  role: "user" | "assistant" | "system";
  streaming?: boolean;
  activity?: string;
  notice?: string;
  runId?: string;
}

export interface PendingChatRun {
  version: 2;
  ownerId: string;
  requestId: string;
  sessionId: number | null;
  message: string;
  assistantClientId: string;
  createdAt: number;
  cancelRequested: boolean;
}

type RunPhase =
  | "connecting"
  | "streaming"
  | "recovering"
  | "retry_wait"
  | "cancel_pending";

interface ActiveRun extends PendingChatRun {
  phase: RunPhase;
  controller: AbortController | null;
  pendingContent: string;
  renderTimer: ReturnType<typeof setTimeout> | null;
  streamOutcome: "done" | "error" | "cancelled" | null;
  streamError?: ChatStreamEvent & { type: "error" };
  retryCount: number;
}

interface UseChatRunOptions {
  api?: ChatAiApi;
  storage?: Storage;
  getToken: () => string | null;
  getOwnerId?: () => string | null;
  notifyError?: (message: string) => void;
  notifySuccess?: (message: string) => void;
  makeId?: () => string;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => number;
}

const defaultMakeId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const errorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";

const retryTimestamp = (value: string | null): number => {
  if (!value) return Date.now();
  // The backend currently serializes UTC database timestamps without an offset.
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

export function useChatRun(options: UseChatRunOptions) {
  const api = options.api ?? chatAiApi;
  const storage =
    options.storage ?? (typeof window !== "undefined" ? window.sessionStorage : undefined);
  const makeId = options.makeId ?? defaultMakeId;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const ownerId = (): string | null => {
    const value = options.getOwnerId?.();
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  const storageKey = (): string | null => {
    const owner = ownerId();
    return owner ? pendingChatRunKey(owner) : null;
  };

  const messages = ref<ChatViewMessage[]>([]);
  const sessionList = ref<ChatSessionSummary[]>([]);
  const currentSessionId = ref<number | null>(null);
  const isSessionLoading = ref(false);
  const activeRun = shallowRef<ActiveRun | null>(null);
  const isGenerating = computed(() => activeRun.value !== null);

  let disposed = false;
  let sessionLoadEpoch = 0;
  let sessionListEpoch = 0;

  const readPending = (): PendingChatRun | null => {
    if (!storage) return null;
    storage.removeItem(PENDING_CHAT_RUN_KEY);
    const key = storageKey();
    if (!key) return null;
    try {
      const value = JSON.parse(storage.getItem(key) || "null");
      if (
        value?.version === 2 &&
        value.ownerId === ownerId() &&
        typeof value.requestId === "string" &&
        (typeof value.sessionId === "number" || value.sessionId === null) &&
        typeof value.message === "string" &&
        typeof value.assistantClientId === "string"
      ) {
        return value as PendingChatRun;
      }
    } catch {
      storage.removeItem(key);
    }
    return null;
  };

  const persistRun = (run: PendingChatRun) => {
    if (!storage) return;
    const key = storageKey();
    const owner = ownerId();
    if (!key || !owner || run.ownerId !== owner) return;
    try {
      const value: PendingChatRun = {
        version: 2,
        ownerId: owner,
        requestId: run.requestId,
        sessionId: run.sessionId,
        message: run.message,
        assistantClientId: run.assistantClientId,
        createdAt: run.createdAt,
        cancelRequested: run.cancelRequested,
      };
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable in privacy mode. The in-memory run remains safe.
    }
  };

  const clearPending = (requestId: string) => {
    if (!storage) return;
    const key = storageKey();
    if (!key) return;
    const pending = readPending();
    if (!pending || pending.requestId === requestId) {
      storage.removeItem(key);
    }
  };

  const patchRun = (requestId: string, patch: Partial<ActiveRun>): ActiveRun | null => {
    const run = activeRun.value;
    if (!run || run.requestId !== requestId) return null;
    const next = { ...run, ...patch };
    activeRun.value = next;
    persistRun(next);
    return next;
  };

  const findAssistant = (run: Pick<ActiveRun, "requestId" | "assistantClientId">) =>
    messages.value.find(
      (message) =>
        message.clientId === run.assistantClientId && message.runId === run.requestId,
    );

  const updateAssistant = (
    run: Pick<ActiveRun, "requestId" | "assistantClientId">,
    patch: Partial<ChatViewMessage>,
  ): boolean => {
    if (activeRun.value?.requestId !== run.requestId) return false;
    const message = findAssistant(run);
    if (!message) return false;
    Object.assign(message, patch);
    return true;
  };

  const clearRenderTimer = (run: ActiveRun) => {
    if (run.renderTimer !== null) clearTimeout(run.renderTimer);
    run.renderTimer = null;
  };

  const appendPendingSlice = (run: ActiveRun, maxLength: number) => {
    if (activeRun.value?.requestId !== run.requestId || !run.pendingContent) return;
    const message = findAssistant(run);
    if (!message) return;
    const content = run.pendingContent.slice(0, maxLength);
    run.pendingContent = run.pendingContent.slice(content.length);
    message.content += content;
    message.activity = undefined;
  };

  const scheduleContent = (run: ActiveRun) => {
    if (
      activeRun.value?.requestId !== run.requestId ||
      !run.pendingContent ||
      run.renderTimer !== null
    ) {
      return;
    }
    run.renderTimer = setTimeout(() => {
      run.renderTimer = null;
      appendPendingSlice(run, 32);
      scheduleContent(run);
    }, 25);
  };

  const drainContent = async (run: ActiveRun) => {
    clearRenderTimer(run);
    let steps = 0;
    while (
      run.pendingContent &&
      activeRun.value?.requestId === run.requestId &&
      steps < 20
    ) {
      const chunkSize = Math.max(32, Math.ceil(run.pendingContent.length / (20 - steps)));
      appendPendingSlice(run, chunkSize);
      steps += 1;
      if (run.pendingContent) await sleep(15);
    }
    if (activeRun.value?.requestId === run.requestId) {
      appendPendingSlice(run, run.pendingContent.length);
    }
  };

  const flushContent = (run: ActiveRun) => {
    clearRenderTimer(run);
    appendPendingSlice(run, run.pendingContent.length);
  };

  const fetchSessions = async () => {
    const epoch = ++sessionListEpoch;
    try {
      const sessions = await api.listSessions();
      if (!disposed && epoch === sessionListEpoch) sessionList.value = sessions;
    } catch (error) {
      options.notifyError?.(errorMessage(error, "加载会话列表失败"));
    }
  };

  const replaceWithSessionMessages = async (
    sessionId: number,
    { showLoading = true }: { showLoading?: boolean } = {},
  ): Promise<boolean> => {
    const epoch = ++sessionLoadEpoch;
    currentSessionId.value = sessionId;
    if (showLoading) isSessionLoading.value = true;
    try {
      const history = await api.listMessages(sessionId);
      if (disposed || epoch !== sessionLoadEpoch || currentSessionId.value !== sessionId) {
        return false;
      }
      messages.value = history.map((message) => ({
        clientId: `server-${message.id}`,
        serverId: message.id,
        role: message.role,
        content: message.content,
        streaming: false,
      }));
      return true;
    } catch (error) {
      if (epoch === sessionLoadEpoch) {
        options.notifyError?.(errorMessage(error, "加载历史记录失败"));
      }
      return false;
    } finally {
      if (showLoading && epoch === sessionLoadEpoch) isSessionLoading.value = false;
    }
  };

  const finishRun = (
    run: ActiveRun,
    status: "completed" | "failed" | "cancelled",
    message?: string,
  ) => {
    if (activeRun.value?.requestId !== run.requestId) return;
    clearRenderTimer(run);
    const assistant = findAssistant(run);
    if (assistant) {
      assistant.streaming = false;
      assistant.activity = undefined;
      if (status === "completed") {
        assistant.notice = undefined;
      } else if (!assistant.content) {
        assistant.content = message || (status === "cancelled" ? "已停止生成。" : "AI 请求失败。");
      } else {
        assistant.notice = message;
      }
    }
    activeRun.value = null;
    clearPending(run.requestId);
  };

  const ensureRecoveryMessages = (pending: PendingChatRun) => {
    const existing = messages.value.find((message) => message.runId === pending.requestId);
    if (existing) return;
    const last = messages.value[messages.value.length - 1];
    if (!(last?.role === "user" && last.content === pending.message)) {
      messages.value.push({
        clientId: makeId(),
        role: "user",
        content: pending.message,
        streaming: false,
      });
    }
    messages.value.push({
      clientId: pending.assistantClientId,
      role: "assistant",
      content: "",
      streaming: true,
      activity: "正在恢复任务",
      runId: pending.requestId,
    });
  };

  let runStream: (run: ActiveRun) => Promise<void>;

  const recoverFromSnapshot = async (run: ActiveRun, snapshot: AgentRunSnapshot) => {
    if (activeRun.value?.requestId !== run.requestId) return;
    if (snapshot.session_id && run.sessionId !== snapshot.session_id) {
      run.sessionId = snapshot.session_id;
      currentSessionId.value = snapshot.session_id;
      persistRun(run);
    }

    if (snapshot.status === "completed") {
      const loaded = await replaceWithSessionMessages(snapshot.session_id, {
        showLoading: false,
      });
      const completedMessageLoaded = loaded && messages.value.some(
        (message) =>
          message.role === "assistant" &&
          Boolean(message.content.trim()) &&
          (snapshot.assistant_message_id == null ||
            message.serverId === snapshot.assistant_message_id),
      );
      if (completedMessageLoaded) {
        finishRun(run, "completed");
        await fetchSessions();
      } else {
        ensureRecoveryMessages(run);
        patchRun(run.requestId, { phase: "recovering" });
        updateAssistant(run, {
          streaming: false,
          activity: undefined,
          notice: "结果已经生成，暂时无法加载内容；刷新页面后会继续恢复。",
        });
      }
      return;
    }
    if (snapshot.status === "failed") {
      finishRun(run, "failed", `生成失败（${snapshot.error_code || "AGENT_FAILED"}）`);
      return;
    }
    if (snapshot.status === "cancelled") {
      finishRun(run, "cancelled", "已停止生成。");
      return;
    }
    if (snapshot.status === "retry_wait") {
      patchRun(run.requestId, { phase: "retry_wait" });
      updateAssistant(run, {
        streaming: true,
        activity: "服务暂时繁忙，正在等待重试",
      });
      const waitMs = Math.max(0, retryTimestamp(snapshot.next_retry_at) - now());
      if (waitMs) await sleep(Math.min(waitMs, 60_000));
      if (activeRun.value?.requestId === run.requestId) await runStream(run);
      return;
    }

    patchRun(run.requestId, { phase: "recovering" });
    updateAssistant(run, { streaming: true, activity: "正在恢复连接" });
    const delays = [1000, 2000, 3000, 5000];
    for (const delay of delays) {
      await sleep(delay);
      if (disposed || activeRun.value?.requestId !== run.requestId) return;
      try {
        const next = await api.getRun(run.requestId);
        if (next.status !== "running") {
          await recoverFromSnapshot(run, next);
          return;
        }
      } catch (error) {
        if (error instanceof ChatApiError && error.status === 404) {
          finishRun(run, "failed", "任务不存在或已过期。");
          return;
        }
      }
    }
    // Keep the persisted request so a page refresh can continue recovery.
    flushContent(run);
    updateAssistant(run, {
      streaming: false,
      activity: undefined,
      notice: "暂时无法确认任务状态，刷新页面后会继续恢复。",
    });
    clearRenderTimer(run);
  };

  const recoverRun = async (run: ActiveRun) => {
    if (activeRun.value?.requestId !== run.requestId) return;
    patchRun(run.requestId, { phase: "recovering" });
    updateAssistant(run, { streaming: true, activity: "正在检查任务状态" });
    try {
      const snapshot = await api.getRun(run.requestId);
      await recoverFromSnapshot(run, snapshot);
    } catch (error) {
      if (error instanceof ChatApiError && error.status === 404) {
        finishRun(run, "failed", "任务不存在或已过期。");
      } else {
        await sleep(1000);
        if (!disposed && activeRun.value?.requestId === run.requestId) {
          try {
            const snapshot = await api.getRun(run.requestId);
            await recoverFromSnapshot(run, snapshot);
          } catch {
            flushContent(run);
            updateAssistant(run, {
              streaming: false,
              activity: undefined,
              notice: "连接中断，刷新页面后会继续恢复。",
            });
          }
        }
      }
    }
  };

  const handleStreamEvent = async (run: ActiveRun, event: ChatStreamEvent) => {
    if (activeRun.value?.requestId !== run.requestId || run.cancelRequested) return;
    if (
      (event.type === "start" || event.type === "done") &&
      event.request_id !== run.requestId
    ) {
      throw new ChatApiError("AI 任务标识不匹配", { code: "REQUEST_ID_MISMATCH" });
    }
    if (event.type === "start") {
      run.sessionId = event.session_id;
      currentSessionId.value = event.session_id;
      run.phase = "streaming";
      persistRun(run);
    } else if (event.type === "status") {
      updateAssistant(run, { activity: event.label || "正在思考中" });
    } else if (event.type === "chunk") {
      run.pendingContent += event.content;
      scheduleContent(run);
    } else if (event.type === "replace") {
      // 服务端校验后的权威答案与已流出的内容不一致，整体替换
      run.pendingContent = event.content;
      scheduleContent(run);
    } else if (event.type === "done") {
      await drainContent(run);
      run.streamOutcome = "done";
      finishRun(run, "completed");
      await fetchSessions();
    } else if (event.type === "error") {
      flushContent(run);
      run.streamOutcome = "error";
      run.streamError = event;
    } else if (event.type === "cancelled") {
      flushContent(run);
      run.streamOutcome = "cancelled";
      finishRun(run, "cancelled", "已停止生成。");
    }
  };

  runStream = async (run: ActiveRun) => {
    if (disposed || activeRun.value?.requestId !== run.requestId) return;
    const token = options.getToken();
    if (!token) {
      finishRun(run, "failed", "登录状态已失效，请重新登录。");
      return;
    }
    const controller = new AbortController();
    run.controller = controller;
    run.phase = "connecting";
    run.streamOutcome = null;
    run.streamError = undefined;
    activeRun.value = { ...run };
    run = activeRun.value;
    updateAssistant(run, { streaming: true, activity: "正在连接 AI 服务" });

    try {
      await api.streamChat(
        {
          message: run.message,
          session_id: run.sessionId,
          request_id: run.requestId,
        },
        {
          token,
          signal: controller.signal,
          onEvent: (event) => handleStreamEvent(run, event),
        },
      );
      if (activeRun.value?.requestId !== run.requestId) return;
      if (run.streamOutcome === "error") {
        await recoverRun(run);
      } else if (run.streamOutcome !== "done" && run.streamOutcome !== "cancelled") {
        await recoverRun(run);
      }
    } catch (error) {
      if (disposed || activeRun.value?.requestId !== run.requestId) return;
      if (isAbortError(error) && run.cancelRequested) return;
      if (error instanceof ChatApiError && error.status === 429) {
        if (run.retryCount >= 3) {
          finishRun(run, "failed", "请求较多，请稍后再试。");
          return;
        }
        run.retryCount += 1;
        patchRun(run.requestId, { phase: "retry_wait" });
        updateAssistant(run, { activity: "请求较多，正在等待重试" });
        const retryAfter = Math.min(Math.max(error.retryAfterSeconds ?? 2, 1), 30);
        const backoff = Math.min(30, retryAfter * 2 ** (run.retryCount - 1));
        await sleep((backoff + Math.random()) * 1000);
        if (activeRun.value?.requestId === run.requestId) await runStream(run);
      } else if (error instanceof ChatApiError && error.status === 401) {
        finishRun(run, "failed", error.message);
      } else if (error instanceof ChatApiError && error.status === 409) {
        await recoverRun(run);
      } else {
        await recoverRun(run);
      }
    }
  };

  const sendMessage = async (value: string) => {
    const message = value.trim();
    if (!message || activeRun.value) return false;
    const requestId = makeId();
    const assistantClientId = makeId();
    const currentOwnerId = ownerId();
    if (!currentOwnerId) {
      options.notifyError?.("用户信息尚未加载，请稍后重试");
      return false;
    }
    const run: ActiveRun = {
      version: 2,
      ownerId: currentOwnerId,
      requestId,
      sessionId: currentSessionId.value,
      message,
      assistantClientId,
      createdAt: now(),
      cancelRequested: false,
      phase: "connecting",
      controller: null,
      pendingContent: "",
      renderTimer: null,
      streamOutcome: null,
      retryCount: 0,
    };
    messages.value.push({
      clientId: makeId(),
      content: message,
      role: "user",
      streaming: false,
    });
    messages.value.push({
      clientId: assistantClientId,
      content: "",
      role: "assistant",
      streaming: true,
      activity: "正在思考中",
      runId: requestId,
    });
    activeRun.value = run;
    persistRun(run);
    await runStream(run);
    return true;
  };

  const cancelActiveRun = async ({ waitForServer = true } = {}): Promise<boolean> => {
    const run = activeRun.value;
    if (!run) return true;
    const controller = run.controller;
    run.cancelRequested = true;
    run.phase = "cancel_pending";
    run.controller = null;
    persistRun(run);
    clearRenderTimer(run);
    activeRun.value = { ...run };
    const assistant = findAssistant(run);
    if (assistant) {
      assistant.streaming = false;
      assistant.activity = undefined;
      assistant.notice = "正在确认停止状态。";
    }
    controller?.abort();
    const request = api
      .cancelRun(run.requestId)
      .then(async (status) => {
        if (activeRun.value?.requestId !== run.requestId) return true;
        if (status === "completed") {
          await recoverRun(run);
          return activeRun.value?.requestId !== run.requestId;
        }
        if (status === "failed") {
          finishRun(run, "failed", "生成失败。");
          return true;
        }
        finishRun(run, "cancelled", "已停止生成。");
        return true;
      })
      .catch((error) => {
        if (error instanceof ChatApiError && error.status === 404) {
          finishRun(run, "cancelled", "已停止生成。");
          return true;
        }
        options.notifyError?.(errorMessage(error, "后端停止任务失败"));
        if (activeRun.value?.requestId === run.requestId) {
          patchRun(run.requestId, { phase: "cancel_pending" });
          updateAssistant(run, {
            streaming: false,
            activity: undefined,
            notice: "停止状态尚未确认，请重试停止或刷新页面后继续处理。",
          });
        }
        return false;
      });
    if (waitForServer) return request;
    void request;
    return false;
  };

  const loadSession = async (sessionId: number) => {
    if (currentSessionId.value === sessionId && !activeRun.value) return;
    if (!(await cancelActiveRun({ waitForServer: true }))) return;
    messages.value = [];
    await replaceWithSessionMessages(sessionId);
  };

  const createNewChat = async () => {
    if (!(await cancelActiveRun({ waitForServer: true }))) return;
    sessionLoadEpoch += 1;
    currentSessionId.value = null;
    messages.value = [];
    isSessionLoading.value = false;
  };

  const deleteSession = async (sessionId: number) => {
    if (activeRun.value?.sessionId === sessionId) {
      if (!(await cancelActiveRun({ waitForServer: true }))) return;
    }
    await api.deleteSession(sessionId);
    if (currentSessionId.value === sessionId) {
      sessionLoadEpoch += 1;
      currentSessionId.value = null;
      messages.value = [];
      isSessionLoading.value = false;
    }
    await fetchSessions();
    options.notifySuccess?.("会话已删除");
  };

  const recoverPendingRun = async () => {
    const pending = readPending();
    if (!pending || disposed || activeRun.value) return;
    if (pending.sessionId !== null) {
      await replaceWithSessionMessages(pending.sessionId, { showLoading: false });
    }
    ensureRecoveryMessages(pending);
    const run: ActiveRun = {
      ...pending,
      phase: "recovering",
      controller: null,
      pendingContent: "",
      renderTimer: null,
      streamOutcome: null,
      retryCount: 0,
    };
    activeRun.value = run;
    if (pending.cancelRequested) {
      try {
        const status = await api.cancelRun(run.requestId);
        if (status === "completed") {
          await recoverRun(run);
        } else if (status === "failed") {
          finishRun(run, "failed", "生成失败。");
        } else {
          finishRun(run, "cancelled", "已停止生成。");
        }
      } catch (error) {
        if (error instanceof ChatApiError && error.status === 404) {
          finishRun(run, "cancelled", "已停止生成。");
        } else {
          updateAssistant(run, {
            streaming: false,
            notice: "暂时无法确认取消状态，刷新后会继续取消。",
          });
          patchRun(run.requestId, { phase: "cancel_pending" });
        }
      }
      return;
    }
    await recoverRun(run);
  };

  const initialize = async () => {
    disposed = false;
    await fetchSessions();
    await recoverPendingRun();
  };

  const dispose = () => {
    disposed = true;
    sessionLoadEpoch += 1;
    sessionListEpoch += 1;
    const run = activeRun.value;
    if (run) {
      clearRenderTimer(run);
      run.controller?.abort();
      activeRun.value = null;
    }
  };

  return {
    messages,
    sessionList,
    currentSessionId,
    isSessionLoading,
    isGenerating,
    activeRun,
    initialize,
    fetchSessions,
    loadSession,
    createNewChat,
    deleteSession,
    sendMessage,
    stopGeneration: () => cancelActiveRun({ waitForServer: true }),
    recoverPendingRun,
    dispose,
  };
}
