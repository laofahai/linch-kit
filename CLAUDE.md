# LinchKit AI 开发助手指导

**版本**: v4.0  
**项目**: LinchKit - AI-First 全栈开发框架

## 🚀 项目概述

LinchKit 是企业级 AI-First 全栈开发框架，采用 Schema 驱动架构，提供端到端类型安全。

### 🎯 核心原则
- **AI-First**: 所有设计都优先考虑 AI 理解和处理能力
- **Schema 驱动**: 以 Zod Schema 为单一数据源，驱动整个系统
- **类型安全**: 端到端 TypeScript 类型安全保障
- **模块化**: 高内聚、低耦合的包设计

### 🏛️ 架构层次（已完成）
```
L0: @linch-kit/core      ✅ 基础设施
L1: @linch-kit/schema    ✅ Schema引擎  
L2: @linch-kit/auth      ✅ 认证权限
L2: @linch-kit/crud      ✅ CRUD操作
L3: @linch-kit/trpc      ✅ API层
L3: @linch-kit/ui        ✅ UI组件
L4: modules/console      ✅ 管理平台
L4: @linch-kit/ai        ⏳ AI集成（未来扩展）
```

## 📚 文档位置
- **当前状态**: `ai-context/zh/current/development-status.md`
- **开发约束**: `ai-context/zh/current/development-constraints.md`
- **模块架构**: `ai-context/zh/current/module-architecture-design.md`
- **包API参考**: `ai-context/zh/current/packages-api-reference.md`

## 🛠️ 开发命令
```bash
# 环境设置（每次必须）
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"

# 开发流程
pnpm dev        # 开发模式
pnpm build      # 构建验证
pnpm validate   # 完整验证
```

## 🔒 核心约束
1. **TypeScript 严格模式**，禁止 `any`
2. **仅使用 pnpm**，禁止 npm/yarn
3. **依赖顺序**: core → schema → auth → crud → trpc → ui → console
4. **必须使用 LinchKit 内部包功能**，禁止重复实现
5. **测试覆盖**: core>90%, 其他>80%

📋 **详细约束**: 参考 `ai-context/zh/current/development-constraints.md`

## 💡 AI 开发模式

当用户说"继续开发"时：
1. 读取 `ai-context/zh/current/development-status.md`
2. 确定下一个开发任务
3. 严格遵循开发约束
4. 实施并验证
5. 更新进度文档

## 📋 当前状态（2025-06-30）

**✅ 项目已完成** - LinchKit 达到生产就绪状态：
- ✅ 6个核心包完成 (core, schema, auth, crud, trpc, ui)
- ✅ Console 管理模块完成
- ✅ AI Dashboard 可视化完成
- ✅ Starter 应用完整部署

### 🚀 应用功能
- **AI数据Dashboard** - 实时数据可视化、智能洞察
- **企业管理后台** - 用户管理、租户管理、系统设置
- **现代化界面** - shadcn/ui + Tailwind CSS + 响应式设计

## 🏗️ 架构设计

### 应用层级
```
apps/starter (应用层)    - 布局、环境配置、页面路由
modules/console (模块层) - 企业管理功能、UI组件
packages/* (包层)       - 基础功能库、API、认证
```

### 集成示例
```typescript
// tRPC路由集成
import { router, publicProcedure } from '@linch-kit/trpc/server'
import { createCrudRouter } from '@linch-kit/crud'

export const appRouter = router({
  crud: createCrudRouter({ router, protectedProcedure }),
})

// 插件注册
import { PluginSystem } from '@linch-kit/core'
await PluginSystem.register(plugin)
```

## 🧪 质量标准
- **TypeScript 严格模式** - 禁止 any 类型
- **测试覆盖率** > 80%
- **构建验证** - 无错误构建
- **类型安全** - 端到端类型保障

## 🔄 未来扩展

LinchKit 框架已为以下扩展做好准备：
- **@linch-kit/ai** - AI服务集成包
- **插件生态** - 第三方功能扩展
- **企业集成** - SSO、审计、合规功能