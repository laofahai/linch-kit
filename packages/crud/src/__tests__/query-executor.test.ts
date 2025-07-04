/**
 * QueryExecutor 测试套件
 * 
 * 测试查询执行器的各种功能，包括：
 * - 查询命令执行
 * - 性能监控
 * - 错误处理
 * - 聚合查询
 * - 缓存优化
 */

import { describe, it, expect, beforeEach, afterEach, jest } from 'bun:test'
import { QueryExecutor, QueryExecutorFactory } from '../core/query-builder/query-executor'
import type { Logger, PerformanceMetrics } from '../types'

// Mock 数据
const mockUsers = [
  { id: '1', name: 'John', email: 'john@example.com', age: 30 },
  { id: '2', name: 'Jane', email: 'jane@example.com', age: 25 },
  { id: '3', name: 'Bob', email: 'bob@example.com', age: 35 }
]

const mockUser = { id: '1', name: 'John', email: 'john@example.com', age: 30 }

// Mock Logger
const mockLogger: Logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}

// Mock PrismaClient
const mockPrismaClient = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn()
  }
}

describe('QueryExecutor', () => {
  let queryExecutor: QueryExecutor<typeof mockUser>

  beforeEach(() => {
    // 重置所有 mock 函数
    jest.clearAllMocks()
    
    // 创建 QueryExecutor 实例
    queryExecutor = new QueryExecutor('User', mockPrismaClient, mockLogger)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findMany 查询', () => {
    it('should execute findMany query successfully', async () => {
      // 设置 mock 返回值
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers)

      const query = {
        where: { age: { gt: 25 } },
        orderBy: { name: 'asc' }
      }

      const result = await queryExecutor.findMany(query)

      expect(result.data).toEqual(mockUsers)
      expect(result.metrics).toMatchObject({
        operation: 'findMany',
        entityName: 'User',
        duration: expect.any(Number),
        queryComplexity: expect.any(Number),
        timestamp: expect.any(Date)
      })
      expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith(query)
    })

    it('should handle findMany errors gracefully', async () => {
      const mockError = new Error('Database connection failed')
      mockPrismaClient.user.findMany.mockRejectedValue(mockError)

      const query = { where: { id: '1' } }

      await expect(queryExecutor.findMany(query)).rejects.toThrow('Database connection failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'FindMany execution failed',
        mockError,
        { entityName: 'User', query }
      )
    })

    it('should calculate query complexity correctly', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers)

      const complexQuery = {
        where: {
          AND: [
            { age: { gt: 25 } },
            { name: { contains: 'John' } }
          ]
        },
        include: {
          posts: true,
          profile: true
        },
        orderBy: [
          { name: 'asc' },
          { age: 'desc' }
        ]
      }

      const result = await queryExecutor.findMany(complexQuery)

      expect(result.metrics.queryComplexity).toBeGreaterThan(1)
      expect(result.metrics.queryComplexity).toBe(9) // 1 + 2 + 4 + 2 = 9
    })
  })

  describe('findFirst 查询', () => {
    it('should execute findFirst query successfully', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(mockUser)

      const query = { where: { id: '1' } }
      const result = await queryExecutor.findFirst(query)

      expect(result.data).toEqual(mockUser)
      expect(result.metrics).toMatchObject({
        operation: 'findFirst',
        entityName: 'User',
        duration: expect.any(Number),
        timestamp: expect.any(Date)
      })
      expect(mockPrismaClient.user.findFirst).toHaveBeenCalledWith(query)
    })

    it('should handle findFirst returning null', async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue(null)

      const query = { where: { id: 'nonexistent' } }
      const result = await queryExecutor.findFirst(query)

      expect(result.data).toBeNull()
      // Basic metrics should be present
      expect(result.metrics.operation).toBe('findFirst')
      expect(result.metrics.entityName).toBe('User')
    })

    it('should handle findFirst errors gracefully', async () => {
      const mockError = new Error('Invalid query')
      mockPrismaClient.user.findFirst.mockRejectedValue(mockError)

      const query = { where: { id: '1' } }

      await expect(queryExecutor.findFirst(query)).rejects.toThrow('Invalid query')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'FindFirst execution failed',
        mockError,
        { entityName: 'User', query }
      )
    })
  })

  describe('count 查询', () => {
    it('should execute count query successfully', async () => {
      mockPrismaClient.user.count.mockResolvedValue(5)

      const query = { where: { age: { gt: 25 } } }
      const result = await queryExecutor.count(query)

      expect(result.data).toBe(5)
      expect(result.metrics).toMatchObject({
        operation: 'count',
        entityName: 'User',
        duration: expect.any(Number),
        timestamp: expect.any(Date)
      })
      expect(mockPrismaClient.user.count).toHaveBeenCalledWith({ where: query.where })
    })

    it('should handle count errors gracefully', async () => {
      const mockError = new Error('Count failed')
      mockPrismaClient.user.count.mockRejectedValue(mockError)

      const query = { where: { age: { gt: 25 } } }

      await expect(queryExecutor.count(query)).rejects.toThrow('Count failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Count execution failed',
        mockError,
        { entityName: 'User', query }
      )
    })
  })

  describe('aggregate 查询', () => {
    it('should execute sum aggregation successfully', async () => {
      mockPrismaClient.user.aggregate.mockResolvedValue({
        _sum: { age: 150 }
      })

      const query = { where: { age: { gt: 20 } } }
      const result = await queryExecutor.aggregate(query, 'sum', 'age')

      expect(result.data).toBe(150)
      expect(result.metrics).toMatchObject({
        operation: 'sum',
        entityName: 'User',
        duration: expect.any(Number),
        timestamp: expect.any(Date)
      })
      expect(mockPrismaClient.user.aggregate).toHaveBeenCalledWith({
        where: query.where,
        _sum: { age: true }
      })
    })

    it('should execute avg aggregation successfully', async () => {
      mockPrismaClient.user.aggregate.mockResolvedValue({
        _avg: { age: 30 }
      })

      const query = { where: { age: { gt: 20 } } }
      const result = await queryExecutor.aggregate(query, 'avg', 'age')

      expect(result.data).toBe(30)
      expect(result.metrics.operation).toBe('avg')
    })

    it('should execute min aggregation successfully', async () => {
      mockPrismaClient.user.aggregate.mockResolvedValue({
        _min: { age: 25 }
      })

      const query = { where: { age: { gt: 20 } } }
      const result = await queryExecutor.aggregate(query, 'min', 'age')

      expect(result.data).toBe(25)
      expect(result.metrics.operation).toBe('min')
    })

    it('should execute max aggregation successfully', async () => {
      mockPrismaClient.user.aggregate.mockResolvedValue({
        _max: { age: 35 }
      })

      const query = { where: { age: { gt: 20 } } }
      const result = await queryExecutor.aggregate(query, 'max', 'age')

      expect(result.data).toBe(35)
      expect(result.metrics.operation).toBe('max')
    })

    it('should handle aggregate errors gracefully', async () => {
      const mockError = new Error('Aggregate failed')
      mockPrismaClient.user.aggregate.mockRejectedValue(mockError)

      const query = { where: { age: { gt: 20 } } }

      await expect(queryExecutor.aggregate(query, 'sum', 'age')).rejects.toThrow('Aggregate failed')
      expect(mockLogger.error).toHaveBeenCalledWith(
        'sum execution failed',
        mockError,
        { entityName: 'User', field: 'age' }
      )
    })

    it('should handle null aggregate results', async () => {
      mockPrismaClient.user.aggregate.mockResolvedValue({
        _sum: { age: null }
      })

      const query = { where: { age: { gt: 100 } } }
      const result = await queryExecutor.aggregate(query, 'sum', 'age')

      expect(result.data).toBe(0)
    })
  })

  describe('exists 查询', () => {
    it('should return true when records exist', async () => {
      mockPrismaClient.user.count.mockResolvedValue(3)

      const query = { where: { age: { gt: 20 } } }
      const result = await queryExecutor.exists(query)

      expect(result.data).toBe(true)
      expect(result.metrics.operation).toBe('exists')
    })

    it('should return false when no records exist', async () => {
      mockPrismaClient.user.count.mockResolvedValue(0)

      const query = { where: { age: { gt: 100 } } }
      const result = await queryExecutor.exists(query)

      expect(result.data).toBe(false)
      expect(result.metrics.operation).toBe('exists')
    })
  })

  describe('getPrismaModel 错误处理', () => {
    it('should throw error when prisma model not found', async () => {
      const invalidExecutor = new QueryExecutor('NonExistentModel', mockPrismaClient, mockLogger)

      await expect(invalidExecutor.findMany({})).rejects.toThrow(
        'Prisma model for entity NonExistentModel not found'
      )
    })
  })

  describe('性能监控', () => {
    it('should record performance metrics correctly', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers)

      const startTime = Date.now()
      const result = await queryExecutor.findMany({})
      const endTime = Date.now()

      expect(result.metrics.duration).toBeGreaterThanOrEqual(0)
      expect(result.metrics.duration).toBeLessThan(endTime - startTime + 100) // 允许一些时间差
      expect(result.metrics.timestamp).toBeInstanceOf(Date)
    })

    it('should calculate query complexity for complex queries', async () => {
      mockPrismaClient.user.findMany.mockResolvedValue(mockUsers)

      const complexQuery = {
        where: {
          OR: [
            { age: { gt: 25 } },
            { name: { contains: 'John' } }
          ],
          AND: [
            { email: { contains: '@example.com' } }
          ]
        },
        include: {
          posts: true,
          profile: true,
          comments: true
        },
        orderBy: [
          { name: 'asc' },
          { age: 'desc' },
          { email: 'asc' }
        ]
      }

      const result = await queryExecutor.findMany(complexQuery)

      expect(result.metrics.queryComplexity).toBeGreaterThan(5)
    })
  })
})

describe('QueryExecutorFactory', () => {
  it('should create QueryExecutor instance', () => {
    const executor = QueryExecutorFactory.create('User', mockPrismaClient, mockLogger)
    expect(executor).toBeInstanceOf(QueryExecutor)
  })

  it('should create typed QueryExecutor instance', () => {
    interface User {
      id: string
      name: string
      email: string
    }

    const executor = QueryExecutorFactory.create<User>('User', mockPrismaClient, mockLogger)
    expect(executor).toBeInstanceOf(QueryExecutor)
  })
})

describe('BaseQueryCommand 测试', () => {
  let queryExecutor: QueryExecutor<typeof mockUser>

  beforeEach(() => {
    queryExecutor = new QueryExecutor('User', mockPrismaClient, mockLogger)
  })

  it('should calculate basic query complexity', async () => {
    mockPrismaClient.user.findMany.mockResolvedValue(mockUsers)

    const basicQuery = {
      where: { id: '1' }
    }

    const result = await queryExecutor.findMany(basicQuery)
    expect(result.metrics.queryComplexity).toBe(2) // 1 + 1 (where条件)
  })

  it('should handle nested AND/OR conditions', async () => {
    mockPrismaClient.user.findMany.mockResolvedValue(mockUsers)

    const nestedQuery = {
      where: {
        AND: [
          { age: { gt: 25 } },
          { 
            OR: [
              { name: { contains: 'John' } },
              { email: { contains: 'jane' } }
            ]
          }
        ]
      }
    }

    const result = await queryExecutor.findMany(nestedQuery)
    expect(result.metrics.queryComplexity).toBe(4) // 1 + 3 (1 AND + 2 OR)
  })
})