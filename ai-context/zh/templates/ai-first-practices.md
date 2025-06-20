# AI-First 最佳实践

## 🤖 AI-First 开发理念

Linch Kit 采用 AI-First 的设计理念，所有代码、配置、文档都便于 AI 理解和处理。

## 📝 代码编写最佳实践

### 1. 类型定义优先

```typescript
// ✅ 好的实践：完整的类型定义
interface UserCreateInput {
  /** 用户姓名，必填，2-50个字符 */
  name: string
  /** 用户邮箱，必填，需要符合邮箱格式 */
  email: string
  /** 用户角色，可选，默认为 'user' */
  role?: 'admin' | 'user' | 'guest'
  /** 用户头像URL，可选 */
  avatar?: string
}

// ❌ 避免：缺少类型定义
function createUser(data: any) {
  // AI 无法理解参数结构
}
```

### 2. 清晰的函数命名

```typescript
// ✅ 好的实践：动词+名词的命名方式
async function createUserWithValidation(input: UserCreateInput): Promise<User>
async function validateUserEmail(email: string): Promise<boolean>
async function getUsersByRole(role: UserRole): Promise<User[]>

// ❌ 避免：模糊的命名
async function handle(data: any): Promise<any>
async function process(input: unknown): Promise<unknown>
```

### 3. 丰富的注释和文档

```typescript
/**
 * 创建新用户
 * 
 * @description 创建一个新用户，包含邮箱验证、权限检查和数据持久化
 * @param input 用户创建输入数据
 * @param options 创建选项
 * @returns 创建成功的用户对象
 * @throws {ValidationError} 当输入数据不符合要求时
 * @throws {DuplicateEmailError} 当邮箱已存在时
 * 
 * @example
 * ```typescript
 * const user = await createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'user'
 * })
 * ```
 */
async function createUser(
  input: UserCreateInput,
  options: CreateUserOptions = {}
): Promise<User> {
  // 1. 验证输入数据
  const validatedInput = await validateUserInput(input)
  
  // 2. 检查邮箱是否已存在
  const existingUser = await findUserByEmail(validatedInput.email)
  if (existingUser) {
    throw new DuplicateEmailError('邮箱已存在')
  }
  
  // 3. 创建用户
  const user = await userRepository.create(validatedInput)
  
  // 4. 发送欢迎邮件
  await sendWelcomeEmail(user.email)
  
  return user
}
```

### 4. Schema 驱动的开发

```typescript
// ✅ 好的实践：使用 Zod Schema 定义数据结构
import { z } from 'zod'
import { defineEntity, primary, unique, createdAt, updatedAt } from '@linch-kit/schema'

export const UserEntity = defineEntity('User', {
  /** 用户唯一标识符 */
  id: primary(z.string().uuid()),
  
  /** 用户姓名，2-50个字符 */
  name: z.string().min(2).max(50),
  
  /** 用户邮箱，必须唯一 */
  email: unique(z.string().email()),
  
  /** 用户角色 */
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  
  /** 用户头像URL */
  avatar: z.string().url().optional(),
  
  /** 是否激活 */
  isActive: z.boolean().default(true),
  
  /** 创建时间 */
  createdAt: createdAt(),
  
  /** 更新时间 */
  updatedAt: updatedAt()
})

// 自动生成的类型
export type User = z.infer<typeof UserEntity.schema>
export type UserCreateInput = z.infer<typeof UserEntity.createSchema>
export type UserUpdateInput = z.infer<typeof UserEntity.updateSchema>
```

## 🔧 配置文件最佳实践

### 1. 结构化配置

```typescript
// linch-kit.config.ts
import { defineConfig } from '@linch-kit/core'

export default defineConfig({
  /** 项目基本信息 */
  project: {
    name: 'my-enterprise-app',
    version: '1.0.0',
    description: '企业级管理系统'
  },

  /** 数据库配置 */
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
    migrations: {
      directory: './prisma/migrations'
    }
  },

  /** 认证配置 */
  auth: {
    providers: ['credentials', 'google', 'github'],
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    }
  },

  /** Schema 配置 */
  schema: {
    /** Schema 文件目录 */
    schemaDir: './app/_lib/schemas',
    /** 输出目录 */
    outputDir: './generated',
    /** 生成选项 */
    generate: {
      prisma: true,
      validators: true,
      mocks: true,
      openapi: true
    }
  },

  /** 插件配置 */
  plugins: {
    '@linch-kit/plugin-audit': {
      enabled: true,
      config: {
        trackAllChanges: true,
        retentionDays: 365
      }
    }
  }
})
```

### 2. 环境变量管理

```bash
# .env.example
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# 认证配置
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# 第三方服务
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 应用配置
APP_NAME="My Enterprise App"
APP_VERSION="1.0.0"
```

## 📚 文档编写最佳实践

### 1. README 文件结构

```markdown
# 项目名称

简短的项目描述，说明项目的主要功能和价值。

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### 安装步骤
1. 克隆项目
2. 安装依赖
3. 配置环境变量
4. 运行项目

### 基本使用
提供最简单的使用示例

## 📖 详细文档
- [API 文档](./docs/api.md)
- [配置指南](./docs/configuration.md)
- [部署指南](./docs/deployment.md)

## 🤝 贡献指南
- [开发指南](./docs/development.md)
- [代码规范](./docs/coding-standards.md)
```

### 2. API 文档格式

```typescript
/**
 * 用户管理 API
 * 
 * @module UserAPI
 * @description 提供用户的增删改查功能
 */

/**
 * 获取用户列表
 * 
 * @route GET /api/users
 * @param {Object} query 查询参数
 * @param {number} [query.page=1] 页码
 * @param {number} [query.limit=10] 每页数量
 * @param {string} [query.search] 搜索关键词
 * @param {UserRole} [query.role] 用户角色筛选
 * @returns {Promise<PaginatedResponse<User>>} 用户列表
 * 
 * @example
 * ```typescript
 * const users = await fetch('/api/users?page=1&limit=10')
 * ```
 */
export async function getUsers(query: GetUsersQuery): Promise<PaginatedResponse<User>>
```

## 🧪 测试最佳实践

### 1. 测试文件命名

```
src/
├── services/
│   ├── user-service.ts
│   └── user-service.test.ts    # 单元测试
├── api/
│   ├── users.ts
│   └── users.integration.test.ts  # 集成测试
└── __tests__/
    └── user-flow.e2e.test.ts   # E2E 测试
```

### 2. 测试用例结构

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user' as const
      }

      // Act
      const result = await userService.createUser(userData)

      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        name: userData.name,
        email: userData.email,
        role: userData.role
      })
    })

    it('should throw error when email already exists', async () => {
      // Arrange
      const existingUser = await createTestUser()
      const userData = {
        name: 'Jane Doe',
        email: existingUser.email,
        role: 'user' as const
      }

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('邮箱已存在')
    })
  })
})
```

## 🔍 AI 提示词模板

### 1. 代码生成提示词

```
请基于以下 Schema 定义生成完整的 CRUD 操作代码：

Schema: [粘贴 Schema 定义]

要求：
1. 使用 TypeScript
2. 包含完整的类型定义
3. 添加详细的 JSDoc 注释
4. 包含错误处理
5. 遵循 Linch Kit 的代码规范

请生成：
- Service 类
- API 路由
- 验证器
- 测试用例
```

### 2. 问题诊断提示词

```
我在使用 Linch Kit 时遇到了以下问题：

错误信息：[粘贴错误信息]
相关代码：[粘贴相关代码]
环境信息：
- Node.js 版本：
- Linch Kit 版本：
- 操作系统：

请帮我分析问题原因并提供解决方案。
```

---

**相关文档**:
- [开发流程](../workflows/development.md)
- [代码生成模板](./code-generation.md)
- [文档规范](./documentation.md)
