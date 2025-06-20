# 生成 API 文档提示

## 🎯 任务概述
您需要为 Linch Kit 包生成全面的 API 文档。这涉及从 TypeScript 源代码中提取信息、创建结构化文档，并确保所有包 API 的一致性。

## 📋 API 文档标准

### 文档结构
每个 API 参考应包括：
- **概述**：包的目的和主要概念
- **安装**：包安装和设置
- **快速开始**：基本使用示例
- **API 参考**：详细的函数/类文档
- **类型**：TypeScript 类型定义
- **示例**：实际使用场景
- **迁移**：版本升级指南

### 每个 API 的必需信息
- **函数/方法名称**：清晰、描述性的标识符
- **描述**：它的作用和何时使用
- **参数**：类型、描述、必需/可选、默认值
- **返回值**：类型和描述
- **抛出**：可能的异常和错误条件
- **示例**：工作代码演示
- **自版本**：引入时的版本
- **已弃用**：如适用，包含迁移路径

## 🔧 源代码分析

### TypeScript 提取流程
1. **解析源文件**：提取导出、类型、接口
2. **提取 JSDoc 注释**：从代码注释中获取文档
3. **分析类型签名**：参数和返回类型
4. **识别依赖关系**：包间关系
5. **生成示例**：创建使用演示

### 代码文档标准
```typescript
/**
 * 定义带有验证规则和类型安全的模式
 * 
 * @param definition - 模式定义对象
 * @param options - 可选配置设置
 * @returns 带有类型推断的验证模式实例
 * 
 * @example
 * ```typescript
 * const userSchema = defineSchema({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().min(0).optional()
 * })
 * ```
 * 
 * @since 2.0.0
 * @category Schema
 */
export function defineSchema<T extends ZodRawShape>(
  definition: T,
  options?: SchemaOptions
): Schema<T> {
  // 实现
}
```

## 📚 包特定指南

### @linch-kit/schema
重点领域：
- 模式定义函数
- 验证装饰器
- 类型推断功能
- 数据库集成
- 字段配置选项

### @linch-kit/auth-core
重点领域：
- 身份验证方法
- 用户管理
- 会话处理
- 权限系统
- 多租户支持

### @linch-kit/crud
重点领域：
- CRUD 操作
- 查询构建器
- 过滤和排序
- 分页
- 关系处理

### @linch-kit/trpc
重点领域：
- 路由器配置
- 过程定义
- 中间件设置
- 类型安全功能
- 客户端集成

## 📝 文档生成流程

### 步骤 1：源分析
```bash
# 从源代码提取 API 信息
npx typedoc --json api-temp.json src/index.ts
# 解析 JSDoc 注释和类型信息
# 为文档生成结构化数据
```

### 步骤 2：内容生成
创建文档部分：

#### 包概述
```markdown
# @linch-kit/schema

Linch Kit 应用程序的类型安全模式定义和验证。

## 特性
- 🔒 类型安全的模式定义
- ✅ 运行时验证
- 🗄️ 数据库集成
- 🎨 UI 组件生成
- 🌐 国际化支持

## 安装
```bash
npm install @linch-kit/schema
```

#### API 参考模板
```markdown
## defineSchema

定义带有验证规则和类型安全的模式。

### 签名
```typescript
function defineSchema<T extends ZodRawShape>(
  definition: T,
  options?: SchemaOptions
): Schema<T>
```

### 参数
- `definition`（必需）：使用 Zod 验证器的模式定义对象
- `options`（可选）：模式的配置选项

### 返回
带有推断类型和验证方法的 `Schema<T>` 实例。

### 示例
```typescript
import { defineSchema } from '@linch-kit/schema'
import { z } from 'zod'

const userSchema = defineSchema({
  name: z.string().min(1, '姓名是必需的'),
  email: z.string().email('无效的邮箱格式'),
  age: z.number().min(0).optional()
})

// 类型安全使用
const user = userSchema.parse({
  name: '张三',
  email: 'zhangsan@example.com',
  age: 30
})
```
```

### 步骤 3：交叉引用生成
- 链接相关函数和类型
- 创建包间导航
- 生成依赖图
- 构建搜索索引

### 步骤 4：示例生成
创建全面的示例：

#### 基本使用示例
```typescript
// 简单模式定义
const basicSchema = defineSchema({
  title: z.string(),
  published: z.boolean().default(false)
})
```

#### 高级使用示例
```typescript
// 带有关系的复杂模式
const advancedSchema = defineSchema({
  user: z.object({
    id: z.string().uuid(),
    profile: z.object({
      name: z.string(),
      avatar: z.string().url().optional()
    })
  }),
  posts: z.array(z.object({
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string())
  }))
}, {
  database: {
    table: 'users',
    relationships: {
      posts: { type: 'hasMany', foreignKey: 'userId' }
    }
  }
})
```

## 🌐 国际化

### 多语言 API 文档
生成多种语言的文档：

#### 英文文档
- 技术精确性
- 全球最佳实践
- 国际示例
- 全面覆盖

#### 中文文档
- 本地化示例
- 文化语境
- 简化解释
- 中国特定考虑

### 翻译工作流程
1. 首先生成英文文档
2. 提取可翻译内容
3. 翻译描述和示例
4. 保持技术准确性
5. 跨语言同步更新

## 🔍 质量保证

### 自动验证
- **类型检查**：确保所有示例编译
- **链接验证**：验证所有交叉引用有效
- **示例测试**：运行所有代码示例
- **一致性检查**：验证命名约定
- **完整性**：确保所有导出都有文档

### 手动审查流程
- **技术准确性**：内容的专家审查
- **清晰性**：用户体验测试
- **完整性**：覆盖评估
- **示例**：实际相关性检查
- **导航**：用户旅程验证

## 📊 文档指标

### 覆盖指标
- **API 覆盖**：已记录的导出函数百分比
- **示例覆盖**：带有工作示例的函数
- **类型覆盖**：已记录的类型定义
- **交叉引用覆盖**：链接的相关函数

### 质量指标
- **用户满意度**：社区反馈分数
- **使用分析**：最常访问的文档
- **支持减少**：已记录主题的问题减少
- **贡献率**：社区文档贡献

## 🛠️ 工具和自动化

### 文档生成工具
- **TypeDoc**：TypeScript API 提取
- **JSDoc**：注释解析和格式化
- **Nextra**：文档站点生成
- **自定义脚本**：包特定处理

### 自动化管道
```yaml
# 文档生成工作流程
name: Generate API Docs
on:
  push:
    paths: ['packages/*/src/**']
jobs:
  generate-docs:
    steps:
      - 提取 API 信息
      - 生成文档
      - 更新交叉引用
      - 验证示例
      - 部署到文档站点
```

## 📋 维护工作流程

### 定期更新
- **版本发布**：使用新版本更新 API 文档
- **功能添加**：记录新功能
- **弃用**：标记过时的 API 并提供迁移路径
- **错误修复**：更正文档错误
- **示例更新**：保持示例最新和相关

### 社区集成
- **反馈收集**：收集用户对文档质量的输入
- **贡献指南**：启用社区文档贡献
- **审查流程**：维护贡献的质量标准
- **认可**：承认社区贡献者

## 🎯 成功标准

有效的 API 文档应该：
- **启用自助服务**：用户可以在没有支持的情况下实现功能
- **减少学习曲线**：清晰的示例和解释
- **保持最新**：始终反映最新的包版本
- **支持发现**：易于导航和搜索
- **鼓励采用**：引人注目的示例和明确的好处

## 🚨 要避免的常见陷阱

- **过时示例**：与当前版本不兼容的代码
- **缺失上下文**：没有足够设置信息的示例
- **不一致命名**：包间不同的约定
- **糟糕的交叉链接**：没有连接的孤立文档
- **技术术语**：假设过多知识的解释
- **不完整覆盖**：缺失重要函数或边缘情况
