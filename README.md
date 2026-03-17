# 智能家居行业SaaS管理系统

[![Version](https://img.shields.io/badge/version-v1.1.5-blue.svg)](https://github.com/symi-daguo/smart-home-salary/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build](https://github.com/symi-daguo/smart-home-salary/actions/workflows/build.yml/badge.svg)](https://github.com/symi-daguo/smart-home-salary/actions/workflows/build.yml)

> 专为智能家居行业设计的综合管理系统，涵盖项目管理、工资计算、仓库管理、业务上报等核心功能。

## 🚀 快速开始

### 方式一：桌面版（推荐客户使用）

下载对应平台的安装包，双击安装即可使用，数据存储在本地。

| 平台 | 下载地址 | 说明 |
|------|---------|------|
| Windows | [GitHub Releases（选择 `*x64-setup.exe`）](https://github.com/symi-daguo/smart-home-salary/releases/latest) | Windows 10/11（推荐：NSIS `.exe`，双击安装） |
| macOS | [GitHub Releases（选择 `*.dmg`）](https://github.com/symi-daguo/smart-home-salary/releases/latest) | Apple Silicon |
| Linux | [GitHub Releases（选择 `*.AppImage`）](https://github.com/symi-daguo/smart-home-salary/releases/latest) | 通用 Linux（推荐：AppImage，最省心） |

### 方式二：Docker部署（推荐开发者）

```bash
git clone https://github.com/symi-daguo/smart-home-salary.git
cd smart-home-salary/infra && docker compose up -d
```

访问地址：
- Web界面: http://localhost:5173
- API文档: http://localhost:3000/docs

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

### v1.1.5 (2026-03-17)
- 安全：Tauri 启用 CSP（不再使用 `csp: null`），收敛攻击面
- 安全：移除不必要的 Shell 插件与过宽权限（不再允许任意 `execute/spawn/kill`）
- Windows：安装后“无反应”场景增强可定位性（启动失败弹窗 + 写入日志）

### v1.1.4 (2026-03-17)
- Windows：启动失败弹窗提示 + 写入日志文件（便于定位“安装后无反应”）
- 文档：客户友好化（下载统一指向 Releases latest，压缩 1.0.x 历史）

### v1.1.3 (2026-03-17)
- Windows：NSIS 安装包离线集成 WebView2 Runtime，修复“安装后无法启动”
- 桌面版：Release 构建启用日志输出，便于定位启动问题

### v1.1.2 (2026-03-17)
- 修复 OpenClaw 接口租户/用户上下文与权限保护
- 修复仓库日志 operator 口径（按员工档案记录）
- Prisma：增加租户维度唯一约束（库存、出库申请单号、出入库单号）
- 前端：侧边栏版本号改为构建注入动态展示

### v1.1.1 (2026-03-17)
- 修复 GitHub Actions 构建失败问题

### v1.1.0 (2026-03-17)
- 新增 GitHub Actions 自动化跨平台打包
- 优化 README.md 文档结构
- 完善 Windows/macOS/Linux 安装包

### v1.0.0 - v1.0.9（阶段汇总）
- 完成核心业务能力：组织架构、项目、业务上报、工资、仓库、预警、看板等模块
- 引入多租户与权限体系（租户隔离、RBAC）、审计日志与基础运维能力
- 桌面端：引入 Tauri 打包与本地数据存储（SQLite），完善跨平台发布链路

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
