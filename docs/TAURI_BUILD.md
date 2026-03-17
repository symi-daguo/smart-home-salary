# Tauri 桌面应用打包指南

本文档详细说明如何在不同操作系统上打包智能家居SaaS管理系统的桌面应用。

## 系统要求

### 通用要求
- Node.js 20+
- Rust 1.77+
- Tauri CLI 2.0+

### Windows 额外要求
- Microsoft Visual Studio C++ Build Tools
- Windows 10/11 SDK
- WebView2 (Windows 10/11 已内置)

### macOS 额外要求
- Xcode 14+
- Xcode Command Line Tools

### Linux 额外要求
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

## 安装依赖

### 1. 安装 Rust
```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows (PowerShell)
winget install Rustlang.Rustup
```

### 2. 安装 Tauri CLI
```bash
npm install -D @tauri-apps/cli@latest @tauri-apps/api@latest
```

## 打包命令

### 开发模式
```bash
npm run tauri:dev
```

### 生产打包
```bash
npm run tauri:build
```

## 输出文件位置

### macOS
```
src-tauri/target/release/bundle/
├── macos/
│   └── SmartHome.app          # macOS 应用包 (3.9MB)
├── dmg/
│   └── SmartHome_1.0.9_aarch64.dmg  # macOS 安装包 (29MB)
└── share/
    └── ...                     # 系统集成文件
```

### Windows
```
src-tauri/target/release/bundle/
├── msi/
│   └── SmartHome_1.0.9_x64.msi  # Windows 安装包
└── nsis/
    └── SmartHome_1.0.9_x64-setup.exe  # NSIS 安装包
```

### Linux
```
src-tauri/target/release/bundle/
├── deb/
│   └── smart-home_1.0.9_amd64.deb  # Debian/Ubuntu 包
├── appimage/
│   └── smart-home_1.0.9_amd64.AppImage  # 通用 Linux 包
└── rpm/
    └── smart-home-1.0.9.x86_64.rpm  # RedHat/Fedora 包
```

## Windows 打包详细步骤

### 1. 安装 Visual Studio Build Tools
下载地址: https://visualstudio.microsoft.com/visual-cpp-build-tools/

选择安装:
- "使用 C++ 的桌面开发"
- Windows 10/11 SDK
- MSVC v143 生成工具

### 2. 安装 WebView2 (可选)
Windows 10/11 通常已内置。如需手动安装:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### 3. 执行打包
```powershell
# 在项目根目录
npm install
npm run tauri:build
```

### 4. 查找输出文件
打包完成后，安装包位于:
```
src-tauri\target\release\bundle\msi\SmartHome_1.0.9_x64.msi
```

## 跨平台打包注意事项

### macOS -> Windows (交叉编译)
不支持直接交叉编译。需要在 Windows 环境中打包 Windows 版本。

推荐方案:
1. 使用 GitHub Actions 自动化打包
2. 使用虚拟机或云服务器

### GitHub Actions 自动打包
创建 `.github/workflows/build.yml`:

```yaml
name: Build Desktop App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-22.04, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install dependencies (Ubuntu only)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev
      
      - name: Install npm dependencies
        run: npm install
      
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'SmartHome v__VERSION__'
          releaseBody: 'See CHANGELOG.md for details.'
          releaseDraft: true
          prerelease: false
```

## 配置文件说明

### tauri.conf.json
主要配置文件，位于 `src-tauri/tauri.conf.json`

关键配置项:
```json
{
  "productName": "SmartHome",
  "version": "1.0.9",
  "identifier": "com.smarthome.desktop",
  "build": {
    "frontendDist": "../apps/web/dist",
    "devUrl": "http://localhost:5173"
  },
  "bundle": {
    "active": true,
    "targets": "all"
  }
}
```

### Cargo.toml
Rust 项目配置，位于 `src-tauri/Cargo.toml`

## 常见问题

### Q: 打包时提示 "rustc not found"
A: 确保 Rust 已正确安装并添加到 PATH:
```bash
source ~/.cargo/env  # macOS/Linux
# 或重启终端/PowerShell
```

### Q: Windows 打包失败 "linker 'link.exe' not found"
A: 安装 Visual Studio Build Tools，确保选择 C++ 桌面开发组件。

### Q: macOS 打包 DMG 失败
A: DMG 打包需要管理员权限，可以只打包 .app:
```bash
npx tauri build --bundles app
```

### Q: 如何减小应用体积
A: 在 `Cargo.toml` 中启用优化:
```toml
[profile.release]
opt-level = "z"
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.9 | 2026-03-17 | 初始 Tauri 打包支持 |

## 参考链接

- [Tauri 官方文档](https://tauri.app/)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)
- [Rust 安装指南](https://rustup.rs/)
