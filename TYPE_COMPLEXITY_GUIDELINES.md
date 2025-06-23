# TypeScript 类型复杂度规范和最佳实践

## 🎯 目标
建立 LinchKit 项目的 TypeScript 类型复杂度规范，防止类似的 DTS 构建性能问题再次发生。

## 📏 复杂度指标和阈值

### 核心指标
1. **泛型嵌套深度**: ≤ 5 层
2. **条件类型链长度**: ≤ 10 个
3. **映射类型复杂度**: ≤ 3 层嵌套
4. **函数重载数量**: ≤ 8 个
5. **联合类型成员数量**: ≤ 20 个

### 性能阈值
- 单个类型文件 DTS 构建时间: ≤ 5 秒
- 包级别 DTS 构建时间: ≤ 30 秒
- 类型推导内存使用: ≤ 1GB

## 🚫 禁止的类型模式

### 1. 过度嵌套的泛型
```typescript
// ❌ 禁止：过度嵌套的泛型约束
type DeepNested<T extends Record<string, Record<string, Record<string, any>>>> = {
  [K in keyof T]: {
    [P in keyof T[K]]: {
      [Q in keyof T[K][P]]: T[K][P][Q] extends string ? string : never
    }
  }
}

// ✅ 推荐：分层定义，逐步构建
type Level1<T> = T extends Record<string, any> ? T : never
type Level2<T> = {
  [K in keyof T]: Level1<T[K]>
}
type Level3<T> = {
  [K in keyof T]: Level2<T[K]>
}
```

### 2. 复杂的条件类型链
```typescript
// ❌ 禁止：长链条件类型
type ComplexChain<T> = T extends string 
  ? T extends `${infer A}:${infer B}` 
    ? B extends `${infer C}:${infer D}`
      ? D extends `${infer E}:${infer F}`
        ? F extends `${infer G}:${infer H}`
          ? H
          : never
        : never
      : never
    : never
  : never

// ✅ 推荐：分步骤处理
type ParseFirst<T> = T extends `${infer A}:${infer B}` ? B : never
type ParseSecond<T> = T extends `${infer A}:${infer B}` ? B : never
type ParseThird<T> = T extends `${infer A}:${infer B}` ? B : never
type SimpleChain<T> = ParseThird<ParseSecond<ParseFirst<T>>>
```

### 3. 大量属性复制的映射类型
```typescript
// ❌ 禁止：大量属性复制
type MassiveCopy<T> = {
  [K in keyof T]: T[K]
} & {
  [K in keyof T as `${string & K}_copy`]: T[K]
} & {
  [K in keyof T as `${string & K}_backup`]: T[K]
} & {
  [K in keyof T as `${string & K}_temp`]: T[K]
}

// ✅ 推荐：按需复制，使用工具类型
type SelectiveFields<T, K extends keyof T> = Pick<T, K>
type WithPrefix<T, P extends string> = {
  [K in keyof T as `${P}${string & K}`]: T[K]
}
```

## ✅ 推荐的类型模式

### 1. 分层类型架构
```typescript
// 基础类型层
interface BaseConfig {
  id: string
  name: string
}

// 扩展类型层
interface ExtendedConfig extends BaseConfig {
  description?: string
  metadata?: Record<string, unknown>
}

// 特化类型层
interface FieldConfig extends ExtendedConfig {
  type: 'string' | 'number' | 'boolean'
  required?: boolean
}
```

### 2. 组合优于继承
```typescript
// ✅ 推荐：使用组合
interface DatabaseConfig {
  type: string
  connection: string
}

interface CacheConfig {
  ttl: number
  maxSize: number
}

interface AppConfig {
  database: DatabaseConfig
  cache: CacheConfig
}

// ❌ 避免：深度继承
interface BaseConfig {
  name: string
}
interface DatabaseConfig extends BaseConfig {
  connection: string
}
interface CachedDatabaseConfig extends DatabaseConfig {
  ttl: number
}
```

### 3. 显式类型注解
```typescript
// ✅ 推荐：显式类型注解
const userSchema: z.ZodObject<{
  id: z.ZodString
  name: z.ZodOptional<z.ZodString>
  email: z.ZodOptional<z.ZodString>
}> = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().optional(),
})

// ❌ 避免：依赖复杂类型推导
const userSchema = defineComplexEntity({
  id: defineComplexField(z.string(), { /* 复杂配置 */ }),
  name: defineComplexField(z.string().optional(), { /* 复杂配置 */ }),
  // ...
})
```

### 4. 工具类型的合理使用
```typescript
// ✅ 推荐：简单的工具类型
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
type RequiredFields<T> = {
  [K in keyof T]-?: T[K]
}

// ✅ 推荐：预定义常用组合
type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
type UpdateInput<T> = Partial<CreateInput<T>> & { id: string }
```

## 🔧 类型复杂度检查工具

### 1. ESLint 规则配置
```json
// .eslintrc.js
{
  "rules": {
    "@typescript-eslint/ban-types": [
      "error",
      {
        "types": {
          "{}": "Use Record<string, unknown> instead",
          "object": "Use Record<string, unknown> instead"
        }
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-as-const": "error"
  }
}
```

### 2. 自定义复杂度检查器
```typescript
// scripts/type-complexity-checker.ts
import * as ts from 'typescript'

interface ComplexityMetrics {
  genericDepth: number
  conditionalTypeChains: number
  mappedTypeComplexity: number
  overloadCount: number
  unionMemberCount: number
}

export class TypeComplexityChecker {
  private thresholds = {
    genericDepth: 5,
    conditionalTypeChains: 10,
    mappedTypeComplexity: 3,
    overloadCount: 8,
    unionMemberCount: 20
  }

  checkFile(filePath: string): ComplexityMetrics {
    const program = ts.createProgram([filePath], {})
    const sourceFile = program.getSourceFile(filePath)!
    
    const metrics: ComplexityMetrics = {
      genericDepth: 0,
      conditionalTypeChains: 0,
      mappedTypeComplexity: 0,
      overloadCount: 0,
      unionMemberCount: 0
    }

    const visit = (node: ts.Node) => {
      // 检查泛型深度
      if (ts.isTypeParameterDeclaration(node)) {
        metrics.genericDepth = Math.max(metrics.genericDepth, this.getGenericDepth(node))
      }
      
      // 检查条件类型
      if (ts.isConditionalTypeNode(node)) {
        metrics.conditionalTypeChains++
      }
      
      // 检查映射类型
      if (ts.isMappedTypeNode(node)) {
        metrics.mappedTypeComplexity = Math.max(
          metrics.mappedTypeComplexity, 
          this.getMappedTypeComplexity(node)
        )
      }
      
      // 检查联合类型
      if (ts.isUnionTypeNode(node)) {
        metrics.unionMemberCount = Math.max(
          metrics.unionMemberCount,
          node.types.length
        )
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return metrics
  }

  validateMetrics(metrics: ComplexityMetrics): string[] {
    const violations: string[] = []
    
    if (metrics.genericDepth > this.thresholds.genericDepth) {
      violations.push(`Generic depth (${metrics.genericDepth}) exceeds threshold (${this.thresholds.genericDepth})`)
    }
    
    if (metrics.conditionalTypeChains > this.thresholds.conditionalTypeChains) {
      violations.push(`Conditional type chains (${metrics.conditionalTypeChains}) exceed threshold (${this.thresholds.conditionalTypeChains})`)
    }
    
    if (metrics.mappedTypeComplexity > this.thresholds.mappedTypeComplexity) {
      violations.push(`Mapped type complexity (${metrics.mappedTypeComplexity}) exceeds threshold (${this.thresholds.mappedTypeComplexity})`)
    }
    
    if (metrics.unionMemberCount > this.thresholds.unionMemberCount) {
      violations.push(`Union member count (${metrics.unionMemberCount}) exceeds threshold (${this.thresholds.unionMemberCount})`)
    }

    return violations
  }

  private getGenericDepth(node: ts.Node): number {
    // 实现泛型深度计算逻辑
    return 1 // 简化实现
  }

  private getMappedTypeComplexity(node: ts.MappedTypeNode): number {
    // 实现映射类型复杂度计算逻辑
    return 1 // 简化实现
  }
}
```

### 3. Git Hook 集成
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🔍 Checking TypeScript type complexity..."

# 检查修改的 TypeScript 文件
changed_files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$')

if [ -n "$changed_files" ]; then
  node scripts/type-complexity-checker.ts $changed_files
  
  if [ $? -ne 0 ]; then
    echo "❌ Type complexity check failed. Please simplify complex types."
    exit 1
  fi
fi

echo "✅ Type complexity check passed."
```

## 📚 最佳实践指南

### 1. 类型设计原则
- **单一职责**: 每个类型只负责一个明确的概念
- **组合优于继承**: 使用接口组合而非深度继承
- **显式优于隐式**: 明确的类型注解优于复杂的类型推导
- **简单优于复杂**: 简单的类型定义优于炫技的高级类型

### 2. 性能优化技巧
- **预定义常用类型**: 避免重复的复杂类型计算
- **使用类型断言**: 在确保安全的前提下避免复杂推导
- **分离关注点**: 将复杂类型拆分为多个简单类型
- **延迟类型计算**: 使用懒加载的类型定义

### 3. 代码审查检查点
- [ ] 泛型嵌套深度是否合理
- [ ] 条件类型是否可以简化
- [ ] 映射类型是否过于复杂
- [ ] 是否存在不必要的类型推导
- [ ] 类型定义是否清晰易懂

## 🔄 持续改进

### 定期审查
- 每月进行类型复杂度审查
- 收集性能问题反馈
- 更新最佳实践指南
- 调整复杂度阈值

### 团队培训
- 定期举办 TypeScript 最佳实践分享
- 建立类型设计评审流程
- 创建复杂类型重构案例库
- 培养团队的类型设计意识
