# Claude Code 上下文查询工具设计 (Claude Code Context Query Tool Design)

**版本**: 1.0  
**状态**: 规划中  
**创建**: 2025-07-07  
**更新**: 2025-07-07  
**目标**: 为 Claude Code 提供最小化的知识图谱查询能力，增强其对项目的理解
**AI-Assisted**: true

---

## 🎯 核心理念 (Core Concept)

### 设计原则
1. **单一职责**: 只负责查询知识图谱，返回上下文信息
2. **不侵入**: 不改变 Claude Code 的任何现有功能
3. **透明增强**: Claude Code 可选择性地使用此工具获取额外上下文
4. **最小化**: 只包含必要的查询功能，避免功能膨胀

### 非目标 (Non-Goals)
- ❌ 不生成代码
- ❌ 不修改文件
- ❌ 不执行命令
- ❌ 不做决策
- ❌ 不替代 Claude Code 的任何功能

---

## 🏗️ 架构设计 (Architecture Design)

### 工具定位
```
Claude Code (主体)
    ↓
[需要项目上下文时]
    ↓
Context Query Tool (查询工具)
    ↓
Neo4j Knowledge Graph
    ↓
[返回相关信息]
    ↓
Claude Code 基于信息做出决策
```

### 核心组件
```typescript
// 最小化接口设计
interface IContextQueryTool {
  // 查询项目上下文
  queryContext(query: string): Promise<ContextInfo>
  
  // 获取相关代码模式
  findPatterns(description: string): Promise<Pattern[]>
  
  // 查找最佳实践
  getBestPractices(scenario: string): Promise<BestPractice[]>
}

interface ContextInfo {
  // 相关的类、接口、函数
  entities: Entity[]
  
  // 代码间的关系
  relationships: Relationship[]
  
  // 相关文档
  documentation: DocReference[]
  
  // 使用示例
  examples: Example[]
}
```

---

## 📋 功能范围 (Feature Scope)

### ✅ 包含功能
1. **自然语言查询**
   - 支持中文/英文查询
   - 理解开发意图
   - 返回结构化信息

2. **上下文检索**
   - 查找相关的类、接口、函数
   - 获取它们之间的关系
   - 找到使用示例

3. **最佳实践推荐**
   - 基于 LinchKit 规范
   - 返回推荐的实现模式
   - 提供参考链接

4. **文档关联**
   - 找到相关的文档
   - 返回 API 说明
   - 提供架构指导

### ❌ 不包含功能
- 代码生成
- 文件操作
- 命令执行
- 自动决策
- 工作流编排

---

## 🔧 实现方案 (Implementation Plan)

### 1. 重构现有代码
从 `VibeCodingEngine` 中提取查询相关功能：

```typescript
// packages/ai/src/context/context-query-tool.ts
export class ContextQueryTool {
  private queryEngine: IntelligentQueryEngine
  private contextAnalyzer: ContextAnalyzer
  
  async queryContext(query: string): Promise<ContextInfo> {
    // 1. 分析查询意图
    const intent = await this.analyzeIntent(query)
    
    // 2. 查询知识图谱
    const graphData = await this.queryEngine.query(query)
    
    // 3. 组织上下文信息
    return this.organizeContext(graphData)
  }
}
```

### 2. 删除不必要的功能
需要删除的部分：
- `generateCode()` 方法
- `validateGeneration()` 方法
- 代码模板系统
- 代码生成策略

保留的部分：
- `analyzeContext()` 方法
- `IntelligentQueryEngine`
- `ContextAnalyzer`
- Neo4j 连接和查询

### 3. Claude Code 集成点
```typescript
// Claude Code 内部使用示例
async function understandRequest(userPrompt: string) {
  // Claude Code 原有的理解逻辑
  
  // 可选：查询额外上下文
  if (needsProjectContext(userPrompt)) {
    const context = await contextTool.queryContext(userPrompt)
    // 使用上下文信息增强理解
  }
  
  // 继续 Claude Code 的正常流程
}
```

---

## 🚀 使用场景 (Use Cases)

### 场景 1：理解项目结构
```
用户: "我想了解认证系统是如何实现的"
Claude Code: 调用 contextTool.queryContext("认证系统实现")
返回: 
- @linch-kit/auth 包的核心类
- 认证流程中的关键函数
- 相关的配置和中间件
- 使用示例
```

### 场景 2：查找最佳实践
```
用户: "创建一个新的 API 端点"
Claude Code: 调用 contextTool.getBestPractices("API endpoint")
返回:
- LinchKit 推荐的 tRPC 路由模式
- 相关的 Schema 定义方式
- 错误处理最佳实践
```

### 场景 3：理解代码关系
```
用户: "UserService 都被哪些地方使用了？"
Claude Code: 调用 contextTool.findPatterns("UserService usage")
返回:
- 所有引用 UserService 的模块
- 调用关系图
- 典型的使用模式
```

---

## 📊 成功标准 (Success Criteria)

1. **性能指标**
   - 查询响应时间 < 2秒
   - 结果相关性 > 80%
   - 内存占用最小化

2. **集成指标**
   - 对 Claude Code 零侵入
   - 可选择性使用
   - 不影响现有功能

3. **价值指标**
   - 提升 Claude Code 对项目的理解
   - 减少不必要的文件读取
   - 提供更准确的上下文

---

## 🔄 知识图谱更新机制 (Knowledge Graph Update)

### 自动更新触发
1. **定期扫描**: 每日扫描代码变更
2. **事件驱动**: Git commit 后触发更新
3. **手动触发**: 提供命令行更新工具

### 更新内容
- 新增/修改的类、函数、接口
- 变更的依赖关系
- 新的使用模式
- 更新的文档

---

## 🛠️ 技术细节 (Technical Details)

### Neo4j 连接配置
```typescript
// 使用环境变量配置
const neo4jConfig = {
  uri: process.env.NEO4J_CONNECTION_URI,
  auth: {
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD
  },
  database: process.env.NEO4J_DATABASE || 'neo4j'
}
```

### 查询优化
```cypher
// 优化的上下文查询
MATCH (n:Class|Interface|Function)
WHERE n.name CONTAINS $keyword 
  OR n.description CONTAINS $keyword
WITH n
OPTIONAL MATCH (n)-[r]->(related)
RETURN n, r, related
ORDER BY n.importance DESC
LIMIT 20
```

---

## 📝 实施步骤 (Implementation Steps)

### Phase 1: 代码重构 (立即开始)
1. [ ] 创建 `context-query-tool.ts`
2. [ ] 从 `vibe-coding-engine.ts` 提取查询功能
3. [ ] 删除代码生成相关功能
4. [ ] 简化接口设计

### Phase 2: 优化查询 (第2天)
1. [ ] 优化 Cypher 查询性能
2. [ ] 改进意图识别
3. [ ] 增强结果相关性

### Phase 3: 集成测试 (第3天)
1. [ ] 创建集成示例
2. [ ] 性能测试
3. [ ] 文档更新

---

## 🔗 相关文档 (Related Documents)

- [AI 协作主指南](./AI_COLLABORATION_MASTER_GUIDE.md)
- [智能查询引擎](../../packages/ai/src/query/intelligent-query-engine.ts)
- [Graph RAG 实现](../../packages/ai/src/services/neo4j-service.ts)

---

**设计理念**: 做好一件事 - 为 Claude Code 提供项目上下文查询能力，仅此而已。