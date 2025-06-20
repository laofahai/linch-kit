# 代码生成模板库

## 概述

本文档包含 Linch Kit 项目中使用的各种代码生成模板，基于 Schema 驱动的开发模式。

## 实体 Service 模板

### 基础 Service 类模板

```typescript
/**
 * {EntityName} 服务类
 * 
 * @description 提供 {EntityName} 的增删改查功能，包含权限验证和数据验证
 * @example
 * ```typescript
 * const {entityName}Service = new {EntityName}Service()
 * const {entityName} = await {entityName}Service.create({
 *   // 创建数据
 * })
 * ```
 */
export class {EntityName}Service {
  constructor(
    private readonly db: PrismaClient,
    private readonly authService: AuthService
  ) {}

  /**
   * 创建 {EntityName}
   * 
   * @param input {EntityName} 创建输入数据
   * @returns 创建成功的 {EntityName} 对象
   * @throws {ValidationError} 当输入数据不符合要求时
   * @throws {PermissionError} 当用户没有权限时
   */
  async create(input: {EntityName}CreateInput): Promise<{EntityName}> {
    // 1. 验证输入数据
    const validatedInput = {EntityName}.createSchema.parse(input)
    
    // 2. 权限检查
    await this.authService.requirePermission('{entity}.create')
    
    // 3. 业务逻辑验证
    await this.validateBusinessRules(validatedInput)
    
    // 4. 数据库操作
    const result = await this.db.{entityName}.create({
      data: validatedInput
    })
    
    // 5. 返回结果
    return {EntityName}.responseSchema.parse(result)
  }

  /**
   * 更新 {EntityName}
   */
  async update(id: string, input: {EntityName}UpdateInput): Promise<{EntityName}> {
    const validatedInput = {EntityName}.updateSchema.parse(input)
    
    await this.authService.requirePermission('{entity}.update')
    
    // 检查记录是否存在
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('{EntityName} not found')
    }
    
    const result = await this.db.{entityName}.update({
      where: { id },
      data: validatedInput
    })
    
    return {EntityName}.responseSchema.parse(result)
  }

  /**
   * 查询多个 {EntityName}
   */
  async findMany(query: {EntityName}QueryInput): Promise<PaginatedResponse<{EntityName}>> {
    const validatedQuery = {EntityName}.querySchema.parse(query)
    
    await this.authService.requirePermission('{entity}.read')
    
    const { page = 1, limit = 10, search, sort, order } = validatedQuery
    const skip = (page - 1) * limit
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        // 其他搜索字段
      ]
    } : {}
    
    const [data, total] = await Promise.all([
      this.db.{entityName}.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort ? { [sort]: order || 'asc' } : { createdAt: 'desc' }
      }),
      this.db.{entityName}.count({ where })
    ])
    
    return {
      data: data.map(item => {EntityName}.responseSchema.parse(item)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * 根据 ID 查询 {EntityName}
   */
  async findById(id: string): Promise<{EntityName} | null> {
    await this.authService.requirePermission('{entity}.read')
    
    const result = await this.db.{entityName}.findUnique({
      where: { id }
    })
    
    return result ? {EntityName}.responseSchema.parse(result) : null
  }

  /**
   * 删除 {EntityName}
   */
  async delete(id: string): Promise<void> {
    await this.authService.requirePermission('{entity}.delete')
    
    const existing = await this.findById(id)
    if (!existing) {
      throw new NotFoundError('{EntityName} not found')
    }
    
    await this.db.{entityName}.delete({
      where: { id }
    })
  }

  /**
   * 业务规则验证
   */
  private async validateBusinessRules(input: {EntityName}CreateInput): Promise<void> {
    // 实现具体的业务规则验证
    // 例如：检查唯一性约束、关联关系等
  }
}
```

## tRPC 路由模板

### 基础路由模板

```typescript
/**
 * {EntityName} tRPC 路由
 */
export const {entityName}Router = router({
  /**
   * 创建 {EntityName}
   */
  create: protectedProcedure
    .input({EntityName}.createSchema)
    .output({EntityName}.responseSchema)
    .meta({
      description: '创建新的 {EntityName}',
      tags: ['{EntityName} Management']
    })
    .mutation(async ({ input, ctx }) => {
      return await ctx.{entityName}Service.create(input)
    }),

  /**
   * 更新 {EntityName}
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: {EntityName}.updateSchema
    }))
    .output({EntityName}.responseSchema)
    .meta({
      description: '更新 {EntityName}',
      tags: ['{EntityName} Management']
    })
    .mutation(async ({ input, ctx }) => {
      return await ctx.{entityName}Service.update(input.id, input.data)
    }),

  /**
   * 查询多个 {EntityName}
   */
  findMany: protectedProcedure
    .input({EntityName}.querySchema)
    .output(z.object({
      data: z.array({EntityName}.responseSchema),
      pagination: PaginationSchema
    }))
    .meta({
      description: '查询 {EntityName} 列表',
      tags: ['{EntityName} Management']
    })
    .query(async ({ input, ctx }) => {
      return await ctx.{entityName}Service.findMany(input)
    }),

  /**
   * 根据 ID 查询 {EntityName}
   */
  findById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output({EntityName}.responseSchema.nullable())
    .meta({
      description: '根据 ID 查询 {EntityName}',
      tags: ['{EntityName} Management']
    })
    .query(async ({ input, ctx }) => {
      return await ctx.{entityName}Service.findById(input.id)
    }),

  /**
   * 删除 {EntityName}
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.void())
    .meta({
      description: '删除 {EntityName}',
      tags: ['{EntityName} Management']
    })
    .mutation(async ({ input, ctx }) => {
      return await ctx.{entityName}Service.delete(input.id)
    })
})
```

## React Hook 模板

### 基础 Hook 模板

```typescript
/**
 * {EntityName} React Hook
 */
export function use{EntityName}() {
  const utils = api.useUtils()

  const create = api.{entityName}.create.useMutation({
    onSuccess: () => {
      utils.{entityName}.findMany.invalidate()
      toast.success('{EntityName} 创建成功')
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`)
    }
  })

  const update = api.{entityName}.update.useMutation({
    onSuccess: () => {
      utils.{entityName}.findMany.invalidate()
      utils.{entityName}.findById.invalidate()
      toast.success('{EntityName} 更新成功')
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`)
    }
  })

  const deleteItem = api.{entityName}.delete.useMutation({
    onSuccess: () => {
      utils.{entityName}.findMany.invalidate()
      toast.success('{EntityName} 删除成功')
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`)
    }
  })

  return {
    create,
    update,
    delete: deleteItem,
    // 查询 hooks 通过 api.{entityName}.findMany.useQuery() 等直接使用
  }
}
```

## CLI 命令模板

### 基础命令模板

```typescript
/**
 * {CommandName} CLI 命令
 */
export const {commandName}Command = defineCommand({
  name: '{command-name}',
  description: '{命令描述}',
  options: {
    output: {
      type: 'string',
      description: '输出目录',
      default: './generated'
    },
    watch: {
      type: 'boolean',
      description: '监听文件变化'
    },
    format: {
      type: 'string',
      choices: ['json', 'yaml', 'table'],
      description: '输出格式',
      default: 'table'
    }
  },
  examples: [
    'linch {command-name}',
    'linch {command-name} --output ./custom-dir',
    'linch {command-name} --watch --format json'
  ],
  async handler(options, context) {
    try {
      // 1. 验证选项
      const config = await context.loadConfig()
      const outputDir = path.resolve(options.output)
      
      // 2. 执行命令逻辑
      context.logger.info(`开始执行 {command-name}...`)
      
      // 具体实现逻辑
      const result = await executeCommand(options, config)
      
      // 3. 输出结果
      if (options.format === 'json') {
        console.log(JSON.stringify(result, null, 2))
      } else if (options.format === 'yaml') {
        console.log(yaml.dump(result))
      } else {
        // 表格格式输出
        console.table(result)
      }
      
      context.logger.success(`{command-name} 执行完成`)
      
    } catch (error) {
      // 4. 错误处理
      context.logger.error(`{command-name} 执行失败: ${error.message}`)
      process.exit(1)
    }
  }
})

async function executeCommand(options: any, config: any) {
  // 实现具体的命令逻辑
  return {}
}
```

## 测试模板

### Service 单元测试模板

```typescript
describe('{EntityName}Service', () => {
  let service: {EntityName}Service
  let mockDb: jest.Mocked<PrismaClient>
  let mockAuth: jest.Mocked<AuthService>

  beforeEach(() => {
    mockDb = createMockPrismaClient()
    mockAuth = createMockAuthService()
    service = new {EntityName}Service(mockDb, mockAuth)
  })

  describe('create', () => {
    it('should create {entityName} with valid data', async () => {
      // Arrange
      const input: {EntityName}CreateInput = {
        // 测试数据
      }
      const expected: {EntityName} = {
        id: 'test-id',
        ...input,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      mockAuth.requirePermission.mockResolvedValue(undefined)
      mockDb.{entityName}.create.mockResolvedValue(expected)

      // Act
      const result = await service.create(input)

      // Assert
      expect(result).toEqual(expected)
      expect(mockAuth.requirePermission).toHaveBeenCalledWith('{entity}.create')
      expect(mockDb.{entityName}.create).toHaveBeenCalledWith({
        data: input
      })
    })

    it('should throw error when permission denied', async () => {
      const input: {EntityName}CreateInput = { /* 测试数据 */ }
      
      mockAuth.requirePermission.mockRejectedValue(
        new Error('Permission denied')
      )

      await expect(service.create(input))
        .rejects.toThrow('Permission denied')
    })

    it('should throw error when validation fails', async () => {
      const invalidInput = { /* 无效数据 */ }
      
      await expect(service.create(invalidInput as any))
        .rejects.toThrow('Validation failed')
    })
  })

  // 其他测试用例...
})
```

## 使用说明

### 1. 模板变量替换

使用这些模板时，需要替换以下变量：
- `{EntityName}`: 实体名称（首字母大写）
- `{entityName}`: 实体名称（首字母小写）
- `{entity}`: 实体名称（全小写，用于权限）
- `{CommandName}`: 命令名称（首字母大写）
- `{commandName}`: 命令名称（首字母小写）
- `{command-name}`: 命令名称（短横线分隔）

### 2. 自动化生成

可以通过 CLI 命令自动生成这些代码：

```bash
# 生成完整的 CRUD 代码
linch generate entity User

# 生成特定类型的代码
linch generate service User
linch generate router User
linch generate hook User
```

### 3. 自定义模板

可以在项目中创建自定义模板：

```
templates/
├── service.ts.hbs
├── router.ts.hbs
├── hook.ts.hbs
└── test.ts.hbs
```

---

**维护说明**:
- 模板应该与项目的最新架构保持同步
- 新增功能时应该更新相应的模板
- 定期审查模板的实用性和准确性
