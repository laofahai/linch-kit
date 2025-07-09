# LinchKit 包依赖关系分析报告

## 目标架构约束

期望的依赖顺序：core → schema → auth → crud → trpc → ui

## 当前依赖关系分析

### 1. @linch-kit/core

**位置**: L0 (基础层)
**依赖**:

- 仅依赖外部包，无内部依赖
- peerDependencies: zod

**状态**: ✅ 符合架构约束

### 2. tools/schema

**位置**: L1
**依赖**:

- @linch-kit/core (workspace:\*)

**状态**: ✅ 符合架构约束

### 3. @linch-kit/auth

**位置**: L2
**依赖**:

- devDependencies: @linch-kit/core, tools/schema
- peerDependencies: @linch-kit/core, tools/schema

**状态**: ✅ 符合架构约束 (应该将 devDependencies 改为 dependencies)

### 4. @linch-kit/platform

**位置**: L3
**依赖**:

- @linch-kit/core (workspace:\*)
- tools/schema (workspace:\*)
- @linch-kit/auth (workspace:\*)

**状态**: ✅ 符合架构约束

### 5. @linch-kit/platform

**位置**: L4
**依赖**:

- @linch-kit/core (workspace:\*)
- @linch-kit/auth (workspace:\*)
- ⚠️ **缺少 tools/schema 依赖**

**状态**: ⚠️ 部分违反架构约束

### 6. @linch-kit/ui

**位置**: L5
**依赖**:

- @linch-kit/core (workspace:\*)
- tools/schema (workspace:\*)
- @linch-kit/platform (workspace:\*)
- ⚠️ **缺少 @linch-kit/auth 依赖**

**状态**: ⚠️ 部分违反架构约束

## 发现的问题

### 1. 依赖缺失问题

- **@linch-kit/platform** 缺少 tools/schema 依赖
- **@linch-kit/ui** 缺少 @linch-kit/auth 依赖

### 2. 依赖配置问题

- **@linch-kit/auth** 将 core 和 schema 放在 devDependencies，应该移到 dependencies

### 3. 架构层级跳跃

- **@linch-kit/ui** 直接依赖 @linch-kit/platform，跳过了 @linch-kit/auth 和 @linch-kit/platform

## 修复建议

### 1. 立即修复

- 将 @linch-kit/auth 的 devDependencies 改为 dependencies
- 为 @linch-kit/platform 添加 tools/schema 依赖
- 为 @linch-kit/ui 添加 @linch-kit/auth 依赖

### 2. 架构优化

- 考虑 @linch-kit/ui 是否真的需要直接依赖 @linch-kit/platform
- 如果需要，确保依赖链完整：ui → trpc → crud → auth → schema → core

## 完整的期望依赖关系

```
@linch-kit/core (L0)
    ↓
tools/schema (L1)
    ↓
@linch-kit/auth (L2)
    ↓
@linch-kit/platform (L3)
    ↓
@linch-kit/platform (L4)
    ↓
@linch-kit/ui (L5)
```

## 下一步行动

1. 修复 @linch-kit/auth 的依赖配置
2. 补充 @linch-kit/platform 的 schema 依赖
3. 补充 @linch-kit/ui 的 auth 依赖
4. 验证修复后的构建和测试
