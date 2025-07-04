import { describe, it, expect, beforeEach, mock } from 'bun:test'
import type { Entity } from '@linch-kit/schema'
import type { PluginManager } from '@linch-kit/core'

import { BaseQueryBuilder } from '../../core/query-builder/base-query-builder'
import type { SchemaRegistry, Logger } from '../../types'


// Mock 测试用的具体实现类
class TestQueryBuilder extends BaseQueryBuilder<any> {
  async execute(): Promise<any[]> {
    return []
  }

  async first(): Promise<any | null> {
    return null
  }

  async count(): Promise<number> {
    return 0
  }

  async exists(): Promise<boolean> {
    return false
  }

  async sum(field: any): Promise<number> {
    return 0
  }

  async avg(field: any): Promise<number> {
    return 0
  }

  async min(field: any): Promise<number> {
    return 0
  }

  async max(field: any): Promise<number> {
    return 0
  }

  clone(): BaseQueryBuilder<any> {
    return new TestQueryBuilder(
      this.entityName,
      this.prisma,
      this.schemaRegistry,
      this.logger,
      this.pluginManager
    )
  }
}

// Mock 依赖
const mockEntity: Entity = {
  name: 'TestEntity',
  fields: {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: false },
    age: { type: 'number', required: false }
  },
  options: {},
  validate: async () => true,
  validateAndParse: (data: unknown) => data,
  validateCreate: (data: unknown) => data,
  validateUpdate: (data: unknown) => data,
  clone: () => mockEntity,
  extend: () => mockEntity,
  withOptions: () => mockEntity
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
  createSeederSchema: mock(() => ({}))
}

const mockLogger: Logger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  trace: mock(() => {}),
  fatal: mock(() => {}),
  child: mock(() => mockLogger)
}

const mockPrisma = {
  testEntity: {
    findMany: mock(() => []),
    findFirst: mock(() => null),
    count: mock(() => 0)
  }
}

const mockPluginManager: PluginManager = {
  register: mock(() => {}),
  unregister: mock(() => {}),
  get: mock(() => null),
  getAll: mock(() => []),
  clear: mock(() => {}),
  initialize: mock(() => Promise.resolve()),
  shutdown: mock(() => Promise.resolve())
}

describe('BaseQueryBuilder', () => {
  let queryBuilder: TestQueryBuilder
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
    queryBuilder = new TestQueryBuilder(entityName, prisma, schemaRegistry, logger, pluginManager)
  })

  describe('Construction', () => {
    it('should create instance with required parameters', () => {
      expect(queryBuilder).toBeDefined()
      expect(queryBuilder.entityName).toBe(entityName)
    })

    it('should create instance without plugin manager', () => {
      const builderWithoutPlugin = new TestQueryBuilder(entityName, prisma, schemaRegistry, logger)
      expect(builderWithoutPlugin).toBeDefined()
    })

    it('should throw error when entity not found', () => {
      const mockRegistryWithoutEntity: SchemaRegistry = {
        ...mockSchemaRegistry,
        getEntity: mock(() => null)
      }

      expect(() => {
        new TestQueryBuilder(entityName, prisma, mockRegistryWithoutEntity, logger)
      }).toThrow('Entity TestEntity not found')
    })
  })

  describe('Where Conditions', () => {
    it('should add where condition', () => {
      const result = queryBuilder.where('name', '=', 'test')
      expect(result).toBe(queryBuilder) // 链式调用
    })

    it('should add whereIn condition', () => {
      const result = queryBuilder.whereIn('id', ['1', '2', '3'])
      expect(result).toBe(queryBuilder)
    })

    it('should add whereNull condition', () => {
      const result = queryBuilder.whereNull('email')
      expect(result).toBe(queryBuilder)
    })

    it('should add whereNotNull condition', () => {
      const result = queryBuilder.whereNotNull('email')
      expect(result).toBe(queryBuilder)
    })

    it('should add whereBetween condition', () => {
      const result = queryBuilder.whereBetween('age', 18, 65)
      expect(result).toBe(queryBuilder)
    })

    it('should chain multiple where conditions', () => {
      const result = queryBuilder
        .where('name', '=', 'test')
        .whereIn('id', ['1', '2'])
        .whereNull('email')
      expect(result).toBe(queryBuilder)
    })
  })

  describe('Query Building', () => {
    it('should add include relation', () => {
      const result = queryBuilder.include('profile')
      expect(result).toBe(queryBuilder)
      
      const query = queryBuilder.build()
      expect(query.include).toBeDefined()
      expect((query.include as any).profile).toBe(true)
    })

    it('should add multiple includes', () => {
      queryBuilder.include('profile').include('posts')
      
      const query = queryBuilder.build()
      expect(query.include).toBeDefined()
      expect((query.include as any).profile).toBe(true)
      expect((query.include as any).posts).toBe(true)
    })

    it('should add orderBy', () => {
      const result = queryBuilder.orderBy('name', 'asc')
      expect(result).toBe(queryBuilder)
      
      const query = queryBuilder.build()
      expect(query.orderBy).toBeDefined()
      expect(Array.isArray(query.orderBy)).toBe(true)
      expect((query.orderBy as any)[0]).toEqual({ name: 'asc' })
    })

    it('should add multiple orderBy', () => {
      queryBuilder.orderBy('name', 'asc').orderBy('age', 'desc')
      
      const query = queryBuilder.build()
      expect(query.orderBy).toBeDefined()
      expect((query.orderBy as any).length).toBe(2)
      expect((query.orderBy as any)[0]).toEqual({ name: 'asc' })
      expect((query.orderBy as any)[1]).toEqual({ age: 'desc' })
    })

    it('should add limit', () => {
      const result = queryBuilder.limit(10)
      expect(result).toBe(queryBuilder)
      
      const query = queryBuilder.build()
      expect(query.take).toBe(10)
    })

    it('should add offset', () => {
      const result = queryBuilder.offset(5)
      expect(result).toBe(queryBuilder)
      
      const query = queryBuilder.build()
      expect(query.skip).toBe(5)
    })

    it('should add pagination', () => {
      const result = queryBuilder.paginate(2, 10)
      expect(result).toBe(queryBuilder)
      
      const query = queryBuilder.build()
      expect(query.skip).toBe(10) // (2-1) * 10
      expect(query.take).toBe(10)
    })

    it('should add distinct', () => {
      const result = queryBuilder.distinct(['name', 'email'])
      expect(result).toBe(queryBuilder)
      
      const query = queryBuilder.build()
      expect(query.distinct).toEqual(['name', 'email'])
    })
  })

  describe('Error Handling', () => {
    it('should throw error for negative limit', () => {
      expect(() => {
        queryBuilder.limit(-1)
      }).toThrow('Limit must be non-negative')
    })

    it('should throw error for negative offset', () => {
      expect(() => {
        queryBuilder.offset(-1)
      }).toThrow('Offset must be non-negative')
    })

    it('should throw error for invalid page in pagination', () => {
      expect(() => {
        queryBuilder.paginate(0, 10)
      }).toThrow('Page must be >= 1')
    })

    it('should throw error for invalid page size in pagination', () => {
      expect(() => {
        queryBuilder.paginate(1, 0)
      }).toThrow('Page size must be >= 1')
    })
  })

  describe('Query Management', () => {
    it('should build query object', () => {
      queryBuilder
        .where('name', '=', 'test')
        .limit(10)
        .offset(5)
        .orderBy('name', 'asc')
        .include('profile')
      
      const query = queryBuilder.build()
      expect(query).toBeDefined()
      expect(query.take).toBe(10)
      expect(query.skip).toBe(5)
      expect(query.orderBy).toBeDefined()
      expect(query.include).toBeDefined()
    })

    it('should reset query', () => {
      queryBuilder
        .where('name', '=', 'test')
        .limit(10)
        .include('profile')
      
      let query = queryBuilder.build()
      expect(Object.keys(query).length).toBeGreaterThan(0)
      
      const result = queryBuilder.reset()
      expect(result).toBe(queryBuilder)
      
      query = queryBuilder.build()
      expect(Object.keys(query).length).toBe(0)
    })

    it('should clone query builder', () => {
      const cloned = queryBuilder.clone()
      expect(cloned).toBeDefined()
      expect(cloned).not.toBe(queryBuilder)
      expect(cloned.constructor).toBe(queryBuilder.constructor)
    })
  })

  describe('Complex Query Building', () => {
    it('should build complex query with all features', () => {
      queryBuilder
        .where('name', 'like', '%test%')
        .whereIn('status', ['active', 'pending'])
        .whereNull('deletedAt')
        .whereBetween('age', 18, 65)
        .include('profile')
        .include('posts')
        .orderBy('createdAt', 'desc')
        .orderBy('name', 'asc')
        .distinct(['name', 'email'])
        .limit(20)
        .offset(10)
      
      const query = queryBuilder.build()
      expect(query).toBeDefined()
      expect(query.take).toBe(20)
      expect(query.skip).toBe(10)
      expect(query.distinct).toEqual(['name', 'email'])
      expect(query.orderBy).toBeDefined()
      expect(query.include).toBeDefined()
    })

    it('should handle empty query', () => {
      const query = queryBuilder.build()
      expect(query).toEqual({})
    })
  })

  describe('Abstract Methods', () => {
    it('should implement execute method', async () => {
      const result = await queryBuilder.execute()
      expect(result).toEqual([])
    })

    it('should implement first method', async () => {
      const result = await queryBuilder.first()
      expect(result).toBe(null)
    })

    it('should implement count method', async () => {
      const result = await queryBuilder.count()
      expect(result).toBe(0)
    })

    it('should implement exists method', async () => {
      const result = await queryBuilder.exists()
      expect(result).toBe(false)
    })

    it('should implement aggregation methods', async () => {
      expect(await queryBuilder.sum('age')).toBe(0)
      expect(await queryBuilder.avg('age')).toBe(0)
      expect(await queryBuilder.min('age')).toBe(0)
      expect(await queryBuilder.max('age')).toBe(0)
    })
  })
})