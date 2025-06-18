# 继续 tRPC 包开发 - 工作提示

## 🎯 当前状态 (2024-12-18 结束时)

### ✅ 已完成的工作
1. **基础设施修复完成**:
   - ✅ 更新了 package.json 配置 (依赖、脚本、导出)
   - ✅ 创建了 tsup.config.ts 构建配置
   - ✅ 创建了 tsconfig.json TypeScript 配置
   - ✅ 修复了服务端导入错误 (移除 @linch-kit/auth 引用)
   - ✅ 重新设计了类型系统 (Context, AppRouter, API 响应格式)

2. **文件状态**:
   - ✅ `packages/trpc/package.json` - 完整配置
   - ✅ `packages/trpc/tsup.config.ts` - 构建配置
   - ✅ `packages/trpc/tsconfig.json` - TypeScript 配置
   - ✅ `packages/trpc/src/server/context.ts` - 修复了导入，添加了临时类型
   - ✅ `packages/trpc/src/server/index.ts` - 修复了导入错误
   - ✅ `packages/trpc/src/server/types.ts` - 重新设计了类型系统

### 🚨 当前错误 (需要立即修复)

在 `packages/trpc/src/client/index.tsx` 中有 2 个错误：

1. **函数名冲突错误**:
   ```
   Import declaration conflicts with local declaration of 'createTRPCReact'
   ```

2. **方法不存在错误**:
   ```
   Property 'createClient' does not exist on type 'never'
   ```

## 🚀 明天的立即任务

### 第一步：修复客户端错误 (30分钟)

1. **修复 `src/client/index.tsx` 中的函数名冲突**:
   ```typescript
   // 错误的代码 (当前):
   import { createTRPCReact } from '@trpc/react-query'
   export function createTRPCReact<T extends AnyRouter = AppRouter>() {
     return createTRPCReact<T>()  // 名称冲突
   }

   // 正确的修复:
   import { createTRPCReact } from '@trpc/react-query'
   export function createTRPCClient<T extends AnyRouter = AppRouter>() {
     return createTRPCReact<T>()
   }
   ```

2. **修复 `trpc.createClient` 方法调用**:
   ```typescript
   // 错误的代码 (当前):
   export const createTrpcClient = (options?: TRPCClientOptions) => {
     return trpc.createClient(createTRPCClientConfig(options))  // createClient 不存在
   }

   // 正确的修复:
   import { createTRPCProxyClient } from '@trpc/client'
   export const createTrpcClient = (options?: TRPCClientOptions) => {
     return createTRPCProxyClient<AppRouter>(createTRPCClientConfig(options))
   }
   ```

### 第二步：验证构建 (15分钟)

运行以下命令验证修复：
```bash
cd packages/trpc
npm run type-check  # 应该无错误
npm run build       # 应该成功构建
```

### 第三步：继续核心功能开发 (2-3小时)

按照 `ai-context/packages/trpc-implementation-plan.md` 中的计划继续：

1. **阶段 2: 核心类型系统** (已部分完成，需要完善)
2. **阶段 3: 服务端核心功能** (下一个重点)
   - 上下文创建器完善
   - 路由工具开发
   - 中间件系统基础

## 📋 完整的工作流程提示

### 启动命令
```bash
# 进入项目目录
cd /path/to/linch-kit

# 检查当前状态
cd packages/trpc
npm run type-check

# 如果有错误，按照上面的修复步骤进行
```

### 关键文件位置
- 主要配置: `packages/trpc/package.json`
- 构建配置: `packages/trpc/tsup.config.ts`
- 类型配置: `packages/trpc/tsconfig.json`
- 服务端入口: `packages/trpc/src/server/index.ts`
- 客户端入口: `packages/trpc/src/client/index.tsx` (需要修复)
- 类型定义: `packages/trpc/src/server/types.ts`

### AI Context 文档
- 包概述: `ai-context/packages/trpc-context.md`
- 实施计划: `ai-context/packages/trpc-implementation-plan.md`
- 当前提示: `ai-context/continue-trpc-development.md` (本文件)

## 🎯 成功标准

### 立即目标 (明天上午)
- ✅ 修复客户端类型错误
- ✅ 通过 `npm run type-check`
- ✅ 成功构建 `npm run build`

### 短期目标 (明天全天)
- ✅ 完成服务端核心功能
- ✅ 完成客户端核心功能
- ✅ 添加基础中间件
- ✅ 创建使用示例

### 中期目标 (本周)
- ✅ 集成 auth-core 包
- ✅ 集成 schema 包
- ✅ 完善错误处理
- ✅ 完整文档

## 💡 开发提示

1. **优先修复错误**: 先解决类型错误，再添加新功能
2. **渐进式开发**: 每完成一个功能就测试构建
3. **参考现有包**: 可以参考 auth-core 和 schema 包的结构
4. **保持类型安全**: 避免使用 any，优先使用泛型
5. **文档同步**: 重要变更要更新 AI Context

## 🔗 相关资源

- tRPC 官方文档: https://trpc.io/
- React Query 文档: https://tanstack.com/query/
- 项目 AI Context: `ai-context/packages/`
- 其他包参考: `packages/auth-core/`, `packages/schema/`

---

**使用方法**: 明天开始工作时，直接按照"明天的立即任务"部分执行即可。所有必要的上下文信息都在这个文件和相关的 AI Context 文档中。
