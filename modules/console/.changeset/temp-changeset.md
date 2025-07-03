feat(console): 实施Dashboard布局架构重构

## 核心变更

### 新增功能
- **modules/console/layouts**: 新增三层级渐进式Dashboard布局架构
  - Layer 1: 配置驱动的 DashboardLayout
  - Layer 2: 组合式API支持  
  - Layer 3: 完全自定义，直接使用 @linch-kit/ui

### 架构优化
- **导航配置分离**: 将导航数据从组件中分离到配置文件
- **类型安全**: 完整的 TypeScript 类型定义
- **向后兼容**: 保持原有 ConsoleLayout 组件可用

### 重构内容
- **apps/starter**: 使用新的 DashboardLayout 替代 AppSidebar
- **导航管理**: 统一的导航配置和面包屑生成
- **布局灵活性**: 支持配置驱动、组合式和完全自定义三种使用方式

## 破坏性变更
- 移除 apps/starter 的 AppSidebar 组件
- 新增类型导出：DashboardNavItem, DashboardUserInfo, DashboardTeamInfo

## 升级指南
使用新的布局组件：
```tsx
import { DashboardLayout } from '@linch-kit/console'
```
