# Clean Yellow - 大富翁风格游戏管理系统

一个基于 React + TypeScript + Vite 构建的现代化游戏管理系统，模拟大富翁游戏的各种功能模块。

## 🎮 项目特色

- **股票市场模拟** - 完整的股票交易系统
- **玩家管理** - 多玩家游戏状态管理
- **欠债管理** - 债务追踪和管理
- **七星彩游戏** - 彩票抽奖系统
- **机会命运** - 随机事件卡片系统
- **保险系统** - 风险管理功能
- **数据分析** - 股票收益分析图表

## 🚀 在线演示

访问 [GitHub Pages 部署版本](https://opeensf.github.io/clean-yellow/)

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **路由管理**: React Router DOM 7
- **状态管理**: Zustand
- **UI 组件**: 自定义组件 + Lucide React 图标
- **样式方案**: Tailwind CSS
- **图表库**: Recharts
- **通知系统**: Sonner
- **代码规范**: ESLint + TypeScript ESLint

## 📦 安装和运行

### 环境要求

- Node.js >= 16
- npm 或 yarn

### 本地开发

```bash
# 克隆项目
git clone https://github.com/opeensf/clean-yellow.git
cd clean-yellow

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 查看项目

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 部署到 GitHub Pages
npm run deploy
```

## 📱 功能模块

### 🏠 首页
- 游戏概览和快速导航
- 系统状态展示

### 📈 股票市场
- 实时股票价格模拟
- 买入/卖出交易功能
- 投资组合管理

### 👥 玩家管理
- 多玩家信息管理
- 资产状态追踪
- 游戏进度记录

### 💳 欠债管理
- 债务记录和追踪
- 还款计划管理
- 利息计算

### 🎲 七星彩
- 彩票号码生成
- 中奖概率计算
- 奖金分配系统

### ✨ 机会命运
- 随机事件卡片
- 游戏规则执行
- 奖惩机制

### 🛡️ 保险系统
- 风险评估
- 保险购买和理赔
- 保费计算

### 📊 数据分析
- 股票收益图表
- 投资回报分析
- 历史数据展示

## 🎨 设计特点

- **响应式设计** - 适配移动端和桌面端
- **现代化 UI** - 简洁美观的用户界面
- **流畅交互** - 优化的用户体验
- **模块化架构** - 清晰的代码组织结构

## 📁 项目结构

```
src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── hooks/         # 自定义 Hooks
├── store/         # 状态管理
├── lib/           # 工具函数
├── router/        # 路由配置
└── assets/        # 静态资源
```

## 🔧 开发脚本

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览构建结果
npm run lint       # 代码检查
npm run check      # TypeScript 类型检查
npm run deploy     # 部署到 GitHub Pages
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 快速构建工具
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide React](https://lucide.dev/) - 图标库
- [Recharts](https://recharts.org/) - 图表库

---

**注意**: 这是一个模拟游戏项目，仅用于学习和娱乐目的。
