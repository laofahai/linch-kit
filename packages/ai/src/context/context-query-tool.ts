/**
 * Context Query Tool for Claude Code
 * 
 * 为 Claude Code 提供知识图谱查询能力
 * 只负责查询和返回上下文信息，不生成代码
 */

import { createLogger } from '@linch-kit/core/server'

import type { Logger } from '../types/index.js'
import { IntelligentQueryEngine } from '../query/intelligent-query-engine.js'
import { ContextAnalyzer } from '../generation/context-analyzer.js'
import type { GraphNode, GraphRelationship } from '../types/index.js'

/**
 * 上下文信息
 */
export interface ContextInfo {
  /** 相关的实体（类、接口、函数等） */
  entities: EntityInfo[]
  
  /** 实体间的关系 */
  relationships: RelationshipInfo[]
  
  /** 相关文档引用 */
  documentation: DocReference[]
  
  /** 使用示例 */
  examples: Example[]
  
  /** 查询元数据 */
  metadata: {
    query: string
    timestamp: string
    relevance_score: number
    total_results: number
  }
}

/**
 * 实体信息
 */
export interface EntityInfo {
  id: string
  name: string
  type: 'Class' | 'Interface' | 'Function' | 'Schema' | 'Component'
  package: string
  description?: string
  path?: string
  exports?: string[]
  relevance: number
}

/**
 * 关系信息
 */
export interface RelationshipInfo {
  from: string
  to: string
  type: 'IMPLEMENTS' | 'EXTENDS' | 'USES' | 'CALLS' | 'IMPORTS'
  description?: string
}

/**
 * 文档引用
 */
export interface DocReference {
  title: string
  path: string
  section?: string
  relevance: number
}

/**
 * 使用示例
 */
export interface Example {
  description: string
  code: string
  source: string
}

/**
 * 最佳实践
 */
export interface BestPractice {
  name: string
  description: string
  category: string
  examples: string[]
  references: string[]
}

/**
 * 代码模式
 */
export interface Pattern {
  name: string
  description: string
  usage: string
  related_entities: string[]
}

/**
 * Context Query Tool 接口
 */
export interface IContextQueryTool {
  /** 查询项目上下文 */
  queryContext(query: string): Promise<ContextInfo>
  
  /** 获取相关代码模式 */
  findPatterns(description: string): Promise<Pattern[]>
  
  /** 查找最佳实践 */
  getBestPractices(scenario: string): Promise<BestPractice[]>
}

/**
 * Context Query Tool 实现
 */
export class ContextQueryTool implements IContextQueryTool {
  private logger: Logger
  private queryEngine: IntelligentQueryEngine
  private contextAnalyzer: ContextAnalyzer
  private isInitialized = false

  constructor() {
    this.logger = createLogger({ name: 'ai:context-query-tool' })
    this.queryEngine = new IntelligentQueryEngine()
    this.contextAnalyzer = new ContextAnalyzer()
  }

  /**
   * 初始化工具
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      this.logger.info('初始化 Context Query Tool...')
      
      // 连接知识图谱
      await this.queryEngine.connect()
      
      this.isInitialized = true
      this.logger.info('Context Query Tool 初始化完成')
    } catch (error) {
      this.logger.error('Context Query Tool 初始化失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 查询项目上下文
   */
  async queryContext(query: string): Promise<ContextInfo> {
    await this.ensureInitialized()
    
    const startTime = Date.now()
    this.logger.info('开始查询上下文', { query })

    try {
      // 1. 使用智能查询引擎查询知识图谱
      const queryResult = await this.queryEngine.query(query)
      
      // 2. 分析查询结果
      const analysis = await this.contextAnalyzer.analyze(
        query,
        queryResult.results.nodes,
        queryResult.results.relationships
      )

      // 3. 组织上下文信息
      const contextInfo: ContextInfo = {
        entities: this.extractEntities(queryResult.results.nodes),
        relationships: this.extractRelationships(queryResult.results.relationships),
        documentation: this.findRelatedDocs(analysis),
        examples: this.findExamples(analysis),
        metadata: {
          query,
          timestamp: new Date().toISOString(),
          relevance_score: queryResult.confidence,
          total_results: queryResult.results.nodes.length
        }
      }

      const duration = Date.now() - startTime
      this.logger.info('上下文查询完成', {
        duration,
        entities: contextInfo.entities.length,
        relationships: contextInfo.relationships.length
      })

      return contextInfo
    } catch (error) {
      this.logger.error('上下文查询失败', error instanceof Error ? error : undefined, { query })
      throw error
    }
  }

  /**
   * 查找相关代码模式
   */
  async findPatterns(description: string): Promise<Pattern[]> {
    await this.ensureInitialized()
    
    this.logger.info('查找代码模式', { description })

    try {
      // 查询相关模式
      const context = await this.queryContext(description)
      
      // 从上下文中提取模式
      const patterns: Pattern[] = []
      
      // 分析实体间的关系模式
      const relationshipPatterns = this.analyzeRelationshipPatterns(
        context.entities,
        context.relationships
      )
      patterns.push(...relationshipPatterns)

      // 查找常见的使用模式
      const usagePatterns = this.findUsagePatterns(context)
      patterns.push(...usagePatterns)

      this.logger.info('找到代码模式', { count: patterns.length })
      return patterns
    } catch (error) {
      this.logger.error('查找模式失败', error instanceof Error ? error : undefined)
      return []
    }
  }

  /**
   * 获取最佳实践
   */
  async getBestPractices(scenario: string): Promise<BestPractice[]> {
    await this.ensureInitialized()
    
    this.logger.info('获取最佳实践', { scenario })

    try {
      const practices: BestPractice[] = []
      
      // LinchKit 核心最佳实践
      if (scenario.includes('日志') || scenario.includes('log')) {
        practices.push({
          name: '使用 LinchKit Logger',
          description: '使用 @linch-kit/core 的 createLogger 而不是 console.log',
          category: '日志管理',
          examples: [`import { createLogger } from '@linch-kit/core/server'`],
          references: ['@linch-kit/core/server']
        })
      }

      if (scenario.includes('配置') || scenario.includes('config')) {
        practices.push({
          name: '使用 ConfigManager',
          description: '使用 @linch-kit/core 的 ConfigManager 管理配置',
          category: '配置管理',
          examples: [`import { ConfigManager } from '@linch-kit/core'`],
          references: ['@linch-kit/core']
        })
      }

      if (scenario.includes('验证') || scenario.includes('schema')) {
        practices.push({
          name: '使用 Zod Schema',
          description: '使用 @linch-kit/schema 进行数据验证',
          category: '数据验证',
          examples: [`import { createSchema } from '@linch-kit/schema'`],
          references: ['@linch-kit/schema']
        })
      }

      if (scenario.includes('API') || scenario.includes('路由')) {
        practices.push({
          name: '使用 tRPC',
          description: '使用 @linch-kit/trpc 创建类型安全的 API',
          category: 'API 开发',
          examples: [`import { createProtectedProcedure } from '@linch-kit/trpc'`],
          references: ['@linch-kit/trpc']
        })
      }

      // 查询知识图谱获取更多最佳实践
      const context = await this.queryContext(`${scenario} 最佳实践`)
      const additionalPractices = this.extractBestPracticesFromContext(context)
      practices.push(...additionalPractices)

      this.logger.info('获取最佳实践完成', { count: practices.length })
      return practices
    } catch (error) {
      this.logger.error('获取最佳实践失败', error instanceof Error ? error : undefined)
      return []
    }
  }

  // === 私有辅助方法 ===

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private extractEntities(nodes: GraphNode[]): EntityInfo[] {
    return nodes.map(node => ({
      id: node.id,
      name: node.name || 'Unknown',
      type: node.type as EntityInfo['type'],
      package: ((node.metadata as Record<string, unknown>)?.metadata_package as string) || 'unknown',
      description: (node.properties?.description as string) || (node.properties?.prop_signature as string) || undefined,
      path: (node.properties?.prop_file_path as string) || (node.properties?.metadata_source_file as string) || undefined,
      exports: node.properties?.exports as string[] | undefined,
      relevance: this.calculateRelevance(node)
    })).sort((a, b) => b.relevance - a.relevance)
  }

  private extractRelationships(relationships: GraphRelationship[]): RelationshipInfo[] {
    return relationships.map(rel => ({
      from: rel.source,
      to: rel.target,
      type: rel.type as RelationshipInfo['type'],
      description: rel.properties?.description as string | undefined
    }))
  }

  private findRelatedDocs(analysis: Record<string, unknown>): DocReference[] {
    const docs: DocReference[] = []
    
    // 从分析结果中提取文档引用
    if (analysis.suggested_imports) {
      (analysis.suggested_imports as Array<Record<string, unknown>>).forEach((imp: Record<string, unknown>) => {
        if (imp.documentation) {
          docs.push({
            title: imp.module as string,
            path: imp.documentation as string,
            relevance: imp.confidence as number
          })
        }
      })
    }

    return docs
  }

  private findExamples(analysis: Record<string, unknown>): Example[] {
    const examples: Example[] = []
    
    // 从分析结果中提取示例
    if (analysis.patterns) {
      (analysis.patterns as Array<Record<string, unknown>>).forEach((pattern: Record<string, unknown>) => {
        if (pattern.example) {
          examples.push({
            description: pattern.description as string,
            code: pattern.example as string,
            source: (pattern.source as string) || 'pattern'
          })
        }
      })
    }

    return examples
  }

  private calculateRelevance(node: GraphNode): number {
    // 简单的相关性计算
    let relevance = 0.5
    
    if (node.properties?.importance) {
      relevance += (node.properties.importance as number) * 0.3
    }
    
    if (node.properties?.usage_count) {
      relevance += Math.min((node.properties.usage_count as number) / 100, 0.2)
    }
    
    return Math.min(relevance, 1.0)
  }

  private analyzeRelationshipPatterns(
    entities: EntityInfo[],
    relationships: RelationshipInfo[]
  ): Pattern[] {
    const patterns: Pattern[] = []
    
    // 分析实现模式
    const implementsRelations = relationships.filter(r => r.type === 'IMPLEMENTS')
    if (implementsRelations.length > 0) {
      const interfaces = new Set(implementsRelations.map(r => r.to))
      patterns.push({
        name: '接口实现模式',
        description: `发现 ${implementsRelations.length} 个接口实现关系`,
        usage: '通过接口定义契约，实现类提供具体功能',
        related_entities: Array.from(interfaces)
      })
    }

    // 分析继承模式
    const extendsRelations = relationships.filter(r => r.type === 'EXTENDS')
    if (extendsRelations.length > 0) {
      patterns.push({
        name: '继承模式',
        description: `发现 ${extendsRelations.length} 个继承关系`,
        usage: '通过继承复用基类功能',
        related_entities: extendsRelations.map(r => r.from)
      })
    }

    return patterns
  }

  private findUsagePatterns(context: ContextInfo): Pattern[] {
    const patterns: Pattern[] = []
    
    // 分析常见的调用模式
    const callRelations = context.relationships.filter(r => r.type === 'CALLS')
    if (callRelations.length > 3) {
      const frequentCalls = this.findFrequentTargets(callRelations)
      if (frequentCalls.length > 0) {
        patterns.push({
          name: '常用功能模式',
          description: '被多个模块频繁调用的功能',
          usage: '这些功能是系统的核心能力',
          related_entities: frequentCalls
        })
      }
    }

    return patterns
  }

  private findFrequentTargets(relations: RelationshipInfo[]): string[] {
    const targetCount = new Map<string, number>()
    
    relations.forEach(rel => {
      const count = targetCount.get(rel.to) || 0
      targetCount.set(rel.to, count + 1)
    })

    return Array.from(targetCount.entries())
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .map(([target]) => target)
      .slice(0, 5)
  }

  private extractBestPracticesFromContext(context: ContextInfo): BestPractice[] {
    const practices: BestPractice[] = []
    
    // 从实体中提取 LinchKit 包的使用建议
    const linchkitEntities = context.entities.filter(e => 
      e.package.startsWith('@linch-kit/')
    )

    linchkitEntities.forEach(entity => {
      if (entity.description && entity.exports) {
        practices.push({
          name: `使用 ${entity.name}`,
          description: entity.description,
          category: entity.package,
          examples: entity.exports.map(exp => `import { ${exp} } from '${entity.package}'`),
          references: [entity.package]
        })
      }
    })

    return practices
  }
}