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
| [依赖分析](./dependencies-analysis.md) | ✅ 完成 | 第三方库依赖和集成策略 |