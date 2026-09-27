const TOKEN_KEYS = ["token", "accessToken", "userToken"] as const;

export const CHAT_PENDING_PREFIX = "chat-ai:pending-run:v2:";
export const LEGACY_CHAT_PENDING_KEY = "chat-ai:pending-run:v1";

const storageAvailable = (): boolean => typeof window !== "undefined";

export const readAccessToken = (): string | null => {
  if (!storageAvailable()) return null;
  for (const key of TOKEN_KEYS) {
    const stored = window.localStorage.getItem(key);
    if (!stored) continue;
    let candidate: unknown = stored;
    if (stored.startsWith('"') || stored.startsWith("{") || stored.startsWith("[")) {
      try {
        const parsed = JSON.parse(stored);
        candidate =
          typeof parsed === "string"
            ? parsed
            : parsed?.token ?? parsed?.accessToken ?? parsed?.value;
      } catch {
        window.localStorage.removeItem(key);
        continue;
      }
    }
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    window.localStorage.removeItem(key);
  }
  return null;
};

export const clearPendingChatRuns = (): void => {
  if (!storageAvailable()) return;
  window.sessionStorage.removeItem(LEGACY_CHAT_PENDING_KEY);
  const keys: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(CHAT_PENDING_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => window.sessionStorage.removeItem(key));
};

export const clearAuthArtifacts = (): void => {
  if (!storageAvailable()) return;
  TOKEN_KEYS.forEach((key) => window.localStorage.removeItem(key));
  clearPendingChatRuns();
};

export const safeRedirectTarget = (value: unknown): string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";

