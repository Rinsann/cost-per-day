# AGENTS.md Codex Project Rules

## Cost Per Day App Project Rules

项目技术栈：
- React Native
- Expo
- Expo Router
- TypeScript
- React Native Paper
- AsyncStorage
- EAS Build

开发规则：
- 每次开发前先执行 git status
- 每次只做一个小版本
- 不一次性大改多个模块
- 功能完成后必须执行 npm run typecheck
- 真机测试通过后再 git commit
- EAS Build 属于云端任务，提交成功后不用一直占着终端等待，可以用网页或 eas build:list 查询状态
- GitHub push 超时不代表本地代码有问题，优先保留本地 commit
- 不要轻易修改 Product 数据结构

产品定位：
- 当前 App 从长期消费品成本分析工具，扩展为记账 + 成本分析工具
- 记账用于提高打开频率
- 原有成本分析功能必须保留
- 不要为了提高日活强行做无意义打卡功能

当前底部 Tab：
1. 记账
2. 统计
3. 成本
4. 我的

UI 设计参考：
- UI 参考文件在 docs/design/
- UI 相关任务开始前请先读取 docs/design/00-design-brief.md
- 主要参考 Figma 深色记账 App 方向
- 优先参考：
  - docs/design/01-ledger-home-reference.png
  - docs/design/05-quick-ledger-sheet-reference.png

重要限制：
- docs/design/03-budget-analysis-reference-not-current-cost-page.png 不是当前 App 原有成本分析页面
- 这张图只作为预算分析视觉参考
- 不要用它替换当前成本分析 Tab
- 当前成本分析功能包括：
  - 长期消费品真实日均成本
  - 目标日均成本
  - 还需使用天数
  - 预计达成日期
  - 是否应该换新

下一阶段优先方向：
- 优先实现快速记账 Bottom Sheet
- 点击底部中间 + 按钮打开
- 支持支出 / 收入切换
- 支持金额输入
- 支持分类选择
- 支持备注
- 支持保存到独立 AsyncStorage 记账数据
- 不做真实登录
- 不做云同步
- 不修改 Product 数据结构
- 不改变当前成本分析功能
- 记账数据访问优先通过 ledgerRepository，不要在页面中直接散落调用 AsyncStorage；后续接后端时优先替换 repository 底层实现。

## UI Consistency Rules

- App 使用统一深色 UI 语言。
- 新增任何一级、二级、三级页面前，必须先复用统一主题颜色、页面容器和卡片样式。
- 不允许新增大块白色卡片，除非用户明确要求浅色主题。
- 所有页面必须处理 SafeArea，内容不能进入系统状态栏。
- 所有 Expo Router Stack 二级页面必须保持深色 contentStyle，避免安卓返回闪白。
- 记账、统计、成本、我的四个模块的二级页面也必须保持同一套 UI 语言。
- 成本模块原有 Cost Per Day 功能必须保留，不要用预算追踪页面替换。
