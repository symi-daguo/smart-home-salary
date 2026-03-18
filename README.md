# 智能家居行业SaaS管理系统

[![Version](https://img.shields.io/badge/version-v1.1.8-blue.svg)](https://github.com/symi-daguo/smart-home-salary/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build](https://github.com/symi-daguo/smart-home-salary/actions/workflows/build.yml/badge.svg)](https://github.com/symi-daguo/smart-home-salary/actions/workflows/build.yml)

> 专为智能家居行业设计的综合管理系统，涵盖项目管理、工资计算、仓库管理、业务上报等核心功能。

## 🚀 快速开始

### 方式一：桌面版（推荐客户使用）

下载对应平台的安装包，双击安装即可使用。

> 说明（务必看清）：当前桌面版是 **Tauri 壳 + 已内嵌的前端页面资源**。
> - **A 方案（容器化/远端）**：桌面端只负责 UI，API/数据库由 Docker 或已部署环境提供。
> - **B 方案（离线一体化）**：桌面端会自动拉起本地 API（内置 Node sidecar），默认使用 SQLite + 本地上传目录（无需 Docker）。

| 平台 | 下载地址 | 说明 |
|------|---------|------|
| Windows | [GitHub Releases（选择 `*x64-setup.exe`）](https://github.com/symi-daguo/smart-home-salary/releases/latest) | Windows 10/11（推荐：NSIS `.exe`，双击安装） |
| macOS | [GitHub Releases（选择 `*.dmg`）](https://github.com/symi-daguo/smart-home-salary/releases/latest) | Apple Silicon |
| Linux | [GitHub Releases（选择 `*.AppImage`）](https://github.com/symi-daguo/smart-home-salary/releases/latest) | 通用 Linux（推荐：AppImage，最省心） |

### 方式二：Docker部署（推荐开发者）

```bash
git clone https://github.com/symi-daguo/smart-home-salary.git
cd smart-home-salary/infra && docker compose up -d --build
```

访问地址：
- Web界面: http://localhost:5173
- API文档: http://localhost:3000/docs
- 健康检查: http://localhost:3000/api/health

发布前验证（推荐一键脚本）：

```bash
chmod +x infra/verify/verify.sh
./infra/verify/verify.sh
```

### 生产环境安全提示（务必阅读）

- **生产环境禁止使用默认弱密码**：请参考 `infra/.env.prod.example`，务必替换 Postgres / MinIO / JWT / OpenClaw 等所有敏感配置。
- **首次上线建议**：关闭 Swagger（`SWAGGER_ENABLED=false`）、配置反向代理与 HTTPS、限制 OpenClaw 网关端口对公网暴露。

### 默认账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 创始人 | founder@yoursaas.com | password |
| 管理员 | admin@demo.local | password |
| 销售 | sales@demo.local | password |
| 技术员 | technician@demo.local | password |
| 财务 | finance@demo.local | password |

## 📁 项目结构

```
smarthome/
├── apps/
│   ├── api/                    # NestJS 后端 API
│   │   ├── src/                # 源代码
│   │   └── prisma/             # 数据库模型
│   └── web/                    # React 前端
│       └── src/                # 源代码
├── src-tauri/                  # Tauri 桌面应用
│   ├── src/                    # Rust 源码
│   └── tauri.conf.json         # Tauri 配置
├── infra/                      # Docker 部署配置
└── docs/                       # 文档
    └── TAURI_BUILD.md          # 打包指南
```

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 后端 | NestJS 11 + Prisma + PostgreSQL/SQLite |
| 前端 | React 19 + TypeScript + Ant Design 6 |
| 桌面 | Tauri 2.0 + Rust |
| 缓存 | Redis 7 |
| 存储 | MinIO |

## 📊 功能模块

| 模块 | 功能 |
|------|------|
| 组织架构 | 租户管理、用户管理、角色权限、岗位管理 |
| 项目管理 | 项目创建、状态跟踪、应收款计算、折扣率计算 |
| 业务上报 | 销售上报、技术上报、测量工勘、窗帘下单 |
| 工资管理 | 工资单生成、技术提成计算、审核发放 |
| 仓库管理 | 出入库管理、库存盘点、库存预警 |
| 预警中心 | 销售预警、库存预警、规则配置 |
| 数据看板 | 营收趋势、品类分布、动态记录 |
| OpenClaw智能体 | 语音/文字交互、意图识别、实体提取 |

## 🔌 API 接口

| 模块 | 路径 | 模块 | 路径 |
|------|------|------|------|
| 认证 | `/api/auth` | 租户 | `/api/tenants` |
| 用户 | `/api/users` | 员工 | `/api/employees` |
| 项目 | `/api/projects` | 销售 | `/api/sales-orders` |
| 技术 | `/api/installation-records` | 工资 | `/api/payrolls` |
| 产品 | `/api/products` | 仓库 | `/api/warehouse` |
| 看板 | `/api/dashboard` | 预警 | `/api/alerts` |
| OpenClaw | `/api/openclaw` | 窗帘 | `/api/curtain-orders` |

## 📝 版本历史

### v1.1.8 (2026-03-18)
- 桌面端新增 **B 方案（离线一体化）**：启动时自动拉起本地 API（sidecar），默认使用 SQLite + 本地上传目录
- 前端在 Tauri 环境下默认连接 `http://127.0.0.1:3000/api`（A 方案仍可通过配置指向远端/容器化 API）

### v1.1.7 (2026-03-18)
- 需求确认：窗帘下单补齐送货上门接收人候选、送仓库/手动地址分支、房间媒体上传（图片≤3、视频≤30秒）
- 需求确认：仓库出入库单补齐图片上传、关联单据多选、SN 码批量导入与数量一致校验（后端强校验）
- 预警中心：新增规则配置接口与页面开关/阈值配置（AlertRule）

### v1.1.6 (2026-03-17)
- 工资结算：支持手动修正工资数据（底薪、提成、技术费、补贴、扣款）
- 工资结算：新增按员工筛选功能，可选择查看特定员工的工资记录
- 工资结算：新增导出Excel功能，支持按筛选条件导出工资单
- 数据备份：备份功能健全，包含Postgres pg_dump和MinIO bucket镜像
- 数据备份：支持定时备份和自动清理旧备份，恢复脚本完整

### v1.0.0 - v1.1.5（阶段汇总）
- 业务闭环：组织架构、项目管理、销售/技术上报、工资结算、仓库管理、预警中心、数据看板等核心模块
- 平台能力：多租户隔离（tenantId）、RBAC 权限、审计/日志、Docker 一键部署
- 桌面端：Tauri 跨平台打包链路（Windows NSIS / macOS DMG / Linux AppImage），并增强 Windows 启动失败可定位性
- 仓库：出入库单、库存盘点、SN 追踪、作废/冲销机制等

[查看完整版本历史](apps/api/CHANGELOG.md)

## 📦 桌面应用打包

详见 [Tauri 打包指南](docs/TAURI_BUILD.md)

### 快速打包命令

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 生产打包
npm run tauri:build
```

### 输出位置

| 平台 | 路径 |
|------|------|
| Windows | `src-tauri/target/release/bundle/nsis/` |
| macOS | `src-tauri/target/release/bundle/dmg/` |
| Linux | `src-tauri/target/release/bundle/appimage/` |

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

## 📄 许可证

[MIT](LICENSE) License © 2026 SYMI-DA GUO
