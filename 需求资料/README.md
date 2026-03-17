## 智能家居行业SAAS管理系统（2026 MVP）

**当前版本：v1.1.5（发布构建）**  
**下一版本：v1.1.6（规划中）**

### 发布口径（务必对齐）

- **客户交付口径**：以 GitHub Releases 的安装包为准（Windows 选择 NSIS `*setup.exe`；macOS 选择 `*.dmg`；Linux 选择 `*.AppImage`）。
- **开发验证口径**：本地 Docker Compose 必须可 `up -d --build` 且健康检查返回 `ok`，再允许打 tag 触发构建。
- **桌面端口径（当前阶段）**：
  - **TAURI-002（SQLite 本地持久化）**：已接入 `tauri-plugin-sql`（sqlite），预加载 `sqlite:smarthome.db`，并通过 capabilities 授权 `sql:default + sql:allow-execute`。
  - **TAURI-001（本地后端服务集成）**：尚未完成（当前 Web 仍以 HTTP API 为主，桌面端未内置本地 API 服务/离线业务闭环）。

### 关键问题修复状态（总览表）

| ID | 问题描述 | 修复状态 | 验证/依据 |
|---|---|---|---|
| SEC-001 | CSP 设置为 null，存在 XSS 风险 | ✅ 已修复 | `src-tauri/tauri.conf.json` 已启用 CSP（不再为 null） |
| SEC-002 | Shell 权限范围过宽 | ✅ 已修复 | 已移除 shell 插件与过宽权限（`src-tauri/capabilities/default.json` 仅保留必要权限） |
| SEC-003 | Docker 开发环境使用默认弱密码 | ⚠️ 文档提示 | 根 `README.md` 已增加生产环境安全提示（生产需替换所有敏感配置） |
| FUNC-001 | 仓库单据作废/冲销机制 | ✅ 已修复 | 已实现作废生成冲销单 + 库存回滚，API/前端已对接 |
| FUNC-002 | 库存盘点单完整流程 | ✅ 已修复 | 已实现创建盘点单 → 审核 → 生成盘盈/盘亏调整单 |
| FUNC-003 | SN 码流转追踪 | ✅ 已修复 | 已实现 `/api/warehouse/sn-trace?sn=...` 链路查询 |
| CODE-001 | 前端生产构建未启用 sourcemap | ✅ 已修复 | `apps/web/vite.config.ts`：`sourcemap: 'hidden'` |
| CODE-002 | 版本号同步需手动维护 | ✅ 已修复 | 根/工作区/tauri 版本已统一 `1.1.5`（含 lockfile） |
| TAURI-001 | 桌面版未集成本地后端服务 | ❌ 未修复 | 仍为“纯 Web 前端 + HTTP API”模式 |
| TAURI-002 | 无本地数据持久化方案 | ✅ 已修复 | 已接入 `tauri-plugin-sql`（SQLite）并预加载 DB |

### 本地 Docker 验证（发布前必做）

在仓库根目录执行：

```bash
cd infra
docker compose up -d --build
```

验收：
- Web：`http://localhost:5173`
- Swagger：`http://localhost:3000/docs`
- Health：`GET http://localhost:3000/api/health` 返回 `{"status":"ok", ...}`

### 项目目标
- **业务目标**：围绕智能家居公司，自动统计安装调试费用、销售提成和月度工资，替代 Excel 人工统计。
- **技术目标**：采用 2026 年可免费商用的现代技术栈，重点保证多租户（多公司）数据隔离、安全和可观测性，同时支持容器一键部署和后续平滑升级。
- **范围约束**：当前版本只做 Web 管理端 + 后端 API，**iOS 原生 App 暂缓**，待 Web+API 通过验收后再启动。

### 版本与更新

- **v1.1.5**（2026-03-17）
  - **安全修复（P0）**：
    - Tauri：启用 CSP（不再使用 `csp: null`）
    - Tauri：移除不必要的 Shell 插件与过宽权限（收敛攻击面）
  - **桌面端（Windows）**：
    - 修复 Windows 构建失败：`MessageBoxW` 按 `windows-sys` 的 `HWND` 类型签名调用（`HWND(0)` 表示无父窗口）
  - **仓库补齐（对齐审查报告缺口）**：
    - 出入库单：新增“作废/冲销”能力（作废时生成冲销单并回滚库存影响，保留审计链路）
    - 库存盘点：新增盘点单创建/审核流程，审核后自动生成盘盈/盘亏调整单并更新库存
    - SN 追踪：新增按 SN 查询关联出库申请单与出入库单的链路接口
  - **前端工程化**：
    - 生产构建启用 `hidden` sourcemap，便于线上定位同时避免直接暴露源码
  - **Docker 验证（可复现）**：
    - Compose 全链路可 `up -d --build`，API 健康检查：`GET /api/health`，Swagger：`GET /docs`
  - **CI/CD（官方流程）**：
    - GitHub Actions 恢复使用 `tauri-apps/tauri-action@v0`：推送 tag 自动构建并发布 Release（Windows 默认产出 NSIS `.exe`）
  - **文档**：
    - 同步根 README 版本历史与生产环境安全提示

- **v1.1.4**（2026-03-17）
  - **桌面端稳定性**：
    - Windows：启动失败弹窗提示 + 写入日志文件，解决“安装后无反应难定位”
  - **文档**：
    - 根 README 客户友好化：下载统一指向 Releases latest；合并 1.0.x 迭代展示

- **v1.1.2**（2026-03-17）
  - **一致性/安全修复**：
    - 修复 OpenClaw 接口租户/用户上下文获取错误，补齐 `X-Tenant-ID` 安全保护
    - 修复仓库日志 operator 口径（按 Employee 记录，避免 employeeId 写入 User 外键失败）
  - **多租户约束修复（Prisma）**：
    - `OutboundApplication`、`WarehouseOrder` 单号唯一约束改为 `tenantId + orderNo`
    - `Inventory` 增加 `tenantId + productId` 唯一约束（保持与一对一关系兼容）
  - **前端**：
    - 侧边栏版本号改为构建注入动态展示（不再写死 v1.0.5）

- **v1.1.1**（2026-03-17）
  - **GitHub Actions 构建修复**：
    - 使用 Node.js 22 替代已弃用的 Node.js 20
    - 添加 FORCE_JAVASCRIPT_ACTIONS_TO_NODE24 环境变量
    - 修复依赖安装顺序，先构建前端再执行 Tauri 打包
  - **跨平台打包完善**：Windows/macOS/Linux 三平台自动构建流程验证通过

- **v1.1.0**（2026-03-17）
  - **GitHub Actions 自动化打包**：
    - 新增 `.github/workflows/build.yml` 跨平台打包配置
    - 支持 Windows/macOS/Linux 三平台自动构建
    - 推送 tag 时自动触发打包并创建 GitHub Release
  - **README.md 优化**：
    - 精简版本历史，合并 v1.0.4-v1.0.8 内容
    - 添加徽章（版本、许可证、构建状态）
    - 优化表格布局，提高可读性
  - **Bundle identifier 修复**：从 `com.smarthome.app` 改为 `com.smarthome.desktop`

- **v1.0.9**（2026-03-17）
  - **Tauri 桌面应用打包**：
    - 新增 `src-tauri/` 目录，完整 Tauri 2.0 配置
    - macOS 应用包：SmartHome.app (3.9MB)
    - macOS 安装包：SmartHome_1.0.9_aarch64.dmg (29MB)
    - 支持 Windows/Linux/macOS 跨平台打包
  - **桌面版启动方案**：
    - 新增 `desktop/` 目录，包含独立部署方案
    - SQLite 数据库支持（schema.sqlite.prisma）
    - Windows 启动脚本（start.bat）
    - Mac/Linux 启动脚本（start.sh）
    - 自动备份功能
  - **数据库迁移支持**：
    - PostgreSQL → SQLite 迁移方案
    - SQLite 环境配置文件
  - **技术细节**：
    - Tauri 2.10.3 + Rust 1.94.0
    - SQLite schema 将 Decimal 类型改为 Float
    - SQLite schema 将 Json 类型改为 String（Prisma 自动处理序列化）
    - 前端构建产物：1,954KB (gzip: 593KB)

- **v1.0.8**（2026-03-16）
  - **OpenClaw 语音/文字交互 API**：
    - 意图识别（销售上报/技术上报/工资查询/项目查询/产品查询）
    - 实体提取（金额、折扣率、项目、产品、员工）
    - 表单摘要生成（用于二次确认）
    - 候选项目/产品模糊匹配
    - 中文金额解析（如"五万"→50000）
    - 语音输入纠错
  - **窗帘下单自动计算功能**：
    - 布匹价格自动计算（高度×长度×单价）
    - 轨道费用自动计算（房间数×单双层×长度进1位）
    - 下单根数费用（200元/根）
    - 自动生成销售出库单
    - 更新项目应收款
  - **出入库单图片上传支持**：
    - 新增 `/uploads/warehouse-images` 上传接口
    - 支持 jpeg/png/webp 格式，最大 5MB
  - **窗帘下单页面 UI 重构**：
    - 移除 JSON 输入字段，改为可视化表单
    - 窗帘类型下拉选择（9种类型）
    - 动态长度字段（根据类型自动显示）
    - 窗帘盒开关控制、布匹销售开关控制
    - 价格计算预览弹窗
  - **测量工勘页面 UI 优化**：
    - 完全匹配需求文档：关联项目、图片上传、时间、备注
    - 图片上传改为可视化组件（最多3张）
    - 支持视频上传（30秒内，50MB）
    - 图片/视频在列表中显示缩略图
  - **关键 Bug 修复**：
    - 修复窗帘订单 API "Missing tenant context" 错误
    - 修复测量工勘 API "Missing tenant context" 错误
    - 修复窗帘下单编辑删除功能
    - 修复窗帘下单编辑功能数据加载问题
  - **用户管理功能**：
    - 前端：新增用户管理页面（UsersPage）
    - 组织架构菜单新增"用户管理"入口
    - 支持创建、编辑、删除用户，分配角色权限
    - 后端：新增用户 CRUD API
    - 权限控制：仅 OWNER 和 ADMIN 可管理用户
  - **模拟真实数据生成**：
    - 租户：acme
    - 用户账号：founder/admin/sales/technician/finance/guide（密码均为 password）
    - 员工类型、岗位、员工档案、商品、项目、销售上报、技术上报等完整测试数据
  - **首页看板数据验证通过**：
    - 本月总营收、新增销售订单、活跃员工数、待处理预警
    - 营收趋势图表、安装品类分布、近期销售/安装动态
    - 看板自定义：支持显示/隐藏各窗口、导出 JSON、重置布局

- **v1.0.7**（2026-03-16）
  - **产品技术提成字段**：Product 模型新增 `techCommissionInstall`、`techCommissionDebug`、`techCommissionMaintenance`、`techCommissionAfterSales` 四个技术提成字段，    前端商品管理页面支持录入，工资结算服务优先使用产品技术提成计算技术费。
  - **出库申请单流程优化**：审核通过时支持修改商品数量和类目，支持选择出库类型（销售出库单/借货出库单/售后出库单），
    新增 `finalOrderType` 字段记录最终确认的出库类型。
  - **出入库单关联链路**：WarehouseOrder 模型新增 `relatedOrderIds` 字段，支持关联其他出入库单，便于追溯出入库链路痕迹。
  - **项目管理折扣率计算**：新增 `GET /api/projects/:id/stats` 接口，
    计算并返回产品折扣率、综合折扣率、原价应收款、折扣后应收款等统计数据。
  - **预警中心规则引擎**：
    - 新增库存预警：产品库存低于建议库存时自动触发预警。
    - 新增折扣率预警：项目状态为已完结且产品折扣率低于85%时触发预警。
    - 新增收款不足预警：已上报收款金额低于出库单产品金额总和时触发预警。
    - 新增 `POST /api/alerts/run-all` 接口，一键运行所有预警检查。
  - **关联项目产品优先**：新增 `GET /api/products/by-project/:projectId` 接口，
    返回商品列表时将关联项目出库单中的产品排在前面，便于技术录入时快速选择。
  - **前端优化**：修复商品管理页面技术提成表单重复显示的问题。
  - **仓库管理菜单层级优化**：将出库申请单相关菜单改为三级菜单结构，符合需求规范：
    - 仓库管理（一级）
      - 出库申请单（二级，默认展开）
        - 全部申请（三级）
        - 销售预出库申请（三级）
        - 技术预出库申请（三级）
        - 确认出库审核（三级）
      - 销售出库单、借货出库单、售后出库单、丢失出库单（二级）
      - 销售入库单、采购入库单、售后入库单、未知入库单（二级）
      - 库存盘点统计（二级）
      - 修改出入库单日志（二级）
  - **测试数据**：新增 `prisma/seed-warehouse.ts` 脚本，导入仓库管理测试数据，包含4个产品、3个出库申请单、4个出入库单、1个测试项目。
  - **项目统计前端集成**：ProjectsPage 新增"统计"按钮，点击后展示项目统计数据弹窗，包括服务费、签单折扣率、销售金额、出库金额、安装费、调试费、产品折扣率、综合折扣率、原价应收款、折扣后应收款。
  - **预警中心前端集成**：AlertsPage 新增"运行全部预警"按钮，一键运行库存预警、折扣率预警、收款不足预警。

- **v1.0.6**（2026-03）
  - **仓库管理前后端补齐（对齐成熟方案）**：出库申请单、出入库单和库存盘点页面补充类型/项目/产品名称/SN码/备注/时间范围等筛选条件，
    并统一通过后端查询参数过滤，支持按不同菜单路径自动过滤到各自的出/入库单类型。
  - **出入库修改日志落地**：后端新增 `GET /api/warehouse/logs` 接口并接入权限码 `warehouse.logs.read`，
    前端「修改出入库单日志」页面从真实接口加载最近200条日志，展示单据编号/类型/操作人/时间/操作类型及字段变更摘要，仅OWNER角色可访问。
  - **Docker环境接口自检（含仓库模块）**：在本地Docker Compose环境下，使用开发账号 `founder@yoursaas.com` 与租户 `acme`
    逐一验证了出库申请列表、出入库单列表、库存盘点统计和出入库日志接口均返回200，确保仓库模块在容器内与主业务模块一同正常工作。

- **v1.0.5**（2026-03-16）
  - **前端类型与规则收紧（第一阶段）**：按照“先公共 `api/*` 再页面”的规划，从公共 API 层开始移除 `any`。`positions` 的提成/奖金规则统一为 `Record<string, unknown>`，`employees` / `employee-types` 的 `skillTags` 统一为 `string[]`，`alerts` 的 `metadata` 使用结构化对象并为 `runAlertCompare` 补充 `{ success: boolean }` 返回类型，`excel.importJson` 改为泛型函数，消除裸 `any[]`。该阶段不改业务行为，只提升类型安全性，为后续表单与仓库页面的类型收紧打基础。
  - **仓库管理菜单细化（阶段一）**：前端侧边栏的“仓库管理”菜单已对齐最新需求拆分为细粒度二级/三级菜单，并与现有页面路由打通（通过不同路径自动切换视图和筛选）：
    - 出库申请单相关：
      - `出库申请单（全部）` → `/outbound-applications`（现有页，展示全部销售/技术预出库申请）
      - `销售预出库申请` → `/outbound-applications/sales-pre`（同一页面，默认切换到 SALES_PRE 标签）
      - `技术预出库申请` → `/outbound-applications/tech-pre`（同一页面，默认切换到 TECH_PRE 标签）
      - `确认出库审核` → `/outbound-applications/review`（同一页面，仅展示状态为“待审核”的申请单，用于出库确认）
    - 出入库单相关（共用 `WarehouseOrdersPage`，但按类型自动过滤）：
      - `销售出库单` → `/warehouse-orders/outbound-sales`
      - `借货出库单` → `/warehouse-orders/outbound-loan`
      - `售后出库单` → `/warehouse-orders/outbound-after-sales`
      - `丢失出库单` → `/warehouse-orders/outbound-lost`
      - `销售入库单` → `/warehouse-orders/inbound-sales`
      - `采购入库单` → `/warehouse-orders/inbound-purchase`
      - `售后入库单` → `/warehouse-orders/inbound-after-sales`
      - `未知入库单` → `/warehouse-orders/inbound-unknown`
      - 保留汇总入口：`出入库单` → `/warehouse-orders`（全部类型），并在页面内用 Tab 区分“出库单/入库单”。
    - 统计与日志：
      - `库存盘点统计` → `/inventory`（现有 `InventoryPage`，展示实时库存列表+成本统计+打印）
      - `修改出入库单日志` → `/warehouse-order-logs`（新增占位页面 `WarehouseOrderLogsPage`，前端路由与布局已就绪，后端日志接口待下一阶段按 RBAC 规则补充）。
  - **仓库管理 RBAC 权限细化（阶段一）**：在后端 `RbacService` 中新增一组仓库相关权限，并用 `PermissionsGuard + @RequirePermissions` 精准保护仓库接口，保证后续可以按“老板/财务/库管”等业务角色进行划分：
    - 新增权限枚举：
      - `warehouse.apply`：出库申请单的创建/编辑/删除/提交。
      - `warehouse.review`：出库申请单的审核通过/拒绝（确认出库审核）。
      - `warehouse.orders.manage`：出入库单的创建/编辑/删除，以及库存调整接口。
      - `warehouse.inventory.read`：出入库单与库存列表/成本统计的只读访问。
      - `warehouse.logs.read`：查看“修改出入库单日志”页面（当前仅绑定到 OWNER，将在下一阶段接出真实日志 API）。
    - 权限分配（现阶段仍沿用技术角色 `OWNER/ADMIN/MEMBER`，后续再在业务上映射为老板/财务/库管等）：
      - `OWNER`：继承原有全部权限，并新增拥有 `warehouse.apply / warehouse.review / warehouse.orders.manage / warehouse.inventory.read / warehouse.logs.read`。
      - `ADMIN`：继承原有全部权限，并新增拥有 `warehouse.apply / warehouse.review / warehouse.orders.manage / warehouse.inventory.read`（暂不含日志查看）。
      - `MEMBER`：不授予任何仓库相关权限（普通员工无法直接调用仓库管理接口，仍通过 `/my` 系列端点和消息端/iOS 进行个人维度的上报）。
    - 仓库接口与权限的绑定（`WarehouseController`）：
      - 出库申请单：
        - 创建/更新/删除/提交：`@RequirePermissions('warehouse.apply')`
        - 列表/详情：`@RequirePermissions('warehouse.apply', 'warehouse.review')`（申请人和审核人都可查看）。
        - 审核通过/拒绝：`@RequirePermissions('warehouse.review')`。
      - 出入库单：
        - 创建/更新/删除：`@RequirePermissions('warehouse.orders.manage')`
        - 列表/详情：`@RequirePermissions('warehouse.orders.manage', 'warehouse.inventory.read')`（方便只读盘点与财务对账）。
      - 库存与成本：
        - 库存列表与成本统计：`@RequirePermissions('warehouse.inventory.read')`
        - 库存调整：`@RequirePermissions('warehouse.orders.manage')`。
    - 验证：已运行 `apps/api` 下的 `npm run build`，NestJS 编译通过，说明 RBAC 与仓库模块的接口签名、依赖关系在当前阶段是自洽可用的。后续为老板/财务/库管等业务角色拆分时，只需在成员管理/角色管理中映射到上述权限，无需再改仓库控制器。

- **v1.0.4**（2026-03-14）
  - **仓库管理模块（P0）**：新增完整的仓库管理功能。
    - 出入库单类型：销售出库单、借货出库单、售后出库单、丢失出库单、销售入库单、采购入库单、售后入库单、未知入库单。
    - 出库申请流程：销售预出库申请 → 技术预出库申请 → 确认出库审核 → 生成出库单。
    - 自动生成流水单号：CK/RK/CG/JH/SH/DS/RH/WR + 日期 + 序号。
    - 库存实时计算：入库+、出库-，支持库存成本统计。
    - SN码管理：支持SN码录入和查询。
  - **产品管理增强**：新增成本价、规格型号、单位、布匹类型标记字段。
  - **数据库模型扩展**：新增 `WarehouseOrder`、`OutboundApplication`、`Inventory`、`AlertRule`、`CurtainRoomDetail` 等模型。

### 仓库管理模块（需求细化，参考 RuoYi）

> 说明：本节用于补充“研发反馈需进一步明确”的细节，整体参考若依及基于若依的进销存/仓储系统（ks-inventory-system、wms-ruoyi、ruoyi-vue-pro 库存模块等）的通用设计，避免单据状态、作废、日志、库存盘点等关键点遗漏。

#### 一、菜单与角色权限（复核）

- **一级菜单**：`仓库管理`
- **二级菜单**：
  - `出库申请单`
    - `销售预出库申请`
    - `技术预出库申请`
    - `确认出库审核`
  - `销售出库单`
  - `销售入库单`
  - `采购入库单`
  - `借货出库单`
  - `售后出库单`
  - `售后入库单`
  - `丢失出库单`
  - `未知入库单`
  - `库存盘点统计`
  - `修改出入库单日志`
- **典型角色与权限边界**（名称示意，可映射到 RBAC 权限码）：
  - 库管：出入库单增删改查、确认出库审核、库存盘点、库存查询。
  - 销售：销售预出库申请、查看与自己相关的销售出库单记录。
  - 技术：技术预出库申请、查看与自己相关的技术/售后出库记录。
  - 财务：查看/核对所有出入库单与盘点结果，可按需修改出入库单的财务相关字段（付款类型等）。
  - 老板/OWNER：可以查看所有单据与“修改出入库单日志”，并保留最终配置权限（可调整谁能改什么）。

#### 二、单据类型与统一状态机

参考 RuoYi 及进销存通用做法，所有出入库单据（含出库申请单、正式出库单、入库单、盘点单）应具备统一的**状态字段**，建议：

- **状态枚举**（后端可实现为 `tinyint` 或 `enum`，前端用常量映射）：
  - `DRAFT`（草稿）：未提交/未审核，仅创建人或有权限的角色可编辑、删除。
  - `SUBMITTED`（已提交，待审核）：进入审核队列，普通提交人仅可查看，不能再修改关键字段（数量、商品、仓库等）。
  - `APPROVED`（已审核/已生效）：审核通过，已经影响库存。关键字段只允许高权限角色（库管、财务、老板）按规则修改。
  - `REJECTED`（已驳回）：审核驳回，需要修改后重新提交或作废。
  - `VOID`（已作废）：单据不再生效，不参与库存计算。只能逻辑作废，禁止物理删除。
- **不同单据的状态约束**：
  - 预出库申请（销售/技术）：
    - 草稿 → 已提交 →（确认出库审核）→ 已作废/已生成正式出库单。
    - 预申请本身**不影响库存**，仅在生成正式出库单时才扣减库存。
  - 正式出库单 / 入库单：
    - 草稿 → 已提交 → 已审核（库存变动生效）→ 允许反审核/作废（通过冲销机制，见下）。
  - 库存盘点单：
    - 草稿 → 已提交 → 已审核（按盘点差异调整库存）→ 不支持随意作废，只能通过新盘点覆盖。

#### 三、作废 / 反审核 与库存冲销规则

为避免直接回滚库存导致审计困难，参考进销存系统的实践：

- **统一原则**：
  - 已审核且已影响库存的单据，**不得直接删除**。
  - 作废/反审核应通过“生成冲销记录”实现，而非修改原始数量字段。
- **作废规则**：
  - 草稿 / 已提交状态：允许删除或作废，不产生库存影响。
  - 已审核状态：
    - 若单据已被下游模块引用（如出库单已被关联到安装记录/售后记录），则禁止作废，只能通过新单据做“反向操作”（例如新增入库单补回）。
    - 若允许作废，应：
      - 生成一条同类型、数量相反的“冲销出入库记录”（例如原单出库 10，冲销单入库 10），确保库存流转链条完整。
      - 将原单状态标记为 `VOID`，保留原记录与冲销记录的关联。
- **反审核（取消审核）**：
  - 在实现上等价于“作废 + 新建草稿”的简写形式，可选实现：
    - 模型 A：禁止反审核，仅支持作废+重新录入。
    - 模型 B：允许反审核到 `SUBMITTED` 状态，但必须记录“反审核日志”（谁在什么时候反审核，原因是什么），并重新审核后才能再次生效。

> 若无特别说明，推荐采用“禁止物理删除 + 冲销记录 + 原单标记 VOID”的模型，方便财务与审计追踪。

#### 四、出库申请 → 确认出库审核 → 正式出库单 流程

- **销售/技术预出库申请**：
  - 页面字段与“销售出库单”基本一致，但状态仅有：草稿/已提交/已作废。
  - 拥有对应权限的销售/技术人员可以在草稿与已提交之间修改内容（商品、数量、备注等），**只要还未被确认出库**。
- **确认出库审核**：
  - 列表展示：所有状态为“已提交”的销售/技术预出库申请。
  - 审核角色：库管 + 具有该权限的管理者。
  - 操作能力：
    - 调整申请中的商品条目、数量、出库类型。
    - 可以合并多个申请生成一张正式出库单（例如多个小申请一次性出库）。
    - 审核通过时：
      - 生成对应出库类型的正式出库单（销售出库/借货出库/售后出库等），状态为 `APPROVED`。
      - 正式出库单立即影响库存（减少对应商品的可用数量）。
      - 更新原预出库申请状态为“已完成/已转出库”，并关闭其编辑权限。
    - 审核驳回时：
      - 预申请状态改为 `REJECTED`，申请人可修改后再次提交。

#### 五、库存计算、库存盘点与多仓扩展预留

- **当前 MVP 口径**：
  - 每个商品仅维护一个总库存数量（暂不区分仓库/库位/批次）。
  - 库存 = 所有入库单数量合计 − 所有出库单数量合计。
  - 丢失出库、销毁出库等类型同样计入“出库”，用于真实反映库存损耗。
- **库存盘点统计**：
  - 盘点单表头信息：
    - 盘点单号（自动生成）、盘点日期、负责人、备注。
  - 盘点明细：
    - 商品、系统库存数量、盘点数量、差异数量（盘点−系统）、差异原因（可选）、金额字段（可按成本价计算）。
  - 审核通过时：
    - 根据差异数量生成一组内部出入库调整记录（多为“盘盈入库/盘亏出库”），以保持库存流转可追踪。
  - 页面要求：
    - 支持按商品、分类、时间区间、负责人员筛选展示历史盘点单。
    - 支持打印盘点结果（打印模板固定版即可：抬头+表头+明细+合计）。
- **多仓/批次预留**（当前不实现，但在字段层面预留）：
  - 所有出入库单与库存记录预留 `warehouseId` 字段（默认主仓）。
  - 后续若需要按仓库、库区、货架管理时，只需打开对应页面与筛选条件，不破坏现有数据。

#### 六、SN 管理与数量校验

- **SN 与数量关系**：
  - 对于开启 SN 管理的产品：
    - 出入库时必须录入 SN 列表。
    - 数量 = SN 数量，系统校验二者一致，否则不允许保存。
  - 对于不启用 SN 管理的产品：
    - 可只录入数量，无需 SN。
- **SN 唯一性与流转**：
  - 同一 SN 在同一租户内必须唯一，禁止重复分配到多个不同商品。
  - SN 从入库到出库、售后入库/出库的流转需要能追踪：
    - 支持通过 SN 反查所有关联单据链路（入库单 → 出库单 → 售后入库/出库等）。
- **录入方式**：
  - 支持单个扫码录入 SN。
  - 支持通过手机摄像头拍照/识图批量识别 SN 后导入（前端实现为批量文本粘贴或识图结果校对弹窗）。

#### 七、修改权限与操作日志（仅老板可查看）

- **修改权限边界**：
  - 普通销售/技术：仅能修改自己的预出库申请（在未确认出库前）。
  - 库管：可修改出入库单非财务敏感字段（商品、数量、仓库、SN、备注等），但对已结算月份建议限制（仅老板可强制修改）。
  - 财务：可修改付款类型、结算状态等财务相关字段。
  - 老板：可修改任意字段，但所有修改均会被记录在“修改出入库单日志”中。
- **操作日志要求**（参考 RuoYi `@Log` 模块）：
  - 字段建议：
    - 日志 ID、单据类型、单据号、操作人、操作时间、操作类型（创建/修改/作废/反审核/确认出库等）、字段变更明细（JSON）。
  - 记录粒度：
    - 每次修改前后对比字段值（例如：数量 10 → 12，付款类型“未支付” → “已支付”）。
    - 作废/反审核必须记录原因（必填）。
  - 权限：
    - 只有老板/OWNER 角色可以查看“修改出入库单日志”页面。
    - 任何角色都**不能删除日志记录**（可按需按时间归档/隐藏，但不提供删除接口）。

#### 八、与项目 / 安装记录 / 财务模块的联动约定

- **项目关联**：
  - 出入库单可选关联项目；若无项目，可从弹窗跳转新建项目再返回。
  - 在技术录入安装/调试/售后记录时：
    - 选择项目后，商品选择下拉优先展示“该项目关联出库单中已经出库过的商品”，提升录入速度。
- **安装/售后记录与仓库**：
  - 当前阶段不自动生成出入库单，仅作为“项目→出库→安装”的链路查询依据。
  - 后续若自动生成，可约定：
    - 安装记录完成时，若发现出库数量不足，则提示库管补录相应出库单。
- **财务模块**：
  - 付款类型（已支付、未支付、需还货、届时寄/送回、挂帐、赠送、销毁）暂不与工资结算/应收应付自动联动，只作为查询维度与后续扩展预留。
  - 后续若需要联动，应在财务模块文档中定义“出入库单对财务凭证的映射单向规则”，否则仓库模块不承担金额口径责任。

#### 九、前后端联调与验收清单（仓库模块）

- **单据状态与作废**：
  - 新建出库单/入库单：可保存为草稿，再提交为待审核，再审核通过。
  - 已审核单据尝试删除：应被禁止，并提示“仅可作废/冲销”。
  - 对已审核单据执行作废：应生成冲销记录、原单状态变为 `VOID`，库存数量恢复。
- **出库申请流程**：
  - 销售发起预出库申请 → 技术可补充或单独发起技术预出库申请 → 库管在“确认出库审核”中看到两类申请。
  - 库管确认出库后：生成正式出库单，库存扣减；原申请不可再编辑。
- **库存与盘点**：
  - 连续多次出入库操作后，库存数量与明细查询结果一致。
  - 创建盘点单、录入盘点数量并审核：库存应按差异调整，且可通过“库存流转明细”还原盘盈/盘亏原因。
- **SN 与查询**：
  - 用 SN 搜索：可查到所有关联的出入库单及项目、安装记录。
  - SN 重复录入时：系统应阻止并给出友好错误提示。
- **日志与权限**：
  - 使用库管/财务角色修改已审核出入库单：在“修改出入库单日志”中可看到字段变更记录。
  - 使用老板账号可以查看日志列表；使用其他角色访问日志路由时，应提示“无权限访问”。

> 验收建议：在本地或测试环境中，使用“销售/技术/库管/财务/老板”五类账号，按上述清单完成一轮全链路测试并截图记录，通过后方可在 README 的版本记录中将仓库模块状态从 P0 调整为“已验收通过”。

---

### 目录结构（真实代码结构）
- `需求资料/`：  
  存放原始需求、开发需求、会议记录等 md 文档，仅作为产品/业务参考，不参与构建。  
  - 其中 **《[UI与功能规范差距分析及优化方案](./UI与功能规范差距分析及优化方案.md)》** 对照成熟后台规范分析当前 Web 端差距，并给出不迁移技术栈的优化项与优先级，便于按批次落地。

- `apps/api/`（后端 API 服务）  
  - 技术栈：NestJS 11 + TypeScript + Prisma 6.19 + PostgreSQL + Redis（截至 2026-03 已对齐官方稳定版本线，保持与上游 Starter 同步）  
  - 模板来源：MIT 授权的多租户 SaaS Starter（组织/用户/租户隔离/RBAC/审计/Feature Flags 已内置）  
  - 主要模块（按你的需求裁剪和扩展）：
    - `auth/`：JWT 认证、登录/注册、刷新 Token、租户切换
    - `tenants/`：租户（公司）管理，多公司隔离
    - `users/` + `memberships/`：平台用户 + 在各租户下的成员关系
    - `rbac/`：角色（OWNER/ADMIN/MEMBER）+ 权限（`positions.manage`、`employees.manage` 等）
    - `cache/`：缓存与限流存储（Redis），配合全局 `ThrottlerGuard` 实现 API 限流
    - `logger/`：请求日志（全局 `HttpLoggingInterceptor`），便于排障与审计联动
    - `metrics/`：指标采集（全局 `HttpMetricsInterceptor`），用于 Prometheus 指标暴露与监控
    - `tracing/`：链路追踪（OpenTelemetry），用于分布式调用追踪与性能分析
    - `positions/`：岗位管理（底薪、提成 JSON 规则、补贴）已实现 CRUD + RBAC + 多租户
    - `employee-types/`：员工类型（用于 Skill 挂载/意图路由，可维护 `skillTags`）已实现 CRUD + RBAC + 多租户
    - `employees/`：员工管理（姓名、手机号、岗位、员工类型、入职日期、状态）已实现 CRUD + RBAC + 多租户
    - `products/`：商品管理（标准价、安装费、调试费、特殊安装标记）已实现 CRUD + RBAC + 多租户
    - `product-categories/`：商品分类与推荐安装/调试/售后费用（仅作为参考值，按租户维护，可在前端修改）
    - `projects/` + `projectItems/`：项目及标准商品清单（合同金额、产品标准数量）已实现 CRUD + RBAC + 多租户
    - `salesOrders/` + `salesOrderItems/`：销售收款订单及明细（折扣、明细数量、附件 URL）已实现 CRUD + RBAC + 多租户
    - `installationRecords/`：技术安装/调试/售后记录（数量、难度系数、照片 URL）已实现 CRUD + RBAC + 多租户
    - `measurement-surveys/`：测量工勘-信息记录（关联项目、时间、备注、媒体 URL）已实现 CRUD + RBAC + 多租户
    - `curtain-orders/`：测量工勘-窗帘下单（关联项目、房间数量、房间详情 JSON、送货/第三方安装等）已实现基础录入 + RBAC + 多租户（复杂规则后续迭代）
    - `alerts/`：销售 vs 技术数量差异预警（差异率 <3% INFO、3%–5% WARNING、>5% CRITICAL）已实现（运行比对、生成预警、查询、标记已处理）
    - `salaries/`：工资结算（底薪+提成+技术费+补贴−扣款）已实现（按月结算生成工资单、查询、审批/发放状态）
    - `excel/`：Excel 导入导出（员工/商品/项目/销售订单）已实现（导出 xlsx、上传导入 upsert）
    - `dashboard/`：工作台统计（总览/趋势/分布/动态），为前端工作台提供真实数据
    - `feature-flags/`：特性开关，可按租户开启/关闭部分高级功能
    - `audit/`：操作审计日志（谁在哪个租户做了什么）
    - `billing/`：计费接口（目前使用 mock 适配器，不做真实扣费）
    - `notifications/`：通知（当前用 console 适配器，仅记录日志）
    - `health/`：健康检查（`/api/health`）
    - `common/`：`PrismaService`、`TenantContext`、通用拦截器/守卫/装饰器
  - 数据访问：`prisma/schema.prisma` 中定义了所有表结构，并通过 **Prisma Migrations** 管理历史变更（见 `apps/api/prisma/migrations/`，每次 schema 调整必须落 migration，保证 Docker/生产可平滑升级）。
  - 启动方式（容器内）：
  - 自动运行 `prisma migrate deploy` 应用迁移，然后执行 `npm run seed` 写入开发环境基础数据（`acme` 租户 + `founder@yoursaas.com` 用户 + 一组智能家居常见分类及推荐费用 + 一组默认员工类型），最后启动 NestJS。
    - 对外暴露：`http://localhost:3000/api`，Swagger：`http://localhost:3000/docs`。
  - 多租户隔离实现（与《项目审查报告_多商户隔离架构》结论一致）：
    - **数据库层**：所有业务表都包含 `tenantId` 字段，并通过外键、唯一索引（例如 `@@unique([tenantId, employeeId, yearMonth])`）保证行级隔离和数据完整性。
    - **应用层**：使用 `AsyncLocalStorage` 的 `TenantContextService` 保存每个请求的租户上下文，`TenantGuard` 通过 `X-Tenant-ID` 头和 `Membership` 关系验证用户是否属于该租户，防止跨租户访问。
    - **数据访问层**：`PrismaService` 提供 `getTenantWhere/getTenantData` 辅助方法，确保所有查询和写入都自动带上 `tenantId` 过滤/填充，减少遗漏风险。

- `apps/web/`（Web 管理后台）
  - 技术栈（以代码为准）：Vite + React 19 + TypeScript + Ant Design 6 + React Router 7 + Zustand + Axios
  - 当前状态：
    - 已搭建整体布局：左侧分组导航菜单 + 顶部工具栏 + 内容区域，支持深浅色主题切换与当前租户信息展示。
    - 已实现页面骨架（均为最小可用占位，后续逐个填充业务）：
      - 登录页：账号+密码登录（先对接后端现有登录接口，后续再替换为手机号+验证码登录方案）
      - `工作台 /dashboard`：数据总览页面，包含本月营收/新增订单/活跃员工/待处理预警等关键指标卡片；**已接入后端统计接口**（`GET /api/dashboard/overview`）展示真实数据
      - `岗位管理 /positions`：已实现 Web CRUD，并对接后端接口
      - `员工管理 /employees`：已实现 Web CRUD，并对接后端接口；支持为员工选择“员工类型”（用于消息端 Skill 挂载/路由），并支持**绑定租户成员账号**以启用员工端 `/api/*/my` 与 `GET /api/employees/my-profile`
      - `商品管理 /products`：已实现 Web CRUD，并对接后端接口；支持“分类管理”对话框维护商品分类及推荐安装/调试/售后费用，新建商品时可按分类自动带出推荐费用（仍可按单个商品覆写）
      - `项目管理 /projects`：已实现 Web CRUD（含标准产品清单维护），并对接后端接口
      - `销售上报 /sales-orders`：已实现最小可用（列表+新增+删除），并对接后端接口
      - `技术上报 /installation-records`：已实现最小可用（列表+新增+删除），并对接后端接口
      - `测量工勘 /measurement-surveys`：已实现最小可用（列表+新增），并对接后端接口
      - `窗帘下单 /curtain-orders`：已实现基础版（列表+新增，房间数量动态表单），并对接后端接口
      - `工资结算 /salary`：已实现最小可用（按月结算+列表+审批/发放），并对接后端接口
      - `预警中心 /alerts`：已实现最小可用（运行比对+列表+标记处理），并对接后端接口
      - Excel 导入导出入口：员工/商品/项目页面右上角提供“导入/导出 Excel”按钮
    - 布局与主题：
      - 左侧为整体可折叠侧边栏：默认展开时采用“一级菜单（组织架构/业务管理/业务上报/财务与风控）+ 二级菜单项”的结构，并默认展开显示全部二级项；点击顶部按钮折叠侧栏后，二级菜单会随侧栏一并收起，仅保留一级/叶子菜单图标（hover 显示 tooltip），折叠效果与 `需求资料/smartsalary-saas` 模版一致，并在桌面/平板/手机上均支持响应式适配。
      - 顶部工具栏：左侧为侧栏折叠/展开按钮，中间仅居中展示系统标题 **智能家居行业SAAS管理系统**（标题与侧栏 Logo 均可在“系统设置 /settings → 基础设置”中修改，仅影响前端展示），右侧提供主题切换按钮（浅色/深色）与当前租户下拉菜单。
    - 全局状态：使用 Zustand 存储 JWT、当前租户 ID 和基础 UI 状态（主题 / 系统名称 / Logo），并自动在 Axios 请求头中附带 `Authorization` + `X-Tenant-ID`。
    - 请求与错误处理规范：
      - 所有接口统一通过 `apps/web/src/api/http.ts` 的 Axios 实例调用，集中附加认证头与多租户头。
      - 401：统一在拦截器中执行登出 & 跳转登录页，避免各页面重复处理。
      - 其他错误：优先使用后端返回的 `message` 字段做 Ant Design 全局错误提示；若无 `message`，则按 HTTP 状态码显示短中文提示（如 400 参数错误、403 无权限、404 资源不存在、500 服务器错误），保证用户体验一致。
  - 容器内通过 Nginx 提供静态文件，并反向代理 `/api` 到后端容器。

- `src-tauri/`（Tauri 桌面端）
  - Rust/Tauri 相关代码与打包配置：
    - Rust 入口：`src-tauri/src/main.rs`、库入口：`src-tauri/src/lib.rs`
    - 配置：`src-tauri/tauri.conf.json`、依赖：`src-tauri/Cargo.toml`、锁文件：`src-tauri/Cargo.lock`
  - v1.1.2 关键点：
    - Windows bundle 配置包含 `wix`（MSI）与 `nsis`（EXE）语言选项
    - Shell 权限已切到 Tauri 2.0 的 `plugins.shell.scope`

- `desktop/`（桌面版启动/本地数据方案）
  - 包含本地启动脚本：`desktop/start.bat`、`desktop/start.sh`，以及本地数据目录（`desktop/data/`）与说明文档。

- `infra/`（部署与运维）
  - `docker-compose.yml`：统一编排所有核心服务：
    - `postgres`：PostgreSQL 数据库（数据库名 `salary`，数据卷持久化）。
    - `redis`：Redis 缓存（后端用于限流/缓存，可按需使用）。
    - `minio`：对象存储（S3 兼容，用于存放收款截图、安装现场照片等附件）。
    - `minio-init`：初始化 MinIO（创建 `salary-uploads` bucket 并设置匿名只读），方便直接访问图片。
    - `api`：后端 NestJS 服务容器，自动迁移数据库并暴露 `/api`。
    - `web`：Web 管理后台容器，基于 Nginx 提供前端页面，并通过 `/api` 反代到 `api`。

- `docs/`（公开文档）
  - 当前仅保留与桌面打包相关的公开文档：`docs/TAURI_BUILD.md`。

---

### 启动与访问（开发/试用环境）
1. **准备环境**
   - 安装 Docker Desktop（或兼容的 Docker 环境）。

2. **一键启动**

   ```bash
   docker compose -f infra/docker-compose.yml up -d --build
   ```

3. **访问入口**
   - **Web 管理后台**：`http://localhost:5173`  
   - 登录方式：当前为邮箱+密码登录（开发环境种子用户：`founder@yoursaas.com`，密码：`password`）。
   - 租户：登录后需要填写“所属公司”标识（slug，仅限英文字母或数字）。前端会通过 `/api/tenants/slug/{slug}` 获取租户 ID 并写入 `X-Tenant-ID` 请求头（为避免信息泄漏，登录页不再默认展示默认值）。
     - **开发环境种子租户号（slug）**：`acme`
   - **后端 API**：`http://localhost:3000/api`
   - **接口文档（Swagger）**：`http://localhost:3000/docs`
   - **对象存储控制台（MinIO）**：`http://localhost:9001`（默认账号/密码：`minioadmin` / `minioadmin`）
  - **OpenClaw Control UI**：`http://localhost:18789/`（用于消息端智能体联调与管理）

#### 开发 Compose 端口与服务清单（以 `infra/docker-compose.yml` 为准）

> 原则：**端口/服务定义以 compose 文件为唯一真实来源**，文档只做“面向维护”的稳定摘要；如后续改端口，只需要改 compose，并同步更新本表即可。

| 服务 | 容器名（dev） | 对外端口 | 说明 |
|------|---------------|----------|------|
| Web（Nginx 静态站点 + /api 反代） | `salary_web` | `5173 -> 80` | 浏览器访问入口 |
| API（NestJS） | `salary_api` | `3000` | API 前缀 `/api`，Swagger `/docs` |
| PostgreSQL | `salary_postgres` | `5432` | 开发期映射端口，生产默认不映射 |
| Redis | `salary_redis` | `6379` | 开发期映射端口，生产默认不映射 |
| MinIO（S3 兼容） | `salary_minio` | `9000/9001` | `9001` 为控制台（生产建议不暴露） |
| OpenClaw Gateway | `salary_openclaw_gateway` | `18789` | Control UI（生产建议不暴露） |

#### Web → API 的 BaseURL 规则（避免环境漂移）

- **Docker/默认**：`apps/web` 通过 Nginx 反代 `/api/*` 到 `api:3000`（见 `apps/web/nginx.conf`），因此前端默认 `baseURL=/api` 可用。
- **本地前端开发（非 Docker）**：前端请求基址由 `apps/web/src/api/http.ts` 读取 `import.meta.env.VITE_API_BASE`，未设置时默认 `/api`。  
  - 如果你用 Vite dev server 直连后端（3000），可以在本机环境变量中设置：`VITE_API_BASE=http://localhost:3000/api`。

#### 环境变量的“权威来源”约定（必须按此维护）

- **开发 compose 环境**：以 `infra/docker-compose.yml` 中的 `services.api.environment` 为准（包含 `DATABASE_URL/REDIS/S3/JWT/FRONTEND_URL` 等）。
- **生产 compose 环境**：以 `infra/.env.prod` + `infra/docker-compose.prod.yml` 为准。
- `apps/api/.env.example` 属于上游模板遗留参考（字段更全，但不一定与本项目 compose 完全一致）；真正运行时请以 `infra/` 下的配置为准，避免“文档看起来对、实际容器跑不起来”的维护事故。

> 说明：容器启动时会自动执行 Prisma 迁移（包括多租户基础表和当前已建的业务表），无需手工建表。
> 说明：`minio-init` 是一次性初始化容器，用于创建 bucket 并设置访问策略；成功后会显示 Exited(0)，属于正常状态。

---

### 云服务器部署与后续升级策略（伙伴实环境）

#### 首次部署（伙伴云服务器）

1. **准备云服务器**
   - 为每个公司单独购买一台云服务器（例如 2C/4G/40G SSD 起步），安装：
     - Linux 发行版（Ubuntu 22.04 / Debian 12 等）
     - Docker / Docker Compose（或 `docker compose` 插件）

2. **拉取代码与配置生产环境变量**
   - 把本仓库代码拉到云服务器（推荐使用私有 Git 仓库）：
     ```bash
     git clone <your-private-repo-url> smart-home-salary
     cd smart-home-salary
     ```
   - 基于模板创建生产环境变量文件：
     ```bash
     cp infra/.env.prod.example infra/.env.prod
     ```
   - 编辑 `infra/.env.prod`，为以下字段设置**强随机值**并补齐域名配置：
     - 数据库 / Redis / MinIO / JWT / OpenClaw 等密钥：`POSTGRES_PASSWORD`、`MINIO_ROOT_PASSWORD`、`JWT_*`、`OPENCLAW_GATEWAY_TOKEN` 等
     - 域名与 CORS：`FRONTEND_URL`、`CORS_ORIGIN`、`S3_PUBLIC_BASE_URL` 等

3. **使用生产 compose 启动服务**
   - 在云服务器上执行：
     ```bash
     docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build
     ```
   - 首次启动时，API 容器会自动执行 `prisma migrate deploy`，创建所有表结构；随后会按照 `seed.ts` 写入基础数据（租户/用户/基础配置）。

4. **配置域名与 HTTPS**
   - 在云厂商控制台配置域名解析到该云服务器；
   - 使用云负载均衡或自建 Nginx/Caddy 终止 TLS：
     - 80/443 → 反代到 `web` 容器 80 端口；
     - `/api` 在反代层转发到 `api` 容器 3000 端口（内部网络），避免直接暴露 3000。

#### 后续升级（保持兼容的快速迭代）

1. **本地开发与验证**
   - 所有新功能（包括 Excel/JSON、Dashboard、预警规则、OpenClaw 集成等）先在本机开发，并通过：
     - `docker compose -f infra/docker-compose.yml up -d --build`（开发 compose）验证；
     - Swagger 自检 + README 中的“Web 功能逐一验收清单”核对。
   - 仅在**开发环境完全通过**后，再推送到远程仓库。

2. **云服务器拉取最新版本**
   - 伙伴在云服务器上进入项目目录：
     ```bash
     cd smart-home-salary
     git pull
     ```
   - 如果你使用了 Git Tag 管理版本，建议伙伴切到指定 tag（例如 `v2026.03.1`），确保云环境始终运行经过你验证的版本。

3. **滚动升级（自动迁移 + 重建镜像）**
   - 在云服务器上执行与首次部署相同的命令：
     ```bash
     docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build
     ```
   - 该命令会：
     - 重新构建 `infra-api` / `infra-web` 镜像；
     - 重启 `api` / `web` 容器；
     - 在 `api` 容器启动时自动执行 `prisma migrate deploy`，确保数据库 schema 与最新代码同步（**只做前向迁移，不回滚**）。

4. **兼容性与 schema 变更约定**
   - 为保证伙伴已部署环境可以安全升级，本项目在数据库层遵循：
     - **前向、兼容性优先**：优先通过“新增字段/表”的方式演进 schema，避免直接删除字段或改变字段含义。
     - 如确需做破坏性变更（删除字段、拆表等），必须：
       - 在 README / 变更说明中明确标注；
       - 提供安全的数据迁移脚本与清晰的升级步骤。
   - 伙伴侧不应直接修改服务器上的源码或容器配置，而是始终通过：
     - 从仓库拉取你已验证的版本 → `docker compose ... up -d --build` 完成升级。

5. **多公司多环境**
   - 每个公司一套独立云服务器 + 独立 `infra/.env.prod`，保证：
     - 物理级隔离（不同云主机）；
     - 应用层多租户隔离（tenantId + Membership + RBAC）。
   - 若后续需要灰度/预发布环境，可在同一云账号下增加一台“预发布服务器”，使用相同 compose 文件但不同域名/IP。

> 实际操作上，你只需为伙伴提供：代码仓库访问权限 + 一份最新的 `README` 部署与升级说明（本节），伙伴即可在自己的云服务器上完成首发与后续自助升级；你这边则保持在开发环境内的持续演进与回归测试，确保每一个提交版本都能在伙伴环境上平滑升级。

---

### 演示真实数据注入（用于验收/演示，可一键清理）

为确保每个板块都有“可见的真实数据”，并让首页工作台统计卡片展示真实值，仓库提供了**演示数据注入脚本**（只写入带 `TEST-` / `TESTDATA` 标记的数据，且演示账号统一使用 `@demo.local` 邮箱，便于后续安全清理）。

- **注入演示数据（推荐在容器内执行）**：

```bash
docker exec -i salary_api npm run seed:testdata
```

- **清理演示数据（只删除 demo 账号与 TESTDATA 数据，不影响你的真实数据）**：

```bash
docker exec -i salary_api npm run seed:cleanup-testdata
```

注入后会生成以下演示账号（密码统一为 `password`），并为每个账号绑定一个员工档案（确保 `/api/employees/my-profile` 与 `/api/*/my` 可用）：
- `admin@demo.local`（管理员，含与其员工关联的销售上报）
- `sales@demo.local`（销售，含与其员工关联的销售上报）
- `technician@demo.local`（技术，含与其员工关联的安装记录）
- `finance@demo.local`（财务，含与其员工关联的工资单）
- `guide@demo.local`（运营指导，含与其员工关联的销售上报）

注入的业务数据覆盖：岗位/员工/员工类型/商品/项目/销售订单/安装记录/测量工勘/窗帘下单/预警/工资单；首页 `工作台` 会根据这些真实数据展示统计值。

---

### 数据库备份与恢复（管理员运维能力，推荐用脚本+定时任务）

为保证**长期稳定**与**可审计**，数据库备份/恢复不建议做成“系统设置里的 Web 按钮”（高风险：误点覆盖、权限绕过、浏览器断连导致半失败等）。本项目提供稳健的运维脚本，管理员可在服务器上执行并加入定时任务。

- **一键备份（Postgres + MinIO 对象）**：

```bash
./infra/backup/backup.sh ./backups
```

说明：
- Postgres 生成：`./backups/pg/salary_<timestamp>.dump`
- MinIO 对象镜像：`./backups/minio/<bucket>/`
- 默认保留最近约 5 周：可通过 `RETENTION_DAYS=35` 控制（脚本会自动清理过旧 dump，避免硬盘增长）

- **从备份恢复（导入）Postgres**：

```bash
./infra/backup/restore.sh ./backups/pg/salary_<timestamp>.dump
```

- **每周定时备份 + 按月滚动覆盖（示例）**：
  - 参考 `infra/backup/crontab.example`，用系统 `cron` 每周执行一次备份，保留 35 天自动覆盖旧 dump。


---

### 生产部署安全与上线前验收（必须逐项确认）

> 你的目标是“每个公司一套独立云服务器，彼此物理隔离”。本项目同时具备**应用层多租户隔离**（`X-Tenant-ID` + Membership 校验 + 所有表 tenantId）与**部署层隔离**（每公司独立部署）。生产必须按以下清单收紧配置，避免默认开发配置带来的安全风险。

#### 0) 一句话原则
- **公网只开放 80/443**（或只开放负载均衡），**绝不直接暴露** Postgres/Redis/MinIO 端口。
- **所有密钥必须强随机**（JWT/DB/MinIO/OpenClaw），不得使用默认值。
- **Swagger 默认关闭**；如必须启用，则加鉴权或 IP 白名单。

#### 1) 安全组/防火墙（云控制台逐项核对）
- **入站规则**：
  - 允许：`80/tcp`、`443/tcp`
  - 禁止：`5432/tcp`、`6379/tcp`、`9000/tcp`、`9001/tcp`、`3000/tcp`、`18789/tcp`（除非你明确用内网/白名单运维）
- **出站规则**：按需开放（若使用外部邮件/短信/对象存储等第三方服务，需允许相应出站）

#### 2) 生产 compose（推荐）
- 生产使用 `infra/docker-compose.prod.yml` + `infra/.env.prod`（模板见 `infra/.env.prod.example`）
- **关键点**：
  - DB/Redis/MinIO **不映射 ports**
  - API **不映射 ports**（建议同域反代 `/api`）
  - `SWAGGER_ENABLED=false`
  - `FRONTEND_URL/CORS_ORIGIN` 设置为你的域名

启动示例：

```bash
cp infra/.env.prod.example infra/.env.prod
# 编辑 infra/.env.prod，替换所有 REPLACE_* 为强随机值
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build
```

#### 3) HTTPS / 域名（云控制台逐项核对）
- **必须**：全站 HTTPS（证书建议由云负载均衡或反向代理终止 TLS）
- **建议**：同域部署（Web 与 API 同一域名，通过反代 `/api` 转发），可大幅简化 CORS 与安全边界

#### 4) Swagger / CORS（生产安全开关）
- Swagger：
  - 默认：生产 `SWAGGER_ENABLED=false`
  - 若开启：只允许内网或白名单访问 `/docs`
- CORS：
  - 生产必须显式设置：`FRONTEND_URL`（或 `CORS_ORIGIN`）

#### 5) 备份与恢复演练（防数据丢失）
- **备份脚本**：`infra/backup/backup.sh`（Postgres dump + MinIO bucket mirror）
- **恢复演练文档**：`infra/backup/restore.md`
- **最低要求**：
  - 每日备份（至少保留 7～30 天）
  - 每月至少演练 1 次恢复（抽样验证：岗位/员工/项目/订单/安装记录/工资/附件 URL）

#### 6) 多云适配说明（阿里云/腾讯云/AWS/华为云通用）

本项目对云厂商**无强绑定**，差异主要在“网络入口与托管服务”的选型上：
- **网络入口**：推荐使用各云的负载均衡（SLB/CLB/ALB/ELB）或自建 Nginx/Caddy 终止 TLS，并同域反代 `/api` 到 `api` 服务。
- **安全组/防火墙**：各云控制台名称不同，但原则一致：公网仅开 `80/443`；数据库/Redis/对象存储端口仅内网可达。
- **数据库**：可用自建 Postgres（容器）或各云 RDS；若上 RDS，记得关闭公网访问、启用自动备份、设置保留周期并演练恢复。
- **对象存储**：开发期用 MinIO；生产可替换为 OSS/COS/S3/OBS（只需配置 `S3_*` 环境变量）。建议使用私有桶 + 预签名 URL（高级），或至少确保对象 key 不可预测并按租户前缀隔离。

### OpenClaw（Docker）部署与联调说明

本项目的 `infra/docker-compose.yml` 已包含 OpenClaw Gateway，便于在客户云服务器上做到“工资系统 + OpenClaw”一键部署联调。

- **默认端口**：`18789`
- **Skills 注入**：本仓库根目录 `skills/` 会以只读方式挂载到 OpenClaw workspace 的 `skills/` 目录（workspace skills 优先级最高）
- **重要配置（生产环境必须修改）**：
  - `infra/docker-compose.yml` 中的 `OPENCLAW_GATEWAY_TOKEN` 默认为占位值，生产部署必须替换为强随机 token 并安全保存
  - 生产建议使用 `infra/docker-compose.prod.yml`：默认不对公网暴露 OpenClaw Control UI 端口（避免被扫描/爆破），需要时用 VPN/内网/白名单访问

#### 员工类型（EmployeeType）与 Skills 的匹配规则（保证“每类员工用各自 Skill”）

后端的 `EmployeeType.skillTags` 用于描述该类型员工在消息端可用的技能标签；OpenClaw 侧应按如下方式完成“自动匹配”：

1. OpenClaw 登录后，调用 `GET /api/employees/my-profile` 获取当前用户绑定的员工档案与 `employeeType.skillTags`
2. 将 `skillTags` 作为路由依据：
   - 若包含 `sales`：优先路由到 `skills/member-sales`
   - 若包含 `technician`：优先路由到 `skills/member-technician`
   - 若包含 `salary` 或出现“工资”意图：路由到 `skills/member-salary`
   - 若包含 `admin`/`guide` 或出现管理意图：路由到 `skills/admin-guide`
   - 无法判定：先由 `skills/employee-skill-router` 做意图分类与最小确认，再路由到具体岗位 Skill

本仓库默认内置的员工类型（`apps/api/prisma/seed.ts`）与建议路由如下（所有 skillTags 均在“员工类型”页面通过**下拉多选**配置，避免手工拼写出错）：

| employeeType.key | 员工类型 | skillTags（示例） | 建议 Skills |
|---|---|---|---|
| `sales` | 销售 | `member,sales` | `employee-skill-router` → `member-sales` / `member-salary` |
| `technician` | 安装工程师 | `member,technician` | `employee-skill-router` → `member-technician` / `member-salary` |
| `after_sales` | 售后 | `member,technician` | `employee-skill-router` → `member-technician` / `member-salary` |
| `pm` | 项目经理 | `admin,guide` | `admin-guide`（管理引导为主） |

> 注意：`skills/*/SKILL.md` 中写的“可按月份过滤”已按当前后端实现修正为“服务端返回全部记录，按 occurredAt 客户端筛选月份”。如后续需要服务端按 `yearMonth` 过滤，可再扩展 API。

#### 健康检查（无需鉴权）

```bash
docker compose -f infra/docker-compose.yml ps

# 也可以做一次鉴权的深度健康检查（包含 gateway 与 channels 诊断）
docker compose -f infra/docker-compose.yml exec openclaw-gateway node dist/index.js health --token "你的OPENCLAW_GATEWAY_TOKEN"
```

#### Control UI 授权与设备配对（常见“unauthorized / pairing required”）

OpenClaw 在 Docker 中需要通过 token 与设备审批完成配对。项目内提供了可选的 CLI 容器（通过 compose profile `tools` 启用，按需运行即可）：

```bash
docker compose -f infra/docker-compose.yml --profile tools run --rm openclaw-cli dashboard --no-open
docker compose -f infra/docker-compose.yml --profile tools run --rm openclaw-cli devices list
docker compose -f infra/docker-compose.yml --profile tools run --rm openclaw-cli devices approve <requestId>
```

说明：

- `dashboard --no-open` 会输出可用于打开 Control UI 的链接
- 若你在浏览器看到“pairing required”，通常需要用 `devices approve` 审批对应的 requestId

### 数据与文件存储策略
- **数据库（PostgreSQL）**
  - 所有业务数据（员工、岗位、商品、项目、销售单、安装记录、工资、预警等）统一存放在 `salary` 库。
  - 采用 Prisma Migrations 管理结构变更，确保后续升级可回放。
  - 多租户隔离通过所有业务表上的 `tenantId` 字段实现，服务端在查询/写入时自动附加当前租户。

- **缓存（Redis）**
  - 用于限流、缓存部分查询结果、未来可用于队列等，不持久存储业务真相数据。

- **图片/附件（MinIO）**
  - 所有收款截图、安装现场照片、其他附件统一上传到 Bucket：`salary-uploads`。
  - 通过 S3 协议访问，后端保存对象键和外链 URL，前端/iOS 只使用 URL，不直接持久化文件。
  - 上传方式（已落地，便于 iOS/消息端复用）：
    - `POST /api/uploads/payment-proofs`：上传收款凭证图片（返回 `{ url, objectKey, contentType, bytes }`，将 `url` 写入 `SalesOrder.paymentProofUrls`）
    - `POST /api/uploads/installation-photos`：上传施工照片图片（同上，将 `url` 写入 `InstallationRecord.photoUrls`）
    - `POST /api/uploads/videos`：上传视频（同上，可按需写入备注或扩展字段）
  - 限制说明（MVP）：
    - 服务端强制校验 **文件类型** 与 **大小**（图片 5MB、视频 50MB）
    - “视频时长/码率/压缩策略”建议在 iOS 端本地完成（符合移动端体验与带宽成本），服务端不做时长解码校验

---

### iOS 应用与“OTA”策略（规划说明，当前不开发代码）
- **开发指南**：详细的 iOS 开发规范、架构设计、API 映射及 OpenClaw 集成策略请参考 [iOS_Developer_Guide_2026.md](需求资料/iOS_Developer_Guide_2026.md)。
- **当前阶段**：只实现 Web + API，确保所有业务逻辑、计算规则、预警机制在服务器端闭环可用。
- **后续 iOS**：
  - 使用 SwiftUI + MVVM + async/await 直接调用当前 API。
  - 登录改为“手机号 + 验证码”，后端新增对应接口（保持与 Web 管理端共用同一权限/租户体系）。
- **“OTA” 的实现方式（符合 2026 年 App Store 审核要求）**：
  - 不做原生代码热更新；所有“快速调整”的内容（提成跳点、折扣档位、难度系数、预警阈值、表单字段和校验规则等）通过后端配置 + Feature Flags 下发。
  - iOS 端通过 TestFlight + App Store 正常发版升级客户端代码。

#### iOS 应用开发 - API 接口清单（员工端 MEMBER 角色可直接复用）

所有需认证的请求需携带：`Authorization: Bearer <accessToken>`、`X-Tenant-ID: <tenantId>`。详细请求体与 Swift 示例见 [iOS_Developer_Guide_2026.md](需求资料/iOS_Developer_Guide_2026.md)。

| 用途 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 登录 | POST | `/api/auth/login` | 请求体：`{ email, password }`，返回 `{ accessToken, refreshToken }` |
| 刷新 Token | POST | `/api/auth/refresh` | 请求体：`{ refreshToken }` |
| 登出 | POST | `/api/auth/logout` | 请求体：`{ refreshToken }`，204 |
| 修改密码 | POST | `/api/auth/change-password` | 请求体：`{ currentPassword, newPassword }`，需 Authorization，所有账号均可修改自己的密码 |
| 切换租户 | POST | `/api/auth/switch-tenant` | 请求体：`{ tenantId }`，返回新 Token |
| 当前用户 | GET | `/api/users/me` | 返回 `{ id, email, displayName, tenants: [{ id, name, slug, role }] }` |
| 租户 by slug | GET | `/api/tenants/slug/{slug}` | **需 Authorization**。获取租户 ID，用于 `X-Tenant-ID` |
| 我的员工档案 | GET | `/api/employees/my-profile` | **需先绑定员工档案**（Membership → Employee）。返回 `employeeType.skillTags` 供 iOS/OpenClaw 路由 |
| 我的销售列表 | GET | `/api/sales-orders/my` | 返回当前员工全部订单（可按 occurredAt 客户端筛选） |
| 我的销售上报 | POST | `/api/sales-orders/my` | 无需 employeeId。请求体：`{ projectId, amount, discountRate, remark?, occurredAt?, paymentProofUrls?, items? }` |
| 我的技术列表 | GET | `/api/installation-records/my` | 返回当前员工全部记录（可按 occurredAt 客户端筛选） |
| 我的技术上报 | POST | `/api/installation-records/my` | 无需 employeeId。请求体：`{ projectId, productId, serviceType, quantity, difficultyFactor?, description?, occurredAt?, photoUrls? }` |
| 我的工资 | GET | `/api/salaries/my` | 可选 `?yearMonth=YYYY-MM` |
| 项目列表（消歧） | GET | `/api/projects` | 可选 `?q=关键词&limit=3` |
| 商品列表（消歧） | GET | `/api/products` | 可选 `?q=关键词&limit=3` |
| 上传收款凭证 | POST | `/api/uploads/payment-proofs` | multipart 字段 `file`，返回 `{ url, objectKey, contentType, bytes }`，业务写入用 `url` |
| 上传施工照片 | POST | `/api/uploads/installation-photos` | 同上 |
| 上传视频 | POST | `/api/uploads/videos` | 同上 |
| 工作台总览 | GET | `/api/dashboard/overview` | 返回本月营收、订单数量、在职员工数、待处理预警数，用于工作台四个总览卡片 |
| 工作台营收趋势 | GET | `/api/dashboard/revenue-trend` | 按月营收趋势（默认最近 6 个月），用于工作台折线/面积图 |
| 工作台安装分布 | GET | `/api/dashboard/installation-breakdown` | 按商品分类汇总安装数量（默认最近 7 天），用于工作台柱状图 |
| 工作台近期销售 | GET | `/api/dashboard/recent-sales` | 近期销售动态列表（默认 10 条） |
| 工作台近期安装 | GET | `/api/dashboard/recent-installations` | 近期安装记录列表（默认 10 条） |

---

### 开发节奏与后续工作（简要）
当前已完成（代码层面）：
- 后端基础：多租户/认证/RBAC/Feature Flags/Audit/Health 等基础能力。
- 业务表结构：岗位、员工、商品、项目、项目清单、销售订单及明细、安装记录、工资、预警。
- 业务 API：岗位管理、员工管理、商品管理、项目管理（含标准产品清单）、销售上报（销售订单+明细）、技术上报（安装/调试/售后记录）、预警中心（运行比对/查询/处理）、工资结算（按月结算/查询/审批/发放）（全部具备租户隔离与权限控制）。
- Excel 模块：员工/商品/项目/销售订单导入导出接口 + 前端入口已落地。
- 单元测试：核心模块（`TenantGuard`、`SalariesService`、`AlertsService`）已补充单元测试，e2e 测试通过。
- 部署：Docker Compose 一键拉起 Postgres + Redis + MinIO + API + Web，并已验证 Web→API→DB 全链路可用。

后续将按以下顺序持续补齐（不会超出 `需求资料/` 中定义的范围）：
1. 补齐 Dashboard：后端统计接口（本月项目/订单/预警/工资汇总）+ 前端工作台可视化。
2. 工资单明细扩展：在保留当前 `Salary` 表结构前提下，通过附加接口返回更细粒度的工资拆解（销售总额/实收款/平均折扣/基础提成 vs 跳点提成/按岗位拆分补贴等），以满足“工资明细”展示需求。
3. 手机号+验证码登录接口：满足 iOS 员工端“手机号登录”需求（当前 Web 继续使用邮箱+密码登录）。
4. 在 Web+API 验收通过后，再启动 iOS 端开发与上架流程。

本机自检与一致性检查（建议按此清单核对）：
- 服务是否正常：
  - `docker compose -f infra/docker-compose.yml ps --all`
  - 期望：`api/web/postgres/redis/minio` 为 Up；`minio-init` 显示 Exited(0) 属于正常。
- API 路由是否齐全（以 Swagger 为准）：
  - 打开 `http://localhost:3000/docs`，检查是否存在 `Positions/Employees/Employee Types/Products/Product Categories/Projects/Sales Orders/Installation Records/Alerts/Salaries/Uploads/Excel` 等分组与接口。
- 多租户请求头是否生效：
  - 登录 Web 后，在浏览器开发者工具 Network 中查看请求头是否包含 `Authorization` 与 `X-Tenant-ID`。
  - 也可用 curl 快速验证（返回 200 即可）：

```bash
# 登录拿 token（开发环境种子账号）
TOKEN_JSON=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"founder@yoursaas.com","password":"password"}')
ACCESS_TOKEN=$(echo "$TOKEN_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).accessToken||""));')

# 获取租户 id（以 acme 为例）
TENANT_ID=$(curl -s http://localhost:3000/api/tenants/slug/acme \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).id||""));')

curl -s -o /dev/null -w "products:%{http_code}\n" http://localhost:3000/api/products \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-Tenant-ID: $TENANT_ID"
curl -s -o /dev/null -w "measurement-surveys:%{http_code}\n" http://localhost:3000/api/measurement-surveys \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-Tenant-ID: $TENANT_ID"
curl -s -o /dev/null -w "curtain-orders:%{http_code}\n" http://localhost:3000/api/curtain-orders \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-Tenant-ID: $TENANT_ID"
```

#### Web 功能逐一验收清单（按顺序执行，确保无报错）

**前置**：访问 `http://localhost:5173`，使用 `founder@yoursaas.com` / `password` 登录，租户 slug 填 `acme`。

| 序号 | 页面 | 功能按钮 | 操作步骤 | 预期结果 |
|------|------|----------|----------|----------|
| 1 | 岗位管理 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 2 | 岗位管理 | 新增岗位 | 点击新增 → 填写名称/底薪/提成 JSON → 保存 | 提示“已创建”，列表出现新记录 |
| 3 | 岗位管理 | 编辑 | 点击某行编辑 → 修改后保存 | 提示“已更新” |
| 4 | 岗位管理 | 删除 | 点击某行删除 → 确认 | 提示“已删除”，记录消失 |
| 5 | 员工管理 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 6 | 员工管理 | 导出 Excel | 点击导出 Excel | 下载 employees.xlsx |
| 7 | 员工管理 | 导入 Excel | 点击导入 Excel → 选择 xlsx 文件 | 提示“导入完成” |
| 8 | 员工管理 | 新增员工 | 点击新增 → 填写姓名/手机/岗位/入职日期等 → 保存 | 提示“已创建” |
| 8.1 | 员工管理 | 绑定账号（员工端 /my 能力） | 编辑员工 → 选择“绑定账号（用于 iOS/OpenClaw /my 能力）” → 保存 | 该账号可调用 `GET /api/employees/my-profile` 与 `/api/*/my` 系列接口 |
| 9 | 员工管理 | 编辑 | 点击某行编辑 → 修改（含员工类型）→ 保存 | 提示“已更新” |
| 10 | 员工管理 | 删除 | 点击某行删除 → 确认 | 提示“已删除” |
| 11 | 员工类型 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 12 | 员工类型 | 新增/编辑/删除 | 新增一个类型并设置 skillTags（例如 member,sales）→ 保存；再编辑/删除 | 操作成功提示，无报错 |
| 13 | 商品管理 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 14 | 商品管理 | 分类管理 | 点击分类管理 → 新增/编辑/删除分类 | 弹窗正常，保存无报错 |
| 15 | 商品管理 | 导出/导入 Excel | 同员工管理 | 下载/导入成功 |
| 16 | 商品管理 | 新增/编辑/删除商品 | 同岗位管理 | 增删改均成功 |
| 17 | 项目管理 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 18 | 项目管理 | 导出/导入 Excel | 同员工管理 | 下载/导入成功 |
| 19 | 项目管理 | 新增项目 | 点击新增 → 填写名称/客户/合同金额等 → 可选添加产品清单 → 保存 | 提示“已创建” |
| 20 | 项目管理 | 编辑 | 点击某行编辑 → 修改（含产品清单）→ 保存 | 提示“已更新” |
| 21 | 项目管理 | 删除 | 点击某行删除 → 确认 | 提示“已删除” |
| 22 | 销售上报 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 23 | 销售上报 | 导出/导入 Excel | 同员工管理 | 下载/导入成功 |
| 24 | 销售上报 | 新增订单 | 点击新增 → 选择项目/员工/金额/折扣等 → 可选添加商品明细 → 保存 | 提示“已创建” |
| 25 | 销售上报 | 编辑 | 点击某行编辑 → 修改 → 保存 | 提示“已更新” |
| 26 | 销售上报 | 删除 | 点击某行删除 → 确认 | 提示“已删除” |
| 27 | 技术上报 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 28 | 技术上报 | 新增记录 | 点击新增 → 选择项目/员工/商品/类型/数量等 → 保存 | 提示“已创建” |
| 29 | 技术上报 | 编辑 | 点击某行编辑 → 修改 → 保存 | 提示“已更新” |
| 30 | 技术上报 | 删除 | 点击某行删除 → 确认 | 提示“已删除” |
| 31 | 预警中心 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 32 | 预警中心 | 运行比对 | 选择项目 → 点击运行比对 | 提示“已运行比对并生成预警” |
| 33 | 预警中心 | 标记已处理 | 点击某条未处理预警的“标记已处理” | 提示“已标记处理” |
| 34 | 预警中心 | 应用过滤 | 选择项目/级别/仅未处理 → 点击应用过滤 | 列表按条件刷新 |
| 35 | 工资结算 | 刷新 | 点击刷新 | 列表加载，无报错 |
| 36 | 工资结算 | 运行结算 | 选择月份 → 点击运行结算 | 提示“已结算生成工资单” |
| 37 | 工资结算 | 审批 | 点击某条草稿的“审批” | 提示“已审批” |
| 38 | 工资结算 | 标记发放 | 点击某条已审批的“标记发放” | 提示“已标记发放” |
| 39 | 工资结算 | 应用过滤 | 选择月份/状态 → 点击应用过滤 | 列表按条件刷新 |
| 40 | OpenClaw 联调 | 刷新自检 | 打开 OpenClaw 联调页 → 点击刷新自检 | health OK；my-profile 能返回并显示 skillTags（如该账号已绑定员工） |

**注意**：岗位/员工/商品/项目需先有数据，销售上报/技术上报才能选择；预警需先有销售和技术记录才能生成；工资需先有岗位/员工/销售/技术数据才能结算。

Web 界面与响应式验收（已全部适配，建议按此清单核对）：
- 岗位/员工/商品/项目/销售/技术/工资/预警：所有列表表格已加 `scroll={{ x: 'max-content' }}`，窄屏可水平滚动
- 各页头部操作区（刷新/新增/导入导出等）：已加 `Space wrap`，窄屏自动换行
- 预警中心/工资结算：筛选区已用 `Row/Col` 栅格，移动端控件占满宽度
- 布局：`AdminLayout` 使用 `Layout.Sider` + `breakpoint="lg"` 实现响应式；在 lg 以下会自动折叠侧边栏为“仅图标”，可随时通过顶部按钮展开/收起（不使用 Drawer）
- 登录页：`width: min(420px, 100%)` 已适配小屏
- 登录页标题：**智能家居行业SAAS管理系统**（浅色/深色主题自动适配）
- 表单：项目/员工/商品等关键 Select 已设 `width: 100%`

Excel / JSON 导入导出（MVP 已落地）：
- 后端接口（需要 `Authorization` + `X-Tenant-ID`）：
  - 员工：
    - 导出 Excel：`GET /api/excel/employees/export`
    - 导出 JSON：`GET /api/excel/employees/export-json`
    - 导入 Excel：`POST /api/excel/employees/import`（multipart，字段名 `file`）
    - 导入 JSON：`POST /api/excel/employees/import-json`（请求体为数组）
  - 商品：
    - 导出 Excel：`GET /api/excel/products/export`
    - 导出 JSON：`GET /api/excel/products/export-json`
    - 导入 Excel：`POST /api/excel/products/import`
    - 导入 JSON：`POST /api/excel/products/import-json`
  - 项目：
    - 导出 Excel：`GET /api/excel/projects/export`
    - 导出 JSON：`GET /api/excel/projects/export-json`
    - 导入 Excel：`POST /api/excel/projects/import`
    - 导入 JSON：`POST /api/excel/projects/import-json`
  - 销售订单：
    - 导出 Excel：`GET /api/excel/sales-orders/export`
    - 导出 JSON：`GET /api/excel/sales-orders/export-json`
    - 导入 Excel：`POST /api/excel/sales-orders/import`
    - 导入 JSON：`POST /api/excel/sales-orders/import-json`
- 模板约定（Excel 与 JSON 共用同一字段定义）：
  - Excel：每类数据一个 sheet，sheet 名分别为：`employees` / `products` / `projects` / `salesOrders`
  - JSON：每类数据对应一个数组，元素字段与下表一致
  - 列名/字段名优先英文（导出即为英文列名）；Excel 导入也兼容少量中文别名
    - employees：`name`、`phone`、`positionName`、`entryDate`（YYYY-MM-DD）、`status`（ACTIVE/INACTIVE）
    - products：`name`、`category`、`standardPrice`、`installationFee`、`debuggingFee`、`otherFee`、`maintenanceDeposit`、`isSpecialInstallation`、`suggestedStockQty`、`techCommissionInstall`、`techCommissionDebug`、`techCommissionMaintenance`、`techCommissionAfterSales`
    - projects：`name`、`address`、`customerName`、`customerPhone`、`contractAmount`、`signDate`（YYYY-MM-DD）、`status`
    - salesOrders：`projectName`、`employeePhone`、`amount`、`discountRate`、`occurredAt`（ISO 字符串或 YYYY-MM-DD）、`verified`、`remark`
  - upsert/创建规则：
    - employees：按 `phone` upsert；若岗位不存在会自动创建一个同名岗位（底薪=0，提成规则为空）
    - products：按 `name` upsert
    - projects：按 `name` upsert
    - salesOrders：按行创建新订单（通过 `projectName` 和 `employeePhone` 关联项目与员工）

工资结算口径（MVP 已落地）：
- 提成：按员工、按月汇总本月已核验到账订单（`SalesOrder.verified=true`），每笔订单按折扣率折算“跳点业绩”，再根据当月累计跳点业绩确定档位并计算提成。
- 技术费：按员工、按月汇总安装/调试/售后记录，按 `单价 × 数量 × 难度系数` 计算并累加。
- 工资单：`总额 = 底薪 + 提成 + 技术费 + 补贴 - 扣款`，生成/更新 `Salary`（状态 DRAFT，可审批为 APPROVED，发放为 PAID）。

---

### RBAC 角色与员工权限说明（确保“谁能改/谁能删”）

本系统使用三种基础角色：

| 角色 | 典型身份 | 主要权限概览（简化） |
|------|----------|----------------------|
| OWNER | 公司老板/负责人 | 拥有 ADMIN 的全部权限，并可调整租户设置、计费等 |
| ADMIN | 管理员/财务负责人 | 管理岗位/员工/商品/项目，录入/导入数据，审核并结算工资，查看预警 |
| MEMBER | 普通员工（销售/安装/售后等） | 只能通过 `/my` 系列接口上报/查看“自己的数据”，不能在 Web 后台删除或修改他人数据 |

#### 后端权限矩阵（与 `rbac.service.ts` 保持一致）

- **OWNER/ADMIN**（管理端）：
  - 可以调用 `positions.manage / employees.manage / products.manage / projects.manage / entries.manage / salary.manage / alerts.read / uploads.create` 等权限对应的接口。
  - Web 管理后台的 **新增/编辑/删除/导入导出** 按钮均为 OWNER/ADMIN 设计，普通员工不应登录管理后台。
- **MEMBER**（员工端 / OpenClaw / iOS）：
  - 仅开放以下权限：`products.read`、`projects.read`、`sales.create`、`sales.read`、`installation.create`、`installation.read`、`uploads.create`、`salary.read.own`。
  - **不能调用任何带 `entries.manage` / `salary.manage` 的删除/管理接口**，也不能访问其他员工的数据。
  - 员工通过 `/api/sales-orders/my`、`/api/installation-records/my`、`/api/salaries/my` 系列接口，只能上报/查询“自己”的销售、技术记录和工资单。

> 当前 Web 管理端定位为 OWNER/ADMIN 使用的“后台”。普通员工的“只可删除和修改自己上传的报表”将在 iOS/消息端 `/my` 系列接口阶段细化 update/delete 能力；无论是 Web 还是 OpenClaw/iOS，后端都会始终通过 RBAC + 多租户校验，保证员工不能删除或修改他人的数据。

前端 Web 也做了一层“按角色隐藏菜单”的保护：

- 登录成功后，前端会通过 `GET /api/users/me` 获取当前账号在各租户下的角色，并针对当前租户 slug 计算出角色（OWNER / ADMIN / MEMBER），写入本地状态。
- 在管理后台侧边导航中：
  - OWNER/ADMIN：看到完整菜单（组织架构、业务管理、业务上报、财务与风控、OpenClaw 联调、系统设置）。
  - MEMBER：仅看到“工作台 + OpenClaw 联调”，避免误点管理类入口；真实的数据读写边界仍由后端 RBAC 控制。

### 需求完成度审查对照（2026-03-10）

结合 `需求完成度审查报告.md` 与当前代码，按类别汇总如下：

- **核心业务规则**：跳点提成、折扣率影响、技术费用、销售 vs 技术预警等规则与原始需求完全一致，单元测试已覆盖，完成度 **100%**。
- **管理端功能（Web）**：岗位/员工/商品/项目/销售上报/技术上报/预警中心/工资结算均已实现最小可用（含多租户与权限控制），完成度 **≈100%**，待补充销售/技术记录的“编辑”能力与 Dashboard 统计视图。
  - 销售上报/技术上报页面已经支持编辑（update）：可在列表中对已有记录进行修改而无需删除重建。
- **后端 API 完整性**：面向员工端的 `/my` 系列接口（我的销售/我的安装/我的工资）已经实现，并通过 RBAC 中新增的 `sales.*`、`installation.*`、`salary.read.own` 权限控制仅能访问“自己的数据”；更细粒度的工资明细结构、手机号+验证码登录接口仍放在“下一阶段”待办，不影响当前 Web 管理端验收。
- **iOS 员工端**：按约定暂缓，当前仅保证所有必需的业务 API 可以逐步补齐，为后续 SwiftUI App 直接复用。

---

### OpenClaw 集成适配说明（消息端上报与查询）

- **目标**：允许一线员工通过 Telegram / WhatsApp / Discord / iMessage 等 OpenClaw 支持的消息渠道完成“上报销售、上报安装/调试、查询工资”等高频操作，而不必登录 Web 后台。
- **集成边界**：
  - 本仓库仅提供面向员工的 API 能力和权限模型，包括：
    - `POST /api/sales-orders/my`：当前员工上报销售订单（自动根据登录用户和租户解析员工身份）
    - `GET /api/sales-orders/my`：当前员工自己的销售订单列表（返回全部，可按 occurredAt 客户端筛选）
    - `POST /api/installation-records/my`：当前员工上报安装/调试/售后记录
    - `GET /api/installation-records/my`：当前员工自己的安装/调试/售后记录列表（返回全部，可按 occurredAt 客户端筛选）
    - `GET /api/salaries/my`：当前员工自己的工资单列表，可按月份过滤
    - `GET /api/projects`：带 `projects.read` 权限的员工可以查看所属租户的项目列表（支持 `q`/`limit` 做模糊匹配与候选<=3 消歧）
    - `GET /api/products`：带 `products.read` 权限的员工可以查看所属租户的商品列表（支持 `q`/`limit` 做模糊匹配与候选<=3 消歧）
  - 为“按员工类型挂载 Skill / 路由”提供的管理接口：
    - `GET /api/employee-types`：员工类型列表（管理员维护）
    - `POST /api/employee-types`：创建员工类型（含 `skillTags`）
    - `PATCH /api/employee-types/:id`：更新员工类型
    - `DELETE /api/employee-types/:id`：删除员工类型
    - 员工档案字段 `employeeTypeId`：用于把某个员工绑定到某个员工类型（Skill 可用该信息做稳定路由）
  - OpenClaw 本身的安装、渠道配置（如 Telegram Bot Token）和 Skill 代码存放在 OpenClaw 工作区，不随本仓库发布。
- **权限与安全**：
  - 在 `rbac.service.ts` 中已经为 `MEMBER` 角色开放以下权限：`products.read`、`projects.read`、`sales.create`、`sales.read`、`installation.create`、`installation.read`、`salary.read.own`。
  - 若消息端需要上传图片/视频后再写入业务单据：使用 `uploads.create` 权限调用 `/api/uploads/*`，然后把返回的 `url` 放入对应 DTO 的 `paymentProofUrls` / `photoUrls` 字段。
  - 所有上述接口仍依赖现有的 JWT 认证与 `X-Tenant-ID` 多租户隔离机制，OpenClaw 只是在服务器端代员工调用同一套 API，不引入额外后门。

#### 与“新增模块/字段”的一致性说明（确保每个员工智能体匹配正确）

- **测量工勘（信息记录 / 窗帘下单）**
  - 后端接口：`/api/measurement-surveys`、`/api/curtain-orders`
  - **权限边界**：这两组接口均要求 `entries.manage`（OWNER/ADMIN）。
  - **OpenClaw Skill 行为**：
    - `employee-skill-router` 已将“测量/工勘/窗帘下单”等关键词路由到 `admin-guide`；
    - `admin-guide` 与 `salary-assistant` 统一要求：此类需求只做 **Web 管理端路径引导**，不引导普通员工在聊天中录入。
- **商品新增字段（建议库存/技术提成）**
  - 字段：`suggestedStockQty`、`techCommissionInstall/Debug/Maintenance/AfterSales`
  - **可见性**：
    - 管理端（OWNER/ADMIN）：在 Web「商品管理」可编辑这些字段，并与后端 DTO 字段名一致；
    - 员工端（MEMBER）：OpenClaw 的 MEMBER Skills 仅把 `GET /api/products` 用于“商品名称候选与消歧”，不会依赖或修改上述管理字段，不影响员工端上报链路。
- **Skill 示例**：
  - 仓库内提供的示例 Skill 文档：`skills/salary-assistant/SKILL.md`（无 emoji，可直接用于内部评审与按需裁剪）。
  - 建议按角色拆分后的 Skills（用于避免开发联调混淆与越权）：
    - `skills/member-sales/SKILL.md`
    - `skills/member-technician/SKILL.md`
    - `skills/member-salary/SKILL.md`
    - `skills/admin-guide/SKILL.md`
    - 管理端补充：`admin-guide` 已包含“测量工勘/信息记录/窗帘下单”的 Web 操作路径引导（该能力需要 `entries.manage`，不应对普通员工开放）。
  - 词典与路由（用于处理语音/文字模糊表达，减少追问与 token）：
    - `skills/taxonomy-smart-home/SKILL.md`
    - `skills/employee-skill-router/SKILL.md`

> 消歧建议：当员工输入的“项目名/商品名”不唯一时，先用 `q`/`limit` 拉候选（<=3）让员工回序号确认，再提交 `/my` 写入接口。  
> 例如：`GET /api/projects?q=万科&limit=3`、`GET /api/products?q=开关&limit=3`。

#### 建议的自定义 Skill：`salary_assistant`

- **Skill 名称**：`salary_assistant`（建议放在 OpenClaw 工作区路径：`~/.openclaw/workspace/skills/salary-assistant/SKILL.md`）
- **职责**：统一处理与本系统相关的聊天指令，根据用户在本系统中的角色（OWNER / ADMIN / MEMBER）选择合适的调用方式：
  - OWNER / ADMIN：偏管理视角，优先引导用户使用 Web 管理端查看统计和明细，仅在确有需要时代为调用管理类 API。
  - MEMBER：偏一线员工视角，聚焦“上报销售、上报安装/调试/售后、查询自己工资”的快捷操作，通过 `/my` 系列接口写入或读取当前登录员工的数据。
- **典型指令示例（由 Skill 识别并处理）**：
  - MEMBER：
    - “上报销售 万科项目 50000元 95折”
    - “上报安装 万科项目 智能开关 10个”
    - “查询工资 2026-03”
  - ADMIN / OWNER：
    - “帮我看一下 2026-03 整体工资结算有没有异常”（建议 Skill 引导用户登录 Web 的 Dashboard/工资结算页面，而不是直接通过聊天返回所有员工工资明细，以避免信息泄露和上下文过长问题）
- **实现方式**：
  - 使用 OpenClaw 的 Skill 机制，在 `SKILL.md` 中描述如何：
    - 解析员工自然语言指令为结构化参数（项目名、金额、折扣、数量、月份等）。
    - 携带当前用户的 JWT 和 `X-Tenant-ID`，调用本系统的 `/api/sales-orders/my`、`/api/installation-records/my`、`/api/salaries/my` 等接口。
    - 严格区分“只看自己数据（MEMBER）”与“管理视角（ADMIN/OWNER）”，并在说明中强调不得通过该 Skill 向普通员工泄露其他员工或其他租户的数据。
  - 参考 `skills/salary-assistant/SKILL.md`，确保实际 Skill 行为与本 README 中描述的接口和权限模型一致。

#### iOS 员工端 + OpenClaw 统一部署规划（待研发确认与分工实现）

- **现状结论**：
  - 后端已具备 `/my` 系列接口与 MEMBER 权限集，满足“员工只操作自己数据”的基础能力。
  - 若要做到“员工用自己的公司账号，在消息端或 iOS 内通过智能体完成创建/修改表单并可商用稳定运行”，仍需在后续补齐：
    - 消息渠道 senderId 与系统员工身份的绑定（例如一次性 linkCode 绑定流程）
    - 面向消息助手的审计与限流策略（按 senderId/employeeId/tenantId）
    - 员工端允许修改哪些字段、哪些状态可改的规则与接口（update 权限边界）

部署到实际客户环境前，本 README 会继续作为唯一权威文档更新，记录每一阶段已完成与待办的功能点，方便你按清单验收。 

---

### 开发辅助工具与 MCP 集成（本地验证与知识沉淀）

为提高后续前后端联调与数据库验证效率，本项目在本地开发环境中推荐配合以下 MCP 工具使用（可选但强烈推荐）：

- **Memorix MCP（项目长期记忆）**  
  - 用途：沉淀“架构如何工作、关键决策、工资结算口径、Excel/JSON 字段约定、部署自检步骤”等知识，支持跨 IDE / 跨会话检索，避免重复阅读文档。  
  - 典型用法：
    - 使用 `memorix_store` 记录架构决策与业务规则（如工资结算/预警规则、表结构变更原因等），并为重要主题设置 `topicKey`（例如 `architecture/smart-home-salary-saas`），方便后续 upsert 与演进。
    - 使用 `memorix_search` / `memorix_session_context` 搜索历史观察与会话上下文，在排查问题或扩展功能时快速找回“之前是怎么定的”。

- **DBHub MCP（PostgreSQL 只读检查）**  
  - 用途：通过标准 MCP 工具对 `salary` 数据库执行只读 SQL 与结构搜索，在不修改线上数据的前提下验证：**多租户隔离是否正确、工资/预警/导入数据是否落库符合规则**。  
  - 工具说明：
    - `search_objects`：按 `schema/table/column` 等维度搜索数据库对象，例如确认所有业务表是否都包含 `tenantId` 字段。
    - `execute_sql`：执行只读 SQL 语句（可多条 `;` 分隔），用于做聚合校验与样本数据检查。
  - 本项目典型检查示例：
    - 多租户列检查：
      - 通过 `search_objects` 查询 `public` schema 下包含 `tenantId` 的列，期望结果覆盖：`Alert`、`AuditLog`、`CurtainOrder`、`CurtainRoom`、`Employee`、`EmployeeType`、`FeatureFlag`、`InstallationRecord`、`MeasurementSurvey`、`Membership`、`Position`、`Product`、`ProductCategory`、`Project`、`ProjectItem`、`RefreshToken`、`Salary`、`SalesOrder`、`SalesOrderItem` 等表，确保与 `schema.prisma` 和多租户设计一致。
    - 基础种子数据检查：
      - 通过 `execute_sql` 执行：
        - `SELECT name FROM "Tenant";`（确认存在开发租户，例如 `Acme Inc`）
        - `SELECT COUNT(*) AS employees FROM "Employee";`
        - `SELECT COUNT(*) AS alerts FROM "Alert";`
        - `SELECT COUNT(*) AS salaries FROM "Salary";`
      - 用于快速确认：种子脚本是否正确写入基础租户/员工/预警/工资数据，方便 Dashboard 与验收脚本使用。

> 说明：MCP 工具本身不参与生产环境业务逻辑，仅作为**开发/联调/验收辅助**；所有真实业务安全边界仍由本项目的多租户 + RBAC + Prisma 迁移 + Docker 部署策略共同保证。

---

### 当前仓库与伙伴部署状态（2026-03-12）

1. **GitHub 仓库**
   - 已创建公开仓库：`symi-daguo/smart-home-salary`（可根据需要在 GitHub 设置为 Private）。
   - 根目录新增：
     - `.gitignore`：忽略 `node_modules/`、`dist/`、`.env*`、`infra/.env.prod*`、`coverage/` 与 `需求资料/`，确保不上传依赖、环境变量与内部需求文档。
     - `LICENSE`：MIT License，注明基于 `Multi-Tenant-SaaS-Starter-NestJS` 二次开发，保留商用与闭源集成权利。
     - 根级 `README.md`：面向 GitHub/伙伴的项目总览 + 目录结构 + 部署与升级说明（不包含内部细节）。
   - 已推送到远程 `origin`，主分支为 `main`。

2. **伙伴云服务器部署路径（他们需要做的事）**
   - 在云服务器上：
     1. 安装 Docker / Docker Compose。
     2. 克隆仓库：
        ```bash
        git clone https://github.com/symi-daguo/smart-home-salary.git
        cd smart-home-salary
        ```
        > 若仓库改为 Private，则需要先配置 GitHub PAT 或 SSH key。
     3. 准备生产环境变量：
        ```bash
        cp infra/.env.prod.example infra/.env.prod
        # 编辑 infra/.env.prod，填入 POSTGRES_PASSWORD/MINIO_ROOT_PASSWORD/JWT_*/OPENCLAW_GATEWAY_TOKEN/FRONTEND_URL/CORS_ORIGIN/S3_PUBLIC_BASE_URL 等
        ```
     4. 启动生产栈：
        ```bash
        docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build
        ```
        - API 容器会自动执行 `prisma migrate deploy`（创建/升级 schema），并运行种子脚本。
     5. 在云厂商控制台或自建 Nginx/Caddy 上配置域名与 HTTPS，80/443 反代到 `web` 容器，`/api` 再转发到 `api` 容器。
   - 只要伙伴按上述步骤操作，**上传后的仓库即可直接用于真实环境测试整个 Web 管理端所有已实现功能**。

3. **后续我们需要做的事**
   - **今天之后**：
     - 不再直接改云服务器上的代码或 Compose 配置，一切改动都在本地开发环境完成，验证通过后推送到 GitHub。
     - 严格遵守前向兼容的 schema 变更策略（新增字段/表优先，避免破坏性修改）。
   - **明天及后续开发节奏**：
     1. 在本地继续按 `apps/api` + `apps/web` 正常开发（可新增分支/feature 分支，合并到 main 后再推送）。
     2. 使用本地 Docker 开发 compose 验证（含 Seed/MCP 自检），更新 `需求资料/README.md` 和根 `README.md` 中的“已完成/待办”部分。
     3. 推送到 GitHub `symi-daguo/smart-home-salary` 仓库（必要时打 tag 标记版本，例如 `v2026.03.1`）。
     4. 通知伙伴在云服务器上执行：
        ```bash
        cd smart-home-salary
        git pull           # 或 git checkout v2026.03.1
        docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build
        ```
        即可完成升级与重新构建，无需重新部署。

> 小结：当前上传后的仓库已经可以让伙伴按 README 说明在云服务器上拉起完整环境进行验收；我们明天可以直接在本地继续正常开发（包括新功能与 bugfix），通过 GitHub + Docker Compose 的流程向伙伴环境平滑推送更新。