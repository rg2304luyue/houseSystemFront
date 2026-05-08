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
| AI/LLM       | OpenAI SDK (兼容接口)                       |
| CSS          | Sass + Tailwind CSS                        |
| 测试         | Vitest + Vue Test Utils                   |

## 项目结构

```
houseSystemFront-Ylfmoonn/
├── index.html                   # HTML 入口
├── .env.example                 # 环境变量模板
├── package.json                 # 依赖与脚本
├── vite.config.ts               # Vite 构建配置（含开发代理）
├── tsconfig.json                # TypeScript 配置
├── Dockerfile                   # 多阶段构建（Node → Nginx）
├── nginx.conf                   # Nginx 反向代理配置（生产环境）
│
├── public/                      # 静态资源（favicon、Live2D 模型等）
│
├── src/
│   ├── main.ts                  # 应用入口
│   ├── App.vue                  # 根组件（动态布局切换）
│   │
│   ├── api/                     # API 请求层
│   │   ├── client.ts            # 统一 Axios 实例（自动附加 JWT Token）
│   │   ├── houseApi.ts          # 房源相关 API
│   │   ├── aiApi.ts             # AI / ChatGPT API
│   │   ├── githubApi.ts         # GitHub API
│   │   ├── midJourneyApi.ts     # MidJourney 绘图 API
│   │   └── stableDiffusionApi.ts # Stable Diffusion API
│   │
│   ├── stores/                  # Pinia 状态管理（7 个 Store）
│   │   ├── authStore.ts         # 认证 + Token 管理（登录/注册/登出）
│   │   ├── customizeTheme.ts    # 主题 / 侧边栏 / 语言设置
│   │   ├── profileStore.ts      # 用户资料（从后端获取）
│   │   ├── cartStore.ts         # 购物车
│   │   ├── chatGPTStore.ts      # OpenAI API 配置
│   │   ├── snackbarStore.ts     # 全局消息提示
│   │   ├── speechStore.ts       # 语音识别/合成
│   │   ├── fixCardStore.ts      # 维修申报卡片状态
│   │   └── stableDiffusionStore.ts # SD 绘图状态
│   │
│   ├── router/                  # 路由配置
│   │   ├── index.ts             # 主路由（30+ 路由，全部懒加载）
│   │   ├── auth.routes.ts       # 认证路由
│   │   └── landing.routes.ts    # Landing 路由
│   │
│   ├── views/                   # 页面组件（扁平化，无嵌套）
│   │   ├── DashboardPage.vue    # 首页仪表盘
│   │   ├── HouseListPage.vue    # 房源搜索列表
│   │   ├── HouseDetailPage.vue  # 房源详情
│   │   ├── ProfilePage.vue      # 个人资料
│   │   ├── ChatBotPage.vue      # AI 选购顾问
│   │   ├── ChatPage.vue         # 即时通讯
│   │   ├── ContractPage.vue     # 合同管理
│   │   ├── PricingPage.vue      # 支付页面
│   │   ├── PaymentResultPage.vue # 支付结果
│   │   ├── LandlordPropertiesPage.vue # 房东房源管理
│   │   ├── UploadHousePage.vue  # 发布房源
│   │   ├── UpdateHousePage.vue  # 编辑房源
│   │   ├── MyHousePage.vue      # 我的房源
│   │   ├── AdminPanelPage.vue   # 管理员面板
│   │   ├── UserManagePage.vue   # 用户管理
│   │   ├── NewsManagerPage.vue  # 新闻管理
│   │   ├── NewsEditorPage.vue   # 富文本编辑器
│   │   ├── NewsListPage.vue     # 新闻列表
│   │   ├── NewsDetailPage.vue   # 新闻详情
│   │   ├── ImageBotPage.vue     # AI 绘图
│   │   ├── TextToImagePage.vue  # 文生图
│   │   ├── ImageToImagePage.vue # 图生图
│   │   ├── SigninPage.vue       # 登录
│   │   ├── SignupPage.vue       # 注册
│   │   ├── NotFoundPage.vue     # 404
│   │   └── ...                  # 等
│   │
│   ├── components/              # 公共组件（~70 个，按功能分类）
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
│   ├── plugins/                 # 插件初始化
│   │   ├── vuetify.ts           # Vuetify 主题配置
│   │   ├── echarts.ts           # ECharts 注册
│   │   ├── i18n.ts              # 国际化
│   │   └── plantuml.ts          # PlantUML
│   │
│   ├── layouts/                 # 布局组件
│   │   ├── LandingLayout.vue    # 主应用布局（顶栏 + 侧边栏）
│   │   ├── AuthLayout.vue       # 认证页布局
│   │   ├── UILayout.vue         # UI 展示布局
│   │   └── DefaultLayout.vue    # 默认布局
│   │
│   ├── locales/                 # 国际化语言文件
│   │   ├── en.ts                # 英文
│   │   ├── zhHans.ts            # 简体中文
│   │   └── ja.ts                # 日文
│   │
│   ├── configs/                 # 应用配置
│   │   ├── index.ts             # 全局配置
│   │   ├── navigation.ts        # 主导航菜单
│   │   ├── currencies.ts        # 货币配置
│   │   └── locales.ts           # 语言配置
│   │
│   ├── styles/                  # 全局样式
│   │   ├── main.scss            # SCSS 入口
│   │   └── variables.scss       # Vuetify 变量覆盖
│   │
│   ├── types/                   # TypeScript 类型定义
│   ├── utils/                   # 工具函数
│   ├── data/                    # 静态/模拟数据
│   └── assets/                  # 图片等静态资源
│
├── dist/                        # 构建产物
└── node_modules/                # 依赖
```

## 快速开始

### 前置要求

- Node.js 18+
- 后端服务已启动（默认 `http://localhost:5000`）

### 1. 环境配置

```bash
# 复制环境变量模板，按需修改
cp .env.example .env
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
# 启动在 http://localhost:4399
```

### 4. 构建生产版本

```bash
npm run build
# 产物输出到 dist/ 目录
```

## API 代理配置

开发环境下，Vite 自动将 API 请求代理到 Flask 后端。代理规则在 [vite.config.ts](vite.config.ts) 中配置，以下路径均转发至 `http://localhost:5000`：

| 前端路径       | 说明          |
| -------------- | ------------- |
| `/user`        | 用户模块       |
| `/houseinfo`   | 房源信息       |
| `/chat-ai`     | AI 对话        |
| `/comments`    | 评论          |
| `/news`        | 新闻          |
| `/contracts`   | 合同          |
| `/appointments`| 看房预约       |
| `/repaires`    | 维修投诉       |
| `/messages`    | 即时通讯       |
| `/rental`      | 租房记录       |
| `/housedetail` | 房源详情       |
| `/admin`       | 管理日志       |
| `/github`      | GitHub OAuth  |
| `/email-auth`  | 邮箱验证       |
| `/sms`         | 短信          |
| `/alipay`      | 支付宝支付     |
| `/socket.io`   | 实时通讯 (WS)  |
| `/sdApi`       | Stable Diffusion |

生产环境（Docker）下由 Nginx 处理代理，见 [nginx.conf](nginx.conf)。

## 页面路由

| 路径                     | 页面           | 说明             |
| ------------------------ | -------------- | ---------------- |
| `/dashboard`             | 首页仪表盘     | 热门房源/最新房源  |
| `/houseList`             | 房源列表       | 多条件筛选搜索     |
| `/house/:id`             | 房源详情       | 图片/设施/地图/评论 |
| `/house`                 | 房源详情       | 默认房源展示       |
| `/ai/chatbot_v1`         | AI 选购顾问    | 对话式房源推荐     |
| `/image-bot`             | AI 绘图        | SD 文生图/图生图   |
| `/news`                  | 新闻管理       | 房产新闻管理       |
| `/newsList`              | 新闻列表       | 新闻浏览/编辑      |
| `/newsDetail/:id`        | 新闻详情       | 新闻正文          |
| `/newsEditor`            | 富文本编辑器   | 发布新闻          |
| `/chat`                  | 即时通讯       | 租客-房东对话      |
| `/contract`              | 合同管理       | 创建/查看合同      |
| `/RentHouse`             | 我的租房       | 租客租房记录       |
| `/profile`               | 个人资料       | 用户信息/头像编辑   |
| `/setpassword`           | 重置密码       | 邮箱验证码修改密码 |
| `/payPay`                | 支付页面       | 租金支付          |
| `/alipay/payment-result` | 支付结果       | 支付宝回调结果     |
| `/landlord`              | 房源管理       | 房东房源管理表格   |
| `/landlordUpload`        | 发布房源       | 房东创建新房源     |
| `/landlordUpdate/:id`    | 编辑房源       | 房东修改房源       |
| `/myHouse`               | 我的房源       | 房东查看/管理房源  |
| `/admin`                 | 管理员面板     | 数据统计/图表      |
| `/userManage`            | 用户管理       | 管理员管理用户     |
| `/auth/signin`           | 登录           | 手机/邮箱/验证码   |
| `/auth/signup`           | 注册           | 创建新账号        |
| `/ui/lottie-animation`   | 动画展示       | UI 组件展示       |

## 状态管理

| Store                 | 用途                         |
| --------------------- | ---------------------------- |
| `authStore`           | 认证 + JWT Token，登录/注册/登出 |
| `customizeTheme`      | 主题 / 侧边栏 / 语言 / 暗色模式 |
| `profileStore`        | 用户资料（后端获取，无硬编码默认值） |
| `cartStore`           | 购物车（收藏/对比房源）         |
| `chatGPTStore`        | OpenAI API 密钥和模型配置      |
| `snackbarStore`       | 全局消息提示                  |
| `speechStore`         | Azure 语音识别/合成           |
| `fixCardStore`        | 维修申报卡片状态               |
| `stableDiffusionStore`| SD 绘图配置和生成历史          |

> 已精简：原 12 个 Store 合并为 9 个。`token.ts` 合并到 `authStore.ts`，`appStore.ts` 合并到 `customizeTheme.ts`，`layoutStore.ts` 为死代码已删除。

## 主要功能

- **用户系统** — 手机/邮箱/GitHub OAuth 登录，头像裁剪上传
- **房源浏览** — 多条件筛选、分页、浏览量排行
- **AI 选房** — 通义千问 ReAct Agent，SSE 流式对话
- **即时通讯** — Socket.IO 实时聊天，租客-房东对话频道
- **合同与支付** — 在线签约，支付宝沙箱支付
- **管理后台** — ECharts 图表统计，用户管理，新闻管理

## Docker 部署

```bash
docker build -t house-frontend .
docker run -d -p 80:80 house-frontend
```

多阶段构建：Node 18 构建 → Nginx 提供静态文件并反向代理 API。
