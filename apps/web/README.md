# SYMI - 前端 Web (SmartHome Cloud ERP Web)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign)](https://ant.design/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

> SYMI前端 Web 应用，基于 React + TypeScript + Ant Design + Vite 构建，提供智能家居行业的管理后台界面。

---

## 📋 目录

- [项目简介](#-项目简介)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [开发指南](#-开发指南)
- [构建部署](#-构建部署)
- [常见问题](#-常见问题)

---

## 🏠 项目简介

SYMI前端 Web 是面向智能家居行业的 SaaS 管理平台前端应用，提供完整的业务管理界面，包括：

- **组织架构**：岗位、员工类型、员工管理
- **业务管理**：商品、项目、销售上报、技术上报
- **仓库管理**：出入库单、库存盘点、出库申请
- **测量工勘**：信息记录、窗帘下单
- **财务风控**：工资结算、预警中心
- **系统设置**：公司信息、权限管理

---

## 🛠️ 技术栈

### 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| [React](https://react.dev/) | 18.x | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 5.3.x | 类型安全 |
| [Vite](https://vitejs.dev/) | 7.x | 构建工具 |
| [Ant Design](https://ant.design/) | 5.x | 组件库 |
| [React Router](https://reactrouter.com/) | 7.x | 路由管理 |
| [Axios](https://axios-http.com/) | 1.x | HTTP 客户端 |
| [Zustand](https://github.com/pmndrs/zustand) | 5.x | 状态管理 |

### 主要依赖

```json
{
  "react": "^18.3.1",
  "antd": "^5.23.0",
  "react-router-dom": "^7.1.1",
  "axios": "^1.7.9",
  "zustand": "^5.0.3",
  "dayjs": "^1.11.13",
  "@ant-design/icons": "^5.5.2"
}
```

---

## 📁 项目结构

```
apps/web/
├── public/                    # 静态资源
│   └── vite.svg
├── src/
│   ├── main.tsx               # 应用入口
│   ├── App.tsx                # 根组件
│   ├── api/                   # API 接口
│   │   ├── http.ts            # Axios 配置
│   │   ├── auth.ts            # 认证接口
│   │   ├── positions.ts       # 岗位接口
│   │   ├── employees.ts       # 员工接口
│   │   ├── products.ts        # 商品接口
│   │   ├── projects.ts        # 项目接口
│   │   ├── sales-orders.ts    # 销售接口
│   │   ├── installation-records.ts  # 技术接口
│   │   ├── warehouse.ts       # 仓库接口
│   │   ├── salaries.ts        # 工资接口
│   │   ├── alerts.ts          # 预警接口
│   │   └── excel.ts           # Excel接口
│   ├── components/            # 公共组件
│   │   ├── PageHeader.tsx     # 页面头部
│   │   ├── SearchForm.tsx     # 搜索表单
│   │   └── UploadButton.tsx   # 上传按钮
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useAuth.ts         # 认证 Hook
│   │   └── useTenant.ts       # 租户 Hook
│   ├── layouts/               # 布局组件
│   │   ├── AdminLayout.tsx    # 管理后台布局
│   │   └── AuthLayout.tsx     # 认证布局
│   ├── pages/                 # 页面组件
│   │   ├── LoginPage.tsx      # 登录页
│   │   ├── DashboardPage.tsx  # 工作台
│   │   ├── PositionsPage.tsx  # 岗位管理
│   │   ├── EmployeesPage.tsx  # 员工管理
│   │   ├── ProductsPage.tsx   # 商品管理
│   │   ├── ProjectsPage.tsx   # 项目管理
│   │   ├── SalesOrdersPage.tsx    # 销售上报
│   │   ├── InstallationRecordsPage.tsx  # 技术上报
│   │   ├── MeasurementSurveysPage.tsx   # 测量工勘
│   │   ├── CurtainOrdersPage.tsx        # 窗帘下单
│   │   ├── OutboundApplicationsPage.tsx # 出库申请
│   │   ├── WarehouseOrdersPage.tsx      # 出入库单
│   │   ├── InventoryPage.tsx            # 库存盘点
│   │   ├── WarehouseOrderLogsPage.tsx   # 操作日志
│   │   ├── SalariesPage.tsx     # 工资结算
│   │   ├── AlertsPage.tsx       # 预警中心
│   │   └── SettingsPage.tsx     # 系统设置
│   ├── stores/                # 状态管理
│   │   ├── authStore.ts       # 认证状态
│   │   └── tenantStore.ts     # 租户状态
│   ├── utils/                 # 工具函数
│   │   ├── constants.ts       # 常量定义
│   │   ├── formRules.ts       # 表单验证规则
│   │   └── helpers.ts         # 辅助函数
│   └── styles/                # 样式文件
│       └── global.css
├── .env.example               # 环境变量示例
├── index.html                 # HTML 模板
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
└── package.json
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.x LTS
- **npm**: 10.x 或 **yarn**: 1.22+

### 安装步骤

```bash
# 1. 进入前端目录
cd apps/web

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置 API 地址

# 4. 启动开发服务器
npm run dev
```

### 环境变量配置

```env
# API 地址
VITE_API_URL=http://localhost:3000/api

# 应用配置
VITE_APP_NAME=SYMI
VITE_APP_VERSION=1.1.3
```

---

## 💻 开发指南

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 开发规范

#### 1. 组件规范

```tsx
// 使用函数组件 + TypeScript
import React from 'react';
import { Card } from 'antd';

interface Props {
  title: string;
  children: React.ReactNode;
}

export const MyComponent: React.FC<Props> = ({ title, children }) => {
  return (
    <Card title={title}>
      {children}
    </Card>
  );
};
```

#### 2. API 调用规范

```tsx
// 使用封装好的 http 客户端
import { http } from '../api/http';

// GET 请求
const fetchData = async () => {
  const response = await http.get('/products');
  return response.data;
};

// POST 请求
const createData = async (data: CreateData) => {
  const response = await http.post('/products', data);
  return response.data;
};
```

#### 3. 表单规范

```tsx
import { Form, Input, Button } from 'antd';
import { formRules } from '../utils/formRules';

const MyForm: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: FormValues) => {
    console.log(values);
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
      >
        <Input placeholder="请输入名称" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};
```

#### 4. 路由配置

```tsx
// 在 App.tsx 中配置路由
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
```

---

## 📦 构建部署

### 生产构建

```bash
# 构建生产版本
npm run build

# 构建输出在 dist/ 目录
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## ❓ 常见问题

### Q1: 开发服务器启动失败？

检查：
1. Node.js 版本是否 >= 20
2. 端口 5173 是否被占用
3. 依赖是否完整安装

### Q2: API 请求失败？

检查：
1. 后端服务是否运行
2. VITE_API_URL 配置是否正确
3. 浏览器控制台是否有 CORS 错误

### Q3: 热重载不生效？

尝试：
```bash
# 清除缓存并重启
rm -rf node_modules/.vite
cnpm run dev
```

### Q4: 如何添加新页面？

步骤：
1. 在 `src/pages/` 创建页面组件
2. 在 `src/api/` 添加对应 API
3. 在 `App.tsx` 添加路由配置
4. 在 `AdminLayout.tsx` 添加菜单项

---

## 📄 许可证

[MIT](../../LICENSE) © 2026 SYMI团队

---

## 🔗 相关链接

- [后端 API](../api/README.md)
- [根项目文档](../../README.md)
- [React 文档](https://react.dev/)
- [Ant Design 文档](https://ant.design/)
- [Vite 文档](https://vitejs.dev/)

---

**Built with ❤️ using React & Ant Design**
