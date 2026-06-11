# Cost Per Day

Cost Per Day 是一款消费品日均成本计算 App。

它帮助用户记录长期使用的消费品，例如手机、电脑、耳机、手表等，并计算当前日均成本、当前月均成本、目标日均成本、还需使用天数和预计达成目标日期。

核心理念不是单纯资产管理，而是帮助用户判断消费品是否已经“用够本”。

## 核心功能

### 消费品管理

- 新增消费品
- 编辑消费品
- 删除消费品
- 查看消费品详情

### 成本计算

- 已使用天数
- 当前日均成本
- 当前月均成本
- 价值分析

### 目标日均成本

- 设置目标日均成本
- 计算还需使用天数
- 计算预计达成日期
- 首页轻量展示目标进度

### 统计页

- 消费品总数
- 总购买金额
- 当前日均成本合计
- 平均日均成本
- 最高/最低日均成本排行
- 使用最久排行
- 分类统计

### 数据安全

- AsyncStorage 本地持久化
- JSON 数据导出
- JSON 文件导入
- JSON 粘贴导入

### Android APK

- 已通过 EAS Build 生成 Android APK
- 已完成 Android 真机测试
- APK 环境下 JSON 文件导入可正常使用

## 技术栈

- React Native
- Expo
- Expo Router
- TypeScript
- React Native Paper
- AsyncStorage
- EAS Build

## 项目截图

> 截图待补充。

| 首页 | 新增消费品 | 消费品详情 |
| --- | --- | --- |
| Coming Soon | Coming Soon | Coming Soon |

| 统计页 | 设置页 | JSON 导入 |
| --- | --- | --- |
| Coming Soon | Coming Soon | Coming Soon |

## 本地运行

```bash
npm install
npm run start
```

使用 Expo Go 扫描终端二维码即可在手机上预览。

## 类型检查

```bash
npm run typecheck
```

## Android APK 构建

项目已配置 EAS Android preview APK profile。

```bash
eas build --platform android --profile preview
```

构建完成后，可在 Expo 控制台下载 APK 并安装到 Android 真机测试。

## 当前版本

- 当前稳定测试版本：V1.3.1 Preview
- 内部语义化版本：1.3.1
- Android APK：已构建并完成真机测试

## 应用信息

- 应用名称：Cost Per Day
- 应用说明：计算消费品真实使用成本
- 作者：Rinsann
- GitHub：https://github.com/Rinsann/cost-per-day

## 后续计划

- 应用图标
- 启动页
- 更好的文件导入体验
- 多币种支持
- 数据备份增强
- 图表可视化
- iOS 适配

## 项目定位

Cost Per Day 关注的是消费品的长期使用价值。

相比传统记账或资产管理，它更强调一个简单问题：

> 这件东西，我真的用够本了吗？
