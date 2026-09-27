import { describe, expect, it, vi } from "vitest";
import {
  useChatRun,
  pendingChatRunKey,
  type PendingChatRun,
} from "@/composables/useChatRun";
import type {
  AgentRunSnapshot,
  ChatAiApi,
  ChatHistoryMessage,
  ChatStreamEvent,
} from "@/api/chatAiApi";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const history = (sessionId: number, label: string): ChatHistoryMessage[] => [
  { id: sessionId * 10, session_id: sessionId, role: "assistant", content: label },
];

const makeApi = (overrides: Partial<ChatAiApi> = {}): ChatAiApi => ({
  listSessions: vi.fn(async () => []),
  listMessages: vi.fn(async (sessionId) => history(sessionId, `session-${sessionId}`)),
  deleteSession: vi.fn(async () => undefined),
  getRun: vi.fn(async () => ({
    request_id: "r1",
    session_id: 1,
    status: "completed",
    attempt_count: 1,
    error_code: null,
    next_retry_at: null,
    finished_at: null,
  })),
  cancelRun: vi.fn(async () => "cancelled"),
  streamChat: vi.fn(async () => undefined),
  ...overrides,
});

const nextIds = (...ids: string[]) => {
  let index = 0;
  return () => ids[index++] ?? `id-${index}`;
};

const OWNER_ID = "user-1";
const OWNER_KEY = pendingChatRunKey(OWNER_ID);
const ownerOptions = { getOwnerId: () => OWNER_ID };

describe("useChatRun", () => {
  it("does not recover another user's pending prompt", async () => {
    const storage = new MemoryStorage();
    storage.setItem(pendingChatRunKey("user-a"), JSON.stringify({
      version: 2,
      ownerId: "user-a",
      requestId: "private-run",
      sessionId: 4,
      message: "用户A的私密问题",
      assistantClientId: "assistant-a",
      createdAt: 1,
      cancelRequested: false,
    } satisfies PendingChatRun));
    const api = makeApi();
    const chat = useChatRun({
      api,
      storage,
      getToken: () => "user-b-token",
      getOwnerId: () => "user-b",
    });

    await chat.initialize();

    expect(chat.messages.value).toEqual([]);
    expect(api.getRun).not.toHaveBeenCalled();
  });

  it("persists requestId before streaming and clears it only after done", async () => {
    const storage = new MemoryStorage();
    let persistedDuringRequest: string | null = null;
    const api = makeApi({
      streamChat: vi.fn(async (request, options) => {
        persistedDuringRequest = storage.getItem(OWNER_KEY);
        await options.onEvent({ type: "start", request_id: request.request_id, session_id: 9 });
        await options.onEvent({ type: "chunk", content: "可信回答" });
        await options.onEvent({ type: "done", request_id: request.request_id, session_id: 9 });
      }),
    });
    const chat = useChatRun({
      api,
      storage,
      getToken: () => "valid-token",
      ...ownerOptions,
      makeId: nextIds("r1", "assistant-1", "user-1"),
      sleep: async () => undefined,
    });

    await chat.sendMessage("岳麓区两千以内");

    expect(JSON.parse(persistedDuringRequest!)).toMatchObject({ requestId: "r1" });
    expect(storage.getItem(OWNER_KEY)).toBeNull();
    expect(chat.messages.value.map((message) => message.content)).toEqual([
      "岳麓区两千以内",
      "可信回答",
    ]);
  });

  it("prevents an older session response from overwriting the latest selection", async () => {
    let resolveOne!: (value: ChatHistoryMessage[]) => void;
    let resolveTwo!: (value: ChatHistoryMessage[]) => void;
    const api = makeApi({
      listMessages: vi.fn((sessionId) => new Promise((resolve) => {
        if (sessionId === 1) resolveOne = resolve;
        else resolveTwo = resolve;
      })),
    });
    const chat = useChatRun({ api, storage: new MemoryStorage(), getToken: () => "token-value", ...ownerOptions });

    const first = chat.loadSession(1);
    const second = chat.loadSession(2);
    await Promise.resolve();
    await Promise.resolve();
    resolveTwo(history(2, "newest"));
    await second;
    resolveOne(history(1, "stale"));
    await first;

    expect(chat.currentSessionId.value).toBe(2);
    expect(chat.messages.value.map((message) => message.content)).toEqual(["newest"]);
  });

  it("ignores late SSE callbacks after switching to a new chat", async () => {
    let emit!: (event: ChatStreamEvent) => void | Promise<void>;
    let finish!: () => void;
    const api = makeApi({
      streamChat: vi.fn(async (_request, options) => {
        emit = options.onEvent;
        await new Promise<void>((resolve) => { finish = resolve; });
      }),
    });
    const chat = useChatRun({
      api,
      storage: new MemoryStorage(),
      getToken: () => "token-value",
      ...ownerOptions,
      makeId: nextIds("r1", "assistant-1", "user-1"),
    });

    const sending = chat.sendMessage("旧问题");
    await Promise.resolve();
    await chat.createNewChat();
    await emit({ type: "chunk", content: "迟到内容" });
    finish();
    await sending;

    expect(chat.messages.value).toEqual([]);
    expect(api.cancelRun).toHaveBeenCalledWith("r1");
  });

  it("resumes retry_wait with the original requestId without duplicating the user message", async () => {
    const storage = new MemoryStorage();
    const pending: PendingChatRun = {
      version: 2,
      ownerId: OWNER_ID,
      requestId: "original-run",
      sessionId: 5,
      message: "原问题",
      assistantClientId: "assistant-original",
      createdAt: 1,
      cancelRequested: false,
    };
    storage.setItem(OWNER_KEY, JSON.stringify(pending));
    const snapshot: AgentRunSnapshot = {
      request_id: "original-run",
      session_id: 5,
      status: "retry_wait",
      attempt_count: 1,
      error_code: "RATE_LIMITED",
      next_retry_at: null,
      finished_at: null,
    };
    const api = makeApi({
      listMessages: vi.fn(async () => [
        { id: 1, session_id: 5, role: "user", content: "原问题" },
      ]),
      getRun: vi.fn(async () => snapshot),
      streamChat: vi.fn(async (request, options) => {
        expect(request.request_id).toBe("original-run");
        await options.onEvent({ type: "start", request_id: request.request_id, session_id: 5 });
        await options.onEvent({ type: "chunk", content: "恢复成功" });
        await options.onEvent({ type: "done", request_id: request.request_id, session_id: 5 });
      }),
    });
    const chat = useChatRun({
      api,
      storage,
      getToken: () => "token-value",
      ...ownerOptions,
      sleep: async () => undefined,
      now: () => 1,
    });

    await chat.initialize();

    expect(api.streamChat).toHaveBeenCalledTimes(1);
    expect(chat.messages.value.filter((message) => message.role === "user")).toHaveLength(1);
    expect(chat.messages.value.at(-1)?.content).toBe("恢复成功");
    expect(storage.getItem(OWNER_KEY)).toBeNull();
  });

  it("recovers a completed run by reloading persisted server history", async () => {
    const storage = new MemoryStorage();
    storage.setItem(OWNER_KEY, JSON.stringify({
      version: 2,
      ownerId: OWNER_ID,
      requestId: "done-run",
      sessionId: 4,
      message: "原问题",
      assistantClientId: "assistant-done",
      createdAt: 1,
      cancelRequested: false,
    } satisfies PendingChatRun));
    const api = makeApi({
      getRun: vi.fn(async () => ({
        request_id: "done-run",
        session_id: 4,
        status: "completed",
        attempt_count: 1,
        error_code: null,
        next_retry_at: null,
        finished_at: null,
      })),
      listMessages: vi.fn(async () => [
        { id: 1, session_id: 4, role: "user", content: "原问题" },
        { id: 2, session_id: 4, role: "assistant", content: "数据库中的完整回答" },
      ]),
    });
    const chat = useChatRun({ api, storage, getToken: () => "token-value", ...ownerOptions });

    await chat.initialize();

    expect(chat.messages.value.at(-1)?.content).toBe("数据库中的完整回答");
    expect(api.streamChat).not.toHaveBeenCalled();
    expect(storage.getItem(OWNER_KEY)).toBeNull();
  });

  it("keeps an unconfirmed run persisted and blocks duplicate submissions", async () => {
    const storage = new MemoryStorage();
    const api = makeApi({
      streamChat: vi.fn(async () => { throw new Error("offline"); }),
      getRun: vi.fn(async () => { throw new Error("offline"); }),
    });
    const chat = useChatRun({
      api,
      storage,
      getToken: () => "token-value",
      ...ownerOptions,
      makeId: nextIds("r1", "assistant-1", "user-1"),
      sleep: async () => undefined,
    });

    await chat.sendMessage("不能重复的问题");

    expect(chat.isGenerating.value).toBe(true);
    expect(storage.getItem(OWNER_KEY)).toContain('"requestId":"r1"');
    await expect(chat.sendMessage("第二个问题")).resolves.toBe(false);
  });

  it("does not release the pending owner when server cancellation cannot be confirmed", async () => {
    const storage = new MemoryStorage();
    const api = makeApi({
      streamChat: vi.fn(async (_request, options) => {
        await new Promise<void>((_resolve, reject) => {
          options.signal.addEventListener(
            "abort",
            () => reject(new DOMException("aborted", "AbortError")),
            { once: true },
          );
        });
      }),
      cancelRun: vi.fn(async () => { throw new Error("offline"); }),
    });
    const chat = useChatRun({
      api,
      storage,
      getToken: () => "token-value",
      ...ownerOptions,
      makeId: nextIds("r1", "assistant-1", "user-1"),
    });

    const sending = chat.sendMessage("仍在后端执行的问题");
    await Promise.resolve();
    await chat.createNewChat();
    await sending;

    expect(chat.isGenerating.value).toBe(true);
    expect(chat.activeRun.value?.phase).toBe("cancel_pending");
    expect(storage.getItem(OWNER_KEY)).toContain('"cancelRequested":true');
    await expect(chat.sendMessage("不能覆盖的新问题")).resolves.toBe(false);
  });

  it("keeps recovery metadata when a completed answer cannot be loaded", async () => {
    const storage = new MemoryStorage();
    storage.setItem(OWNER_KEY, JSON.stringify({
      version: 2,
      ownerId: OWNER_ID,
      requestId: "done-run",
      sessionId: 4,
      message: "原问题",
      assistantClientId: "assistant-done",
      createdAt: 1,
      cancelRequested: false,
    } satisfies PendingChatRun));
    const api = makeApi({
      getRun: vi.fn(async () => ({
        request_id: "done-run",
        session_id: 4,
        status: "completed",
        attempt_count: 1,
        error_code: null,
        next_retry_at: null,
        finished_at: null,
        assistant_message_id: 99,
      })),
      listMessages: vi.fn(async () => { throw new Error("offline"); }),
    });
    const chat = useChatRun({
      api,
      storage,
      getToken: () => "token-value",
      ...ownerOptions,
      sleep: async () => undefined,
    });

    await chat.initialize();

    expect(chat.isGenerating.value).toBe(true);
    expect(chat.activeRun.value?.phase).toBe("recovering");
    expect(storage.getItem(OWNER_KEY)).toContain('"requestId":"done-run"');
    expect(chat.messages.value.at(-1)?.notice).toContain("结果已经生成");
  });
});
