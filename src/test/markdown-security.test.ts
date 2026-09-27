import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sanitizeMarkdownHtml } from "@/utils/markdownSecurity";

describe("AI Markdown security", () => {
  it("removes executable HTML while preserving ordinary content", () => {
    const html = sanitizeMarkdownHtml(
      '<h2>安全标题</h2><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a><script>alert(1)</script>',
    );

    expect(html).toContain("安全标题");
    expect(html).not.toMatch(/<script|<img[^>]+onerror|href\s*=\s*["']?javascript:/i);
  });

  it("forbids embedded documents, SVG and inline styles", () => {
    const html = sanitizeMarkdownHtml(
      '<iframe src="https://example.com"></iframe><svg><script>alert(1)</script></svg><p style="position:fixed">正文</p>',
    );

    expect(html).toContain("正文");
    expect(html).not.toMatch(/<(?:iframe|svg|script)\b|<[^>]+\sstyle\s*=/i);
  });

  it("always disables executable chart renderers", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/chat/SafeMarkdown.vue"),
      "utf8",
    );
    expect(source).toContain(':no-echarts="true"');
    expect(source).toContain(':no-mermaid="true"');
    expect(source).toContain(':sanitize="sanitizeMarkdownHtml"');
  });

  it("uses the same safe renderer for user-authored house comments", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/houseDetail/Feature5.vue"),
      "utf8",
    );
    expect(source).toContain('import SafeMarkdown from "@/components/chat/SafeMarkdown.vue"');
    expect(source).toContain('<SafeMarkdown :content="message.content" />');
    expect(source).not.toMatch(/<md-preview\b/i);
  });
});

describe("legacy browser model secrets", () => {
  it("removes the obsolete OpenAI client configuration and clears its old storage key", () => {
    const removed = [
      "src/components/ApiKeyDialog.vue",
      "src/stores/chatGPTStore.ts",
      "src/api/aiApi.ts",
    ];
    for (const path of removed) expect(existsSync(join(process.cwd(), path))).toBe(false);

    const checked = [".env.example", "src/env.d.ts", "src/types/env.d.ts"]
      .map((path) => readFileSync(join(process.cwd(), path), "utf8"))
      .join("\n");
    expect(checked).not.toMatch(/VITE_OPENAI|OPENAI_API_KEY|OPENAI_PROXY/i);
    expect(readFileSync(join(process.cwd(), "src/main.ts"), "utf8")).toContain(
      'localStorage.removeItem("chatGPT")',
    );
  });
});
