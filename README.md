# zzzXBDJBans Web Interface

![Vue 3](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)

zzzXBDJBans 的前端管理界面，基于 Vue 3 + Vite 构建，使用 Tailwind CSS 进行样式设计。提供直观的玩家封禁管理、白名单审核以及服务器状态监控功能。

## ✨ 功能特性

- 📊 **仪表盘概览**：实时查看服务器状态和玩家数据。
- 🛡️ **封禁管理**：查询、添加和解除玩家封禁。
- ✅ **白名单审核**：处理玩家的进服申请（批准/拒绝）。
- 🖥️ **响应式设计**：完美适配桌面和移动端设备。

## 🛠️ 环境要求

在开始之前，请确保您的开发环境满足以下要求：

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/zzzXBDJBans.git
cd zzzXBDJBans/zzzXBDJBansWeb
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

项目根目录下包含 `.env.development` 和 `.env.production` 文件。请根据您的后端地址进行配置：

**示例 `.env.development`**:

```ini
VITE_API_BASE_URL=http://localhost:8080/api
```

### 4. 启动开发服务器

```bash
npm run dev
```

启动后，访问 `http://localhost:5173` 即可预览项目。

## 📦 构建生产版本

构建用于生产环境的静态文件：

```bash
npm run build
```

构建产物将输出到 `dist` 目录。您可以将其部署到 Nginx、Apache 或任何静态文件托管服务。

## 📂 目录结构

```
zzzXBDJBansWeb/
├── src/
│   ├── assets/        # 静态资源
│   ├── components/    # Vue 组件
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia 状态管理
│   ├── views/         # 页面视图
│   ├── App.vue        # 根组件
│   └── main.js        # 入口文件
├── public/            # 公共资源
├── index.html         # HTML 模板
├── vite.config.js     # Vite 配置
└── package.json       # 项目依赖与脚本
```

## 🤝 贡献

欢迎提交 Pull Request 或 Issue 来改进本项目。

## 📄 许可证

[MIT License](LICENSE)
