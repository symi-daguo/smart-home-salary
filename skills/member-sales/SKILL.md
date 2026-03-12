---
name: member_sales
description: MEMBER 销售岗消息交互。只允许在当前租户下上报与查询“自己的”销售订单（/sales-orders/my）。
tags:
  - member
  - sales
  - my
---

# MEMBER 销售岗 Skill（member-sales）

## 适用角色

- 本系统 RBAC 角色：`MEMBER`
- 权限依赖：`sales.create`、`sales.read`、`projects.read`

## 允许调用的后端接口（必须严格遵守）

- `POST /api/sales-orders/my`（上报自己的销售订单）
- `GET /api/sales-orders/my`（查询自己的销售订单；服务端返回全部记录，按 occurredAt 在客户端筛选月份）
- `GET /api/projects`（用于项目名称补全与校验）

禁止行为：

- 不得调用任何需要 `entries.manage` 或 `salary.manage` 的管理接口
- 不得查询或返回其他员工的订单信息

## 数据落库与多端一致性（必须理解）

- 本 Skill 的“上报销售”最终调用 `POST /api/sales-orders/my`，服务端会把数据写入数据库（带 `tenantId`，且自动绑定到当前员工身份）。
- **数据可见性**：
  - Web 管理后台（OWNER/ADMIN）：对应板块为“业务上报 → 销售上报（/sales-orders）”，可以看到该员工通过智能体提交的记录，并可按权限进行编辑/删除/核验。
  - 未来 iOS 员工端：复用同一套 `/api/sales-orders/my` 与查询接口后，会自动显示同一份数据（同库同表，不需要额外同步）。
- 因此：**智能体提交的表单不是“临时消息”，而是系统业务数据的一部分**，会参与工资结算与预警逻辑。

## 输入示例（自然语言）

- “上报销售 万科城一期 50000元 95折”
- “上报销售 万科城一期 50000 9.5折 备注 客户已付款”
- “查询我的销售 2026-03”

## 参数解析约定

上报销售解析为：

- `projectName`：字符串（来自用户口语/语音）
- `amount`：数字（元）
- `discountRate`：0-1（默认 0.95）
- `remark`：可选
- `occurredAt`：可选（默认当前时间）

### 必须的最小确认与消歧（减少追问、避免填错）

由于后端真实 DTO 使用 `projectId`，Skill 必须先做一次“最小确认”：

1. 调用 `GET /api/projects` 获取项目列表（或由实现方做服务端缓存）。
2. 用 `projectName` 进行模糊匹配：
   - 候选 1 个：默认选中该项目；
   - 候选 2-3 个：只把候选按序号列出，让员工回复“1/2/3”确认；
   - 候选过多：要求员工补充一个更具体的关键词（例如项目简称/楼盘期数）。
3. 得到 `projectId` 后，再调用 `POST /api/sales-orders/my` 创建订单（请求体必须使用 `projectId`）。

### 提交前强制二次确认（避免误填）

在真正调用 `POST /api/sales-orders/my` 之前，必须先向员工输出一段“表单摘要”并等待确认：

- 摘要必须包含：项目、金额、折扣、发生时间（若有）、备注（若有）
- 要求员工回复关键字：**“确认”** 才允许提交
- 若员工回复“取消/不对/重填”，则不提交，并提示员工重新描述或修改字段

最终提交给后端的请求体（字段名以 API 为准）：

- `projectId`
- `amount`
- `discountRate`
- 可选：`remark`、`occurredAt`

月份过滤解析为：

- `yearMonth`：`YYYY-MM`（缺省为当前月）

## 输出要求（无 emoji）

- 成功：返回“已创建/已查询”的简短确认，并回显关键字段（项目、金额、折扣、时间）
- 失败：返回“上报失败/查询失败：<message>”

