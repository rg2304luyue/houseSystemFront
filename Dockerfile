# 使用轻量级 Nginx 镜像
FROM nginx:stable-alpine

RUN apk add --no-cache tzdata curl
ENV TZ=Asia/Shanghai

# 将你刚才看到的 dist 目录内容复制到 Nginx 托管目录
COPY dist /usr/share/nginx/html

# 复制自定义 Nginx 配置（确保该文件在当前目录下存在）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
