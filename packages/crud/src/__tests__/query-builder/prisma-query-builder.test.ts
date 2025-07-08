import { describe, it, expect, beforeEach, mock } from 'bun:test'
import type { Entity } from '@linch-kit/schema'
import type { PluginManager } from '@linch-kit/core'

import {
  PrismaQueryBuilder,
  QueryBuilderFactory,
} from '../../core/query-builder/prisma-query-builder'
import type { SchemaRegistry, Logger, PerformanceMetrics } from '../../types'

// Mock 依赖
const mockEntity: Entity = {
  name: 'TestEntity',
  fields: {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: false },
    age: { type: 'number', required: false },
    score: { type: 'float', required: false },
    status: { type: 'string', required: false },
    profile: { type: 'relation', required: false },
    posts: { type: 'relation', required: false },
  },
  options: {},
  validate: async () => true,
  validateAndParse: (data: unknown) => data,
  validateCreate: (data: unknown) => data,
  validateUpdate: (data: unknown) => data,
  clone: () => mockEntity,
  extend: () => mockEntity,
  withOptions: () => mockEntity,
}

const mockSchemaRegistry: SchemaRegistry = {
  getEntity: mock(() => mockEntity),
  register: mock(() => {}),
  getAll: mock(() => [mockEntity]),
  clear: mock(() => {}),
  createDynamicZodSchema: mock(() => ({})),
  createPrismaSchema: mock(() => ''),
  createGraphQLSchema: mock(() => ''),
  createJsonSchema: mock(() => ({})),
  createOpenapiSchema: mock(() => ({})),
  createTypescriptDefinition: mock(() => ''),
  createDtoSchema: mock(() => ({})),
  createUiSchema: mock(() => ({})),
  createFormSchema: mock(() => ({})),
  createTableSchema: mock(() => ({})),
  createValidationSchema: mock(() => ({})),
  createRulesSchema: mock(() => ({})),
  createSeederSchema: mock(() => ({})),
}

const mockLogger: Logger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  trace: mock(() => {}),
  fatal: mock(() => {}),
  child: mock(() => mockLogger),
}

const mockPerformanceMetrics: PerformanceMetrics = {
  operation: 'findMany',
  entityName: 'TestEntity',
  duration: 100,
  queryComplexity: 1,
  timestamp: new Date(),
}

const mockExecutorResult = {
  data: [{ id: '1', name: 'test' }],
  metrics: mockPerformanceMetrics,
}

const mockPrisma = {
  testEntity: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    count: mock(() => Promise.resolve(0)),
  },
}

const mockPluginManager: PluginManager = {
  register: mock(() => {}),
  unregister: mock(() => {}),
  get: mock(() => null),
  getAll: mock(() => []),
  clear: mock(() => {}),
  initialize: mock(() => Promise.resolve()),
  shutdown: mock(() => Promise.resolve()),
}

describe('PrismaQueryBuilder', () => {
  let queryBuilder: PrismaQueryBuilder
  let entityName: string
  let prisma: any
  let schemaRegistry: SchemaRegistry
  let logger: Logger
  let pluginManager: PluginManager

  beforeEach(() => {
    entityName = 'TestEntity'
    prisma = mockPrisma
    schemaRegistry = mockSchemaRegistry
    logger = mockLogger
    pluginManager = mockPluginManager
    queryBuilder = new PrismaQueryBuilder(entityName, prisma, schemaRegistry, logger, pluginManager)

    // Mock executor 方法
    queryBuilder.executor = {
      findMany: mock(() => Promise.resolve(mockExecutorResult)),
      findFirst: mock(() => Promise.resolve({ data: null, metrics: mockPerformanceMetrics })),
      exists: mock(() => Promise.resolve({ data: false, metrics: mockPerformanceMetrics })),
      count: mock(() => Promise.resolve({ data: 0, metrics: mockPerformanceMetrics })),
      aggregate: mock(() => Promise.resolve({ data: 0, metrics: mockPerformanceMetrics })),
    } as any

    // Mock buildFinalQuery to bypass validation
    queryBuilder.buildFinalQuery = mock(() => Promise.resolve({}))
  })

  describe('Construction', () => {
    it('should create instance with required parameters', () => {
      expect(queryBuilder).toBeDefined()
      expect(queryBuilder.entityName).toBe(entityName)
    })

    it('should create instance without plugin manager', () => {
      const builderWithoutPlugin = new PrismaQueryBuilder(
        entityName,
        prisma,
        schemaRegistry,
        logger
      )
      expect(builderWithoutPlugin).toBeDefined()
    })

    it('should create static instance', () => {
      const staticBuilder = PrismaQueryBuilder.create(entityName, prisma, schemaRegistry, logger)
      expect(staticBuilder).toBeDefined()
      expect(staticBuilder).toBeInstanceOf(PrismaQueryBuilder)
    })

    it('should create static instance with plugin manager', () => {
      const staticBuilder = PrismaQueryBuilder.create(
        entityName,
        prisma,
        schemaRegistry,
        logger,
        pluginManager
      )
      expect(staticBuilder).toBeDefined()
      expect(staticBuilder).toBeInstanceOf(PrismaQueryBuilder)
    })
  })

  describe('Query Execution', () => {
    it('should execute findMany query', async () => {
      const result = await queryBuilder.execute()
      expect(result).toEqual([{ id: '1', name: 'test' }])
      expect(queryBuilder.executor.findMany).toHaveBeenCalled()
    })

    it('should execute findFirst query', async () => {
      const result = await queryBuilder.first()
      expect(result).toBe(null)
      expect(queryBuilder.executor.findFirst).toHaveBeenCalled()
    })

    it('should execute exists query', async () => {
      const result = await queryBuilder.exists()
      expect(result).toBe(false)
      expect(queryBuilder.executor.exists).toHaveBeenCalled()
    })

    it('should execute count query', async () => {
      const result = await queryBuilder.count()
      expect(result).toBe(0)
      expect(queryBuilder.executor.count).toHaveBeenCalled()
    })

    it('should execute query with chained conditions', async () => {
      queryBuilder.where('name', '=', 'test').limit(10).orderBy('name', 'asc')

      const result = await queryBuilder.execute()
      expect(result).toEqual([{ id: '1', name: 'test' }])
      expect(queryBuilder.executor.findMany).toHaveBeenCalled()
    })
  })

  describe('Aggregation Operations', () => {
    it('should execute sum aggregation', async () => {
      const result = await queryBuilder.sum('age')
      expect(result).toBe(0)
      expect(queryBuilder.executor.aggregate).toHaveBeenCalledWith(expect.any(Object), 'sum', 'age')
    })

    it('should execute avg aggregation', async () => {
      const result = await queryBuilder.avg('score')
      expect(result).toBe(0)
      expect(queryBuilder.executor.aggregate).toHaveBeenCalledWith(
        expect.any(Object),
        'avg',
        'score'
      )
    })

    it('should execute min aggregation', async () => {
      const result = await queryBuilder.min('age')
      expect(result).toBe(0)
      expect(queryBuilder.executor.aggregate).toHaveBeenCalledWith(expect.any(Object), 'min', 'age')
    })

    it('should execute max aggregation', async () => {
      const result = await queryBuilder.max('age')
      expect(result).toBe(0)
      expect(queryBuilder.executor.aggregate).toHaveBeenCalledWith(expect.any(Object), 'max', 'age')
    })

    it('should chain aggregation with conditions', async () => {
      queryBuilder.where('age', '>', 18)
      const result = await queryBuilder.avg('score')
      expect(result).toBe(0)
      expect(queryBuilder.executor.aggregate).toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      // Mock count to return 50
      queryBuilder.executor.count = mock(() =>
        Promise.resolve({ data: 50, metrics: mockPerformanceMetrics })
      )
      // Mock execute to return data
      queryBuilder.execute = mock(() =>
        Promise.resolve([
          { id: '1', name: 'test1' },
          { id: '2', name: 'test2' },
        ])
      )
    })

    it('should execute paginated query with default parameters', async () => {
      const result = await queryBuilder.paginateExecute()
      expect(result.data).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 50,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
      })
    })

    it('should execute paginated query with custom parameters', async () => {
      const result = await queryBuilder.paginateExecute(2, 10)
      expect(result.data).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrevious: true,
      })
    })

    it('should handle last page correctly', async () => {
      const result = await queryBuilder.paginateExecute(3, 20)
      expect(result.pagination).toEqual({
        page: 3,
        pageSize: 20,
        total: 50,
        totalPages: 3,
        hasNext: false,
        hasPrevious: true,
      })
    })

    it('should handle empty result set', async () => {
      queryBuilder.executor.count = mock(() =>
        Promise.resolve({ data: 0, metrics: mockPerformanceMetrics })
      )
      queryBuilder.execute = mock(() => Promise.resolve([]))

      const result = await queryBuilder.paginateExecute()
      expect(result.data).toHaveLength(0)
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      })
    })
  })

  describe('Advanced Relations', () => {
    it('should add simple include relation', () => {
      const result = queryBuilder.includeWith('profile', () => {})
      expect(result).toBe(queryBuilder)

      const query = queryBuilder.build()
      expect(query.include).toBeDefined()
      expect((query.include as any).profile).toBe(true)
    })

    it('should add include with callback', () => {
      const callback = mock((qb: PrismaQueryBuilder) => {
        qb.where('status', '=', 'active')
      })

      queryBuilder.includeWith('posts', callback)
      // 由于 getRelationEntity 返回 null，callback 不会被调用，但 include 会被设置为 true
      expect(callback).not.toHaveBeenCalled()

      const query = queryBuilder.build()
      expect(query.include).toBeDefined()
      expect((query.include as any).posts).toBe(true)
    })

    it('should log warning for non-existent relation', () => {
      queryBuilder.includeWith('nonExistentRelation', () => {})
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Relation entity not found for nonExistentRelation'
      )
    })

    it('should handle multiple includes', () => {
      queryBuilder
        .includeWith('profile', qb => qb.where('active', '=', true))
        .includeWith('posts', qb => qb.limit(5))

      const query = queryBuilder.build()
      expect(query.include).toBeDefined()
      expect((query.include as any).profile).toBeDefined()
      expect((query.include as any).posts).toBeDefined()
    })
  })

  describe('Raw Query Support', () => {
    it('should add raw query', () => {
      const result = queryBuilder.raw('SELECT * FROM users WHERE age > ?', [18])
      expect(result).toBe(queryBuilder)

      const query = queryBuilder.build()
      expect((query as any)._raw).toEqual({
        sql: 'SELECT * FROM users WHERE age > ?',
        params: [18],
      })
    })

    it('should add raw query without parameters', () => {
      queryBuilder.raw('SELECT * FROM users')

      const query = queryBuilder.build()
      expect((query as any)._raw).toEqual({
        sql: 'SELECT * FROM users',
        params: [],
      })
    })

    it('should log warning for raw queries', () => {
      queryBuilder.raw('SELECT * FROM users')
      expect(mockLogger.warn).toHaveBeenCalledWith('Using raw SQL query', {
        sql: 'SELECT * FROM users',
        params: [],
      })
    })
  })

  describe('Query Builder Management', () => {
    it('should clone query builder', () => {
      queryBuilder.where('name', '=', 'test').limit(10).include('profile')

      const cloned = queryBuilder.clone()
      expect(cloned).toBeDefined()
      expect(cloned).not.toBe(queryBuilder)
      expect(cloned).toBeInstanceOf(PrismaQueryBuilder)

      const originalQuery = queryBuilder.build()
      const clonedQuery = cloned.build()
      expect(clonedQuery).toEqual(originalQuery)
    })

    it('should create independent clone', () => {
      queryBuilder.where('name', '=', 'test')

      const cloned = queryBuilder.clone()
      cloned.where('age', '>', 18)

      const originalQuery = queryBuilder.build()
      const clonedQuery = cloned.build()

      expect(originalQuery).not.toEqual(clonedQuery)
    })
  })

  describe('Complex Query Scenarios', () => {
    it('should handle complex query with all features', async () => {
      queryBuilder
        .where('name', 'like', 'test%')
        .whereIn('status', ['active', 'pending'])
        .whereBetween('age', [18, 65])
        .include('profile')
        .includeWith('posts', qb => qb.limit(5).orderBy('createdAt', 'desc'))
        .orderBy('name', 'asc')
        .limit(20)
        .offset(10)

      const result = await queryBuilder.execute()
      expect(result).toEqual([{ id: '1', name: 'test' }])
      expect(queryBuilder.executor.findMany).toHaveBeenCalled()
    })

    it('should handle empty query execution', async () => {
      const result = await queryBuilder.execute()
      expect(result).toEqual([{ id: '1', name: 'test' }])
    })
  })

  describe('Performance Metrics', () => {
    it('should record metrics for all operations', async () => {
      const recordMetricsSpy = mock(() => Promise.resolve())
      queryBuilder.recordMetrics = recordMetricsSpy

      await queryBuilder.execute()
      await queryBuilder.first()
      await queryBuilder.count()
      await queryBuilder.sum('age')

      expect(recordMetricsSpy).toHaveBeenCalledTimes(4)
    })
  })
})

describe('QueryBuilderFactory', () => {
  const entityName = 'TestEntity'
  const prisma = mockPrisma
  const schemaRegistry = mockSchemaRegistry
  const logger = mockLogger
  const pluginManager = mockPluginManager

  describe('Factory Methods', () => {
    it('should create query builder using factory', () => {
      const builder = QueryBuilderFactory.create(entityName, prisma, schemaRegistry, logger)
      expect(builder).toBeDefined()
      expect(builder).toBeInstanceOf(PrismaQueryBuilder)
    })

    it('should create query builder with plugin manager', () => {
      const builder = QueryBuilderFactory.create(
        entityName,
        prisma,
        schemaRegistry,
        logger,
        pluginManager
      )
      expect(builder).toBeDefined()
      expect(builder).toBeInstanceOf(PrismaQueryBuilder)
    })

    it('should create query builder with plugins', () => {
      const builder = QueryBuilderFactory.createWithPlugins(
        entityName,
        prisma,
        schemaRegistry,
        logger,
        pluginManager
      )
      expect(builder).toBeDefined()
      expect(builder).toBeInstanceOf(PrismaQueryBuilder)
    })

    it('should create different instances', () => {
      const builder1 = QueryBuilderFactory.create(entityName, prisma, schemaRegistry, logger)
      const builder2 = QueryBuilderFactory.create(entityName, prisma, schemaRegistry, logger)

      expect(builder1).not.toBe(builder2)
      expect(builder1).toBeInstanceOf(PrismaQueryBuilder)
      expect(builder2).toBeInstanceOf(PrismaQueryBuilder)
    })
  })

  describe('Type Safety', () => {
    interface TestUser {
      id: string
      name: string
      age: number
    }

    it('should support typed query builder', () => {
      const builder = QueryBuilderFactory.create<TestUser>(
        entityName,
        prisma,
        schemaRegistry,
        logger
      )
      expect(builder).toBeDefined()

      // 这些操作应该是类型安全的
      builder.where('name', '=', 'test')
      builder.orderBy('age', 'desc')
      builder.limit(10)
    })

    it('should support typed aggregation operations', async () => {
      const builder = QueryBuilderFactory.create<TestUser>(
        entityName,
        prisma,
        schemaRegistry,
        logger
      )

      // Mock executor for typed builder
      builder.executor = {
        aggregate: mock(() => Promise.resolve({ data: 25, metrics: mockPerformanceMetrics })),
      } as any

      const avgAge = await builder.avg('age')
      expect(avgAge).toBe(25)
    })
  })
})
