/**
 * Context Manager - 统一的上下文管理器
 * 整合了查询和增强分析功能
 * @version v2.0.3
 */

import { createLogger } from '@linch-kit/core/server'

import { IntelligentQueryEngine } from '../query/intelligent-query-engine.js'
import type { GraphNode, GraphRelationship } from '../core/types/index.js'

const logger = createLogger({ name: 'ai:context-manager' })

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
  /** 推荐的实现方案 */
  suggestions: ImplementationSuggestion[]
}

export interface EntityInfo {
  name: string
  type: 'class' | 'interface' | 'function' | 'type' | 'component' | 'schema'
  description: string
  location: {
    file: string
    line: number
  }
  properties?: Array<{
    name: string
    type: string
    description?: string
  }>
}

export interface RelationshipInfo {
  from: string
  to: string
  type: 'extends' | 'implements' | 'uses' | 'imports' | 'calls'
  description?: string
}

export interface DocReference {
  title: string
  url?: string
  section?: string
  relevance: number
}

export interface Example {
  title: string
  code: string
  description: string
  language: string
}

export interface ImplementationSuggestion {
  title: string
  description: string
  steps: string[]
  files: string[]
  priority: 'high' | 'medium' | 'low'
}

/**
 * 检测到的开发动作
 */
export enum DetectedAction {
  ADD_FIELD = 'add_field',
  REMOVE_FIELD = 'remove_field', 
  CREATE_API = 'create_api',
  CREATE_UI = 'create_ui',
  ADD_VALIDATION = 'add_validation',
  REFACTOR = 'refactor',
  OPTIMIZE = 'optimize',
  UNKNOWN = 'unknown'
}

/**
 * 上下文查询结果
 */
export interface ContextQueryResult {
  action: DetectedAction
  context: ContextInfo
  confidence: number
  timestamp: Date
}

/**
 * 统一的上下文管理器
 */
export class ContextManager {
  private queryEngine: IntelligentQueryEngine

  constructor() {
    this.queryEngine = new IntelligentQueryEngine()
    logger.debug('上下文管理器初始化完成')
  }

  /**
   * 查询项目上下文信息
   */
  async getContext(query: string): Promise<ContextQueryResult> {
    try {
      logger.info('开始上下文查询', { query: query.substring(0, 100) + '...' })

      // 检测用户意图
      const action = this.detectAction(query)
      
      // 执行智能查询
      const queryResult = await this.queryEngine.query(query, {
        includeRelated: true,
        maxResults: 20
      })

      // 构建上下文信息
      const context: ContextInfo = {
        entities: this.extractEntities(queryResult.nodes),
        relationships: this.extractRelationships(queryResult.relationships),
        documentation: this.findRelevantDocs(query),
        examples: this.generateExamples(queryResult.nodes, action),
        suggestions: this.generateSuggestions(query, action, queryResult.nodes)
      }

      const result: ContextQueryResult = {
        action,
        context,
        confidence: queryResult.confidence,
        timestamp: new Date()
      }

      logger.info('上下文查询完成', {
        action,
        entitiesCount: context.entities.length,
        confidence: queryResult.confidence
      })

      return result
    } catch (error) {
      logger.error('上下文查询失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 检测用户动作意图
   */
  private detectAction(query: string): DetectedAction {
    const lowerQuery = query.toLowerCase()

    // 字段操作
    if (lowerQuery.includes('add') && (lowerQuery.includes('field') || lowerQuery.includes('property'))) {
      return DetectedAction.ADD_FIELD
    }
    if (lowerQuery.includes('remove') && (lowerQuery.includes('field') || lowerQuery.includes('property'))) {
      return DetectedAction.REMOVE_FIELD
    }

    // API操作
    if (lowerQuery.includes('api') || lowerQuery.includes('endpoint') || lowerQuery.includes('route')) {
      return DetectedAction.CREATE_API
    }

    // UI操作
    if (lowerQuery.includes('component') || lowerQuery.includes('ui') || lowerQuery.includes('page')) {
      return DetectedAction.CREATE_UI
    }

    // 验证操作
    if (lowerQuery.includes('validation') || lowerQuery.includes('validate')) {
      return DetectedAction.ADD_VALIDATION
    }

    // 重构操作
    if (lowerQuery.includes('refactor') || lowerQuery.includes('restructure')) {
      return DetectedAction.REFACTOR
    }

    // 优化操作
    if (lowerQuery.includes('optimize') || lowerQuery.includes('performance')) {
      return DetectedAction.OPTIMIZE
    }

    return DetectedAction.UNKNOWN
  }

  /**
   * 提取实体信息
   */
  private extractEntities(nodes: GraphNode[]): EntityInfo[] {
    return nodes.map(node => ({
      name: node.name,
      type: this.mapNodeType(node.type),
      description: node.prop_description || '无描述',
      location: {
        file: node.prop_file_path || '未知文件',
        line: node.prop_line_number || 0
      },
      properties: node.prop_properties ? this.parseProperties(node.prop_properties) : undefined
    }))
  }

  /**
   * 映射节点类型
   */
  private mapNodeType(nodeType: string): EntityInfo['type'] {
    switch (nodeType.toLowerCase()) {
      case 'class': return 'class'
      case 'interface': return 'interface'
      case 'function': return 'function'
      case 'type': return 'type'
      case 'component': return 'component'
      case 'schema': return 'schema'
      default: return 'function'
    }
  }

  /**
   * 解析属性
   */
  private parseProperties(properties: string): Array<{ name: string; type: string; description?: string }> {
    try {
      // 简单的属性解析逻辑
      return properties.split(',').map(prop => {
        const [name, type] = prop.trim().split(':')
        return {
          name: name?.trim() || 'unknown',
          type: type?.trim() || 'unknown'
        }
      })
    } catch {
      return []
    }
  }

  /**
   * 提取关系信息
   */
  private extractRelationships(relationships: GraphRelationship[]): RelationshipInfo[] {
    return relationships.map(rel => ({
      from: rel.from,
      to: rel.to,
      type: this.mapRelationType(rel.type),
      description: rel.properties?.description
    }))
  }

  /**
   * 映射关系类型
   */
  private mapRelationType(relType: string): RelationshipInfo['type'] {
    switch (relType.toLowerCase()) {
      case 'extends': return 'extends'
      case 'implements': return 'implements'
      case 'uses': return 'uses'
      case 'imports': return 'imports'
      case 'calls': return 'calls'
      default: return 'uses'
    }
  }

  /**
   * 查找相关文档
   */
  private findRelevantDocs(query: string): DocReference[] {
    // TODO: 实现文档查找逻辑
    return []
  }

  /**
   * 生成示例代码
   */
  private generateExamples(nodes: GraphNode[], action: DetectedAction): Example[] {
    const examples: Example[] = []

    if (action === DetectedAction.ADD_FIELD && nodes.length > 0) {
      examples.push({
        title: '添加字段示例',
        code: `// 在Schema中添加新字段\nexport const UserSchema = z.object({\n  // 现有字段...\n  newField: z.string().optional()\n})`,
        description: '在现有Schema中添加新字段的推荐方式',
        language: 'typescript'
      })
    }

    return examples
  }

  /**
   * 生成实现建议
   */
  private generateSuggestions(query: string, action: DetectedAction, nodes: GraphNode[]): ImplementationSuggestion[] {
    const suggestions: ImplementationSuggestion[] = []

    if (action === DetectedAction.ADD_FIELD) {
      suggestions.push({
        title: '添加字段的完整流程',
        description: '在LinchKit项目中添加新字段需要更新Schema、API、UI等多个层面',
        steps: [
          '1. 更新相关的Schema定义',
          '2. 运行数据库迁移（如果需要）',
          '3. 更新相关的API端点',
          '4. 更新UI表单组件',
          '5. 添加或更新测试用例'
        ],
        files: this.getRelevantFiles(nodes),
        priority: 'high'
      })
    }

    return suggestions
  }

  /**
   * 获取相关文件
   */
  private getRelevantFiles(nodes: GraphNode[]): string[] {
    return nodes
      .map(node => node.prop_file_path)
      .filter((file): file is string => Boolean(file))
      .slice(0, 10) // 限制数量
  }
}