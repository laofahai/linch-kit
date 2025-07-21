/**
 * AI Platform Types
 * 统一类型定义文件
 * 
 * @version 1.0.0
 */

// ========== 图谱节点和关系类型 ==========

export enum NodeType {
  PACKAGE = 'Package',
  CLASS = 'Class',
  FUNCTION = 'Function',
  INTERFACE = 'Interface',
  TYPE = 'Type',
  FILE = 'File',
  IMPORT = 'Import',
  EXPORT = 'Export',
  DOCUMENT = 'Document'
}

export enum RelationType {
  DEPENDS_ON = 'DEPENDS_ON',
  IMPLEMENTS = 'IMPLEMENTS',
  EXTENDS = 'EXTENDS',
  IMPORTS = 'IMPORTS',
  EXPORTS = 'EXPORTS',
  CONTAINS = 'CONTAINS',
  USES = 'USES',
  REFERENCES = 'REFERENCES'
}

export interface GraphNode {
  id: string
  type: NodeType
  name: string
  properties: Record<string, unknown>
  metadata?: {
    source_file?: string
    line_number?: number
    confidence?: number
    package?: string
    created_at?: string
    updated_at?: string
  }
}

export interface GraphRelationship {
  id: string
  type: RelationType
  source: string
  target: string
  properties?: Record<string, unknown>
  metadata?: {
    confidence?: number
    created_at?: string
    weight?: number
  }
}

export interface PackageNode extends GraphNode {
  type: NodeType.PACKAGE
  properties: {
    name: string
    version: string
    path: string
    dependencies: string[]
    devDependencies: string[]
    peerDependencies: string[]
    file_count?: number
    description?: string
  }
}

// ========== ID生成器 ==========

export class NodeIdGenerator {
  static generate(type: NodeType, name: string, context?: string): string {
    const prefix = type.toLowerCase()
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_')
    const contextSuffix = context ? `_${context.replace(/[^a-zA-Z0-9_-]/g, '_')}` : ''
    const hash = this.simpleHash(name + (context || ''))
    
    return `${prefix}:${sanitizedName}${contextSuffix}_${hash}`
  }
  
  private static simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6)
  }
}

export class RelationshipIdGenerator {
  static generate(
    type: RelationType, 
    fromId: string, 
    toId: string, 
    context?: string
  ): string {
    const contextSuffix = context ? `_${context.replace(/[^a-zA-Z0-9_-]/g, '_')}` : ''
    const hash = this.simpleHash(`${type}_${fromId}_${toId}${contextSuffix}`)
    
    return `rel:${type.toLowerCase()}_${hash}`
  }
  
  private static simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36).substring(0, 8)
  }
}

// ========== 工作流状态类型 ==========

export type WorkflowState = 
  | 'INIT'
  | 'ANALYZE' 
  | 'PLAN'
  | 'IMPLEMENT'
  | 'TEST'
  | 'REVIEW'
  | 'COMPLETE'

export type ExtendedWorkflowState = WorkflowState
  | 'PAUSED'
  | 'FAILED'
  | 'CANCELLED'

// ========== Guardian类型 ==========

export interface GuardianValidationResult {
  passed: boolean
  warnings: string[]
  violations: string[]
  metadata?: {
    rulesBroken?: string[]
    severity?: 'low' | 'medium' | 'high' | 'critical'
    suggestions?: string[]
  }
}

export interface ArchViolation {
  id: string
  type: 'circular_dependency' | 'layer_violation' | 'forbidden_import' | 'coupling_violation'
  severity: 'warning' | 'error' | 'critical'
  message: string
  source: string
  target?: string
  suggestion?: string
}

// ========== AI平台配置类型 ==========

export interface AIPlatformConfig {
  neo4j?: {
    uri: string
    username: string
    password: string
    database?: string
  }
  gemini?: {
    apiKey: string
    model?: string
  }
  workflow?: {
    enableRulesEngine?: boolean
    enableSnapshots?: boolean
    autoSync?: boolean
  }
}

// ========== Graph Service Types ==========

export interface IGraphService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query(cypher: string, parameters?: Record<string, unknown>): Promise<QueryResult>
  importData(nodes: GraphNode[], relationships: GraphRelationship[]): Promise<void>
  findNode(id: string): Promise<GraphNode | null>
  findRelatedNodes(nodeId: string, relationType?: RelationType): Promise<GraphNode[]>
  clearDatabase(): Promise<void>
  getStats(): Promise<GraphStats>
}

export interface Neo4jConfig {
  connectionUri: string
  username: string
  password: string
  database: string
}

export interface QueryResult {
  nodes: GraphNode[]
  relationships: GraphRelationship[]
  records: Record<string, unknown>[]
  metadata?: {
    query_time_ms?: number
    result_count?: number
    query?: string
  }
}

export interface GraphStats {
  node_count: number
  relationship_count: number
  node_types: Record<string, number>
  relationship_types: Record<string, number>
  last_updated: string
}

export interface Logger {
  info(message: string, meta?: unknown): void
  error(message: string, error?: Error, meta?: unknown): void
  warn(message: string, meta?: unknown): void
  debug(message: string, meta?: unknown): void
}

// ========== Extractor Types ==========

export interface IExtractor<T = unknown> {
  extract(): Promise<ExtractionResult<T>>
}

export interface ExtractionResult<T = unknown> {
  nodes: GraphNode[]
  relationships: GraphRelationship[]
  metadata?: Record<string, unknown>
  raw_data?: T
}

// ========== 导出所有类型 ==========

export * from './workflow-types'
export * from './guardian-types'

// 为了向后兼容，也提供一些旧的导出
export type {
  GraphNode as Node,
  GraphRelationship as Relationship,
  PackageNode as Package
}