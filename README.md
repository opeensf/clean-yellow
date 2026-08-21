# 扫黄之旅辅助工具

为线下桌游流程制作的响应式管理工具，基于 React、TypeScript、Vite 和 Zustand 构建。项目聚合股票调价、玩家资产、债务关系、官方保险、七星彩与机会命运等功能，并支持浏览器本地存档与房间码云端存档。

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
- **云端存档**：将当前数据创建为 8 位房间码，在其他设备输入房间码即可继续；修改后自动保存，离线时保留本机副本。

## 界面特性

- 桌面端与移动端响应式布局
- 玩家姓名首字与专属颜色识别
- 直观的债务连线、金额标签和还款进度
- 简约卡片式界面与统一状态配色
- 本地持久化与 Supabase 云端房间存档

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
- Supabase（PostgreSQL 与受控 RPC）

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

仓库同时包含 GitHub Actions 工作流。推送到发布分支后会自动构建；在仓库设置中配置下列值即可在 Pages 上启用云端存档：

- Repository variable：`VITE_SUPABASE_URL`
- Repository variable：`VITE_SUPABASE_PUBLISHABLE_KEY`

没有配置这两个值时，网站仍可正常使用本地存档，云端存档面板会显示“等待配置”。

## 云端存档配置

1. 创建一个 Supabase 项目。
2. 在 Supabase SQL Editor 中执行 [`supabase/migrations/202608210001_create_game_rooms.sql`](supabase/migrations/202608210001_create_game_rooms.sql)，或使用 Supabase CLI 连接项目后执行 `supabase db push`。
3. 复制项目 URL 与 Publishable key，将 `.env.example` 复制为 `.env.local` 并填入真实值。
4. 重新启动开发服务器，本地模式按钮会出现创建房间和打开房间操作。

需要在不连接 Supabase 的情况下进行双设备联调时，可启动仓库自带的内存模拟服务：

```bash
npm run dev:cloud
```

再在 `.env.local` 中临时使用 `http://127.0.0.1:54321` 与任意测试 Publishable key。模拟服务仅用于本地验收，停止后房间数据会清空。

房间码相当于该存档的访问密码。数据库表已启用 RLS 并撤销直接访问权限，网页只能通过受控函数按房间码创建、读取和保存；任何 Service Role 或 Secret key 都不应放入前端环境变量。

云端保存采用修订号检测并发修改。当两台设备同时编辑同一房间时，后保存的设备会看到版本选择提示，可选择使用云端版本或用本机版本覆盖。分享链接格式如下：

```text
https://opeensf.github.io/clean-yellow/#/?room=AB7K-P2QX
```

## 项目结构

```text
src/
├── cloud/       # 房间 API、存档快照与自动同步
├── components/  # 通用组件
├── lib/         # 工具函数
├── pages/       # 功能页面
├── router/      # 路由配置
└── store/       # 游戏状态与业务规则
```

## 数据说明

本地模式下，游戏状态保存在当前浏览器的本地存储中。进入云端房间后，修改会延迟约 0.8 秒自动同步，并在当前设备保留最近副本；短暂断网时可继续操作，恢复网络后会尝试同步。清理网站数据会移除本机副本，但不会删除已创建的云端房间。项目用于线下游戏辅助与娱乐，不涉及真实股票、债务或保险业务。
