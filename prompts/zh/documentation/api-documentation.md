# Linch Kit API 文档生成提示词

## 目的

指导 AI 助手为 Linch Kit 项目生成高质量的 API 文档，确保文档的完整性、准确性和用户友好性。

## 上下文

**参考文档**:
- `ai-context/zh/packages/` - 各包的详细文档
- `ai-context/zh/templates/ai-first-practices.md`
- `ai-context/zh/workflows/development.md`

Linch Kit 采用 Schema 驱动的开发模式，API 文档应该基于 Schema 定义和实际代码自动生成。

## API 文档生成原则

### 1. Schema 驱动的文档生成

```typescript
// 基于 Schema 定义生成 API 文档
export const User = defineEntity('User', {
  /** 用户唯一标识符 */
  id: primary(z.string().uuid()),
  
  /** 用户邮箱，必须唯一 */
  email: unique(z.string().email()),
  
  /** 用户姓名，2-50个字符 */
  name: z.string().min(2).max(50),
  
  /** 用户角色 */
  role: z.enum(['admin', 'user', 'guest']).default('user')
})

// 自动生成的 API 文档应包含：
// - 数据模型定义
// - 验证规则
// - 示例数据
// - 错误响应
```

### 2. tRPC 路由文档

```typescript
// 基于 tRPC 路由生成 API 文档
export const userRouter = router({
  /**
   * 创建新用户
   * 
   * @summary 创建用户
   * @description 创建一个新用户，包含邮箱验证和权限检查
   * @tags User Management
   * 
   * @param input 用户创建输入数据
   * @returns 创建成功的用户对象
   * 
   * @throws {ValidationError} 当输入数据不符合要求时
   * @throws {DuplicateEmailError} 当邮箱已存在时
   * @throws {PermissionError} 当用户没有创建权限时
   * 
   * @example
   * ```typescript
   * const user = await trpc.user.create.mutate({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   role: 'user'
   * })
   * ```
   */
  create: protectedProcedure
    .input(User.createSchema)
    .output(User.responseSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.userService.create(input)
    })
})
```

## 文档结构模板

### 1. API 概览文档

```markdown
# Linch Kit API 文档

## 概述

Linch Kit 提供基于 tRPC 的类型安全 API，支持完整的 CRUD 操作和权限管理。

## 认证

所有 API 请求都需要有效的认证令牌。

### 获取访问令牌

```typescript
const session = await signIn('credentials', {
  email: 'user@example.com',
  password: 'password'
})
```

## 基础 URL

- 开发环境: `http://localhost:3000/api/trpc`
- 生产环境: `https://your-domain.com/api/trpc`

## 错误处理

所有 API 错误都遵循统一的错误格式：

```typescript
interface APIError {
  code: string
  message: string
  details?: any
}
```

## 分页

列表 API 支持分页参数：

```typescript
interface PaginationInput {
  page?: number      // 页码，从 1 开始
  limit?: number     // 每页数量，默认 10
  search?: string    // 搜索关键词
  sort?: string      // 排序字段
  order?: 'asc' | 'desc'  // 排序方向
}
```
```

### 2. 实体 API 文档模板

```markdown
# User API

## 数据模型

```typescript
interface User {
  id: string          // 用户唯一标识符
  email: string       // 用户邮箱，必须唯一
  name: string        // 用户姓名，2-50个字符
  role: 'admin' | 'user' | 'guest'  // 用户角色
  isActive: boolean   // 是否激活
  createdAt: Date     // 创建时间
  updatedAt: Date     // 更新时间
}
```

## API 端点

### 创建用户

**端点**: `user.create`  
**方法**: Mutation  
**权限**: `user.create`

**输入参数**:
```typescript
interface UserCreateInput {
  name: string        // 必填，2-50个字符
  email: string       // 必填，有效邮箱格式
  role?: 'admin' | 'user' | 'guest'  // 可选，默认 'user'
}
```

**返回数据**:
```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

**示例请求**:
```typescript
const user = await trpc.user.create.mutate({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
})
```

**可能的错误**:
- `VALIDATION_ERROR`: 输入数据验证失败
- `DUPLICATE_EMAIL`: 邮箱已存在
- `PERMISSION_DENIED`: 权限不足
```

### 3. CLI API 文档模板

```markdown
# CLI 命令参考

## 概述

Linch Kit CLI 提供了完整的项目管理和开发工具。

## 全局选项

- `--help, -h`: 显示帮助信息
- `--version, -v`: 显示版本信息
- `--config, -c`: 指定配置文件路径

## Schema 命令

### linch schema-list

列出所有已定义的实体。

**语法**:
```bash
linch schema-list [options]
```

**选项**:
- `--format <format>`: 输出格式 (table|json|yaml)
- `--filter <pattern>`: 过滤实体名称

**示例**:
```bash
# 列出所有实体
linch schema-list

# 以 JSON 格式输出
linch schema-list --format json

# 过滤用户相关实体
linch schema-list --filter "User*"
```

### linch schema-generate-prisma

生成 Prisma Schema 文件。

**语法**:
```bash
linch schema-generate-prisma [options]
```

**选项**:
- `--output <path>`: 输出文件路径
- `--watch`: 监听文件变化

**示例**:
```bash
# 生成 Prisma Schema
linch schema-generate-prisma

# 指定输出路径
linch schema-generate-prisma --output ./custom/schema.prisma

# 监听模式
linch schema-generate-prisma --watch
```
```

## 文档生成工具

### 1. 自动化文档生成

```typescript
// 文档生成脚本
export async function generateAPIDocs() {
  const entities = await loadEntities()
  const routes = await loadTRPCRoutes()
  
  // 生成实体文档
  for (const entity of entities) {
    const entityDoc = generateEntityDoc(entity)
    await writeFile(`docs/api/${entity.name.toLowerCase()}.md`, entityDoc)
  }
  
  // 生成路由文档
  const routeDoc = generateRouteDoc(routes)
  await writeFile('docs/api/routes.md', routeDoc)
  
  // 生成 OpenAPI 规范
  const openAPISpec = generateOpenAPISpec(entities, routes)
  await writeFile('docs/api/openapi.json', JSON.stringify(openAPISpec, null, 2))
}
```

### 2. 文档验证

```typescript
// 文档验证脚本
export async function validateAPIDocs() {
  const docs = await loadAPIDocs()
  const actualAPI = await loadActualAPI()
  
  // 验证文档与实际 API 的一致性
  const inconsistencies = compareAPIWithDocs(actualAPI, docs)
  
  if (inconsistencies.length > 0) {
    console.error('API 文档与实际 API 不一致:')
    inconsistencies.forEach(issue => console.error(`- ${issue}`))
    process.exit(1)
  }
  
  console.log('API 文档验证通过')
}
```

## 最佳实践

### 1. 文档编写原则

- **准确性**: 确保文档与实际 API 保持一致
- **完整性**: 包含所有必要的信息和示例
- **清晰性**: 使用清晰的语言和结构
- **实用性**: 提供实际可用的示例代码

### 2. 维护策略

- **自动生成**: 尽可能使用自动化工具生成文档
- **版本控制**: 文档与代码一起进行版本控制
- **定期审查**: 定期审查和更新文档内容
- **用户反馈**: 收集用户反馈并持续改进

### 3. 质量检查

- [ ] 所有 API 端点都有文档
- [ ] 所有参数都有类型和描述
- [ ] 所有错误情况都有说明
- [ ] 所有示例代码都可以运行
- [ ] 文档格式统一规范

---

**使用说明**:
1. 基于 Schema 定义生成基础文档
2. 添加详细的描述和示例
3. 验证文档与实际 API 的一致性
4. 定期更新和维护文档

**相关文档**:
- [AI-First 最佳实践](../../ai-context/zh/templates/ai-first-practices.md)
- [开发流程](../../ai-context/zh/workflows/development.md)
- [Schema 包文档](../../ai-context/zh/packages/schema.md)
