# 第一阶段：构建阶段
FROM node:18-alpine AS build-stage

# 可选：设置构建阶段时区（避免构建日志时间不对）
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

# 优化：先复制依赖文件，利用 Docker 缓存（只要 package.json 不变，npm install 就不会重新执行）
COPY package*.json ./
# 可选：如果用 yarn，改成 RUN yarn install --frozen-lockfile
RUN npm install

# 复制源代码
COPY . .

# 可选：注入构建时环境变量（如前端需要动态配置后端 API 地址）
# 注意：Vue 项目变量必须以 VUE_APP_ 开头，React 必须以 REACT_APP_ 开头
# ARG VUE_APP_API_BASE_URL
# ENV VUE_APP_API_BASE_URL=$VUE_APP_API_BASE_URL

# 执行构建（确保你的 package.json 里有 build 脚本，且生成的目录是 dist）
RUN npm run build

# 第二阶段：生产运行阶段（使用 Nginx）
FROM nginx:stable-alpine AS production-stage

# 1. 设置容器时区为中国时区（可选但推荐）
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

# 2. 从构建阶段复制生成的 dist 文件夹到 Nginx 静态文件目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 3. 【关键】复制自定义 Nginx 配置文件（解决 SPA 路由和反向代理问题）
# 注意：需要先在前端项目根目录创建 nginx.conf 或 default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]