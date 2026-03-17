# API（apps/api）

本仓库采用 **monorepo**，后端 API 位于 `apps/api/`。

- **快速入口**：请以根文档为准 `README.md`
- **本地 Swagger**：启动后访问 `http://localhost:3000/docs`

## 常用命令

```bash
# 安装依赖（建议在仓库根目录执行一次）
npm install

# 启动 API（热重载）
npm run api:dev
```

## 环境变量

- 示例文件在 `apps/api/.env.example`
- Docker 开发环境请以 `infra/docker-compose.yml` 为准
