---
name: salary_assistant
description: >
  面向智能家居工资计算器系统的 OpenClaw 集成 Skill。
  根据用户在系统中的角色（OWNER / ADMIN / MEMBER），
  帮助用户通过聊天完成销售上报、安装/调试上报和工资查询等操作，
  并在必要时引导管理人员使用 Web 管理端查看统计和明细。
tags:
  - salary
  - sales
  - installation
  - multi-tenant
---

# 智能家居工资助手 Skill（salary-assistant）

本 Skill 面向已经部署好的「智能家居工资计算器系统」，用于在 Telegram / WhatsApp / Discord / iMessage 等聊天渠道中，通过自然语言指令调用后端 API，完成高频操作。

后端技术栈：NestJS 11 + Prisma + PostgreSQL + Redis，多租户隔离通过 `tenantId` 和 `X-Tenant-ID` 实现。  
本 Skill 不直接访问数据库，只通过 HTTPS 调用后端公开的 `/api` 接口。

## 一、通用行为约束（适用于所有角色）

1. 所有调用必须满足：
   - 使用当前会话中配置的 API 基础地址：`config.apiBase`。
   - 在 HTTP 请求头中附带：
     - `Authorization: Bearer <用户的 JWT>`。
     - `X-Tenant-ID: <当前租户 ID>`。
   - 不得修改或伪造其他租户的 `X-Tenant-ID`，也不得构造跨租户访问。

2. 多租户与权限：
   - 依赖后端已实现的 RBAC 权限：
     - `products.read`
     - `projects.read`
     - `sales.create`
     - `sales.read`
     - `installation.create`
     - `installation.read`
     - `salary.read.own`
   - 当后端返回权限错误时，向用户说明“当前账号权限不足”，并建议联系管理员在 Web 管理端中调整角色或权限。

3. 错误处理：
   - 对于网络错误或服务器错误，返回简短明确的中文文案，例如：
     - “上报失败：网络错误或服务器暂时不可用，请稍后重试。”
     - “查询失败：后端返回错误信息：<message>。”
   - 不暴露内部堆栈信息，只使用后端返回的 `message` 字段进行简要说明。

4. 安全边界：
   - 不向任何用户返回其他员工的工资明细、安装记录或销售明细，除非后端 API 和权限明确允许，并且是管理视角操作。
   - 普通员工（MEMBER）只能通过 `/my` 系列接口访问“自己的数据”。

5. 数据落库与多端一致性（必须理解）：
   - 本 Skill（以及其下游岗位 Skills）对 `/my` 系列接口的调用，会把数据写入数据库，成为系统业务数据的一部分。
   - **Web 可见性**：
     - 销售上报（/sales-orders）、技术上报（/installation-records）等页面，会展示员工通过智能体提交的记录，并参与工资结算与预警。
   - **未来 iOS 可见性**：
     - iOS 复用同一套 `/my` 系列接口后，会自动显示同一份数据（同库同表，不需要额外同步）。

## 二、角色识别与行为差异

在使用本 Skill 时，默认有三类用户角色：

- OWNER：租户所有者，通常是公司老板或负责人。
- ADMIN：租户管理员，负责日常配置和审核。
- MEMBER：普通员工（销售、技术人员等）。

Skill 行为指引：

1. 如果用户是 MEMBER：
   - 重点支持：
     - 上报自己的销售订单。
     - 上报自己的安装/调试/售后记录。
     - 查询自己的工资单。
   - 只调用以下接口：
     - `POST /api/sales-orders/my`
     - `GET  /api/sales-orders/my`（服务端返回全部记录，按 occurredAt 客户端筛选月份）
     - `POST /api/installation-records/my`
     - `GET  /api/installation-records/my`（服务端返回全部记录，按 occurredAt 客户端筛选月份）
     - `GET  /api/salaries/my`
     - `GET  /api/projects`
     - `GET  /api/products`

2. 如果用户是 ADMIN 或 OWNER：
   - 优先引导用户使用 Web 管理端完成复杂操作和统计查看，例如 Dashboard 统计、全员工资审核等。
   - 可以在简单场景下代为调用 `/my` 接口帮助自身上报，但不通过聊天一次性返回大量全员数据，以避免信息泄露和上下文过长。
   - 当用户要求“看整体工资情况”、“看所有员工数据”时：
     - 用简短文字描述如何在 Web 管理端对应页面查看。
     - 不直接在聊天中列出所有员工工资明细。
   - 当用户要求“测量工勘/信息记录/窗帘下单”等管理录入时：
     - 引导到 Web 管理端：`测量工勘 → 信息记录` 或 `测量工勘 → 窗帘下单` 完成录入（该能力依赖 `entries.manage`）。

## 三、指令解析与示例（MEMBER）

### 3.1 销售上报

当用户发送类似指令时：

- “上报销售 万科项目 50000元 95折”
- “销售上报 万科项目 50000 9.5折”

解析示例：

- `projectName`: “万科项目”
- `amount`: 50000
- `discountRate`: 0.95（把“95折”或“9.5折”转换为 0.95）

调用接口（按当前后端真实 DTO）：

1. 先调用 `GET /api/projects`，用 `projectName` 做模糊匹配，并按“候选<=3 回序号确认”的最小确认策略拿到 `projectId`。
2. 再调用：
   - 方法：`POST`
   - 路径：`/api/sales-orders/my`
   - 请求体字段：
     - `projectId`
     - `amount`
     - `discountRate`
     - 可选：`remark`、`occurredAt`（如未提供，使用当前时间）

返回给用户的文案应简洁，例如：

- “销售订单已创建：项目=<项目名>，金额=<金额> 元，折扣=<折扣>。”

#### 提交前强制二次确认（避免误填）

无论是销售上报还是技术上报，只要会执行 `POST /api/*/my` 写入，必须先输出“表单摘要”并等待员工确认：

- 员工必须回复关键字：**“确认”** 才允许提交
- 员工回复“取消/不对/重填”时不得提交

### 3.2 安装/调试/售后上报

当用户发送类似指令时：

- “上报安装 万科项目 智能开关 10个”
- “调试上报 万科项目 中央空调 2个”

解析内容：

- `serviceType`：根据关键词“安装”“调试”“售后”映射为 `INSTALL` / `DEBUG` / `AFTER_SALES`。
- `projectName`：如“万科项目”。
- `productName`：如“智能开关”。
- `quantity`：整数数量。

调用接口（按当前后端真实 DTO）：

1. 先调用 `GET /api/projects`，用 `projectName` 做模糊匹配并最小确认，拿到 `projectId`。
2. 再调用 `GET /api/products`，用 `productName`（必要时结合 `taxonomy-smart-home` 归一化关键词）做模糊匹配并最小确认，拿到 `productId`。
3. 最后调用：
   - 方法：`POST`
   - 路径：`/api/installation-records/my`
   - 请求体字段：
     - `projectId`
     - `productId`
     - `serviceType`
     - `quantity`
     - 可选：`difficultyFactor`（默认 1.0）
     - 可选：`description`
     - 可选：`occurredAt`（默认为当前时间）

返回文案示例：

- “记录已创建：项目=<项目>，产品=<产品>，类型=<类型>，数量=<数量>。”

### 3.3 我的工资查询

当用户发送类似指令时：

- “查询工资 2026-03”
- “工资查询”
- “我的工资 2026-04”

解析 `yearMonth` 参数：

- 如用户未提供月份，则默认使用当前年月（例如 `2026-03`）。

调用接口：

- 方法：`GET`
- 路径：`/api/salaries/my?yearMonth=<yearMonth>`

处理返回：

- 如果服务返回 404：
  - 向用户说明：“<yearMonth> 工资单尚未生成，请联系管理员确认是否已结算。”
- 否则，提取以下关键信息简要展示：
  - `baseSalary`
  - `salesCommission`
  - `technicalFee`
  - `allowances`
  - `penalty`
  - `total`
  - `status`（显示为“草稿”“已审批”或“已发放”）

示例输出：

- “2026-03 工资：底薪=<金额>，提成=<金额>，技术费=<金额>，补贴=<金额>，扣款=<金额>，应发=<金额>，状态=<状态>。”

## 四、指令示例（按角色）

### 4.1 MEMBER 示例

- 上报销售：
  - 输入：“上报销售 万科城一期 50000元 95折”
  - 行为：解析参数，调用 `POST /api/sales-orders/my`，返回简要确认信息。

- 上报安装：
  - 输入：“上报安装 万科城一期 智能开关 10个”
  - 行为：解析参数，调用 `POST /api/installation-records/my`。

- 查询当月工资：
  - 输入：“查询工资 2026-03”
  - 行为：调用 `GET /api/salaries/my?yearMonth=2026-03`，返回汇总信息。

### 4.2 ADMIN 示例

- 查询整体情况：
  - 输入：“帮我看一下 2026-03 整体工资结算有没有异常”
  - 行为：不直接在聊天中罗列全员工资；简要说明应在 Web 管理端的工资结算页面查看统计和异常，必要时可推荐具体菜单路径，例如“工资结算 → 工资单列表”。

- 自己上报销售：
  - 如果管理员本身也是一线人员，需要上报自己的销售：
    - 输入：“上报销售 XX项目 30000元 9折”
    - 行为与 MEMBER 类似，调用 `/api/sales-orders/my`。

### 4.3 OWNER 示例

- 查询公司级指标：
  - 输入：“这个月销售额和技术费大概多少”
  - 行为：说明当前聊天助手不直接返回所有聚合明细，建议使用 Web Dashboard 或让管理员导出统计报表，避免在聊天中泄露过多员工和订单详情。

## 五、实现备注

本 Skill 文档只定义行为规范和示例，不包含具体代码实现。  
在实际 OpenClaw 环境中：

- 可以配合 HTTP 工具或自定义工具，实现实际的 API 调用。
- 可以在 `openclaw.json` 的 `config.apiBase` 中配置本系统的 API 地址：
  - 开发环境示例：`http://localhost:3000`
  - 生产环境示例：`https://salary.yourcompany.com`
- 推荐在 OpenClaw 工作区 `skills` 目录中创建 `salary-assistant` 文件夹，并将本文件内容拷贝为 `SKILL.md`。

