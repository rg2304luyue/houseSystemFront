import { defineStore } from "pinia";
import apiClient from "@/api/client";
import router from "@/router";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useProfileStore } from "@/stores/profileStore";

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
    enabled: true,
    strategies: [
      { storage: localStorage, paths: ["isLoggedIn", "token"] },
    ],
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
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
        const response = await apiClient.post(
          "/user/register",
          new URLSearchParams({ phone, password, email }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        if (response.data.code === 201) {
          router.push("/auth/signin");
        } else {
          console.error("注册失败：", response.data.message);
        }
      } catch (error: any) {
        console.error("请求异常：", error?.response?.data?.message || error.message);
      }
    },

    registerWithEmailAndPassword(email: string, password: string) {
      router.push("/");
    },

    async loginWithUsernameAndPassword(phone: string, password: string) {
      try {
        const response = await apiClient.post(
          "/user/login",
          new URLSearchParams({ phone, password }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        if (response.data.code === 201) {
          this.setLoggedIn(true);
          this.user = response.data.data;
          this.setToken(response.data.data.token);

          const profileRes = await apiClient.get("/user/userinfo");
          if (profileRes.data.code === 200) {
            const profileStore = useProfileStore();
            profileStore.setUser(profileRes.data.data);
          } else {
            console.error("获取用户信息失败：", profileRes.data.message);
          }
          window.location.href = "/dashboard";
        } else {
          const snackbarStore = useSnackbarStore();
          snackbarStore.showErrorMessage("密码错误！");
          throw new Error(response.data.message || "登录失败，密码或用户名错误");
        }
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error.message;
        console.error("请求异常：", errorMsg);
        throw new Error(errorMsg);
      }
    },

    async loginWithEmailAndPassword(email: string, password: string) {
      try {
        const response = await apiClient.post(
          "/user/email-login",
          new URLSearchParams({ email, password }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        if (response.data.code === 201) {
          this.setLoggedIn(true);
          this.user = response.data.data;
          this.setToken(response.data.data.token);

          const profileRes = await apiClient.get("/user/userinfo");
          if (profileRes.data.code === 200) {
            const profileStore = useProfileStore();
            profileStore.setUser(profileRes.data.data);
          } else {
            console.error("获取用户信息失败：", profileRes.data.message);
          }
          window.location.href = "/dashboard";
        } else {
          const snackbarStore = useSnackbarStore();
          snackbarStore.showErrorMessage("邮箱或密码错误！");
          throw new Error(response.data.message || "邮箱登录失败，密码或邮箱错误");
        }
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error.message;
        console.error("邮箱登录请求异常：", errorMsg);
        throw new Error(errorMsg);
      }
    },

    logout() {
      this.removeToken();
      this.isLoggedIn = false;
      this.user = null;
      router.push({ name: "auth-signin" });
    }
  },
});
