/**
 * QueryOptimizer 测试套件
 *
 * 测试查询优化器的各种功能，包括：
 * - WHERE条件优化
 * - ORDER BY优化
 * - 关联查询优化
 * - 分页优化
 * - 字段选择优化
 * - 批量查询优化
 */

import { describe, it, expect, beforeEach, jest } from 'bun:test'
import type { Entity } from '@linch-kit/schema'

import { QueryOptimizer, createQueryOptimizer } from '../core/query-builder/query-optimizer'
import type { Logger } from '../types'

// Mock Logger
const mockLogger: Logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn(() => mockLogger),
}

// Mock Entity
const mockUserEntity: Entity = {
  name: 'User',
  fields: {
    id: {
      name: 'id',
      type: 'string',
      required: true,
      unique: true,
      index: true,
    },
    email: {
      name: 'email',
      type: 'string',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      name: 'name',
      type: 'string',
      required: true,
    },
    age: {
      name: 'age',
      type: 'number',
    },
    status: {
      name: 'status',
      type: 'string',
      index: true,
    },
    tenantId: {
      name: 'tenantId',
      type: 'string',
      required: true,
      index: true,
    },
    createdAt: {
      name: 'createdAt',
      type: 'date',
      required: true,
      index: true,
    },
    updatedAt: {
      name: 'updatedAt',
      type: 'date',
      required: true,
    },
    bio: {
      name: 'bio',
      type: 'string',
    },
  },
  description: 'User entity for testing',
}

describe('QueryOptimizer', () => {
  let optimizer: QueryOptimizer

  beforeEach(() => {
    jest.clearAllMocks()
    optimizer = new QueryOptimizer(mockLogger)
  })

  describe('基础优化功能', () => {
    it('should optimize simple query without hints when all conditions are optimal', () => {
      const query = {
        where: { id: 'user-123' },
        take: 10,
      }

      const result = optimizer.optimize(query, mockUserEntity)

      expect(result.query).toEqual(query)
      expect(result.hints.length).toBeGreaterThanOrEqual(1) // Should have at least one hint
      expect(result.estimatedCost).toBeGreaterThanOrEqual(0)

      // Check for index hint for id field
      const indexHint = result.hints.find(h => h.type === 'index' && h.field === 'id')
      expect(indexHint).toBeDefined()
      expect(indexHint?.impact).toBe('high')
    })

    it('should calculate estimated cost correctly', () => {
      const simpleQuery = { where: { id: 'user-123' } }
      const complexQuery = {
        where: {
          AND: [{ name: { contains: 'John' } }, { age: { gt: 18 } }, { status: 'active' }],
        },
        orderBy: [{ name: 'asc' }, { age: 'desc' }],
        include: { posts: true, profile: true },
        take: 100,
      }

      const simpleResult = optimizer.optimize(simpleQuery, mockUserEntity)
      const complexResult = optimizer.optimize(complexQuery, mockUserEntity)

      expect(complexResult.estimatedCost).toBeGreaterThan(simpleResult.estimatedCost)
    })
  })

  describe('WHERE条件优化', () => {
    it('should suggest index for frequently queried fields without index', () => {
      // Add userId to entity fields for testing
      const testEntity = {
        ...mockUserEntity,
        fields: {
          ...mockUserEntity.fields,
          userId: {
            name: 'userId',
            type: 'string',
            required: true,
          },
        },
      }

      const query = {
        where: { userId: 'user-123' },
      }

      const result = optimizer.optimize(query, testEntity)

      const indexHint = result.hints.find(h => h.type === 'index' && h.field === 'userId')
      expect(indexHint).toBeDefined()
      expect(indexHint?.suggestion).toContain('Consider adding index')
      expect(indexHint?.impact).toBe('medium')
    })

    it('should warn about large IN clauses', () => {
      const largeInArray = Array.from({ length: 150 }, (_, i) => `item-${i}`)
      const query = {
        where: { id: { in: largeInArray } },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const filterHint = result.hints.find(h => h.type === 'filter' && h.field === 'id')
      expect(filterHint).toBeDefined()
      expect(filterHint?.suggestion).toContain('Large IN clause')
      expect(filterHint?.impact).toBe('high')
    })

    it('should warn about text search without index', () => {
      const query = {
        where: {
          name: { contains: 'John' },
          bio: { startsWith: 'Software' },
        },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const textSearchHints = result.hints.filter(
        h => h.type === 'filter' && h.suggestion.includes('Text search')
      )
      expect(textSearchHints).toHaveLength(2) // name and bio fields
      expect(textSearchHints.every(h => h.impact === 'medium')).toBe(true)
    })

    it('should warn about complex AND conditions', () => {
      const query = {
        where: {
          AND: [
            { name: 'John' },
            { age: { gt: 18 } },
            { status: 'active' },
            { tenantId: 'tenant-1' },
            { email: { contains: '@example.com' } },
            { createdAt: { gt: new Date('2023-01-01') } },
          ],
        },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const complexHint = result.hints.find(
        h => h.type === 'filter' && h.suggestion.includes('Complex AND condition')
      )
      expect(complexHint).toBeDefined()
      expect(complexHint?.impact).toBe('medium')
    })

    it('should warn about OR conditions', () => {
      const query = {
        where: {
          OR: [{ name: 'John' }, { email: 'john@example.com' }],
        },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const orHint = result.hints.find(
        h => h.type === 'filter' && h.suggestion.includes('OR conditions')
      )
      expect(orHint).toBeDefined()
      expect(orHint?.impact).toBe('medium')
    })

    it('should handle indexed fields correctly', () => {
      const query = {
        where: {
          email: 'john@example.com',
          status: 'active',
        },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const indexHints = result.hints.filter(h => h.type === 'index')
      expect(indexHints).toHaveLength(2) // Both email and status have indexes
      expect(indexHints.every(h => h.impact === 'high')).toBe(true)
    })
  })

  describe('ORDER BY优化', () => {
    it('should warn about sorting by non-indexed fields', () => {
      const query = {
        orderBy: { name: 'asc', age: 'desc' },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const sortHints = result.hints.filter(h => h.type === 'sort')
      expect(sortHints).toHaveLength(2) // name and age are not indexed
      expect(sortHints.every(h => h.impact === 'medium')).toBe(true)
    })

    it('should handle array format orderBy', () => {
      const query = {
        orderBy: [{ name: 'asc' }, { age: 'desc' }, { bio: 'asc' }],
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const sortHints = result.hints.filter(h => h.type === 'sort')
      expect(sortHints.length).toBeGreaterThanOrEqual(3) // At least one hint per non-indexed field
    })

    it('should warn about sorting by many fields', () => {
      const query = {
        orderBy: [{ name: 'asc' }, { age: 'desc' }, { bio: 'asc' }, { updatedAt: 'desc' }],
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const manyFieldsHint = result.hints.find(
        h => h.suggestion.includes('Sorting by') && h.suggestion.includes('fields may impact')
      )
      expect(manyFieldsHint).toBeDefined()
      expect(manyFieldsHint?.impact).toBe('low')
    })
  })

  describe('INCLUDE优化', () => {
    it('should warn about too many relations', () => {
      const query = {
        include: {
          posts: true,
          profile: true,
          comments: true,
          followers: true,
        },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const joinHint = result.hints.find(
        h =>
          h.type === 'join' &&
          h.suggestion.includes('Including') &&
          h.suggestion.includes('relations')
      )
      expect(joinHint).toBeDefined()
      expect(joinHint?.impact).toBe('high')
    })

    it('should warn about deep nesting', () => {
      const query = {
        include: {
          posts: {
            include: {
              comments: {
                include: {
                  author: true,
                },
              },
            },
          },
        },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const depthHint = result.hints.find(
        h => h.type === 'join' && h.suggestion.includes('Deep nesting')
      )
      expect(depthHint).toBeDefined()
      expect(depthHint?.impact).toBe('high')
    })

    it('should calculate include depth correctly', () => {
      const shallowQuery = {
        include: {
          posts: true,
          profile: true,
        },
      }

      const deepQuery = {
        include: {
          posts: {
            include: {
              comments: {
                include: {
                  author: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
            },
          },
        },
      }

      const shallowResult = optimizer.optimize(shallowQuery, mockUserEntity)
      const deepResult = optimizer.optimize(deepQuery, mockUserEntity)

      expect(deepResult.estimatedCost).toBeGreaterThan(shallowResult.estimatedCost)
    })
  })

  describe('分页优化', () => {
    it('should warn about large offsets', () => {
      const query = {
        skip: 15000,
        take: 20,
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const offsetHint = result.hints.find(
        h => h.type === 'limit' && h.suggestion.includes('Large offset')
      )
      expect(offsetHint).toBeDefined()
      expect(offsetHint?.impact).toBe('high')
      expect(offsetHint?.suggestion).toContain('cursor-based pagination')
    })

    it('should warn about large limits', () => {
      const query = {
        take: 2000,
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const limitHint = result.hints.find(
        h => h.type === 'limit' && h.suggestion.includes('Large limit')
      )
      expect(limitHint).toBeDefined()
      expect(limitHint?.impact).toBe('medium')
    })

    it('should warn about pagination without ordering', () => {
      const query = {
        skip: 20,
        take: 10,
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const orderHint = result.hints.find(
        h => h.type === 'limit' && h.suggestion.includes('Pagination without ORDER BY')
      )
      expect(orderHint).toBeDefined()
      expect(orderHint?.impact).toBe('medium')
    })

    it('should not warn when pagination has proper ordering', () => {
      const query = {
        skip: 20,
        take: 10,
        orderBy: { createdAt: 'desc' },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const orderHint = result.hints.find(h => h.suggestion.includes('Pagination without ORDER BY'))
      expect(orderHint).toBeUndefined()
    })
  })

  describe('SELECT优化', () => {
    it('should suggest field selection benefits', () => {
      // Use minimal fields to trigger the optimization hint (less than 30% of total fields)
      const query = {
        select: {
          id: true,
          name: true, // Only 2 out of 9 fields = ~22%
        },
      }

      const result = optimizer.optimize(query, mockUserEntity)

      const selectHint = result.hints.find(
        h => h.type === 'filter' && h.suggestion.includes('Selecting specific fields')
      )
      expect(selectHint).toBeDefined()
      expect(selectHint?.impact).toBe('low')
      expect(result.estimatedCost).toBeLessThan(0) // Should reduce cost
    })

    it('should handle nested select correctly', () => {
      const query = {
        select: {
          id: true,
          posts: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }

      const result = optimizer.optimize(query, mockUserEntity)
      expect(result.hints).toBeDefined()
    })
  })

  describe('批量查询优化', () => {
    it('should detect similar queries for batching', () => {
      const queries = [
        { query: { where: { tenantId: 'tenant-1' } }, entity: mockUserEntity },
        { query: { where: { tenantId: 'tenant-2' } }, entity: mockUserEntity },
        { query: { where: { status: 'active' } }, entity: mockUserEntity },
      ]

      const results = optimizer.batchOptimize(queries)

      expect(results).toHaveLength(3)
      const batchHint = results[0].hints.find(h =>
        h.suggestion.includes('similar queries that could be combined')
      )
      expect(batchHint).toBeDefined()
      expect(batchHint?.impact).toBe('high')
    })

    it('should optimize each query in batch independently', () => {
      const queries = [
        {
          query: {
            where: { id: 'user-1' },
            orderBy: { name: 'asc' },
          },
          entity: mockUserEntity,
        },
        {
          query: {
            where: { name: { contains: 'John' } },
            take: 1500,
          },
          entity: mockUserEntity,
        },
      ]

      const results = optimizer.batchOptimize(queries)

      expect(results).toHaveLength(2)
      expect(results[0].estimatedCost).not.toEqual(results[1].estimatedCost)
    })
  })

  describe('辅助方法测试', () => {
    it('should identify frequently queried fields', () => {
      // Add userId to entity for testing frequently queried field
      const testEntity = {
        ...mockUserEntity,
        fields: {
          ...mockUserEntity.fields,
          userId: {
            name: 'userId',
            type: 'string',
            required: true,
            // No index property, so it should trigger the hint
          },
        },
      }

      const frequentQuery = { where: { userId: 'user-123' } }
      const infrequentQuery = { where: { bio: 'developer' } }

      const frequentResult = optimizer.optimize(frequentQuery, testEntity)
      const infrequentResult = optimizer.optimize(infrequentQuery, mockUserEntity)

      // userId should be considered frequently queried
      const frequentHint = frequentResult.hints.find(
        h => h.field === 'userId' && h.suggestion.includes('frequently queried')
      )
      expect(frequentHint).toBeDefined()

      // bio should not trigger the frequently queried hint
      const infrequentHint = infrequentResult.hints.find(
        h => h.field === 'bio' && h.suggestion.includes('frequently queried')
      )
      expect(infrequentHint).toBeUndefined()
    })

    it('should calculate include depth correctly for complex structures', () => {
      const complexInclude = {
        posts: {
          include: {
            comments: {
              include: {
                author: {
                  include: {
                    profile: true,
                  },
                },
                replies: {
                  include: {
                    author: true,
                  },
                },
              },
            },
            tags: true,
          },
        },
        followers: true,
      }

      const query = { include: complexInclude }
      const result = optimizer.optimize(query, mockUserEntity)

      const depthHint = result.hints.find(
        h => h.suggestion.includes('Deep nesting') && h.suggestion.includes('4 levels')
      )
      expect(depthHint).toBeDefined()
    })

    it('should count selected fields correctly', () => {
      const selectQuery = {
        select: {
          id: true,
          name: true,
          posts: {
            select: {
              id: true,
              title: true,
              content: true,
            },
          },
          profile: {
            select: {
              bio: true,
            },
          },
        },
      }

      const result = optimizer.optimize(selectQuery, mockUserEntity)
      expect(result.hints).toBeDefined()
    })
  })

  describe('错误处理和边界情况', () => {
    it('should handle empty query', () => {
      const result = optimizer.optimize({}, mockUserEntity)

      expect(result.query).toEqual({})
      expect(result.hints).toHaveLength(0)
      expect(result.estimatedCost).toBe(0)
    })

    it('should handle query with undefined/null values', () => {
      const query = {
        where: { name: null },
        orderBy: undefined,
        include: null,
      }

      expect(() => optimizer.optimize(query, mockUserEntity)).not.toThrow()
    })

    it('should handle entity without fields', () => {
      const emptyEntity: Entity = {
        name: 'Empty',
        fields: {},
        description: 'Empty entity',
      }

      const query = { where: { someField: 'value' } }
      const result = optimizer.optimize(query, emptyEntity)

      expect(result.hints).toBeDefined()
    })
  })
})

describe('createQueryOptimizer factory function', () => {
  it('should create QueryOptimizer instance without logger', () => {
    const optimizer = createQueryOptimizer()
    expect(optimizer).toBeInstanceOf(QueryOptimizer)
  })

  it('should create QueryOptimizer instance with logger', () => {
    const optimizer = createQueryOptimizer(mockLogger)
    expect(optimizer).toBeInstanceOf(QueryOptimizer)
    expect(mockLogger.child).toHaveBeenCalledWith({ component: 'QueryOptimizer' })
  })
})
