/**
 * Neo4j 内置向量搜索 PoC
 * 
 * 验证Neo4j 5.x的向量搜索能力，作为Qdrant的替代方案
 * 最小化架构复杂度，利用现有Neo4j基础设施
 */

import { createLogger } from '@linch-kit/core'
import { Neo4jService } from '../core/graph/neo4j-service'
import { loadNeo4jConfig } from '../core/config/neo4j-config'

const logger = createLogger('neo4j-vector-poc')

export interface VectorSearchRequest {
  query: string
  queryVector?: number[]
  limit?: number
  scoreThreshold?: number
  nodeTypes?: string[]
}

export interface VectorSearchResult {
  nodeId: string
  score: number
  node: {
    id: string
    type: string
    name: string
    properties: Record<string, any>
  }
}

export interface HybridSearchResult {
  vectorResults: VectorSearchResult[]
  graphResults: any[]
  fusedResults: any[]
  executionTime: number
  strategy: 'vector_only' | 'graph_only' | 'hybrid'
}

export class Neo4jVectorSearchPoC {
  private neo4jService: Neo4jService | null = null
  private vectorIndexName = 'code_semantics_vector_index'
  private vectorPropertyName = 'semantic_vector'

  constructor() {}

  /**
   * 初始化连接和向量索引
   */
  async initialize(): Promise<void> {
    try {
      const config = await loadNeo4jConfig()
      this.neo4jService = new Neo4jService(config)
      await this.neo4jService.connect()
      
      logger.info('Neo4j Vector Search PoC 初始化成功')
      
      // 检查是否支持向量功能
      await this.checkVectorSupport()
      
      // 创建向量索引（如果不存在）
      await this.createVectorIndexIfNotExists()
      
    } catch (error) {
      logger.error('Neo4j Vector Search PoC 初始化失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 检查Neo4j是否支持向量功能
   */
  async checkVectorSupport(): Promise<boolean> {
    try {
      const result = await this.neo4jService!.query(`
        CALL dbms.procedures() 
        YIELD name 
        WHERE name CONTAINS 'vector' 
        RETURN count(name) as vectorProcedures
      `)
      
      const vectorProcedures = result.records[0]?.get?.('vectorProcedures') || 0
      const hasVectorSupport = vectorProcedures > 0
      
      logger.info('Neo4j向量支持检查', { 
        vectorProcedures: Number(vectorProcedures),
        hasSupport: hasVectorSupport 
      })
      
      if (!hasVectorSupport) {
        logger.warn('当前Neo4j实例可能不支持向量搜索功能')
      }
      
      return hasVectorSupport
    } catch (error) {
      logger.error('检查向量支持失败', error instanceof Error ? error : undefined)
      return false
    }
  }

  /**
   * 创建向量索引
   */
  async createVectorIndexIfNotExists(): Promise<void> {
    try {
      // 检查索引是否已存在
      const existingIndexes = await this.neo4jService!.query(`
        SHOW INDEXES 
        WHERE name = $indexName
      `, { indexName: this.vectorIndexName })
      
      if (existingIndexes.records.length > 0) {
        logger.info('向量索引已存在，跳过创建', { indexName: this.vectorIndexName })
        return
      }
      
      // 创建向量索引
      const createIndexQuery = `
        CREATE VECTOR INDEX ${this.vectorIndexName} IF NOT EXISTS
        FOR (n:GraphNode) 
        ON (n.${this.vectorPropertyName})
        OPTIONS {
          indexConfig: {
            \`vector.dimensions\`: 1536,
            \`vector.similarity_function\`: 'cosine'
          }
        }
      `
      
      await this.neo4jService!.query(createIndexQuery)
      
      logger.info('向量索引创建成功', { 
        indexName: this.vectorIndexName,
        dimensions: 1536,
        similarity: 'cosine'
      })
      
    } catch (error) {
      // 如果创建失败，可能是版本不支持，记录但不抛出异常
      logger.warn('向量索引创建失败，将使用传统图搜索', error instanceof Error ? error : undefined)
    }
  }

  /**
   * 执行向量搜索
   */
  async vectorSearch(request: VectorSearchRequest): Promise<VectorSearchResult[]> {
    if (!this.neo4jService) {
      throw new Error('Neo4j服务未初始化')
    }

    try {
      if (!request.queryVector) {
        throw new Error('向量搜索需要提供queryVector')
      }

      const searchQuery = `
        CALL db.index.vector.queryNodes($indexName, $k, $queryVector)
        YIELD node, score
        ${request.nodeTypes ? 'WHERE node.type IN $nodeTypes' : ''}
        ${request.scoreThreshold ? 'AND score >= $scoreThreshold' : ''}
        RETURN 
          elementId(node) as nodeId,
          score,
          node.id as id,
          node.type as type,
          node.name as name,
          properties(node) as properties
        ORDER BY score DESC
        LIMIT $limit
      `

      const result = await this.neo4jService.query(searchQuery, {
        indexName: this.vectorIndexName,
        k: request.limit || 10,
        queryVector: request.queryVector,
        nodeTypes: request.nodeTypes,
        scoreThreshold: request.scoreThreshold,
        limit: request.limit || 10
      })

      const vectorResults: VectorSearchResult[] = result.records.map(record => ({
        nodeId: record.get('nodeId'),
        score: Number(record.get('score')),
        node: {
          id: record.get('id'),
          type: record.get('type'),
          name: record.get('name'),
          properties: record.get('properties') || {}
        }
      }))

      logger.info('向量搜索完成', {
        resultCount: vectorResults.length,
        query: request.query.substring(0, 50),
        bestScore: vectorResults[0]?.score
      })

      return vectorResults

    } catch (error) {
      logger.error('向量搜索失败', error instanceof Error ? error : undefined)
      // 返回空结果而不是抛出异常，允许降级到图搜索
      return []
    }
  }

  /**
   * 混合搜索：结合向量搜索和图搜索
   */
  async hybridSearch(request: VectorSearchRequest): Promise<HybridSearchResult> {
    const startTime = Date.now()
    
    try {
      // 1. 并行执行向量搜索和图搜索
      const [vectorResults, graphResults] = await Promise.all([
        this.vectorSearch(request).catch(() => []),  // 向量搜索失败时返回空数组
        this.fallbackGraphSearch(request)
      ])

      // 2. 决定使用的策略
      let strategy: HybridSearchResult['strategy'] = 'hybrid'
      if (vectorResults.length === 0) {
        strategy = 'graph_only'
      } else if (graphResults.length === 0) {
        strategy = 'vector_only'
      }

      // 3. 融合结果
      const fusedResults = this.fuseResults(vectorResults, graphResults)

      const executionTime = Date.now() - startTime

      logger.info('混合搜索完成', {
        vectorCount: vectorResults.length,
        graphCount: graphResults.length,
        fusedCount: fusedResults.length,
        strategy,
        executionTime
      })

      return {
        vectorResults,
        graphResults,
        fusedResults,
        executionTime,
        strategy
      }

    } catch (error) {
      logger.error('混合搜索失败', error instanceof Error ? error : undefined)
      
      // 完全降级到图搜索
      const graphResults = await this.fallbackGraphSearch(request)
      const executionTime = Date.now() - startTime

      return {
        vectorResults: [],
        graphResults,
        fusedResults: graphResults,
        executionTime,
        strategy: 'graph_only'
      }
    }
  }

  /**
   * 降级图搜索（使用现有逻辑）
   */
  private async fallbackGraphSearch(request: VectorSearchRequest): Promise<any[]> {
    try {
      // 使用简化的图搜索逻辑
      const searchTerms = this.extractSearchTerms(request.query)
      const searchConditions = searchTerms
        .map(term => `n.name CONTAINS '${term}' OR n.description CONTAINS '${term}'`)
        .join(' OR ')

      const query = `
        MATCH (n:GraphNode)
        WHERE ${searchConditions}
        ${request.nodeTypes ? 'AND n.type IN $nodeTypes' : ''}
        RETURN n
        ORDER BY n.name
        LIMIT $limit
      `

      const result = await this.neo4jService!.query(query, {
        nodeTypes: request.nodeTypes,
        limit: request.limit || 10
      })

      return result.nodes.map(node => ({
        nodeId: node.id,
        score: 0.5, // 固定评分
        node: {
          id: node.id,
          type: node.type,
          name: node.name,
          properties: node.properties || {}
        }
      }))

    } catch (error) {
      logger.error('降级图搜索失败', error instanceof Error ? error : undefined)
      return []
    }
  }

  /**
   * 提取搜索词（简化版）
   */
  private extractSearchTerms(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2)
      .slice(0, 5) // 限制搜索词数量
  }

  /**
   * 融合向量搜索和图搜索结果
   */
  private fuseResults(vectorResults: VectorSearchResult[], graphResults: any[]): any[] {
    const resultMap = new Map<string, any>()
    
    // 添加向量搜索结果（高权重）
    vectorResults.forEach((result, index) => {
      resultMap.set(result.node.id, {
        ...result,
        finalScore: result.score * 0.7 + (1 - index / vectorResults.length) * 0.3,
        source: 'vector'
      })
    })
    
    // 添加图搜索结果（低权重）
    graphResults.forEach((result, index) => {
      const existingResult = resultMap.get(result.node.id)
      if (existingResult) {
        // 如果已存在，提高分数
        existingResult.finalScore += 0.2
        existingResult.source = 'hybrid'
      } else {
        resultMap.set(result.node.id, {
          ...result,
          finalScore: 0.3 + (1 - index / graphResults.length) * 0.2,
          source: 'graph'
        })
      }
    })
    
    // 按最终分数排序
    return Array.from(resultMap.values())
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 10)
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.neo4jService) {
      await this.neo4jService.disconnect()
      this.neo4jService = null
      logger.info('Neo4j Vector Search PoC 已断开连接')
    }
  }

  /**
   * 获取向量索引状态
   */
  async getIndexStatus(): Promise<{
    exists: boolean
    nodeCount?: number
    vectorCount?: number
  }> {
    try {
      // 检查索引是否存在
      const indexResult = await this.neo4jService!.query(`
        SHOW INDEXES 
        WHERE name = $indexName
        RETURN count(*) as indexCount
      `, { indexName: this.vectorIndexName })
      
      const exists = Number(indexResult.records[0]?.get?.('indexCount') || 0) > 0
      
      if (!exists) {
        return { exists: false }
      }
      
      // 获取向量化节点数量
      const vectorCountResult = await this.neo4jService!.query(`
        MATCH (n:GraphNode)
        WHERE n.${this.vectorPropertyName} IS NOT NULL
        RETURN count(n) as vectorCount
      `)
      
      const vectorCount = Number(vectorCountResult.records[0]?.get?.('vectorCount') || 0)
      
      // 获取总节点数量
      const nodeCountResult = await this.neo4jService!.query(`
        MATCH (n:GraphNode)
        RETURN count(n) as nodeCount
      `)
      
      const nodeCount = Number(nodeCountResult.records[0]?.get?.('nodeCount') || 0)
      
      return {
        exists: true,
        nodeCount,
        vectorCount
      }
      
    } catch (error) {
      logger.error('获取索引状态失败', error instanceof Error ? error : undefined)
      return { exists: false }
    }
  }
}

// 工厂函数
export function createNeo4jVectorSearchPoC(): Neo4jVectorSearchPoC {
  return new Neo4jVectorSearchPoC()
}