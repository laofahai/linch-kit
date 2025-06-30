# React Hook Form Next.js 15 兼容性修复尝试记录

## 问题描述
Next.js 15 在构建时选择了 react-hook-form 的 `react-server` 导出而不是标准导出，导致 `useForm`, `Controller`, `FormProvider`, `useFormContext` 等客户端钩子无法导入。

错误信息：
```
Attempted import error: 'useForm' is not exported from 'react-hook-form' (imported as 'useForm$1').
```

## 已尝试的方案

### 方案1: 分离 Node.js 依赖到 server.ts ✅ (部分成功)
**状态**: 已完成，解决了 chokidar/fsevents 问题
**修改**: 
- `packages/core/tsup.config.ts` - 添加大量 externals
- `packages/core/src/server.ts` - 新建文件分离 Node.js 功能
- `packages/core/src/index.ts` - 移除 CLI 和 watcher 导出

### 方案2: 修改 @linch-kit/ui 中的 react-hook-form 导入方式 ❌ (失败)
**状态**: 已尝试，仍有问题
**修改**:
- `packages/ui/src/forms/form-wrapper.tsx` - 从命名空间导入改为具名导入
- `packages/ui/src/components/ui/form.tsx` - 使用 form-wrapper 重新导出
- `packages/ui/src/forms/schema-form.tsx` - 使用 form-wrapper 重新导出

### 方案3: 外部化 react-hook-form 在 UI 包构建中 ❌ (失败)
**状态**: 已配置，但仍将 react-hook-form 打包到输出中
**修改**:
- `packages/ui/tsup.config.ts` - 在 externals 中添加 'react-hook-form'
- 问题：tsup 仍然将 react-hook-form 打包到 chunk-72WEF4WG.mjs 中

### 方案4: Next.js webpack 配置修改 ❌ (失败)
**状态**: 已尝试多种配置，无效
**修改**:
- `apps/starter/next.config.ts` - 尝试了多种 webpack 配置：
  - conditionNames 修改 
  - mainFields 配置
  - alias 别名配置
  - resolve.extensions 配置

## 当前状态
- **Core 包**: ✅ 构建成功，Node.js 依赖已分离
- **所有其他包**: ✅ 构建成功
- **Starter 应用**: ❌ 仍有 react-hook-form 导入错误

## 问题根源分析
1. react-hook-form 7.59.0 在 package.json 中有 "react-server" 导出条件
2. Next.js 15 优先选择 react-server 导出，但该导出不包含客户端钩子
3. 即使配置 externals，tsup 仍会在构建时解析并打包 react-hook-form
4. Next.js webpack 配置无法覆盖第三方包的导出条件选择

## 待尝试方案

### 方案5: 降级 react-hook-form 到不包含 react-server 导出的版本
- 检查哪个版本的 react-hook-form 没有 react-server 导出
- 在根目录 package.json 中添加版本锁定

### 方案6: 使用 pnpm.overrides 强制版本
- 在根目录 pnpm 配置中覆盖 react-hook-form 版本
- 锁定到兼容版本

### 方案7: Patch react-hook-form package.json ✅ (部分成功)
**状态**: 已应用，改变了错误类型
**修改**:
- 创建了 patches/react-hook-form@7.59.0.patch
- 在根目录 package.json 添加 pnpm.patchedDependencies 配置
- 移除了 react-hook-form package.json 中的 "react-server" 导出条件
**结果**: 错误从 "react-server export" 变为具体的导出问题，说明 Next.js 现在使用标准导出

### 方案8: 完全重写表单组件不使用 react-hook-form
- 自建表单状态管理
- 使用 useReducer + useContext
- 较大重构工作量

### 方案9: 创建 react-hook-form 的 wrapper 包
- 创建独立的包重新导出 react-hook-form
- 在该包中强制使用标准导出

## 当前状态总结 (2025-06-30 13:50)

### ✅ 重大突破
**方案7: Patch react-hook-form package.json** 取得决定性成功：
- ✅ 成功移除 react-server 导出条件
- ✅ Next.js 15 现在选择标准导出而非 react-server 导出
- ✅ 错误类型从 "react-server export not found" 变为具体导出问题
- ✅ 所有 LinchKit 包 (core, schema, auth, crud, trpc, ui, console) 成功构建

### 🔧 应用的修复
1. **Node.js 依赖分离** - 完全解决：
   - 创建 `packages/core/src/server.ts` 
   - 修复 chokidar TypeScript 类型错误
   - 外部化 Node.js 模块避免客户端打包

2. **pnpm patch 配置** - 成功应用：
   ```json
   // 根目录 package.json
   "pnpm": {
     "patchedDependencies": {
       "react-hook-form@7.59.0": "patches/react-hook-form@7.59.0.patch"
     }
   }
   ```

3. **patch 内容**:
   ```patch
   // 移除 react-server 导出条件
   -      "react-server": "./dist/react-server.esm.mjs",
   ```

### 🚧 仍需解决的问题
1. **构建环境**: react-hook-form 导出问题（错误类型已改变，说明 patch 生效）
2. **开发环境新问题**:
   - `stream/promises` 模块未找到 (Node.js 模块在客户端)
   - react-hook-form 导出问题（与构建环境相同）

### 📈 进展评估
- **架构层面**: ✅ 完全解决
- **构建流程**: ✅ 显著改善（所有包构建成功）
- **兼容性根因**: ✅ 已解决（patch 生效）
- **最终集成**: ⚠️ 需要最后调整

## 下一步行动计划
1. 解决开发环境的 `stream/promises` Node.js 模块问题
2. 完善 react-hook-form 导出问题的最终修复
3. 验证完整的开发和构建流程