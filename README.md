# 扫黄之旅辅助工具

为线下桌游流程制作的响应式管理工具，基于 React、TypeScript、Vite 和 Zustand 构建。项目聚合股票调价、玩家资产、债务关系、官方保险、七星彩与机会命运等功能，数据默认保存在浏览器本地。

## 在线使用

[打开 GitHub Pages](https://opeensf.github.io/clean-yellow/)

## 当前功能

- **首页概览**：查看股票行情、玩家股票资产和常用操作；点击股票可直接进入对应市场。
- **股票市场**：切换房产股与教育股，按百分比调整价格，查看实时走势与最近价格记录，支持撤回调价。
- **玩家管理**：新增、编辑或删除玩家；按金额买卖股票、按股数调整持仓，并查看玩家股值。
- **债务管理**：在关系图中选择债务人与债权人并创建欠款；点击债务连线可跳转到对应记录；支持部分还款、还清和删除。
- **债务自动合并**：相同债务人和债权人的新增欠款会自动合并，原始金额与剩余金额分别累加。
- **官方保险**：调整每位玩家的保费和启用状态；增加保费后，已启用的保险会自动变为未启用。
- **七星彩**：生成并管理游戏所需的彩票结果。
- **机会命运**：随机抽取事件，同时结算房产股与教育股的涨跌，并清晰展示调价前后价格。
- **收益分析**：查看玩家股票交易与收益情况。

## 界面特性

- 桌面端与移动端响应式布局
- 玩家姓名首字与专属颜色识别
- 直观的债务连线、金额标签和还款进度
- 简约卡片式界面与统一状态配色
- 浏览器本地持久化，无需后端服务

## 技术栈

- React 18
- TypeScript 5
- Vite 6
- React Router 7
- Zustand
- Tailwind CSS
- Recharts
- Lucide React
- Sonner

## 本地运行

环境要求：Node.js 18 或更高版本，推荐使用当前 LTS 版本。

```bash
git clone https://github.com/opeensf/clean-yellow.git
cd clean-yellow
npm install
npm run dev
```

开发服务器启动后访问：

```text
http://localhost:5173/clean-yellow/
```

## 检查与构建

```bash
npm run check   # TypeScript 类型检查
npm run build   # 生产构建
npm run preview # 本地预览生产版本
```

## GitHub Pages 部署

```bash
npm run deploy
```

部署脚本会先生成生产版本，再将 `dist` 内容发布到 `gh-pages` 分支。

## 项目结构

```text
src/
├── components/  # 通用组件
├── lib/         # 工具函数
├── pages/       # 功能页面
├── router/      # 路由配置
└── store/       # 游戏状态与业务规则
```

## 数据说明

游戏状态保存在当前浏览器的本地存储中。更换浏览器、清理网站数据或开始新一局游戏，可能会重置已有记录。项目用于线下游戏辅助与娱乐，不涉及真实股票、债务或保险业务。
