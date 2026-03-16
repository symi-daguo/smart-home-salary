# SYMI - 后端 API (SmartHome Cloud ERP API)

[![NestJS](https://img.shields.io/badge/NestJS-11-red?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

> SYMI后端 API 服务，基于 NestJS + Prisma + PostgreSQL 构建，提供多租户、RBAC权限、审计日志等企业级功能。

---

## 📋 目录

- [项目简介](#-项目简介)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [开发指南](#-开发指南)
- [API文档](#-api文档)
- [数据库](#-数据库)
- [测试](#-测试)
- [部署](#-部署)
- [常见问题](#-常见问题)

---

## 🏠 项目简介

SYMI后端 API 是面向智能家居行业的 SaaS 管理平台服务端，提供完整的业务 API 支持，包括：

- **多租户架构**：严格的数据隔离，支持多公司独立运营
- **RBAC权限控制**：基于角色的访问控制（Owner/Admin/Member）
- **审计日志**：完整的操作记录追踪
- **功能开关**：租户级别的功能特性管理
- **文件存储**：集成 MinIO 对象存储
- **缓存层**：Redis 缓存支持

---

## 🛠️ 技术栈

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| [NestJS](https://nestjs.com/) | 11.x | Node.js 企业级框架 |
| [Prisma](https://www.prisma.io/) | 6.19.x | 现代数据库工具包 |
| [TypeScript](https://www.typescriptlang.org/) | 5.3.x | 类型安全的 JavaScript |
| [PostgreSQL](https://www.postgresql.org/) | 17.x | 关系型数据库 |
| [Redis](https://redis.io/) | 7.x | 内存缓存数据库 |

### 主要依赖

```json
{
  "@nestjs/core": "^11.0.0",
  "@nestjs/platform-express": "^11.0.0",
  "@nestjs/swagger": "^11.0.0",
  "@nestjs/jwt": "^11.0.0",
  "@nestjs/passport": "^11.0.0",
  "@prisma/client": "^6.19.0",
  "bcrypt": "^5.1.0",
  "class-validator": "^0.14.0",
  "passport-jwt": "^4.0.1",
  "ioredis": "^5.3.0"
}
```

---

## 📁 项目结构

```
apps/api/
├── prisma/                    # 数据库模型和迁移
│   ├── schema.prisma          # Prisma 模型定义
│   ├── migrations/            # 数据库迁移文件
│   ├── seed.ts                # 基础数据种子
│   └── seed-warehouse.ts      # 仓库测试数据
├── src/
│   ├── main.ts                # 应用入口
│   ├── app.module.ts          # 根模块
│   ├── auth/                  # 认证模块
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/        # JWT/Local 策略
│   │   └── dto/               # 登录/注册 DTO
│   ├── tenants/               # 租户管理
│   ├── users/                 # 用户管理
│   ├── memberships/           # 成员关系
│   ├── rbac/                  # 权限控制
│   │   ├── guards/            # 权限守卫
│   │   └── decorators/        # @RequirePermissions
│   ├── feature-flags/         # 功能开关
│   ├── audit/                 # 审计日志
│   ├── cache/                 # Redis 缓存
│   ├── common/                # 公共模块
│   │   ├── prisma.service.ts  # Prisma 服务
│   │   ├── tenant-context/    # 租户上下文
│   │   └── decorators/        # 自定义装饰器
│   ├── positions/             # 岗位管理
│   ├── employees/             # 员工管理
│   ├── employee-types/        # 员工类型
│   ├── products/              # 商品管理
│   ├── projects/              # 项目管理
│   ├── sales-orders/          # 销售上报
│   ├── installation-records/  # 技术上报
│   ├── measurement-surveys/   # 测量工勘
│   ├── curtain-orders/        # 窗帘下单
│   ├── warehouse/             # 仓库管理
│   │   ├── warehouse.controller.ts
│   │   ├── warehouse.service.ts
│   │   └── dto/               # 出入库单 DTO
│   ├── salaries/              # 工资结算
│   ├── alerts/                # 预警中心
│   ├── excel/                 # Excel 导入导出
│   ├── uploads/               # 文件上传
│   └── dashboard/             # 工作台统计
├── test/                      # 测试文件
├── .env.example               # 环境变量示例
├── nest-cli.json              # NestJS 配置
├── tsconfig.json              # TypeScript 配置
└── package.json
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.x LTS
- **PostgreSQL**: 17.x
- **Redis**: 7.x (可选，用于缓存)

### 安装步骤

```bash
# 1. 进入后端目录
cd apps/api

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 4. 执行数据库迁移
npx prisma migrate dev

# 5. 导入基础数据
npx prisma db seed

# 6. 启动开发服务器
npm run start:dev
```

### 环境变量配置

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/smarthome?schema=public"

# JWT 密钥（生成强随机字符串）
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Redis（可选）
REDIS_URL="redis://localhost:6379"

# MinIO 对象存储
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="smarthome"

# 邮件服务
EMAIL_PROVIDER="console"  # console | smtp | resend
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""

# 应用配置
PORT=3000
NODE_ENV="development"
```

---

## 💻 开发指南

### 开发命令

```bash
# 启动开发服务器（热重载）
npm run start:dev

# 生产构建
npm run build

# 生产运行
npm run start:prod

# 代码检查
npm run lint

# 代码格式化
npm run format

# 数据库操作
npx prisma migrate dev      # 创建迁移
npx prisma migrate deploy   # 部署迁移
npx prisma generate         # 生成客户端
npx prisma studio           # 打开数据库 GUI
npx prisma db seed          # 导入种子数据
```

### 添加新模块

```bash
# 使用 NestJS CLI 生成模块
npx nest g module new-module
npx nest g controller new-module
npx nest g service new-module
```

### 代码规范

- 使用 TypeScript 严格模式
- 所有 API 端点必须添加 Swagger 文档
- 使用 Class Validator 进行输入验证
- 遵循 RESTful API 设计规范
- 敏感操作必须记录审计日志

---

## 📚 API文档

### Swagger 文档

启动服务后访问：http://localhost:3000/docs

### 认证方式

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "founder@yoursaas.com",
  "password": "password"
}
```

响应：
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "ad0f1..."
}
```

### API 请求头

```http
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
Content-Type: application/json
```

### 主要 API 模块

#### 认证模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/logout` | 退出登录 |

#### 租户模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tenants` | 租户列表 |
| POST | `/api/tenants` | 创建租户 |
| GET | `/api/tenants/current` | 当前租户 |
| PATCH | `/api/tenants/current` | 更新租户 |

#### 仓库模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/warehouse/orders` | 出入库单列表 |
| POST | `/api/warehouse/orders` | 创建出入库单 |
| GET | `/api/warehouse/outbound-applications` | 出库申请单列表 |
| POST | `/api/warehouse/outbound-applications` | 创建出库申请 |
| POST | `/api/warehouse/outbound-applications/:id/approve` | 审核出库申请 |
| GET | `/api/warehouse/inventory` | 库存盘点 |
| GET | `/api/warehouse/logs` | 操作日志 |

---

## 🗄️ 数据库

### 模型关系图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │─────│ Membership  │─────│   Tenant    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Employee  │
                    └─────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Project   │    │   Product   │    │  Position   │
└─────────────┘    └─────────────┘    └─────────────┘
        │                  │
        ▼                  ▼
┌─────────────┐    ┌─────────────┐
│WarehouseOrder│   │   Inventory │
└─────────────┘    └─────────────┘
```

### 主要模型

- **Tenant**: 租户/公司
- **User**: 系统用户
- **Employee**: 员工档案
- **Product**: 商品信息
- **Project**: 项目信息
- **WarehouseOrder**: 出入库单
- **OutboundApplication**: 出库申请单
- **Inventory**: 库存记录
- **Salary**: 工资记录
- **Alert**: 预警记录

### 数据库迁移

```bash
# 创建新迁移
npx prisma migrate dev --name add_new_feature

# 部署到生产
npx prisma migrate deploy

# 重置数据库（谨慎使用）
npx prisma migrate reset
```

---

## 🧪 测试

### 运行测试

```bash
# 单元测试
npm run test

# 测试覆盖率
npm run test:cov

# E2E 测试
npm run test:e2e

# 监听模式
npm run test:watch
```

### 测试结构

```
test/
├── auth.e2e-spec.ts           # 认证测试
├── tenants.e2e-spec.ts        # 租户测试
├── positions.e2e-spec.ts      # 岗位测试
├── employees.e2e-spec.ts      # 员工测试
├── products.e2e-spec.ts       # 商品测试
├── projects.e2e-spec.ts       # 项目测试
├── warehouse.e2e-spec.ts      # 仓库测试
└── salaries.e2e-spec.ts       # 工资测试
```

---

## 🚀 部署

### Docker 部署

```bash
# 构建镜像
docker build -t smarthome-api .

# 运行容器
docker run -d \
  --name smarthome-api \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET="..." \
  smarthome-api
```

### 生产环境检查清单

- [ ] 使用强随机 JWT 密钥
- [ ] 配置生产数据库
- [ ] 启用 HTTPS
- [ ] 配置日志收集
- [ ] 设置监控告警
- [ ] 配置自动备份
- [ ] 启用 Redis 缓存
- [ ] 配置邮件服务

---

## ❓ 常见问题

### Q1: 数据库连接失败？

检查：
1. PostgreSQL 服务是否运行
2. 数据库 URL 配置是否正确
3. 数据库用户权限是否足够

### Q2: JWT 验证失败？

检查：
1. JWT 密钥是否正确配置
2. Token 是否过期
3. 请求头格式是否正确

### Q3: 文件上传失败？

检查：
1. MinIO 服务是否运行
2. 存储桶是否存在
3. 访问密钥是否正确

### Q4: 如何调试？

```bash
# 启用详细日志
DEBUG=* npm run start:dev

# 使用 VSCode 调试
# 1. 按 F5 启动调试
# 2. 在代码中设置断点
```

---

## 📄 许可证

[MIT](../../LICENSE) © 2026 SYMI团队

---

## 🔗 相关链接

- [前端项目](../web/README.md)
- [根项目文档](../../README.md)
- [API 文档](http://localhost:3000/docs) (本地开发)
- [Prisma 文档](https://www.prisma.io/docs)
- [NestJS 文档](https://docs.nestjs.com/)

---

**Built with ❤️ using NestJS & Prisma**
