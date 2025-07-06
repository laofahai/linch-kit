/**
 * AI Query Command
 * 
 * 查询知识图谱中的节点、关系和路径
 */

import { createLogger } from '@linch-kit/core/server'
import type { CLICommand, CommandContext, CommandResult } from '@linch-kit/core/cli'

import { Neo4jService } from '../../graph/neo4j-service.js'
import { loadNeo4jConfig } from '../../config/neo4j-config.js'
import type { GraphNode, GraphRelationship, NodeType, RelationType } from '../../types/index.js'

const logger = createLogger({ name: 'ai:query-command' })

/**
 * 支持的查询类型
 */
export type QueryType = 'node' | 'relations' | 'path' | 'stats'

/**
 * 执行图数据库查询
 */
async function executeQuery(
  queryType: QueryType,
  searchTerm: string,
  options: {
    type?: string
    limit?: number
    depth?: number
    direction?: 'in' | 'out' | 'both'
    format?: 'table' | 'json' | 'tree'
  }
): Promise<CommandResult> {
  const startTime = Date.now()
  
  try {
    logger.info('执行图查询', {
      queryType,
      searchTerm,
      options
    })

    const config = await loadNeo4jConfig()
    const neo4jService = new Neo4jService(config)
    
    try {
      await neo4jService.connect()
      
      let result: any
      
      switch (queryType) {
        case 'node':
          result = await queryNodes(neo4jService, searchTerm, options)
          break
          
        case 'relations':
          result = await queryRelations(neo4jService, searchTerm, options)
          break
          
        case 'path':
          result = await queryPaths(neo4jService, searchTerm, options)
          break
          
        case 'stats':
          result = await queryStats(neo4jService)
          break
          
        default:
          throw new Error(`未支持的查询类型: ${queryType}`)
      }
      
      // 输出结果
      outputQueryResult(result, options.format || 'table', queryType)
      
      const duration = Date.now() - startTime
      logger.info('查询完成', { queryType, duration })
      
      return {
        success: true,
        data: result,
        duration
      }
    } finally {
      await neo4jService.disconnect()
    }
  } catch (error) {
    logger.error('查询失败', error instanceof Error ? error : undefined)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    }
  }
}

/**
 * 查询节点
 */
async function queryNodes(
  neo4jService: Neo4jService,
  searchTerm: string,
  options: {
    type?: string
    limit?: number
  }
): Promise<GraphNode[]> {
  const limit = options.limit || 10
  let cypher = ''
  let params: Record<string, any> = {}
  
  if (options.type) {
    // 按类型和名称搜索
    cypher = `
      MATCH (n:${options.type})
      WHERE n.name CONTAINS $searchTerm OR n.id CONTAINS $searchTerm
      RETURN n
      LIMIT $limit
    `
    params = { searchTerm, limit }
  } else {
    // 全文搜索
    cypher = `
      MATCH (n)
      WHERE n.name CONTAINS $searchTerm OR n.id CONTAINS $searchTerm
      RETURN n
      LIMIT $limit
    `
    params = { searchTerm, limit }
  }
  
  const result = await neo4jService.query(cypher, params)
  return result.nodes
}

/**
 * 查询关系
 */
async function queryRelations(
  neo4jService: Neo4jService,
  nodeId: string,
  options: {
    depth?: number
    direction?: 'in' | 'out' | 'both'
    limit?: number
  }
): Promise<{
  nodes: GraphNode[]
  relationships: GraphRelationship[]
}> {
  const depth = options.depth || 1
  const limit = options.limit || 20
  let relationPattern = ''
  
  switch (options.direction) {
    case 'in':
      relationPattern = `<-[r*1..${depth}]-`
      break
    case 'out':
      relationPattern = `-[r*1..${depth}]->`
      break
    case 'both':
    default:
      relationPattern = `-[r*1..${depth}]-`
      break
  }
  
  const cypher = `
    MATCH (start {id: $nodeId})${relationPattern}(related)
    RETURN start, r, related
    LIMIT $limit
  `
  
  const result = await neo4jService.query(cypher, { nodeId, limit })
  return {
    nodes: result.nodes,
    relationships: result.relationships
  }
}

/**
 * 查询路径
 */
async function queryPaths(
  neo4jService: Neo4jService,
  searchTerm: string,
  options: {
    limit?: number
  }
): Promise<{
  paths: Array<{
    nodes: GraphNode[]
    relationships: GraphRelationship[]
    length: number
  }>
}> {
  const limit = options.limit || 5
  const [startTerm, endTerm] = searchTerm.split(' ')
  
  if (!endTerm) {
    throw new Error('路径查询需要两个节点，格式: "节点1 节点2"')
  }
  
  const cypher = `
    MATCH (start), (end)
    WHERE (start.name CONTAINS $startTerm OR start.id CONTAINS $startTerm)
      AND (end.name CONTAINS $endTerm OR end.id CONTAINS $endTerm)
    MATCH path = shortestPath((start)-[*..6]-(end))
    RETURN path
    LIMIT $limit
  `
  
  const result = await neo4jService.query(cypher, { startTerm, endTerm, limit })
  
  // 处理路径结果
  const paths = result.nodes.map((_, index) => ({
    nodes: result.nodes.slice(index, index + 1),
    relationships: result.relationships.slice(index, index + 1),
    length: 1 // 简化实现
  }))
  
  return { paths }
}

/**
 * 查询统计信息
 */
async function queryStats(neo4jService: Neo4jService): Promise<{
  nodeCount: number
  relationshipCount: number
  nodeTypes: Record<string, number>
  relationshipTypes: Record<string, number>
}> {
  const stats = await neo4jService.getStats()
  
  return {
    nodeCount: stats.node_count,
    relationshipCount: stats.relationship_count,
    nodeTypes: stats.node_types,
    relationshipTypes: stats.relationship_types
  }
}

/**
 * 输出查询结果
 */
function outputQueryResult(
  result: any,
  format: 'table' | 'json' | 'tree',
  queryType: QueryType
): void {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(result, null, 2))
      break
      
    case 'tree':
      outputTreeFormat(result, queryType)
      break
      
    case 'table':
    default:
      outputTableFormat(result, queryType)
      break
  }
}

/**
 * 表格格式输出
 */
function outputTableFormat(result: any, queryType: QueryType): void {
  switch (queryType) {
    case 'node':
      if (Array.isArray(result) && result.length > 0) {
        console.log('\n📋 找到的节点:')
        console.log('ID | 类型 | 名称')
        console.log('---|------|------')
        result.forEach((node: GraphNode) => {
          console.log(`${node.id} | ${node.type} | ${node.name}`)
        })
      } else {
        console.log('\n❌ 未找到匹配的节点')
      }
      break
      
    case 'relations':
      const { nodes, relationships } = result
      if (nodes.length > 0) {
        console.log('\n🔗 关联的节点:')
        console.log('ID | 类型 | 名称')
        console.log('---|------|------')
        nodes.forEach((node: GraphNode) => {
          console.log(`${node.id} | ${node.type} | ${node.name}`)
        })
      }
      if (relationships.length > 0) {
        console.log('\n🔗 关系:')
        console.log('源节点 | 关系类型 | 目标节点')
        console.log('-------|---------|--------')
        relationships.forEach((rel: GraphRelationship) => {
          console.log(`${rel.source} | ${rel.type} | ${rel.target}`)
        })
      }
      break
      
    case 'path':
      const { paths } = result
      if (paths.length > 0) {
        console.log('\n🛤️ 找到的路径:')
        paths.forEach((path: any, index: number) => {
          console.log(`路径 ${index + 1}: 长度 ${path.length}`)
          console.log(`  节点数: ${path.nodes.length}`)
          console.log(`  关系数: ${path.relationships.length}`)
        })
      } else {
        console.log('\n❌ 未找到连接路径')
      }
      break
      
    case 'stats':
      console.log('\n📊 图数据库统计信息:')
      console.log(`📦 节点总数: ${result.nodeCount}`)
      console.log(`🔗 关系总数: ${result.relationshipCount}`)
      
      if (Object.keys(result.nodeTypes).length > 0) {
        console.log('\n📋 节点类型分布:')
        Object.entries(result.nodeTypes).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`)
        })
      }
      
      if (Object.keys(result.relationshipTypes).length > 0) {
        console.log('\n🔗 关系类型分布:')
        Object.entries(result.relationshipTypes).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`)
        })
      }
      break
  }
}

/**
 * 树形格式输出
 */
function outputTreeFormat(result: any, queryType: QueryType): void {
  console.log('\n🌳 树形视图:')
  console.log(JSON.stringify(result, null, 2))
}

/**
 * AI Query CLI 命令定义
 */
export const queryCommand: CLICommand = {
  name: 'ai:query',
  description: '查询知识图谱中的节点、关系和路径',
  category: 'dev',
  options: [
    {
      name: 'type',
      description: '查询类型 (node,relations,path,stats)',
      type: 'string',
      defaultValue: 'stats',
      required: false
    },
    {
      name: 'search',
      description: '搜索词或节点ID',
      type: 'string',
      required: false
    },
    {
      name: 'node-type',
      description: '节点类型过滤',
      type: 'string',
      required: false
    },
    {
      name: 'limit',
      description: '结果数量限制',
      type: 'number',
      defaultValue: 10,
      required: false
    },
    {
      name: 'depth',
      description: '关系查询深度',
      type: 'number',
      defaultValue: 1,
      required: false
    },
    {
      name: 'direction',
      description: '关系方向 (in,out,both)',
      type: 'string',
      defaultValue: 'both',
      required: false
    },
    {
      name: 'format',
      description: '输出格式 (table,json,tree)',
      type: 'string',
      defaultValue: 'table',
      required: false
    }
  ],
  examples: [
    'linch ai:query --type stats',
    'linch ai:query --type node --search "User" --node-type "Schema"',
    'linch ai:query --type relations --search "package:_linch-kit_auth" --depth 2',
    'linch ai:query --type path --search "LoginPage api.authenticate"'
  ],
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { options } = context
    
    // 解析参数
    const queryType = options.type as QueryType || 'stats'
    const searchTerm = options.search as string || ''
    const nodeType = options['node-type'] as string
    const limit = options.limit as number || 10
    const depth = options.depth as number || 1
    const direction = options.direction as 'in' | 'out' | 'both' || 'both'
    const format = options.format as 'table' | 'json' | 'tree' || 'table'
    
    // 验证参数
    const validQueryTypes: QueryType[] = ['node', 'relations', 'path', 'stats']
    const validDirections = ['in', 'out', 'both']
    const validFormats = ['table', 'json', 'tree']
    
    if (!validQueryTypes.includes(queryType)) {
      return {
        success: false,
        error: `无效的查询类型: ${queryType}. 支持的类型: ${validQueryTypes.join(', ')}`
      }
    }
    
    if (!validDirections.includes(direction)) {
      return {
        success: false,
        error: `无效的方向: ${direction}. 支持的方向: ${validDirections.join(', ')}`
      }
    }
    
    if (!validFormats.includes(format)) {
      return {
        success: false,
        error: `无效的格式: ${format}. 支持的格式: ${validFormats.join(', ')}`
      }
    }
    
    // 对于非 stats 查询，需要搜索词
    if (queryType !== 'stats' && !searchTerm) {
      return {
        success: false,
        error: `${queryType} 查询需要提供搜索词 (--search)`
      }
    }
    
    // 执行查询
    return await executeQuery(queryType, searchTerm, {
      type: nodeType,
      limit,
      depth,
      direction,
      format
    })
  }
}