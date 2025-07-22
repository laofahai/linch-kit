/**
 * 智能查询引擎单元测试
 * 
 * 使用Mock避免对外部依赖的需求，专注测试核心逻辑
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { IntelligentQueryEngine } from '../query/intelligent-query-engine.js'

// Mock Neo4j服务
const mockNeo4jService = {
  connect: mock(() => Promise.resolve()),
  disconnect: mock(() => Promise.resolve()),
  getStats: mock(() => Promise.resolve({
    nodeCount: 100,
    relationshipCount: 200,
    labelCounts: { Function: 50, Class: 30 }
  })),
  query: mock(() => Promise.resolve({
    records: [],
    nodes: [],
    relationships: [],
    metadata: { query_time_ms: 100 }
  })),
  isConnected: mock(() => true)
}

// Mock HybridAIManager
const mockHybridAIManager = {
  analyze: mock(() => Promise.resolve({
    success: true,
    content: 'find_general',
    metadata: { provider: 'rules', executionTime: 50 }
  }))
}

// Mock配置加载
const mockLoadNeo4jConfig = mock(() => Promise.resolve({
  connectionUri: 'neo4j://localhost:7687',
  username: 'neo4j',
  password: 'password',
  database: 'neo4j'
}))

// Mock模块导入
mock.module('../core/graph/neo4j-service.js', () => ({
  Neo4jService: class {
    constructor() {}
    async connect() { return mockNeo4jService.connect() }
    async disconnect() { return mockNeo4jService.disconnect() }
    async query() { return mockNeo4jService.query() }
    async getStats() { return mockNeo4jService.getStats() }
    isConnected() { return mockNeo4jService.isConnected() }
  }
}))

mock.module('../core/config/neo4j-config.js', () => ({
  loadNeo4jConfig: mockLoadNeo4jConfig
}))

mock.module('../providers/hybrid-ai-manager.js', () => ({
  createHybridAIManager: () => mockHybridAIManager
}))

describe('IntelligentQueryEngine Unit Tests', () => {
  let queryEngine: IntelligentQueryEngine

  beforeEach(() => {
    // 重置所有mock
    mockNeo4jService.connect.mockClear()
    mockNeo4jService.disconnect.mockClear()
    mockNeo4jService.query.mockClear()
    mockNeo4jService.isConnected.mockClear()
    mockHybridAIManager.analyze.mockClear()
    mockLoadNeo4jConfig.mockClear()

    queryEngine = new IntelligentQueryEngine()
  })

  describe('初始化和连接', () => {
    it('应该成功初始化', () => {
      expect(queryEngine).toBeDefined()
    })

    it('应该成功连接到Neo4j', async () => {
      await queryEngine.connect()
      expect(mockLoadNeo4jConfig).toHaveBeenCalled()
      expect(mockNeo4jService.connect).toHaveBeenCalled()
    })

    it('应该成功断开连接', async () => {
      await queryEngine.connect()
      await queryEngine.disconnect()
      expect(mockNeo4jService.disconnect).toHaveBeenCalled()
    })
  })

  describe('意图识别', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该正确识别函数查询意图', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_function',
        metadata: { provider: 'ai', executionTime: 200 }
      })

      const result = await queryEngine.query('find function createLogger')
      expect(result.intent).toBe('find_function')
      expect(mockHybridAIManager.analyze).toHaveBeenCalled()
    })

    it('应该正确识别类查询意图', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_class',
        metadata: { provider: 'ai', executionTime: 200 }
      })

      const result = await queryEngine.query('find class UserService')
      expect(result.intent).toBe('find_class')
    })

    it('AI意图识别失败时应该使用备用方案', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: false,
        content: '',
        metadata: { provider: 'ai', executionTime: 200 }
      })

      const result = await queryEngine.query('find function test')
      expect(result.intent).toBe('find_function') // 应该通过规则匹配识别
    })
  })

  describe('实体提取', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该提取引号中的精确匹配', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('find "createLogger" function')
      expect(result.cypher_query).toContain('createLogger')
    })

    it('应该提取驼峰命名的标识符', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('find UserService class')
      expect(result.cypher_query).toContain('UserService')
    })

    it('应该限制实体数量避免过复杂查询', async () => {
      const manyWords = Array.from({ length: 20 }, (_, i) => `word${i}`).join(' ')
      
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query(manyWords)
      // 实体应该被限制在合理数量内（通过查询字符串长度间接验证）
      expect(result.cypher_query.length).toBeLessThan(2000)
    })
  })

  describe('Cypher查询生成', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该为函数查询生成正确的Cypher', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_function',
        metadata: { provider: 'rules', executionTime: 50 }
      })

      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('find function test')
      expect(result.cypher_query).toContain("n.type = 'Function'")
    })

    it('应该为类查询生成正确的Cypher', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_class',
        metadata: { provider: 'rules', executionTime: 50 }
      })

      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('find class test')
      expect(result.cypher_query).toContain("n.type = 'Class'")
    })

    it('应该包含正确的LIMIT子句', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('test query')
      expect(result.cypher_query).toContain('LIMIT 20')
    })
  })

  describe('结果增强', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该添加相关性评分', async () => {
      const mockNodes = [
        {
          id: '1',
          name: 'TestFunction',
          type: 'Function',
          properties: { description: 'A test function' }
        }
      ]

      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: mockNodes,
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('test function')
      expect(result.results.nodes[0]?.metadata?.relevance_score).toBeGreaterThan(0)
    })

    it('应该按相关性排序结果', async () => {
      const mockNodes = [
        {
          id: '1',
          name: 'OtherFunction',
          type: 'Function',
          properties: { description: 'Another function' }
        },
        {
          id: '2',
          name: 'TestFunction',
          type: 'Function',
          properties: { description: 'A test function' }
        }
      ]

      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: mockNodes,
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('test')
      // TestFunction应该排在前面，因为名称中包含"test"
      expect(result.results.nodes[0]?.name).toBe('TestFunction')
    })
  })

  describe('置信度计算', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('函数查询应该有较高置信度', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_function',
        metadata: { provider: 'ai', executionTime: 200 }
      })

      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('find function createLogger')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('未知意图查询应该有较低置信度', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'unknown',
        metadata: { provider: 'rules', executionTime: 50 }
      })

      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('random unclear query')
      expect(result.confidence).toBeLessThanOrEqual(0.5)
    })
  })

  describe('错误处理', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该处理Neo4j查询错误', async () => {
      mockNeo4jService.query.mockRejectedValueOnce(new Error('Neo4j connection failed'))

      await expect(queryEngine.query('test')).rejects.toThrow('Neo4j connection failed')
    })

    it('应该处理AI分析错误', async () => {
      mockHybridAIManager.analyze.mockRejectedValueOnce(new Error('AI service unavailable'))

      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      // 应该回退到规则匹配，而不是抛出异常
      const result = await queryEngine.query('test function')
      expect(result.intent).toBeDefined()
    })

    it('应该处理空查询', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('')
      expect(result.intent).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
    })
  })

  describe('性能指标', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该记录执行时间', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('test')
      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('应该包含Cypher查询用于调试', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('test')
      expect(result.cypher_query).toBeDefined()
      expect(typeof result.cypher_query).toBe('string')
    })
  })

  describe('结果结构验证', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该返回完整的查询结果结构', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 100 }
      })

      const result = await queryEngine.query('test')
      
      // 验证结果结构
      expect(result).toHaveProperty('intent')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('cypher_query')
      expect(result).toHaveProperty('execution_time_ms')
      
      // 验证results子结构
      expect(result.results).toHaveProperty('nodes')
      expect(result.results).toHaveProperty('relationships')
      expect(result.results).toHaveProperty('explanation')
      expect(result.results).toHaveProperty('suggestions')
      
      // 验证数据类型
      expect(Array.isArray(result.results.nodes)).toBe(true)
      expect(Array.isArray(result.results.relationships)).toBe(true)
      expect(Array.isArray(result.results.suggestions)).toBe(true)
      expect(typeof result.results.explanation).toBe('string')
    })
  })

  describe('附加查询意图覆盖', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该生成接口查询', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find interface UserInterface')
      expect(result.intent).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('应该生成依赖关系查询', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find depends on UserService')
      expect(result.intent).toBeDefined()
      expect(result.cypher_query).toBeDefined()
    })

    it('应该生成使用情况查询', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find usage of createLogger')
      expect(result.intent).toBeDefined()
      expect(result.cypher_query).toBeDefined()
    })

    it('应该生成相关代码查询', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find related to UserService')
      expect(result.intent).toBeDefined()
      expect(result.cypher_query).toBeDefined()
    })

    it('应该生成路径查询', async () => {
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find path from UserService to createLogger')
      expect(result.intent).toBeDefined()
      expect(result.cypher_query).toBeDefined()
    })
  })

  describe('获取统计信息', () => {
    it('应该获取知识图谱统计信息', async () => {
      await queryEngine.connect()
      mockNeo4jService.getStats.mockResolvedValueOnce({
        nodeCount: 100,
        relationshipCount: 200,
        labelCounts: { Function: 50, Class: 30 }
      })
      
      const stats = await queryEngine.getStats()
      expect(stats).toBeDefined()
      expect(stats.nodeCount).toBe(100)
    })

    it('未连接时获取统计信息应该抛出错误', async () => {
      const disconnectedEngine = new IntelligentQueryEngine()
      
      await expect(disconnectedEngine.getStats()).rejects.toThrow('查询引擎未连接到知识图谱')
    })
  })

  describe('断开连接边界情况', () => {
    it('已断开连接时再次断开应该正常处理', async () => {
      await queryEngine.disconnect()
      await queryEngine.disconnect() // Should not throw
      
      expect(queryEngine['neo4jService']).toBeNull()
    })

    it('未连接状态下断开连接应该正常处理', async () => {
      const newEngine = new IntelligentQueryEngine()
      await newEngine.disconnect() // Should not throw
      
      expect(newEngine['neo4jService']).toBeNull()
    })
  })

  describe('查询生成边界情况', () => {
    beforeEach(async () => {
      await queryEngine.connect()
    })

    it('应该处理空实体的接口查询', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_interface',
        metadata: { provider: 'rules', executionTime: 50 }
      })
      
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find interface')
      expect(result.intent).toBe('find_interface')
      expect(result.cypher_query).toContain('Interface')
    })

    it('应该处理空实体的依赖关系查询', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_dependencies',
        metadata: { provider: 'rules', executionTime: 50 }
      })
      
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find depends')
      expect(result.intent).toBe('find_dependencies')
      expect(result.cypher_query).toContain('DEPENDS_ON')
    })

    it('应该处理空实体的使用情况查询', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_usage',
        metadata: { provider: 'rules', executionTime: 50 }
      })
      
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find usage')
      expect(result.intent).toBe('find_usage')
      expect(result.cypher_query).toContain('USES')
    })

    it('应该处理空实体的相关代码查询', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'find_related',
        metadata: { provider: 'rules', executionTime: 50 }
      })
      
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find related')
      expect(result.intent).toBe('find_related')
      expect(result.cypher_query).toContain('[r*1..2]')
    })

    it('应该处理少于2个实体的路径查询', async () => {
      mockHybridAIManager.analyze.mockResolvedValueOnce({
        success: true,
        content: 'analyze_path',
        metadata: { provider: 'rules', executionTime: 50 }
      })
      
      mockNeo4jService.query.mockResolvedValueOnce({
        records: [],
        nodes: [],
        relationships: [],
        metadata: { query_time_ms: 50 }
      })

      const result = await queryEngine.query('find path from UserService')
      expect(result.intent).toBe('analyze_path')
      expect(result.cypher_query).toContain('shortestPath')
    })
  })
})