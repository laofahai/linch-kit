/**
 * Neo4j Graph Service with Neogma OGM
 * 
 * Neo4j AuraDB 连接管理和图数据库操作
 * 使用 Neogma OGM 提供类型安全的数据访问
 */

import neo4j, { Driver, Node, Relationship } from 'neo4j-driver'
import { createLogger } from '@linch-kit/core/server'

import type {
  IGraphService,
  Neo4jConfig,
  GraphNode,
  GraphRelationship,
  QueryResult,
  GraphStats,
  NodeType,
  RelationType,
  Logger
} from '../types/index.js'

import { 
  initializeNeogma, 
  getNeogma, 
  GraphQueryService
} from './neo4j-models.js'

/**
 * Neo4j 图数据库服务
 */
export class Neo4jService implements IGraphService {
  private driver: Driver | null = null
  private logger: Logger
  private queryService: GraphQueryService | null = null
  
  constructor(private config: Neo4jConfig) {
    this.logger = createLogger({ name: 'ai:neo4j-service' })
  }

  /**
   * 建立 Neo4j 连接
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('连接到 Neo4j AuraDB...', {
        uri: this.config.connectionUri,
        database: this.config.database,
        username: this.config.username
      })

      this.driver = neo4j.driver(
        this.config.connectionUri,
        neo4j.auth.basic(this.config.username, this.config.password),
        {
          maxTransactionRetryTime: 15000,
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 60000,
          maxConnectionLifetime: 30 * 60 * 1000, // 30分钟
        }
      )

      // 验证连接
      await this.driver.verifyConnectivity()
      
      // 初始化 Neogma OGM
      const neogma = initializeNeogma(
        this.config.connectionUri,
        this.config.username,
        this.config.password
      )
      this.queryService = new GraphQueryService(neogma)
      
      // 创建约束和索引
      await this.setupDatabase()

      this.logger.info('成功连接到 Neo4j AuraDB，Neogma OGM 已初始化')
    } catch (error) {
      this.logger.error('Neo4j 连接失败', error instanceof Error ? error : undefined, { originalError: error })
      throw new Error(`Neo4j connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 关闭 Neo4j 连接
   */
  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close()
      this.driver = null
      this.logger.info('已断开 Neo4j 连接')
    }
  }

  /**
   * 执行 Cypher 查询
   */
  async query(cypher: string, parameters: Record<string, unknown> = {}): Promise<QueryResult> {
    if (!this.driver) {
      throw new Error('Neo4j 连接未建立。请先调用 connect()')
    }

    const session = this.driver.session({ database: this.config.database })
    const startTime = Date.now()

    try {
      this.logger.debug('执行 Cypher 查询', { cypher, parameters })
      
      const result = await session.run(cypher, parameters)
      const queryTime = Date.now() - startTime
      
      const nodes: GraphNode[] = []
      const relationships: GraphRelationship[] = []
      
      // 处理查询结果
      for (const record of result.records) {
        for (const [_key, value] of Object.entries(record.toObject())) {
          if (neo4j.isNode(value)) {
            const graphNode = this.neo4jNodeToGraphNode(value)
            if (graphNode) {
              nodes.push(graphNode)
            }
          } else if (neo4j.isRelationship(value)) {
            const graphRel = this.neo4jRelationshipToGraphRelationship(value)
            if (graphRel) {
              relationships.push(graphRel)
            }
          }
        }
      }

      this.logger.debug('查询执行完成', {
        queryTime,
        nodeCount: nodes.length,
        relationshipCount: relationships.length,
        recordCount: result.records.length
      })

      return {
        nodes,
        relationships,
        metadata: {
          query_time_ms: queryTime,
          result_count: result.records.length,
          query: cypher
        }
      }
    } catch (error) {
      this.logger.error('Cypher 查询失败', error instanceof Error ? error : undefined, { cypher, parameters, originalError: error })
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * 批量导入图数据
   */
  async importData(nodes: GraphNode[], relationships: GraphRelationship[]): Promise<void> {
    if (!this.driver) {
      throw new Error('Neo4j 连接未建立。请先调用 connect()')
    }

    const session = this.driver.session({ database: this.config.database })
    const startTime = Date.now()

    try {
      this.logger.info('开始批量导入图数据', {
        nodeCount: nodes.length,
        relationshipCount: relationships.length
      })

      await session.executeWrite(async (tx) => {
        // 批量创建节点
        await this.batchCreateNodes(tx, nodes)
        
        // 批量创建关系
        await this.batchCreateRelationships(tx, relationships)
      })

      const duration = Date.now() - startTime
      this.logger.info('图数据导入完成', {
        duration,
        nodeCount: nodes.length,
        relationshipCount: relationships.length
      })
    } catch (error) {
      this.logger.error('图数据导入失败', error instanceof Error ? error : undefined, { originalError: error })
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * 查找单个节点
   */
  async findNode(id: string): Promise<GraphNode | null> {
    const result = await this.query(
      'MATCH (n {id: $id}) RETURN n LIMIT 1',
      { id }
    )
    
    return result.nodes.length > 0 ? result.nodes[0] : null
  }

  /**
   * 查找关联节点
   */
  async findRelatedNodes(nodeId: string, relationType?: RelationType): Promise<GraphNode[]> {
    const relationFilter = relationType ? `[r:${relationType}]` : '[r]'
    
    const result = await this.query(
      `MATCH (n {id: $nodeId})-${relationFilter}-(related) 
       RETURN DISTINCT related`,
      { nodeId }
    )
    
    return result.nodes
  }

  /**
   * 清空数据库
   */
  async clearDatabase(): Promise<void> {
    this.logger.warn('清空 Neo4j 数据库...')
    
    await this.query('MATCH (n) DETACH DELETE n')
    
    this.logger.info('数据库已清空')
  }

  /**
   * 获取图统计信息
   */
  async getStats(): Promise<GraphStats> {
    try {
      // 使用原生查询获取准确的统计信息
      const nodeCountResult = await this.executeRawCypher('MATCH (n) RETURN count(n) as count')
      const relCountResult = await this.executeRawCypher('MATCH ()-[r]->() RETURN count(r) as count')
      
      const nodeTypeResult = await this.executeRawCypher(`
        MATCH (n) 
        RETURN labels(n)[0] as type, count(n) as count
        ORDER BY count DESC
      `)
      
      const relTypeResult = await this.executeRawCypher(`
        MATCH ()-[r]->() 
        RETURN type(r) as type, count(r) as count
        ORDER BY count DESC
      `)
      
      // 从查询结果中获取节点计数
      const nodeCount = nodeCountResult.records.length > 0 ? 
        nodeCountResult.records[0].get('count').toNumber() : 0
      const relCount = relCountResult.records.length > 0 ? 
        relCountResult.records[0].get('count').toNumber() : 0
      
      // 处理节点类型统计
      const nodeTypes: Record<string, number> = {}
      for (const record of nodeTypeResult.records) {
        const type = record.get('type')
        const count = record.get('count').toNumber()
        if (type) {
          nodeTypes[type] = count
        }
      }
      
      // 处理关系类型统计
      const relationshipTypes: Record<string, number> = {}
      for (const record of relTypeResult.records) {
        const type = record.get('type')
        const count = record.get('count').toNumber()
        if (type) {
          relationshipTypes[type] = count
        }
      }
      
      this.logger.debug('图统计信息获取成功', {
        nodeCount,
        relCount,
        nodeTypesCount: Object.keys(nodeTypes).length,
        relationshipTypesCount: Object.keys(relationshipTypes).length
      })
      
      return {
        node_count: nodeCount,
        relationship_count: relCount,
        node_types: nodeTypes,
        relationship_types: relationshipTypes,
        last_updated: new Date().toISOString()
      }
    } catch (error) {
      this.logger.error('获取图统计信息失败', error instanceof Error ? error : undefined)
      throw error
    }
  }

  /**
   * 设置数据库约束和索引
   */
  private async setupDatabase(): Promise<void> {
    const constraints = [
      // 节点唯一性约束 - Neo4j 5.x 语法
      'CREATE CONSTRAINT node_id_unique IF NOT EXISTS FOR (n:GraphNode) REQUIRE n.id IS UNIQUE',
      
      // 节点类型索引
      'CREATE INDEX node_type_index IF NOT EXISTS FOR (n:GraphNode) ON (n.type)',
      'CREATE INDEX node_name_index IF NOT EXISTS FOR (n:GraphNode) ON (n.name)',
      
      // 关系索引 - 关系不支持唯一约束，使用索引代替
      'CREATE INDEX relationship_id_index IF NOT EXISTS FOR ()-[r:RELATED_TO]-() ON (r.id)'
    ]

    for (const constraint of constraints) {
      try {
        await this.query(constraint)
        this.logger.debug('约束/索引创建成功', { constraint })
      } catch (error) {
        // 约束/索引可能已存在，记录但不抛出错误
        this.logger.debug('约束/索引创建结果', { constraint, error })
      }
    }
  }

  /**
   * 批量创建节点
   */
  private async batchCreateNodes(tx: import('neo4j-driver').ManagedTransaction, nodes: GraphNode[]): Promise<void> {
    const batchSize = 500
    
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize).map(node => ({
        id: node.id,
        type: node.type,
        name: node.name,
        // 平坦化 metadata 对象
        ...this.flattenMetadata(node.metadata || {}),
        // 平坦化 properties 对象
        ...this.flattenMetadata(node.properties || {}, 'prop_')
      }))
      
      // 尝试使用 APOC 优化，如果失败则使用原生方法
      try {
        const apocCypher = `
          CALL apoc.periodic.iterate(
            'UNWIND $nodes as nodeData RETURN nodeData',
            'MERGE (n:GraphNode {id: nodeData.id})
             SET n = nodeData,
                 n.updated_at = datetime()
             WITH n, nodeData
             CALL apoc.create.addLabels(n, [nodeData.type]) YIELD node
             RETURN count(node)',
            {batchSize: 100, parallel: true, params: {nodes: $nodes}}
          ) YIELD batches, total, timeTaken
          RETURN batches, total, timeTaken
        `
        
        await tx.run(apocCypher, { nodes: batch })
        this.logger.debug(`批次 ${Math.floor(i/batchSize) + 1}: 使用 APOC 创建了 ${batch.length} 个节点`)
      } catch (apocError) {
        // APOC 不可用，使用原生 Cypher
        this.logger.debug('APOC 不可用，使用原生 Cypher', { error: apocError })
        
        const nativeCypher = `
          UNWIND $nodes as nodeData
          MERGE (n:GraphNode {id: nodeData.id})
          SET n = nodeData,
              n.updated_at = datetime()
          RETURN count(n)
        `
        
        await tx.run(nativeCypher, { nodes: batch })
        this.logger.debug(`批次 ${Math.floor(i/batchSize) + 1}: 使用原生 Cypher 创建了 ${batch.length} 个节点`)
      }
    }
    
    this.logger.debug(`批量创建了 ${nodes.length} 个节点`)
  }

  /**
   * 批量创建关系
   */
  private async batchCreateRelationships(tx: import('neo4j-driver').ManagedTransaction, relationships: GraphRelationship[]): Promise<void> {
    const batchSize = 1000 // 大批量处理关系
    
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize).map(rel => ({
        id: rel.id,
        source: rel.source,
        target: rel.target,
        type: rel.type,
        // 平坦化 metadata 和 properties
        ...this.flattenMetadata(rel.metadata || {}),
        ...this.flattenMetadata(rel.properties || {}, 'prop_')
      }))
      
      // 使用 UNWIND 批量创建关系，支持动态关系类型
      const cypher = `
        UNWIND $relationships AS relData
        MATCH (source:GraphNode {id: relData.source})
        MATCH (target:GraphNode {id: relData.target})
        CALL apoc.create.relationship(source, relData.type, relData, target) YIELD rel
        RETURN count(rel)
      `
      
      // 如果 APOC 不可用，使用原生方法（关系类型固定）
      const fallbackCypher = `
        UNWIND $relationships AS relData
        MATCH (source:GraphNode {id: relData.source})
        MATCH (target:GraphNode {id: relData.target})
        CREATE (source)-[r:RELATED_TO]->(target)
        SET r = relData,
            r.updated_at = datetime()
        RETURN count(r)
      `
      
      try {
        // 尝试使用 APOC 创建动态关系类型
        const result = await tx.run(cypher, { relationships: batch })
        const createdCount = result.records[0]?.get(0) || 0
        this.logger.debug(`批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(relationships.length/batchSize)}: 使用 APOC 创建了 ${createdCount} 个关系`)
      } catch (apocError) {
        // APOC 不可用，使用原生方法
        this.logger.debug('APOC 不可用，使用原生关系创建', { error: apocError })
        const result = await tx.run(fallbackCypher, { relationships: batch })
        const createdCount = result.records[0]?.get(0) || 0
        this.logger.debug(`批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(relationships.length/batchSize)}: 使用原生方法创建了 ${createdCount} 个关系`)
      }
    }
    
    this.logger.debug(`批量创建了 ${relationships.length} 个关系`)
  }

  /**
   * 转换 Neo4j 节点为 GraphNode
   */
  private neo4jNodeToGraphNode(node: Node): GraphNode | null {
    const properties = node.properties
    
    if (!properties.id || !properties.type || !properties.name) {
      this.logger.warn('Neo4j 节点缺少必要属性', { properties })
      return null
    }
    
    return {
      id: properties.id as string,
      type: properties.type as NodeType,
      name: properties.name as string,
      properties: properties.properties as Record<string, unknown> || {},
      metadata: (properties.metadata as Record<string, unknown>) || {}
    }
  }

  /**
   * 转换 Neo4j 关系为 GraphRelationship
   */
  private neo4jRelationshipToGraphRelationship(rel: Relationship): GraphRelationship | null {
    const properties = rel.properties
    
    if (!properties.id) {
      this.logger.warn('Neo4j 关系缺少必要属性', { properties })
      return null
    }
    
    return {
      id: properties.id as string,
      type: rel.type as RelationType,
      source: rel.start.toString(),
      target: rel.end.toString(),
      properties: properties.properties as Record<string, unknown> || {},
      metadata: (properties.metadata as Record<string, unknown>) || {}
    }
  }

  /**
   * 平坦化 metadata 对象，将嵌套对象转换为 Neo4j 支持的平坦属性
   */
  private flattenMetadata(metadata: Record<string, unknown>, prefix: string = 'metadata_'): Record<string, unknown> {
    const flattened: Record<string, unknown> = {}
    
    if (!metadata || typeof metadata !== 'object') {
      return flattened
    }
    
    for (const [key, value] of Object.entries(metadata)) {
      const flatKey = `${prefix}${key}`
      
      if (value === null || value === undefined) {
        flattened[flatKey] = null
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // 递归平坦化嵌套对象
        Object.assign(flattened, this.flattenMetadata(value as Record<string, unknown>, `${flatKey}_`))
      } else if (Array.isArray(value)) {
        // 数组转换为字符串
        flattened[flatKey] = JSON.stringify(value)
      } else {
        // 基本类型直接赋值
        flattened[flatKey] = value
      }
    }
    
    return flattened
  }

  // ===== Neogma OGM 高级查询方法 =====

  /**
   * 使用 Neogma OGM 查询节点
   * 提供更简洁和类型安全的节点查询接口
   */
  async findNodesOGM(options: {
    searchTerm?: string
    nodeType?: NodeType | NodeType[]
    limit?: number
    exact?: boolean
    properties?: Record<string, unknown>
  }): Promise<GraphNode[]> {
    if (!this.queryService) {
      throw new Error('Neogma query service 未初始化')
    }

    const nodes = await this.queryService.findNodes({
      searchTerm: options.searchTerm,
      nodeType: options.nodeType as NodeType[],
      limit: options.limit,
      exact: options.exact,
      properties: options.properties
    })

    // 转换为 GraphNode 格式
    return nodes.map(node => ({
      id: node.id,
      type: node.type,
      name: node.name,
      properties: {
        ...node.properties,
        description: node.description,
        file_path: node.file_path,
        line_number: node.line_number
      },
      metadata: {
        ...node.metadata,
        created_at: node.created_at,
        updated_at: node.updated_at
      }
    }))
  }

  /**
   * 使用 Neogma OGM 查询关系
   * 提供更强大的关系遍历功能
   */
  async findRelationshipsOGM(nodeId: string, options: {
    depth?: number
    direction?: 'in' | 'out' | 'both'
    relationshipType?: RelationType | RelationType[]
    limit?: number
  }) {
    if (!this.queryService) {
      throw new Error('Neogma query service 未初始化')
    }

    return await this.queryService.findRelationships(nodeId, {
      depth: options.depth,
      direction: options.direction,
      relationshipType: options.relationshipType as RelationType[],
      limit: options.limit
    })
  }

  /**
   * 使用 Neogma OGM 查询路径
   * 实现智能路径发现算法
   */
  async findPathsOGM(
    startTerm: string,
    endTerm: string,
    options: {
      maxLength?: number
      limit?: number
      includeAllPaths?: boolean
    } = {}
  ) {
    if (!this.queryService) {
      throw new Error('Neogma query service 未初始化')
    }

    return await this.queryService.findPaths(startTerm, endTerm, options)
  }

  /**
   * 使用 Neogma OGM 获取统计信息
   * 提供更准确和详细的图统计数据
   */
  async getStatsOGM(): Promise<GraphStats> {
    if (!this.queryService) {
      throw new Error('Neogma query service 未初始化')
    }

    const stats = await this.queryService.getStats()
    
    return {
      node_count: stats.node_count,
      relationship_count: stats.relationship_count,
      node_types: stats.node_types as Record<NodeType, number>,
      relationship_types: stats.relationship_types as Record<RelationType, number>,
      last_updated: new Date().toISOString()
    }
  }

  /**
   * 使用 Neogma 批量创建节点
   * 利用 OGM 的类型安全特性
   */
  async createNodesOGM(nodes: GraphNode[]): Promise<void> {
    if (!this.queryService) {
      throw new Error('Neogma query service 未初始化')
    }

    getNeogma() // 确保 neogma 已初始化
    
    // 转换为 Neogma 格式并批量创建
    const nodeData = nodes.map(node => ({
      id: node.id,
      type: node.type,
      name: node.name,
      description: node.properties?.description as string,
      file_path: node.properties?.file_path as string,
      line_number: node.properties?.line_number as number,
      properties: node.properties || {},
      metadata: node.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    // 暂时使用原生 driver 直到 Neogma 类型完全兼容
    const session = this.driver?.session()
    if (!session) {
      throw new Error('Neo4j driver 未初始化')
    }
    
    try {
      const createQuery = `
        UNWIND $nodes AS node
        MERGE (n:GraphNode {id: node.id})
        SET n += node
        RETURN n
      `
      await session.run(createQuery, { nodes: nodeData })
    } finally {
      await session.close()
    }
    
    this.logger.info(`使用 Neogma OGM 成功创建 ${nodes.length} 个节点`)
  }

  /**
   * 使用原生查询的逃生通道
   * 当 OGM 无法满足复杂查询需求时使用
   */
  async executeRawCypher(cypher: string, parameters: Record<string, unknown> = {}): Promise<{
    records: unknown[]
    summary: unknown
  }> {
    if (!this.queryService) {
      throw new Error('Neogma query service 未初始化')
    }

    if (!this.driver) {
      throw new Error('Neo4j 连接未建立')
    }
    
    const session = this.driver.session()
    try {
      const result = await session.run(cypher, parameters)
      return {
        records: result.records,
        summary: result.summary
      }
    } finally {
      await session.close()
    }
  }

  /**
   * 获取 Neogma 查询服务实例
   * 用于更高级的自定义查询
   */
  getQueryService(): GraphQueryService {
    if (!this.queryService) {
      throw new Error('Neogma query service 未初始化')
    }
    return this.queryService
  }
}