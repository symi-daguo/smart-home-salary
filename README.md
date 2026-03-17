# 智能家居行业SaaS管理系统

[![Version](https://img.shields.io/badge/version-v1.0.9-blue.svg)](https://github.com/symi-daguo/smart-home-salary/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> 专为智能家居行业设计的综合管理系统，涵盖项目管理、工资计算、仓库管理、业务上报等核心功能。

## 🚀 快速开始

### 方式一：桌面版（推荐新手）

适合客户直接安装使用，数据存储在本地，无需联网。

```bash
# 下载桌面版
git clone https://github.com/symi-daguo/smart-home-salary.git
cd smart-home-salary/desktop

# Windows用户：双击 start.bat
# Mac/Linux用户：运行 ./start.sh
```

详见：[桌面版说明](desktop/README.md)

### 方式二：Docker部署（推荐开发者）

适合团队协作、云端部署。

### 环境要求

- Docker & Docker Compose
- Node.js 22+ (开发环境)
- PostgreSQL 17
- Redis 7
- MinIO

### 使用 Docker 运行

```bash
# 克隆项目
git clone https://github.com/symi-daguo/smart-home-salary.git
cd smart-home-salary

# 启动所有服务
cd infra && docker compose up -d

# 查看日志
docker compose logs -f api
docker compose logs -f web
```

访问地址：
- Web界面: http://localhost:5173
- API文档: http://localhost:3000/docs

### 默认账号

| 角色 | 邮箱 | 密码 | 租户 |
|------|------|------|------|
| 创始人 | founder@yoursaas.com | password | acme |
| 管理员 | admin@demo.local | password | acme |
| 销售 | sales@demo.local | password | acme |
| 技术员 | technician@demo.local | password | acme |
| 财务 | finance@demo.local | password | acme |
| 运营指导 | guide@demo.local | password | acme |

## 📁 项目结构

```
smarthome/
├── apps/
│   ├── api/              # NestJS 后端 API
│   │   ├── src/
│   │   │   ├── alerts/           # 预警中心
│   │   │   ├── auth/             # 认证授权
│   │   │   ├── billing/          # 计费管理
│   │   │   ├── cache/            # 缓存模块
│   │   │   ├── common/           # 公共模块
│   │   │   ├── curtain-orders/   # 窗帘下单
│   │   │   ├── dashboard/        # 数据看板
│   │   │   ├── employees/        # 员工管理
│   │   │   ├── installation-records/  # 技术上报
│   │   │   ├── measurement-surveys/   # 测量工勘
│   │   │   ├── openclaw/         # OpenClaw智能体
│   │   │   ├── payrolls/         # 工资管理
│   │   │   ├── positions/        # 岗位管理
│   │   │   ├── products/         # 产品管理
│   │   │   ├── projects/         # 项目管理
│   │   │   ├── rbac/             # 权限管理
│   │   │   ├── sales-orders/     # 销售上报
│   │   │   ├── uploads/          # 文件上传
│   │   │   ├── warehouse/        # 仓库管理
│   │   │   └── main.ts
│   │   ├── prisma/       # Prisma 数据库模型
│   │   └── Dockerfile
│   └── web/              # React 前端
│       ├── src/
│       │   ├── api/      # API 客户端
│       │   ├── components/  # 公共组件
│       │   ├── pages/    # 页面组件
│       │   ├── state/    # 状态管理
│       │   └── utils/    # 工具函数
│       └── Dockerfile
├── infra/                # Docker 部署配置
│   ├── docker-compose.yml
│   └── init-scripts/
└── docs/                 # 文档
```

## 🛠️ 技术栈

### 后端
- **框架**: NestJS 11
- **数据库**: PostgreSQL 17 + Prisma ORM
- **缓存**: Redis 7
- **认证**: JWT + Passport
- **文件存储**: MinIO
- **API文档**: Swagger/OpenAPI

### 前端
- **框架**: React 19 + TypeScript
- **构建**: Vite 6
- **UI库**: Ant Design 5
- **状态管理**: Zustand
- **HTTP客户端**: Axios

## 📊 功能模块

### 1. 组织架构
- 租户管理：多租户隔离
- 用户管理：员工账号管理
- 角色权限：RBAC权限控制
- 岗位管理：销售岗、技术岗、财务岗等

### 2. 项目管理
- 项目创建与编辑
- 项目状态跟踪（待启动/进行中/已完结）
- 项目应收款计算
- 项目折扣率计算
- 关联销售/技术上报

### 3. 业务上报
- **销售上报**: 记录销售金额、产品、折扣率
- **技术上报**: 安装记录、调试记录、售后记录
- **测量工勘**: 现场测量信息记录、图片上传
- **窗帘下单**: 窗帘配置、自动价格计算

### 4. 工资管理
- 工资单生成
- 技术提成计算（安装/调试/维保/售后）
- 工资审核与发放

### 5. 仓库管理
- 出入库单管理
- 库存盘点
- 库存预警
- 出入库日志

### 6. 预警中心
- 销售预警（折扣率、收款金额）
- 库存预警（库存数量）
- 预警规则配置

### 7. 数据看板
- 营收趋势图表
- 安装品类分布
- 近期销售动态
- 近期安装记录
- 自定义显示/隐藏

### 8. OpenClaw智能体
- 语音/文字交互
- 意图识别（销售上报/技术上报/工资查询）
- 实体提取（金额、项目、产品）
- 表单摘要生成

## 🔌 API 接口

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/auth` | 登录、注册、刷新Token |
| 租户 | `/api/tenants` | 租户管理 |
| 用户 | `/api/users` | 用户管理 |
| 员工 | `/api/employees` | 员工档案 |
| 岗位 | `/api/positions` | 岗位管理 |
| 项目 | `/api/projects` | 项目管理 |
| 销售 | `/api/sales-orders` | 销售上报 |
| 技术 | `/api/installation-records` | 技术上报 |
| 工资 | `/api/payrolls` | 工资管理 |
| 产品 | `/api/products` | 产品管理 |
| 仓库 | `/api/warehouse` | 仓库管理 |
| 看板 | `/api/dashboard` | 数据看板 |
| 预警 | `/api/alerts` | 预警中心 |
| OpenClaw | `/api/openclaw` | 智能体交互 |
| 窗帘订单 | `/api/curtain-orders` | 窗帘下单 |
| 测量工勘 | `/api/measurement-surveys` | 测量记录 |

## 📝 版本历史

### v1.0.8 (2026-03-16)

**新增功能**：
- OpenClaw语音/文字交互API（意图识别、实体提取、表单摘要）
- 窗帘下单自动计算（布匹价格、轨道费用、下单根数费用）
- 窗帘订单自动生成销售出库单
- 出入库单图片上传支持
- Docker构建优化

**UI优化**：
- 窗帘下单页面重构：移除JSON输入，改为可视化表单
  - 9种窗帘类型下拉选择
  - 动态长度字段（根据类型自动显示）
  - 窗帘盒开关控制
  - 布匹销售开关控制
  - 价格计算预览弹窗
- 测量工勘页面优化：图片上传改为可视化组件

**Bug修复**：
- 修复窗帘订单API "Missing tenant context" 错误
  - 问题原因：TenantContextService依赖AsyncLocalStorage，在某些情况下无法获取上下文
  - 解决方案：从Controller直接传递tenantId参数到Service
  - 影响范围：所有窗帘订单相关API
- 修复测量工勘API "Missing tenant context" 错误
  - 解决方案：从Controller直接传递tenantId参数到Service
  - 新增：数据修改功能（PATCH /measurement-surveys/:id）
  - 新增：数据删除功能（DELETE /measurement-surveys/:id）
  - 新增：项目统计同步机制（创建/更新/删除时自动同步）
  - 前端：新增编辑和删除按钮，支持完整CRUD操作
- 修复窗帘下单编辑删除功能
  - 前端：新增操作列，包含编辑和删除按钮
  - 后端：新增 PATCH /curtain-orders/:id 更新API
  - 后端：新增 UpdateCurtainOrderDto 支持部分字段更新
  - 服务层：新增 update 方法，使用事务更新订单和房间信息
- 修复窗帘下单编辑功能数据加载问题
  - 问题：编辑时房间数据未正确加载，导致"请至少添加一个房间"错误
  - 解决方案：修改 handleEdit 为异步函数，调用 GET /curtain-orders/:id 获取完整数据并转换房间详情
- 新增用户管理功能
  - 组织架构菜单新增"用户管理"入口
  - 支持创建、编辑、删除用户，分配角色权限（OWNER/ADMIN/MEMBER）
  - 支持重置用户密码
  - 仅 OWNER 和 ADMIN 可管理用户

**模拟数据**：
- 已生成完整演示数据，包含6个角色账号（密码：password）
- 数据涵盖：员工、岗位、商品、项目、销售、技术、测量、窗帘、预警、工资
- 看板数据验证：本月营收¥105,000、4条销售订单、6名活跃员工、3条待处理预警

**数据看板**：
- ✅ 所有看板数据与业务板块真实关联
- 本月总营收：关联SalesOrder表（业务管理→销售上报）
- 新增销售订单：关联SalesOrder表实时计数
- 活跃员工数：关联Employee表ACTIVE状态
- 待处理预警：关联Alert表未解决预警
- 营收趋势图表：关联SalesOrder表时间序列数据
- 安装品类分布：关联InstallationRecord表（业务管理→技术上报）
- 近期销售动态：关联SalesOrder+Project+Employee表
- 近期安装记录：关联InstallationRecord+Product+Employee表
- 看板自定义：支持显示/隐藏各窗口、导出JSON报表、重置布局

### v1.0.7 (2026-03-16)

**新增功能**：
- 产品技术提成字段（安装/调试/维保/售后）
- 出库申请单流程优化（支持修改、选择出库类型）
- 出入库单关联链路（relatedOrderIds字段）
- 项目管理折扣率计算（stats接口）
- 预警中心规则引擎（库存/折扣率/收款预警）
- 关联项目产品优先（by-project接口）
- 仓库管理菜单层级优化（三级菜单）
- 测试数据导入脚本

### v1.0.6 (2026-03)

- 仓库管理前后端补齐
- 出入库修改日志落地
- Docker环境接口自检

### v1.0.5 (2026-03)

- 前端类型与规则收紧
- 版本标识与界面文案统一

### v1.0.4 (2026-03)

- 仓库管理模块（P0）
- 产品管理增强
- 数据库模型扩展

[查看更多版本历史](CHANGELOG.md)

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 创建Pull Request

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 提交前运行测试：`npm run test`
- 保持代码注释清晰

## 📄 许可证

[MIT](LICENSE) License © 2026 SYMI-DA GUO
