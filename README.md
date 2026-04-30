# 房屋租赁系统 - 前端

基于 **Vue 3 + Vuetify 3 + Vite** 的房屋租赁系统前端，提供房源浏览、AI选房、在线签约、即时通讯、支付宝支付等功能。

## 技术栈

| 类别         | 技术                                      |
| ------------ | ----------------------------------------- |
| 框架         | Vue 3 (Composition API + `<script setup>`) |
| UI 框架      | Vuetify 3 + Element Plus                  |
| 构建工具     | Vite 4                                    |
| 语言         | TypeScript                                |
| 状态管理     | Pinia (持久化插件)                          |
| 路由         | Vue Router 4                              |
| HTTP 客户端  | Axios                                     |
| 图表         | ECharts 5 + vue-echarts + ApexCharts      |
| 富文本编辑器 | Tiptap + vue-quill + md-editor-v3         |
| 实时通讯     | Socket.IO Client                          |
| 国际化       | vue-i18n                                  |
| AI/LLM       | OpenAI SDK (兼容接口)                       |
| 语音         | Microsoft Cognitive Services Speech SDK   |
| 2D 角色      | Live2D                                    |
| 样式         | Sass + Tailwind CSS                        |
| 测试         | Vitest + Vue Test Utils                   |

## 项目结构

```
houseSystemFront-Ylfmoonn/
├── index.html                   # HTML 入口
├── package.json                 # 依赖与脚本
├── vite.config.ts               # Vite 构建配置（含开发代理）
├── tsconfig.json                # TypeScript 配置
├── auto-imports.d.ts            # 自动导入类型声明
├── Dockerfile                   # Docker 镜像构建
├── nginx.conf                   # Nginx 反向代理配置（生产环境）
│
├── public/                      # 静态资源
│
├── src/
│   ├── main.ts                  # 应用入口（注册插件/路由/状态管理）
│   ├── App.vue                  # 根组件
│   │
│   ├── api/                     # API 请求层
│   │   ├── client.ts            # Axios 实例（自动附加 token）
│   │   ├── houseApi.ts          # 房源相关 API
│   │   ├── aiApi.ts             # AI/ChatGPT API
│   │   ├── githubApi.ts         # GitHub API
│   │   ├── midJourneyApi.ts     # MidJourney 绘图 API
│   │   └── stableDiffusionApi.ts # Stable Diffusion API
│   │
│   ├── components/              # 公共组件
│   │   ├── dashboard/           # 首页仪表盘组件
│   │   │   ├── BannerPage.vue   # 横幅轮播
│   │   │   ├── HouseCard.vue    # 房源卡片
│   │   │   ├── NewHouseList.vue # 最新房源列表
│   │   │   ├── SecondHandHouse.vue # 二手房源
│   │   │   └── CityCard.vue     # 城市选择卡片
│   │   │
│   │   ├── HouseList/           # 房源列表组件
│   │   │   └── HouseList.vue    # 房源搜索与筛选
│   │   │
│   │   ├── houseDetail/         # 房源详情组件
│   │   │   ├── Feature5.vue     # 房源特色
│   │   │   ├── HouseFacilities.vue # 房屋设施
│   │   │   ├── Map.vue          # 地图组件
│   │   │   ├── MaptoolBar.vue   # 地图工具栏
│   │   │   ├── News.vue         # 周边新闻
│   │   │   └── Newsletter2.vue  # 订阅组件
│   │   │
│   │   ├── navigation/          # 导航组件
│   │   │   ├── MainMenu.vue     # 主菜单
│   │   │   └── MainSidebar.vue  # 侧边栏
│   │   │
│   │   ├── toolbar/             # 顶部工具栏组件
│   │   │   ├── MainAppbar.vue   # 顶栏主组件
│   │   │   ├── ToolbarUser.vue  # 用户菜单
│   │   │   ├── ToolbarNotifications.vue # 通知
│   │   │   ├── StatusMenu.vue   # 状态菜单
│   │   │   ├── ThemeToggle.vue  # 主题切换
│   │   │   └── LanguageSwitcher.vue # 语言切换
│   │   │
│   │   ├── Administrator/       # 管理后台组件
│   │   │   ├── BarChart1.vue    # 柱状图
│   │   │   ├── PieChart1.vue    # 饼图
│   │   │   ├── SalesCard.vue    # 销售统计卡片
│   │   │   ├── TableCard.vue    # 数据表格
│   │   │   ├── TrackCard.vue    # 追踪卡片
│   │   │   └── ...
│   │   │
│   │   ├── ai/                  # AI 功能组件
│   │   │   ├── ChatAssistant.vue # AI 聊天助手
│   │   │   └── TranslationAssistant.vue # 翻译助手
│   │   │
│   │   ├── pricing/             # 定价/支付组件
│   │   ├── footer/              # 页脚组件
│   │   ├── animations/          # 动画组件
│   │   ├── common/              # 通用小组件
│   │   │   ├── BackToTop.vue    # 回到顶部
│   │   │   ├── CopyBtn.vue      # 复制按钮
│   │   │   ├── Snackbar.vue     # 消息提示
│   │   │   └── PercentTrend.vue # 百分比趋势
│   │   │
│   │   ├── User/                # 用户相关组件
│   │   │   └── AvatarCropper.vue # 头像裁剪
│   │   │
│   │   ├── ApiKeyDialog.vue     # API Key 配置弹窗
│   │   ├── CustomizationMenu.vue # 自定义主题菜单
│   │   ├── GlobalLoading.vue    # 全局加载
│   │   ├── Live2d.vue          # Live2D 看板娘
│   │   ├── ImagePreview.vue    # 图片预览
│   │   ├── Toolbox.vue         # 工具箱
│   │   ├── RepaireCard.vue     # 维修申报卡片
│   │   ├── RepaireContract.vue # 维修合同
│   │   ├── contractmod.vue     # 合同弹窗
│   │   ├── HouseRentContract.vue # 租房合同
│   │   └── SecondHandHouse.vue # 二手交易
│   │
│   ├── views/                   # 页面级组件
│   │   ├── pages/               # 主要页面
│   │   │   ├── DashBoard.vue    # 首页仪表盘
│   │   │   ├── HouseListPage.vue # 房源列表页
│   │   │   ├── ProcuctPage.vue  # 房源详情页
│   │   │   ├── ProfilePage.vue  # 个人资料页
│   │   │   ├── PricingPage.vue  # 支付页
│   │   │   ├── PaymentResult.vue # 支付结果页
│   │   │   ├── NewsPage.vue     # 新闻资讯页
│   │   │   ├── chatpage.vue     # 即时通讯页
│   │   │   ├── contractpage.vue # 合同页
│   │   │   ├── AccountRentHouse.vue # 我的租房
│   │   │   ├── ResetPassword.vue # 重置密码
│   │   │   ├── LandlordProperties.vue # 房东房源管理
│   │   │   ├── ImageBot.vue     # AI 绘图机器人
│   │   │   ├── TestIndexPage.vue # 测试页面1
│   │   │   ├── TestManagePage.vue # 测试管理页
│   │   │   ├── TestManagePage2.vue # 测试管理页2
│   │   │   ├── Admin/
│   │   │   │   ├── AdministratorPanel.vue # 管理员面板
│   │   │   │   └── UserManagePage.vue    # 用户管理页
│   │   │   ├── News/
│   │   │   │   └── editor/
│   │   │   │       ├── RichTextEditorPage.vue # 富文本编辑器
│   │   │   │       ├── NewsListPage.vue      # 新闻列表
│   │   │   │       └── NewsDetailPage.vue    # 新闻详情
│   │   │   └── landlord/
│   │   │       ├── uploadHousePage.vue # 发布房源
│   │   │       ├── updateHousePage.vue # 编辑房源
│   │   │       └── MyHouse.vue         # 我的房源
│   │   │
│   │   ├── chatgpt/
│   │   │   └── ChatBotV1.vue    # AI 选购顾问（核心对话页面）
│   │   │
│   │   ├── auth/                # 认证相关页面
│   │   ├── errors/              # 错误页面（404等）
│   │   ├── landing/             # 落地页
│   │   └── ui/                  # UI 展示页
│   │
│   ├── stores/                  # Pinia 状态管理
│   │   ├── authStore.ts         # 认证状态（登录/注册/登出）
│   │   ├── appStore.ts          # 全局应用状态
│   │   ├── profileStore.ts      # 用户资料状态
│   │   ├── cartStore.ts         # 购物车状态
│   │   ├── chatGPTStore.ts      # ChatGPT 配置状态
│   │   ├── speechStore.ts       # 语音识别状态
│   │   ├── snackbarStore.ts     # 全局消息提示状态
│   │   ├── layoutStore.ts       # 布局状态
│   │   ├── customizeTheme.ts    # 主题自定义状态
│   │   ├── fixCardStore.ts      # 维修卡片状态
│   │   ├── stableDiffusionStore.ts # SD 绘图状态
│   │   └── token.ts             # Token 持久化存储
│   │
│   ├── router/                  # 路由配置
│   │   ├── index.ts             # 路由主文件（所有路由定义）
│   │   ├── auth.routes.ts       # 认证相关路由
│   │   └── landing.routes.ts    # 落地页路由
│   │
│   ├── configs/                 # 配置文件
│   │   ├── index.ts             # 全局配置
│   │   ├── currencies.ts        # 货币配置
│   │   ├── locales.ts           # 语言配置
│   │   ├── navigation.ts        # 主导航配置
│   │   └── menus/               # 菜单配置
│   │       ├── landing.menu.ts
│   │       ├── pages.menu.ts
│   │       └── ui.menu.ts
│   │
│   ├── plugins/                 # 插件初始化
│   │   ├── vuetify.ts           # Vuetify 配置
│   │   ├── echarts.ts           # ECharts 配置
│   │   ├── i18n.ts              # 国际化配置
│   │   └── plantuml.ts          # PlantUML 配置
│   │
│   ├── locales/                 # 国际化语言文件
│   │   ├── en.ts                # 英文
│   │   ├── zhHans.ts            # 简体中文
│   │   └── ja.ts                # 日文
│   │
│   ├── layouts/                 # 布局组件
│   │   ├── DefaultLayout.vue    # 默认布局
│   │   ├── LandingLayout.vue    # 落地页布局（含顶栏+侧边栏）
│   │   ├── AuthLayout.vue       # 认证页布局
│   │   └── UILayout.vue         # UI 展示布局
│   │
│   ├── data/                    # 静态/模拟数据
│   │   ├── users.ts             # 用户数据
│   │   ├── members.ts           # 成员数据
│   │   ├── logos.ts             # Logo 数据
│   │   └── eagle.ts             # Eagle 数据
│   │
│   ├── types/                   # TypeScript 类型定义
│   ├── utils/                   # 工具函数
│   ├── styles/                  # 全局样式/SCSS 变量
│   ├── assets/                  # 静态资源（图片/字体等）
│   └── test/                    # 测试文件
│
├── assets/                      # 文档用截图资源
├── dist/                        # 构建产物
└── node_modules/                # 依赖
```

## 快速开始

### 前置要求

- Node.js 18+
- 后端服务已启动（默认 `http://localhost:5000`）

### 1. 安装依赖

```bash
cd houseSystemFront-Ylfmoonn
npm install
# 或
yarn install
```

### 2. 启动开发服务器

```bash
npm run dev
# 启动在 http://localhost:4399
```

### 3. 构建生产版本

```bash
npm run build
# 产物输出到 dist/ 目录
```

### 4. 预览生产构建

```bash
npm run preview
```

## 运行测试

```bash
npm run test          # 运行测试
npm run test:ui       # 测试 UI 界面
npm run coverage      # 测试覆盖率
```

## 开发代理配置

开发环境下，Vite 自动将 API 请求代理到 Flask 后端（`localhost:5000`）。代理规则在 [vite.config.ts](vite.config.ts) 中配置：

| 前端路径       | 代理目标               |
| -------------- | ---------------------- |
| `/user`        | `http://localhost:5000` |
| `/houseinfo`   | `http://localhost:5000` |
| `/chat-ai`     | `http://localhost:5000` |
| `/comments`    | `http://localhost:5000` |
| `/news`        | `http://localhost:5000` |
| `/contracts`   | `http://localhost:5000` |
| `/appointments`| `http://localhost:5000` |
| `/repaires`    | `http://localhost:5000` |
| `/messages`    | `http://localhost:5000` |
| `/rental`      | `http://localhost:5000` |
| `/housedetail` | `http://localhost:5000` |
| `/admin/logs`  | `http://localhost:5000` |
| `/github`      | `http://localhost:5000` |
| `/email-auth`  | `http://localhost:5000` |
| `/alipay`      | `http://localhost:5000` |
| `/socket.io`   | `http://localhost:5000` (WebSocket) |
| `/sdApi`       | `http://localhost:5000` (Stable Diffusion) |

生产环境下（Docker），这些代理由 Nginx 处理（见 [nginx.conf](nginx.conf)）。

## 页面路由一览

| 路径                     | 页面           | 说明             |
| ------------------------ | -------------- | ---------------- |
| `/dashboard`             | 首页仪表盘     | 热门房源/最新房源  |
| `/houseList`             | 房源列表       | 多条件筛选搜索     |
| `/house/:id`             | 房源详情       | 图片/设施/地图/评论 |
| `/ai/chatbot_v1`         | AI 选购顾问    | 对话式房源推荐     |
| `/image-bot`             | AI 绘图        | MJ/SD 绘图        |
| `/news`                  | 新闻资讯       | 房产新闻列表       |
| `/newsDetail/:id`        | 新闻详情       | 新闻正文          |
| `/newsEditor`            | 富文本编辑器   | 发布新闻          |
| `/newsList`              | 新闻管理列表   | 编辑/删除新闻      |
| `/chat`                  | 即时通讯       | 租客-房东对话      |
| `/contract`              | 合同页面       | 创建/查看合同      |
| `/RentHouse`             | 我的租房       | 租客的租房记录     |
| `/profile`               | 个人资料       | 用户信息/头像编辑   |
| `/setpassword`           | 重置密码       | 邮箱验证码修改密码 |
| `/payPay`                | 支付页面       | 租金支付          |
| `/alipay/payment-result` | 支付结果       | 支付宝回调结果      |
| `/landlordUpload`        | 发布房源       | 房东创建新房源     |
| `/landlordUpdate/:id`    | 编辑房源       | 房东修改房源       |
| `/myHouse`               | 我的房源       | 房东查看/管理房源  |
| `/landlord`              | 房东房源管理   | 房源状态查看       |
| `/admin`                 | 管理员面板     | 数据统计/图表      |
| `/userManage`            | 用户管理       | 管理员管理用户     |
| `/testIndexPage1`        | 测试页面1      | 开发测试          |
| `/testManagePage`        | 测试管理页     | 开发测试          |
| `/testManagePage2`       | 测试管理页2     | 开发测试          |
| `/ui/lottie-animation`   | Lottie 动画展示 | UI 组件展示       |

## 状态管理概览

| Store               | 用途                         |
| ------------------- | ---------------------------- |
| `authStore`         | 登录/注册/登出，用户认证状态    |
| `profileStore`      | 用户基本资料（姓名/头像等）     |
| `token.ts`          | JWT Token 持久化存储          |
| `appStore`          | 全局应用设置（主题/语言等）     |
| `chatGPTStore`      | OpenAI API 连接配置           |
| `speechStore`       | 语音识别/合成状态              |
| `cartStore`         | 购物车（收藏/对比房源）         |
| `snackbarStore`     | 全局消息提示                  |
| `layoutStore`       | 布局配置（侧边栏/顶栏状态）     |
| `customizeTheme.ts` | 自定义主题样式                |
| `fixCardStore`      | 维修申报卡片状态               |
| `stableDiffusionStore` | AI 绘图配置和生成历史       |

## 主要功能模块

### 1. 用户系统
- 手机号注册/登录
- 邮箱验证码登录
- GitHub OAuth 第三方登录
- 个人资料编辑（含头像裁剪上传）
- 用户类型升级（普通用户→房东）

### 2. 房源浏览
- 多条件筛选（区域/价格/户型/朝向/装修/地铁等）
- 分页加载
- 浏览量排行
- 最新上架推荐
- 房源详情（图片/设施/地图定位）

### 3. AI 智能选房
- 基于通义千问的 ReAct Agent
- 流式 SSE 对话
- 自然语言搜索房源
- 对话历史管理

### 4. 即时通讯
- 基于 Socket.IO 的实时聊天
- 租客-房东对话频道
- 消息持久化

### 5. 合同与支付
- 在线签订租房合同
- 支付宝沙箱支付
- 租房记录管理

### 6. 管理后台
- 房源数据统计图表（ECharts 饼图/柱状图）
- 用户管理
- 日志查看
- 新闻内容管理（富文本编辑器）

## Docker 部署

```bash
docker build -t house-frontend .
docker run -d -p 80:80 house-frontend
```

Nginx 作为静态文件服务器并反向代理 API 请求到后端。
