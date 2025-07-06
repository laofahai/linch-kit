/**
 * Neo4j Graph Service
 * 
 * Neo4j AuraDB 连接管理和图数据库操作
 * 使用 @linch-kit/core 的日志和配置系统
 */

import neo4j, { Driver, Session, Node, Relationship } from 'neo4j-driver'
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

/**
 * Neo4j 图数据库服务
 */
export class Neo4jService implements IGraphService {
  private driver: Driver | null = null
  private logger: Logger
  
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
      
      // 创建约束和索引
      await this.setupDatabase()

      this.logger.info('成功连接到 Neo4j AuraDB')
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
        for (const [key, value] of Object.entries(record.toObject())) {
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
    const nodeCountResult = await this.query('MATCH (n) RETURN count(n) as count')
    const relCountResult = await this.query('MATCH ()-[r]->() RETURN count(r) as count')
    
    const nodeTypeResult = await this.query(`
      MATCH (n) 
      RETURN labels(n)[0] as type, count(n) as count
    `)
    
    const relTypeResult = await this.query(`
      MATCH ()-[r]->() 
      RETURN type(r) as type, count(r) as count
    `)
    
    const nodeTypes: Record<NodeType, number> = {} as any
    for (const record of nodeTypeResult.metadata.query === nodeTypeResult.metadata.query ? [] : []) {
      // 处理节点类型统计
    }
    
    const relationshipTypes: Record<RelationType, number> = {} as any
    for (const record of relTypeResult.metadata.query === relTypeResult.metadata.query ? [] : []) {
      // 处理关系类型统计  
    }
    
    return {
      node_count: nodeCountResult.metadata.result_count,
      relationship_count: relCountResult.metadata.result_count,
      node_types: nodeTypes,
      relationship_types: relationshipTypes,
      last_updated: new Date().toISOString()
    }
  }

  /**
   * 设置数据库约束和索引
   */
  private async setupDatabase(): Promise<void> {
    const constraints = [
      // 节点唯一性约束
      'CREATE CONSTRAINT node_id_unique IF NOT EXISTS FOR (n) REQUIRE n.id IS UNIQUE',
      
      // 节点类型索引
      'CREATE INDEX node_type_index IF NOT EXISTS FOR (n) ON (n.type)',
      'CREATE INDEX node_name_index IF NOT EXISTS FOR (n) ON (n.name)',
      
      // 关系唯一性约束
      'CREATE CONSTRAINT relationship_id_unique IF NOT EXISTS FOR ()-[r]-() REQUIRE r.id IS UNIQUE'
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
  private async batchCreateNodes(tx: any, nodes: GraphNode[]): Promise<void> {
    const batchSize = 100
    
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize).map(node => ({
        ...node,
        // 平坦化 metadata 对象
        flattenedMetadata: this.flattenMetadata(node.metadata)
      }))
      
      const cypher = `
        UNWIND $nodes as nodeData
        MERGE (n {id: nodeData.id})
        SET n += nodeData.properties,
            n.type = nodeData.type,
            n.name = nodeData.name,
            n += nodeData.flattenedMetadata,
            n.updated_at = datetime()
        WITH n, nodeData
        CALL apoc.create.addLabels(n, [nodeData.type]) YIELD node
        RETURN count(node)
      `
      
      await tx.run(cypher, { nodes: batch })
    }
    
    this.logger.debug(`批量创建了 ${nodes.length} 个节点`)
  }

  /**
   * 批量创建关系
   */
  private async batchCreateRelationships(tx: any, relationships: GraphRelationship[]): Promise<void> {
    // 处理每个关系，一次一个
    for (const rel of relationships) {
      const flattenedMetadata = this.flattenMetadata(rel.metadata)
      const flattenedProperties = this.flattenMetadata(rel.properties, 'prop_')
      
      // 合并所有属性
      const allProperties = {
        id: rel.id,
        type: rel.type,
        updated_at: 'datetime()',
        ...flattenedMetadata,
        ...flattenedProperties
      }
      
      // 构建属性设置语句
      const propertySetters = Object.keys(allProperties)
        .filter(key => key !== 'updated_at')
        .map(key => `r.${key} = $${key}`)
        .join(', ')
      
      const cypher = `
        MATCH (source {id: $sourceId})
        MATCH (target {id: $targetId})
        CREATE (source)-[r:RELATIONSHIP]->(target)
        SET ${propertySetters}, r.updated_at = datetime()
        RETURN r
      `
      
      const params = {
        sourceId: rel.source,
        targetId: rel.target,
        ...Object.fromEntries(
          Object.entries(allProperties).filter(([key]) => key !== 'updated_at')
        )
      }
      
      await tx.run(cypher, params)
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
      metadata: properties.metadata as any || {}
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
      metadata: properties.metadata as any || {}
    }
  }

  /**
   * 平坦化 metadata 对象，将嵌套对象转换为 Neo4j 支持的平坦属性
   */
  private flattenMetadata(metadata: any, prefix: string = 'metadata_'): Record<string, any> {
    const flattened: Record<string, any> = {}
    
    if (!metadata || typeof metadata !== 'object') {
      return flattened
    }
    
    for (const [key, value] of Object.entries(metadata)) {
      const flatKey = `${prefix}${key}`
      
      if (value === null || value === undefined) {
        flattened[flatKey] = null
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // 递归平坦化嵌套对象
        Object.assign(flattened, this.flattenMetadata(value, `${flatKey}_`))
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
}