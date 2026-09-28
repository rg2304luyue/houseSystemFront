# 链居 - 房屋租赁系统（前端）

基于 **Vue 3 + Vuetify 3 + Vite** 的房屋租赁系统前端，提供房源浏览、AI 选房、在线签约与支付等功能。

## 技术栈

| 类别         | 技术                                      |
| ------------ | ----------------------------------------- |
| 框架         | Vue 3 (Composition API + `<script setup>`) |
| UI 框架      | Vuetify 3 + @mdi/font                     |
| 图标         | @iconify/vue                              |
| 构建工具     | Vite 4（dev / pro 两种 mode）              |
| 语言         | TypeScript                                |
| 状态管理     | Pinia + pinia-plugin-persistedstate       |
| 路由         | Vue Router 4 (History 模式)               |
| HTTP 客户端  | Axios                                     |
| Markdown 渲染 | md-editor-v3（仅预览组件）+ DOMPurify（XSS 净化） |
| 虚拟形象     | live2d-render（AI 助手页）                 |
| 头像裁剪     | vue-advanced-cropper                      |
| 国际化       | vue-i18n（en / zhHans / ja 语言包已就绪，切换器尚未接入 UI） |
| CSS          | Sass                                       |
| 测试         | Vitest 0.30 + happy-dom（`src/test/` 共 5 个逻辑单测） |

## 界面风格

整套界面基于统一设计令牌（`src/styles/main.scss` 中的 `--house-*` 变量），亮/暗双主题自动切换：

- 主色：晴空蓝（亮 `#2563eb` / 暗 `#60a5fa`），价格与强调色：橙 `#f2622e`
- 字体：Inter + Noto Sans SC；卡片 12px 圆角、细边框 + 轻阴影
- 通用工具类：`.house-price`（价格）、`.house-muted`（次要文字）、`.house-section-title`、`.house-empty`（空状态）、`.house-hover-lift`（悬停上浮）
- 调整全站配色只需改 `src/plugins/vuetify.ts` 主题色与 `src/styles/main.scss` 令牌两处

## 项目结构

```
houseSystemFront-Ylfmoonn/
├── index.html                   # HTML 入口
├── .env.example                 # 环境变量模板
├── package.json                 # 依赖与脚本
├── vite.config.ts               # Vite 构建配置（chunk 拆分 + 开发代理）
├── tsconfig.json                # TypeScript 配置
├── nginx.conf                   # 可选的本机 Nginx 反向代理 + 静态资源缓存
├── auto-imports.d.ts            # unplugin-auto-import 生成
│
├── assets/                      # 仓库根级截图资源（未参与构建）
├── public/                      # 静态资源（favicon、UG/ Live2D 模型等）
│
├── src/
│   ├── main.ts                  # 应用入口
│   ├── App.vue                  # 根组件（动态布局切换）
│   │
│   ├── api/                     # API 请求层
│   │   ├── client.ts            # 统一 Axios 实例（baseURL /api/v1，自动附加 JWT Token）
│   │   ├── houseApi.ts          # 房源相关 API
│   │   └── chatAiApi.ts         # Agent 会话、SSE 与任务恢复 API
│   │
│   ├── stores/                  # Pinia 状态管理
│   │   ├── authStore.ts         # 认证 + JWT Token 管理
│   │   ├── customizeTheme.ts    # 主题 / 侧边栏 / 语言设置
│   │   ├── profileStore.ts      # 用户资料
│   │   └── snackbarStore.ts     # 全局消息提示
│   │
│   ├── router/                  # 路由配置
│   │   ├── index.ts             # 主路由（13 条：1 条 / 重定向 + 11 条懒加载页面 + 1 条 404 捕获）
│   │   └── auth.routes.ts       # 认证路由（3 条：signin / signup / verify-email）
│   │
│   ├── views/                   # 页面组件（16 个，扁平化）
│   │   ├── DashboardPage.vue    # 首页仪表盘
│   │   ├── HouseListPage.vue    # 房源搜索列表
│   │   ├── HouseDetailPage.vue  # 房源详情
│   │   ├── ChatBotPage.vue      # AI 选购顾问（SSE 流式）
│   │   ├── ContractPage.vue     # 合同与支付
│   │   ├── MyListingsPage.vue   # 我的房源（房东/管理员）
│   │   ├── AccountRentHousePage.vue # 我的租约
│   │   ├── PaymentResultPage.vue    # 支付结果
│   │   ├── AdminUsersPage.vue   # 管理员：用户管理
│   │   ├── ProfilePage.vue / ResetPasswordPage.vue / VerifyEmailPage.vue
│   │   ├── SigninPage.vue       # 登录
│   │   ├── SignupPage.vue       # 注册
│   │   ├── NotFoundPage.vue     # 404（/:pathMatch(.*)*）
│   │   ├── PricingPage.vue      # 当前无路由指向
│   │   └── ...                  # 另有空目录 views/components/、views/landing/toolbar/components/
│   │
│   ├── components/              # 公共组件（28 个 .vue，按功能分目录）
│   │   ├── HouseDetail/         # 房源详情组件
│   │   ├── chat/                # Markdown 安全渲染（SafeMarkdown 组件）
│   │   ├── toolbar/             # 顶栏组件
│   │   ├── navigation/          # 导航/侧边栏组件
│   │   ├── User/、common/、pricing/、animations/
│   │   ├── Administrator/、ai/、dashboard/、footer/、house/  # 目录保留（当前为空）
│   │   └── ...
│   │
│   ├── composables/             # 组合式逻辑（useChatRun、useNavigationItems）
│   ├── plugins/                 # 插件初始化（vuetify、i18n）
│   ├── layouts/                 # 3 个布局组件（AuthLayout / LandingLayout / UILayout）
│   ├── locales/                 # 国际化语言文件（en.ts / zhHans.ts / ja.ts）
│   ├── configs/                 # 应用配置（导航/货币/语言）
│   ├── data/ai/                 # 目录保留（当前为空）
│   ├── styles/                  # 全局样式（SCSS）
│   ├── test/                    # Vitest 单测（5 个）
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
# = vite --mode dev，启动在 http://localhost:4399
```

Vite 自动将 `/api/v1` 与 `/images` 请求代理到 FastAPI（`127.0.0.1:8000`），见 `vite.config.ts` 中的 `server.proxy` 配置；前端不再保留任何 Flask 路径（`src/test/legacy-api-paths.test.ts` 有防回归断言）。

### 3. 构建生产版本

```bash
npm run build
# = vite build --mode pro，产物输出到 dist/
```

### 4. 其他脚本

| 命令                | 作用                                                         |
| ------------------- | ------------------------------------------------------------ |
| `npm run typecheck` | `vue-tsc --noEmit` 类型检查                                   |
| `npm run test`      | Vitest 单测（`test:ui` 打开 UI，`coverage` 生成覆盖率报告）    |
| `npm run preview`   | 本地预览已构建产物（端口同为 4399）                            |

## 环境变量

`.env.example` 中列出的变量目前均属预留，尚无运行时引用（后端地址由 `src/api/client.ts` 硬编码为 `/api/v1`，经 Vite 代理转发）。仓库当前不存在 `.env` / `.env.dev` / `.env.pro`，因此 `--mode dev` / `--mode pro` 也不会额外加载 env 文件：

| 变量                      | 说明                                     |
| ------------------------- | ---------------------------------------- |
| `VITE_GITHUB_CLIENT_ID`   | GitHub OAuth Client ID（预留，尚无运行时引用） |
| `VITE_UNSPLASH_ACCESS_KEY`| Unsplash Access Key（预留，尚无运行时引用）    |

`src/types/env.d.ts` 另外声明了 `VITE_API_BASE_URL`、`VITE_MIDJOURNEY_API_KEY`、`VITE_TTS_KEY`、`VITE_TTS_REGION`，这些既不在 `.env.example` 中，也未被任何代码使用。

## 页面路由

| 路径                     | 页面           | 说明                     |
| ------------------------ | -------------- | ------------------------ |
| `/`                      | —              | 重定向到 `/dashboard`（保留 query） |
| `/dashboard`             | 首页仪表盘     | 欢迎卡/快捷入口/租房流程（无房源数据请求） |
| `/houseList`             | 房源列表       | 多条件筛选搜索            |
| `/houses/:id`            | 房源详情       | 图片/设施/地图/评论       |
| `/chat`                  | AI 选购顾问    | SSE 流式对话、可恢复任务   |
| `/contract`              | 合同与支付     | 创建合同、前往支付宝      |
| `/my-listings`           | 我的房源       | 房东/管理员（roles 0,2）  |
| `/RentHouse`             | 我的租约       | 当前用户租约记录          |
| `/profile`               | 个人资料       | 用户信息/头像编辑         |
| `/alipay/payment-result` | 支付结果       | 支付宝回调结果            |
| `/admin`                 | 用户管理       | 管理员（roles 0）         |
| `/auth/signin`           | 登录           | 手机/邮箱/邮箱验证码       |
| `/auth/signup`           | 注册           | 创建新账号                |
| `/auth/verify-email`     | 邮箱验证       | 静态提示页；「重新发送」仅为本地倒计时，不调接口；需登录态 |
| `/setpassword`           | 重置密码       | 页内输入邮箱 → 6 位验证码 → 新密码（非邮件链接跳转） |
| `/:pathMatch(.*)*`       | 404 未找到     | NotFoundPage（catch-all）  |

## 主要功能

- **用户系统** — 手机/邮箱/邮箱验证码登录，头像裁剪上传
- **房源浏览** — 多条件筛选（区域/方式/租金/户型/朝向/小区）、分页；侧栏 `/houses/most-viewed` 热门推荐卡片，房源浏览量统计在房东端「我的房源」中展示
- **AI 选房** — SSE 流式对话（`POST /api/v1/chat-ai/chat/stream`），支持运行状态查询（`GET /chat-ai/runs/{id}`）、取消，以及断线/刷新后恢复；Agent 实现位于后端仓库
- **消息通知** — 非实时站内消息（`GET /api/v1/messages/received`）。组件 `components/toolbar/ToolbarNotifications.vue` 已实现，但当前未挂载到布局，UI 上暂不可见
- **合同与支付** — 在线签约（`POST /leases`）→ `POST /payments/pay` 整页跳转支付网关；另有本地模拟支付（`POST /payments/{id}/mock-confirm`）
- **管理后台** — 用户管理（`/admin`，AdminUsersPage）

## 构建优化

- **Chunk 拆分**: `manualChunks` 将 vuetify 与 Vue 全家桶（vue + vue-router + pinia）拆成两个独立 chunk，代码更新不影响框架缓存。干净构建下 `vuetify-*.js` 约 50 kB（gzip 约 19 kB）、`framework-*.js` 约 100 kB；按需引入的 Vuetify 组件主体与其余依赖落在 `index-*.js`，约 490 kB（gzip 约 160 kB）
- **静态资源强缓存**: Nginx `expires 1y` + `Cache-Control: public, immutable`，Vite 生成 content-hash 文件名
- **Gzip 压缩**: 启用 `gzip_vary`、`gzip_proxied`、`gzip_comp_level 6`
- **API 路由合并**: Nginx 仅保留 4 个 location（/api/v1、/images、静态资源正则、SPA 回退）

## 可选的本机 Nginx 部署

`npm run build` 生成 `dist/` 后，可以自行把静态文件目录配置给本机 Nginx。
仓库中的 `nginx.conf` 提供了 SPA 回退、静态资源缓存和 SSE 反向代理示例；使用前请按
本机 Nginx 安装目录调整 `root`，并确保 FastAPI 监听 `127.0.0.1:8000`。
