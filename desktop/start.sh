#!/bin/bash

echo "=========================================="
echo "智能家居SaaS管理系统 - 桌面版"
echo "=========================================="
echo ""

# Set environment
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_PATH="$APP_DIR/data/data.db"
BACKUP_DIR="$APP_DIR/data/backups"
PID_FILE="$APP_DIR/.smarthome.pid"

# Create directories
mkdir -p "$APP_DIR/data"
mkdir -p "$BACKUP_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if database exists
if [ -f "$DB_PATH" ]; then
    echo "[INFO] Database found: $DB_PATH"
    
    # Create backup
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d).db"
    cp "$DB_PATH" "$BACKUP_FILE"
    echo "[INFO] Backup created: $BACKUP_FILE"
else
    echo "[INFO] Creating new database..."
fi

# Function to stop services
stop_services() {
    echo ""
    echo "[INFO] Stopping services..."
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            kill "$pid" 2>/dev/null
        done < "$PID_FILE"
        rm "$PID_FILE"
    fi
    echo "[INFO] Services stopped."
    exit 0
}

# Trap Ctrl+C
trap stop_services INT TERM

# Start backend server
echo "[INFO] Starting backend server..."
cd "$APP_DIR/api"
node main.js &
echo $! >> "$PID_FILE"

# Wait for backend to start
sleep 3

# Start frontend server
echo "[INFO] Starting frontend server..."
cd "$APP_DIR/web"
npx serve -s . -l 5173 &
echo $! >> "$PID_FILE"

# Wait for frontend to start
sleep 2

echo ""
echo "=========================================="
echo "系统启动成功！"
echo "=========================================="
echo ""
echo "访问地址: http://localhost:5173"
echo "数据目录: $APP_DIR/data"
echo "备份目录: $BACKUP_DIR"
echo ""
echo "默认账号:"
echo "  邮箱: founder@yoursaas.com"
echo "  密码: password"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# Try to open browser
if command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
fi

# Wait for Ctrl+C
wait
