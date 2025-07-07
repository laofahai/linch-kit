# @linch-kit/ai API 参考

**版本**: 1.0.0  
**更新**: 2025-01-07  
**状态**: 初始发布 - Graph RAG 知识图谱和 AI 工具集成

## 概述

`@linch-kit/ai` 是 LinchKit 框架的 AI 集成层，提供基于 Graph RAG（Retrieval-Augmented Generation）的知识图谱构建、智能查询和上下文增强功能。作为 L4 层包，它为 AI 助手提供了深度理解和操作 LinchKit 项目的能力。

## 核心架构

### 包导出结构

```typescript
// 主入口 - @linch-kit/ai
export {
  // 核心类型
  GraphNode, GraphRelationship, NodeType, RelationType,
  IExtractor, IGraphService, ExtractionResult, Neo4jConfig,
  
  // 数据提取器
  BaseExtractor, PackageExtractor, CorrelationAnalyzer,
  createExtractor, getAvailableExtractorTypes,
  
  // Graph 服务
  Neo4jService,
  
  // 查询引擎
  IntelligentQueryEngine,
  
  // 上下文工具
  ContextQueryTool, EnhancedContextTool,
  
  // 生成引擎（废弃中）
  VibeCodingEngine,
  
  // 配置
  loadNeo4jConfig, validateNeo4jConfig
}

// 子模块导出
export * from '@linch-kit/ai/extractors'  // 数据提取器
export * from '@linch-kit/ai/graph'       // 图数据库服务
export * from '@linch-kit/ai/cli'         // CLI 工具
```

### 依赖关系

```typescript
// 内部依赖
import { createLogger } from '@linch-kit/core/server'
import { defineEntity, defineField } from '@linch-kit/schema'

// 外部依赖
import { Neo4jDriver } from 'neo4j-driver'
import { Project, SourceFile } from 'ts-morph'
import { z } from 'zod'
```

## 数据提取器 API

### BaseExtractor

所有数据提取器的基类。

```typescript
abstract class BaseExtractor implements IExtractor {
  constructor(config?: ExtractorConfig)
  
  abstract extract(): Promise<ExtractionResult>
  
  protected log(message: string, data?: any): void
  protected validateConfig(): void
}

interface ExtractorConfig {
  rootPath?: string
  include?: string[]
  exclude?: string[]
  parallel?: boolean
  batchSize?: number
  verbose?: boolean
}

interface ExtractionResult {
  nodes: GraphNode[]
  relationships: GraphRelationship[]
  metadata?: Record<string, any>
}
```

### PackageExtractor

提取项目包结构和依赖关系。

```typescript
class PackageExtractor extends BaseExtractor {
  constructor(config?: PackageExtractorConfig)
  
  async extract(): Promise<ExtractionResult>
  
  private extractPackageJson(path: string): Promise<PackageNode>
  private extractDependencies(pkg: any): DependencyRelationship[]
  private resolveDependencyVersions(deps: string[]): Promise<ResolvedDependency[]>
}

interface PackageExtractorConfig extends ExtractorConfig {
  includeDevDependencies?: boolean
  extractVersions?: boolean
  resolveWorkspace?: boolean
}

// 使用示例
const extractor = new PackageExtractor({
  rootPath: './projects/my-app',
  includeDevDependencies: true,
  extractVersions: true
})

const result = await extractor.extract()
// result.nodes: 包节点信息
// result.relationships: 依赖关系
```

### SchemaExtractor

提取 LinchKit Schema 定义和字段关系。

```typescript
class SchemaExtractor extends BaseExtractor {
  constructor(config?: SchemaExtractorConfig)
  
  async extract(): Promise<ExtractionResult>
  
  private extractSchemaFiles(paths: string[]): Promise<SchemaFile[]>
  private parseSchemaDefinitions(file: SourceFile): SchemaDefinition[]
  private extractFieldRelations(schema: SchemaDefinition): FieldRelation[]
}

interface SchemaExtractorConfig extends ExtractorConfig {
  schemaPath?: string
  includeValidation?: boolean
  extractRelations?: boolean
  includeGeneratedTypes?: boolean
}

// 使用示例
const extractor = new SchemaExtractor({
  schemaPath: './src/schemas',
  includeValidation: true,
  extractRelations: true
})

const result = await extractor.extract()
// result.nodes: Schema 节点、字段节点
// result.relationships: Schema 关系、字段关系
```

### DocumentExtractor

提取项目文档和 Markdown 内容。

```typescript
class DocumentExtractor extends BaseExtractor {
  constructor(config?: DocumentExtractorConfig)
  
  async extract(): Promise<ExtractionResult>
  
  private parseMarkdownFiles(paths: string[]): Promise<DocumentNode[]>
  private extractHeaders(content: string): HeaderNode[]
  private extractCodeBlocks(content: string): CodeBlockNode[]
  private extractLinks(content: string): LinkRelationship[]
}

interface DocumentExtractorConfig extends ExtractorConfig {
  docPaths?: string[]
  extractHeaders?: boolean
  extractCodeBlocks?: boolean
  extractLinks?: boolean
  includeMetadata?: boolean
}

// 使用示例
const extractor = new DocumentExtractor({
  docPaths: ['./docs', './README.md'],
  extractHeaders: true,
  extractCodeBlocks: true
})

const result = await extractor.extract()
```

### FunctionExtractor

提取函数定义、参数和调用关系。

```typescript
class FunctionExtractor extends BaseExtractor {
  constructor(config?: FunctionExtractorConfig)
  
  async extract(): Promise<ExtractionResult>
  
  private analyzeFunctions(files: SourceFile[]): FunctionNode[]
  private extractParameters(func: FunctionDeclaration): ParameterNode[]
  private findFunctionCalls(files: SourceFile[]): CallRelationship[]
}

interface FunctionExtractorConfig extends ExtractorConfig {
  sourcePaths?: string[]
  includePrivate?: boolean
  extractCalls?: boolean
  includeTypes?: boolean
  extractAsync?: boolean
}

// 使用示例
const extractor = new FunctionExtractor({
  sourcePaths: ['./src'],
  includePrivate: false,
  extractCalls: true
})

const result = await extractor.extract()
```

### ImportExtractor

提取模块导入和导出关系。

```typescript
class ImportExtractor extends BaseExtractor {
  constructor(config?: ImportExtractorConfig)
  
  async extract(): Promise<ExtractionResult>
  
  private analyzeImports(files: SourceFile[]): ImportNode[]
  private resolveModulePaths(imports: ImportDeclaration[]): ResolvedImport[]
  private extractExports(file: SourceFile): ExportNode[]
}

interface ImportExtractorConfig extends ExtractorConfig {
  sourcePaths?: string[]
  resolveModules?: boolean
  includeExternal?: boolean
  includeTypes?: boolean
}

// 使用示例
const extractor = new ImportExtractor({
  sourcePaths: ['./src'],
  resolveModules: true,
  includeExternal: false
})

const result = await extractor.extract()
```

### CorrelationAnalyzer

分析不同类型数据之间的关联关系。

```typescript
class CorrelationAnalyzer {
  constructor(config?: CorrelationConfig)
  
  async analyzeCorrelations(
    extractionResults: ExtractionResult[]
  ): Promise<CorrelationResult>
  
  private findCrossReferences(nodes: GraphNode[]): CrossReference[]
  private analyzeSemanticSimilarity(nodes: GraphNode[]): SimilarityScore[]
  private detectPatterns(relationships: GraphRelationship[]): Pattern[]
}

interface CorrelationConfig {
  enableSemanticAnalysis?: boolean
  similarityThreshold?: number
  includePatternDetection?: boolean
}

// 使用示例
const analyzer = new CorrelationAnalyzer({
  enableSemanticAnalysis: true,
  similarityThreshold: 0.8
})

const correlations = await analyzer.analyzeCorrelations([
  packageResult,
  schemaResult,
  documentResult
])
```

## Graph 服务 API

### Neo4jService

Neo4j 图数据库操作服务。

```typescript
class Neo4jService implements IGraphService {
  constructor(config: Neo4jConfig)
  
  // 连接管理
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  async testConnection(): Promise<boolean>
  
  // 节点操作
  async saveNodes(nodes: GraphNode[]): Promise<SaveResult>
  async saveNodesBatch(nodes: GraphNode[], options?: BatchOptions): Promise<SaveResult>
  async findNodesByType(type: NodeType): Promise<GraphNode[]>
  async findNodeById(id: string): Promise<GraphNode | null>
  async updateNode(id: string, properties: Record<string, any>): Promise<UpdateResult>
  async deleteNode(id: string): Promise<DeleteResult>
  
  // 关系操作
  async saveRelationships(rels: GraphRelationship[]): Promise<SaveResult>
  async saveRelationshipsBatch(rels: GraphRelationship[], options?: BatchOptions): Promise<SaveResult>
  async findRelationships(sourceId: string, type?: RelationType): Promise<GraphRelationship[]>
  async findPath(sourceId: string, targetId: string, options?: PathOptions): Promise<GraphPath[]>
  async deleteRelationship(id: string): Promise<DeleteResult>
  
  // 查询操作
  async runCypher(query: string, params?: Record<string, any>): Promise<QueryResult>
  async getGraphStats(): Promise<GraphStats>
  async clearGraph(): Promise<void>
  
  // 索引管理
  async createIndex(label: string, property: string): Promise<void>
  async dropIndex(label: string, property: string): Promise<void>
  async listIndexes(): Promise<IndexInfo[]>
}

interface Neo4jConfig {
  uri: string
  username: string
  password: string
  database?: string
  maxConnectionPoolSize?: number
  connectionTimeout?: number
  encrypted?: boolean
}

interface BatchOptions {
  batchSize?: number
  parallel?: boolean
  onProgress?: (processed: number, total: number) => void
}

// 使用示例
const config: Neo4jConfig = {
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'password',
  database: 'neo4j'
}

const service = new Neo4jService(config)

// 连接测试
await service.testConnection()

// 保存节点
await service.saveNodes([
  {
    id: 'user-schema',
    type: 'Schema',
    properties: { name: 'User', fields: ['id', 'email', 'name'] }
  }
])

// 保存关系
await service.saveRelationships([
  {
    id: 'user-profile-relation',
    type: 'HAS_ONE',
    source: 'user-schema',
    target: 'profile-schema',
    properties: { optional: false }
  }
])

// 查询节点
const nodes = await service.findNodesByType('Schema')

// 查询关系
const relations = await service.findRelationships('user-schema', 'HAS_ONE')

// 图统计
const stats = await service.getGraphStats()
```

## 查询引擎 API

### IntelligentQueryEngine

智能图查询引擎，提供高级查询功能。

```typescript
class IntelligentQueryEngine {
  constructor(config: Neo4jConfig, options?: QueryEngineOptions)
  
  // 实体查询
  async findEntity(identifier: string): Promise<EntityInfo | null>
  async findEntitiesByType(type: string): Promise<EntityInfo[]>
  async searchEntities(query: string, options?: SearchOptions): Promise<EntityInfo[]>
  
  // 依赖查询
  async findDependencies(
    entityId: string, 
    options?: DependencyOptions
  ): Promise<DependencyInfo[]>
  
  async findDependents(
    entityId: string,
    options?: DependencyOptions  
  ): Promise<DependencyInfo[]>
  
  // 路径查询
  async findPath(
    sourceId: string,
    targetId: string,
    options?: PathOptions
  ): Promise<GraphPath[]>
  
  async findShortestPath(
    sourceId: string,
    targetId: string,
    options?: PathOptions
  ): Promise<GraphPath | null>
  
  // 模式查询
  async findPatterns(
    query: string,
    options?: PatternOptions
  ): Promise<PatternInfo[]>
  
  async findSimilarEntities(
    entityId: string,
    options?: SimilarityOptions
  ): Promise<SimilarityResult[]>
  
  // 上下文查询
  async getEntityContext(
    entityId: string,
    options?: ContextOptions
  ): Promise<EntityContext>
  
  async getRelationshipContext(
    sourceId: string,
    targetId: string,
    options?: ContextOptions
  ): Promise<RelationshipContext>
}

interface QueryEngineOptions {
  enableCache?: boolean
  cacheTimeout?: number
  indexHints?: string[]
  maxQueryTime?: number
}

interface EntityInfo {
  id: string
  type: string
  name: string
  properties: Record<string, any>
  relationships: RelationshipInfo[]
  documentation?: DocReference[]
  examples?: Example[]
}

interface DependencyOptions {
  direction?: 'in' | 'out' | 'both'
  depth?: number
  types?: RelationType[]
  includeTransitive?: boolean
}

interface PatternOptions {
  includeExamples?: boolean
  includeBestPractices?: boolean
  includeAntiPatterns?: boolean
  contextDepth?: number
}

// 使用示例
const engine = new IntelligentQueryEngine(config)

// 查找实体
const entity = await engine.findEntity('UserSchema')
// 返回: EntityInfo 包含节点信息、关系、相关文档等

// 查找依赖
const deps = await engine.findDependencies('auth', {
  direction: 'out',
  depth: 2,
  types: ['DEPENDS_ON', 'USES']
})

// 查找路径
const path = await engine.findPath('auth', 'ui', {
  maxDepth: 5,
  relationTypes: ['DEPENDS_ON']
})

// 查找模式
const patterns = await engine.findPatterns('authentication', {
  includeExamples: true,
  includeBestPractices: true
})
```

## 上下文工具 API

### ContextQueryTool

基础上下文查询工具。

```typescript
class ContextQueryTool implements IContextQueryTool {
  constructor(config: Neo4jConfig)
  
  // 实体上下文
  async getEntityContext(entityId: string): Promise<ContextInfo>
  async getEntityUsage(entityId: string): Promise<UsageInfo[]>
  async getEntityDocumentation(entityId: string): Promise<DocReference[]>
  
  // 关系上下文
  async getRelationshipContext(
    sourceId: string,
    targetId: string
  ): Promise<RelationshipInfo>
  
  async getRelationshipPath(
    sourceId: string,
    targetId: string,
    maxDepth?: number
  ): Promise<PathInfo[]>
  
  // 搜索功能
  async searchRelevantContent(query: string): Promise<RelevantContent[]>
  async searchByIntent(intent: string): Promise<IntentResult>
  
  // 模式查询
  async findImplementationPatterns(
    concept: string
  ): Promise<Pattern[]>
  
  async findBestPractices(
    domain: string
  ): Promise<BestPractice[]>
}

interface ContextInfo {
  entity: EntityInfo
  relationships: RelationshipInfo[]
  documentation: DocReference[]
  examples: Example[]
  relatedEntities: EntityInfo[]
}

interface UsageInfo {
  usageType: 'import' | 'inheritance' | 'composition' | 'reference'
  location: string
  context: string
  frequency: number
}

interface Pattern {
  id: string
  name: string
  description: string
  implementation: string
  examples: Example[]
  useCases: string[]
}

// 使用示例
const tool = new ContextQueryTool(config)

// 获取实体上下文
const context = await tool.getEntityContext('UserSchema')

// 获取关系上下文
const relationContext = await tool.getRelationshipContext('auth', 'crud')

// 搜索相关内容
const results = await tool.searchRelevantContent('user authentication')
```

### EnhancedContextTool

增强上下文工具，提供 AI 优化的上下文信息。

```typescript
class EnhancedContextTool {
  constructor(config: Neo4jConfig)
  
  async getEnhancedContext(query: string): Promise<EnhancedContextResponse>
  
  private analyzeIntent(query: string): Promise<DetectedAction>
  private suggestImplementation(action: DetectedAction): Promise<ImplementationStep[]>
  private findRelevantPatterns(query: string): Promise<Pattern[]>
  private generateFieldSuggestions(entityType: string): Promise<FieldSuggestion[]>
}

interface EnhancedContextResponse {
  // 意图分析
  detectedAction: DetectedAction
  confidence: number
  
  // 实体建议
  suggestedEntity?: string
  relatedEntities: EntityInfo[]
  
  // 字段建议
  recommendedFields: FieldSuggestion[]
  
  // 实现步骤
  implementationSteps: ImplementationStep[]
  
  // 相关模式
  relatedPatterns: Pattern[]
  
  // 最佳实践
  bestPractices: BestPractice[]
  
  // 代码示例
  codeExamples: CodeExample[]
  
  // 文档链接
  documentationLinks: DocReference[]
}

interface DetectedAction {
  type: 'create' | 'update' | 'query' | 'delete' | 'configure'
  target: string
  context: string
  parameters?: Record<string, any>
}

interface FieldSuggestion {
  name: string
  type: string
  required: boolean
  description: string
  validation?: string
  examples: any[]
}

interface ImplementationStep {
  order: number
  title: string
  description: string
  code?: string
  dependencies?: string[]
  estimatedTime?: string
}

// 使用示例
const tool = new EnhancedContextTool(config)

// 获取增强上下文
const context = await tool.getEnhancedContext('create user profile form')

console.log(context.detectedAction) // 'create'
console.log(context.suggestedEntity) // 'UserProfile'
console.log(context.recommendedFields) // 字段建议
console.log(context.implementationSteps) // 实现步骤
console.log(context.relatedPatterns) // 相关模式
console.log(context.bestPractices) // 最佳实践
```

## CLI 工具 API

### CLI 插件集成

```typescript
// LinchKit CLI 插件
export const cliPlugin: CLIPlugin = {
  name: 'ai',
  description: 'AI 工具和 Graph RAG 功能',
  commands: [
    extractCommand,
    queryCommand,
    generateCommand,
    contextCommand
  ]
}

// 使用方式
// bun run linch-kit plugin install ai
// bun run linch-kit ai extract --type all
// bun run linch-kit ai query --type node --search "UserSchema"
```

### 独立 CLI 工具

```bash
# 全局安装 (推荐使用 bun)
bun add -g @linch-kit/ai
# 或使用 npm (不推荐)
npm install -g @linch-kit/ai

# 数据提取
linch-kit-ai extract --type all --output neo4j
linch-kit-ai extract --type package,schema --output json --file output.json

# 图查询
linch-kit-ai query --type node --search "UserSchema" --format table
linch-kit-ai query --type path --search "auth->crud" --depth 3

# 上下文生成
linch-kit-ai context --query "user authentication" --format ai-context
linch-kit-ai generate --intent "create user schema" --output suggestions.md
```

## 核心类型定义

### 图数据类型

```typescript
// 节点类型
type NodeType = 
  | 'Package'
  | 'Schema' 
  | 'Field'
  | 'Function'
  | 'Class'
  | 'Interface'
  | 'Document'
  | 'Header'
  | 'CodeBlock'

// 关系类型
type RelationType =
  | 'DEPENDS_ON'
  | 'USES'
  | 'EXTENDS'
  | 'IMPLEMENTS'
  | 'HAS_FIELD'
  | 'HAS_METHOD'
  | 'REFERENCES'
  | 'DOCUMENTS'
  | 'CALLS'

// 图节点
interface GraphNode {
  id: string
  type: NodeType
  properties: Record<string, any>
  labels?: string[]
  metadata?: Record<string, any>
}

// 图关系
interface GraphRelationship {
  id: string
  type: RelationType
  source: string
  target: string
  properties?: Record<string, any>
  metadata?: Record<string, any>
}

// 查询结果
interface QueryResult {
  records: Record<string, any>[]
  summary: QuerySummary
  hasMore: boolean
}

// 图统计
interface GraphStats {
  nodeCount: number
  relationshipCount: number
  nodeTypes: Record<NodeType, number>
  relationshipTypes: Record<RelationType, number>
  averageDegree: number
  density: number
}
```

### 配置类型

```typescript
// Neo4j 配置
const Neo4jConfigSchema = z.object({
  uri: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  database: z.string().optional().default('neo4j'),
  maxConnectionPoolSize: z.number().optional().default(50),
  connectionTimeout: z.number().optional().default(30000),
  encrypted: z.boolean().optional().default(true)
})

type Neo4jConfig = z.infer<typeof Neo4jConfigSchema>

// AI 工具配置
interface AIToolConfig {
  neo4j: Neo4jConfig
  extractors: ExtractorType[]
  enableCache: boolean
  cacheTimeout: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}
```

## 最佳实践

### 1. 数据提取优化

```typescript
// 批量处理大型项目
const extractor = new PackageExtractor({
  parallel: true,
  batchSize: 100,
  verbose: true
})

// 增量更新
const lastSync = await getLastSyncTime()
const result = await extractor.extract({
  incrementalMode: true,
  since: lastSync
})
```

### 2. 查询性能优化

```typescript
// 创建适当的索引
await neo4jService.createIndex('Schema', 'name')
await neo4jService.createIndex('Package', 'name')

// 使用查询提示
const engine = new IntelligentQueryEngine(config, {
  enableCache: true,
  cacheTimeout: 300000, // 5分钟
  indexHints: ['Schema:name', 'Package:name']
})
```

### 3. 错误处理

```typescript
try {
  const result = await extractor.extract()
  await neo4jService.saveNodes(result.nodes)
} catch (error) {
  if (error instanceof Neo4jError) {
    // 处理 Neo4j 特定错误
    logger.error('Neo4j error:', error.message)
  } else if (error instanceof ExtractionError) {
    // 处理提取错误
    logger.error('Extraction error:', error.details)
  } else {
    // 处理其他错误
    logger.error('Unexpected error:', error)
  }
}
```

### 4. 内存优化

```typescript
// 流式处理大型数据集
const extractor = new PackageExtractor({
  streaming: true,
  onBatch: async (batch) => {
    await neo4jService.saveNodesBatch(batch.nodes)
    await neo4jService.saveRelationshipsBatch(batch.relationships)
  }
})
```

## 故障排除

### 常见问题

1. **Neo4j 连接失败**
   - 检查 Neo4j 服务状态
   - 验证连接配置
   - 检查网络连接

2. **数据提取失败**
   - 确保项目结构符合规范
   - 检查 TypeScript 编译配置
   - 验证文件访问权限

3. **查询性能问题**
   - 创建适当的索引
   - 优化查询条件
   - 使用批量查询

### 调试技巧

```typescript
// 启用详细日志
const logger = createLogger({ 
  name: 'ai-debug',
  level: 'debug'
})

// 使用性能监控
const startTime = performance.now()
const result = await extractor.extract()
const endTime = performance.now()
logger.info(`Extraction took ${endTime - startTime} milliseconds`)

// 内存使用监控
const memUsage = process.memoryUsage()
logger.info('Memory usage:', memUsage)
```

## 更新历史

### v1.0.0 (2025-01-07)
- 初始发布
- 完整的 Graph RAG 架构
- 5 种数据提取器（Package、Schema、Document、Function、Import）
- Neo4j 图数据库集成
- 智能查询引擎
- 增强上下文工具
- CLI 工具集成

### 计划中的功能
- 更多数据提取器类型
- 向量搜索集成
- AI 模型集成（OpenAI、Anthropic）
- 实时数据同步
- 分布式图数据库支持
- GraphQL API
- Web UI 管理界面

---

**注意**: 此包当前处于初始发布阶段，API 可能会在后续版本中发生变化。建议在生产环境中谨慎使用，并密切关注更新日志。