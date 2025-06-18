# AI-First 开发最佳实践

## 🤖 核心原则

**所有代码都要便于 AI 理解、分析和扩展**

### 1. 📝 AI 标注规范

#### 函数标注模板
```typescript
/**
 * @ai-function 函数的简短描述
 * @ai-purpose 函数的具体用途和业务价值
 * @ai-algorithm 使用的算法或处理逻辑 (复杂函数必需)
 * @ai-input 输入参数说明
 * @ai-output 返回值说明
 * @ai-side-effects 副作用描述 (如修改全局状态)
 * @ai-error-handling 错误处理策略
 * @ai-performance 性能特征 (时间/空间复杂度)
 * @ai-thread-safety 线程安全性 (如适用)
 * @ai-caching 缓存策略 (如适用)
 * @ai-validation 输入验证逻辑
 * @ai-dependencies 依赖的外部服务或模块
 */
async function exampleFunction(param: Type): Promise<ReturnType> {
  // AI: 实现逻辑的关键步骤注释
}
```

#### 类标注模板
```typescript
/**
 * @ai-class 类的简短描述
 * @ai-purpose 类的职责和在系统中的作用
 * @ai-pattern 使用的设计模式 (如 Singleton, Factory)
 * @ai-lifecycle 对象生命周期管理
 * @ai-thread-safety 线程安全性
 * @ai-memory-usage 内存使用特征
 * @ai-performance 性能特征
 * @ai-dependencies 依赖的其他类或服务
 */
class ExampleClass {
  /** @ai-field 字段用途说明 */
  private field: Type
  
  /**
   * @ai-constructor 构造函数说明
   * @ai-validation 参数验证逻辑
   * @ai-initialization 初始化步骤
   */
  constructor(param: Type) {
    // AI: 初始化逻辑
  }
}
```

#### 接口标注模板
```typescript
/**
 * @ai-interface 接口描述
 * @ai-purpose 接口的设计目的
 * @ai-implementation 实现要求和约束
 * @ai-extensible 是否支持扩展
 * @ai-validation 验证规则
 */
interface ExampleInterface {
  /** @ai-field 字段说明和约束 */
  field: Type
  
  /**
   * @ai-method 方法说明
   * @ai-contract 方法契约和前后置条件
   */
  method(param: Type): ReturnType
}
```

### 2. 🏗️ 文件结构标注

#### 包级别文档
每个包必须包含 `AI-CONTEXT.md`:

```markdown
# @linch-kit/package-name AI 上下文文档

## 🤖 AI 元数据
{
  "ai-purpose": "包的核心目的",
  "ai-architecture": "架构模式",
  "ai-key-concepts": ["概念1", "概念2"],
  "ai-extension-points": ["扩展点1", "扩展点2"]
}

## 🏗️ 架构概览
- 目录结构说明
- 核心组件关系
- 数据流向

## 🎯 AI 标注规范
- 包特定的标注约定
- 领域特定术语解释

## 🔧 开发指南
- 如何添加新功能
- 如何扩展现有功能
- 测试策略
```

#### 文件头部标注
```typescript
/**
 * @ai-context 文件的上下文说明
 * @ai-purpose 文件的具体作用
 * @ai-dependencies 依赖的其他文件或模块
 * @ai-exports 主要导出内容
 * @ai-tags 相关标签，便于分类和搜索
 */
```

### 3. 🎯 命名约定

#### AI-Friendly 命名规则
```typescript
// ✅ 好的命名 - 自解释且便于 AI 理解
function validateUserEmailAddress(email: string): boolean
function generatePrismaSchemaFromZodDefinition(zodSchema: ZodSchema): string
class DatabaseConnectionManager
interface UserAuthenticationProvider

// ❌ 避免的命名 - 模糊且难以理解
function validate(data: any): boolean
function generate(input: any): string
class Manager
interface Provider
```

#### 常量和配置命名
```typescript
// ✅ 描述性常量名
const MAX_DATABASE_CONNECTION_POOL_SIZE = 20
const DEFAULT_API_REQUEST_TIMEOUT_MS = 5000
const SUPPORTED_DATABASE_PROVIDERS = ['postgresql', 'mysql', 'sqlite'] as const

// ❌ 避免魔法数字和缩写
const MAX_CONN = 20
const TIMEOUT = 5000
```

### 4. 📊 数据结构设计

#### Schema-First 设计
```typescript
/**
 * @ai-schema 用户配置 Schema
 * @ai-purpose 定义用户相关的所有配置选项
 * @ai-validation 使用 Zod 进行运行时验证
 * @ai-extensible 支持插件扩展字段
 */
export const UserConfigSchema = z.object({
  /** @ai-field 用户基本信息 */
  profile: z.object({
    /** @ai-field 用户显示名称，用于 UI 展示 */
    displayName: z.string().min(1).max(100),
    /** @ai-field 用户邮箱，用于通知和登录 */
    email: z.string().email(),
    /** @ai-field 用户头像 URL，可选 */
    avatarUrl: z.string().url().optional()
  }),
  
  /** @ai-field 用户偏好设置 */
  preferences: z.object({
    /** @ai-field 界面主题，影响 UI 外观 */
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    /** @ai-field 语言设置，影响界面语言 */
    language: z.enum(['en', 'zh-CN', 'ja']).default('en'),
    /** @ai-field 是否启用通知 */
    notifications: z.boolean().default(true)
  })
})

/** @ai-type 从 Schema 推导的 TypeScript 类型 */
export type UserConfig = z.infer<typeof UserConfigSchema>
```

#### 错误处理设计
```typescript
/**
 * @ai-error 标准化错误类型
 * @ai-purpose 提供一致的错误处理和用户反馈
 * @ai-categorization 按错误类型分类，便于处理
 */
export class LinchKitError extends Error {
  constructor(
    /** @ai-field 错误消息，面向开发者 */
    message: string,
    /** @ai-field 错误代码，用于程序化处理 */
    public code: string,
    /** @ai-field 用户友好的错误消息 */
    public userMessage?: string,
    /** @ai-field 错误上下文信息 */
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'LinchKitError'
  }
}

/**
 * @ai-function 创建特定类型的错误
 * @ai-purpose 标准化错误创建过程
 */
export function createValidationError(
  field: string, 
  value: any, 
  expected: string
): LinchKitError {
  return new LinchKitError(
    `Validation failed for field '${field}': expected ${expected}, got ${typeof value}`,
    'VALIDATION_ERROR',
    `Invalid value for ${field}. Please check your input.`,
    { field, value, expected }
  )
}
```

### 5. 🔧 配置和环境

#### 环境配置标注
```typescript
/**
 * @ai-config 环境配置定义
 * @ai-purpose 管理不同环境下的配置差异
 * @ai-security 标记敏感配置项
 * @ai-validation 配置验证规则
 */
export const EnvironmentConfigSchema = z.object({
  /** @ai-field 运行环境标识 */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  /** @ai-field 数据库连接 URL - 敏感信息 */
  DATABASE_URL: z.string().url(),
  
  /** @ai-field API 密钥 - 敏感信息 */
  API_SECRET_KEY: z.string().min(32),
  
  /** @ai-field 日志级别配置 */
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
})
```

### 6. 🧪 测试策略

#### AI-Friendly 测试
```typescript
/**
 * @ai-test 用户认证功能测试套件
 * @ai-purpose 验证用户认证流程的正确性
 * @ai-coverage 覆盖正常流程、边界情况和错误处理
 * @ai-dependencies 需要模拟的外部依赖
 */
describe('UserAuthentication', () => {
  /**
   * @ai-test-case 成功登录流程
   * @ai-scenario 用户提供正确的邮箱和密码
   * @ai-expected 返回有效的认证令牌
   */
  it('should authenticate user with valid credentials', async () => {
    // AI: 测试实现
  })
  
  /**
   * @ai-test-case 无效凭据处理
   * @ai-scenario 用户提供错误的密码
   * @ai-expected 抛出认证错误，不泄露敏感信息
   */
  it('should reject invalid credentials securely', async () => {
    // AI: 测试实现
  })
})
```

### 7. 📚 文档生成

#### 自动文档生成
```typescript
/**
 * @ai-doc-generator 从代码注释生成文档
 * @ai-purpose 保持代码和文档的同步
 * @ai-formats 支持 Markdown、HTML、JSON 格式
 */
function generateDocumentationFromCode(
  sourceFiles: string[],
  outputFormat: 'markdown' | 'html' | 'json'
): Promise<string>
```

### 8. 🔍 调试和监控

#### AI-Friendly 日志
```typescript
/**
 * @ai-logger 结构化日志记录器
 * @ai-purpose 提供便于 AI 分析的日志格式
 * @ai-structured 使用 JSON 格式，便于解析
 */
export const logger = {
  /**
   * @ai-log-method 记录信息级别日志
   * @ai-structure { level, message, context, timestamp }
   */
  info(message: string, context?: Record<string, any>) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
      source: 'linch-kit'
    }))
  }
}
```

## 🎯 实施检查清单

### 新功能开发
- [ ] 添加完整的 AI 标注
- [ ] 创建或更新 AI-CONTEXT.md
- [ ] 实现 Schema 验证
- [ ] 添加结构化错误处理
- [ ] 编写 AI-Friendly 测试
- [ ] 更新类型定义
- [ ] 添加使用示例

### 代码审查
- [ ] 检查 AI 标注完整性
- [ ] 验证命名规范
- [ ] 确认错误处理策略
- [ ] 检查类型安全
- [ ] 验证文档同步

### 发布准备
- [ ] 生成 AI 元数据
- [ ] 更新 AI-CONTEXT.md
- [ ] 验证示例代码
- [ ] 检查向后兼容性
- [ ] 更新版本和变更日志

## 🔮 AI 增强功能规划

### 短期目标
- 代码自动补全和建议
- 智能错误诊断
- 配置自动验证

### 中期目标
- 代码自动重构
- 性能优化建议
- 安全漏洞检测

### 长期目标
- 自动化测试生成
- 智能文档生成
- 代码质量评估
