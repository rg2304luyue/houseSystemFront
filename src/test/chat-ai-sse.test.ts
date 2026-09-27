import { describe, expect, it, vi } from "vitest";
import {
  ChatApiError,
  consumeSseStream,
  createChatApiError,
  type ChatStreamEvent,
} from "@/api/chatAiApi";

const streamFrom = (parts: Uint8Array[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });

describe("chat SSE parser", () => {
  it("handles multiple events, CRLF, multiline data and arbitrary byte boundaries", async () => {
    const encoder = new TextEncoder();
    const source =
      'data: {"type":"start","request_id":"r1","session_id":7}\r\n\r\n' +
      'data: {"type":"chunk",\r\n' +
      'data: "content":"长沙房源"}\r\n\r\n' +
      'data:{"type":"done","request_id":"r1","session_id":7}\n\n';
    const bytes = encoder.encode(source);
    const events: ChatStreamEvent[] = [];

    await consumeSseStream(
      streamFrom([bytes.slice(0, 13), bytes.slice(13, 67), bytes.slice(67, 82), bytes.slice(82)]),
      (event) => events.push(event),
    );

    expect(events.map((event) => event.type)).toEqual(["start", "chunk", "done"]);
    expect(events[1]).toEqual({ type: "chunk", content: "长沙房源" });
  });

  it("flushes the final event at EOF", async () => {
    const events: ChatStreamEvent[] = [];
    await consumeSseStream(
      streamFrom([new TextEncoder().encode('data: {"type":"chunk","content":"尾部"}')]),
      (event) => events.push(event),
    );
    expect(events).toEqual([{ type: "chunk", content: "尾部" }]);
  });

  it("fails closed on invalid JSON", async () => {
    const action = consumeSseStream(
      streamFrom([new TextEncoder().encode("data: not-json\n\n")]),
      vi.fn(),
    );
    await expect(action).rejects.toMatchObject({ code: "INVALID_SSE_JSON" });
  });

  it("fails over to run recovery when an open stream stays idle", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ start() {}, cancel });
    await expect(consumeSseStream(stream, vi.fn(), 5)).rejects.toMatchObject({
      code: "SSE_IDLE_TIMEOUT",
      retryable: true,
    });
    expect(cancel).toHaveBeenCalledOnce();
  });
});

describe("public HTTP error contract", () => {
  it("reads FastAPI object detail and retry metadata", () => {
    const error = createChatApiError(
      429,
      {
        detail: {
          code: "AGENT_BUSY",
          message: "AI 请求繁忙",
          retryable: true,
          retry_after: 3,
        },
      },
      "9",
    );
    expect(error).toBeInstanceOf(ChatApiError);
    expect(error).toMatchObject({
      status: 429,
      code: "AGENT_BUSY",
      message: "AI 请求繁忙",
      retryable: true,
      retryAfterSeconds: 3,
    });
  });

  it("keeps compatibility with string detail and Retry-After", () => {
    const error = createChatApiError(409, { detail: "任务正在运行" }, "2");
    expect(error.message).toBe("任务正在运行");
    expect(error.retryAfterSeconds).toBe(2);
  });
});
