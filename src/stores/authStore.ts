import { defineStore } from "pinia";
import apiClient from "@/api/client";
import router from "@/router";
import { useProfileStore } from "@/stores/profileStore";
import { clearAuthArtifacts } from "@/utils/authSession";

interface Profile {
  id: string;
  name: string;
  avatar: string;
  created: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    isLoggedIn: false,
    user: null,
    profile: null as Profile | null,
  }),

  persist: {
    storage: localStorage,
    pick: ["isLoggedIn", "token"],
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async refreshProfile() {
      try {
        const response = await apiClient.get("/users/me");
        useProfileStore().setUser(response.data);
        this.isLoggedIn = true;
      } catch (error: any) {
        useProfileStore().$reset();
        if ([401, 403].includes(error?.response?.status)) {
          clearAuthArtifacts();
          this.token = "";
          this.isLoggedIn = false;
          this.user = null;
          this.profile = null;
        }
        throw error;
      }
    },
    async completeLogin(authPayload: any) {
      const token = authPayload?.token;
      if (typeof token !== "string" || !token.trim()) throw new Error("登录响应缺少有效凭证");
      const profileStore = useProfileStore();
      try {
        const profileRes = await apiClient.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        profileStore.setUser(profileRes.data);
        this.user = authPayload;
        this.setToken(token);
        this.setLoggedIn(true);
      } catch (error) {
        clearAuthArtifacts();
        this.token = "";
        this.isLoggedIn = false;
        this.user = null;
        this.profile = null;
        profileStore.$reset();
        throw error;
      }
    },
    setToken(newToken: string) {
      this.token = newToken;
      localStorage.setItem("token", newToken);
    },

    removeToken() {
      this.token = "";
      localStorage.removeItem("token");
    },

    getToken() {
      return this.token;
    },

    setLoggedIn(payload: boolean) {
      this.isLoggedIn = payload;
    },

    async registerWithUsernameAndPassword(phone: string, password: string, email: string) {
      try {
        await apiClient.post("/auth/register", { phone, password, email });
        // interceptor 已校验 success，到达这里即注册成功
        router.push("/auth/signin");
      } catch (error: any) {
        const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error.message || "Registration failed";
        console.error("请求异常：", errorMsg);
        throw new Error(errorMsg);
      }
    },

    registerWithEmailAndPassword(email: string, password: string) {
      router.push("/");
    },

    async loginWithUsernameAndPassword(phone: string, password: string) {
      try {
        const response = await apiClient.post("/auth/login", { phone, password });

        // interceptor 已校验 success 并解包，response.data 已是内层 data
        await this.completeLogin(response.data);
      } catch (error: any) {
        const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error.message;
        console.error("请求异常：", errorMsg);
        throw new Error(errorMsg);
      }
    },

    async loginWithEmailAndPassword(email: string, password: string) {
      try {
        const response = await apiClient.post("/auth/email-login", { email, password });

        // interceptor 已校验 success 并解包，response.data 已是内层 data
        await this.completeLogin(response.data);
      } catch (error: any) {
        const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error.message;
        console.error("邮箱登录请求异常：", errorMsg);
        throw new Error(errorMsg);
      }
    },

    logout() {
      clearAuthArtifacts();
      this.token = "";
      this.isLoggedIn = false;
      this.user = null;
      this.profile = null;
      useProfileStore().$reset();
      router.push({ name: "auth-signin" });
    }
  },
});
