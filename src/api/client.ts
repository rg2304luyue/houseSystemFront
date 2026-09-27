// src/api/client.ts
// 统一 Axios 实例 —— 本地开发走 Vite proxy，部署时由 Web 服务器提供同源反向代理
// 所有 API 调用请使用相对路径（如 /houses），baseURL 统一为 /api/v1
import axios from "axios";
import { clearAuthArtifacts, readAccessToken, safeRedirectTarget } from "@/utils/authSession";

const apiClient = axios.create({
  baseURL: "/api/v1",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// 请求拦截：自动附加 token
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 读取 token
    const token = readAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截：解包 {code, data, message, success}，只暴露 data
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    // 如果响应带有标准包装格式，则解包
    if (body && typeof body === "object" && "code" in body && "data" in body) {
      if (body.success === true || (typeof body.code === "number" && body.code >= 200 && body.code < 300)) {
        response.data = body.data;
        return response;
      }
      const apiError = new Error(body.message || "请求失败") as Error & { code?: number; response?: unknown; data?: unknown };
      apiError.code = body.code;
      apiError.data = body;
      return Promise.reject(apiError);
    }
    return response;
  },
  (error) => {
    // 401 拦截：清除 token 并跳转到登录页
    // 登录/注册等 auth 接口的 401 属于业务失败（密码或验证码错误），
    // 交由调用方展示错误信息，不做全局跳转。
    const requestUrl: string = error.config?.url ?? "";
    const isBusinessAuthCall = /^\/?(auth|users\/password-reset)\//.test(requestUrl);
    const isOnSignin = window.location.pathname.startsWith("/auth/signin");
    if (error.response?.status === 401 && !isBusinessAuthCall && !isOnSignin) {
      clearAuthArtifacts();
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const redirect = safeRedirectTarget(current);
      window.location.href = `/auth/signin?redirect=${encodeURIComponent(redirect)}`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
