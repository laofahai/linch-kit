/**
 * Correlation Analyzer
 *
 * 分析文档、代码、Schema、数据库之间的关联关系
 * 构建跨数据源的智能连接
 */

import { createLogger } from '@linch-kit/core/server'

import type {
  GraphNode,
  GraphRelationship,
  RelationType,
  ExtractionResult,
  Logger,
} from '../types/index.js'
import { RelationshipIdGenerator } from '../types/index.js'

interface CorrelationPattern {
  id: string
  name: string
  description: string
  matcher: (node1: GraphNode, node2: GraphNode) => boolean
  relationType: RelationType
  confidence: number
}

interface CorrelationResult {
  relationships: GraphRelationship[]
  stats: {
    total_correlations: number
    by_pattern: Record<string, number>
    by_relation_type: Record<RelationType, number>
  }
}

/**
 * 跨数据源关联分析器
 */
export class CorrelationAnalyzer {
  private logger: Logger
  private patterns: CorrelationPattern[]

  constructor() {
    this.logger = createLogger({ name: 'ai:correlation-analyzer' })
    this.patterns = this.initializePatterns()
  }

  /**
   * 分析多个提取结果之间的关联
   */
  async analyzeCorrelations(extractionResults: ExtractionResult[]): Promise<CorrelationResult> {
    this.logger.info('开始分析跨数据源关联关系...')

    // 合并所有节点
    const allNodes = this.mergeNodes(extractionResults)

    // 查找关联关系
    const relationships = await this.findCorrelations(allNodes)

    // 统计信息
    const stats = this.calculateStats(relationships)

    this.logger.info('关联分析完成', {
      totalCorrelations: relationships.length,
      nodeCount: allNodes.length,
    })

    return { relationships, stats }
  }

  /**
   * 合并所有节点，去除重复
   */
  private mergeNodes(extractionResults: ExtractionResult[]): GraphNode[] {
    const nodeMap = new Map<string, GraphNode>()

    for (const result of extractionResults) {
      for (const node of result.nodes) {
        if (!nodeMap.has(node.id)) {
          nodeMap.set(node.id, node)
        }
      }
    }

    return Array.from(nodeMap.values())
  }

  /**
   * 查找所有关联关系
   */
  private async findCorrelations(nodes: GraphNode[]): Promise<GraphRelationship[]> {
    const relationships: GraphRelationship[] = []

    // 遍历所有节点对，检查是否匹配任何关联模式
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]

        for (const pattern of this.patterns) {
          if (pattern.matcher(node1, node2)) {
            const relationship = this.createCorrelationRelationship(node1, node2, pattern)
            relationships.push(relationship)

            this.logger.debug(`发现关联: ${pattern.name}`, {
              source: node1.name,
              target: node2.name,
              confidence: pattern.confidence,
            })
          }
        }
      }
    }

    return relationships
  }

  /**
   * 创建关联关系
   */
  private createCorrelationRelationship(
    node1: GraphNode,
    node2: GraphNode,
    pattern: CorrelationPattern
  ): GraphRelationship {
    return {
      id: RelationshipIdGenerator.create(pattern.relationType, node1.id, node2.id),
      type: pattern.relationType,
      source: node1.id,
      target: node2.id,
      properties: {
        correlation_pattern: pattern.id,
        pattern_name: pattern.name,
        auto_detected: true,
      },
      metadata: {
        created_at: new Date().toISOString(),
        confidence: pattern.confidence,
      },
    }
  }

  /**
   * 初始化关联模式
   */
  private initializePatterns(): CorrelationPattern[] {
    return [
      // 1. 文档 ↔ 包：文档描述包
      {
        id: 'doc_describes_package',
        name: '文档描述包',
        description: '文档文件描述或记录包的功能',
        relationType: 'DOCUMENTS' as RelationType,
        confidence: 0.9,
        matcher: (node1, node2) => {
          if (node1.type === 'Document' && node2.type === 'Package') {
            const docPath = node1.properties?.file_path as string
            const pkgPath = node2.properties?.path as string
            return docPath?.includes(pkgPath) || false
          }
          if (node2.type === 'Document' && node1.type === 'Package') {
            const docPath = node2.properties?.file_path as string
            const pkgPath = node1.properties?.path as string
            return docPath?.includes(pkgPath) || false
          }
          return false
        },
      },

      // 2. API ↔ Schema：API使用Schema实体
      {
        id: 'api_uses_schema',
        name: 'API使用Schema',
        description: 'API函数或类使用Schema实体作为类型',
        relationType: 'USES_TYPE' as RelationType,
        confidence: 0.8,
        matcher: (node1, node2) => {
          if (node1.type === 'API' && node2.type === 'SchemaEntity') {
            const apiSignature = node1.properties?.signature as string
            const schemaName = node2.name
            return apiSignature?.includes(schemaName) || false
          }
          if (node2.type === 'API' && node1.type === 'SchemaEntity') {
            const apiSignature = node2.properties?.signature as string
            const schemaName = node1.name
            return apiSignature?.includes(schemaName) || false
          }
          return false
        },
      },

      // 3. Schema ↔ 数据库表：Schema对应数据库表
      {
        id: 'schema_maps_table',
        name: 'Schema映射数据表',
        description: 'Schema实体对应数据库中的表结构',
        relationType: 'REFERENCES' as RelationType,
        confidence: 0.95,
        matcher: (node1, node2) => {
          if (node1.type === 'SchemaEntity' && node2.type === 'DatabaseTable') {
            const schemaTable = node1.properties?.table_name as string
            const tableName = node2.name
            return schemaTable === tableName
          }
          if (node2.type === 'SchemaEntity' && node1.type === 'DatabaseTable') {
            const schemaTable = node2.properties?.table_name as string
            const tableName = node1.name
            return schemaTable === tableName
          }
          return false
        },
      },

      // 4. 文档 ↔ API：文档记录API
      {
        id: 'doc_documents_api',
        name: '文档记录API',
        description: '文档文件记录API的使用说明',
        relationType: 'DOCUMENTS' as RelationType,
        confidence: 0.7,
        matcher: (node1, node2) => {
          if (node1.type === 'Document' && node2.type === 'API') {
            const docContent = node1.properties?.title as string
            const apiName = node2.name
            return docContent?.toLowerCase().includes(apiName.toLowerCase()) || false
          }
          if (node2.type === 'Document' && node1.type === 'API') {
            const docContent = node2.properties?.title as string
            const apiName = node1.name
            return docContent?.toLowerCase().includes(apiName.toLowerCase()) || false
          }
          return false
        },
      },

      // 5. 包 ↔ Schema：包定义Schema
      {
        id: 'package_defines_schema',
        name: '包定义Schema',
        description: '包中定义了Schema实体',
        relationType: 'DEFINES' as RelationType,
        confidence: 0.9,
        matcher: (node1, node2) => {
          if (node1.type === 'Package' && node2.type === 'SchemaEntity') {
            const packageName = node1.name
            const schemaPackage = node2.metadata?.package
            return packageName === schemaPackage
          }
          if (node2.type === 'Package' && node1.type === 'SchemaEntity') {
            const packageName = node2.name
            const schemaPackage = node1.metadata?.package
            return packageName === schemaPackage
          }
          return false
        },
      },

      // 6. API ↔ 文件：API定义在文件中
      {
        id: 'file_contains_api',
        name: '文件包含API',
        description: '源代码文件中定义了API',
        relationType: 'CONTAINS' as RelationType,
        confidence: 0.95,
        matcher: (node1, node2) => {
          if (node1.type === 'File' && node2.type === 'API') {
            const filePath = node1.properties?.file_path as string
            const apiFile = node2.properties?.file_path as string
            return filePath === apiFile
          }
          if (node2.type === 'File' && node1.type === 'API') {
            const filePath = node2.properties?.file_path as string
            const apiFile = node1.properties?.file_path as string
            return filePath === apiFile
          }
          return false
        },
      },

      // 7. 概念 ↔ 包：概念在包中实现
      {
        id: 'concept_implemented_in_package',
        name: '概念在包中实现',
        description: '抽象概念在特定包中得到实现',
        relationType: 'IMPLEMENTS' as RelationType,
        confidence: 0.6,
        matcher: (node1, node2) => {
          if (node1.type === 'Concept' && node2.type === 'Package') {
            const conceptName = node1.name.toLowerCase()
            const packageName = node2.name.toLowerCase()
            const packageDesc = (node2.properties?.description as string)?.toLowerCase() || ''
            return packageName.includes(conceptName) || packageDesc.includes(conceptName)
          }
          if (node2.type === 'Concept' && node1.type === 'Package') {
            const conceptName = node2.name.toLowerCase()
            const packageName = node1.name.toLowerCase()
            const packageDesc = (node1.properties?.description as string)?.toLowerCase() || ''
            return packageName.includes(conceptName) || packageDesc.includes(conceptName)
          }
          return false
        },
      },

      // 8. 同名实体关联：基于名称的相似性
      {
        id: 'name_similarity',
        name: '名称相似性关联',
        description: '基于名称相似性的实体关联',
        relationType: 'REFERENCES' as RelationType,
        confidence: 0.5,
        matcher: (node1, node2) => {
          if (node1.type === node2.type) return false // 同类型节点不关联

          const name1 = node1.name.toLowerCase()
          const name2 = node2.name.toLowerCase()

          // 计算名称相似度
          const similarity = this.calculateNameSimilarity(name1, name2)
          return similarity > 0.8
        },
      },
    ]
  }

  /**
   * 计算名称相似度 (简单的编辑距离)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const len1 = name1.length
    const len2 = name2.length
    const maxLen = Math.max(len1, len2)

    if (maxLen === 0) return 1.0

    // 简单的包含检查
    if (name1.includes(name2) || name2.includes(name1)) {
      return 0.9
    }

    // 编辑距离计算 (简化版)
    let distance = 0
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (name1[i] !== name2[i]) {
        distance++
      }
    }
    distance += Math.abs(len1 - len2)

    return 1 - distance / maxLen
  }

  /**
   * 计算统计信息
   */
  private calculateStats(relationships: GraphRelationship[]): CorrelationResult['stats'] {
    const byPattern: Record<string, number> = {}
    const byRelationType: Record<RelationType, number> = {} as Record<RelationType, number>

    for (const rel of relationships) {
      const pattern = rel.properties?.correlation_pattern as string
      if (pattern) {
        byPattern[pattern] = (byPattern[pattern] || 0) + 1
      }

      byRelationType[rel.type] = (byRelationType[rel.type] || 0) + 1
    }

    return {
      total_correlations: relationships.length,
      by_pattern: byPattern,
      by_relation_type: byRelationType,
    }
  }
}
