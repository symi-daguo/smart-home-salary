---
name: member_technician
description: MEMBER 技术岗消息交互。只允许在当前租户下上报与查询“自己的”安装/调试/售后记录（/installation-records/my）。
tags:
  - member
  - installation
  - my
---

# MEMBER 技术岗 Skill（member-technician）

## 适用角色

- 本系统 RBAC 角色：`MEMBER`
- 权限依赖：`installation.create`、`installation.read`、`projects.read`、`products.read`

## 允许调用的后端接口（必须严格遵守）

- `POST /api/installation-records/my`（上报自己的安装/调试/售后记录）
- `GET /api/installation-records/my`（查询自己的技术记录；服务端返回全部记录，按 occurredAt 在客户端筛选月份）
- `GET /api/projects`（用于项目名称补全与校验）
- `GET /api/products`（用于商品名称补全与校验）

禁止行为：

- 不得查询或返回其他员工的技术记录
- 不得调用任何管理类接口（例如 `entries.manage`）

## 数据落库与多端一致性（必须理解）

- 本 Skill 的“上报安装/调试/售后”最终调用 `POST /api/installation-records/my`，服务端会把数据写入数据库（带 `tenantId`，且自动绑定到当前员工身份）。
- **数据可见性**：
  - Web 管理后台（OWNER/ADMIN）：对应板块为“业务上报 → 技术上报（/installation-records）”，可以看到该员工通过智能体提交的记录，并可按权限进行编辑/删除。
  - 未来 iOS 员工端：复用同一套 `/api/installation-records/my` 与查询接口后，会自动显示同一份数据（同库同表，不需要额外同步）。
- 因此：**智能体提交的表单会直接参与技术费计算与预警比对**。

## 输入示例（自然语言）

- “上报安装 万科城一期 智能开关 10个”
- “上报调试 万科城一期 中央空调 2个 难度 1.2”
- “查询我的技术 2026-03”

## 参数解析约定

上报技术记录解析为：

- `projectName`：字符串（来自用户口语/语音）
- `productName`：字符串（来自用户口语/语音）
- `serviceType`：`INSTALL` / `DEBUG` / `AFTER_SALES`
- `quantity`：整数
- `difficultyFactor`：可选（默认 1.0）
- `description`：可选
- `occurredAt`：可选（默认当前时间）

### 必须的最小确认与消歧（减少追问、避免填错）

由于后端真实 DTO 使用 `projectId`、`productId`，Skill 必须先做“最小确认”：

1. 调用 `GET /api/projects` 获取项目列表，用 `projectName` 模糊匹配并按“候选<=3 回序号确认”的策略拿到 `projectId`。
2. 调用 `GET /api/products` 获取商品列表，用 `productName` 模糊匹配并按同样策略拿到 `productId`：
   - 如果 `productName` 是行业俗称（例如“门锁/指纹锁/密码锁”），先参考 `taxonomy-smart-home` 的词典归一化为更稳定的关键词，再做匹配。
3. 得到 `projectId`、`productId` 后，再调用 `POST /api/installation-records/my` 创建记录（请求体必须使用 ID）。

### 提交前强制二次确认（避免误填）

在真正调用 `POST /api/installation-records/my` 之前，必须先向员工输出一段“表单摘要”并等待确认：

- 摘要必须包含：项目、商品、类型（安装/调试/售后）、数量、难度系数（若有）、发生时间（若有）、说明（若有）
- 要求员工回复关键字：**“确认”** 才允许提交
- 若员工回复“取消/不对/重填”，则不提交，并提示员工重新描述或修改字段

最终提交给后端的请求体（字段名以 API 为准）：

- `projectId`
- `productId`
- `serviceType`
- `quantity`
- 可选：`difficultyFactor`、`description`、`occurredAt`

月份过滤解析为：

- `yearMonth`：`YYYY-MM`（缺省为当前月）

## 输出要求（无 emoji）

- 成功：返回“记录已创建/已查询”的简短确认，并回显关键字段
- 失败：返回“上报失败/查询失败：<message>”

