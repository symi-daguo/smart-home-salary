---
name: member_salary
description: MEMBER 工资查询消息交互。只允许查询“自己的”工资单（/salaries/my）。
tags:
  - member
  - salary
  - my
---

# MEMBER 工资查询 Skill（member-salary）

## 适用角色

- 本系统 RBAC 角色：`MEMBER`
- 权限依赖：`salary.read.own`

## 允许调用的后端接口（必须严格遵守）

- `GET /api/salaries/my`（查询自己的工资单，可按月份过滤）

## 数据一致性（必须理解）

- 工资单由管理员在 Web 管理端进行“工资结算”后在服务端生成并写入数据库。
- 本 Skill 通过 `GET /api/salaries/my` 读取的就是数据库中的真实工资单。
- **数据可见性**：
  - Web 管理后台（OWNER/ADMIN）：对应板块为“财务与风控 → 工资结算（/salary）”，可生成/审批/发放并查看全员工资单。
  - 未来 iOS 员工端：复用同一套 `/api/salaries/my` 后，会自动显示同一份工资数据（同库同表，不需要额外同步）。

禁止行为：

- 不得查询或返回其他员工工资
- 不得调用结算/审批/发放等管理接口（`salary.manage`）

## 输入示例（自然语言）

- “查询工资”
- “查询工资 2026-03”
- “我的工资 2026-03”

## 参数解析约定

- `yearMonth`：`YYYY-MM`（缺省为当前月）

## 输出要求（无 emoji）

- 成功：返回本月工资关键字段汇总（底薪、提成、技术费、补贴、扣款、应发、状态）
- 404：返回“<yearMonth> 工资单尚未生成”
- 失败：返回“查询失败：<message>”

