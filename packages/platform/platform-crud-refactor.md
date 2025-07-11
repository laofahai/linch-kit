# Platform包CRUD重构设计方案

**日期**: 2025-07-11  
**作者**: Claude AI  
**状态**: 设计中

## 🚨 问题分析

### 严重架构违规

1. **重复实现**: platform包重复实现了完整的CRUD功能，违反了LinchKit架构原则
2. **包职责不清**: platform包应该作为Extension系统的扩展层，而不是核心功能的重复实现
3. **依赖混乱**: 破坏了LinchKit的分层架构依赖顺序

### 受影响的文件

- `packages/platform/src/crud/` - 整个目录需要删除（已完成）
- `packages/platform/src/trpc/crud-router-factory.ts` - 严重依赖已删除的CRUD实现
- `packages/platform/src/index.ts` - 导出了重复的CRUD功能（已修复）

## 🎯 重构目标

1. **遵循架构原则**: 严格遵循LinchKit包依赖顺序
2. **职责单一**: platform包只提供Extension系统的扩展功能
3. **复用核心功能**: 使用LinchKit核心包而非重复实现
4. **保持向后兼容**: 提供迁移路径给现有用户

## 🏗️ 新架构设计

### 1. Platform包的正确定位

```
platform包应该专注于：
- Extension系统的业务扩展能力
- Schema运行时功能增强
- tRPC路由的Extension集成
- 验证功能的Extension适配
```

### 2. 新的包结构

```
packages/platform/
├── src/
│   ├── extensions/      # Extension系统的扩展功能
│   │   ├── crud-extension.ts    # CRUD功能的Extension适配器
│   │   ├── schema-extension.ts  # Schema扩展
│   │   └── validation-extension.ts
│   ├── schema/          # Schema运行时（保留）
│   ├── trpc/           # tRPC功能（需要重构）
│   │   ├── extension-router-factory.ts  # 基于Extension的路由工厂
│   │   └── types.ts
│   ├── validation/     # 验证功能（保留）
│   └── index.ts
```

### 3. CRUD功能的正确实现方式

#### 方案A: 完全依赖LinchKit核心功能

由于没有独立的@linch-kit/crud包，我们应该：

1. 在platform包中创建Extension适配器
2. 利用@linch-kit/core的Extension系统提供CRUD能力
3. 通过Extension事件系统实现CRUD钩子

#### 方案B: 创建独立的@linch-kit/crud包（推荐）

1. 创建新的@linch-kit/crud包作为核心CRUD功能
2. platform包只提供Extension集成
3. 保持清晰的职责分离

## 📝 实现计划

### Phase 1: 临时修复（立即执行）

1. ✅ 删除platform/src/crud目录
2. ✅ 更新platform/src/index.ts
3. 创建临时的CRUD适配器，使用@linch-kit/core功能
4. 修复trpc/crud-router-factory.ts的依赖问题

### Phase 2: 架构重构（下一步）

1. 评估是否需要创建@linch-kit/crud包
2. 实现基于Extension的CRUD扩展
3. 重构tRPC路由工厂
4. 更新文档和示例

### Phase 3: 迁移支持

1. 提供迁移指南
2. 创建兼容层（如需要）
3. 更新所有依赖platform CRUD功能的代码

## 🔧 临时修复实现

### 1. 创建CRUD Extension适配器

```typescript
// packages/platform/src/extensions/crud-extension.ts
import { ExtensionContext } from '@linch-kit/core'

export class CRUDExtension {
  constructor(private context: ExtensionContext) {}

  // 使用Extension系统提供CRUD能力
  // 而不是重复实现
}
```

### 2. 修复tRPC Router Factory

```typescript
// packages/platform/src/trpc/extension-router-factory.ts
import { initTRPC } from '@trpc/server'
import { ExtensionContext } from '@linch-kit/core'

export function createExtensionRouter(context: ExtensionContext) {
  // 基于Extension系统创建路由
  // 不再依赖重复的CRUD实现
}
```

## 🚨 注意事项

1. **零容忍违规**: 绝不允许重复实现LinchKit核心功能
2. **架构一致性**: 必须遵循LinchKit的分层架构
3. **测试覆盖**: 所有修改必须有对应的测试
4. **文档更新**: 同步更新相关文档

## 📊 成功标准

- [ ] platform包不包含任何重复的CRUD实现
- [ ] 所有功能通过LinchKit核心包或Extension系统实现
- [ ] 通过 `bun run validate` 所有检查
- [ ] 现有功能保持正常工作（通过适配器）
- [ ] 架构符合LinchKit设计原则

## 🎯 下一步行动

1. 实现临时的CRUD适配器
2. 修复tRPC路由工厂
3. 运行完整验证
4. 提交修复并创建PR
