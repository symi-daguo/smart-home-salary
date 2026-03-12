## 智能家居行业 SAAS 管理系统（2026 MVP）

### 项目简介

- **业务目标**：围绕智能家居公司，统一管理项目/商品/岗位/员工/销售上报/技术上报/工资结算与预警，替代 Excel 人工统计。  
- **技术目标**：采用 2026 年可免费商用的现代技术栈，多租户隔离 + RBAC + 可观测性完备，支持 Docker 一键部署与平滑升级。  
- **范围约束**：当前版本只提供 **Web 管理端 + 后端 API**，iOS 员工端与仓库/库存模块规划中但未落地代码。  
- **来源说明**：本项目基于 MIT 授权的 [Multi-Tenant-SaaS-Starter-NestJS](https://github.com/OwaliShawon/Multi-Tenant-SaaS-Starter-NestJS) 二次开发，保留其多租户/RBAC/审计/Feature Flags 等基础能力，并在此基础上扩展智能家居行业的工资与业务管理模块。根目录 `LICENSE` 继续采用 MIT，**允许商用与闭源集成**。

---

### 目录结构（对 GitHub 可见部分）

- `apps/api/`：后端 API（NestJS 11 + Prisma 6.19 + PostgreSQL + Redis）  
  - 保留 Starter 的基础模块：`auth/tenants/users/memberships/rbac/feature-flags/audit/billing/notifications/cache/logger/metrics/tracing/health/common`。  
  - 新增业务模块：  
    - `positions/`：岗位管理（底薪 + JSON 提成规则 + 补贴）  
    - `employee-types/`：员工类型 + `skillTags`（与 OpenClaw 员工智能体路由联动）  
    - `employees/`：员工档案（岗位/员工类型/账号绑定）  
    - `products/` + `product-categories/`：商品与分类（包含建议库存数量和技术提成字段）  
    - `projects/` + `projectItems/`：项目与标准产品清单  
    - `sales-orders/` + `sales-order-items/`：销售上报与明细  
    - `installation-records/`：技术上报（安装/调试/售后）  
    - `measurement-surveys/`：测量工勘信息记录（本轮已实现）  
    - `curtain-orders/`：窗帘下单基础录入（本轮已实现，复杂自动出库/折扣联动未实现）  
    - `alerts/`：销售 vs 技术数量差异预警（数量规则已实现）  
    - `salaries/`：工资结算（底薪 + 提成 + 技术费 + 补贴 − 扣款）  
    - `excel/`：Excel / JSON 导入导出（员工/商品/项目/销售订单）  
    - `uploads/`：收款截图/施工照片/视频上传（MinIO / S3）  
    - `dashboard/`：工作台统计（总览/趋势/分布/动态列表）

- `apps/web/`：Web 管理后台（Vite + React 18 + TypeScript + Ant Design 5 + React Router + Zustand + Axios）  
  - 页面菜单：登录、工作台、岗位管理、员工管理、员工类型、商品管理、项目管理、销售上报、技术上报、测量工勘（信息记录/窗帘下单）、工资结算、预警中心、OpenClaw 联调、系统设置。  
  - 支持 Excel/JSON 导入导出入口（员工/商品/项目/销售订单）。

- `infra/`：部署与运维  
  - `docker-compose.yml`：本地开发/试用环境（Postgres + Redis + MinIO + API + Web + OpenClaw）。  
  - `docker-compose.prod.yml`：生产/伙伴云服务器部署（不直接暴露 DB/Redis/MinIO/API 端口，依赖反向代理/负载均衡）。  
  - `backup/`：Postgres + MinIO 备份/恢复脚本及 crontab 示例。

- `skills/`：OpenClaw Skill 定义（仅文档，不含业务密钥）  
  - `salary-assistant/`：统一工资助手（按角色分发到下游 Skills）。  
  - `member-sales/`：销售岗，只调用 `/api/sales-orders/my` + 项目查询。  
  - `member-technician/`：技术岗，只调用 `/api/installation-records/my` + 项目/商品查询。  
  - `member-salary/`：员工工资查询，只调用 `/api/salaries/my`。  
  - `admin-guide/`：管理引导，强调用 Web 管理端完成统计/审批/测量工勘/窗帘下单等管理操作。  
  - `employee-skill-router/`：根据语义与 `EmployeeType.skillTags` 路由到上述 Skills，并强制“提交前二次确认”。  
  - `taxonomy-smart-home/`：智能家居岗位与产品词典，用于归一化口语表达。

- `需求资料/`：业务/需求/会议记录等 **内部文档目录**，**已在根 `.gitignore` 中排除，不会推送到 GitHub**。  
  - 例如 `需求资料/README.md`、`项目开发完成情况审查报告` 等，只用于本地开发与验收，不属于可公开发布内容。

> 说明：根目录新增的 `.gitignore` 会忽略 `node_modules/`、`dist/`、`.env`、`infra/.env.prod`、`coverage/` 与 `需求资料/` 目录，避免把依赖、构建产物、环境变量和内部需求文档推送到 GitHub。

---

### 部署与构建（简要）

#### 本地开发 / 试用环境

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

- Web 管理后台：`http://localhost:5173`  
- 后端 API：`http://localhost:3000/api`  
- Swagger：`http://localhost:3000/docs`  
- MinIO 控制台：`http://localhost:9001`（开发默认账号/密码：`minioadmin/minioadmin`，仅限本地）  
- OpenClaw Control UI：`http://localhost:18789/`

#### 伙伴云服务器部署（生产）

1. 在云服务器安装 Docker / Docker Compose。  
2. 克隆本仓库到云服务器（建议私有仓库）：  
   ```bash
   git clone <your-private-repo-url> smart-home-salary
   cd smart-home-salary
   cp infra/.env.prod.example infra/.env.prod
   # 编辑 infra/.env.prod，填入强随机密钥与域名相关配置
   ```
3. 启动生产栈：  
   ```bash
   docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build
   ```
4. 在云厂商控制台或自建 Nginx/Caddy 上配置域名与 HTTPS，80/443 反代到 `web` 容器，`/api` 再转发到 `api` 容器。

升级时，只需在云服务器上 `git pull`（或切换到你标记的 tag），然后重复执行同一条 `docker compose --env-file ... up -d --build`，API 容器会自动执行 `prisma migrate deploy` 应用向前迁移。

---

### 开源与隐私合规说明

- **上游授权**：  
  - 基础项目来自 MIT 协议的 `Multi-Tenant-SaaS-Starter-NestJS`，本仓库在根目录保留 MIT `LICENSE`，并在其中注明来源与原作者版权。MIT 允许商用、二次开发与闭源集成，只需保留版权声明与许可文本。  

- **隐私与敏感信息**：  
  - 本仓库不包含任何生产环境 `.env` / 密钥 / 账号密码；  
  - 配置文件模板使用占位符（如 `REPLACE_*`），需要在部署时由你或伙伴在 `infra/.env.prod` 中填入强随机值；  
  - `需求资料/` 目录包含内部需求与会议记录，已通过 `.gitignore` 排除，**不会推送到 GitHub**；  
  - 所有第三方依赖（NestJS/Prisma/React/AntD 等）均来自公开可商用的开源项目，其许可证保留在各自 `node_modules/**/LICENSE*` 文件中。  

- **仓库可见性**：  
  - 若希望完全私有使用，可在 GitHub 仓库设置中将 `smart-home-salary` 设置为 **Private**，仅授权的协作者可访问。  
  - 即便设置为 Public，当前代码结构在 `.gitignore` 约束下不会暴露任何生产密钥或内部需求文档。

---

### Skills 文档与 OpenClaw 适配

`skills/` 目录下的所有 `SKILL.md` 已按当前后端 API 及 RBAC 规则更新，核心约束包括：

- 所有 MEMBER 类 Skills 只调用 `/api/*/my` 与只读查询接口（`/api/projects`、`/api/products`），并严格通过 JWT + `X-Tenant-ID` 访问当前租户自己的数据。  
- 管理类操作（测量工勘/窗帘下单/工资结算/预警统计等）由 `admin-guide` Skill 引导到 Web 管理端完成，不在聊天中返回全员敏感数据。  
- `employee-skill-router` 与 `taxonomy-smart-home` 负责意图分类与字段归一化，并统一要求在真正调用 `POST /api/*/my` 前向员工展示“表单摘要”，员工必须回复“确认”才提交，避免误填。  

这些文档不会包含任何密钥，仅描述调用方式和安全边界，适合直接随代码仓库开源或发给伙伴团队使用。

