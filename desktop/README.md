# 智能家居SaaS管理系统 - 桌面版

## 快速开始

### 系统要求
- Windows 10/11 或 macOS 10.15+
- Node.js 18+ (已内置)
- 4GB RAM 以上

- 500MB 可用磁盘空间

### 安装步骤

#### Windows用户
1. 双击 `start.bat` 启动应用
2. 浏览器会自动打开 http://localhost:5173
3. 使用默认账号登录：
   - 邮箱：`founder@yoursaas.com`
   - 密码：`password`

#### Mac/Linux用户
1. 打开终端，进入应用目录
2. 运行 `./start.sh`
3. 浏览器访问 http://localhost:5173

## 数据存储

### 数据库位置
- Windows: `应用目录/data/data.db`
- Mac/Linux: `应用目录/data/data.db`

### 数据备份
应用会自动在 `data/backups/` 目录创建数据库备份：
- 每次启动时自动备份
- 保留最近7天的备份

### 手动备份
```bash
# Windows
copy data\data.db data\backups\backup_%date%.db

# Mac/Linux
cp data/data.db data/backups/backup_$(date +%Y%m%d).db
```

## 功能模块

### 1. 组织架构
- 用户管理：创建、编辑、删除用户
- 角色权限：OWNER/ADMIN/MEMBER
- 岗位管理：销售岗、技术岗、财务岗

### 2. 项目管理
- 项目创建与跟踪
- 项目状态管理
- 应收款计算

### 3. 业务上报
- 销售上报
- 技术上报
- 测量工勘
- 窗帘下单

### 4. 仓库管理
- 出入库管理
- 库存盘点
- 库存预警

### 5. 工资管理
- 工资单生成
- 技术提成计算

### 6. 预警中心
- 销售预警
- 库存预警

### 7. 数据看板
- 营收趋势
- 业务统计

## 常见问题

### Q: 端口被占用怎么办？
A: 修改 `start.bat` 或 `start.sh` 中的端口号：
- 前端：5173
- 后端：3000

### Q: 如何迁移数据？
A: 
1. 从原系统导出数据（JSON格式）
2. 在桌面版导入数据

### Q: 数据丢失怎么办？
A: 
1. 检查 `data/backups/` 目录
2. 复制最新的备份文件到 `data/data.db`

## 技术支持

如有问题，请联系：
- Email: support@smarthome.com
- GitHub: https://github.com/symi-daguo/smart-home-salary

## 版本信息

- 版本：1.1.2
- 发布日期：2026-03-17
- 开发者：SYMI-DA GUO
