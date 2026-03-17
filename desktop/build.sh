#!/bin/bash

echo "=========================================="
echo "智能家居SaaS管理系统 - 桌面版打包脚本"
echo "=========================================="
echo ""

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DESKTOP_DIR="$PROJECT_ROOT/desktop"

echo "[1/6] 清理旧的构建文件..."
rm -rf "$DESKTOP_DIR/api"
rm -rf "$DESKTOP_DIR/web"
rm -rf "$DESKTOP_DIR/data"
mkdir -p "$DESKTOP_DIR/api"
mkdir -p "$DESKTOP_DIR/web"
mkdir -p "$DESKTOP_DIR/data/backups"

echo "[2/6] 构建前端..."
cd "$PROJECT_ROOT/apps/web"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cp -r dist/* "$DESKTOP_DIR/web/"

echo "[3/6] 构建后端（SQLite版本）..."
cd "$PROJECT_ROOT/apps/api"
if [ ! -d "node_modules" ]; then
    npm install
fi

# 切换到SQLite schema
cp prisma/schema.sqlite.prisma prisma/schema.prisma

# 生成Prisma Client
npx prisma generate

# 构建NestJS
npm run build

# 复制构建产物
cp -r dist/* "$DESKTOP_DIR/api/"
cp -r node_modules "$DESKTOP_DIR/api/"
cp -r prisma "$DESKTOP_DIR/api/"
cp package.json "$DESKTOP_DIR/api/"
cp .env.sqlite "$DESKTOP_DIR/api/.env"

# 初始化SQLite数据库
cd "$DESKTOP_DIR/api"
npx prisma db push

echo "[4/6] 复制启动脚本..."
cp "$SCRIPT_DIR/start.bat" "$DESKTOP_DIR/"
cp "$SCRIPT_DIR/start.sh" "$DESKTOP_DIR/"
chmod +x "$DESKTOP_DIR/start.sh"

echo "[5/6] 创建默认数据..."
cd "$DESKTOP_DIR/api"
# 运行种子数据脚本
npx ts-node prisma/seed.ts 2>/dev/null || echo "Seed script not found, skipping..."

echo "[6/6] 创建分发包..."
cd "$PROJECT_ROOT"
VERSION=$(node -p "require('./apps/api/package.json').version")
zip -r "smarthome-desktop-v${VERSION}.zip" desktop/

echo ""
echo "=========================================="
echo "打包完成！"
echo "=========================================="
echo ""
echo "输出文件: smarthome-desktop-v${VERSION}.zip"
echo "解压后运行 start.bat (Windows) 或 start.sh (Mac/Linux)"
echo ""
