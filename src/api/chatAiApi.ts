import apiClient from "@/api/client";
import axios from "axios";

export interface ChatSessionSummary {
  id: number;
  title: string;
  updated_at: string;
}

export interface ChatHistoryMessage {
  id: number;
  session_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export type AgentRunStatus =
  | "running"
  | "retry_wait"
  | "completed"
  | "failed"
  | "cancelled";

export interface AgentRunSnapshot {
  request_id: string;
  session_id: number;
  status: AgentRunStatus;
  attempt_count: number;
  error_code: string | null;
  next_retry_at: string | null;
  finished_at: string | null;
  assistant_message_id?: number | null;
  user_message_id?: number | null;
  heartbeat_at?: string | null;
  retryable?: boolean;
  retry_after?: number | null;
  error?: {
    code: string;
    message: string;
    provider: string | null;
    retryable: boolean;
    retry_after: number | null;
  } | null;
}

export interface ChatStreamRequest {
  message: string;
  session_id: number | null;
  request_id: string;
}

export type ChatStreamEvent =
  | { type: "start"; request_id: string; session_id: number }
  | { type: "status"; stage?: string; label: string }
  | { type: "chunk"; content: string }
  | { type: "replace"; content: string }
  | { type: "done"; request_id: string; session_id: number }
  | {
      type: "error";
      request_id?: string;
      code?: string;
      message: string;
      retryable?: boolean;
      retry_after?: number;
      provider?: string | null;
      session_id?: number;
      run_status?: AgentRunStatus;
    }
  | {
      type: "cancelled";
      request_id?: string;
      session_id?: number;
      run_status?: "cancelled";
    };

export class ChatApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      retryable?: boolean;
      retryAfterSeconds?: number;
    } = {},
  ) {
    super(message);
    this.name = "ChatApiError";
    this.status = options.status ?? 0;
    this.code = options.code;
    this.retryable = options.retryable ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
};

const publicErrorFields = (payload: any) => {
  const detail = payload?.detail;
  const source = detail && typeof detail === "object" ? detail : payload;
  return {
    message:
      (typeof detail === "string" && detail) ||
      (typeof source?.message === "string" && source.message) ||
      undefined,
    code: typeof source?.code === "string" ? source.code : undefined,
    retryable: typeof source?.retryable === "boolean" ? source.retryable : undefined,
    retryAfter:
      typeof source?.retry_after === "number" && source.retry_after >= 0
        ? source.retry_after
        : undefined,
  };
};

export const createChatApiError = (
  status: number,
  payload: unknown,
  retryAfterHeader: string | null = null,
): ChatApiError => {
  const fields = publicErrorFields(payload);
  return new ChatApiError(fields.message || `AI 请求失败（HTTP ${status}）`, {
    status,
    code: fields.code,
    retryable: fields.retryable ?? (status === 429 || status >= 500),
    retryAfterSeconds: fields.retryAfter ?? parseRetryAfter(retryAfterHeader),
  });
};

const responseError = async (response: Response): Promise<ChatApiError> => {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // An empty or non-JSON error response still receives a safe public message.
  }
  return createChatApiError(
    response.status,
    payload,
    response.headers.get("Retry-After"),
  );
};

const normalizeRestError = (error: unknown): ChatApiError => {
  if (error instanceof ChatApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const retryAfter = error.response?.headers?.["retry-after"];
    return createChatApiError(
      status,
      error.response?.data,
      typeof retryAfter === "string" ? retryAfter : null,
    );
  }
  return new ChatApiError("AI 服务请求失败，请稍后重试", {
    code: "NETWORK_ERROR",
    retryable: true,
  });
};

const extractSseBlocks = (
  input: string,
  flush: boolean,
): { blocks: string[]; rest: string } => {
  const blocks: string[] = [];
  let rest = input;
  const separator = /\r\n\r\n|\n\n|\r\r/;
  while (true) {
    const match = separator.exec(rest);
    if (!match || match.index === undefined) break;
    blocks.push(rest.slice(0, match.index));
    rest = rest.slice(match.index + match[0].length);
  }
  if (flush && rest.trim()) {
    blocks.push(rest);
    rest = "";
  }
  return { blocks, rest };
};

const dataFromSseBlock = (block: string): string | null => {
  const dataLines = block
    .split(/\r\n|\n|\r/)
    .filter((line) => !line.startsWith(":"))
    .filter((line) => line === "data" || line.startsWith("data:"))
    .map((line) => (line === "data" ? "" : line.slice(5).replace(/^ /, "")));
  return dataLines.length ? dataLines.join("\n") : null;
};

const toStreamEvent = (value: unknown): ChatStreamEvent => {
  if (!value || typeof value !== "object") {
    throw new ChatApiError("AI 流式响应格式错误", { code: "INVALID_SSE_EVENT" });
  }
  const event = value as Record<string, unknown>;
  switch (event.type) {
    case "start":
      if (typeof event.request_id === "string" && typeof event.session_id === "number") {
        return event as unknown as ChatStreamEvent;
      }
      break;
    case "status":
      if (typeof event.label === "string") return event as unknown as ChatStreamEvent;
      break;
    case "chunk":
      if (typeof event.content === "string") return event as unknown as ChatStreamEvent;
      break;
    case "done":
      if (typeof event.request_id === "string" && typeof event.session_id === "number") {
        return event as unknown as ChatStreamEvent;
      }
      break;
    case "error":
      if (typeof event.message === "string") return event as unknown as ChatStreamEvent;
      break;
    case "cancelled":
      return event as unknown as ChatStreamEvent;
  }
  throw new ChatApiError("AI 流式响应缺少必要字段", { code: "INVALID_SSE_EVENT" });
};

export async function consumeSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ChatStreamEvent) => void | Promise<void>,
  idleTimeoutMs = 45_000,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const consumeBlocks = async (flush = false) => {
    const result = extractSseBlocks(buffer, flush);
    buffer = result.rest;
    for (const block of result.blocks) {
      const data = dataFromSseBlock(block);
      if (data === null || data === "") continue;
      let value: unknown;
      try {
        value = JSON.parse(data);
      } catch {
        throw new ChatApiError("AI 流式响应解析失败", { code: "INVALID_SSE_JSON" });
      }
      await onEvent(toStreamEvent(value));
    }
  };

  try {
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const idleTimeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new ChatApiError("AI 流式连接长时间无响应", {
            code: "SSE_IDLE_TIMEOUT",
            retryable: true,
          }));
        }, idleTimeoutMs);
      });
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await Promise.race([reader.read(), idleTimeout]);
      } finally {
        if (timer) clearTimeout(timer);
      }
      const { done, value } = result;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      await consumeBlocks();
    }
    buffer += decoder.decode();
    await consumeBlocks(true);
  } catch (error) {
    try {
      await reader.cancel(error);
    } catch {
      // Preserve the original parser/timeout error.
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export interface ChatAiApi {
  listSessions(): Promise<ChatSessionSummary[]>;
  listMessages(sessionId: number): Promise<ChatHistoryMessage[]>;
  deleteSession(sessionId: number): Promise<void>;
  getRun(requestId: string): Promise<AgentRunSnapshot>;
  cancelRun(requestId: string): Promise<AgentRunStatus>;
  streamChat(
    request: ChatStreamRequest,
    options: {
      token: string;
      signal: AbortSignal;
      onEvent: (event: ChatStreamEvent) => void | Promise<void>;
    },
  ): Promise<void>;
}

export const chatAiApi: ChatAiApi = {
  async listSessions() {
    const response = await apiClient.get<ChatSessionSummary[]>("/chat-ai/sessions");
    return response.data;
  },

  async listMessages(sessionId) {
    const response = await apiClient.get<ChatHistoryMessage[]>(
      `/chat-ai/sessions/${sessionId}/messages`,
    );
    return response.data;
  },

  async deleteSession(sessionId) {
    await apiClient.delete(`/chat-ai/sessions/${sessionId}`);
  },

  async getRun(requestId) {
    try {
      const response = await apiClient.get<AgentRunSnapshot>(`/chat-ai/runs/${requestId}`);
      return response.data;
    } catch (error) {
      throw normalizeRestError(error);
    }
  },

  async cancelRun(requestId) {
    try {
      const response = await apiClient.post<{ status: AgentRunStatus }>(
        `/chat-ai/runs/${requestId}/cancel`,
        undefined,
        { timeout: 3000 },
      );
      return response.data.status;
    } catch (error) {
      throw normalizeRestError(error);
    }
  },

  async streamChat(request, options) {
    if (!options.token) {
      throw new ChatApiError("登录状态已失效，请重新登录", { status: 401 });
    }
    const requestController = new AbortController();
    const forwardAbort = () => requestController.abort(options.signal.reason);
    options.signal.addEventListener("abort", forwardAbort, { once: true });
    const connectionTimer = setTimeout(() => requestController.abort("SSE_CONNECT_TIMEOUT"), 15_000);
    try {
      const response = await fetch("/api/v1/chat-ai/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.token}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify(request),
        signal: requestController.signal,
      });
      clearTimeout(connectionTimer);
      if (!response.ok) throw await responseError(response);
      if (!response.body) {
        throw new ChatApiError("AI 流式响应不可用", { code: "EMPTY_SSE_BODY" });
      }
      await consumeSseStream(response.body, options.onEvent);
    } catch (error) {
      if (!options.signal.aborted && requestController.signal.aborted) {
        throw new ChatApiError("AI 服务连接超时", {
          code: "SSE_CONNECT_TIMEOUT",
          retryable: true,
        });
      }
      throw error;
    } finally {
      clearTimeout(connectionTimer);
      options.signal.removeEventListener("abort", forwardAbort);
    }
  },
};
