# LinchKit Graph RAG MVP 设计文档

**版本**: 1.0  
**创建**: 2025-07-06  
**状态**: 设计阶段  
**目标**: 实现阶段1.2初始数据提取器开发

---

## 🎯 设计目标

基于 AI-First 实现路线图阶段1.2，构建 LinchKit Graph RAG MVP，为 AI 助手提供项目知识图谱查询能力。

### 核心功能
1. **初始数据提取器** - 提取 package.json、AI文档、设计文档
2. **数据导入管道** - 将提取数据加载到 Neo4j AuraDB
3. **基本查询服务** - 实现 `query_linchkit_graph()` 工具

---

## 🏗️ 架构设计 - 混合策略 (方案C)

### 设计原则
- **复用现有功能** - 必须使用 LinchKit 内部包功能，禁止重复实现
- **遵循架构层次** - 基于现有 L0-L4 层次，提前实现规划中的 @linch-kit/ai
- **TypeScript严格模式** - 端到端类型安全，禁止 `any` 类型
- **分阶段实施** - 先扩展现有工具，再创建专门包

### 分阶段架构策略 (基于Gemini协商建议)

#### 阶段 1.2 (当前): 数据提取器
**策略**: 扩展现有工具脚本，完全符合"不增加新包"约束

```
scripts/
├── deps-graph.js             # 现有文件
├── graph-data-extractor.js   # 新增: 扩展依赖分析
├── document-extractor.js     # 新增: AI文档解析
└── neo4j-importer.js          # 新增: 数据导入工具
```

**理由**:
- 完全遵守"L0-L4不增加新包"约束
- 复用现有 `DependencyGraph` 类功能
- 最快、最直接、最不具破坏性的方法
- 为后续阶段验证数据格式和导入流程

#### 阶段 1.3 (后续): Graph RAG 核心功能  
**策略**: 正式创建 @linch-kit/ai 包，实现规划中的L4层

```
packages/ai/                   # 新包: L4 AI集成层
├── src/
│   ├── graph/                 # Graph RAG核心
│   │   ├── neo4j-service.ts   # Neo4j连接管理
│   │   ├── query-engine.ts    # Graph查询引擎
│   │   └── rag-service.ts     # RAG集成逻辑
│   ├── tools/                 # AI工具集成
│   │   └── query-tool.ts      # query_linchkit_graph()
│   ├── types/                 # AI相关类型
│   └── index.ts
├── package.json               # 依赖: core, schema
└── README.md
```

**理由**:
- Graph RAG是全新的、高度专业化的AI功能
- 避免污染 @linch-kit/core 的职责边界
- 实现规划中的 L4: @linch-kit/ai 包
- 为未来AI功能扩展提供专门的包结构

---

## 🔧 技术选型

### 数据提取技术栈
- **package.json 解析** - 复用现有 `DependencyGraph` 类
- **Markdown 解析** - 使用 Node.js fs API + 正则表达式
- **JSON 处理** - 原生 JSON.parse 配合 Zod 验证

### 数据存储
- **图数据库** - Neo4j AuraDB (已配置)
- **连接管理** - neo4j-driver 库
- **数据同步** - 基于 `AuditManager` 模式

### 类型安全
- **Schema 验证** - 使用 Zod 定义所有数据结构
- **端到端类型** - TypeScript 严格模式
- **运行时检查** - 所有外部数据必须验证

---

## 📊 图谱 Schema 设计

### 节点类型 (Node Types)
```typescript
enum NodeType {
  PACKAGE = 'Package',      // LinchKit 包
  DOCUMENT = 'Document',    // 文档文件
  CONCEPT = 'Concept',      // 抽象概念
  API = 'API'               // 函数/类/接口
}
```

### 关系类型 (Relationship Types)
```typescript  
enum RelationType {
  DEPENDS_ON = 'DEPENDS_ON',    // 包依赖关系 (复用deps-graph)
  DOCUMENTS = 'DOCUMENTS',      // 文档关联
  DEFINES = 'DEFINES',          // 定义关系
  REFERENCES = 'REFERENCES'     // 引用关系
}
```

### 数据结构
```typescript
interface GraphNode {
  id: string
  type: NodeType
  name: string
  properties: Record<string, unknown>
  metadata: {
    created_at?: Date
    updated_at?: Date
    source_file?: string
    package?: string
  }
}
```

---

## 🔄 数据提取流程

### 阶段1: Package 数据提取
**复用现有功能**: 扩展 `scripts/deps-graph.js` 的 `DependencyGraph` 类

```typescript
class PackageExtractor extends DependencyGraph {
  extractGraphData(): PackageExtractedData {
    // 复用现有依赖分析逻辑
    // 转换为Graph RAG格式
  }
}
```

### 阶段2: 文档数据提取
**目标文档**: `ai-context/library_api/*.md`

```typescript
class DocumentExtractor {
  async extractFromMarkdown(filePath: string): Promise<DocumentNode[]>
  async extractConcepts(content: string): Promise<ConceptNode[]>
}
```

### 阶段3: 设计文档提取
**目标文档**: `README.md`, `DESIGN.md`, `ai-context/architecture/*.md`

```typescript
class DesignExtractor {
  async extractArchitectureConcepts(filePath: string): Promise<ConceptNode[]>
  async extractDesignDecisions(content: string): Promise<GraphRelationship[]>
}
```

---

## 🗄️ Neo4j 连接设计

### 连接配置
```typescript
interface Neo4jConfig {
  connectionUri: string         // neo4j+s://e3e9521a.databases.neo4j.io
  username: string             // neo4j
  password: string             // 从环境变量获取
  database: string             // "neo4j" (默认)
}
```

### 服务接口
```typescript
interface GraphService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  importData(nodes: GraphNode[], relationships: GraphRelationship[]): Promise<void>
  query(cypher: string, parameters?: Record<string, unknown>): Promise<QueryResult>
}
```

---

## 🛠️ 实现计划

### 第一阶段 (当前Session)
1. **扩展 @linch-kit/core** - 添加 graph-rag 目录和基础类型
2. **Package 提取器** - 复用 DependencyGraph，输出 Graph 格式数据
3. **Neo4j 连接测试** - 验证 AuraDB 连接和基本操作

### 第二阶段 (后续Session)  
1. **文档提取器** - 解析 ai-context/library_api/*.md
2. **数据导入管道** - 批量导入到 Neo4j
3. **基本查询服务** - 实现常用查询函数

### 第三阶段 (完成阶段)
1. **CLI 工具集成** - 添加命令行接口
2. **AI 工具接口** - 实现 `query_linchkit_graph()` 函数
3. **测试覆盖** - 达到 90%+ 测试覆盖率

---

## 🔍 关键技术决策

### 1. 包结构决策
**决策**: 扩展 @linch-kit/core 而非创建新包
**理由**: 
- 复用现有 DependencyGraph 功能
- 避免违反架构依赖顺序
- 减少包管理复杂度

### 2. 数据提取策略
**决策**: 渐进式提取，从简单到复杂
**理由**:
- 符合 MVP 原则
- 降低技术风险
- 便于迭代优化

### 3. 类型安全策略
**决策**: 所有数据使用 Zod Schema 验证
**理由**:
- 符合 LinchKit Schema 驱动原则
- 运行时类型安全
- AI 友好的结构化数据

---

## 🚨 风险与应对

### 技术风险
1. **Neo4j 连接问题** - 预先测试连接，准备降级方案
2. **数据量过大** - 分批处理，实现增量更新
3. **性能瓶颈** - 优化查询，建立索引

### 实现风险
1. **复杂度超预期** - 严格控制 MVP 范围
2. **架构违规** - 每步都验证架构约束
3. **测试覆盖不足** - 同步开发测试用例

---

## 📝 下一步行动

1. **与 Gemini 协商** - 确认技术选型和实现策略
2. **用户确认设计** - 获得明确的设计批准
3. **开始实现** - 按照设计严格执行

---

**复用现有功能清单**:
- ✅ DependencyGraph (scripts/deps-graph.js) → Package 依赖提取
- ✅ AuditManager (packages/core/audit/) → 数据管理模式
- ✅ Logger (packages/core/observability/) → 日志记录
- ✅ ConfigManager (packages/core/config/) → 配置管理

**AI-Assisted**: true  
**需要 Gemini 协商**: 技术实现策略、性能优化方案、错误处理机制