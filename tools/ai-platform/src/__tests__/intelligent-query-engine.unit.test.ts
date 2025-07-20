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
})