# FocusTime_Admin · 专注时光管理后台

独立的 React 管理后台。本阶段仅包含「数据概览」，所有数据由前端本地提供。

## 本地启动

使用 Node.js 22.13+（或较新的 LTS 版本）与 pnpm：

```sh
pnpm install
pnpm dev
```

打开终端打印的本地地址（默认 `http://localhost:5173`）。`pnpm build` 执行 TypeScript 检查并生成静态产物 `dist/`，`pnpm preview` 可预览构建结果。

## 代码结构

- `src/components/layout`：管理后台的导航和顶部区域。
- `src/components/ui`：shadcn/ui 风格的卡片、按钮、表格、徽章和头像组件。
- `src/features/overview`：数据概览、统计卡、Recharts 图表和最近活动列表。
- `src/features/overview/mock-data.ts`：独立的模拟数据与数据类型；后续可在概览模块中替换为 REST API 数据源。

时间范围支持近 7、30、90 天，趋势图支持悬停查看每日数据。其他导航、通知和「查看更多」是占位项。
