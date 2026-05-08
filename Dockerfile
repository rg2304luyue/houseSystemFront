# ============================================================
# 链居 - 前端 Dockerfile（多阶段构建）
# ============================================================

# ---- Stage 1: 构建 ----
FROM node:18-alpine AS build-stage

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

# 利用 Docker 缓存：先复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ---- Stage 2: 生产运行 (Nginx) ----
FROM nginx:stable-alpine AS production-stage

RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Shanghai

# 复制构建产物
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置（SPA 路由回退 + API 反向代理）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 健康检查（nginx:stable-alpine 含 curl，不含 wget）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
