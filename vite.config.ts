/// <reference types="vitest" />
// Plugins
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

import AutoImport from "unplugin-auto-import/vite";

// Utilities
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
      styles: { configFile: "src/styles/variables.scss" },
    }),
    AutoImport({
      imports: ["vue", "vue-router", "pinia"],
    }),
  ],
  define: { "process.env": {} },
  test: {
    globals: true,
    environment: "happy-dom",
  },
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@data": fileURLToPath(new URL("./src/data", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    port: 4399,
    proxy: {
      // 所有后端 API 代理到 Flask（本地开发时使用；Docker 下由 nginx 处理）
      "/user":        "http://localhost:5000",
      "/houseinfo":   "http://localhost:5000",
      "/chat-ai":     "http://localhost:5000",
      "/comments":    "http://localhost:5000",
      "/news":        "http://localhost:5000",
      "/contracts":   "http://localhost:5000",
      "/appointments":"http://localhost:5000",
      "/repaires":    "http://localhost:5000",
      "/messages":    "http://localhost:5000",
      "/rental":      "http://localhost:5000",
      "/housedetail": "http://localhost:5000",
      "/admin":       "http://localhost:5000",
      "/github":      "http://localhost:5000",
      "/email-auth":  "http://localhost:5000",
      "/sms":         "http://localhost:5000",
      "/oss":         "http://localhost:5000",
      "/celery":      "http://localhost:5000",
      "/alipay":      "http://localhost:5000",
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
      "/sdApi": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sdApi/, ""),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: { charset: false },
      css: { charset: false },
    },
  },

});
