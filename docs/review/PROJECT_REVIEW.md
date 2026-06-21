# 算得值项目 Review

本文档记录当前项目结构、核心模块、技术债、测试策略和学习导读。它用于后续维护和学习，不代表本次要重构所有问题。

## 一、项目总体结构

### 技术栈

- React Native
- Expo
- Expo Router
- TypeScript
- React Native Paper
- AsyncStorage
- EAS Build

### app 路由结构

- `app/_layout.tsx`：全局 Provider、Paper 主题、Stack 背景、StatusBar。
- `app/(tabs)/_layout.tsx`：底部 Tab、中央快速记账按钮、快速记账 Bottom Sheet。
- `app/(tabs)/ledger.tsx`：记账首页，显示本月支出、收入、结余和最近 7 天账单。
- `app/(tabs)/insights.tsx`：记账统计页，包含时间范围、筛选、柱状图、环形图、收支明细和开发 mock 数据入口。
- `app/(tabs)/index.tsx`：成本分析首页，保留长期消费品日均成本分析。
- `app/(tabs)/me.tsx`：我的页，包含主题模式切换。
- `app/ledger/[id].tsx` 与 `app/ledger/[id]/edit.tsx`：记账详情、编辑、删除。
- `app/product/[id].tsx` 与 `app/product/[id]/edit.tsx`：消费品详情与编辑。
- `app/add.tsx`：新增消费品。
- `app/stats.tsx`：成本模块数据统计页。
- `app/settings.tsx` 与 `app/settings/import-json.tsx`：成本模块设置、Product JSON 导入。

### src 目录职责

- `src/components/`：可复用 UI 与业务组件，包括 `AppScreen`、`AppCard`、`AppDateField`、`QuickExpenseSheet`、`ProductForm`。
- `src/context/`：应用级状态，包括主题上下文和记账记录上下文。
- `src/repositories/`：记账数据访问抽象，目前有 `ledgerRepository`。
- `src/storage/`：AsyncStorage 持久化实现，包括 Product 与 ExpenseRecord。
- `src/types/`：稳定数据类型定义，包括 `Product` 与 `ExpenseRecord`。
- `src/utils/`：纯工具函数，包括金额、日期、成本、目标成本、价值分析、统计工具。
- `src/theme/`：颜色 token 与 React Native Paper 主题适配。
- `src/dev/`：开发环境 mock 数据注入工具。

### 当前数据流

记账数据：

1. UI 页面或组件触发操作。
2. `ExpenseRecordsContext` 提供记录列表与刷新能力。
3. `ledgerRepository` 封装 create / update / delete / getAll。
4. `expenseStorage` 读写 AsyncStorage。
5. AsyncStorage 保存本地 `ExpenseRecord[]`。

成本消费品数据：

1. UI 页面或表单触发 Product 操作。
2. 页面直接调用 `productStorage`。
3. `productStorage` 读写 AsyncStorage。
4. 导入导出当前只服务 Product 数据。

主题数据：

1. 用户在我的页选择 system / light / dark。
2. `AppThemeContext` 持久化主题模式。
3. `colors.ts` 提供 light / dark token。
4. `theme.ts` 将 token 转换为 React Native Paper 主题。

### 当前主题系统

- 支持 `system` / `light` / `dark`。
- 默认跟随系统主题。
- 主题偏好通过 `cost-per-day:theme-mode` 持久化。
- `AppScreen`、`AppCard`、`AppDateField`、底部导航、Stack 背景、StatusBar 已接入主题。
- 部分老页面仍保留静态 dark token 作为 StyleSheet 默认值，但多数用户可见颜色通过运行时主题覆盖。

## 二、核心业务模块梳理

### 记账模块

- 快速记账：`QuickExpenseSheet` 支持支出 / 收入、金额、小数、删除、分类、备注、日期和保存。
- 关闭重置：关闭 Bottom Sheet 后不保留未保存草稿，避免误记账。
- 记账详情：`app/ledger/[id].tsx` 展示类型、金额、分类、备注、日期、创建时间。
- 记账编辑：`app/ledger/[id]/edit.tsx` 支持修改金额、类型、分类、备注、日期。
- 删除记录：详情页确认后删除单条 ExpenseRecord，不影响 Product。
- 首页最近 7 天：`app/(tabs)/ledger.tsx` 只展示最近 7 天记录，并按日期分组。
- 统计页：`app/(tabs)/insights.tsx` 支持本月 / 季度 / 全年 / 自定义日期范围。
- 筛选：支持类型、分类、关键词与自定义日期范围叠加。
- 图表：包含收支对比柱状图、支出分类环形图、收支明细。

### 成本分析模块

- 消费品列表：成本 Tab 保留长期消费品列表、搜索、排序、最近目标。
- 消费品详情：展示名称、分类、价格、购买日期、已使用天数、日均成本、月均成本、备注。
- 消费品编辑：`ProductForm` 支持名称、分类、价格、购买日期、备注、目标日均成本。
- 日均成本计算：`src/utils/cost.ts` 负责基础成本指标。
- 目标日均成本：`src/utils/targetCost.ts` 计算目标总天数、进度、剩余天数、目标日期。
- 换新建议：详情页根据目标是否达成展示继续使用或换新门槛建议。
- 成本数据导出 / 导入：当前 JSON 备份只覆盖 Product 数据。

### UI 基础设施

- `AppScreen`：统一 SafeArea、背景、滚动和底部 padding。
- `AppCard`：统一卡片背景、边框、圆角。
- `AppDateField`：统一日期选择，避免手动输入日期。
- `QuickExpenseSheet`：快速记账核心交互组件。
- `ProductForm`：消费品新增 / 编辑共用表单。
- Bottom Tabs：四个主 Tab：记账、统计、成本、我的。
- 主题 token：`colors.ts` 统一 background、card、text、primary、expense、income、pressed、ripple、input 等颜色。

## 三、当前架构优点

- 已经有 `ledgerRepository`，记账数据访问不再散落在页面中。
- `Product` 数据结构长期保持稳定，没有因记账功能被混用。
- `ExpenseRecord` 数据结构稳定，记账与成本分析边界清楚。
- 记账模块和成本分析模块基本分离。
- 已有 `AppScreen` / `AppCard` / `AppDateField` 等基础组件。
- 已有 system / light / dark 主题系统，且用户偏好可持久化。
- 已有 `formatMoney` / `formatDate` 等工具函数。
- 已有开发环境 mock 数据注入工具，能测试统计页大数据表现。
- 用户可见名称「算得值」和技术代号 `cost-per-day` 已区分。

## 四、当前主要技术债

### P0：功能错误或数据风险

当前 Review 未发现明确 P0 问题。

### P1：影响后续开发效率

1. `app/(tabs)/insights.tsx` 仍然过大，统计计算、弹层状态、图表渲染和开发工具入口集中在一个文件里。
2. 统计计算逻辑虽然已经开始抽到 `ledgerStats`，但页面内仍保留一批旧 helper，后续应逐步删除重复逻辑。
3. 记账导入 / 导出能力缺失；当前导入导出只覆盖 Product 数据。
4. Product 数据访问还没有 repository 层，后续如果接后端，Product 与 Ledger 的替换难度不一致。
5. 统计页图表与筛选逻辑仍由页面直接编排，后续做更多图表或性能优化时需要继续拆分。

### P2：可读性和维护性问题

1. `src/utils/expenseRecords.ts` 与 `src/utils/formatDate.ts` 都有日期字符串工具，存在轻微重复。
2. 部分 StyleSheet 仍保留静态 dark token 作为默认值，虽然运行时大多被主题覆盖，但长期容易漏适配浅色模式。
3. `src/dev/seedLedgerMockData.ts` 数据量和场景较多，建议后续补充单独说明或测试。
4. 组件测试尚未建立，`QuickExpenseSheet`、`AppDateField`、`ProductForm` 仍依赖真机手测。

## 五、建议的测试策略

### 单元测试

优先覆盖纯函数：

- `formatMoney`
- `formatDate`
- 日期范围计算
- 本月 / 季度 / 全年 / 自定义日期范围
- 收入 / 支出 / 结余汇总
- 日期分组
- 分类统计
- 环形图数据
- 柱状图 buckets

### Repository 测试

建议后续覆盖：

- `ledgerRepository.createRecord`
- `ledgerRepository.updateRecord`
- `ledgerRepository.deleteRecord`
- `ledgerRepository.getAllRecords`
- mock 数据清除只删除 `mock-ledger-` 前缀记录

本次暂不强行做 repository 测试，因为当前 repository 底层直接依赖 AsyncStorage，需要先建立可靠 mock，避免为了第一批测试引入过多配置复杂度。

### 组件测试

后续可逐步覆盖：

- `AppDateField`
- `QuickExpenseSheet`
- 统计筛选弹层
- `ProductForm`

### 集成测试

建议以真机或后续自动化方式覆盖：

- 快速记账新增后首页刷新。
- 编辑日期后统计页变化。
- 删除记录后统计页变化。
- 主题切换后主要页面可读。

### 性能测试

建议后续准备 200 / 1000 / 3000 条虚拟记录，测量：

- `calculateSummary`
- `groupRecordsByDate`
- `calculateCategoryStats`
- `buildChartBuckets`
- 统计页切换本月 / 季度 / 全年响应时间
- 收支明细分组耗时

本次先不做自动化性能测试，避免扩大范围。

## 六、建议后续重构顺序

1. 完成测试基础设施。
2. 继续抽离统计纯函数，逐步清理 `insights.tsx` 内重复 helper。
3. 给 `formatMoney`、`formatDate`、`ledgerStats` 补更多单元测试。
4. 给 `ledgerRepository` 增加 AsyncStorage mock 后再写 repository 测试。
5. 再考虑组件测试。
6. 再考虑性能基准。
7. 最后再考虑后端接口适配层。

## 七、学习导读

### 推荐阅读顺序

1. `src/types/product.ts` 与 `src/types/expense.ts`：先理解两个核心数据结构。
2. `src/storage/` 与 `src/repositories/ledgerRepository.ts`：理解本地数据如何保存和读取。
3. `src/context/ExpenseRecordsContext.tsx`：理解 Context 如何把数据交给页面。
4. `app/(tabs)/ledger.tsx`：理解记账首页如何从记录派生本月汇总和最近 7 天列表。
5. `src/components/expense/QuickExpenseSheet.tsx`：理解快速记账交互。
6. `app/(tabs)/insights.tsx` 与 `src/utils/ledgerStats.ts`：理解统计页和纯函数拆分。
7. `src/utils/cost.ts`、`src/utils/targetCost.ts`、`src/utils/valueAnalysis.ts`：理解成本分析计算。
8. `app/(tabs)/index.tsx`、`app/product/[id].tsx`、`src/components/product/ProductForm.tsx`：理解成本模块页面。
9. `src/context/AppThemeContext.tsx`、`src/theme/colors.ts`、`src/theme/theme.ts`：理解主题系统。

### 适合学习的点

- React Native：页面布局、Pressable、Modal、Animated、ScrollView。
- Expo Router：Tab 路由、Stack 路由、动态路由。
- TypeScript：稳定数据类型、工具函数入参和返回值。
- 状态管理：Context 负责全局本地状态，页面用 `useMemo` 派生显示数据。
- 数据层分离：Repository 让页面不直接关心 AsyncStorage。
- 测试设计：先测纯函数，再测 repository，最后测组件。
