# QA Synthesize Command

## 📋 概述

QA Synthesizer (质量合成师) 是LinchKit AI Guardian Phase 3的核心组件，专门用于自动生成高质量测试用例，确保边界条件覆盖和逻辑意图验证。

## 🎯 主要功能

- **智能代码分析**: 自动分析源代码结构和复杂度
- **测试用例生成**: 基于Schema驱动的智能测试生成
- **边界条件覆盖**: 系统化覆盖null、undefined、极值等边界情况
- **质量评分**: 对生成的测试进行0-100分的质量评估
- **批量处理**: 支持目录级别的批量测试生成

## 🚀 使用方法

### 基础命令

```bash
# 分析单个文件
/qa-synthesize analyze src/services/user.service.ts

# 生成单个文件的测试
/qa-synthesize generate src/components/Button.tsx

# 批量处理目录
/qa-synthesize batch src/

# 生成质量报告
/qa-synthesize report
```

### 高级选项

```bash
# 设置测试质量级别
/qa-synthesize generate src/api/auth.ts --quality=comprehensive

# 包含性能和安全测试
/qa-synthesize generate src/utils/crypto.ts --performance --security

# 指定输出目录
/qa-synthesize batch src/ --output=tests/generated/

# 批量处理时使用文件过滤
/qa-synthesize batch src/ --include="**/*.service.ts" --exclude="**/*.test.ts"

# 调试模式
/qa-synthesize analyze src/complex-file.ts --debug
```

## 🎚️ 测试质量级别

### Basic (基础)
- 目标覆盖率: 85%
- 基础功能测试
- 简单边界条件

### Enhanced (增强) - 默认
- 目标覆盖率: 90%
- 完整边界条件测试
- 错误处理验证
- 异步操作测试

### Comprehensive (全面)
- 目标覆盖率: 95%
- 性能基准测试
- 安全性验证
- 逻辑意图验证
- 变异测试支持

## 📊 分析输出示例

```
🔍 开始分析文件: src/services/user.service.ts
✅ 分析完成:
   📊 复杂度: 15
   🔧 函数数量: 8
   📦 类数量: 1
   ⚠️  边界条件: 12
   🎯 目标覆盖率: 90%
```

## 🧪 生成测试示例

```
🧪 开始生成测试: src/components/Button.tsx
✅ 测试生成完成:
   📁 测试文件: src/components/__tests__/Button.test.tsx
   📊 测试数量: 15
   🎯 预期覆盖率: 90%
   ⭐ 质量评分: 88/100
```

## 📦 批量处理示例

```
📦 开始批量处理: src/
🔍 找到 25 个文件待处理
✅ 批量处理完成:
   📁 处理文件: 25/25
   📊 总测试数量: 387
   ⭐ 平均质量评分: 85/100
```

## 🔧 生成的测试特性

### 1. 标准测试结构
```typescript
describe('ComponentName', () => {
  describe('正常场景', () => {
    it('should handle valid input correctly', () => {
      // 正常功能测试
    });
  });

  describe('边界条件', () => {
    it('should handle null input', () => {
      // null值测试
    });
    
    it('should handle empty input', () => {
      // 空值测试
    });
  });

  describe('错误处理', () => {
    it('should throw error for invalid input', () => {
      // 错误处理测试
    });
  });
});
```

### 2. 测试数据工厂
```typescript
class TestDataFactory {
  static createValidInput() {
    return { /* 有效数据 */ };
  }
  
  static createInvalidInput() {
    return { /* 无效数据 */ };
  }
  
  static createEdgeCaseInput() {
    return { /* 边界情况数据 */ };
  }
}
```

### 3. AI生成标记
```typescript
/**
 * @ai-generated
 * @model: Claude AI Guardian
 * @human-reviewed: pending
 * @coverage-target: 90%
 * @complexity: 15
 */
```

## 📋 质量评分机制

- **基础覆盖 (40分)**: 测试用例数量与预期的比例
- **边界条件 (30分)**: 边界条件测试的完整性
- **错误处理 (20分)**: 异常情况的测试覆盖
- **测试质量 (10分)**: 测试结构、数据工厂、清理机制

## 🗂️ 文件结构

```
.claude/qa-synthesizer/
├── analysis-{timestamp}.json     # 代码分析结果
├── quality-report-{timestamp}.json # 质量报告
└── test-generation-log.json      # 生成日志
```

## ⚠️ 使用注意事项

1. **代码分析基于静态解析**: 对于动态代码可能分析不完整
2. **生成的测试需要人工审查**: AI标记为`@human-reviewed: pending`
3. **测试数据需要调整**: 生成的测试数据可能需要根据实际业务调整
4. **复杂逻辑需要补充**: 对于复杂业务逻辑，可能需要手动补充测试用例

## 🔗 集成说明

QA Synthesizer已集成到LinchKit开发工作流:

- **package.json脚本**: `bun run qa:*`
- **AI Platform**: 统一的Guardian工具集
- **Graph RAG**: 基于项目上下文的智能分析
- **测试标准**: 遵循LinchKit测试规范和覆盖率要求

## 📚 相关文档

- [AI Guardian Implementation Phases](../ai-context/02_Guides/13_AI_Guardian_Implementation_Phases.md)
- [Testing Standards](../ai-context/02_Guides/08_Testing_Standards.md)
- [AI Native Development Risk Control](../ai-context/02_Guides/12_AI_Native_Development_Risk_Control.md)

---

**提示**: QA Synthesizer生成的测试是起点，不是终点。始终需要人工审查和业务逻辑补充。