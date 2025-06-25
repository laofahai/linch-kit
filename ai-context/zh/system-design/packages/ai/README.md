# @linch-kit/ai

LinchKit 的 AI 集成包，提供多提供商 AI 服务、智能代码生成、自然语言查询、AI 工作流等企业级 AI 功能。

## 特性

- 🤖 **多提供商支持**: OpenAI、Claude、Gemini、Azure OpenAI 等
- 💬 **自然语言查询**: 将自然语言转换为数据库查询和操作
- 🧠 **智能代码生成**: 基于 Schema 自动生成代码、API 和文档
- 📊 **AI 数据分析**: 自动化数据洞察和智能报告生成
- 🔄 **AI 工作流**: 可视化 AI 任务编排和自动化
- 💰 **成本优化**: 智能模型选择和使用量优化
- 🔒 **安全隐私**: 企业级数据安全和隐私保护
- 🎯 **智能缓存**: AI 驱动的缓存策略和预测性加载

## 安装

```bash
pnpm add @linch-kit/ai
```

## 快速开始

### 1. 基础配置

```typescript
import { AIManager, createAIConfig } from '@linch-kit/ai';

const config = createAIConfig({
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      models: ['gpt-4', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4'
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      models: ['claude-3-sonnet', 'claude-3-haiku'],
      defaultModel: 'claude-3-sonnet'
    }
  },
  
  routing: {
    defaultProvider: 'openai',
    costOptimization: true,
    fallbackProviders: ['claude']
  },
  
  security: {
    dataRetention: 'none',
    encryption: true,
    auditLog: true
  }
});

const ai = new AIManager(config);
await ai.initialize();
```

### 2. 自然语言查询

```typescript
import { NLQueryEngine } from '@linch-kit/ai';

const queryEngine = new NLQueryEngine({
  schema: userSchema,
  database: db
});

// 自然语言转 SQL
const result = await queryEngine.query(
  "找出上个月注册的活跃用户，按订单数量排序"
);

// 结果包含 SQL 查询和数据
console.log(result.sql);    // SELECT * FROM users WHERE...
console.log(result.data);   // 查询结果
console.log(result.explanation); // 查询解释
```

### 3. 智能代码生成

```typescript
import { CodeGenerator } from '@linch-kit/ai';

const generator = new CodeGenerator();

// 根据 Schema 生成 API
const api = await generator.generateAPI({
  schema: productSchema,
  framework: 'express',
  features: ['crud', 'validation', 'auth']
});

// 生成 React 组件
const component = await generator.generateComponent({
  schema: userSchema,
  type: 'form',
  framework: 'react'
});
```

## 📁 文档导航

| 文档 | 状态 | 描述 |
|------|------|------|
| [实现指南](./implementation-guide.md) | ✅ 完成 | AI集成架构和安全设计 |
| [集成示例](./integration-examples.md) | ✅ 完成 | AI功能使用示例 |

## API 参考

### AIManager

主要的 AI 管理器，负责提供商管理和请求路由。

```typescript
interface AIManagerConfig {
  providers: Record<string, ProviderConfig>;
  routing: RoutingConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

class AIManager {
  constructor(config: AIManagerConfig);
  
  // 初始化
  async initialize(): Promise<void>;
  
  // 发送请求
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  async complete(prompt: string, options?: CompletionOptions): Promise<string>;
  async embed(text: string, options?: EmbeddingOptions): Promise<number[]>;
  
  // 提供商管理
  addProvider(name: string, provider: AIProvider): void;
  removeProvider(name: string): void;
  getProvider(name: string): AIProvider;
  
  // 监控和统计
  getUsageStats(): UsageStats;
  getCostStats(): CostStats;
}
```

### NLQueryEngine

自然语言查询引擎。

```typescript
interface NLQueryOptions {
  schema: Schema;
  database: Database;
  maxResults?: number;
  explain?: boolean;
}

class NLQueryEngine {
  constructor(options: NLQueryOptions);
  
  // 自然语言查询
  async query(naturalLanguage: string): Promise<QueryResult>;
  
  // 查询建议
  async suggest(partialQuery: string): Promise<string[]>;
  
  // 查询优化
  async optimize(query: string): Promise<OptimizedQuery>;
}

interface QueryResult {
  sql: string;
  data: any[];
  explanation: string;
  confidence: number;
  executionTime: number;
}
```

### CodeGenerator

智能代码生成器。

```typescript
interface GenerationOptions {
  schema: Schema;
  framework: string;
  features?: string[];
  style?: 'functional' | 'class';
  typescript?: boolean;
}

class CodeGenerator {
  // API 生成
  async generateAPI(options: GenerationOptions): Promise<GeneratedCode>;
  
  // 组件生成
  async generateComponent(options: GenerationOptions): Promise<GeneratedCode>;
  
  // 测试生成
  async generateTests(code: string, framework: string): Promise<GeneratedCode>;
  
  // 文档生成
  async generateDocs(code: string, format: 'markdown' | 'html'): Promise<string>;
}

interface GeneratedCode {
  code: string;
  files: GeneratedFile[];
  dependencies: string[];
  instructions: string;
}
```

### AIWorkflow

AI 工作流引擎。

```typescript
interface WorkflowStep {
  id: string;
  type: 'ai' | 'code' | 'data' | 'decision';
  config: any;
  dependencies?: string[];
}

class AIWorkflow {
  constructor(steps: WorkflowStep[]);
  
  // 执行工作流
  async execute(input: any): Promise<WorkflowResult>;
  
  // 暂停/恢复
  async pause(): Promise<void>;
  async resume(): Promise<void>;
  
  // 监控
  getStatus(): WorkflowStatus;
  getProgress(): number;
}
```

### 工具函数

#### createAIConfig

```typescript
function createAIConfig(options: Partial<AIManagerConfig>): AIManagerConfig;
```

#### detectProvider

```typescript
function detectProvider(requirement: AIRequirement): string;
```

#### optimizeCost

```typescript
function optimizeCost(usage: UsageStats): CostOptimization;
```

## 提供商支持

### OpenAI

```typescript
const openaiProvider = {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  models: {
    'gpt-4': { maxTokens: 8192, costPer1K: 0.03 },
    'gpt-3.5-turbo': { maxTokens: 4096, costPer1K: 0.002 }
  },
  features: ['chat', 'completion', 'embedding', 'image']
};
```

### Claude (Anthropic)

```typescript
const claudeProvider = {
  apiKey: process.env.CLAUDE_API_KEY,
  baseURL: 'https://api.anthropic.com/v1',
  models: {
    'claude-3-sonnet': { maxTokens: 200000, costPer1K: 0.015 },
    'claude-3-haiku': { maxTokens: 200000, costPer1K: 0.0008 }
  },
  features: ['chat', 'completion']
};
```

### Gemini (Google)

```typescript
const geminiProvider = {
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1',
  models: {
    'gemini-pro': { maxTokens: 32768, costPer1K: 0.0005 },
    'gemini-pro-vision': { maxTokens: 16384, costPer1K: 0.002 }
  },
  features: ['chat', 'completion', 'vision']
};
```

## 智能路由

### 成本优化路由

```typescript
const routing = {
  strategy: 'cost-optimized',
  rules: [
    {
      condition: (request) => request.tokens < 1000,
      provider: 'claude-haiku'  // 小请求用便宜模型
    },
    {
      condition: (request) => request.complexity === 'high',
      provider: 'gpt-4'  // 复杂任务用强模型
    }
  ],
  fallback: 'gpt-3.5-turbo'
};
```

### 延迟优化路由

```typescript
const routing = {
  strategy: 'latency-optimized',
  rules: [
    {
      condition: (request) => request.realtime === true,
      provider: 'gpt-3.5-turbo'  // 实时请求用快模型
    }
  ],
  healthCheck: {
    interval: 30000,
    timeout: 5000
  }
};
```

## 安全和隐私

### 数据处理策略

```typescript
const security = {
  // 数据保留策略
  dataRetention: 'none',  // 'none' | 'session' | 'custom'
  
  // 数据加密
  encryption: {
    inTransit: true,
    atRest: true,
    algorithm: 'AES-256-GCM'
  },
  
  // 数据脱敏
  anonymization: {
    enabled: true,
    piiFields: ['email', 'phone', 'ssn'],
    strategy: 'hash'  // 'hash' | 'redact' | 'fake'
  },
  
  // 审计日志
  auditLog: {
    enabled: true,
    storage: 'database',  // 'database' | 'file' | 'external'
    retention: 90  // days
  }
};
```

### 权限控制

```typescript
const permissions = {
  // 基于角色的访问控制
  rbac: {
    'ai:query': ['user', 'admin'],
    'ai:generate': ['developer', 'admin'],
    'ai:workflow': ['admin'],
    'ai:admin': ['admin']
  },
  
  // API 限制
  rateLimit: {
    perUser: { requests: 1000, window: '1h' },
    perTenant: { requests: 10000, window: '1h' },
    perModel: { tokens: 1000000, window: '1d' }
  },
  
  // 内容过滤
  contentFilter: {
    enabled: true,
    categories: ['harmful', 'inappropriate', 'personal']
  }
};
```

## 监控和分析

### 使用统计

```typescript
interface UsageStats {
  requests: {
    total: number;
    byProvider: Record<string, number>;
    byModel: Record<string, number>;
  };
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  costs: {
    total: number;
    byProvider: Record<string, number>;
    trend: TrendData;
  };
  performance: {
    avgLatency: number;
    successRate: number;
    errorRate: number;
  };
}
```

### 质量监控

```typescript
const monitoring = {
  // 响应质量评估
  qualityMetrics: {
    relevance: { threshold: 0.8, enabled: true },
    accuracy: { threshold: 0.9, enabled: true },
    safety: { threshold: 0.95, enabled: true }
  },
  
  // 自动化测试
  testing: {
    regression: { enabled: true, schedule: 'daily' },
    benchmark: { enabled: true, datasets: ['custom', 'standard'] }
  },
  
  // 告警规则
  alerts: [
    { metric: 'error_rate', threshold: 0.05, action: 'notify' },
    { metric: 'cost_spike', threshold: 1.5, action: 'throttle' },
    { metric: 'latency_p99', threshold: 10000, action: 'failover' }
  ]
};
```

## 最佳实践

1. **成本控制**: 使用智能路由和使用量监控
2. **数据安全**: 启用加密和数据脱敏
3. **性能优化**: 合理使用缓存和批量处理
4. **错误处理**: 实现重试机制和优雅降级
5. **监控告警**: 设置全面的监控和告警体系

## License

MIT