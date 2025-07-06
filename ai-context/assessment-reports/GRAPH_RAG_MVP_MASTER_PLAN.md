# LinchKit Graph RAG MVP 总体规划

基于深度评估和 Gemini 协商制定 | 2025-07-06

## 🎯 核心战略决策

**Graph RAG MVP 设为 P0.5 优先级** - 先加固基础，再创新验证

### 💡 关键洞察
1. **Schema 驱动是天然优势** - LinchKit 的 Zod Schema 本质上就是知识图谱的蓝图
2. **创新需要稳定基础** - 在19.4%测试覆盖率上构建复杂功能风险极高
3. **双轨并行策略** - 基础加固与特性验证同时进行

## 📈 三阶段重新平衡计划

### 🔴 Phase 1: 基础加固与平台准备 (1-2周)

#### 任务 1.1: 核心测试覆盖率提升 (P0)
```bash
# 目标: core > 80%, schema > 90%
Week 1: @linch-kit/core 测试加固
- [ ] logger 模块测试套件
- [ ] ConfigManager 完整测试
- [ ] 插件系统测试
- [ ] 目标覆盖率: 80%+

Week 2: @linch-kit/schema 测试加固  
- [ ] 所有 Schema 转换功能测试
- [ ] 验证器边界情况测试
- [ ] Schema 继承和组合测试
- [ ] 目标覆盖率: 90%+
```

#### 任务 1.2: Graph RAG 原型包创建 (P1)
```bash
# 创建符合规范的新包
mkdir packages/graph-rag
cd packages/graph-rag

# 初始化包结构
├── package.json          # 依赖 core + schema
├── tsconfig.json         # 继承根配置
├── src/
│   ├── index.ts         # 主入口
│   ├── schema-parser.ts # Schema转Graph转换器
│   ├── indexing.ts      # 索引服务
│   └── query.ts         # 查询引擎
└── __tests__/           # 测试目录
    └── *.test.ts

# 质量要求: 从第一行代码开始就保持 >80% 测试覆盖率
```

### 🟡 Phase 2: Graph RAG MVP 实施 (2-3周)

#### 核心架构设计
```typescript
// packages/graph-rag/src/types.ts
export interface GraphNode {
  id: string;
  type: string;  // 基于 Schema 名称
  properties: Record<string, any>;
  embeddings?: number[];
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  properties?: Record<string, any>;
}

export interface GraphRAGConfig {
  vectorStore: 'chroma' | 'pinecone' | 'memory';
  graphStore: 'neo4j' | 'memory';
  llmProvider: 'openai' | 'anthropic' | 'gemini';
}
```

#### 任务 2.1: Schema-to-Graph 转换器
```typescript
// packages/graph-rag/src/schema-parser.ts
import { z } from 'zod';

export class SchemaGraphParser {
  /**
   * 动态解析 @linch-kit/schema 包中的所有 schema
   * 识别实体（节点）和关系（边）
   */
  async parseSchemaPackage(): Promise<GraphDefinition> {
    // 1. 动态导入 schema 包
    const schemas = await import('@linch-kit/schema');
    
    // 2. 解析 Zod schema 结构
    const nodes = this.extractNodes(schemas);
    const edges = this.extractRelationships(schemas);
    
    return { nodes, edges };
  }
  
  private extractNodes(schemas: any): GraphNode[] {
    // 实现 Schema → 节点的转换逻辑
  }
  
  private extractRelationships(schemas: any): GraphEdge[] {
    // 实现 Schema → 关系的转换逻辑
  }
}
```

#### 任务 2.2: 索引服务
```typescript
// packages/graph-rag/src/indexing.ts
export class GraphRAGIndexer {
  constructor(private config: GraphRAGConfig) {}
  
  /**
   * 将数据索引到图数据库和向量数据库
   */
  async indexData<T>(data: T[], schemaName: string): Promise<void> {
    // 1. 使用 schema-parser 获取图定义
    const graphDef = await this.parseSchema(schemaName);
    
    // 2. 将数据转换为节点和边
    const { nodes, edges } = this.transformToGraph(data, graphDef);
    
    // 3. 存储到向量数据库（文本属性）
    await this.storeVectors(nodes);
    
    // 4. 存储到图数据库（结构关系）
    await this.storeGraph(nodes, edges);
  }
}
```

#### 任务 2.3: 查询引擎
```typescript
// packages/graph-rag/src/query.ts
export class GraphRAGQuery {
  /**
   * 处理自然语言查询
   */
  async query(question: string): Promise<GraphRAGResult> {
    // 1. LLM 分析查询意图
    const intent = await this.analyzeQuery(question);
    
    // 2. 执行图查询
    const graphPath = await this.executeGraphQuery(intent);
    
    // 3. 向量搜索相关上下文
    const context = await this.vectorSearch(graphPath);
    
    // 4. LLM 合成最终答案
    const answer = await this.synthesizeAnswer(question, graphPath, context);
    
    return { answer, sources: graphPath, confidence: this.calculateConfidence() };
  }
}
```

#### 任务 2.4: tRPC 集成
```typescript
// packages/trpc/src/routers/graph-rag.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { GraphRAGQuery } from '@linch-kit/graph-rag';

export const graphRAGRouter = router({
  query: publicProcedure
    .input(z.object({
      question: z.string().min(1),
      context: z.string().optional()
    }))
    .query(async ({ input }) => {
      const engine = new GraphRAGQuery();
      return await engine.query(input.question);
    }),
    
  index: publicProcedure
    .input(z.object({
      data: z.array(z.any()),
      schemaName: z.string()
    }))
    .mutation(async ({ input }) => {
      const indexer = new GraphRAGIndexer();
      await indexer.indexData(input.data, input.schemaName);
      return { success: true };
    })
});
```

#### 任务 2.5: 前端验证界面
```tsx
// modules/console/src/components/GraphRAGDemo.tsx
export function GraphRAGDemo() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<GraphRAGResult | null>(null);
  
  const queryMutation = trpc.graphRAG.query.useMutation();
  
  const handleSubmit = async () => {
    const result = await queryMutation.mutateAsync({ question });
    setResult(result);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">LinchKit Graph RAG Demo</h1>
      
      <div className="space-y-4">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="问一个关于数据关系的问题..."
          className="w-full p-3 border rounded-lg"
          rows={3}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!question.trim() || queryMutation.isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          {queryMutation.isLoading ? '查询中...' : '提交问题'}
        </button>
        
        {result && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">回答：</h3>
            <p className="mb-4">{result.answer}</p>
            
            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer">查看数据来源</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(result.sources, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 🟢 Phase 3: 迭代与扩展 (持续进行)

#### 任务 3.1: 扩展测试覆盖率
```bash
# 并行进行，逐步提升其他包的测试覆盖率
Month 1: auth, crud 包测试覆盖率 > 80%
Month 2: trpc, ui 包测试覆盖率 > 80%
Month 3: 集成测试和 E2E 测试
```

#### 任务 3.2: Graph RAG 优化
```bash
# 基于 MVP 反馈的功能增强
- 引入更复杂的图算法（社区检测、路径排序）
- 优化 Prompt Engineering
- 支持实时数据索引
- 添加缓存机制
- 多模态支持（文本、图像）
```

#### 任务 3.3: 可视化界面
```bash
# 构建专业的知识图谱探索界面
- 交互式图谱可视化
- 查询结果高亮显示
- 数据血缘追踪
- 实时协作功能
```

## 🎯 成功指标

### Phase 1 成功标准 (2周内)
- [ ] @linch-kit/core 测试覆盖率 > 80%
- [ ] @linch-kit/schema 测试覆盖率 > 90%
- [ ] @linch-kit/graph-rag 包创建完成
- [ ] 基础 CI/CD 质量门禁建立

### Phase 2 成功标准 (5周内)
- [ ] 能够回答简单的数据关系问题
- [ ] 端到端流程完整可用
- [ ] 前端 Demo 界面可展示
- [ ] 所有新代码测试覆盖率 > 80%

### Phase 3 成功标准 (3个月内)
- [ ] 整体项目测试覆盖率 > 80%
- [ ] Graph RAG 功能生产就绪
- [ ] 开源社区开始关注
- [ ] 成为 Schema 驱动 + AI 的标杆案例

## 🚀 立即行动计划

### 本周必做
1. [ ] 开始 @linch-kit/core 测试覆盖率提升
2. [ ] 创建 @linch-kit/graph-rag 包结构
3. [ ] 设计 Schema-to-Graph 转换器接口
4. [ ] 更新项目文档

### 下周计划
1. [ ] 完成 @linch-kit/schema 测试覆盖率提升
2. [ ] 实现 Schema 解析核心逻辑
3. [ ] 选择并集成向量数据库
4. [ ] 开始索引服务开发

## 📊 风险评估与缓解

### 主要风险
1. **技术复杂度过高** - 缓解：采用 MVP 方法，先实现最简单的场景
2. **测试覆盖率提升困难** - 缓解：专注核心包，采用分阶段方法
3. **AI 集成不稳定** - 缓解：使用成熟的 AI SDK，建立降级机制

### 应急预案
如果 Graph RAG 开发遇到阻碍，立即回退到原始的测试覆盖率提升计划，确保项目基础质量。

---

本计划平衡了创新与稳定，通过 Graph RAG MVP 验证 LinchKit 的核心架构价值，同时补齐技术债务。