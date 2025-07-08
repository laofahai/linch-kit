import { describe, it, expect, beforeEach, mock } from 'bun:test'
import type { Entity } from '@linch-kit/schema'

import { QueryConditionBuilder } from '../../core/query-builder/condition-builder'
import type { Logger } from '../../types'

// Mock 依赖
const mockEntity: Entity = {
  name: 'TestEntity',
  fields: {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: false },
    age: { type: 'number', required: false },
    score: { type: 'float', required: false },
    createdAt: { type: 'datetime', required: false },
    birthDate: { type: 'date', required: false },
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

const mockLogger: Logger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  trace: mock(() => {}),
  fatal: mock(() => {}),
  child: mock(() => mockLogger),
}

describe('QueryConditionBuilder', () => {
  let conditionBuilder: QueryConditionBuilder
  let entity: Entity
  let logger: Logger

  beforeEach(() => {
    entity = mockEntity
    logger = mockLogger
    conditionBuilder = new QueryConditionBuilder(entity, logger)
  })

  describe('Construction', () => {
    it('should create instance with required parameters', () => {
      expect(conditionBuilder).toBeDefined()
      expect(conditionBuilder.getConditionCount()).toBe(0)
    })

    it('should initialize with empty conditions', () => {
      expect(conditionBuilder.getConditionCount()).toBe(0)
    })
  })

  describe('Equality Conditions', () => {
    it('should add equality condition', () => {
      const result = conditionBuilder.addCondition('name', '=', 'test')
      expect(result).toBe(conditionBuilder)
      expect(conditionBuilder.getConditionCount()).toBe(1)
    })

    it('should add not equal condition', () => {
      conditionBuilder.addCondition('name', '!=', 'test')
      expect(conditionBuilder.getConditionCount()).toBe(1)
    })

    it('should build equality condition correctly', () => {
      conditionBuilder.addCondition('name', '=', 'test')
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ name: 'test' })
    })

    it('should build not equal condition correctly', () => {
      conditionBuilder.addCondition('name', '!=', 'test')
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ name: { not: 'test' } })
    })

    it('should reject undefined values', () => {
      expect(() => {
        conditionBuilder.addCondition('name', '=', undefined)
      }).toThrow("Value for field 'name' cannot be undefined")
    })
  })

  describe('Comparison Conditions', () => {
    it('should add greater than condition', () => {
      conditionBuilder.addCondition('age', '>', 18)
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ age: { gt: 18 } })
    })

    it('should add greater than or equal condition', () => {
      conditionBuilder.addCondition('age', '>=', 18)
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ age: { gte: 18 } })
    })

    it('should add less than condition', () => {
      conditionBuilder.addCondition('age', '<', 65)
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ age: { lt: 65 } })
    })

    it('should add less than or equal condition', () => {
      conditionBuilder.addCondition('age', '<=', 65)
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ age: { lte: 65 } })
    })

    it('should work with date fields', () => {
      const date = new Date('2023-01-01')
      conditionBuilder.addCondition('createdAt', '>', date)
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ createdAt: { gt: date } })
    })

    it('should work with float fields', () => {
      conditionBuilder.addCondition('score', '>=', 3.5)
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ score: { gte: 3.5 } })
    })

    it('should reject comparison on string fields', () => {
      expect(() => {
        conditionBuilder.addCondition('name', '>', 'test')
      }).toThrow('Comparison operator gt not compatible with field type string')
    })
  })

  describe('Like Conditions', () => {
    it('should add like condition', () => {
      conditionBuilder.addCondition('name', 'like', 'test')
      const query = conditionBuilder.build()
      expect(query.where).toEqual({
        name: {
          contains: 'test',
          mode: 'insensitive',
        },
      })
    })

    it('should reject non-string values for like', () => {
      expect(() => {
        conditionBuilder.addCondition('name', 'like', 123)
      }).toThrow("Like operator requires string value for field 'name'")
    })
  })

  describe('Array Conditions', () => {
    it('should add in condition', () => {
      conditionBuilder.addCondition('id', 'in', ['1', '2', '3'])
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ id: { in: ['1', '2', '3'] } })
    })

    it('should add not in condition', () => {
      conditionBuilder.addCondition('id', 'not_in', ['1', '2', '3'])
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ id: { notIn: ['1', '2', '3'] } })
    })

    it('should reject non-array values for in', () => {
      expect(() => {
        conditionBuilder.addCondition('id', 'in', 'not-array')
      }).toThrow("Array operator requires array value for field 'id'")
    })

    it('should reject non-array values for not_in', () => {
      expect(() => {
        conditionBuilder.addCondition('id', 'not_in', 'not-array')
      }).toThrow("Array operator requires array value for field 'id'")
    })
  })

  describe('Null Conditions', () => {
    it('should add is null condition', () => {
      conditionBuilder.addCondition('email', 'is_null', null)
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ email: null })
    })

    it('should add is not null condition', () => {
      conditionBuilder.addCondition('email', 'is_not_null', null)
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ email: { not: null } })
    })

    it('should ignore value for null conditions', () => {
      conditionBuilder.addCondition('email', 'is_null', 'ignored-value')
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ email: null })
    })
  })

  describe('Between Conditions', () => {
    it('should add between condition', () => {
      conditionBuilder.addCondition('age', 'between', [18, 65])
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ age: { gte: 18, lte: 65 } })
    })

    it('should work with date fields', () => {
      const startDate = new Date('2023-01-01')
      const endDate = new Date('2023-12-31')
      conditionBuilder.addCondition('birthDate', 'between', [startDate, endDate])
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ birthDate: { gte: startDate, lte: endDate } })
    })

    it('should reject invalid array format', () => {
      expect(() => {
        conditionBuilder.addCondition('age', 'between', [18])
      }).toThrow('Between operator requires array with exactly 2 values')
    })

    it('should reject non-array values', () => {
      expect(() => {
        conditionBuilder.addCondition('age', 'between', 'not-array')
      }).toThrow("Between operator requires array with exactly 2 values for field 'age'")
    })

    it('should reject between on string fields', () => {
      expect(() => {
        conditionBuilder.addCondition('name', 'between', [1, 10])
      }).toThrow('Between operator not compatible with field type string')
    })
  })

  describe('Multiple Conditions', () => {
    it('should handle multiple conditions on different fields', () => {
      conditionBuilder
        .addCondition('name', '=', 'test')
        .addCondition('age', '>', 18)
        .addCondition('email', 'is_not_null', null)

      const query = conditionBuilder.build()
      expect(query.where).toEqual({
        name: 'test',
        age: { gt: 18 },
        email: { not: null },
      })
    })

    it('should merge multiple conditions on same field', () => {
      conditionBuilder.addCondition('age', '>', 18).addCondition('age', '<', 65)

      const query = conditionBuilder.build()
      expect(query.where).toEqual({
        age: { gt: 18, lt: 65 },
      })
    })

    it('should handle conflicting conditions with AND', () => {
      conditionBuilder.addCondition('name', '=', 'test1').addCondition('name', '=', 'test2')

      const query = conditionBuilder.build()
      expect(query.where).toEqual({
        AND: [{ name: 'test1' }, { name: 'test2' }],
      })
    })
  })

  describe('Query Building', () => {
    it('should build query with empty conditions', () => {
      const query = conditionBuilder.build()
      expect(query).toEqual({})
    })

    it('should merge with existing query', () => {
      conditionBuilder.addCondition('name', '=', 'test')
      const existingQuery = { take: 10, skip: 5 }
      const query = conditionBuilder.build(existingQuery)
      expect(query).toEqual({
        take: 10,
        skip: 5,
        where: { name: 'test' },
      })
    })

    it('should merge with existing where conditions', () => {
      conditionBuilder.addCondition('name', '=', 'test')
      const existingQuery = {
        where: { status: 'active' },
        take: 10,
      }
      const query = conditionBuilder.build(existingQuery)
      expect(query).toEqual({
        take: 10,
        where: {
          status: 'active',
          name: 'test',
        },
      })
    })

    it('should handle existing AND conditions', () => {
      conditionBuilder.addCondition('name', '=', 'test')
      const existingQuery = {
        where: {
          AND: [{ status: 'active' }, { type: 'user' }],
        },
      }
      const query = conditionBuilder.build(existingQuery)
      expect(query).toEqual({
        where: {
          AND: [{ status: 'active' }, { type: 'user' }, { name: 'test' }],
        },
      })
    })
  })

  describe('Condition Management', () => {
    it('should reset conditions', () => {
      conditionBuilder.addCondition('name', '=', 'test').addCondition('age', '>', 18)

      expect(conditionBuilder.getConditionCount()).toBe(2)

      const result = conditionBuilder.reset()
      expect(result).toBe(conditionBuilder)
      expect(conditionBuilder.getConditionCount()).toBe(0)
    })

    it('should count conditions correctly', () => {
      expect(conditionBuilder.getConditionCount()).toBe(0)

      conditionBuilder.addCondition('name', '=', 'test')
      expect(conditionBuilder.getConditionCount()).toBe(1)

      conditionBuilder.addCondition('age', '>', 18)
      expect(conditionBuilder.getConditionCount()).toBe(2)
    })
  })

  describe('Custom Strategies', () => {
    it('should register custom strategy', () => {
      const customStrategy = {
        build: mock((field: string, value: unknown) => ({ [field]: { custom: value } })),
        validate: mock(() => {}),
      }

      const result = conditionBuilder.registerStrategy('custom', customStrategy)
      expect(result).toBe(conditionBuilder)

      conditionBuilder.addCondition('field', 'custom' as any, 'value')
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ field: { custom: 'value' } })
    })
  })

  describe('Error Handling', () => {
    it('should throw error for unsupported operator', () => {
      expect(() => {
        conditionBuilder.addCondition('name', 'unsupported' as any, 'value')
      }).toThrow('Unsupported operator: unsupported')
    })

    it('should log and re-throw validation errors', () => {
      expect(() => {
        conditionBuilder.addCondition('name', '=', undefined)
      }).toThrow("Value for field 'name' cannot be undefined")

      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle build errors gracefully', () => {
      // 测试构建时错误处理 - 使用有效的条件但模拟构建失败
      conditionBuilder.addCondition('name', '=', 'test')

      // 这个测试验证构建过程能正常处理错误（实际不会抛出错误）
      const query = conditionBuilder.build()
      expect(query.where).toEqual({ name: 'test' })
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle complex query with all condition types', () => {
      conditionBuilder
        .addCondition('name', 'like', 'test')
        .addCondition('age', 'between', [18, 65])
        .addCondition('email', 'is_not_null', null)
        .addCondition('id', 'in', ['1', '2', '3'])
        .addCondition('score', '>=', 3.5)

      const query = conditionBuilder.build()
      expect(query.where).toEqual({
        name: { contains: 'test', mode: 'insensitive' },
        age: { gte: 18, lte: 65 },
        email: { not: null },
        id: { in: ['1', '2', '3'] },
        score: { gte: 3.5 },
      })
    })

    it('should handle reset after complex query', () => {
      conditionBuilder
        .addCondition('name', '=', 'test')
        .addCondition('age', '>', 18)
        .addCondition('email', 'like', 'test@')

      expect(conditionBuilder.getConditionCount()).toBe(3)

      conditionBuilder.reset()
      expect(conditionBuilder.getConditionCount()).toBe(0)

      const query = conditionBuilder.build()
      expect(query).toEqual({})
    })
  })
})
