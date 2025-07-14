/**
 * LinchKit AI Package
 *
 * L4 AI 集成层 - Graph RAG 知识图谱和 AI 工具
 */

// 核心类型导出
export type {
  GraphNode,
  GraphRelationship,
  NodeType,
  RelationType,
  IExtractor,
  IGraphService,
  ExtractionResult,
  Neo4jConfig,
  QueryResult,
  GraphStats,
  AIToolConfig,
} from './types/index.js'

export {
  NodeIdGenerator,
  RelationshipIdGenerator,
  GraphNodeSchema,
  GraphRelationshipSchema,
  Neo4jConfigSchema,
  QueryResultSchema,
} from './types/index.js'

// 数据提取器
export {
  BaseExtractor,
  PackageExtractor,
  CorrelationAnalyzer,
  createExtractor,
  getAvailableExtractorTypes,
  AVAILABLE_EXTRACTORS,
  type ExtractorType,
} from './extractors/index.js'

// Graph 服务
export { Neo4jService } from './graph/neo4j-service.js'

// 查询引擎
export { IntelligentQueryEngine } from './query/intelligent-query-engine.js'

// 上下文查询工具
export { ContextQueryTool } from './context/context-query-tool.js'
export { EnhancedContextTool } from './context/enhanced-context-tool.js'
export type {
  ContextInfo,
  EntityInfo,
  RelationshipInfo,
  DocReference,
  Example,
  BestPractice,
  Pattern,
  IContextQueryTool,
} from './context/context-query-tool.js'
export type {
  EnhancedContextResponse,
  DetectedAction,
  FieldSuggestion,
  ImplementationStep,
} from './context/enhanced-context-tool.js'

// 生成引擎 (将被废弃)
export { VibeCodingEngine } from './generation/vibe-coding-engine.js'

// 配置加载器
export { loadNeo4jConfig, validateNeo4jConfig } from './config/neo4j-config.js'

// AI Guardian 智能体集群
export { ArchWarden } from './guardian/arch-warden.js'
export { 
  getAllGuardians, 
  getGuardiansByPhase, 
  getActiveGuardians,
  ACTIVE_GUARDIANS,
  PLANNED_GUARDIANS,
  GUARDIAN_VERSION,
  GUARDIAN_PHASE
} from './guardian/index.js'
export type { GuardianAgent } from './guardian/index.js'

// 版本信息
export const VERSION = '1.0.0'
