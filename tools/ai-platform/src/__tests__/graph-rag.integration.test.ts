/**
 * Graph RAG核心功能集成测试
 * 测试Neo4j服务、智能查询引擎和数据提取器的集成功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'

import { Neo4jService } from '../core/graph/neo4j-service.js'
import { IntelligentQueryEngine } from '../query/intelligent-query-engine.js'
import { loadNeo4jConfig } from '../core/config/neo4j-config.js'

describe('Graph RAG Integration Tests', () => {
  let neo4jService: Neo4jService
  let queryEngine: IntelligentQueryEngine

  beforeAll(async () => {
    const config = await loadNeo4jConfig()
    neo4jService = new Neo4jService(config)
    queryEngine = new IntelligentQueryEngine()
    
    // 确保连接成功
    await neo4jService.connect()
    await queryEngine.connect()
  })

  afterAll(async () => {
    await queryEngine.disconnect()
    await neo4jService.disconnect()
  })

  describe('Neo4j Service Integration', () => {
    it('should connect to Neo4j successfully', async () => {
      expect(neo4jService.isConnected()).toBe(true)
    })

    it('should execute basic cypher queries', async () => {
      const result = await neo4jService.query('MATCH (n) RETURN count(n) as nodeCount')
      expect(result).toBeDefined()
      expect(Array.isArray(result.records)).toBe(true)
    })

    it('should handle query errors gracefully', async () => {
      try {
        await neo4jService.query('INVALID CYPHER QUERY')
      } catch (error) {
        expect(error).toBeDefined()
        expect(error instanceof Error).toBe(true)
      }
    })
  })

  describe('Intelligent Query Engine Integration', () => {
    it('should execute general queries', async () => {
      const result = await queryEngine.query('linch-kit')
      
      expect(result).toBeDefined()
      expect(result.intent).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.results).toBeDefined()
      expect(Array.isArray(result.results.nodes)).toBe(true)
      expect(Array.isArray(result.results.relationships)).toBe(true)
    })

    it('should recognize different query intents', async () => {
      const functionResult = await queryEngine.query('find function createLogger')
      expect(functionResult.intent).toBe('find_function')
      
      const classResult = await queryEngine.query('find class User')
      expect(classResult.intent).toBe('find_class')
    })

    it('should provide explanations and suggestions', async () => {
      const result = await queryEngine.query('authentication system')
      
      expect(result).toBeDefined()
      expect(result.results.explanation).toBeDefined()
      expect(Array.isArray(result.results.suggestions)).toBe(true)
    })

    it('should handle empty query results', async () => {
      const result = await queryEngine.query('非存在的实体12345')
      
      expect(result).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.results.nodes).toHaveLength(0)
    })

    it('should include execution time', async () => {
      const result = await queryEngine.query('test query')
      
      expect(result).toBeDefined()
      expect(result.execution_time_ms).toBeGreaterThan(0)
      expect(result.cypher_query).toBeDefined()
    })
  })

  describe('Query Performance Tests', () => {
    it('should execute queries within reasonable time limits', async () => {
      const result = await queryEngine.query('linch-kit')
      
      expect(result.execution_time_ms).toBeLessThan(5000) // 5秒内完成
    })

    it('should handle multiple concurrent queries', async () => {
      const queries = [
        queryEngine.query('linch-kit'),
        queryEngine.query('createLogger'),
        queryEngine.query('service neo4j')
      ]

      const results = await Promise.all(queries)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.intent).toBeDefined()
        expect(result.confidence).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Data Consistency Tests', () => {
    it('should maintain consistent query results', async () => {
      // 执行相同查询两次
      const result1 = await queryEngine.query('linch-kit')
      const result2 = await queryEngine.query('linch-kit')
      
      expect(result1.results.nodes.length).toBe(result2.results.nodes.length)
      expect(result1.intent).toBe(result2.intent)
    })

    it('should handle special characters in queries', async () => {
      const specialQueries = [
        'test-component',
        'test_component', 
        'test/component',
        'test@component'
      ]

      for (const query of specialQueries) {
        const result = await queryEngine.query(query)
        expect(result.intent).toBeDefined()
        expect(result.confidence).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle invalid queries gracefully', async () => {
      try {
        const result = await queryEngine.query('') // 空查询
        expect(result).toBeDefined()
        expect(result.intent).toBeDefined()
      } catch (error) {
        // 如果抛出异常，确保是合理的错误
        expect(error instanceof Error).toBe(true)
      }
    })

    it('should handle very long queries', async () => {
      const longQuery = 'a'.repeat(1000) // 1000字符的查询
      const result = await queryEngine.query(longQuery)
      
      expect(result).toBeDefined()
      expect(result.intent).toBeDefined()
    })
  })

  describe('Memory and Resource Management', () => {
    it('should not leak memory with large queries', async () => {
      // 执行多次查询检查内存使用
      const initialMemory = process.memoryUsage()
      
      for (let i = 0; i < 10; i++) {
        await queryEngine.query(`test-query-${i}`)
      }
      
      const finalMemory = process.memoryUsage()
      
      // 检查内存增长不超过50MB
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB
    })

    it('should clean up resources properly', async () => {
      const config = await loadNeo4jConfig()
      const testService = new Neo4jService(config)
      await testService.connect()
      
      expect(testService.isConnected()).toBe(true)
      
      await testService.disconnect()
      expect(testService.isConnected()).toBe(false)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle typical development queries', async () => {
      const commonQueries = [
        'auth',
        'user',
        'service',
        'component',
        'config',
        'logger'
      ]

      for (const query of commonQueries) {
        const result = await queryEngine.query(query)
        expect(result.intent).toBeDefined()
        expect(result.execution_time_ms).toBeLessThan(3000)
      }
    })

    it('should provide useful suggestions for empty results', async () => {
      const result = await queryEngine.query('不存在的功能')
      
      expect(result.intent).toBeDefined()
      expect(Array.isArray(result.results.suggestions)).toBe(true)
    })
  })
})