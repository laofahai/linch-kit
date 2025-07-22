/**
 * LinchKit AI Core Types
 *
 * 统一的类型定义，用于 Graph RAG 系统中的所有数据结构
 */

import { z } from 'zod'

/**
 * Logger 接口定义
 */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, error?: Error, data?: Record<string, unknown>): void
  fatal(message: string, error?: Error, data?: Record<string, unknown>): void
  child(bindings: Record<string, unknown>): Logger
  setLevel(level: string): void
  getLevel(): string
}

/**
 * Graph Node Types - 知识图谱中的实体类型
 */
export enum NodeType {
  PACKAGE = 'Package', // LinchKit 包
  DOCUMENT = 'Document', // 文档文件
  CONCEPT = 'Concept', // 抽象概念
  API = 'API', // 函数/类/接口
  SCHEMA_ENTITY = 'SchemaEntity', // Schema 实体
  SCHEMA_FIELD = 'SchemaField', // Schema 字段
  FILE = 'File', // 文件
  DATABASE_TABLE = 'DatabaseTable', // 数据库表
  DATABASE_COLUMN = 'DatabaseColumn', // 数据库列
  FUNCTION = 'Function', // 函数
  CLASS = 'Class', // 类
  INTERFACE = 'Interface', // 接口
  TYPE = 'Type', // 类型别名
  VARIABLE = 'Variable', // 变量
  IMPORT = 'Import', // 导入语句
  EXPORT = 'Export', // 导出语句
  UNKNOWN = 'unknown', // 未知类型（用于兼容性）
}

/**
 * Graph Relationship Types - 实体间的关系类型
 */
export enum RelationType {
  DEPENDS_ON = 'DEPENDS_ON', // 依赖关系
  DOCUMENTS = 'DOCUMENTS', // 文档化关系
  DEFINES = 'DEFINES', // 定义关系
  REFERENCES = 'REFERENCES', // 引用关系
  HAS_FIELD = 'HAS_FIELD', // 包含字段
  IMPLEMENTS = 'IMPLEMENTS', // 实现关系
  EXTENDS = 'EXTENDS', // 继承关系
  EXPORTS = 'EXPORTS', // 导出关系
  IMPORTS = 'IMPORTS', // 导入关系
  CONTAINS = 'CONTAINS', // 包含关系
  CALLS = 'CALLS', // 调用关系
  USES_TYPE = 'USES_TYPE', // 使用类型
  HAS_RELATION = 'HAS_RELATION', // 具有关联
  OVERRIDES = 'OVERRIDES', // 重写关系
  RETURNS = 'RETURNS', // 返回关系
  PARAMETER = 'PARAMETER', // 参数关系
  THROWS = 'THROWS', // 抛出异常关系
  ASYNC_CALLS = 'ASYNC_CALLS', // 异步调用关系
}

/**
 * 基础图节点 Schema
 */
export const GraphNodeSchema = z.object({
  id: z.string().describe('节点唯一标识符'),
  type: z.nativeEnum(NodeType).describe('节点类型'),
  name: z.string().describe('节点名称'),
  properties: z.record(z.unknown()).optional().describe('节点属性'),
  metadata: z
    .object({
      created_at: z.string().optional().describe('创建时间'),
      updated_at: z.string().optional().describe('更新时间'),
      source_file: z.string().optional().describe('源文件路径'),
      package: z.string().optional().describe('所属包'),
      confidence: z.number().min(0).max(1).optional().describe('置信度'),
    })
    .optional()
    .describe('节点元数据'),
})

/**
 * 基础图关系 Schema
 */
export const GraphRelationshipSchema = z.object({
  id: z.string().describe('关系唯一标识符'),
  type: z.nativeEnum(RelationType).describe('关系类型'),
  source: z.string().describe('源节点ID'),
  target: z.string().describe('目标节点ID'),
  properties: z.record(z.unknown()).optional().describe('关系属性'),
  metadata: z
    .object({
      created_at: z.string().optional().describe('创建时间'),
      confidence: z.number().min(0).max(1).optional().describe('置信度'),
      weight: z.number().optional().describe('关系权重'),
    })
    .optional()
    .describe('关系元数据'),
})

/**
 * 包节点 Schema
 */
export const PackageNodeSchema = GraphNodeSchema.extend({
  type: z.literal(NodeType.PACKAGE),
  properties: z.object({
    version: z.string().describe('包版本'),
    description: z.string().optional().describe('包描述'),
    path: z.string().describe('包路径'),
    main: z.string().optional().describe('主入口文件'),
    types: z.string().optional().describe('类型定义文件'),
    keywords: z.array(z.string()).optional().describe('关键词'),
    dependencies: z.array(z.string()).optional().describe('依赖列表'),
    devDependencies: z.array(z.string()).optional().describe('开发依赖'),
  }),
})

/**
 * 文档节点 Schema
 */
export const DocumentNodeSchema = GraphNodeSchema.extend({
  type: z.literal(NodeType.DOCUMENT),
  properties: z.object({
    file_path: z.string().describe('文件路径'),
    file_type: z.enum(['md', 'txt', 'json', 'ts', 'js']).describe('文件类型'),
    content_hash: z.string().optional().describe('内容哈希'),
    title: z.string().optional().describe('文档标题'),
    sections: z.array(z.string()).optional().describe('章节列表'),
    size: z.number().optional().describe('文件大小'),
  }),
})

/**
 * API 节点 Schema
 */
export const APINodeSchema = GraphNodeSchema.extend({
  type: z.literal(NodeType.API),
  properties: z.object({
    api_type: z
      .enum(['function', 'class', 'interface', 'type', 'constant', 'variable'])
      .describe('API类型'),
    signature: z.string().optional().describe('函数/方法签名'),
    description: z.string().optional().describe('API描述'),
    is_exported: z.boolean().optional().describe('是否被导出'),
    file_path: z.string().describe('定义文件路径'),
    line_number: z.number().optional().describe('行号'),
    access_modifier: z.enum(['public', 'private', 'protected']).optional().describe('访问修饰符'),
  }),
})

/**
 * Schema 实体节点 Schema
 */
export const SchemaEntityNodeSchema = GraphNodeSchema.extend({
  type: z.literal(NodeType.SCHEMA_ENTITY),
  properties: z.object({
    schema_name: z.string().describe('Schema名称'),
    description: z.string().optional().describe('实体描述'),
    table_name: z.string().optional().describe('对应数据表名'),
    file_path: z.string().describe('定义文件路径'),
    fields_count: z.number().optional().describe('字段数量'),
  }),
})

/**
 * 函数节点 Schema
 */
export const FunctionNodeSchema = GraphNodeSchema.extend({
  type: z.literal(NodeType.FUNCTION),
  properties: z.object({
    signature: z.string().describe('函数签名'),
    parameters: z
      .array(
        z.object({
          name: z.string().describe('参数名'),
          type: z.string().optional().describe('参数类型'),
          optional: z.boolean().optional().describe('是否可选'),
          default_value: z.string().optional().describe('默认值'),
        })
      )
      .optional()
      .describe('函数参数'),
    return_type: z.string().optional().describe('返回类型'),
    is_async: z.boolean().optional().describe('是否异步函数'),
    is_exported: z.boolean().optional().describe('是否被导出'),
    is_generator: z.boolean().optional().describe('是否为生成器函数'),
    file_path: z.string().describe('定义文件路径'),
    line_number: z.number().optional().describe('起始行号'),
    end_line_number: z.number().optional().describe('结束行号'),
    jsdoc: z.string().optional().describe('JSDoc 文档'),
    access_modifier: z.enum(['public', 'private', 'protected']).optional().describe('访问修饰符'),
    complexity: z.number().optional().describe('圈复杂度'),
  }),
})

/**
 * 类节点 Schema
 */
export const ClassNodeSchema = GraphNodeSchema.extend({
  type: z.literal(NodeType.CLASS),
  properties: z.object({
    is_abstract: z.boolean().optional().describe('是否抽象类'),
    is_exported: z.boolean().optional().describe('是否被导出'),
    extends_class: z.string().optional().describe('继承的父类'),
    implements_interfaces: z.array(z.string()).optional().describe('实现的接口'),
    file_path: z.string().describe('定义文件路径'),
    line_number: z.number().optional().describe('起始行号'),
    end_line_number: z.number().optional().describe('结束行号'),
    jsdoc: z.string().optional().describe('JSDoc 文档'),
    access_modifier: z.enum(['public', 'private', 'protected']).optional().describe('访问修饰符'),
    methods_count: z.number().optional().describe('方法数量'),
    properties_count: z.number().optional().describe('属性数量'),
  }),
})

/**
 * 接口节点 Schema
 */
export const InterfaceNodeSchema = GraphNodeSchema.extend({
  type: z.literal(NodeType.INTERFACE),
  properties: z.object({
    extends_interfaces: z.array(z.string()).optional().describe('继承的接口'),
    is_exported: z.boolean().optional().describe('是否被导出'),
    file_path: z.string().describe('定义文件路径'),
    line_number: z.number().optional().describe('起始行号'),
    end_line_number: z.number().optional().describe('结束行号'),
    jsdoc: z.string().optional().describe('JSDoc 文档'),
    properties_count: z.number().optional().describe('属性数量'),
    methods_count: z.number().optional().describe('方法数量'),
  }),
})

/**
 * 提取器接口
 */
export interface IExtractor<T = unknown> {
  name: string
  extract(): Promise<ExtractionResult<T>>
  validate(data: T): boolean
  getNodeType(): NodeType[]
  getRelationTypes(): RelationType[]
}

/**
 * 提取结果
 */
export interface ExtractionResult<T = unknown> {
  nodes: GraphNode[]
  relationships: GraphRelationship[]
  metadata: {
    extractor_name: string
    extraction_time: string
    source_count: number
    node_count: number
    relationship_count: number
  }
  raw_data?: T
}

/**
 * Neo4j 配置
 */
export const Neo4jConfigSchema = z.object({
  connectionUri: z.string().describe('Neo4j连接URI'),
  username: z.string().describe('用户名'),
  password: z.string().describe('密码'),
  database: z.string().default('neo4j').describe('数据库名'),
})

/**
 * 查询结果
 */
export const QueryResultSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  relationships: z.array(GraphRelationshipSchema),
  records: z.array(z.record(z.unknown())).optional().describe('原始查询记录'),
  metadata: z.object({
    query_time_ms: z.number().describe('查询耗时(毫秒)'),
    result_count: z.number().describe('结果数量'),
    query: z.string().optional().describe('查询语句'),
  }),
})

/**
 * Graph 服务接口
 */
export interface IGraphService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  importData(nodes: GraphNode[], relationships: GraphRelationship[]): Promise<void>
  query(cypher: string, parameters?: Record<string, unknown>): Promise<QueryResult>
  findNode(id: string): Promise<GraphNode | null>
  findRelatedNodes(nodeId: string, relationType?: RelationType): Promise<GraphNode[]>
  clearDatabase(): Promise<void>
  getStats(): Promise<GraphStats>
}

/**
 * Graph 统计信息
 */
export interface GraphStats extends Record<string, unknown> {
  node_count: number
  relationship_count: number
  node_types: Record<NodeType, number>
  relationship_types: Record<RelationType, number>
  last_updated: string
}

// TypeScript 类型导出
export type GraphNode = z.infer<typeof GraphNodeSchema>
export type GraphRelationship = z.infer<typeof GraphRelationshipSchema>
export type PackageNode = z.infer<typeof PackageNodeSchema>
export type DocumentNode = z.infer<typeof DocumentNodeSchema>
export type APINode = z.infer<typeof APINodeSchema>
export type SchemaEntityNode = z.infer<typeof SchemaEntityNodeSchema>
export type FunctionNode = z.infer<typeof FunctionNodeSchema>
export type ClassNode = z.infer<typeof ClassNodeSchema>
export type InterfaceNode = z.infer<typeof InterfaceNodeSchema>
export type Neo4jConfig = z.infer<typeof Neo4jConfigSchema>
export type QueryResult = z.infer<typeof QueryResultSchema>

/**
 * 工具配置
 */
export interface AIToolConfig {
  neo4j: Neo4jConfig
  extractors: {
    enabled: string[]
    options: Record<string, unknown>
  }
  output: {
    format: 'json' | 'csv' | 'both'
    directory: string
  }
}

/**
 * 常用节点ID生成器
 */
export class NodeIdGenerator {
  /**
   * 生成短hash用于ID唯一性 - 改进版本，减少冲突
   */
  private static shortHash(input: string): string {
    // 使用更复杂的hash算法减少冲突
    let hash1 = 0
    let hash2 = 0

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash1 = (hash1 << 5) - hash1 + char
      hash1 = hash1 & hash1 // 转换为32位整数

      hash2 = ((hash2 << 3) + hash2) ^ char
      hash2 = hash2 & hash2
    }

    // 组合两个hash值，并增加长度
    const combined = (Math.abs(hash1) << 16) | (Math.abs(hash2) & 0xffff)
    return combined.toString(36).slice(0, 10)
  }

  static package(name: string): string {
    return `package:${name.replace(/[^a-zA-Z0-9-_]/g, '_')}`
  }

  static file(packageName: string, filePath: string): string {
    const safePackage = packageName.replace(/[^a-zA-Z0-9-_]/g, '_')
    const hash = this.shortHash(filePath)
    return `file:${safePackage}_${hash}`
  }

  static api(packageName: string, apiName: string, type: string, filePath?: string): string {
    const safePackage = packageName.replace(/[^a-zA-Z0-9-_]/g, '_')
    const safeName = apiName.replace(/[^a-zA-Z0-9-_]/g, '_')
    // 包含文件路径确保同名函数在不同文件中的唯一性
    const uniqueKey = filePath ? `${filePath}:${apiName}` : `${packageName}:${apiName}`
    const hash = this.shortHash(uniqueKey)
    return `api:${safePackage}_${type}_${safeName}_${hash}`
  }

  static document(filePath: string): string {
    const hash = this.shortHash(filePath)
    return `doc:${hash}`
  }

  static schemaEntity(name: string): string {
    return `schema:${name.replace(/[^a-zA-Z0-9-_]/g, '_')}`
  }

  /**
   * 生成导入节点ID，包含文件路径确保唯一性
   */
  static import(packageName: string, source: string, imported: string, filePath: string): string {
    const safePackage = packageName.replace(/[^a-zA-Z0-9-_]/g, '_')
    const uniqueKey = `${filePath}:${source}:${imported}`
    const hash = this.shortHash(uniqueKey)
    return `import:${safePackage}_${hash}`
  }

  /**
   * 生成导出节点ID
   */
  static export(packageName: string, exported: string, filePath: string): string {
    const safePackage = packageName.replace(/[^a-zA-Z0-9-_]/g, '_')
    const uniqueKey = `${filePath}:${exported}`
    const hash = this.shortHash(uniqueKey)
    return `export:${safePackage}_${hash}`
  }
}

/**
 * 常用关系ID生成器
 */
export class RelationshipIdGenerator {
  static create(type: RelationType, source: string, target: string): string {
    return `${type.toLowerCase()}:${source}_${target}`
  }
}

/**
 * Dependency Graph for Architecture Analysis
 */
export class DependencyGraph {
  private nodes: Map<string, GraphNode> = new Map()
  private relationships: Map<string, GraphRelationship> = new Map()

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node)
  }

  addRelationship(relationship: GraphRelationship): void {
    this.relationships.set(relationship.id, relationship)
  }

  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values())
  }

  getRelationships(): GraphRelationship[] {
    return Array.from(this.relationships.values())
  }

  findNode(id: string): GraphNode | undefined {
    return this.nodes.get(id)
  }

  getOutgoingRelationships(nodeId: string): GraphRelationship[] {
    return Array.from(this.relationships.values()).filter(rel => rel.source === nodeId)
  }

  getIncomingRelationships(nodeId: string): GraphRelationship[] {
    return Array.from(this.relationships.values()).filter(rel => rel.target === nodeId)
  }
}
