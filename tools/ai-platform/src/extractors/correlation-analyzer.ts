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
} from '../types/index'
import { RelationshipIdGenerator } from '../types/index'
import { GeminiSDKProvider, type GeminiSDKConfig } from '../providers/gemini-sdk-provider'
import { deduplicateRelationships } from '../utils/relationship-deduplication'

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
 * 跨数据源关联分析器 - AI增强版
 */
export class CorrelationAnalyzer {
  private logger: Logger
  private patterns: CorrelationPattern[]
  private aiProvider?: GeminiSDKProvider
  private useAI: boolean

  constructor(aiConfig?: GeminiSDKConfig) {
    this.logger = createLogger({ name: 'ai:correlation-analyzer' })
    this.patterns = this.initializePatterns()
    
    // 初始化AI provider（可选）
    this.useAI = !!aiConfig?.apiKey
    if (this.useAI && aiConfig) {
      try {
        this.aiProvider = new GeminiSDKProvider({
          ...aiConfig,
          model: 'gemini-1.5-flash', // 快速模式用于关联分析
          systemInstruction: `你是一个代码关联分析专家。请分析两个代码实体之间的语义关系。
          
响应格式（JSON）：
{
  "hasRelation": boolean,
  "relationType": "IMPORTS" | "USES_TYPE" | "HAS_METHOD" | "IMPLEMENTS" | "CALLS" | "RELATED_TO",
  "confidence": 0.0-1.0,
  "reason": "简短说明原因"
}

只分析真实存在的代码关系，避免推测。`,
        })
        this.logger.info('AI增强关联分析已启用')
      } catch (error) {
        this.logger.warn('AI provider初始化失败，使用基础分析', { error })
        this.useAI = false
      }
    } else {
      this.logger.info('使用基础关联分析（未配置AI）')
    }
  }

  /**
   * 分析多个提取结果之间的关联
   */
  async analyzeCorrelations(extractionResults: ExtractionResult[]): Promise<CorrelationResult> {
    this.logger.info('开始分析跨数据源关联关系...')

    // 合并所有节点
    const allNodes = this.mergeNodes(extractionResults)

    // 查找关联关系
    const rawRelationships = await this.findCorrelations(allNodes)

    // 执行关系去重和优化
    const deduplicationResult = deduplicateRelationships(rawRelationships)
    const relationships = deduplicationResult.relationships

    this.logger.info('关系去重完成', {
      原始关系数: deduplicationResult.originalCount,
      去重后关系数: deduplicationResult.deduplicatedCount,
      减少数量: deduplicationResult.removedCount,
      质量分布: deduplicationResult.stats.byQuality
    })

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
   * 智能关联分析 - 基于语义理解和实际代码关系（优化版本）
   */
  private async findCorrelations(nodes: GraphNode[]): Promise<GraphRelationship[]> {
    const relationships: GraphRelationship[] = []
    const relationshipSet = new Set<string>()

    this.logger.info(`开始智能关联分析，节点总数: ${nodes.length}`)

    // 检查是否已有过多关系，如果是则使用保守策略
    const conservativeMode = nodes.length > 20000
    if (conservativeMode) {
      this.logger.warn('节点数量过多，启用保守模式，减少关系生成')
    }

    // 构建智能索引以支持快速查找
    const semanticIndex = this.buildSemanticIndex(nodes)
    
    this.logger.debug('语义索引统计:', {
      fileGroups: semanticIndex.fileGroups.size,
      importMap: semanticIndex.importMap.size,
      exportMap: semanticIndex.exportMap.size,
      typeMap: semanticIndex.typeMap.size,
    })

    // 1. 基于文件结构的关联（最可靠）- 始终执行
    relationships.push(...this.findFileStructureRelations(semanticIndex, relationshipSet))

    // 2. 基于导入导出的关联（高可信度）- 始终执行
    relationships.push(...this.findImportExportRelations(semanticIndex, relationshipSet))

    // 3. 基于类型使用的关联（中等可信度）- 在保守模式下限制
    if (!conservativeMode || relationshipSet.size < 50000) {
      relationships.push(...this.findTypeUsageRelations(semanticIndex, relationshipSet))
    } else {
      this.logger.info('跳过类型使用关联分析，避免关系过多')
    }

    // 4. 语义关联 - 仅在关系数量较少时执行
    if (relationshipSet.size < 30000) {
      relationships.push(...await this.findSemanticRelations(semanticIndex, relationshipSet))
    } else {
      this.logger.info('跳过语义关联分析，避免关系过多')
    }

    this.logger.info(`智能关联分析完成，发现 ${relationships.length} 个高质量关系`, {
      conservativeMode,
      totalRelationships: relationships.length,
      relationshipTypes: this.getRelationshipTypeDistribution(relationships)
    })
    return relationships
  }

  /**
   * 构建语义索引
   */
  private buildSemanticIndex(nodes: GraphNode[]) {
    const fileGroups = new Map<string, GraphNode[]>()
    const importMap = new Map<string, string[]>()
    const exportMap = new Map<string, GraphNode[]>()
    const typeMap = new Map<string, GraphNode[]>()
    const nodesByType = new Map<string, GraphNode[]>()

    for (const node of nodes) {
      // 按文件分组
      const filePath = this.extractFilePath(node)
      if (filePath) {
        if (!fileGroups.has(filePath)) {
          fileGroups.set(filePath, [])
        }
        fileGroups.get(filePath)!.push(node)
      }

      // 按节点类型分组
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, [])
      }
      nodesByType.get(node.type)!.push(node)

      // 构建导入映射
      const imports = this.extractImports(node)
      if (imports.length > 0) {
        importMap.set(node.id, imports)
      }

      // 构建导出映射
      if (this.isExportedSymbol(node)) {
        const exportName = this.extractExportName(node)
        if (exportName) {
          if (!exportMap.has(exportName)) {
            exportMap.set(exportName, [])
          }
          exportMap.get(exportName)!.push(node)
        }
      }

      // 构建类型映射
      const usedTypes = this.extractUsedTypes(node)
      for (const type of usedTypes) {
        if (!typeMap.has(type)) {
          typeMap.set(type, [])
        }
        typeMap.get(type)!.push(node)
      }
    }

    return { fileGroups, importMap, exportMap, typeMap, nodesByType }
  }

  /**
   * 基于文件结构的关联（最可靠）
   */
  private findFileStructureRelations(index: any, relationshipSet: Set<string>): GraphRelationship[] {
    const relationships: GraphRelationship[] = []

    // 同一文件内的函数/类之间的关联
    for (const [filePath, fileNodes] of index.fileGroups) {
      const functions = fileNodes.filter(n => n.type === 'Function')
      const classes = fileNodes.filter(n => n.type === 'Class')
      const interfaces = fileNodes.filter(n => n.type === 'Interface')

      // 类的方法关联
      for (const cls of classes) {
        const classMethods = functions.filter(f => 
          this.isMethodOfClass(f, cls)
        )
        
        for (const method of classMethods) {
          const relId = `${cls.id}-HAS_METHOD-${method.id}`
          if (!relationshipSet.has(relId)) {
            relationshipSet.add(relId)
            relationships.push(this.createReliableRelationship(
              cls, method, 'HAS_METHOD', '类包含方法', 0.95
            ))
          }
        }
      }

      // 接口实现关联
      for (const cls of classes) {
        for (const iface of interfaces) {
          if (this.implementsInterface(cls, iface)) {
            const relId = `${cls.id}-IMPLEMENTS-${iface.id}`
            if (!relationshipSet.has(relId)) {
              relationshipSet.add(relId)
              relationships.push(this.createReliableRelationship(
                cls, iface, 'IMPLEMENTS', '类实现接口', 0.9
              ))
            }
          }
        }
      }
    }

    this.logger.debug(`文件结构关联: ${relationships.length} 个`)
    return relationships
  }

  /**
   * 基于导入导出的关联（高可信度）
   */
  private findImportExportRelations(index: any, relationshipSet: Set<string>): GraphRelationship[] {
    const relationships: GraphRelationship[] = []

    for (const [nodeId, imports] of index.importMap) {
      const importingNode = this.findNodeById(index.nodesByType, nodeId)
      if (!importingNode) continue

      for (const importName of imports) {
        const exportedNodes = index.exportMap.get(importName) || []
        
        for (const exportedNode of exportedNodes) {
          // 确保不是自引用
          if (exportedNode.id !== importingNode.id) {
            const relId = `${importingNode.id}-IMPORTS-${exportedNode.id}`
            if (!relationshipSet.has(relId)) {
              relationshipSet.add(relId)
              relationships.push(this.createReliableRelationship(
                importingNode, exportedNode, 'IMPORTS', '导入依赖', 0.9
              ))
            }
          }
        }
      }
    }

    this.logger.debug(`导入导出关联: ${relationships.length} 个`)
    return relationships
  }

  /**
   * 基于类型使用的关联（中等可信度）+ 函数调用关联
   */
  private findTypeUsageRelations(index: any, relationshipSet: Set<string>): GraphRelationship[] {
    const relationships: GraphRelationship[] = []

    // 1. 类型使用关联
    for (const [typeName, usingNodes] of index.typeMap) {
      // 查找类型定义
      const typeDefinitions = this.findTypeDefinitions(index.nodesByType, typeName)
      
      for (const typeDefNode of typeDefinitions) {
        for (const usingNode of usingNodes) {
          // 确保不是自引用，且是合理的类型使用
          if (typeDefNode.id !== usingNode.id && this.isReasonableTypeUsage(usingNode, typeDefNode)) {
            const relId = `${usingNode.id}-USES_TYPE-${typeDefNode.id}`
            if (!relationshipSet.has(relId)) {
              relationshipSet.add(relId)
              relationships.push(this.createReliableRelationship(
                usingNode, typeDefNode, 'USES_TYPE', '使用类型', 0.7
              ))
            }
          }
        }
      }
    }

    // 2. 增加函数调用关联（基于代码分析）
    const functions = index.nodesByType.get('Function') || []
    for (const func of functions) {
      const callees = this.extractFunctionCalls(func)
      for (const calleeName of callees) {
        const targetFunctions = functions.filter(f => f.name === calleeName)
        for (const targetFunc of targetFunctions) {
          if (targetFunc.id !== func.id) {
            const relId = `${func.id}-CALLS-${targetFunc.id}`
            if (!relationshipSet.has(relId)) {
              relationshipSet.add(relId)
              relationships.push(this.createReliableRelationship(
                func, targetFunc, 'CALLS', '函数调用', 0.8
              ))
            }
          }
        }
      }
    }

    // 3. 增加包内文件关联（限制性版本）
    let sameFileRelationCount = 0
    const maxSameFileRelations = 5000 // 限制同文件关系数量
    
    for (const [filePath, fileNodes] of index.fileGroups) {
      if (sameFileRelationCount >= maxSameFileRelations) {
        this.logger.info(`同文件关联已达上限${maxSameFileRelations}，跳过剩余处理`)
        break
      }
      
      // 只对较小的文件建立同文件关系，避免大文件爆炸
      if (fileNodes.length > 20) {
        continue
      }
      
      // 同一文件内的节点建立有选择的DEFINED_IN关系
      const functions = fileNodes.filter(n => n.type === 'Function')
      const classes = fileNodes.filter(n => n.type === 'Class')
      const interfaces = fileNodes.filter(n => n.type === 'Interface')
      
      // 只建立类和其方法的关系，以及接口实现关系
      for (const cls of classes) {
        for (const func of functions) {
          if (this.isMethodOfClass(func, cls)) {
            const relId = `${cls.id}-HAS_METHOD-${func.id}`
            if (!relationshipSet.has(relId) && sameFileRelationCount < maxSameFileRelations) {
              relationshipSet.add(relId)
              relationships.push(this.createReliableRelationship(
                cls, func, 'HAS_METHOD', '类方法', 0.9
              ))
              sameFileRelationCount++
            }
          }
        }
        
        for (const iface of interfaces) {
          if (this.implementsInterface(cls, iface)) {
            const relId = `${cls.id}-IMPLEMENTS-${iface.id}`
            if (!relationshipSet.has(relId) && sameFileRelationCount < maxSameFileRelations) {
              relationshipSet.add(relId)
              relationships.push(this.createReliableRelationship(
                cls, iface, 'IMPLEMENTS', '接口实现', 0.9
              ))
              sameFileRelationCount++
            }
          }
        }
      }
    }

    this.logger.debug(`类型使用关联: ${relationships.length} 个`)
    return relationships
  }

  /**
   * 从函数节点中提取被调用的函数名（增强版）
   */
  private extractFunctionCalls(funcNode: GraphNode): string[] {
    const calls: string[] = []
    const source = funcNode.properties?.source as string || funcNode.properties?.body as string || ''
    
    if (!source) return calls

    // 1. 简单的函数调用
    const callRegex = /(\w+)\s*\(/g
    let match
    while ((match = callRegex.exec(source)) !== null) {
      const funcName = match[1]
      // 过滤掉一些常见的非函数调用
      if (!['if', 'for', 'while', 'switch', 'catch', 'return'].includes(funcName)) {
        calls.push(funcName)
      }
    }

    // 2. 方法调用
    const methodCallRegex = /\.(\w+)\s*\(/g
    while ((match = methodCallRegex.exec(source)) !== null) {
      calls.push(match[1])
    }

    // 3. 导入的函数调用
    const importRegex = /import\s*\{\s*([\w\s,]+)\s*\}/g
    while ((match = importRegex.exec(source)) !== null) {
      const imports = match[1].split(',').map(s => s.trim())
      calls.push(...imports)
    }
    
    return [...new Set(calls)].slice(0, 20) // 去重并限制数量
  }

  /**
   * 基于语义相似性的关联（AI增强或基础版本）- 更严格的控制
   */
  private async findSemanticRelations(index: any, relationshipSet: Set<string>): Promise<GraphRelationship[]> {
    const relationships: GraphRelationship[] = []

    // 大幅提高语义关联的启用门槛
    const semanticThreshold = this.useAI ? 10000 : 3000
    
    if (relationshipSet.size < semanticThreshold) {
      if (this.useAI && this.aiProvider) {
        // 使用AI增强的语义分析
        relationships.push(...await this.findAIEnhancedSemanticRelations(index, relationshipSet))
      } else {
        // 使用基础的语义分析，但更加保守
        relationships.push(...this.findBasicSemanticRelations(index, relationshipSet))
      }
    } else {
      this.logger.info(`跳过语义分析：当前已有${relationshipSet.size}个关系，超过${semanticThreshold}阈值`)
    }

    this.logger.debug(`语义相似性关联: ${relationships.length} 个`)
    return relationships
  }

  /**
   * AI增强的语义关联分析
   */
  private async findAIEnhancedSemanticRelations(index: any, relationshipSet: Set<string>): Promise<GraphRelationship[]> {
    const relationships: GraphRelationship[] = []
    const allNodes = Array.from(index.nodesByType.values()).flat()

    // 选择最有价值的节点进行AI分析（避免成本爆炸）
    const importantNodes = allNodes
      .filter(node => {
        // 优先选择有丰富上下文的节点
        const hasCode = !!(node.properties?.source || node.properties?.body)
        const hasSignature = !!(node.properties?.signature)
        const isPublicAPI = !!(node.properties?.exported === true)
        return hasCode || hasSignature || isPublicAPI
      })
      .slice(0, 50) // 限制数量控制AI调用成本

    this.logger.info(`使用AI分析 ${importantNodes.length} 个重要节点的语义关联`)

    // 批量分析，减少API调用
    for (let i = 0; i < importantNodes.length; i++) {
      for (let j = i + 1; j < importantNodes.length; j++) {
        const node1 = importantNodes[i]
        const node2 = importantNodes[j]

        // 基础过滤：明显不相关的跳过
        if (!this.couldBeSemanticallyRelated(node1, node2)) continue

        const relId = `${node1.id}-RELATED_TO-${node2.id}`
        if (relationshipSet.has(relId)) continue

        // 使用AI分析语义关系
        const aiAnalysis = await this.analyzeSemanticRelationWithAI(node1, node2)
        
        if (aiAnalysis.hasRelation && aiAnalysis.confidence > 0.6) {
          relationshipSet.add(relId)
          relationships.push(this.createReliableRelationship(
            node1, node2, 
            aiAnalysis.relationType as RelationType, 
            `AI分析: ${aiAnalysis.reason}`, 
            aiAnalysis.confidence
          ))

          this.logger.debug(`AI发现关联: ${node1.name} -> ${node2.name} (${aiAnalysis.relationType}, ${aiAnalysis.confidence})`)
        }
      }
    }

    return relationships
  }

  /**
   * 基础语义关联分析（回退方案）- 更严格的过滤
   */
  private findBasicSemanticRelations(index: any, relationshipSet: Set<string>): GraphRelationship[] {
    const relationships: GraphRelationship[] = []

    // 查找命名相似的组件，但更严格
    const similarGroups = this.findSimilarlyNamedEntities(index.nodesByType)
    
    // 限制处理的组数和每组的大小，避免爆炸式增长
    const limitedGroups = similarGroups
      .filter(group => group.length <= 5) // 限制每组最多5个节点
      .slice(0, 100) // 最多处理100个相似组
    
    for (const group of limitedGroups) {
      if (group.length > 1) {
        // 只建立最相关的关系，不是所有组合
        for (let i = 1; i < group.length; i++) {
          const relId = `${group[0].id}-RELATED_TO-${group[i].id}`
          if (!relationshipSet.has(relId)) {
            relationshipSet.add(relId)
            relationships.push(this.createReliableRelationship(
              group[0], group[i], 'RELATED_TO', '语义相关', 0.3
            ))
          }
        }
      }
    }

    this.logger.debug(`基础语义分析处理了${limitedGroups.length}个相似组`)
    return relationships
  }

  /**
   * 使用AI分析两个节点的语义关系
   */
  private async analyzeSemanticRelationWithAI(node1: GraphNode, node2: GraphNode): Promise<{
    hasRelation: boolean
    relationType: string
    confidence: number
    reason: string
  }> {
    if (!this.aiProvider) {
      return { hasRelation: false, relationType: 'RELATED_TO', confidence: 0, reason: 'AI不可用' }
    }

    try {
      const prompt = this.buildAnalysisPrompt(node1, node2)
      const response = await this.aiProvider.generateContent(prompt)
      
      if (response.success && response.content) {
        const analysis = JSON.parse(response.content.trim())
        return {
          hasRelation: analysis.hasRelation || false,
          relationType: analysis.relationType || 'RELATED_TO',
          confidence: Math.min(Math.max(analysis.confidence || 0, 0), 1), // 确保在0-1范围内
          reason: analysis.reason || '未提供原因'
        }
      }
    } catch (error) {
      this.logger.debug('AI分析失败', { error, node1: node1.name, node2: node2.name })
    }

    return { hasRelation: false, relationType: 'RELATED_TO', confidence: 0, reason: 'AI分析失败' }
  }

  /**
   * 构建AI分析提示词
   */
  private buildAnalysisPrompt(node1: GraphNode, node2: GraphNode): string {
    const getNodeContext = (node: GraphNode) => {
      return {
        name: node.name,
        type: node.type,
        filePath: this.extractFilePath(node),
        signature: node.properties?.signature as string,
        source: (node.properties?.source as string || node.properties?.body as string || '').substring(0, 500), // 限制长度
      }
    }

    const context1 = getNodeContext(node1)
    const context2 = getNodeContext(node2)

    return `分析以下两个代码实体之间的关系：

实体1：
- 名称: ${context1.name}
- 类型: ${context1.type}
- 文件: ${context1.filePath || '未知'}
- 签名: ${context1.signature || '无'}
- 代码片段: ${context1.source || '无'}

实体2：
- 名称: ${context2.name}
- 类型: ${context2.type}
- 文件: ${context2.filePath || '未知'}
- 签名: ${context2.signature || '无'}
- 代码片段: ${context2.source || '无'}

请分析它们是否有真实的代码关系，并返回JSON格式结果。`
  }

  /**
   * 基础过滤：检查两个节点是否可能有语义关联
   */
  private couldBeSemanticallyRelated(node1: GraphNode, node2: GraphNode): boolean {
    // 相同类型的节点更可能相关
    if (node1.type === node2.type) return true

    // 函数和类之间可能有关系
    if ((node1.type === 'Function' && node2.type === 'Class') || 
        (node1.type === 'Class' && node2.type === 'Function')) return true

    // 类和接口之间可能有关系
    if ((node1.type === 'Class' && node2.type === 'Interface') || 
        (node1.type === 'Interface' && node2.type === 'Class')) return true

    // 包含相似关键词的节点
    const name1 = node1.name.toLowerCase()
    const name2 = node2.name.toLowerCase()
    const keywords = ['user', 'auth', 'config', 'service', 'util', 'helper', 'manager', 'controller']
    
    for (const keyword of keywords) {
      if (name1.includes(keyword) && name2.includes(keyword)) return true
    }

    return false
  }

  /**
   * 针对特定模式进行智能关联查找
   */
  private async findPatternSpecificCorrelations(
    nodesByType: Map<string, GraphNode[]>,
    pattern: CorrelationPattern,
    relationshipSet: Set<string>
  ): Promise<GraphRelationship[]> {
    const relationships: GraphRelationship[] = []

    // 根据不同模式进行优化查找
    switch (pattern.id) {
      case 'doc_describes_package':
        // 只在Document和Package之间查找
        relationships.push(...this.findDocumentPackageCorrelations(
          nodesByType.get('Document') || [],
          nodesByType.get('Package') || [],
          pattern,
          relationshipSet
        ))
        break

      case 'api_uses_schema':
        // 只在API和SchemaEntity之间查找
        relationships.push(...this.findApiSchemaCorrelations(
          [...(nodesByType.get('Function') || []), ...(nodesByType.get('Class') || [])],
          nodesByType.get('SchemaEntity') || [],
          pattern,
          relationshipSet
        ))
        break

      case 'function_calls_function':
        // 只在Function之间查找，且有明确调用关系的
        relationships.push(...this.findFunctionCallCorrelations(
          nodesByType.get('Function') || [],
          pattern,
          relationshipSet
        ))
        break

      default:
        // 对于其他模式，进行限制性查找
        relationships.push(...this.findLimitedCorrelations(
          nodesByType,
          pattern,
          relationshipSet
        ))
    }

    this.logger.debug(`模式 ${pattern.name} 找到 ${relationships.length} 个关系`)
    return relationships
  }

  /**
   * 文档-包关联查找
   */
  private findDocumentPackageCorrelations(
    docs: GraphNode[],
    packages: GraphNode[],
    pattern: CorrelationPattern,
    relationshipSet: Set<string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = []

    for (const doc of docs) {
      for (const pkg of packages) {
        if (pattern.matcher(doc, pkg)) {
          const relationshipId = `${doc.id}-${pattern.relationType}-${pkg.id}`
          if (!relationshipSet.has(relationshipId)) {
            relationshipSet.add(relationshipId)
            relationships.push(this.createCorrelationRelationship(doc, pkg, pattern))
          }
        }
      }
    }

    return relationships
  }

  /**
   * API-Schema关联查找
   */
  private findApiSchemaCorrelations(
    apis: GraphNode[],
    schemas: GraphNode[],
    pattern: CorrelationPattern,
    relationshipSet: Set<string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = []

    for (const api of apis) {
      for (const schema of schemas) {
        if (pattern.matcher(api, schema)) {
          const relationshipId = `${api.id}-${pattern.relationType}-${schema.id}`
          if (!relationshipSet.has(relationshipId)) {
            relationshipSet.add(relationshipId)
            relationships.push(this.createCorrelationRelationship(api, schema, pattern))
          }
        }
      }
    }

    return relationships
  }

  /**
   * 函数调用关联查找
   */
  private findFunctionCallCorrelations(
    functions: GraphNode[],
    pattern: CorrelationPattern,
    relationshipSet: Set<string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = []

    // 限制函数间的关联查找，只查找明确的调用关系
    for (const func of functions) {
      const callees = this.extractFunctionCalls(func)
      for (const callee of callees) {
        const targetFunc = functions.find(f => f.name === callee)
        if (targetFunc) {
          const relationshipId = `${func.id}-CALLS-${targetFunc.id}`
          if (!relationshipSet.has(relationshipId)) {
            relationshipSet.add(relationshipId)
            relationships.push(this.createCorrelationRelationship(func, targetFunc, pattern))
          }
        }
      }
    }

    return relationships
  }

  /**
   * 限制性关联查找，避免关系爆炸
   */
  private findLimitedCorrelations(
    nodesByType: Map<string, GraphNode[]>,
    pattern: CorrelationPattern,
    relationshipSet: Set<string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = []
    const maxComparisons = 10000 // 限制比较次数

    let comparisons = 0
    const allNodes = Array.from(nodesByType.values()).flat()
    
    // 随机采样或按重要性排序后取前N个
    const sampledNodes = allNodes
      .sort((a, b) => {
        // 优先考虑有更多属性或元数据的节点
        const scoreA = Object.keys(a.properties || {}).length + Object.keys(a.metadata || {}).length
        const scoreB = Object.keys(b.properties || {}).length + Object.keys(b.metadata || {}).length
        return scoreB - scoreA
      })
      .slice(0, Math.min(2000, allNodes.length)) // 最多取2000个最重要的节点

    for (let i = 0; i < sampledNodes.length && comparisons < maxComparisons; i++) {
      for (let j = i + 1; j < sampledNodes.length && comparisons < maxComparisons; j++) {
        comparisons++
        
        if (pattern.matcher(sampledNodes[i], sampledNodes[j])) {
          const relationshipId = `${sampledNodes[i].id}-${pattern.relationType}-${sampledNodes[j].id}`
          if (!relationshipSet.has(relationshipId)) {
            relationshipSet.add(relationshipId)
            relationships.push(this.createCorrelationRelationship(sampledNodes[i], sampledNodes[j], pattern))
          }
        }
      }
    }

    return relationships
  }

  // ===== 智能分析辅助方法 =====

  /**
   * 提取节点的文件路径
   */
  private extractFilePath(node: GraphNode): string | null {
    return node.properties?.file_path as string || 
           node.properties?.path as string || 
           node.metadata?.file_path as string || null
  }

  /**
   * 提取节点的导入信息
   */
  private extractImports(node: GraphNode): string[] {
    const imports: string[] = []
    const source = node.properties?.source as string || node.properties?.body as string || ''
    
    // 匹配 ES6 导入
    const es6ImportRegex = /import\s+(?:.*?)\s+from\s+['"](.*?)['"]|import\s+['"](.*?)['"]/g
    let match
    while ((match = es6ImportRegex.exec(source)) !== null) {
      const importPath = match[1] || match[2]
      if (importPath && !importPath.startsWith('.')) { // 排除相对导入
        imports.push(importPath)
      }
    }

    // 匹配 CommonJS 导入
    const cjsImportRegex = /require\s*\(\s*['"](.*?)['"\s*\)]/g
    while ((match = cjsImportRegex.exec(source)) !== null) {
      const importPath = match[1]
      if (importPath && !importPath.startsWith('.')) {
        imports.push(importPath)
      }
    }

    return [...new Set(imports)]
  }

  /**
   * 检查节点是否为导出符号
   */
  private isExportedSymbol(node: GraphNode): boolean {
    const source = node.properties?.source as string || node.properties?.body as string || ''
    const name = node.name

    return source.includes(`export`) && 
           (source.includes(`export function ${name}`) || 
            source.includes(`export class ${name}`) ||
            source.includes(`export const ${name}`) ||
            source.includes(`export { ${name}`) ||
            source.includes(`export default ${name}`))
  }

  /**
   * 提取导出名称
   */
  private extractExportName(node: GraphNode): string | null {
    return node.name || null
  }

  /**
   * 提取节点使用的类型
   */
  private extractUsedTypes(node: GraphNode): string[] {
    const types: string[] = []
    const source = node.properties?.source as string || 
                  node.properties?.signature as string || 
                  node.properties?.body as string || ''

    // 匹配 TypeScript 类型注解
    const typeRegex = /:\s*([A-Z][a-zA-Z0-9_]*)/g
    let match
    while ((match = typeRegex.exec(source)) !== null) {
      types.push(match[1])
    }

    // 匹配泛型类型
    const genericRegex = /<([A-Z][a-zA-Z0-9_]*)/g
    while ((match = genericRegex.exec(source)) !== null) {
      types.push(match[1])
    }

    return [...new Set(types)]
  }

  /**
   * 检查函数是否为类的方法
   */
  private isMethodOfClass(func: GraphNode, cls: GraphNode): boolean {
    const funcPath = this.extractFilePath(func)
    const clsPath = this.extractFilePath(cls)
    
    // 必须在同一文件
    if (funcPath !== clsPath) return false

    // 检查函数是否在类内部定义
    const clsSource = cls.properties?.source as string || cls.properties?.body as string || ''
    const funcName = func.name

    return clsSource.includes(funcName) && 
           (clsSource.includes(`${funcName}(`) || clsSource.includes(`${funcName} (`))
  }

  /**
   * 检查类是否实现接口
   */
  private implementsInterface(cls: GraphNode, iface: GraphNode): boolean {
    const clsSource = cls.properties?.source as string || cls.properties?.body as string || ''
    const ifaceName = iface.name

    return clsSource.includes('implements') && clsSource.includes(ifaceName)
  }

  /**
   * 根据ID查找节点
   */
  private findNodeById(nodesByType: Map<string, GraphNode[]>, nodeId: string): GraphNode | null {
    for (const nodes of nodesByType.values()) {
      for (const node of nodes) {
        if (node.id === nodeId) {
          return node
        }
      }
    }
    return null
  }

  /**
   * 查找类型定义
   */
  private findTypeDefinitions(nodesByType: Map<string, GraphNode[]>, typeName: string): GraphNode[] {
    const definitions: GraphNode[] = []
    
    // 查找类、接口、类型别名
    const candidates = [
      ...(nodesByType.get('Class') || []),
      ...(nodesByType.get('Interface') || []),
      ...(nodesByType.get('Type') || []),
    ]

    for (const candidate of candidates) {
      if (candidate.name === typeName) {
        definitions.push(candidate)
      }
    }

    return definitions
  }

  /**
   * 检查是否为合理的类型使用
   */
  private isReasonableTypeUsage(usingNode: GraphNode, typeDefNode: GraphNode): boolean {
    // 排除一些明显不合理的情况
    if (usingNode.type === typeDefNode.type) {
      return false // 同类型节点不应该有USES_TYPE关系
    }

    // 函数/方法使用类型是合理的
    if (usingNode.type === 'Function' && 
        (typeDefNode.type === 'Class' || typeDefNode.type === 'Interface' || typeDefNode.type === 'Type')) {
      return true
    }

    // 类使用接口是合理的
    if (usingNode.type === 'Class' && typeDefNode.type === 'Interface') {
      return true
    }

    return false
  }

  /**
   * 查找命名相似的实体
   */
  private findSimilarlyNamedEntities(nodesByType: Map<string, GraphNode[]>): GraphNode[][] {
    const similarGroups: GraphNode[][] = []
    const allNodes = Array.from(nodesByType.values()).flat()
    const processed = new Set<string>()

    for (const node of allNodes) {
      if (processed.has(node.id)) continue

      const similar = allNodes.filter(other => 
        other.id !== node.id && 
        !processed.has(other.id) && 
        this.areNamesSimilar(node.name, other.name)
      )

      if (similar.length > 0) {
        similarGroups.push([node, ...similar])
        processed.add(node.id)
        similar.forEach(s => processed.add(s.id))
      }
    }

    return similarGroups
  }

  /**
   * 检查名称是否相似
   */
  private areNamesSimilar(name1: string, name2: string): boolean {
    // 简单的相似性检查
    const commonWords = ['get', 'set', 'create', 'update', 'delete', 'find', 'list']
    
    for (const word of commonWords) {
      if (name1.toLowerCase().includes(word) && name2.toLowerCase().includes(word)) {
        return true
      }
    }

    // Levenshtein distance 或其他相似性算法
    return this.calculateSimilarity(name1, name2) > 0.7
  }

  /**
   * 计算字符串相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  /**
   * 计算 Levenshtein 距离
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * 创建高可信度的关系
   */
  private createReliableRelationship(
    source: GraphNode,
    target: GraphNode,
    relationType: RelationType,
    description: string,
    confidence: number
  ): GraphRelationship {
    return {
      id: RelationshipIdGenerator.generate(relationType, source.id, target.id),
      type: relationType,
      source: source.id,
      target: target.id,
      properties: {
        description,
        confidence,
        analysis_method: 'semantic_intelligent',
      },
      metadata: {
        created_at: new Date().toISOString(),
        confidence,
      },
    }
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
      id: RelationshipIdGenerator.generate(pattern.relationType, node1.id, node2.id),
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
   * 获取关系类型分布
   */
  private getRelationshipTypeDistribution(relationships: GraphRelationship[]): Record<string, number> {
    const distribution: Record<string, number> = {}
    for (const rel of relationships) {
      distribution[rel.type] = (distribution[rel.type] || 0) + 1
    }
    return distribution
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
