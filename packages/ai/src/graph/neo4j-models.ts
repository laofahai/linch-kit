/**
 * Neo4j Neogma Models (暂时简化版本)
 * 
 * 使用 Neogma OGM 定义图数据库模型，提供类型安全的数据访问
 * 注意：当前版本暂时注释掉复杂的 Neogma 集成，专注于基础功能
 */

import { Neogma } from 'neogma'
import type { Driver } from 'neo4j-driver'

import type { GraphNode, GraphRelationship } from '../types/index.js'
import { NodeType as NodeTypeEnum, RelationType as RelationTypeEnum } from '../types/index.js'

// Neogma 实例
let neogma: Neogma | null = null

/**
 * 初始化 Neogma 实例（暂时简化版本）
 * 注意：当前版本专注于验证连接，复杂的 OGM 集成将在后续版本实现
 */
export function initializeNeogma(connectionUri: string, username: string, password: string): Neogma {
  if (!neogma) {
    neogma = new Neogma({
      url: connectionUri,
      username: username,
      password: password
    })
  }
  return neogma
}

/**
 * 获取 Neogma 实例
 */
export function getNeogma(): Neogma {
  if (!neogma) {
    throw new Error('Neogma 实例未初始化，请先调用 initializeNeogma()')
  }
  return neogma
}

/**
 * 通用节点模型接口（简化版本）
 */
export interface NodeProperties {
  id: string
  type: NodeTypeEnum
  name: string
  description?: string
  file_path?: string
  line_number?: number
  properties?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

/**
 * 通用关系模型接口（简化版本）
 */
export interface RelationshipProperties {
  id: string
  type: RelationTypeEnum
  properties?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at?: string
  weight?: number
}

/**
 * 查询辅助函数（简化版本）
 */
export class GraphQueryService {
  private neogma: Neogma

  constructor(neogma: Neogma) {
    this.neogma = neogma
  }

  /**
   * 高级节点查询（使用原生 driver）
   */
  async findNodes(options: {
    searchTerm?: string
    nodeType?: NodeTypeEnum | NodeTypeEnum[]
    limit?: number
    exact?: boolean
    properties?: Record<string, unknown>
  }): Promise<NodeProperties[]> {
    const { searchTerm, nodeType, limit = 10, exact = false, properties } = options

    // 构建查询条件
    const whereConditions: string[] = []
    const parameters: Record<string, unknown> = {}

    // 搜索词条件
    if (searchTerm) {
      if (exact) {
        whereConditions.push('(n.name = $searchTerm OR n.id = $searchTerm)')
      } else {
        whereConditions.push(`(
          toLower(n.name) CONTAINS toLower($searchTerm) OR 
          toLower(n.id) CONTAINS toLower($searchTerm) OR
          toLower(toString(n.description)) CONTAINS toLower($searchTerm) OR
          toLower(toString(n.file_path)) CONTAINS toLower($searchTerm)
        )`)
      }
      parameters.searchTerm = searchTerm
    }

    // 节点类型条件
    if (nodeType) {
      if (Array.isArray(nodeType)) {
        const typeConditions = nodeType.map((type, index) => {
          parameters[`type${index}`] = type
          return `n.type = $type${index}`
        }).join(' OR ')
        whereConditions.push(`(${typeConditions})`)
      } else {
        whereConditions.push('n.type = $nodeType')
        parameters.nodeType = nodeType
      }
    }

    // 属性条件
    if (properties) {
      Object.entries(properties).forEach(([key, value], index) => {
        whereConditions.push(`n.${key} = $prop${index}`)
        parameters[`prop${index}`] = value
      })
    }

    // 构建查询
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // 构建排序子句
    let orderClause = 'ORDER BY n.name'
    if (searchTerm) {
      orderClause = `
        ORDER BY 
          CASE 
            WHEN n.name = $searchTerm THEN 1
            WHEN n.id = $searchTerm THEN 2
            WHEN n.name STARTS WITH $searchTerm THEN 3
            WHEN n.id STARTS WITH $searchTerm THEN 4
            ELSE 5
          END,
          n.name
      `
    }
    
    const cypher = `
      MATCH (n)
      ${whereClause}
      RETURN n
      ${orderClause}
      LIMIT $limit
    `

    parameters.limit = Math.floor(limit)

    const session = this.neogma.driver.session()
    try {
      const result = await session.run(cypher, parameters)
      return result.records.map((record: any) => record.get('n').properties)
    } finally {
      await session.close()
    }
  }

  /**
   * 高级关系查询（使用原生 driver）
   */
  async findRelationships(nodeId: string, options: {
    depth?: number
    direction?: 'in' | 'out' | 'both'
    relationshipType?: RelationTypeEnum | RelationTypeEnum[]
    limit?: number
  }) {
    const { depth = 1, direction = 'both', relationshipType, limit = 20 } = options
    const maxDepth = Math.min(depth, 5) // 限制最大深度

    // 构建关系模式
    let relationPattern = ''
    let relationshipTypeFilter = ''

    if (relationshipType) {
      if (Array.isArray(relationshipType)) {
        relationshipTypeFilter = `:${relationshipType.join('|')}`
      } else {
        relationshipTypeFilter = `:${relationshipType}`
      }
    }

    switch (direction) {
      case 'in':
        relationPattern = `<-[r${relationshipTypeFilter}*1..${maxDepth}]-`
        break
      case 'out':
        relationPattern = `-[r${relationshipTypeFilter}*1..${maxDepth}]->`
        break
      case 'both':
      default:
        relationPattern = `-[r${relationshipTypeFilter}*1..${maxDepth}]-`
        break
    }

    const cypher = `
      MATCH (start)
      WHERE start.id = $nodeId OR start.name CONTAINS $nodeId
      WITH start
      MATCH (start)${relationPattern}(related)
      RETURN DISTINCT start, r, related
      ORDER BY related.name
      LIMIT $limit
    `

    const session = this.neogma.driver.session()
    const queryResponse = await session.run(cypher, { nodeId, limit: Math.floor(limit) })
    await session.close()
    
    const nodes = new Map<string, NodeProperties>()
    const relationships: GraphRelationship[] = []

    queryResponse.records.forEach((record: any) => {
      const start = record.get('start').properties
      const related = record.get('related').properties
      const rels = record.get('r')

      nodes.set(start.id, start)
      nodes.set(related.id, related)

      // 处理关系（可能是数组）
      if (Array.isArray(rels)) {
        rels.forEach(rel => {
          relationships.push({
            id: rel.elementId || `${rel.start}-${rel.type}-${rel.end}`,
            type: rel.type as RelationTypeEnum,
            source: rel.start.toString(),
            target: rel.end.toString(),
            properties: rel.properties || {},
            metadata: { created_at: new Date().toISOString() }
          })
        })
      } else if (rels) {
        relationships.push({
          id: rels.elementId || `${rels.start}-${rels.type}-${rels.end}`,
          type: rels.type as RelationTypeEnum,
          source: rels.start.toString(),
          target: rels.end.toString(),
          properties: rels.properties || {},
          metadata: { created_at: new Date().toISOString() }
        })
      }
    })

    return {
      nodes: Array.from(nodes.values()),
      relationships,
      stats: {
        totalNodes: nodes.size,
        totalRelationships: relationships.length,
        maxDepth: maxDepth,
        relationshipTypes: relationships.reduce((acc, rel) => {
          acc[rel.type] = (acc[rel.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }
  }

  /**
   * 路径查询（使用原生 driver）
   */
  async findPaths(
    startTerm: string,
    endTerm: string,
    options: {
      maxLength?: number
      limit?: number
      includeAllPaths?: boolean
    } = {}
  ) {
    const { maxLength = 6, limit = 5 } = options

    // 查找起始和结束节点
    const findNodesQuery = `
      MATCH (start), (end)
      WHERE (start.name CONTAINS $startTerm OR start.id CONTAINS $startTerm)
        AND (end.name CONTAINS $endTerm OR end.id CONTAINS $endTerm)
        AND start <> end
      RETURN start, end
      LIMIT 10
    `

    const session = this.neogma.driver.session()
    const nodesResult = await session.run(findNodesQuery, { startTerm, endTerm })
    
    if (nodesResult.records.length === 0) {
      throw new Error(`找不到匹配的节点对: "${startTerm}" 和 "${endTerm}"`)
    }

    const startNode = nodesResult.records[0].get('start').properties
    const endNode = nodesResult.records[0].get('end').properties

    // 查询最短路径
    const shortestPathQuery = `
      MATCH (start {id: $startId}), (end {id: $endId})
      MATCH path = shortestPath((start)-[*1..${maxLength}]-(end))
      RETURN path, length(path) as pathLength
      LIMIT $limit
    `

    const pathsResult = await session.run(shortestPathQuery, {
      startId: startNode.id,
      endId: endNode.id,
      limit: Math.floor(limit)
    })

    const paths = pathsResult.records.map((record: any) => {
      const path = record.get('path')
      const pathLength = record.get('pathLength').toNumber()
      
      interface PathSegment {
        start: { properties: GraphNode }
        end: { properties: GraphNode }
        relationship: {
          elementId: string
          type: string
          properties?: Record<string, unknown>
        }
      }

      const nodes = path.segments.flatMap((segment: PathSegment) => [
        segment.start.properties,
        segment.end.properties
      ]).filter((node: GraphNode, index: number, array: GraphNode[]) => 
        array.findIndex(n => n.id === node.id) === index
      )

      const relationships = path.segments.map((segment: PathSegment) => ({
        id: segment.relationship.elementId,
        type: segment.relationship.type as RelationTypeEnum,
        source: segment.start.properties.id,
        target: segment.end.properties.id,
        properties: segment.relationship.properties || {},
        metadata: { created_at: new Date().toISOString() }
      }))

      const weight = relationships.reduce((sum: number, rel: any) => 
        sum + (rel.properties?.weight as number || 1), 0
      )

      return {
        nodes,
        relationships,
        length: pathLength,
        weight,
        pathType: 'shortest' as const
      }
    })

    await session.close()
    return { paths }
  }

  /**
   * 获取统计信息（使用原生 driver）
   */
  async getStats() {
    const statsQuery = `
      MATCH (n)
      OPTIONAL MATCH ()-[r]->()
      RETURN 
        count(DISTINCT n) as nodeCount,
        count(DISTINCT r) as relationshipCount,
        collect(DISTINCT n.type) as nodeTypes,
        collect(DISTINCT type(r)) as relationshipTypes
    `

    const session = this.neogma.driver.session()
    const result = await session.run(statsQuery)
    const record = result.records[0]

    const nodeTypes = record.get('nodeTypes').reduce((acc: Record<string, number>, type: string) => {
      if (type) acc[type] = 0
      return acc
    }, {})

    const relationshipTypes = record.get('relationshipTypes').reduce((acc: Record<string, number>, type: string) => {
      if (type) acc[type] = 0
      return acc
    }, {})

    // 获取具体计数
    const nodeSession = this.neogma.driver.session()
    const nodeTypeCounts = await nodeSession.run(`
      MATCH (n) 
      WHERE n.type IS NOT NULL
      RETURN n.type as type, count(*) as count
    `)

    nodeTypeCounts.records.forEach((record: any) => {
      const type = record.get('type')
      const count = record.get('count').toNumber()
      nodeTypes[type] = count
    })
    await nodeSession.close()

    const relSession = this.neogma.driver.session()
    const relTypeCounts = await relSession.run(`
      MATCH ()-[r]->() 
      RETURN type(r) as type, count(*) as count
    `)

    relTypeCounts.records.forEach((record: any) => {
      const type = record.get('type')
      const count = record.get('count').toNumber()
      relationshipTypes[type] = count
    })
    await relSession.close()

    await session.close()

    return {
      node_count: record.get('nodeCount').toNumber(),
      relationship_count: record.get('relationshipCount').toNumber(),
      node_types: nodeTypes,
      relationship_types: relationshipTypes
    }
  }
}

/**
 * 将 GraphNode 转换为 Neogma 节点格式
 */
export function graphNodeToNeogmaNode(node: GraphNode): NodeProperties {
  return {
    id: node.id,
    type: node.type,
    name: node.name,
    description: node.properties?.description as string,
    file_path: node.properties?.file_path as string,
    line_number: node.properties?.line_number as number,
    properties: node.properties || {},
    metadata: node.metadata || {},
    created_at: node.metadata?.created_at as string || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * 将 Neogma 节点转换为 GraphNode 格式
 */
export function neogmaNodeToGraphNode(node: NodeProperties): GraphNode {
  return {
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
  }
}