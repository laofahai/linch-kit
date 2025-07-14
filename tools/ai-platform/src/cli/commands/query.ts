/**
 * AI Query Command
 *
 * 查询知识图谱中的节点、关系和路径
 */

import { createLogger } from '@linch-kit/core/server'

import type { CommandContext, CommandResult, CLICommand } from '../plugin.js'
import { createLogger } from '@linch-kit/core/server'
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
    format?: 'table' | 'json' | 'tree' | 'ai-context'
  }
): Promise<CommandResult> {
  const startTime = Date.now()

  try {
    logger.info('执行图查询', {
      queryType,
      searchTerm,
      options,
    })

    const config = await loadNeo4jConfig()
    const neo4jService = new Neo4jService(config)

    try {
      await neo4jService.connect()

      let result: unknown

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
        duration,
      }
    } finally {
      await neo4jService.disconnect()
    }
  } catch (error) {
    logger.error('查询失败', error instanceof Error ? error : undefined)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    }
  }
}

/**
 * 查询节点 - 使用 Neogma OGM
 */
async function queryNodes(
  neo4jService: Neo4jService,
  searchTerm: string,
  options: {
    type?: string
    limit?: number
    exact?: boolean
  }
): Promise<GraphNode[]> {
  // 处理节点类型
  let nodeType: NodeType | NodeType[] | undefined = undefined
  if (options.type) {
    if (options.type.includes(',')) {
      // 多类型过滤
      nodeType = options.type.split(',').map(t => t.trim()) as NodeType[]
    } else {
      // 单类型过滤
      nodeType = options.type as NodeType
    }
  }

  // 使用 Neogma OGM 查询
  return await neo4jService.findNodesOGM({
    searchTerm,
    nodeType,
    limit: options.limit || 10,
    exact: options.exact || false,
  })
}

/**
 * 查询关系 - 使用 Neogma OGM
 */
async function queryRelations(
  neo4jService: Neo4jService,
  nodeId: string,
  options: {
    depth?: number
    direction?: 'in' | 'out' | 'both'
    limit?: number
    relationshipType?: string
  }
): Promise<{
  nodes: GraphNode[]
  relationships: GraphRelationship[]
  stats: {
    totalNodes: number
    totalRelationships: number
    maxDepth: number
    relationshipTypes: Record<string, number>
  }
}> {
  // 处理关系类型
  let relationshipType: RelationType | RelationType[] | undefined = undefined
  if (options.relationshipType) {
    if (options.relationshipType.includes(',')) {
      relationshipType = options.relationshipType.split(',').map(t => t.trim()) as RelationType[]
    } else {
      relationshipType = options.relationshipType as RelationType
    }
  }

  // 使用 Neogma OGM 查询关系
  return await neo4jService.findRelationshipsOGM(nodeId, {
    depth: options.depth || 1,
    direction: options.direction || 'both',
    relationshipType,
    limit: options.limit || 20,
  })
}

/**
 * 查询路径 - 使用 Neogma OGM
 */
async function queryPaths(
  neo4jService: Neo4jService,
  searchTerm: string,
  options: {
    limit?: number
    maxLength?: number
    includeAllPaths?: boolean
  }
): Promise<{
  paths: Array<{
    nodes: GraphNode[]
    relationships: GraphRelationship[]
    length: number
    weight: number
    pathType: 'shortest' | 'all'
  }>
}> {
  // 解析搜索词
  const terms = searchTerm.split(' ')
  if (terms.length < 2) {
    throw new Error('路径查询需要两个节点，格式: "节点1 节点2" 或 "节点1ID 节点2ID"')
  }

  const startTerm = terms[0]
  const endTerm = terms[1]

  // 使用 Neogma OGM 查询路径
  return await neo4jService.findPathsOGM(startTerm, endTerm, {
    maxLength: options.maxLength || 6,
    limit: options.limit || 5,
    includeAllPaths: options.includeAllPaths || false,
  })
}

/**
 * 查询统计信息 - 使用 Neogma OGM
 */
async function queryStats(neo4jService: Neo4jService): Promise<{
  nodeCount: number
  relationshipCount: number
  nodeTypes: Record<string, number>
  relationshipTypes: Record<string, number>
}> {
  const stats = await neo4jService.getStatsOGM()

  return {
    nodeCount: stats.node_count,
    relationshipCount: stats.relationship_count,
    nodeTypes: stats.node_types,
    relationshipTypes: stats.relationship_types,
  }
}

/**
 * 输出查询结果
 */
function outputQueryResult(
  result: unknown,
  format: 'table' | 'json' | 'tree' | 'ai-context',
  queryType: QueryType
): void {
  switch (format) {
    case 'ai-context':
      outputAIContextFormat(result, queryType)
      break

    case 'json':
      logger.info(JSON.stringify(result, null, 2))
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
function outputTableFormat(result: unknown, queryType: QueryType): void {
  switch (queryType) {
    case 'node':
      if (Array.isArray(result) && result.length > 0) {
        logger.info('\n📋 找到的节点:')
        logger.info('ID | 类型 | 名称 | 描述')
        logger.info('---|------|------|------')
        result.forEach((node: GraphNode) => {
          const description = node.properties?.description || node.properties?.file_path || '-'
          const truncatedDesc =
            String(description).length > 40
              ? String(description).substring(0, 40) + '...'
              : String(description)
          logger.info(`${node.id} | ${node.type} | ${node.name} | ${truncatedDesc}`)
        })
        logger.info(`\n📊 总计: ${result.length} 个节点`)
      } else {
        logger.info('\n❌ 未找到匹配的节点')
      }
      break

    case 'relations': {
      const relResult = result as {
        nodes: GraphNode[]
        relationships: GraphRelationship[]
        stats: {
          totalNodes: number
          totalRelationships: number
          maxDepth: number
          relationshipTypes: Record<string, number>
        }
      }

      if (relResult.nodes.length > 0) {
        logger.info('\n🔗 关联的节点:')
        logger.info('ID | 类型 | 名称 | 描述')
        logger.info('---|------|------|------')
        relResult.nodes.forEach((node: GraphNode) => {
          const description = node.properties?.description || node.properties?.file_path || '-'
          const truncatedDesc =
            String(description).length > 40
              ? String(description).substring(0, 40) + '...'
              : String(description)
          logger.info(`${node.id} | ${node.type} | ${node.name} | ${truncatedDesc}`)
        })
      }

      if (relResult.relationships.length > 0) {
        logger.info('\n🔗 关系:')
        logger.info('源节点 | 关系类型 | 目标节点 | 属性')
        logger.info('-------|---------|---------|------')
        relResult.relationships.forEach((rel: GraphRelationship) => {
          const props = rel.properties ? Object.keys(rel.properties).length : 0
          logger.info(`${rel.source} | ${rel.type} | ${rel.target} | ${props}个属性`)
        })
      }

      // 显示统计信息
      logger.info('\n📊 关系查询统计:')
      logger.info(`📦 节点数: ${relResult.stats.totalNodes}`)
      logger.info(`🔗 关系数: ${relResult.stats.totalRelationships}`)
      logger.info(`📏 最大深度: ${relResult.stats.maxDepth}`)

      if (Object.keys(relResult.stats.relationshipTypes).length > 0) {
        logger.info('\n🔗 关系类型分布:')
        Object.entries(relResult.stats.relationshipTypes).forEach(([type, count]) => {
          logger.info(`  ${type}: ${count}`)
        })
      }
      break
    }

    case 'path': {
      const pathResult = result as {
        paths: Array<{
          nodes: GraphNode[]
          relationships: GraphRelationship[]
          length: number
          weight: number
          pathType: 'shortest' | 'all'
        }>
      }

      if (pathResult.paths.length > 0) {
        logger.info('\n🛤️ 找到的路径:')
        pathResult.paths.forEach((path, index) => {
          logger.info(`\n路径 ${index + 1} (${path.pathType === 'shortest' ? '最短' : '备选'}):`)
          logger.info(`  📏 长度: ${path.length}`)
          logger.info(`  ⚖️ 权重: ${path.weight}`)
          logger.info(`  📦 节点数: ${path.nodes.length}`)
          logger.info(`  🔗 关系数: ${path.relationships.length}`)

          // 显示路径详情
          if (path.nodes.length > 0) {
            logger.info('  📋 路径节点:')
            path.nodes.forEach((node, nodeIndex) => {
              logger.info(`    ${nodeIndex + 1}. ${node.name} (${node.type})`)
            })
          }

          if (path.relationships.length > 0) {
            logger.info('  🔗 路径关系:')
            path.relationships.forEach((rel, relIndex) => {
              logger.info(`    ${relIndex + 1}. ${rel.type}`)
            })
          }
        })
      } else {
        logger.info('\n❌ 未找到连接路径')
      }
      break
    }

    case 'stats': {
      const statsResult = result as {
        nodeCount: number
        relationshipCount: number
        nodeTypes: Record<string, number>
        relationshipTypes: Record<string, number>
      }
      logger.info('\n📊 图数据库统计信息:')
      logger.info(`📦 节点总数: ${statsResult.nodeCount}`)
      logger.info(`🔗 关系总数: ${statsResult.relationshipCount}`)

      if (Object.keys(statsResult.nodeTypes).length > 0) {
        logger.info('\n📋 节点类型分布:')
        Object.entries(statsResult.nodeTypes).forEach(([type, count]) => {
          logger.info(`  ${type}: ${count}`)
        })
      }

      if (Object.keys(statsResult.relationshipTypes).length > 0) {
        logger.info('\n🔗 关系类型分布:')
        Object.entries(statsResult.relationshipTypes).forEach(([type, count]) => {
          logger.info(`  ${type}: ${count}`)
        })
      }
      break
    }
  }
}

/**
 * AI 上下文数据包格式输出 (Gemini 建议的结构)
 */
function outputAIContextFormat(result: unknown, queryType: QueryType): void {
  switch (queryType) {
    case 'node':
      if (Array.isArray(result) && result.length > 0) {
        const nodes = result as GraphNode[]
        const contextPacket = {
          summary: `Found ${nodes.length} nodes matching your query`,
          data: {
            central_nodes: nodes.slice(0, 5), // 核心节点（前5个）
            total_count: nodes.length,
            node_types: [...new Set(nodes.map(n => n.type))],
            file_paths: [...new Set(nodes.map(n => n.properties?.file_path).filter(Boolean))],
          },
          metadata: {
            query_type: queryType,
            confidence: nodes.length > 0 ? 0.8 : 0.3,
            result_count: nodes.length,
            data_source: 'neo4j_graph',
          },
          follow_up_suggestions: [
            'Query relationships for these nodes with: --type relations --search <node_id>',
            'Find usage patterns with: --type relations --search <node_name> --direction in',
            'Explore dependencies with: --type relations --search <node_name> --direction out',
          ],
        }
        logger.info(JSON.stringify(contextPacket, null, 2))
      } else {
        const emptyPacket = {
          summary: 'No nodes found matching your query',
          data: { central_nodes: [], total_count: 0 },
          metadata: { query_type: queryType, confidence: 0.1, result_count: 0 },
          follow_up_suggestions: [
            'Try broader search terms',
            'Check spelling of entity names',
            'Use --type stats to see available node types',
          ],
        }
        logger.info(JSON.stringify(emptyPacket, null, 2))
      }
      break

    case 'relations': {
      const relResult = result as {
        nodes: GraphNode[]
        relationships: GraphRelationship[]
        stats: {
          nodeTypes?: Record<string, number>
          relationshipTypes?: Record<string, number>
          totalNodes?: number
          totalRelationships?: number
          maxDepth?: number
        }
      }

      const contextPacket = {
        summary: `Found ${relResult.relationships.length} relationships connecting ${relResult.nodes.length} nodes`,
        data: {
          central_node: relResult.nodes[0] || null,
          dependencies: relResult.relationships.filter(r =>
            ['IMPORTS', 'DEPENDS_ON', 'EXTENDS'].includes(r.type)
          ),
          dependents: relResult.relationships.filter(r =>
            ['CALLS', 'USES', 'IMPLEMENTS'].includes(r.type)
          ),
          siblings: relResult.nodes.slice(1, 6), // 相关节点
          relationship_summary: relResult.stats.relationshipTypes,
        },
        metadata: {
          query_type: queryType,
          confidence: 0.9,
          result_count: relResult.relationships.length,
          max_depth: relResult.stats.maxDepth,
        },
        follow_up_suggestions: [
          "Explore specific relationships: --type path --search '<source> <target>'",
          'Find function definitions: --type node --search <function_name> --node-type Function',
          'Analyze dependency chains: --type relations --depth 2',
        ],
      }
      logger.info(JSON.stringify(contextPacket, null, 2))
      break
    }

    case 'path': {
      const pathResult = result as {
        paths: Array<{
          nodes: GraphNode[]
          relationships: GraphRelationship[]
          length: number
          weight: number
        }>
      }

      const contextPacket = {
        summary: `Found ${pathResult.paths.length} connection paths`,
        data: {
          primary_path: pathResult.paths[0] || null,
          alternative_paths: pathResult.paths.slice(1),
          path_analysis: pathResult.paths.map(p => ({
            start_node: p.nodes[0]?.name,
            end_node: p.nodes[p.nodes.length - 1]?.name,
            length: p.length,
            intermediate_nodes: p.nodes.slice(1, -1).map(n => n.name),
          })),
        },
        metadata: {
          query_type: queryType,
          confidence: pathResult.paths.length > 0 ? 0.8 : 0.2,
          result_count: pathResult.paths.length,
        },
        follow_up_suggestions: [
          'Examine intermediate nodes: --type node --search <intermediate_node>',
          'Find alternative paths with different constraints',
          'Analyze relationship types in the path',
        ],
      }
      logger.info(JSON.stringify(contextPacket, null, 2))
      break
    }

    case 'stats': {
      const statsResult = result as {
        nodeCount: number
        relationshipCount: number
        nodeTypes: Record<string, number>
        relationshipTypes: Record<string, number>
      }

      const contextPacket = {
        summary: `Graph contains ${statsResult.nodeCount} nodes and ${statsResult.relationshipCount} relationships`,
        data: {
          overview: {
            total_nodes: statsResult.nodeCount,
            total_relationships: statsResult.relationshipCount,
            node_types: statsResult.nodeTypes,
            relationship_types: statsResult.relationshipTypes,
          },
          top_node_types: Object.entries(statsResult.nodeTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5),
          top_relationship_types: Object.entries(statsResult.relationshipTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5),
        },
        metadata: {
          query_type: queryType,
          confidence: 1.0,
          result_count: statsResult.nodeCount + statsResult.relationshipCount,
        },
        follow_up_suggestions: [
          'Explore specific node types: --type node --node-type <type_name>',
          'Find high-connectivity nodes: --type relations --depth 2',
          'Search for specific entities: --type node --search <entity_name>',
        ],
      }
      logger.info(JSON.stringify(contextPacket, null, 2))
      break
    }

    default: {
      // 通用格式
      const genericPacket = {
        summary: 'Query executed successfully',
        data: result,
        metadata: { query_type: queryType, confidence: 0.5 },
        follow_up_suggestions: ['Use --format table for detailed view'],
      }
      logger.info(JSON.stringify(genericPacket, null, 2))
      break
    }
  }
}

/**
 * 树形格式输出
 */
function outputTreeFormat(result: unknown, _queryType: QueryType): void {
  logger.info('\n🌳 树形视图:')
  logger.info(JSON.stringify(result, null, 2))
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
      required: false,
    },
    {
      name: 'search',
      description: '搜索词或节点ID',
      type: 'string',
      required: false,
    },
    {
      name: 'node-type',
      description: '节点类型过滤',
      type: 'string',
      required: false,
    },
    {
      name: 'limit',
      description: '结果数量限制',
      type: 'number',
      defaultValue: 10,
      required: false,
    },
    {
      name: 'depth',
      description: '关系查询深度',
      type: 'number',
      defaultValue: 1,
      required: false,
    },
    {
      name: 'direction',
      description: '关系方向 (in,out,both)',
      type: 'string',
      defaultValue: 'both',
      required: false,
    },
    {
      name: 'format',
      description: '输出格式 (table,json,tree,ai-context)',
      type: 'string',
      defaultValue: 'table',
      required: false,
    },
  ],
  examples: [
    'linch ai:query --type stats',
    'linch ai:query --type node --search "User" --node-type "Schema"',
    'linch ai:query --type relations --search "package:_linch-kit_auth" --depth 2',
    'linch ai:query --type path --search "LoginPage api.authenticate"',
    'linch ai:query --type stats --format ai-context  # AI优化的上下文格式',
  ],
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { options } = context

    // 解析参数
    const queryType = (options.type as QueryType) || 'stats'
    const searchTerm = (options.search as string) || ''
    const nodeType = options['node-type'] as string
    const limit = (options.limit as number) || 10
    const depth = (options.depth as number) || 1
    const direction = (options.direction as 'in' | 'out' | 'both') || 'both'
    const format = (options.format as 'table' | 'json' | 'tree' | 'ai-context') || 'table'

    // 验证参数
    const validQueryTypes: QueryType[] = ['node', 'relations', 'path', 'stats']
    const validDirections = ['in', 'out', 'both']
    const validFormats = ['table', 'json', 'tree', 'ai-context']

    if (!validQueryTypes.includes(queryType)) {
      return {
        success: false,
        error: `无效的查询类型: ${queryType}. 支持的类型: ${validQueryTypes.join(', ')}`,
      }
    }

    if (!validDirections.includes(direction)) {
      return {
        success: false,
        error: `无效的方向: ${direction}. 支持的方向: ${validDirections.join(', ')}`,
      }
    }

    if (!validFormats.includes(format)) {
      return {
        success: false,
        error: `无效的格式: ${format}. 支持的格式: ${validFormats.join(', ')}`,
      }
    }

    // 对于非 stats 查询，需要搜索词
    if (queryType !== 'stats' && !searchTerm) {
      return {
        success: false,
        error: `${queryType} 查询需要提供搜索词 (--search)`,
      }
    }

    // 执行查询
    return await executeQuery(queryType, searchTerm, {
      type: nodeType,
      limit,
      depth,
      direction,
      format,
    })
  },
}
