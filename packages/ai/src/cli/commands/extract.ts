/**
 * AI Extract Command
 * 
 * 提取代码库中的结构化数据并生成知识图谱
 */

import { createLogger } from '@linch-kit/core/server'

import type {
  CommandContext,
  CommandResult,
  CLICommand
} from '../plugin.js'
import { PackageExtractor } from '../../extractors/package-extractor.js'
import { SchemaExtractor } from '../../extractors/schema-extractor.js'
import { DocumentExtractor } from '../../extractors/document-extractor.js'
import { FunctionExtractor } from '../../extractors/function-extractor.js'
import { ImportExtractor } from '../../extractors/import-extractor.js'
import { Neo4jService } from '../../graph/neo4j-service.js'
import { loadNeo4jConfig } from '../../config/neo4j-config.js'
import type { GraphNode, GraphRelationship } from '../../types/index.js'

const logger = createLogger({ name: 'ai:extract-command' })

/**
 * 支持的数据提取器类型
 */
export type ExtractorType = 'package' | 'schema' | 'document' | 'function' | 'import' | 'all'

/**
 * 支持的输出格式
 */
export type OutputFormat = 'neo4j' | 'json' | 'console'

/**
 * 执行数据提取的核心逻辑
 */
async function executeExtraction(
  extractors: ExtractorType[],
  outputFormat: OutputFormat,
  options: {
    clear?: boolean
    outputFile?: string
    workingDir?: string
  }
): Promise<CommandResult> {
  const startTime = Date.now()
  
  try {
    logger.info('开始数据提取', {
      extractors,
      outputFormat,
      options
    })

    const _workingDir = options.workingDir || process.cwd()
    const allNodes: GraphNode[] = []
    const allRelationships: GraphRelationship[] = []

    // 执行数据提取
    for (const extractorType of extractors) {
      logger.info(`执行 ${extractorType} 数据提取...`)
      
      let extractor: PackageExtractor | SchemaExtractor | DocumentExtractor | FunctionExtractor | ImportExtractor
      let result: { nodes: GraphNode[]; relationships: GraphRelationship[] }
      
      switch (extractorType) {
        case 'package':
          extractor = new PackageExtractor()
          result = await extractor.extract()
          break
          
        case 'schema':
          extractor = new SchemaExtractor()
          result = await extractor.extract()
          break
          
        case 'document':
          extractor = new DocumentExtractor()
          result = await extractor.extract()
          break
          
        case 'function':
          extractor = new FunctionExtractor()
          result = await extractor.extract()
          break
          
        case 'import':
          extractor = new ImportExtractor()
          result = await extractor.extract()
          break
          
        case 'all': {
          // 递归调用所有提取器
          const allExtractors: ExtractorType[] = ['package', 'schema', 'document', 'function', 'import']
          for (const subExtractor of allExtractors) {
            const subResult = await executeExtraction([subExtractor], 'json', options)
            if (subResult.success && subResult.data) {
              const { nodes, relationships } = subResult.data as { nodes: GraphNode[]; relationships: GraphRelationship[] }
              allNodes.push(...nodes)
              allRelationships.push(...relationships)
            }
          }
          continue
        }
          
        default:
          logger.warn(`未知的提取器类型: ${extractorType}`)
          continue
      }
      
      allNodes.push(...result.nodes)
      allRelationships.push(...result.relationships)
      
      logger.info(`${extractorType} 提取完成`, {
        nodeCount: result.nodes.length,
        relationshipCount: result.relationships.length
      })
    }

    // 输出结果
    await handleOutput(allNodes, allRelationships, outputFormat, options)
    
    const duration = Date.now() - startTime
    logger.info('数据提取完成', {
      totalNodes: allNodes.length,
      totalRelationships: allRelationships.length,
      duration
    })

    return {
      success: true,
      data: { nodes: allNodes, relationships: allRelationships },
      duration
    }
  } catch (error) {
    logger.error('数据提取失败', error instanceof Error ? error : undefined)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    }
  }
}

/**
 * 处理输出结果
 */
async function handleOutput(
  nodes: GraphNode[],
  relationships: GraphRelationship[],
  format: OutputFormat,
  options: {
    clear?: boolean
    outputFile?: string
  }
): Promise<void> {
  switch (format) {
    case 'neo4j':
      await outputToNeo4j(nodes, relationships, options)
      break
      
    case 'json':
      await outputToJson(nodes, relationships, options)
      break
      
    case 'console':
      outputToConsole(nodes, relationships)
      break
      
    default:
      throw new Error(`未支持的输出格式: ${format}`)
  }
}

/**
 * 输出到 Neo4j
 */
async function outputToNeo4j(
  nodes: GraphNode[],
  relationships: GraphRelationship[],
  options: { clear?: boolean }
): Promise<void> {
  const config = await loadNeo4jConfig()
  const neo4jService = new Neo4jService(config)
  
  try {
    await neo4jService.connect()
    
    if (options.clear) {
      logger.info('清空 Neo4j 数据库...')
      await neo4jService.clearDatabase()
    }
    
    logger.info('导入数据到 Neo4j...')
    await neo4jService.importData(nodes, relationships)
    
    logger.info('✅ 数据已成功导入到 Neo4j')
  } finally {
    await neo4jService.disconnect()
  }
}

/**
 * 输出到 JSON 文件
 */
async function outputToJson(
  nodes: GraphNode[],
  relationships: GraphRelationship[],
  options: { outputFile?: string }
): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const outputDir = options.outputFile 
    ? path.dirname(options.outputFile)
    : path.join(process.cwd(), 'graph-data')
  
  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true })
  
  const nodesFile = path.join(outputDir, 'nodes.json')
  const relationshipsFile = path.join(outputDir, 'relationships.json')
  
  await Promise.all([
    fs.writeFile(nodesFile, JSON.stringify(nodes, null, 2)),
    fs.writeFile(relationshipsFile, JSON.stringify(relationships, null, 2))
  ])
  
  logger.info('✅ 数据已保存到 JSON 文件', {
    nodesFile,
    relationshipsFile,
    nodeCount: nodes.length,
    relationshipCount: relationships.length
  })
}

/**
 * 输出到控制台
 */
function outputToConsole(
  nodes: GraphNode[],
  relationships: GraphRelationship[]
): void {
  console.log('\n📊 数据提取结果:')
  console.log(`📦 节点数量: ${nodes.length}`)
  console.log(`🔗 关系数量: ${relationships.length}`)
  
  if (nodes.length > 0) {
    console.log('\n📋 节点类型分布:')
    const nodeTypes = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
  }
  
  if (relationships.length > 0) {
    console.log('\n🔗 关系类型分布:')
    const relationshipTypes = relationships.reduce((acc, rel) => {
      acc[rel.type] = (acc[rel.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(relationshipTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
  }
}

/**
 * AI Extract CLI 命令定义
 */
export const extractCommand: CLICommand = {
  name: 'ai:extract',
  description: '提取代码库结构化数据并生成知识图谱',
  category: 'dev',
  options: [
    {
      name: 'extractors',
      description: '指定要使用的数据提取器 (package,schema,document,function,import,all)',
      type: 'string',
      defaultValue: 'all',
      required: false
    },
    {
      name: 'output',
      description: '指定输出格式 (neo4j,json,console)',
      type: 'string',
      defaultValue: 'console',
      required: false
    },
    {
      name: 'clear',
      description: '在导入前清空 Neo4j 数据库',
      type: 'boolean',
      defaultValue: false,
      required: false
    },
    {
      name: 'file',
      description: '输出文件路径 (仅适用于 json 格式)',
      type: 'string',
      required: false
    },
    {
      name: 'working-dir',
      description: '工作目录路径',
      type: 'string',
      required: false
    }
  ],
  examples: [
    'linch ai:extract --extractors package --output neo4j',
    'linch ai:extract --extractors function --output json --file ./my-data.json',
    'linch ai:extract --extractors import --output console',
    'linch ai:extract --extractors all --output neo4j --clear'
  ],
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { options } = context
    
    // 解析参数
    const extractorsStr = options.extractors as string || 'all'
    const extractors = extractorsStr.split(',').map(e => e.trim()) as ExtractorType[]
    const outputFormat = options.output as OutputFormat || 'console'
    const clear = options.clear as boolean || false
    const outputFile = options.file as string
    const workingDir = options['working-dir'] as string
    
    // 验证参数
    const validExtractors: ExtractorType[] = ['package', 'schema', 'document', 'function', 'import', 'all']
    const validOutputs: OutputFormat[] = ['neo4j', 'json', 'console']
    
    for (const extractor of extractors) {
      if (!validExtractors.includes(extractor)) {
        return {
          success: false,
          error: `无效的提取器类型: ${extractor}. 支持的类型: ${validExtractors.join(', ')}`
        }
      }
    }
    
    if (!validOutputs.includes(outputFormat)) {
      return {
        success: false,
        error: `无效的输出格式: ${outputFormat}. 支持的格式: ${validOutputs.join(', ')}`
      }
    }
    
    // 执行提取
    return await executeExtraction(extractors, outputFormat, {
      clear,
      outputFile,
      workingDir
    })
  }
}