# FocusTime_Admin · 专注时光管理后台

独立的 React 管理后台。「数据概览」「用户管理」「订单管理」及付费「套餐管理」读取 FocusTime_Server，其他管理页面继续使用各自的现有数据来源。

## 本地启动

使用 Node.js 22.13+（或较新的 LTS 版本）与 pnpm：

```sh
pnpm install
pnpm dev
```

打开终端打印的本地地址（默认 `http://localhost:5173`）。`pnpm build` 执行 TypeScript 检查并生成静态产物 `dist/`，`pnpm preview` 可预览构建结果。

## 管理员登录与数据概览

1. 在 FocusTime_Server 的运行环境中设置 `AdminOverview__UserIds__0` 为获准查看数据的现有账号 ID（GUID）。多个账号使用 `__1`、`__2` 等。启动或重启后端；未配置名单时，所有账号均无权限。无需修改数据库。
2. Vite 默认将 `/api/v1/admin/` 代理到 `http://127.0.0.1:5080`。如后端地址不同，在前端 `.env.local` 设置 `FOCUSTIME_API_TARGET` 并重启 Vite。正式部署时，通过后台站点的同源 HTTPS 反向代理转发 `/api/v1/admin/`，并将页面路由回退到 `index.html`。
3. 在 `/login` 用获授权账号的邮箱和密码登录。会话由服务器签发为 HttpOnly Cookie，有效期为 8 小时，刷新页面会重新向服务器验证会话。

右上角账号菜单提供「修改密码」和「退出登录」。密码修改调用 `POST /api/v1/admin/password`，由现有 Identity 验证当前密码并执行密码策略（8–128 位，包含字母和数字）。成功后撤销该账号的所有旧会话和密码恢复凭证，需使用新密码重新登录；退出登录只撤销当前管理员会话。

部署此功能前，在后端正常迁移流程中应用 `20261105065917_AdminPasswordSecurityAudit`。变更结果在同一事务内写入 `identity.admin_security_audit`，只记录管理员 ID、时间、操作、来源、结果及错误代码，不记录密码、哈希或令牌。操作日志页面继续使用现有数据来源，本次未改动其查询逻辑。

`GET /api/v1/admin/overview?days=7|30|90` 要求管理员权限。日期按北京时间计算，范围包含今天；新增会员按用户首次生效的授权计算，续费不重复计入。有效会员为已经开始、未撤销、未到期的授权用户，每人只计一次，套餐以永久会员优先、其余取到期最晚的有效授权。目前没有独立体验套餐类型。订单沿用后端状态，未支付且超时显示「已过期」。订单编号使用后端订单 ID；用户没有头像时使用默认占位。

## 真实订单管理

订单列表、统计、搜索、筛选、分页、详情、处理日志及 CSV 导出均读取 `/api/v1/admin/orders`，复用已有管理员 Cookie 和权限白名单。页面每 15 秒及重新获得焦点时刷新；失败时显示错误，不回退到演示数据。价格、支付和开通结果以服务器订单为准，年套餐标识与后端统一为 `annual`。

管理员可在异常订单中调用 `POST /api/v1/admin/orders/{id}/retry-activation` 重试开通，要求 `X-FocusTime-Admin: 1`。只有后端确认开通成功，订单才移出异常列表；不再提供仅在浏览器「标记处理」的模拟操作。部署前需应用后端 `20261105123719_OrderFulfillment` 迁移。官网、后台与 Windows 客户端应使用同一 API；当前本机官网和后台均连接 `http://127.0.0.1:5082`。

## 真实用户管理

`GET /api/v1/admin/users` 与 `GET /api/v1/admin/users/{guid}` 复用管理员认证，提供只读统计、搜索、筛选、分页和详情，不需要新增数据库字段或迁移。支持 `query`（用户 GUID 或邮箱，忽略大小写的字面量包含匹配）、`membership=all|member|nonMember`、`account=all|active|disabled|deleted|locked`、`registration=all|today|week|month|quarter`、`quick=all|members|today|inactive`、`page`、`pageSize`（最多 100）。默认按注册时间倒序及用户 ID 倒序稳定分页，所有筛选在数据库中相交执行，统计卡片始终统计全部现存账号。

日期按北京时间的自然日计算。有效会员沿用会员服务的条件：已开始、未撤销且未到期；重复授权每人只计一次，永久优先，否则选择到期最晚的有效套餐。最近登录取该账号留存登录会话的最大创建时间，不能用最近活动时间替代；没有留存会话时显示「—」。

当前账号模型只有 Identity 锁定信息：启用锁定且 `LockoutEnd=+infinity` 表示永久禁用；有限未来截止时间单独显示「暂时锁定」，不计入已停用。数据库没有注销状态字段或留存注销账号模型，`deleted` 筛选不会推测或恢复已删除记录。后续若加入账号注销机制，应在此只读查询中接入其合法留存状态。页面不再保留本地模拟账号状态修改；真实禁用/恢复接口尚未开放，菜单对应入口不可用。

## 页面代码

- `src/components/layout`：管理后台的导航和顶部区域。
- `src/components/ui`：shadcn/ui 风格的卡片、按钮、表格、徽章和头像组件。
- `src/features/overview`：数据概览、统计卡、Recharts 图表和最近活动列表。
- `src/features/auth`：管理员登录页面、会话和路由保护。

时间范围支持近 7、30、90 天，趋势图支持悬停查看每日数据。「查看更多」分别跳转到订单管理、用户管理。


## 真实付费套餐管理

套餐列表读取 `GET /api/v1/admin/membership-plans`，现有编辑和确认弹窗通过 `PUT /api/v1/admin/membership-plans/{id}` 保存价格、有效期、推荐和上架状态。使用现有管理员 Cookie/白名单和 `X-FocusTime-Admin: 1` 写入头。金额转换为整数分，时间由服务器返回；保存失败保持弹窗并提示错误。

套餐 ID 为 `monthly`、`annual`、`lifetime`。更新携带 `expectedVersion`，旧版本返回冲突，需关闭弹窗并刷新列表后重试。价格与期限变化只影响新订单，不改变历史订单和已经授予的会员权益。免费体验规则区域沿用原有逻辑，本次未接入服务器。

后端需应用 `20261105143836_MembershipPlans` 迁移；数据库同时作为官网价格和新订单计价的唯一来源。当前官网 `http://127.0.0.1:5175/membership/`、后台 `http://127.0.0.1:5181/plans` 均连接 `5082`，价格调整不需要重新部署官网。实际验证见后端 `docs/MEMBERSHIP_PLANS_VALIDATION.md`。
