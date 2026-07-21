// src/api/client.ts
// 统一 Axios 实例 —— 本地开发走 Vite proxy，Docker 走 Nginx proxy
// 所有 API 调用请使用相对路径（如 /houses），baseURL 统一为 /api/v1
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/v1",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// 请求拦截：自动附加 token
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 读取 token
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("userToken");
    if (token) {
      const raw = token.startsWith('"') ? JSON.parse(token) : token;
      config.headers.Authorization = `Bearer ${raw}`;
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
      return Promise.reject(
        new Error(body.message || "请求失败")
      );
    }
    return response;
  },
  (error) => {
    // 401 拦截：清除 token 并跳转到登录页
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userToken");
      window.location.href = "/auth/signin";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
