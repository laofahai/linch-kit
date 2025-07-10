/**
 * Platform package integration tests
 */

import { describe, it, expect } from 'bun:test'

describe('Platform Package', () => {
  it('should export all main modules', async () => {
    const platform = await import('../index')

    // 检查主要导出
    expect(platform).toBeDefined()
    expect(typeof platform).toBe('object')
  })

  it('should export CRUD functionality', async () => {
    const { CrudManager, QueryBuilder, PermissionChecker, ValidationManager, CacheManager } =
      await import('../crud')

    expect(CrudManager).toBeDefined()
    expect(QueryBuilder).toBeDefined()
    expect(PermissionChecker).toBeDefined()
    expect(ValidationManager).toBeDefined()
    expect(CacheManager).toBeDefined()
  })

  it('should export Schema functionality', async () => {
    const { Entity, defineEntity, Field, CommonFields, Validator } = await import('../schema')

    expect(Entity).toBeDefined()
    expect(defineEntity).toBeDefined()
    expect(Field).toBeDefined()
    expect(CommonFields).toBeDefined()
    expect(Validator).toBeDefined()
  })

  it('should export tRPC functionality', async () => {
    const trpc = await import('../trpc')

    expect(trpc).toBeDefined()
    expect(trpc.TRPCClientFactory).toBeDefined()
    expect(trpc.MiddlewareManager).toBeDefined()
  })

  it('should export Validation functionality', async () => {
    const { RuntimeValidator, extensionConfigSchema, extensionPermissionSchema } = await import(
      '../validation'
    )

    expect(RuntimeValidator).toBeDefined()
    expect(extensionConfigSchema).toBeDefined()
    expect(extensionPermissionSchema).toBeDefined()
  })
})

describe('CRUD Manager', () => {
  it('should create and manage entities', async () => {
    const { CrudManager } = await import('../crud')

    const crudManager = new CrudManager()

    // 注册一个实体
    crudManager.registerEntity('User', { id: 'string', name: 'string' })

    expect(crudManager.hasEntity('User')).toBe(true)
    expect(crudManager.getRegisteredEntities()).toContain('User')
  })
})

describe('Query Builder', () => {
  it('should build queries correctly', async () => {
    const { QueryBuilder } = await import('../crud')

    const qb = new QueryBuilder('User')

    const query = qb.whereEqual('status', 'active').limit(10).orderBy('createdAt', 'desc').build()

    expect(query.conditions).toHaveLength(1)
    expect(query.conditions[0]).toEqual({
      field: 'status',
      operator: 'eq',
      value: 'active',
    })
    expect(query.options.limit).toBe(10)
    expect(query.options.orderBy).toEqual([{ field: 'createdAt', direction: 'desc' }])
  })
})

describe('Entity System', () => {
  it('should create and validate entities', async () => {
    const { Entity, defineEntity, Field } = await import('../schema')

    const UserEntity = defineEntity('User', {
      fields: {
        id: {
          name: 'id',
          type: 'uuid',
          options: { validation: { required: true } },
          zodSchema: {} as any, // 简化测试
        },
        name: {
          name: 'name',
          type: 'string',
          options: { validation: { required: true, min: 1, max: 100 } },
          zodSchema: {} as any,
        },
        email: {
          name: 'email',
          type: 'email',
          options: { validation: { required: true } },
          zodSchema: {} as any,
        },
      },
    })

    expect(UserEntity.name).toBe('User')
    expect(UserEntity.getFields()).toContain('id')
    expect(UserEntity.getFields()).toContain('name')
    expect(UserEntity.getFields()).toContain('email')
  })
})

describe('Field Builder', () => {
  it('should build field definitions correctly', async () => {
    const { Field } = await import('../schema')

    const emailField = Field.email('email')
      .label('Email Address')
      .description('User email address')
      .required()
      .build()

    expect(emailField.name).toBe('email')
    expect(emailField.type).toBe('email')
    expect(emailField.options.label).toBe('Email Address')
    expect(emailField.options.description).toBe('User email address')
    expect(emailField.options.validation?.required).toBe(true)
  })
})

describe('Permission Checker', () => {
  it('should check permissions correctly', async () => {
    const { PermissionChecker } = await import('../crud')

    const checker = new PermissionChecker()

    // 测试管理员权限
    const adminResult = await checker.check({
      user: { id: 'admin', role: 'admin', permissions: ['*'] },
      action: 'delete',
      resource: 'user',
    })

    expect(adminResult.allowed).toBe(true)

    // 测试普通用户权限
    const userResult = await checker.check({
      user: { id: 'user', role: 'user', permissions: ['read'] },
      action: 'delete',
      resource: 'user',
    })

    expect(userResult.allowed).toBe(false)
  })
})

describe('Validation Manager', () => {
  it('should validate data correctly', async () => {
    const { ValidationManager } = await import('../crud')

    const validator = new ValidationManager()

    // 添加验证规则（使用函数形式避免Zod相关问题）
    validator.addRule('User', {
      field: 'email',
      validator: value => typeof value === 'string' && value.includes('@'),
      message: 'Invalid email format',
    })

    // 测试有效数据
    const validResult = await validator.validate('User', { email: 'test@example.com' })
    expect(validResult.valid).toBe(true)

    // 测试无效数据
    const invalidResult = await validator.validate('User', { email: 'invalid-email' })
    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.errors).toHaveLength(1)
  })
})

describe('Cache Manager', () => {
  it('should cache and retrieve data correctly', async () => {
    const { CacheManager } = await import('../crud')

    const cache = new CacheManager()

    // 设置缓存
    await cache.set('test-key', 'test-value', { ttl: 60 })

    // 获取缓存
    const value = await cache.get('test-key')
    expect(value).toBe('test-value')

    // 检查存在性
    const exists = await cache.has('test-key')
    expect(exists).toBe(true)

    // 删除缓存
    const deleted = await cache.delete('test-key')
    expect(deleted).toBe(true)

    // 验证删除
    const valueAfterDelete = await cache.get('test-key')
    expect(valueAfterDelete).toBe(null)
  })
})

describe('tRPC Client Factory', () => {
  it('should create tRPC clients', async () => {
    const { TRPCClientFactory } = await import('../trpc')

    const factory = new TRPCClientFactory({
      url: 'http://localhost:3000/api/trpc',
    })

    const client = factory.createClient()
    expect(client).toBeDefined()

    const batchClient = factory.createBatchClient()
    expect(batchClient).toBeDefined()
  })
})

describe('Middleware Manager', () => {
  it('should manage middleware correctly', async () => {
    const { MiddlewareManager } = await import('../trpc')

    const manager = new MiddlewareManager()

    // 添加中间件
    const testMiddleware = async (context: any, next: () => Promise<unknown>) => {
      context.metadata.middleware = 'executed'
      return next()
    }

    manager.use(testMiddleware)
    expect(manager.count()).toBe(1)

    // 执行中间件
    const context = { metadata: {} }
    const result = await manager.execute(context as any, async () => 'test-result')

    expect(result.success).toBe(true)
    expect(result.data).toBe('test-result')
    expect(context.metadata.middleware).toBe('executed')
  })
})

describe('Runtime Validator', () => {
  it('should validate extension configurations', async () => {
    const { RuntimeValidator } = await import('../validation')

    const validator = new RuntimeValidator()

    // 测试有效配置
    const validConfig = { enabled: true, priority: 50, debug: false }
    const isValid = validator.validateConfig(validConfig)
    expect(isValid).toBe(true)

    // 测试无效配置
    const invalidConfig = { enabled: 'yes', priority: 150 }
    const isInvalid = validator.validateConfig(invalidConfig)
    expect(isInvalid).toBe(false)
  })
})
