# 链居 - 房屋租赁系统（前端）

基于 **Vue 3 + Vuetify 3 + Vite** 的房屋租赁系统前端，提供房源浏览、AI选房、在线签约、即时通讯、支付宝支付等功能。

## 技术栈

| 类别         | 技术                                      |
| ------------ | ----------------------------------------- |
| 框架         | Vue 3 (Composition API + `<script setup>`) |
| UI 框架      | Vuetify 3                                 |
| 构建工具     | Vite 4                                    |
| 语言         | TypeScript                                |
| 状态管理     | Pinia + pinia-plugin-persistedstate       |
| 路由         | Vue Router 4 (History 模式)               |
| HTTP 客户端  | Axios                                     |
| 图表         | ECharts 5 + vue-echarts + ApexCharts      |
| 富文本编辑器 | Tiptap + vue-quill + md-editor-v3         |
| 实时通讯     | Socket.IO Client                          |
| 国际化       | vue-i18n (中文 / English / 日本語)         |
| CSS          | Sass + Tailwind CSS                        |
| 测试         | Vitest + Vue Test Utils                   |

## 项目结构

```
houseSystemFront-Ylfmoonn/
├── index.html                   # HTML 入口
├── .env.example                 # 环境变量模板
├── package.json                 # 依赖与脚本
├── vite.config.ts               # Vite 构建配置（chunk 拆分 + 开发代理）
├── tsconfig.json                # TypeScript 配置
├── Dockerfile                   # 多阶段构建（Node 18 → Nginx）
├── nginx.conf                   # Nginx 反向代理 + 静态资源缓存
│
├── public/                      # 静态资源（favicon、Live2D 模型等）
│
├── src/
│   ├── main.ts                  # 应用入口
│   ├── App.vue                  # 根组件（动态布局切换）
│   │
│   ├── api/                     # API 请求层（6 个模块）
│   │   ├── client.ts            # 统一 Axios 实例（自动附加 JWT Token）
│   │   ├── houseApi.ts          # 房源相关 API
│   │   ├── aiApi.ts             # AI / OpenAI 兼容 API
│   │   ├── githubApi.ts         # GitHub 公开事件
│   │   ├── midJourneyApi.ts     # MidJourney 绘图 API
│   │   └── stableDiffusionApi.ts # Stable Diffusion API
│   │
│   ├── stores/                  # Pinia 状态管理（9 个 Store，全部持久化）
│   │   ├── authStore.ts         # 认证 + JWT Token 管理
│   │   ├── customizeTheme.ts    # 主题 / 侧边栏 / 语言设置
│   │   ├── profileStore.ts      # 用户资料
│   │   ├── cartStore.ts         # 购物车
│   │   ├── chatGPTStore.ts      # OpenAI API 配置
│   │   ├── snackbarStore.ts     # 全局消息提示
│   │   ├── speechStore.ts       # Azure 语音合成
│   │   ├── fixCardStore.ts      # 维修申报卡片状态
│   │   └── stableDiffusionStore.ts # SD 绘图状态
│   │
│   ├── router/                  # 路由配置
│   │   ├── index.ts             # 主路由（30+ 路由，全部懒加载）
│   │   ├── auth.routes.ts       # 认证路由
│   │   └── landing.routes.ts    # Landing 路由
│   │
│   ├── views/                   # 页面组件（扁平化）
│   │   ├── DashboardPage.vue    # 首页仪表盘
│   │   ├── HouseListPage.vue    # 房源搜索列表
│   │   ├── HouseDetailPage.vue  # 房源详情
│   │   ├── ChatBotPage.vue      # AI 选购顾问
│   │   ├── ChatPage.vue         # 即时通讯
│   │   ├── ContractPage.vue     # 合同管理
│   │   ├── PricingPage.vue      # 支付页面
│   │   ├── LandlordPropertiesPage.vue 等
│   │   ├── AdminPanelPage.vue   # 管理员面板
│   │   ├── ImageBotPage.vue     # AI 绘图
│   │   ├── SigninPage.vue       # 登录
│   │   ├── SignupPage.vue       # 注册
│   │   └── ...
│   │
│   ├── components/              # 公共组件（~70 个，按功能分目录）
│   │   ├── dashboard/           # 首页组件
│   │   ├── houseDetail/         # 房源详情组件
│   │   ├── HouseList/           # 房源列表组件
│   │   ├── toolbar/             # 顶栏组件
│   │   ├── navigation/          # 导航/侧边栏组件
│   │   ├── Administrator/       # 管理后台图表组件
│   │   ├── ai/                  # AI 功能组件
│   │   ├── pricing/             # 定价/支付组件
│   │   ├── common/              # 通用小组件
│   │   └── ...
│   │
│   ├── plugins/                 # 插件初始化（vuetify, echarts, i18n）
│   ├── layouts/                 # 4 个布局组件
│   ├── locales/                 # 国际化语言文件（zh/en/ja）
│   ├── configs/                 # 应用配置（导航/货币/语言）
│   ├── styles/                  # 全局样式（SCSS）
│   ├── types/                   # TypeScript 类型定义
│   └── utils/                   # 工具函数
│
├── dist/                        # 构建产物（gitignore）
└── node_modules/                # 依赖
```

## 快速开始

### 前置要求

- Node.js 18+
- 后端服务已启动（本地开发为 FastAPI，默认 `http://127.0.0.1:8000`）

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
# 启动在 http://localhost:4399
```

Vite 自动将 `/api/v1` 请求代理到 FastAPI（`127.0.0.1:8000`），见 `vite.config.ts` 中的 `server.proxy` 配置。旧 Flask 路径仅为迁移期间的回退。

### 3. 构建生产版本

```bash
npm run build
# 产物输出到 dist/
```

## 页面路由

| 路径                     | 页面           | 说明             |
| ------------------------ | -------------- | ---------------- |
| `/dashboard`             | 首页仪表盘     | 热门房源/最新房源  |
| `/houseList`             | 房源列表       | 多条件筛选搜索     |
| `/house/:id`             | 房源详情       | 图片/设施/地图/评论 |
| `/ai/chatbot_v1`         | AI 选购顾问    | 对话式房源推荐     |
| `/image-bot`             | AI 绘图        | SD 文生图/图生图   |
| `/news`                  | 新闻管理       | 房产新闻管理       |
| `/newsList`              | 新闻列表       | 新闻浏览/编辑      |
| `/newsDetail/:id`        | 新闻详情       | 新闻正文          |
| `/chat`                  | 即时通讯       | 租客-房东对话      |
| `/contract`              | 合同管理       | 创建/查看合同      |
| `/profile`               | 个人资料       | 用户信息/头像编辑   |
| `/payPay`                | 支付页面       | 租金支付          |
| `/alipay/payment-result` | 支付结果       | 支付宝回调结果     |
| `/landlord`              | 房源管理       | 房东房源管理表格   |
| `/landlordUpload`        | 发布房源       | 创建新房源         |
| `/admin`                 | 管理员面板     | 数据统计/图表      |
| `/userManage`            | 用户管理       | 管理员管理用户     |
| `/auth/signin`           | 登录           | 手机/邮箱/验证码   |
| `/auth/signup`           | 注册           | 创建新账号        |

## 主要功能

- **用户系统** — 手机/邮箱/GitHub OAuth 登录，头像裁剪上传
- **房源浏览** — 多条件筛选、分页、浏览量排行
- **AI 选房** — 通义千问 ReAct Agent，SSE 流式对话
- **即时通讯** — Socket.IO 实时聊天，租客-房东对话频道
- **合同与支付** — 在线签约，支付宝沙箱支付
- **管理后台** — ECharts 图表统计，用户管理，新闻管理

## 构建优化

- **Chunk 拆分**: echarts(~1MB)、vuetify(~300KB)、Vue 全家桶 各自独立 chunk，代码更新不影响框架缓存
- **静态资源强缓存**: Nginx `expires 1y` + `Cache-Control: public, immutable`，Vite 生成 content-hash 文件名
- **Gzip 压缩**: 启用 `gzip_vary`、`gzip_proxied`、`gzip_comp_level 6`
- **API 路由合并**: Nginx 20 个 location 块合并为 1 个正则匹配

## Docker 部署

```bash
docker build -t house-frontend .
docker run -d -p 80:80 house-frontend
```

多阶段构建：Node 18 alpine 构建 → Nginx stable-alpine 提供静态文件 + API 反向代理。
