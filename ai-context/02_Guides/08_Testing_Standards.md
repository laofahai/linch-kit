# 测试标准与要求 v2.0.3

**版本**: v2.0.3  
**专项**: 测试相关的完整要求  
**加载条件**: 涉及测试编写或修改的任务

## 🧪 TDD强制流程

### 测试驱动开发强制要求

每次功能开发必须按以下顺序执行：

```bash
# 阶段 1: 编写测试用例 (先写测试)
touch src/__tests__/[feature].test.ts

# 阶段 2: 编写功能代码 (满足测试)
# [实现功能代码...]

# 阶段 3: 验证测试 (确保通过)
bun test                    # 运行所有测试
bun test --coverage         # 检查覆盖率

# 阶段 4: 提交代码 (功能 + 测试一起提交)
git add .
git commit -m "feat: implement feature X with comprehensive tests"
```

### 🔴 强制测试场景

- **🔴 新功能开发**: 每个新功能必须在完成后立即编写测试
- **🔴 功能修改**: 修改现有功能必须同步更新相关测试
- **🔴 API 接口变更**: 修改公共 API 必须同步更新测试用例
- **🔴 Bug 修复**: 修复 bug 后必须添加防止回归的测试

## 📊 覆盖率要求

### 分包覆盖率标准

- **🔴 核心包** (@linch-kit/core): **98%+**
- **🔴 关键包** (auth, schema, crud): **95%+**
- **🔴 UI组件包**: **90%+**
- **🔴 应用层**: **85%+**

### 覆盖率检查命令

```bash
# 运行测试并生成覆盖率报告
bun test --coverage

# 检查特定包的覆盖率
bun test --coverage packages/core

# 生成详细覆盖率报告
bun test --coverage --reporter=html
```

### 覆盖率不达标处理

```bash
# 识别未覆盖的代码
bun test --coverage --reporter=text-summary

# 针对性编写测试
# 重新检查覆盖率
bun test --coverage packages/[package-name]
```

## 🔬 变异测试

### 变异测试集成

- **🔴 变异测试覆盖率**: > 80%
- **🔴 边界条件测试**: 必须完整
- **🔴 错误路径测试**: 必须覆盖所有异常

### 变异测试工具

```bash
# 运行变异测试
bun run test:mutation

# 针对特定包运行变异测试
bun run test:mutation packages/core

# 生成变异测试报告
bun run test:mutation --reporter=html
```

### 变异测试配置

```typescript
// mutation.config.ts
export default {
  testFiles: ['src/**/*.test.ts'],
  mutationScore: {
    minimum: 80,
    break: true,
  },
  reporters: ['progress', 'html'],
  coverageAnalysis: 'perTest',
}
```

## 🧪 测试框架标准

### 强制使用 bun:test

```typescript
// ✅ 正确的导入方式
import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test'

// ❌ 禁止使用其他测试框架
// import { describe, it, expect } from 'vitest'
// import { describe, it, expect } from 'jest'
```

### 测试文件命名规范

```
src/
├── components/
│   ├── Button.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── utils/
│   ├── formatters.ts
│   └── __tests__/
│       └── formatters.test.ts
```

### 测试用例结构标准

```typescript
// 标准测试用例结构
describe('ComponentName', () => {
  beforeEach(() => {
    // 测试前置条件
  })

  afterEach(() => {
    // 测试后清理
  })

  describe('正常场景', () => {
    it('should handle normal case', () => {
      // 测试正常情况
    })
  })

  describe('边界条件', () => {
    it('should handle edge case', () => {
      // 测试边界情况
    })
  })

  describe('错误处理', () => {
    it('should handle error case', () => {
      // 测试错误情况
    })
  })
})
```

## 🎯 测试质量要求

### 测试用例完整性

每个测试文件必须包含：

- **✅ 正常场景测试**: 覆盖主要功能路径
- **✅ 边界条件测试**: 覆盖临界值和极限情况
- **✅ 错误处理测试**: 覆盖所有异常情况
- **✅ 性能测试**: 关键功能的性能验证

### 测试数据管理

```typescript
// 测试数据工厂
export class TestDataFactory {
  static createUser(overrides?: Partial<User>): User {
    return {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides,
    }
  }

  static createInvalidUser(): Partial<User> {
    return {
      email: 'invalid-email',
      name: '',
    }
  }
}
```

### Mock 和 Stub 规范

```typescript
// ✅ 正确的 Mock 使用
import { mock } from 'bun:test'

const mockUserService = mock(() => ({
  findUser: mock(() => Promise.resolve(TestDataFactory.createUser())),
  updateUser: mock(() => Promise.resolve(true)),
}))

// ✅ 清理 Mock
afterEach(() => {
  mockUserService.mockClear()
})
```

## 🚀 AI测试生成质量标准

### AI生成测试的要求

- **🔴 完整性**: 必须覆盖所有功能分支
- **🔴 准确性**: 断言必须正确和有意义
- **🔴 可读性**: 测试用例命名清晰
- **🔴 可维护性**: 测试代码结构良好

### AI生成测试验证

```bash
# 验证AI生成的测试质量
bun run ai:test-quality-check [测试文件]

# 检查测试覆盖率
bun test --coverage [测试文件]

# 运行变异测试验证
bun run test:mutation [测试文件]
```

### 测试生成最佳实践

```typescript
// AI生成测试的标准模板
describe('AI Generated Tests for [ComponentName]', () => {
  /**
   * @ai-generated
   * @model: Claude-3.5-Sonnet
   * @human-reviewed: pending
   */

  // 测试用例按复杂度分组
  describe('基础功能测试', () => {
    // 基本功能测试
  })

  describe('边界条件测试', () => {
    // 边界条件测试
  })

  describe('错误处理测试', () => {
    // 错误处理测试
  })
})
```

## 📋 测试检查清单

### 测试编写完成检查

- [ ] **覆盖率达标**: 包级别覆盖率要求满足
- [ ] **变异测试通过**: 变异测试得分 > 80%
- [ ] **测试命名清晰**: 测试用例描述清晰
- [ ] **断言有效**: 所有断言都有意义
- [ ] **数据管理**: 测试数据隔离和清理
- [ ] **Mock清理**: 所有Mock在测试后清理
- [ ] **性能验证**: 关键路径有性能测试
- [ ] **文档同步**: 测试文档已更新

### 测试运行检查

```bash
# 完整测试检查流程
bun test                    # 所有测试通过
bun test --coverage         # 覆盖率达标
bun run test:mutation       # 变异测试通过
bun test --reporter=verbose # 详细输出检查
```

---

**使用建议**: 本文档适用于所有涉及测试的任务，严格遵循TDD流程和覆盖率要求。
