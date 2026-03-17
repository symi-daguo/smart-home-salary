# Tauri 桌面应用打包指南

> **当前版本：v1.1.2** | **最后更新：2026-03-17**

本文档详细说明如何打包智能家居 SaaS 管理系统的桌面应用，支持 Windows、macOS 和 Linux。

## 快速开始

### 一键打包命令

```bash
# 开发模式（热重载）
npm run tauri:dev

# 生产打包（生成安装包）
npm run tauri:build
```

### 输出文件位置

打包成功后，安装包位于 `src-tauri/target/release/bundle/`：

```
bundle/
├── msi/           # Windows MSI 安装包
│   └── SmartHome_1.1.2_x64.msi
├── nsis/          # Windows NSIS 安装包
│   └── SmartHome_1.1.2_x64-setup.exe
├── macos/         # macOS App
│   └── SmartHome.app
├── dmg/           # macOS DMG 安装包
│   └── SmartHome_1.1.2_aarch64.dmg
├── deb/           # Linux DEB 包
│   └── smart-home_1.1.2_amd64.deb
└── appimage/      # Linux AppImage
    └── smart-home_1.1.2_amd64.AppImage
```

---

## 系统要求

### 通用要求
- **Node.js**: 20+ (推荐 v22)
- **npm**: 10+
- **Rust**: 1.77.2+
- **磁盘空间**: 至少 5GB

### Windows 额外要求
- **Visual Studio Build Tools 2022**
  - 必须安装："使用 C++ 的桌面开发"
  - Windows 10/11 SDK
  - MSVC v143 生成工具
- **WebView2**: Windows 10/11 已内置

### macOS 额外要求
- **Xcode 14+**
- **Xcode Command Line Tools**

### Linux 额外要求
```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev \
  build-essential curl wget file \
  libxdo-dev libssl-dev librsvg2-dev \
  libayatana-appindicator3-dev
```

---

## 详细安装步骤

### 1. 安装 Rust

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

**Windows (PowerShell):**
```powershell
winget install Rustlang.Rustup
```

**验证安装:**
```bash
rustc --version  # 应显示 rustc 1.77.2+
```

### 2. 安装项目依赖

```bash
# 根目录安装
npm install

# 前端依赖
cd apps/web && npm install

# 返回根目录
cd ../..
```

### 3. 验证配置

```bash
# 检查 Tauri CLI
npx tauri --version

# 检查前端构建
cd apps/web && npm run build
cd ../..
```

---

## Windows 打包详细步骤

### 步骤 1: 安装 Visual Studio Build Tools

1. 下载：https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. 运行安装程序，选择 **"桌面开发"**
3. 确保勾选以下组件：
   - ✅ MSVC v143 - VS 2022 C++ x64/x86 生成工具
   - ✅ Windows 10/11 SDK
   - ✅ C++ CMake 工具

### 步骤 2: 执行打包

```powershell
# 在项目根目录
npm install
npm run tauri:build
```

### 步骤 3: 验证输出

打包完成后，检查以下文件：

```
src-tauri\target\release\bundle\
├── msi\
│   └── SmartHome_1.1.2_x64.msi          # 约 30MB
└── nsis\
    └── SmartHome_1.1.2_x64-setup.exe    # 约 25MB
```

### 步骤 4: 安装测试

1. 双击 `.msi` 或 `.exe` 安装包
2. 完成安装向导
3. 启动应用，验证：
   - ✅ 应用正常打开
   - ✅ 标题显示 "智能家居 SaaS 管理系统"
   - ✅ 可以登录并使用所有功能
   - ✅ 无崩溃或错误

---

## macOS 打包步骤

```bash
# 执行打包
npm run tauri:build

# 验证输出
ls -lh src-tauri/target/release/bundle/
```

**预期输出:**
```
macos/
└── SmartHome.app (19MB)
dmg/
└── SmartHome_1.1.2_aarch64.dmg (2.7MB)
```

---

## GitHub Actions 自动打包

### 1. 配置 Workflow

`.github/workflows/build.yml` 已配置完成，会自动构建三平台安装包。

**关键配置:**
```yaml
permissions:
  contents: write  # 允许创建 Release

on:
  push:
    tags:
      - 'v*'  # 推送 tag 时触发

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-22.04, windows-latest]
```

### 2. 配置 GitHub 仓库权限

**必须手动配置:**

1. 进入 GitHub 仓库 → **Settings** → **Actions** → **General**
2. 找到 **"Workflow permissions"**
3. 选择 **"Read and write permissions"**
4. 勾选 **"Allow GitHub Actions to create and approve pull requests"**
5. 点击 **Save**

### 3. 触发自动打包

```bash
# 提交所有更改
git add .
git commit -m "release: v1.1.2 桌面应用打包优化"

# 打 tag（会自动触发 GitHub Actions）
git tag v1.1.2
git push origin main
git push origin v1.1.2
```

### 4. 验证构建结果

1. 访问：https://github.com/symi-daguo/smart-home-salary/actions
2. 等待构建完成（约 10-15 分钟）
3. 检查：
   - ✅ 所有平台构建成功（绿色对勾）
   - ✅ 生成了 GitHub Release
   - ✅ Release 包含 6 个安装包

---

## 配置文件说明

### tauri.conf.json

位置：`src-tauri/tauri.conf.json`

**v1.1.2 关键配置:**

```json
{
  "productName": "SmartHome",
  "version": "1.1.2",
  "identifier": "com.smarthome.desktop",
  "build": {
    "frontendDist": "../apps/web/dist",
    "beforeBuildCommand": "cd apps/web && npm run build"
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "windows": {
      "wix": {
        "language": "zh-CN",
        "template": "default"
      },
      "nsis": {
        "languages": ["SimpChinese", "English"],
        "displayLanguageSelector": true
      }
    }
  },
  "plugins": {
    "shell": {
      "scope": [
        {
          "name": "api",
          "path": "**"
        }
      ]
    }
  }
}
```

**配置要点:**
- `version`: 必须与 `package.json` 一致
- `identifier`: 唯一标识符（推荐：`com.公司名.应用名`）
- `bundle.windows.wix`: Windows MSI 打包配置
- `bundle.windows.nsis`: Windows NSIS 打包配置
- `plugins.shell.scope`: Tauri 2.0 权限配置（不再使用 sidecar）

### Cargo.toml

位置：`src-tauri/Cargo.toml`

```toml
[package]
name = "smarthome"
version = "1.1.2"
edition = "2021"
rust-version = "1.77.2"

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
tauri-plugin-log = "2"

[profile.release]
opt-level = "z"
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

---

## 常见问题与解决方案

### Q1: GitHub Actions 权限错误

**错误:** `Resource not accessible by integration`

**解决方案:**
1. 检查 `.github/workflows/build.yml` 是否包含：
   ```yaml
   permissions:
     contents: write
   ```
2. 在 GitHub 仓库设置中启用写入权限（见上文）
3. 重新触发构建

### Q2: Windows 不生成 MSI 文件

**检查清单:**
- [ ] `tauri.conf.json` 中 `bundle.windows.wix` 配置存在
- [ ] `language` 设置为 `"zh-CN"` 或 `"en-US"`
- [ ] `src-tauri/icons/icon.ico` 文件存在
- [ ] Visual Studio Build Tools 已正确安装

**验证命令:**
```powershell
# 检查 Rust 工具链
rustc --version

# 检查 MSVC
cl  # 应显示 MSVC 版本信息
```

### Q3: 构建时提示 sidecar 错误

**原因:** Tauri 2.0 不再使用 sidecar 模式

**解决方案:** 改用 shell scope 配置：

```json
{
  "plugins": {
    "shell": {
      "scope": [
        {
          "name": "api",
          "path": "**"
        }
      ]
    }
  }
}
```

### Q4: Rust 编译错误

**常见错误:**
- `rustc not found`: 运行 `source ~/.cargo/env`
- `linker 'link.exe' not found`: 安装 Visual Studio Build Tools
- 依赖版本冲突: 运行 `cargo update`

### Q5: 前端构建失败

**解决方案:**
```bash
cd apps/web
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

### Q6: 应用体积过大

**优化方案:** `Cargo.toml` 中启用极致优化：

```toml
[profile.release]
opt-level = "z"
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
```

**效果:**
- macOS DMG: 29MB → 2.7MB
- Windows MSI: 45MB → 30MB

---

## v1.1.2 版本修复内容

### 修复的问题

1. **Rust 代码警告**
   - 移除 `lib.rs` 中未使用的导入
   - 修复未使用变量警告

2. **GitHub Actions 权限**
   - 添加 `permissions: contents: write`
   - 允许自动创建 GitHub Release

3. **Tauri 配置优化**
   - 完善 Windows MSI/NSIS 打包配置
   - 从 sidecar 迁移到 shell scope（Tauri 2.0）

4. **构建流程优化**
   - 前端构建产物优化（gzip 压缩）
   - Rust 编译优化配置

### 构建验证

**本地构建（macOS）:**
```bash
npm run tauri:build
```

**构建输出:**
```
✓ Frontend built in 4.01s
✓ Rust application built in 51.73s
✓ Bundled SmartHome.app (19MB)
✓ Bundled SmartHome_1.1.2_aarch64.dmg (2.7MB)
```

**GitHub Actions:**
- ✅ macOS: DMG 生成成功
- ✅ Windows: MSI + NSIS 生成成功
- ✅ Linux: DEB + AppImage 生成成功

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1.2 | 2026-03-17 | 修复 GitHub Actions 权限、Windows 打包配置、Rust 警告 |
| 1.1.1 | 2026-03-17 | GitHub Actions 构建修复 |
| 1.1.0 | 2026-03-17 | GitHub Actions 自动化打包 |
| 1.0.9 | 2026-03-17 | Tauri 2.0 桌面应用打包支持 |

---

## 技术支持

- **Tauri 官方文档**: https://tauri.app/
- **GitHub Issues**: https://github.com/symi-daguo/smart-home-salary/issues
- **邮箱**: 303316404@qq.com
