# Changelog

All notable changes to this project will be documented in this file.

## [1.0.9] - 2026-03-17

### Added
- **Tauri桌面应用打包**
  - 新增 `src-tauri/` 目录，完整Tauri 2.0配置
  - macOS应用包：SmartHome.app (3.9MB)
  - macOS安装包：SmartHome_1.0.9_aarch64.dmg (29MB)
  - 支持Windows/Linux/macOS跨平台打包
- **桌面版启动方案**
  - 新增 `desktop/` 目录，包含独立部署方案
  - SQLite数据库支持（schema.sqlite.prisma）
  - Windows启动脚本（start.bat）
  - Mac/Linux启动脚本（start.sh）
  - 自动备份功能
- **数据库迁移支持**
  - PostgreSQL → SQLite 迁移方案
  - SQLite环境配置文件

### Changed
- README.md 添加桌面版快速开始指南
- package.json 添加Tauri相关脚本
- 版本号更新至 v1.0.9

### Technical Details
- Tauri 2.10.3 + Rust 1.94.0
- SQLite schema 将 Decimal 类型改为 Float
- SQLite schema 将 Json 类型改为 String（Prisma自动处理序列化）
- 前端构建产物：1,954KB (gzip: 593KB)

## [1.0.8] - 2026-03-16

### Added
- OpenClaw语音/文字交互API
  - 意图识别（销售上报/技术上报/工资查询/项目查询/产品查询）
  - 实体提取（金额、折扣率、项目、产品、员工）
  - 表单摘要生成（用于二次确认）
  - 候选项目/产品模糊匹配
  - 中文金额解析（如"五万"→50000）
  - 语音输入纠错
- 窗帘下单自动计算功能
  - 布匹价格自动计算（高度×长度×单价）
  - 轨道费用自动计算（房间数×单双层×长度进1位）
  - 下单根数费用（200元/根）
  - 自动生成销售出库单
  - 更新项目应收款
- 出入库单图片上传支持
  - 新增 `/uploads/warehouse-images` 上传接口
  - 支持jpeg/png/webp格式
  - 最大5MB

### Changed
- 窗帘订单DTO扩展，支持房间详细信息
- 出入库单服务支持图片URL存储

### Fixed
- 窗帘下单页面UI重构（v1.0.8 UI优化）
  - 移除JSON输入字段，改为可视化表单
  - 窗帘类型下拉选择（9种类型）
  - 动态长度字段（根据类型自动显示）
  - 窗帘盒开关控制
  - 布匹销售开关控制
  - 价格计算预览弹窗
- 测量工勘页面UI优化（v1.0.8 完善）
  - 完全匹配需求文档：关联项目、图片上传、时间、备注
  - 图片上传改为可视化组件（最多3张）
  - 支持视频上传（30秒内，50MB）
  - 图片/视频在列表中显示缩略图
  - 项目下拉显示客户名称
  - 时间默认当前时间
  - 表单布局更清晰，小白用户友好
- **修复窗帘订单API错误**（v1.0.8 关键修复）
  - 修复 "Missing tenant context" 错误
  - 原因：TenantContextService 依赖 AsyncLocalStorage，在某些情况下无法获取上下文
  - 解决方案：从 Controller 直接传递 tenantId 参数到 Service
  - 影响范围：所有窗帘订单相关API（列表、详情、创建、删除、价格计算）
- **修复测量工勘API错误**（v1.0.8 关键修复）
  - 修复 "Missing tenant context" 错误
  - 解决方案：从 Controller 直接传递 tenantId 参数到 Service
  - 新增：数据修改功能（PATCH /measurement-surveys/:id）
  - 新增：数据删除功能（DELETE /measurement-surveys/:id）
  - 新增：项目统计同步机制（创建/更新/删除时自动同步项目测量工勘统计）
  - 前端：新增编辑按钮和删除按钮，支持完整CRUD操作
- **修复窗帘下单编辑删除功能**（v1.0.8 关键修复）
  - 前端：新增操作列，包含编辑和删除按钮
  - 后端：新增 PATCH /curtain-orders/:id 更新API
  - 后端：新增 UpdateCurtainOrderDto 支持部分字段更新
  - 服务层：新增 update 方法，使用事务更新订单和房间信息
  - 数据验证：数据库中 1 条窗帘订单记录，API 返回正常
- **修复窗帘下单编辑功能数据加载问题**（v1.0.8 关键修复）
  - 问题：编辑时房间数据未正确加载，导致"请至少添加一个房间"错误
  - 原因：handleEdit 函数未加载 rooms 数据到表单
  - 解决方案：
    - 修改 handleEdit 为异步函数，调用 GET /curtain-orders/:id 获取完整数据
    - 转换房间详情数据（包含 CurtainRoom 和 CurtainRoomDetail）
    - 正确设置表单初始值，包括 rooms 数组
  - 数据验证：数据库中 2 个房间（客厅、主卧）正确加载
- **新增用户管理功能**（v1.0.8 关键功能）
  - 前端：新增用户管理页面（UsersPage）
  - 前端：组织架构菜单新增"用户管理"入口
  - 前端：支持创建、编辑、删除用户，分配角色权限
  - 后端：新增 GET /users 获取租户用户列表
  - 后端：新增 POST /users 创建用户
  - 后端：新增 PATCH /users/:id 更新用户
  - 后端：新增 DELETE /users/:id 删除用户
  - 后端：新增 POST /users/:id/reset-password 重置密码
  - 权限控制：仅 OWNER 和 ADMIN 可管理用户

### Data
- **模拟真实数据已生成**（v1.0.8）
  - 租户：acme
  - 用户账号（密码均为：password）：
    - founder@yoursaas.com（创始人/老板）
    - admin@demo.local（管理员）
    - sales@demo.local（销售）
    - technician@demo.local（技术员）
    - finance@demo.local（财务）
    - guide@demo.local（运营指导）
  - 数据内容：
    - 员工类型：销售、技术员、财务、运营指导、管理员
    - 岗位：销售岗、技术岗、财务岗、管理岗
    - 员工档案：6名活跃员工，绑定不同岗位和类型
    - 商品：智能开关（含技术提成字段）
    - 项目：万科样板间
    - 销售上报：4条销售记录，总金额¥105,000
    - 技术上报：安装记录
    - 测量工勘：信息记录（含图片）
    - 窗帘下单：2个房间的窗帘订单
    - 预警：3条未处理预警
    - 工资单：3名员工的本月工资单

### Verified
- **首页看板数据验证**（v1.0.8）
  - ✅ 本月总营收：¥105,000.00（SalesOrder表本月汇总）
  - ✅ 新增销售订单：4（SalesOrder表本月计数）
  - ✅ 活跃员工数：6（Employee表ACTIVE状态）
  - ✅ 待处理预警：3（Alert表未解决计数）
  - ✅ 营收趋势图表：关联SalesOrder表（业务管理→销售上报）
  - ✅ 安装品类分布：关联InstallationRecord表（业务管理→技术上报）
  - ✅ 近期销售动态：关联SalesOrder+Project+Employee表
  - ✅ 近期安装记录：关联InstallationRecord+Product+Employee表
  - ✅ 看板自定义：支持显示/隐藏各窗口、导出JSON、重置布局

## [1.0.7] - 2026-03-16

### Added
- 产品技术提成字段（安装/调试/维保/售后）
- 出库申请单流程优化（支持修改、选择出库类型）
- 出入库单关联链路（relatedOrderIds字段）
- 项目管理折扣率计算（stats接口）
- 预警中心规则引擎（库存/折扣率/收款预警）
- 关联项目产品优先（by-project接口）
- 仓库管理菜单层级优化（三级菜单）
- 测试数据导入脚本

## [1.0.6] - 2026-03

### Added
- 仓库管理前后端补齐
- 出入库修改日志落地
- Docker环境接口自检

## [1.0.5] - 2026-03

### Changed
- 前端类型与规则收紧
- 版本标识与界面文案统一

## [1.0.4] - 2026-03

### Added
- 仓库管理模块（P0）
- 产品管理增强
- 数据库模型扩展

## [0.1.0] - 2026-01-27

### Added
- Initial public release of Multi-Tenant SaaS Starter (NestJS)
- JWT authentication with refresh token rotation
- Multi-tenant isolation with AsyncLocalStorage and guards
- Tenants, Users, Memberships modules with RBAC
- Audit logging module
- Billing module with Stripe adapter, Paddle stub, and mock provider
- Redis cache module with tenant-aware caching and rate limiting
- Feature flags module with global defaults and tenant overrides
- Notifications module with SMTP, Resend, and console adapters
- Swagger documentation and HTTP client request files
- E2E tests for auth and tenant isolation
