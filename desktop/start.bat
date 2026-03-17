@echo off
echo ========================================
echo 智能家居SaaS管理系统 - 桌面版
echo ========================================
echo.

:: Set environment
set APP_DIR=%~dp0
set DB_PATH=%APP_DIR%data\data.db
set BACKUP_DIR=%APP_DIR%data\backups

:: Create directories
if not exist "%APP_DIR%data" mkdir "%APP_DIR%data"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if database exists
if exist "%DB_PATH%" (
    echo [INFO] Database found: %DB_PATH%
    
    :: Create backup
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set BACKUP_FILE=%BACKUP_DIR%\backup_%datetime:~0,8%.db
    copy "%DB_PATH%" "%BACKUP_FILE%" >nul 2>&1
    echo [INFO] Backup created: %BACKUP_FILE%
) else (
    echo [INFO] Creating new database...
)

:: Start backend server
echo [INFO] Starting backend server...
cd /d "%APP_DIR%api"
start /b node main.js

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend server
echo [INFO] Starting frontend server...
cd /d "%APP_DIR%web"
start /b npx serve -s . -l 5173

:: Wait for frontend to start
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo 系统启动成功！
echo ========================================
echo.
echo 访问地址: http://localhost:5173
echo 数据目录: %APP_DIR%data
echo 备份目录: %BACKUP_DIR%
echo.
echo 默认账号:
echo   邮箱: founder@yoursaas.com
echo   密码: password
echo.
echo 按任意键打开浏览器...
pause >nul

:: Open browser
start http://localhost:5173

echo.
echo 系统正在运行，关闭此窗口将停止服务。
echo 按任意键停止服务...
pause >nul

:: Stop services
taskkill /f /im node.exe >nul 2>&1
echo [INFO] Services stopped.
