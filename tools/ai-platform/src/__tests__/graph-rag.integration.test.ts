/**
 * Graph RAG核心功能集成测试
 * 测试Neo4j服务、智能查询引擎和数据提取器的集成功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'

import { Neo4jService } from '../graph/neo4j-service'
import { IntelligentQueryEngine } from '../query/intelligent-query-engine'
import { loadNeo4jConfig } from '../config/neo4j-config'

describe('Graph RAG Integration Tests', () => {
  let neo4jService: Neo4jService
  let queryEngine: IntelligentQueryEngine

  beforeAll(async () => {
    const config = await loadNeo4jConfig()
    neo4jService = new Neo4jService(config)
    queryEngine = new IntelligentQueryEngine(neo4jService)
    
    // 确保连接成功
    await neo4jService.connect()
  })

  afterAll(async () => {
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
    it('should execute entity queries', async () => {
      const result = await queryEngine.findEntity('linch-kit')
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.results).toBeDefined()
      expect(Array.isArray(result.results.related_entities)).toBe(true)
    })

    it('should execute symbol queries', async () => {
      const result = await queryEngine.findSymbol('createLogger')
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.results).toBeDefined()
    })

    it('should execute pattern queries', async () => {
      const result = await queryEngine.findPattern('service', 'neo4j')
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.results).toBeDefined()
    })

    it('should handle empty query results', async () => {
      const result = await queryEngine.findEntity('非存在的实体')
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.results.primary_target).toBe(null)
      expect(result.results.related_entities).toHaveLength(0)
    })

    it('should provide debug information', async () => {
      const result = await queryEngine.findEntity('test', { debug: true })
      
      expect(result).toBeDefined()
      expect(result._debug_info).toBeDefined()
      expect(result._debug_info.query_type).toBe('find_entity')
      expect(result._debug_info.query_target).toBe('test')
      expect(result._debug_info.cypher_query).toBeDefined()
    })
  })

  describe('Query Performance Tests', () => {
    it('should execute queries within reasonable time limits', async () => {
      const startTime = Date.now()
      await queryEngine.findEntity('linch-kit')
      const endTime = Date.now()
      
      const executionTime = endTime - startTime
      expect(executionTime).toBeLessThan(5000) // 5秒内完成
    })

    it('should handle multiple concurrent queries', async () => {
      const queries = [
        queryEngine.findEntity('linch-kit'),
        queryEngine.findSymbol('createLogger'),
        queryEngine.findPattern('service', 'neo4j')
      ]

      const results = await Promise.all(queries)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Data Consistency Tests', () => {
    it('should maintain consistent query results', async () => {
      // 执行相同查询两次
      const result1 = await queryEngine.findEntity('linch-kit')
      const result2 = await queryEngine.findEntity('linch-kit')
      
      expect(result1.results.total_found).toBe(result2.results.total_found)
      expect(result1.results.related_entities.length).toBe(result2.results.related_entities.length)
    })

    it('should handle special characters in queries', async () => {
      const specialQueries = [
        'test-component',
        'test_component', 
        'test/component',
        'test@component'
      ]

      for (const query of specialQueries) {
        const result = await queryEngine.findEntity(query)
        expect(result.success).toBe(true)
      }
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle network interruptions gracefully', async () => {
      // 模拟网络中断情况
      const originalQuery = neo4jService.query
      neo4jService.query = async () => {
        throw new Error('Network connection lost')
      }

      try {
        const result = await queryEngine.findEntity('test')
        expect(result.success).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }

      // 恢复原始方法
      neo4jService.query = originalQuery
    })

    it('should validate query parameters', async () => {
      // 测试空查询
      const result = await queryEngine.findEntity('')
      expect(result.success).toBe(true)
      expect(result.results.primary_target).toBe(null)
    })
  })

  describe('Memory and Resource Management', () => {
    it('should not leak memory with large queries', async () => {
      // 执行多次查询检查内存使用
      const initialMemory = process.memoryUsage()
      
      for (let i = 0; i < 10; i++) {
        await queryEngine.findEntity(`test-query-${i}`)
      }
      
      const finalMemory = process.memoryUsage()
      
      // 检查内存增长不超过50MB
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB
    })

    it('should clean up resources properly', async () => {
      const testService = new Neo4jService()
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
        const result = await queryEngine.findEntity(query)
        expect(result.success).toBe(true)
        expect(result.metadata.execution_time_ms).toBeLessThan(3000)
      }
    })

    it('should provide useful suggestions for empty results', async () => {
      const result = await queryEngine.findEntity('不存在的功能')
      
      expect(result.success).toBe(true)
      expect(result.results.suggestions).toBeDefined()
    })
  })
})