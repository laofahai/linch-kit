# 测试模式和标准

> **适用范围**: 所有 @linch-kit/* 包  
> **更新**: 2025-01-25

## 📊 覆盖率要求

- **@linch-kit/core**: 90%
- **业务包 (auth/crud/schema/trpc/ui)**: 85%
- **应用包 (console/ai)**: 80%

## 🧪 测试分层策略

### 单元测试 (70%)
```typescript
// 使用 vitest + @testing-library
import { describe, it, expect } from 'vitest'

describe('ComponentName', () => {
  it('should handle basic functionality', () => {
    // 测试核心逻辑
  })
})
```

### 集成测试 (25%)
```typescript
// 测试包间交互
describe('Package Integration', () => {
  it('should integrate with auth correctly', () => {
    // 测试跨包集成
  })
})
```

### E2E测试 (5%)
```typescript
// 使用 playwright 测试完整流程
test('complete user workflow', async ({ page }) => {
  // 端到端流程测试
})
```

## 🔧 Mock 策略

### 外部依赖Mock
```typescript
// 统一的Mock工厂
export const createMockConfig = (overrides = {}) => ({
  id: 'test-config',
  version: '1.0.0',
  enabled: true,
  ...overrides
})
```

### 数据库Mock
```typescript
// 使用内存数据库进行测试
export const setupTestDB = () => {
  // SQLite内存数据库配置
}
```