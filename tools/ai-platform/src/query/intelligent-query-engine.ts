/**
 * 智能查询引擎
 *
 * 基于自然语言查询代码知识图谱的核心引擎
 * LinchKit Graph RAG Phase 4 核心功能
 */

import { createLogger } from '@linch-kit/core/server'

import type { GraphNode, GraphRelationship, QueryResult, Logger } from '../types/index.js'
import { Neo4jService } from '../graph/neo4j-service.js'
import { loadNeo4jConfig } from '../config/neo4j-config.js'

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
  private intentPatterns: Map<QueryIntent, RegExp[]> = new Map()

  constructor() {
    this.logger = createLogger({ name: 'ai:intelligent-query-engine' })
    this.initializeIntentPatterns()
  }

  /**
   * 初始化意图识别模式
   */
  private initializeIntentPatterns(): void {
    this.intentPatterns = new Map([
      [
        'find_function',
        [
          /查找.*函数/i,
          /找.*function/i,
          /函数.*在哪/i,
          /how.*function/i,
          /where.*function/i,
          /function.*definition/i,
        ],
      ],
      [
        'find_class',
        [
          /查找.*类/i,
          /找.*class/i,
          /类.*在哪/i,
          /where.*class/i,
          /class.*definition/i,
          /找到.*类/i,
          /所有.*类/i,
          /显示.*类/i,
          /.*相关.*类/i,
          /.*类型/i,
          /.*组件/i,
          /component/i,
          /React.*组件/i,
        ],
      ],
      [
        'find_interface',
        [
          /查找.*接口/i,
          /找.*interface/i,
          /接口.*在哪/i,
          /where.*interface/i,
          /interface.*definition/i,
          /找到.*接口/i,
          /所有.*接口/i,
          /显示.*接口/i,
          /.*相关.*接口/i,
          /Schema.*接口/i,
        ],
      ],
      [
        'find_dependencies',
        [/依赖.*关系/i, /谁依赖/i, /dependencies/i, /depends.*on/i, /imports.*from/i, /使用.*包/i],
      ],
      [
        'find_usage',
        [/谁.*使用/i, /在哪.*调用/i, /usage.*of/i, /used.*by/i, /references.*to/i, /调用.*关系/i],
      ],
      [
        'find_related',
        [/相关.*代码/i, /related.*to/i, /similar.*to/i, /关联.*的/i, /connected.*to/i],
      ],
      [
        'analyze_path',
        [/路径.*分析/i, /how.*connect/i, /从.*到/i, /path.*between/i, /connection.*path/i],
      ],
      [
        'explain_concept',
        [/解释.*是什么/i, /什么是/i, /explain.*what/i, /what.*is/i, /describe/i, /告诉我.*关于/i],
      ],
      [
        'find_general',
        [
          // 通用查找模式 - 提高中文查询识别
          /查找.*\w+/i,
          /搜索.*\w+/i,
          /寻找.*\w+/i,
          /找.*\w+/i,
          /.*相关/i,
          /.*架构/i,
          /.*设计/i,
          /.*实现/i,
          /.*配置/i,
          /.*工具/i,
          /.*模块/i,
          /.*插件/i,
          /.*系统/i,
          /test/i,
          /测试/i,
          /linchkit/i,
          /框架/i,
          /API/i,
          /接口/i,
        ],
      ],
    ])
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
      const context = this.parseQuery(userQuery)
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
  private parseQuery(userQuery: string): QueryContext {
    const entities = this.extractEntities(userQuery)
    const intent = this.recognizeIntent(userQuery)

    return {
      user_query: userQuery,
      intent,
      entities,
      filters: {},
      limit: 20,
    }
  }

  /**
   * 识别查询意图
   */
  private recognizeIntent(query: string): QueryIntent {
    for (const [intent, patterns] of this.intentPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          return intent
        }
      }
    }
    return 'unknown'
  }

  /**
   * 提取实体（函数名、类名、关键词等）
   */
  private extractEntities(query: string): string[] {
    const entities: string[] = []

    // 提取引号中的精确匹配
    const quotedMatches = query.match(/"([^"]+)"/g)
    if (quotedMatches) {
      entities.push(...quotedMatches.map(m => m.slice(1, -1)))
    }

    // 提取驼峰命名的标识符
    const camelCaseMatches = query.match(/[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*/g)
    if (camelCaseMatches) {
      entities.push(...camelCaseMatches)
    }

    // 提取常见的代码关键词
    const codeKeywords = query.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g)
    if (codeKeywords) {
      // 过滤掉常见的停用词
      const stopWords = new Set([
        // 英文停用词
        'the',
        'is',
        'are',
        'was',
        'were',
        'in',
        'on',
        'at',
        'by',
        'for',
        'with',
        'to',
        'from',
        'and',
        'or',
        'but',
        'how',
        'what',
        'where',
        'when',
        'why',
        'can',
        'will',
        'should',
        'would',
        'could',
        // 中文停用词
        '查找',
        '找',
        '搜索',
        '寻找',
        '是',
        '的',
        '了',
        '在',
        '有',
        '和',
        '与',
        '或',
        '但',
        '函数',
        '类',
        '接口',
        '代码',
        '模块',
        '组件',
        '方法',
        '属性',
        '参数',
        '怎么',
        '什么',
        '哪里',
        '为什么',
        '如何',
        '能否',
        '是否',
        '可以',
      ])
      const filteredKeywords = codeKeywords.filter(
        word => !stopWords.has(word.toLowerCase()) && word.length > 2
      )
      entities.push(...filteredKeywords)
    }

    return [...new Set(entities)] // 去重
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
   * 增强查询结果
   */
  private async enhanceResults(
    context: QueryContext,
    graphResult: QueryResult
  ): Promise<QueryResult> {
    // TODO: 实现结果排序、相关性评分、上下文补充等增强逻辑
    return graphResult
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
