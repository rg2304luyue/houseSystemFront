# 前后端只读审查待办

- [x] 确认前端与同级 Python 后端项目范围。
- [x] 审查前端路由、鉴权、状态和关键房源/合同流程。
- [x] 审查后端 API、鉴权、数据一致性和关键业务流程。
- [x] 由两个独立子代理交叉复核前后端契约问题。

## P0：先修复（越权、账户与支付风险）

- [ ] 为所有写接口补上 JWT 鉴权、角色检查和资源归属检查；服务端只从 token 取得当前用户。当前用户资料/密码、房源、详情、合同、预约、评论、消息和支付等接口存在未鉴权或信任 body 中 id/name 的情形。
- [ ] 重做密码找回：验证码不得返回给客户端；服务端须校验验证码、用途、过期时间和一次性消费，再允许修改该账户密码。
- [ ] 修复支付链路：创建支付必须由服务端订单决定金额；回调须验签、检查交易状态/金额/商户/订单并幂等更新订单。
- [ ] 修复 GitHub OAuth：生产环境禁用 `OAUTHLIB_INSECURE_TRANSPORT`，使用并验证 state，限制 next 跳转目标，避免在 URL 查询参数传 JWT。

## P1：业务功能与前后端契约

- [ ] 对齐房源发布/编辑接口。前端调用 `/oss/upload_property_detail_images`、`/houseinfo/create_full_listing`、`/houseinfo/:id/full_update`，当前后端未注册这些路由；后端仅有分离的 `/houseinfo/` 与 `/housedetail/` 接口，且图片上传尚未实现。应设计并实现一个具事务性的发布/编辑契约，或将前端改为已有 API。
- [ ] 统一房源主键和归属查询。`LandlordPropertiesPage` 全量拉取房源并把 `house_num` 用作更新 URL，后端 PUT/DELETE 实际按 `HouseInfo.id` 查询；删除还只删除前端数组。改为由 JWT 推导“我的房源”、使用 `id`，并实际调用受保护的 DELETE。
- [ ] 为前端路由添加全局认证/角色守卫。`requiresAuth` 目前只有元数据；`/admin`、`/userManage`、房东页面等可直接访问。前端守卫只改善体验，不能代替后端授权。
- [ ] 统一使用 `src/api/client.ts` 请求业务 API，避免原生 axios/fetch 绕过 Bearer token。发布、编辑、用户资料、合同、租房记录等路径目前均有此问题。
- [ ] 修复合同创建的原子性与字段定义：必填字段清单缺少 service 使用的 `houseid`；合同 service 已提交后才创建租赁记录，失败时会留下孤立合同。将两次写入放入同一事务，并由服务端根据房源和 token 确定房东/租客。
- [ ] 修复租房查询的关联条件：`rental.py` 将 `house_id` 传给按 `Contract.landlordId` 查询的 service，房源 ID 和房东 ID 混用，可能查错或直接失败。
- [ ] 修复评论路由冲突：两个 `GET /comments/<int:...>` 规则不可区分，按评论 ID 的处理器不可达且把单对象当成列表处理。为评论详情使用不同路径，并补测试。
- [ ] 修复注册失败状态：注册 action 吞掉异常，注册页未 await/未 finally，失败后提交按钮可能永久 loading/禁用。

## P2：稳定性与防护

- [ ] 限制房源列表 page/per_page，并在数据库侧分页，避免宽查询后内存分页与超大请求。
- [ ] 房源列表请求不要把服务端/网络失败伪装成空列表；展示错误态并避免筛选变更触发的重复请求和响应乱序。
- [ ] 收紧 CORS/Socket.IO 的生产 origins，避免 `*` 与凭据组合；补充输入校验、上传大小/MIME 校验与接口级限流。

## Review

两名独立子代理已交叉复核。确认了房源发布/编辑 URL 在当前后端不存在、`house_num` 与后端 `id` 主键错配、合同 `houseid`/事务问题，以及前端路由元数据未被守卫执行。本轮未修改任何业务代码。

## 实施记录（2026-07-16）

- [x] 前端增加认证与角色路由守卫，并调整 Pinia 安装顺序。
- [x] 前端发布改为现有的两步接口：`POST /houseinfo/` 后 `POST /housedetail/`；编辑改为基础字段 `PUT /houseinfo/:id`。
- [x] 前端房东管理改用主键 `id`、真实 DELETE、JSON 请求与现有房东查询接口；上下架改用 `available` 字段。
- [x] 修复注册失败时 loading/禁用状态不能恢复的问题。
- [ ] 后端核心修复未能写入：`D:\HuaweiMoveData\Users\陆\Desktop\houseSystemBack-Lu_New_back` 不在本任务的可写范围。待授予写权限后，优先落实 JWT/归属校验、密码找回、合同事务、评论路由及后端 `mine` 接口。

### 实施复审

独立子代理已复审前端修改，并发现/确认了房东查询、JSON 请求和 `available` 路径的契约问题；这些问题已在本轮前端补丁中修正。`git diff --check` 与 `npx tsc --noEmit` 通过。`npm run build` 已启动转换但未产生完整结束输出，未将其视为构建通过。
