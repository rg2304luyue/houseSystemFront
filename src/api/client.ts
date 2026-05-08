// src/api/client.ts
// 统一 Axios 实例 —— 本地开发走 Vite proxy，Docker 走 Nginx proxy
// 所有 API 调用请使用相对路径（如 /user/login），不要写死 
import axios from "axios";

const apiClient = axios.create({
  // 空 baseURL = 相对路径，配合 Vite proxy / Nginx proxy 工作
  baseURL: "",
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

export default apiClient;
