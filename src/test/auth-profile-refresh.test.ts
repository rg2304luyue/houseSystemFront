import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import apiClient from "@/api/client";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";

vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("@/api/client", () => ({ default: { get: vi.fn() } }));

describe("authenticated profile refresh", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      get length() { return storage.size; },
    });
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("replaces cached admin role with the server role", async () => {
    const profile = useProfileStore();
    profile.setUser({ id: 12, user_type: 0 });
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 12, user_type: 1 } });
    await useAuthStore().refreshProfile();
    expect(apiClient.get).toHaveBeenCalledWith("/users/me");
    expect(profile.user.userType).toBe(1);
  });

  it("clears authentication when the server rejects the account", async () => {
    const auth = useAuthStore();
    auth.setToken("cached-token");
    useProfileStore().setUser({ id: 12, user_type: 0 });
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 403 } });
    await expect(auth.refreshProfile()).rejects.toBeDefined();
    expect(auth.isAuthenticated).toBe(false);
    expect(useProfileStore().user.id).toBeNull();
  });

  it("does not keep a cached privileged role after a network error", async () => {
    const auth = useAuthStore();
    auth.setToken("cached-token");
    useProfileStore().setUser({ id: 12, user_type: 0 });
    vi.mocked(apiClient.get).mockRejectedValue(new Error("offline"));
    await expect(auth.refreshProfile()).rejects.toThrow("offline");
    expect(auth.isAuthenticated).toBe(true);
    expect(useProfileStore().user.userType).toBe(1);
  });
});
