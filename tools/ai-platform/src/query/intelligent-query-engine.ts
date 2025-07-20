/**
 * 智能查询引擎
 *
 * 基于自然语言查询代码知识图谱的核心引擎
 * LinchKit Graph RAG Phase 4 核心功能
 */

import { createLogger } from '@linch-kit/core/server'

import type { GraphNode, GraphRelationship, QueryResult, Logger } from '../types/index.js'
import { Neo4jService } from '../core/graph/neo4j-service.js'
import { loadNeo4jConfig } from '../core/config/neo4j-config.js'

/**
 * 查询意图类型
 */
export type QueryIntent =
  | 'find_function' // 查找函数
  | 'find_class' // 查找类
  | 'find_interface' // 查找接口
  | 'find_dependencies' // 查找依赖关系
  | 'find_usage' // 查找使用情况
  | 'find_related' // 查找相关代码
  | 'analyze_path' // 分析代码路径
  | 'explain_concept' // 解释概念
  | 'find_general' // 通用查找
  | 'unknown' // 未知意图

/**
 * 查询结果类型
 */
export interface IntelligentQueryResult {
  intent: QueryIntent
  confidence: number
  results: {
    nodes: GraphNode[]
    relationships: GraphRelationship[]
    explanation: string
    suggestions: string[]
  }
  cypher_query?: string
  execution_time_ms: number
}

/**
 * 查询上下文
 */
export interface QueryContext {
  user_query: string
  intent: QueryIntent
  entities: string[]
  filters: Record<string, unknown>
  limit: number
}

/**
 * 智能查询引擎
 */
export class IntelligentQueryEngine {
  private neo4jService: Neo4jService | null = null
  private logger: Logger

  constructor() {
    this.logger = createLogger({ name: 'ai:intelligent-query-engine' })
  }

  /**
   * 连接到知识图谱
   */
  async connect(): Promise<void> {
    try {
      const config = await loadNeo4jConfig()
      this.neo4jService = new Neo4jService(config)
      await this.neo4jService.connect()
      this.logger.info('智能查询引擎已连接到知识图谱')
    } catch (error) {
      this.logger.error('连接知识图谱失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.neo4jService) {
      await this.neo4jService.disconnect()
      this.neo4jService = null
      this.logger.info('智能查询引擎已断开连接')
    }
  }

  /**
   * 获取知识图谱统计信息
   */
  async getStats() {
    if (!this.neo4jService) {
      throw new Error('查询引擎未连接到知识图谱')
    }
    return await this.neo4jService.getStats()
  }

  /**
   * 执行智能查询
   */
  async query(userQuery: string): Promise<IntelligentQueryResult> {
    const startTime = Date.now()

    try {
      this.logger.info('开始智能查询', { userQuery })

      if (!this.neo4jService) {
        throw new Error('查询引擎未连接到知识图谱')
      }

      // 1. 解析查询意图
      const context = await this.parseQuery(userQuery)
      this.logger.debug('查询意图解析完成', {
        intent: context.intent,
        entities: context.entities,
        limit: context.limit,
      })

      // 2. 生成 Cypher 查询
      const cypherQuery = this.generateCypherQuery(context)
      this.logger.debug('Cypher 查询生成', { cypherQuery })

      // 3. 执行图数据库查询
      const graphResult = await this.neo4jService.query(cypherQuery)

      // 4. 后处理和增强结果
      const enhancedResult = await this.enhanceResults(context, graphResult)

      const executionTime = Date.now() - startTime

      const result: IntelligentQueryResult = {
        intent: context.intent,
        confidence: this.calculateConfidence(context),
        results: {
          nodes: enhancedResult.nodes,
          relationships: enhancedResult.relationships,
          explanation: this.generateExplanation(context, enhancedResult),
          suggestions: this.generateSuggestions(context, enhancedResult),
        },
        cypher_query: cypherQuery,
        execution_time_ms: executionTime,
      }

      this.logger.info('智能查询完成', {
        intent: result.intent,
        confidence: result.confidence,
        nodeCount: result.results.nodes.length,
        relationshipCount: result.results.relationships.length,
        executionTime,
      })

      return result
    } catch (error) {
      this.logger.error('智能查询失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 解析用户查询，识别意图和提取实体
   */
  private async parseQuery(userQuery: string): Promise<QueryContext> {
    const entities = this.extractEntities(userQuery)
    const intent = await this.recognizeIntent(userQuery)

    return {
      user_query: userQuery,
      intent,
      entities,
      filters: {},
      limit: 20,
    }
  }

  /**
   * 识别查询意图 - 使用AI动态分析
   */
  private async recognizeIntent(query: string): Promise<QueryIntent> {
    try {
      // 使用现有的HybridAIManager来处理意图识别
      const { createHybridAIManager } = await import('../providers/hybrid-ai-manager.js')
      const aiManager = createHybridAIManager()
      
      const result = await aiManager.analyze({
        prompt: `分析以下查询的意图，返回最匹配的意图类型：

查询: "${query}"

可能的意图类型：
- find_function: 查找函数/方法
- find_class: 查找类/组件/接口
- find_interface: 查找接口定义
- find_dependencies: 查找依赖关系
- find_usage: 查找使用情况
- find_related: 查找相关代码
- analyze_path: 分析代码路径
- explain_concept: 解释概念
- find_general: 通用查找
- unknown: 未知意图

只返回意图类型，不要额外解释：`,
        requiresAI: false, // 优先使用规则引擎
        ruleBasedFallback: () => this.fallbackIntentRecognition(query)
      })
      
      if (result.success && result.content.trim()) {
        const extractedIntent = result.content.trim() as QueryIntent
        if (this.isValidIntent(extractedIntent)) {
          this.logger.debug('AI意图识别完成', { 
            query: query.substring(0, 50), 
            intent: extractedIntent 
          })
          return extractedIntent
        }
      }
      
      return this.fallbackIntentRecognition(query)
      
    } catch (error) {
      this.logger.warn('AI意图识别失败，使用备用方案', error instanceof Error ? error : undefined)
      return this.fallbackIntentRecognition(query)
    }
  }

  /**
   * 验证意图类型是否有效
   */
  private isValidIntent(intent: string): intent is QueryIntent {
    const validIntents: QueryIntent[] = [
      'find_function', 'find_class', 'find_interface', 'find_dependencies',
      'find_usage', 'find_related', 'analyze_path', 'explain_concept',
      'find_general', 'unknown'
    ]
    return validIntents.includes(intent as QueryIntent)
  }

  /**
   * 备用意图识别（基于规则）
   */
  private fallbackIntentRecognition(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase()
    
    // 简化的规则匹配
    if (lowerQuery.includes('function') || lowerQuery.includes('函数')) {
      return 'find_function'
    }
    if (lowerQuery.includes('class') || lowerQuery.includes('类') || lowerQuery.includes('组件')) {
      return 'find_class'
    }
    if (lowerQuery.includes('interface') || lowerQuery.includes('接口')) {
      return 'find_interface'
    }
    if (lowerQuery.includes('依赖') || lowerQuery.includes('depends')) {
      return 'find_dependencies'
    }
    if (lowerQuery.includes('使用') || lowerQuery.includes('usage')) {
      return 'find_usage'
    }
    if (lowerQuery.includes('相关') || lowerQuery.includes('related')) {
      return 'find_related'
    }
    if (lowerQuery.includes('路径') || lowerQuery.includes('path')) {
      return 'analyze_path'
    }
    if (lowerQuery.includes('解释') || lowerQuery.includes('什么是') || lowerQuery.includes('explain')) {
      return 'explain_concept'
    }
    
    return 'find_general'
  }

  /**
   * 提取实体（函数名、类名、关键词等）- 改进版
   */
  private extractEntities(query: string): string[] {
    const entities: string[] = []

    // 直接使用原始查询，不做预处理

    // 1. 提取引号中的精确匹配
    const quotedMatches = query.match(/"([^"]+)"/g)
    if (quotedMatches) {
      entities.push(...quotedMatches.map(m => m.slice(1, -1)))
    }

    // 2. 提取驼峰命名的标识符
    const camelCaseMatches = query.match(/[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*/g)
    if (camelCaseMatches) {
      entities.push(...camelCaseMatches)
    }

    // 3. 提取常见的代码关键词（简化版）
    const codeKeywords = query.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g)
    if (codeKeywords) {
      const filteredKeywords = codeKeywords.filter(word => 
        word.length > 2 && !entities.includes(word)
      )
      entities.push(...filteredKeywords)
    }

    return [...new Set(entities)].slice(0, 10) // 去重并限制数量
  }


  /**
   * 根据意图生成相应的 Cypher 查询
   */
  private generateCypherQuery(context: QueryContext): string {
    const { intent, entities, limit } = context

    switch (intent) {
      case 'find_function':
        return this.generateFunctionQuery(entities, limit)

      case 'find_class':
        return this.generateClassQuery(entities, limit)

      case 'find_interface':
        return this.generateInterfaceQuery(entities, limit)

      case 'find_dependencies':
        return this.generateDependenciesQuery(entities, limit)

      case 'find_usage':
        return this.generateUsageQuery(entities, limit)

      case 'find_related':
        return this.generateRelatedQuery(entities, limit)

      case 'analyze_path':
        return this.generatePathQuery(entities, limit)

      case 'explain_concept':
        return this.generateConceptQuery(entities, limit)

      case 'find_general':
        return this.generateGenericQuery(entities, limit)

      default:
        return this.generateGenericQuery(entities, limit)
    }
  }

  /**
   * 生成函数查询
   */
  private generateFunctionQuery(entities: string[], limit: number): string {
    if (entities.length === 0) {
      return `
        MATCH (n:GraphNode)
        WHERE n.type = 'Function'
        RETURN n
        ORDER BY n.name
        LIMIT ${limit}
      `
    }

    const nameConditions = entities.map(entity => `n.name CONTAINS '${entity}'`).join(' OR ')

    return `
      MATCH (n:GraphNode)
      WHERE n.type = 'Function' AND (${nameConditions})
      RETURN n
      ORDER BY n.name
      LIMIT ${limit}
    `
  }

  /**
   * 生成类查询
   */
  private generateClassQuery(entities: string[], limit: number): string {
    if (entities.length === 0) {
      return `
        MATCH (n:GraphNode)
        WHERE n.type = 'Class'
        RETURN n
        ORDER BY n.name
        LIMIT ${limit}
      `
    }

    const nameConditions = entities.map(entity => `n.name CONTAINS '${entity}'`).join(' OR ')

    return `
      MATCH (n:GraphNode)
      WHERE n.type = 'Class' AND (${nameConditions})
      RETURN n
      ORDER BY n.name
      LIMIT ${limit}
    `
  }

  /**
   * 生成接口查询
   */
  private generateInterfaceQuery(entities: string[], limit: number): string {
    if (entities.length === 0) {
      return `
        MATCH (n:GraphNode)
        WHERE n.type = 'Interface'
        RETURN n
        ORDER BY n.name
        LIMIT ${limit}
      `
    }

    const nameConditions = entities.map(entity => `n.name CONTAINS '${entity}'`).join(' OR ')

    return `
      MATCH (n:GraphNode)
      WHERE n.type = 'Interface' AND (${nameConditions})
      RETURN n
      ORDER BY n.name
      LIMIT ${limit}
    `
  }

  /**
   * 生成依赖关系查询
   */
  private generateDependenciesQuery(entities: string[], limit: number): string {
    if (entities.length === 0) {
      return `
        MATCH (source)-[r]->(target)
        WHERE type(r) IN ['IMPORTS', 'DEPENDS_ON', 'EXTENDS', 'IMPLEMENTS']
        RETURN source, r, target
        LIMIT ${limit}
      `
    }

    const nameConditions = entities
      .map(entity => `source.name CONTAINS '${entity}' OR target.name CONTAINS '${entity}'`)
      .join(' OR ')

    return `
      MATCH (source)-[r]->(target)
      WHERE type(r) IN ['IMPORTS', 'DEPENDS_ON', 'EXTENDS', 'IMPLEMENTS'] AND (${nameConditions})
      RETURN source, r, target
      LIMIT ${limit}
    `
  }

  /**
   * 生成使用情况查询
   */
  private generateUsageQuery(entities: string[], limit: number): string {
    if (entities.length === 0) {
      return `
        MATCH (used)<-[r]-(user)
        WHERE type(r) IN ['CALLS', 'USES', 'IMPORTS', 'REFERENCES']
        RETURN used, r, user
        LIMIT ${limit}
      `
    }

    const nameConditions = entities.map(entity => `used.name CONTAINS '${entity}'`).join(' OR ')

    return `
      MATCH (used)<-[r]-(user)
      WHERE type(r) IN ['CALLS', 'USES', 'IMPORTS', 'REFERENCES'] AND (${nameConditions})
      RETURN used, r, user
      LIMIT ${limit}
    `
  }

  /**
   * 生成相关代码查询
   */
  private generateRelatedQuery(entities: string[], limit: number): string {
    if (entities.length === 0) {
      return `
        MATCH (n:GraphNode)-[r*1..2]-(related:GraphNode)
        WHERE ANY(rel IN r WHERE type(rel) IN ['CALLS', 'EXTENDS', 'IMPLEMENTS', 'IMPORTS', 'USES'])
        RETURN n, r, related
        LIMIT ${limit}
      `
    }

    const nameConditions = entities.map(entity => `n.name CONTAINS '${entity}'`).join(' OR ')

    return `
      MATCH (n:GraphNode)-[r*1..2]-(related:GraphNode)
      WHERE (${nameConditions}) AND ANY(rel IN r WHERE type(rel) IN ['CALLS', 'EXTENDS', 'IMPLEMENTS', 'IMPORTS', 'USES'])
      RETURN n, r, related
      LIMIT ${limit}
    `
  }

  /**
   * 生成路径分析查询
   */
  private generatePathQuery(entities: string[], limit: number): string {
    if (entities.length < 2) {
      return `
        MATCH p = (start:GraphNode)-[*1..3]-(end:GraphNode)
        RETURN p
        LIMIT ${limit}
      `
    }

    const [startEntity, endEntity] = entities
    return `
      MATCH p = shortestPath((start:GraphNode)-[*]-(end:GraphNode))
      WHERE start.name CONTAINS '${startEntity}' AND end.name CONTAINS '${endEntity}'
      RETURN p
      LIMIT ${limit}
    `
  }

  /**
   * 生成概念解释查询
   */
  private generateConceptQuery(entities: string[], limit: number): string {
    if (entities.length === 0) {
      return `
        MATCH (n:GraphNode)
        RETURN n
        ORDER BY n.name
        LIMIT ${limit}
      `
    }

    const nameConditions = entities
      .map(entity => `n.name CONTAINS '${entity}' OR n.description CONTAINS '${entity}'`)
      .join(' OR ')

    return `
      MATCH (n:GraphNode)
      WHERE ${nameConditions}
      RETURN n
      ORDER BY n.name
      LIMIT ${limit}
    `
  }

  /**
   * 生成通用查询
   */
  private generateGenericQuery(entities: string[], limit: number): string {
    if (entities.length === 0) {
      return `
        MATCH (n:GraphNode)
        RETURN n
        ORDER BY n.name
        LIMIT ${limit}
      `
    }

    const searchConditions = entities
      .map(
        entity =>
          `n.name CONTAINS '${entity}' OR n.description CONTAINS '${entity}' OR n.file_path CONTAINS '${entity}'`
      )
      .join(' OR ')

    return `
      MATCH (n:GraphNode)
      WHERE ${searchConditions}
      RETURN n
      ORDER BY n.name
      LIMIT ${limit}
    `
  }

  /**
   * 增强查询结果 - 实现结果排序、相关性评分、上下文补充
   */
  private async enhanceResults(
    context: QueryContext,
    graphResult: QueryResult
  ): Promise<QueryResult> {
    try {
      // 1. 添加相关性评分
      const scoredNodes = this.addRelevanceScoring(graphResult.nodes, context)
      
      // 2. 智能排序
      const sortedNodes = this.intelligentSort(scoredNodes, context.intent)
      
      // 3. 补充上下文信息（限制查询数量避免性能问题）
      const enrichedNodes = await this.enrichWithContext(sortedNodes.slice(0, 10))
      
      // 4. 合并所有节点（保持原有未处理的节点）
      const finalNodes = [
        ...enrichedNodes,
        ...sortedNodes.slice(10) // 剩余节点保持原有排序
      ]
      
      return {
        ...graphResult,
        nodes: finalNodes,
        metadata: {
          ...graphResult.metadata,
          enhanced: true,
          enhancement_time_ms: Date.now() - (graphResult.metadata?.query_time_ms || 0)
        }
      }
    } catch (error) {
      this.logger.warn('结果增强失败，返回原始结果', error instanceof Error ? error : undefined)
      return graphResult
    }
  }

  /**
   * 添加相关性评分
   */
  private addRelevanceScoring(nodes: GraphNode[], context: QueryContext): GraphNode[] {
    const queryTerms = context.entities.map(e => e.toLowerCase())
    
    return nodes.map(node => {
      let relevanceScore = 0
      const nodeText = `${node.name} ${node.properties?.description || ''}`.toLowerCase()
      
      // 基于词汇匹配的相关性
      for (const term of queryTerms) {
        if (nodeText.includes(term)) {
          relevanceScore += node.name.toLowerCase().includes(term) ? 2 : 1
        }
      }
      
      // 基于节点类型和意图的匹配度
      const intentTypeMatch = this.getIntentTypeMatch(context.intent, node.type)
      relevanceScore *= intentTypeMatch
      
      return {
        ...node,
        metadata: {
          ...node.metadata,
          relevance_score: relevanceScore
        }
      }
    })
  }

  /**
   * 智能排序
   */
  private intelligentSort(nodes: GraphNode[], intent: QueryIntent): GraphNode[] {
    return nodes.sort((a, b) => {
      // 1. 优先考虑相关性分数
      const scoreA = a.metadata?.relevance_score || 0
      const scoreB = b.metadata?.relevance_score || 0
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }
      
      // 2. 基于意图的类型优先级
      const typeWeightA = this.getTypeWeight(intent, a.type)
      const typeWeightB = this.getTypeWeight(intent, b.type)
      
      if (typeWeightA !== typeWeightB) {
        return typeWeightB - typeWeightA
      }
      
      // 3. 按名称排序
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * 补充上下文信息
   */
  private async enrichWithContext(nodes: GraphNode[]): Promise<GraphNode[]> {
    const enrichedNodes = await Promise.all(
      nodes.map(async node => {
        try {
          // 查找直接相关的节点（限制查询深度避免性能问题）
          const relatedQuery = `
            MATCH (n:GraphNode {id: $nodeId})-[r]-(related:GraphNode)
            RETURN type(r) as relationType, count(related) as relatedCount
            LIMIT 5
          `
          
          const relatedResult = await this.neo4jService!.query(relatedQuery, { nodeId: node.id })
          
          const relationshipCounts = relatedResult.records.map(record => ({
            type: record.get('relationType'),
            count: Number(record.get('relatedCount'))
          }))
          
          return {
            ...node,
            metadata: {
              ...node.metadata,
              relationship_counts: relationshipCounts,
              context_enriched: true
            }
          }
        } catch (error) {
          // 如果查询失败，返回原节点
          return node
        }
      })
    )
    
    return enrichedNodes
  }

  /**
   * 获取意图与节点类型的匹配度
   */
  private getIntentTypeMatch(intent: QueryIntent, nodeType: string): number {
    const intentTypeMap: Record<QueryIntent, Record<string, number>> = {
      find_function: { 'Function': 2.0, 'Method': 1.8, 'API': 1.5 },
      find_class: { 'Class': 2.0, 'Interface': 1.5, 'Component': 1.3 },
      find_interface: { 'Interface': 2.0, 'Class': 1.5, 'API': 1.3 },
      find_dependencies: { 'Package': 1.8, 'Module': 1.5, 'Import': 1.3 },
      find_usage: { 'Function': 1.5, 'Class': 1.5, 'API': 1.8 },
      find_related: { '*': 1.0 }, // 所有类型同等权重
      analyze_path: { '*': 1.0 },
      explain_concept: { 'Concept': 2.0, 'Class': 1.5, 'Interface': 1.5 },
      find_general: { '*': 1.0 },
      unknown: { '*': 1.0 }
    }
    
    const typeWeights = intentTypeMap[intent] || {}
    return typeWeights[nodeType] || typeWeights['*'] || 1.0
  }

  /**
   * 获取类型权重
   */
  private getTypeWeight(intent: QueryIntent, nodeType: string): number {
    // 这是智能排序的辅助方法，与getIntentTypeMatch类似但用于排序
    return this.getIntentTypeMatch(intent, nodeType)
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(context: QueryContext): number {
    // 根据意图类型计算器本置信度
    const baseConfidence =
      {
        find_function: 0.8,
        find_class: 0.8,
        find_interface: 0.8,
        find_dependencies: 0.7,
        find_usage: 0.7,
        find_related: 0.6,
        analyze_path: 0.6,
        explain_concept: 0.7,
        find_general: 0.6,
        unknown: 0.3,
      }[context.intent] || 0.3

    // 根据实体数量调整置信度
    let entityBonus = 0
    if (context.entities.length >= 2) entityBonus = 0.2
    else if (context.entities.length === 1) entityBonus = 0.1

    return Math.min(1.0, baseConfidence + entityBonus)
  }

  /**
   * 生成解释文本
   */
  private generateExplanation(context: QueryContext, result: QueryResult): string {
    const { intent, entities } = context
    const nodeCount = result.nodes.length
    const relCount = result.relationships.length

    switch (intent) {
      case 'find_function':
        return `找到 ${nodeCount} 个与 "${entities.join(', ')}" 相关的函数`
      case 'find_class':
        return `找到 ${nodeCount} 个与 "${entities.join(', ')}" 相关的类`
      case 'find_interface':
        return `找到 ${nodeCount} 个与 "${entities.join(', ')}" 相关的接口`
      case 'find_dependencies':
        return `找到 ${relCount} 个与 "${entities.join(', ')}" 相关的依赖关系`
      case 'find_usage':
        return `找到 ${relCount} 个 "${entities.join(', ')}" 的使用情况`
      case 'find_related':
        return `找到 ${nodeCount} 个与 "${entities.join(', ')}" 相关的代码元素`
      default:
        return `找到 ${nodeCount} 个节点和 ${relCount} 个关系`
    }
  }

  /**
   * 生成建议
   */
  private generateSuggestions(context: QueryContext, result: QueryResult): string[] {
    const suggestions: string[] = []

    if (result.nodes.length === 0) {
      suggestions.push('尝试使用更宽泛的搜索词')
      suggestions.push('检查拼写是否正确')
      suggestions.push('尝试搜索相关的概念或模块')
    } else if (result.nodes.length >= 20) {
      suggestions.push('结果较多，尝试添加更具体的筛选条件')
      suggestions.push('使用引号进行精确匹配搜索')
    }

    // 根据意图提供特定建议
    switch (context.intent) {
      case 'find_function':
        suggestions.push('尝试搜索: "查找调用这个函数的地方"')
        suggestions.push('尝试搜索: "这个函数依赖哪些模块"')
        break
      case 'find_dependencies':
        suggestions.push('尝试搜索: "谁使用了这个依赖"')
        suggestions.push('尝试搜索: "分析从 A 到 B 的路径"')
        break
    }

    return suggestions
  }
}
