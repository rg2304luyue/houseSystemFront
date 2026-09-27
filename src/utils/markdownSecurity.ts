import DOMPurify from "dompurify";

const FORBIDDEN_TAGS = [
  "script",
  "style",
  "form",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "audio",
  "video",
];

/**
 * MdPreview renders model-controlled Markdown as HTML. Keep only ordinary HTML
 * content and explicitly exclude executable/embedded document features.
 */
export const sanitizeMarkdownHtml = (html: string): string => {
  const escapeAsText = () => {
    // Fail closed in unsupported/DOM-emulation environments: preserve the
    // visible text but never return markup that a preview could execute.
    return html
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };
  if (!DOMPurify.isSupported) return escapeAsText();

  const sanitized = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: ["style"],
  });
  // Some DOM emulators advertise the required APIs but cannot safely parse
  // HTML. Returning escaped text is safer than silently rendering nothing.
  return sanitized || (html ? escapeAsText() : "");
};
