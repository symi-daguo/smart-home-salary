# SYMI - 智能家居行业SAAS管理系统

[![Version](https://img.shields.io/badge/version-v1.0.7-blue.svg)](https://github.com/symi-daguo/smart-home-salary/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](infra/docker-compose.yml)
[![Tech Stack](https://img.shields.io/badge/tech-NestJS%20%2B%20React-orange.svg)]()

> 面向智能家居行业的全栈式SaaS管理平台，提供项目、库存、工资、预警一体化解决方案。

---

## 📋 目录

- [项目简介](#-项目简介)
- [功能特性](#-功能特性)
- [技术架构](#-技术架构)
- [快速开始](#-快速开始)
- [部署指南](#-部署指南)
- [使用指南](#-使用指南)
- [API文档](#-api文档)
- [版本历史](#-版本历史)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

---

## 🏠 项目简介

**SYMI**是一款专为智能家居行业设计的SaaS管理系统，帮助企业管理项目、库存、员工工资和业务预警，替代传统Excel人工统计方式。

### 核心价值

- **业务自动化**：自动计算安装费、调试费、销售提成和月度工资
- **库存实时管控**：多类型出入库单管理，实时库存盘点
- **项目全周期管理**：从签约到完工的项目跟踪与成本核算
- **智能预警系统**：库存预警、折扣率预警、收款预警
- **多租户架构**：支持多公司独立运营，数据完全隔离

### 适用场景

- 智能家居集成商
- 智能安防工程公司
- 全屋智能解决方案提供商
- 智能窗帘/照明/门锁等单品代理商

---

## ✨ 功能特性

### 1. 组织架构管理
- 岗位管理：底薪 + 提成规则配置
- 员工类型：技能标签与OpenClaw智能体联动
- 员工档案：岗位绑定、账号管理

### 2. 业务管理
- **商品管理**：标准价、成本价、技术提成、建议库存
- **项目管理**：合同金额、签单折扣率、标准产品清单
- **销售上报**：收款记录、销售订单管理
- **技术上报**：安装记录、调试记录、售后记录

### 3. 仓库管理
- **出库申请流程**：销售预出库 → 技术预出库 → 确认审核 → 生成出库单
- **出入库单类型**：
  - 出库：销售出库、借货出库、售后出库、丢失出库
  - 入库：销售入库、采购入库、售后入库、未知入库
- **库存盘点**：实时库存查询、成本统计
- **SN码管理**：序列号录入与追踪

### 4. 测量工勘
- 信息记录：现场测量数据、图片上传
- 窗帘下单：复杂窗帘配置、自动成本计算

### 5. 财务与风控
- **工资结算**：底薪 + 提成 + 技术费 + 补贴 - 扣款
- **预警中心**：
  - 库存预警：低于建议库存自动提醒
  - 折扣率预警：低于85折或签单折扣率报警
  - 收款预警：已收款低于出库金额报警

### 6. 系统功能
- Excel/JSON导入导出
- 图片/视频上传（MinIO）
- 工作台数据看板
- OpenClaw员工智能体联调

---

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  React 18 + TypeScript + Ant Design 5 + Vite               ││
│  │  - Web管理后台 (apps/web)                                   ││
│  │  - 响应式设计、权限控制、表单验证                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        网关层 (Gateway)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Nginx / Traefik - 反向代理、负载均衡、SSL终止              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API层 (Backend)                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  NestJS 11 + Prisma 6.19 + TypeScript                      ││
│  │  - 多租户隔离 (Tenant Context)                              ││
│  │  - RBAC权限控制 (Owner/Admin/Member)                        ││
│  │  - JWT认证 + 刷新令牌                                       ││
│  │  - 审计日志、功能开关、限流控制                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌──────────┐         ┌──────────┐         ┌──────────┐
   │ PostgreSQL│         │  Redis   │         │  MinIO   │
   │  (主数据库)│         │ (缓存)   │         │ (对象存储)│
   └──────────┘         └──────────┘         └──────────┘
```

### 技术栈详情

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 前端 | React | 18.x | UI框架 |
| 前端 | TypeScript | 5.x | 类型安全 |
| 前端 | Ant Design | 5.x | 组件库 |
| 前端 | Vite | 7.x | 构建工具 |
| 后端 | NestJS | 11.x | API框架 |
| 后端 | Prisma | 6.19.x | ORM |
| 后端 | PostgreSQL | 17.x | 数据库 |
| 后端 | Redis | 7.x | 缓存 |
| 存储 | MinIO | latest | 对象存储 |
| 部署 | Docker | - | 容器化 |

---

## 🚀 快速开始

### 环境要求

- **Docker**: 24.0+ (推荐)
- **Node.js**: 20+ (本地开发)
- **Git**: 任意版本

### 方式一：Docker一键部署（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/symi-daguo/smart-home-salary.git
cd smart-home-salary

# 2. 启动所有服务
docker compose -f infra/docker-compose.yml up -d --build

# 3. 等待服务启动（约30秒）
sleep 30

# 4. 访问系统
# Web管理端: http://localhost:5173
# API文档: http://localhost:3000/docs
```

**默认账号**：
- 邮箱：`founder@yoursaas.com`
- 密码：`password`
- 租户：`acme`

### 方式二：本地开发环境

```bash
# 1. 克隆仓库
git clone https://github.com/symi-daguo/smart-home-salary.git
cd smart-home-salary

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp apps/api/.env.example apps/api/.env
# 编辑 apps/api/.env，配置数据库连接

# 4. 启动数据库
docker compose -f infra/docker-compose.yml up -d postgres redis minio

# 5. 执行数据库迁移
cd apps/api
npx prisma migrate dev
npx prisma db seed

# 6. 启动后端
cd apps/api
npm run start:dev

# 7. 启动前端（新终端）
cd apps/web
npm run dev
```

---

## 📦 部署指南

### 生产环境部署

#### 1. 服务器准备

```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 配置环境

```bash
# 克隆代码
git clone https://github.com/symi-daguo/smart-home-salary.git
cd smart-home-salary

# 复制生产环境配置
cp infra/.env.prod.example infra/.env.prod

# 编辑配置（必须修改）
nano infra/.env.prod
```

**关键配置项**：

```env
# 数据库（使用强密码）
DATABASE_URL=postgresql://user:STRONG_PASSWORD@postgres:5432/smarthome

# JWT密钥（生成随机字符串）
JWT_ACCESS_SECRET=your-random-access-secret
JWT_REFRESH_SECRET=your-random-refresh-secret

# MinIO（使用强密码）
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=STRONG_PASSWORD

# 域名配置
DOMAIN=your-domain.com
```

#### 3. 启动服务

```bash
# 启动生产环境
docker compose --env-file infra/.env.prod -f infra/docker-compose.prod.yml up -d --build

# 查看日志
docker compose -f infra/docker-compose.prod.yml logs -f

# 检查状态
docker compose -f infra/docker-compose.prod.yml ps
```

#### 4. 配置HTTPS（Nginx示例）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态资源
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 5. 数据备份

```bash
# 自动备份脚本
cd infra/backup
chmod +x backup.sh

# 添加到定时任务
crontab -e
# 添加: 0 2 * * * /path/to/smart-home-salary/infra/backup/backup.sh
```

---

## 📖 使用指南

### 首次使用

1. **登录系统**
   - 访问 Web 管理端
   - 使用默认账号登录
   - 首次登录后修改密码

2. **基础配置**
   - 进入「系统设置」→「公司信息」
   - 配置公司Logo、名称、联系方式
   - 设置默认岗位和员工类型

3. **添加员工**
   - 进入「组织架构」→「员工管理」
   - 点击「新增」创建员工档案
   - 绑定系统账号（可选）

### 日常操作流程

#### 项目管理流程

```
创建项目 → 添加标准产品清单 → 销售上报 → 出库申请 → 技术安装 → 项目完工
```

1. **创建项目**
   - 进入「业务管理」→「项目管理」
   - 填写客户信息、合同金额、签单折扣率
   - 添加标准产品清单

2. **销售上报**
   - 进入「业务上报」→「销售上报」
   - 选择项目，录入收款金额
   - 上传收款截图

3. **出库申请**
   - 进入「仓库管理」→「销售预出库申请」
   - 选择项目，添加出库商品
   - 提交申请等待审核

4. **审核出库**
   - 库管进入「确认出库审核」
   - 核对商品数量和类型
   - 确认生成出库单

5. **技术安装**
   - 技术人员进入「业务上报」→「技术上报」
   - 录入安装/调试记录
   - 关联出库商品

#### 工资结算流程

```
月底结算 → 选择员工 → 自动计算 → 确认生成 → 导出工资单
```

1. 进入「财务与风控」→「工资结算」
2. 选择结算月份
3. 系统自动计算：底薪 + 提成 + 技术费 + 补贴 - 扣款
4. 核对无误后确认生成
5. 导出Excel工资单

### 常见问题

#### Q1: 如何修改员工提成规则？

进入「组织架构」→「岗位管理」，编辑对应岗位的「提成规则」JSON配置。

#### Q2: 库存数量不对怎么办？

进入「仓库管理」→「库存盘点统计」，查看实时库存。如需调整，创建「未知入库单」或「丢失出库单」进行库存修正。

#### Q3: 预警信息太多如何关闭？

进入「财务与风控」→「预警中心」，点击对应预警的「标记已处理」。如需调整预警规则，联系系统管理员。

#### Q4: 如何导出数据？

各列表页面右上角均有「导出」按钮，支持Excel和JSON格式导出。

#### Q5: Docker部署后无法访问？

检查步骤：
1. `docker compose ps` 查看容器状态
2. `docker compose logs api` 查看后端日志
3. 确认端口未被占用（3000, 5173, 5432, 6379, 9000, 9001）
4. 检查防火墙设置

---

## 📚 API文档

系统提供完整的RESTful API，文档通过Swagger自动生成。

### 访问方式

- **本地开发**: http://localhost:3000/docs
- **生产环境**: https://your-domain.com/api/docs

### 认证方式

所有API请求需要携带JWT令牌：

```http
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>
```

### 主要API模块

| 模块 | 基础路径 | 说明 |
|------|---------|------|
| 认证 | `/api/auth` | 登录、注册、刷新令牌 |
| 租户 | `/api/tenants` | 租户管理、成员管理 |
| 岗位 | `/api/positions` | 岗位CRUD、提成规则 |
| 员工 | `/api/employees` | 员工档案管理 |
| 商品 | `/api/products` | 商品管理、库存查询 |
| 项目 | `/api/projects` | 项目管理、统计接口 |
| 销售 | `/api/sales-orders` | 销售上报 |
| 技术 | `/api/installation-records` | 安装调试记录 |
| 仓库 | `/api/warehouse` | 出入库单、库存、日志 |
| 工资 | `/api/salaries` | 工资结算 |
| 预警 | `/api/alerts` | 预警列表、运行检查 |

---

## 📝 版本历史

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
- 提交前运行测试：`npm test`
- 保持提交信息清晰

---

## 📄 许可证

[MIT](LICENSE) © 2026 SYMI团队

本项目基于 [Multi-Tenant-SaaS-Starter-NestJS](https://github.com/OwaliShawon/Multi-Tenant-SaaS-Starter-NestJS) 二次开发，保留MIT许可证。

---

## 💬 联系我们

- **GitHub Issues**: [提交问题](https://github.com/symi-daguo/smart-home-salary/issues)
- **邮箱**: 303316404@qq.com

---

**Built with ❤️ for the Smart Home Industry**
