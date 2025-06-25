# @linch-kit/ai 集成示例

## 基础集成

### 1. 快速开始

```typescript
// app.ts
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
    strategy: 'cost-optimized',
    fallbackProviders: ['claude']
  },
  
  security: {
    dataRetention: 'none',
    encryption: { enabled: true },
    auditLog: { enabled: true }
  }
});

const ai = new AIManager(config);
await ai.initialize();

// 基础聊天
const response = await ai.chat([
  { role: 'user', content: '你好，请介绍一下 LinchKit' }
]);

console.log(response.content);
```

### 2. Express 应用集成

```typescript
// server.ts
import express from 'express';
import { AIManager, NLQueryEngine } from '@linch-kit/ai';
import { auth } from '@linch-kit/auth';

const app = express();
app.use(express.json());

// 初始化 AI 管理器
const ai = new AIManager({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  }
});

await ai.initialize();

// AI 聊天端点
app.post('/api/ai/chat', auth.requireAuth(), async (req, res) => {
  try {
    const { messages } = req.body;
    
    const response = await ai.chat(messages, {
      maxTokens: 1000,
      temperature: 0.7
    });
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 自然语言查询端点
app.post('/api/ai/query', auth.requireAuth(), async (req, res) => {
  try {
    const { query } = req.body;
    
    const nlEngine = new NLQueryEngine({
      schema: req.user.tenant.schema,
      database: db
    });
    
    const result = await nlEngine.query(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 3. Next.js 应用集成

```typescript
// pages/api/ai/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { AIManager } from '@linch-kit/ai';
import { getServerSession } from 'next-auth';

const ai = new AIManager({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { messages } = req.body;
    
    const response = await ai.chat(messages, {
      userId: session.user.id,
      maxTokens: 1000
    });
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

```tsx
// components/ChatInterface.tsx
import { useState } from 'react';
import { Button, Input, Card } from '@linch-kit/ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const newMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });
      
      const data = await response.json();
      
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: data.content
      }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card title="AI 助手">
      <div className="space-y-4">
        <div className="h-64 overflow-y-auto space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-4'
                  : 'bg-gray-100 mr-4'
              }`}
            >
              <strong>{message.role === 'user' ? '您' : 'AI'}:</strong>
              <div className="mt-1">{message.content}</div>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={setInput}
            placeholder="输入消息..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            loading={loading}
            disabled={!input.trim()}
          >
            发送
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

## 高级功能集成

### 1. 自然语言查询集成

```typescript
// services/NLQueryService.ts
import { NLQueryEngine } from '@linch-kit/ai';
import { schema } from '@linch-kit/schema';

export class NLQueryService {
  private engine: NLQueryEngine;
  
  constructor(userSchema: any, database: any) {
    this.engine = new NLQueryEngine({
      schema: userSchema,
      database,
      maxResults: 100,
      explain: true
    });
  }
  
  async queryData(naturalLanguage: string, userId: string) {
    try {
      // 记录查询请求
      await this.logQuery(naturalLanguage, userId);
      
      // 执行查询
      const result = await this.engine.query(naturalLanguage);
      
      // 后处理结果
      const processedResult = await this.processResult(result, userId);
      
      return {
        success: true,
        data: processedResult.data,
        sql: processedResult.sql,
        explanation: processedResult.explanation,
        confidence: processedResult.confidence,
        executionTime: processedResult.executionTime
      };
    } catch (error) {
      await this.logError(naturalLanguage, userId, error.message);
      throw error;
    }
  }
  
  async getSuggestions(partialQuery: string) {
    return await this.engine.suggest(partialQuery);
  }
  
  async optimizeQuery(query: string) {
    return await this.engine.optimize(query);
  }
  
  private async processResult(result: any, userId: string) {
    // 应用数据权限过滤
    const filteredData = await this.applyDataPermissions(result.data, userId);
    
    // 脱敏敏感信息
    const sanitizedData = this.sanitizeSensitiveData(filteredData);
    
    return {
      ...result,
      data: sanitizedData
    };
  }
  
  private async applyDataPermissions(data: any[], userId: string) {
    // 基于用户权限过滤数据
    const user = await this.getUserPermissions(userId);
    
    if (user.role === 'admin') {
      return data; // 管理员看到所有数据
    }
    
    // 普通用户只能看到自己的数据或公开数据
    return data.filter(item => 
      item.userId === userId || item.isPublic === true
    );
  }
  
  private sanitizeSensitiveData(data: any[]) {
    const sensitiveFields = ['email', 'phone', 'ssn', 'creditCard'];
    
    return data.map(item => {
      const sanitized = { ...item };
      
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = this.maskSensitiveValue(sanitized[field]);
        }
      });
      
      return sanitized;
    });
  }
  
  private maskSensitiveValue(value: string): string {
    if (value.includes('@')) {
      // 邮箱脱敏
      const [name, domain] = value.split('@');
      return `${name.substring(0, 2)}***@${domain}`;
    }
    
    // 通用脱敏
    return value.substring(0, 2) + '*'.repeat(value.length - 2);
  }
}
```

```tsx
// components/NLQueryInterface.tsx
import { useState } from 'react';
import { Card, Input, Button, Table, Alert } from '@linch-kit/ui';

export function NLQueryInterface() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Query error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getSuggestions = async (partialQuery: string) => {
    if (partialQuery.length < 3) return;
    
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: partialQuery })
      });
      
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Suggestion error:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card title="自然语言查询">
        <div className="space-y-4">
          <div>
            <Input
              value={query}
              onChange={(value) => {
                setQuery(value);
                getSuggestions(value);
              }}
              placeholder="用自然语言描述您想查询的数据..."
              onKeyPress={(e) => e.key === 'Enter' && executeQuery()}
            />
            
            {suggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => setQuery(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Button
            onClick={executeQuery}
            loading={loading}
            disabled={!query.trim()}
          >
            查询
          </Button>
        </div>
      </Card>
      
      {result && (
        <div className="space-y-4">
          <Alert type="info">
            <strong>查询解释:</strong> {result.explanation}
            <br />
            <strong>置信度:</strong> {(result.confidence * 100).toFixed(1)}%
            <br />
            <strong>执行时间:</strong> {result.executionTime}ms
          </Alert>
          
          <Card title="查询结果">
            <Table
              data={result.data}
              columns={Object.keys(result.data[0] || {}).map(key => ({
                key,
                title: key,
                dataIndex: key
              }))}
            />
          </Card>
          
          <Card title="生成的 SQL">
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              {result.sql}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
}
```

### 2. 代码生成集成

```typescript
// services/CodeGenerationService.ts
import { CodeGenerator } from '@linch-kit/ai';
import { schema } from '@linch-kit/schema';

export class CodeGenerationService {
  private generator: CodeGenerator;
  
  constructor() {
    this.generator = new CodeGenerator({
      templates: {
        api: 'express-typescript',
        frontend: 'react-typescript',
        database: 'prisma'
      }
    });
  }
  
  async generateCRUDAPI(entitySchema: any, options: any = {}) {
    return await this.generator.generateAPI({
      schema: entitySchema,
      framework: 'express',
      features: ['crud', 'validation', 'auth', 'pagination'],
      style: 'functional',
      typescript: true,
      ...options
    });
  }
  
  async generateReactForm(entitySchema: any, options: any = {}) {
    return await this.generator.generateComponent({
      schema: entitySchema,
      type: 'form',
      framework: 'react',
      ui: '@linch-kit/ui',
      validation: 'zod',
      ...options
    });
  }
  
  async generateDataTable(entitySchema: any, options: any = {}) {
    return await this.generator.generateComponent({
      schema: entitySchema,
      type: 'table',
      framework: 'react',
      features: ['pagination', 'sorting', 'filtering'],
      ...options
    });
  }
  
  async generateTests(code: string, framework: string = 'jest') {
    return await this.generator.generateTests(code, framework);
  }
  
  async generateDocs(code: string, format: string = 'markdown') {
    return await this.generator.generateDocs(code, format);
  }
  
  async generateFullStack(entitySchema: any) {
    const results = await Promise.all([
      this.generateCRUDAPI(entitySchema),
      this.generateReactForm(entitySchema),
      this.generateDataTable(entitySchema)
    ]);
    
    return {
      backend: results[0],
      frontend: {
        form: results[1],
        table: results[2]
      }
    };
  }
}
```

```tsx
// components/CodeGenerator.tsx
import { useState } from 'react';
import { Card, Button, Select, Textarea, Tabs } from '@linch-kit/ui';

export function CodeGeneratorInterface() {
  const [schema, setSchema] = useState('');
  const [generationType, setGenerationType] = useState('api');
  const [framework, setFramework] = useState('express');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const generateCode = async () => {
    if (!schema.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: JSON.parse(schema),
          type: generationType,
          framework
        })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card title="AI 代码生成器">
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Schema (JSON)</label>
            <Textarea
              value={schema}
              onChange={setSchema}
              placeholder="输入您的数据 Schema..."
              rows={8}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">生成类型</label>
              <Select
                value={generationType}
                onChange={setGenerationType}
                options={[
                  { label: 'API 接口', value: 'api' },
                  { label: 'React 表单', value: 'form' },
                  { label: '数据表格', value: 'table' },
                  { label: '完整应用', value: 'fullstack' }
                ]}
              />
            </div>
            
            <div>
              <label className="block mb-2">框架</label>
              <Select
                value={framework}
                onChange={setFramework}
                options={[
                  { label: 'Express', value: 'express' },
                  { label: 'Next.js', value: 'nextjs' },
                  { label: 'React', value: 'react' },
                  { label: 'Vue', value: 'vue' }
                ]}
              />
            </div>
          </div>
          
          <Button
            onClick={generateCode}
            loading={loading}
            disabled={!schema.trim()}
          >
            生成代码
          </Button>
        </div>
      </Card>
      
      {result && (
        <Card title="生成结果">
          <Tabs
            items={[
              {
                key: 'code',
                label: '代码',
                children: (
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                    {result.code}
                  </pre>
                )
              },
              {
                key: 'files',
                label: '文件结构',
                children: (
                  <div className="space-y-2">
                    {result.files?.map((file, index) => (
                      <details key={index} className="border rounded p-2">
                        <summary className="cursor-pointer font-medium">
                          {file.path}
                        </summary>
                        <pre className="mt-2 bg-gray-50 p-2 rounded text-sm">
                          {file.content}
                        </pre>
                      </details>
                    ))}
                  </div>
                )
              },
              {
                key: 'instructions',
                label: '使用说明',
                children: (
                  <div className="prose">
                    <h3>安装依赖</h3>
                    <pre className="bg-gray-100 p-2 rounded">
                      {result.dependencies?.map(dep => `npm install ${dep}`).join('\n')}
                    </pre>
                    
                    <h3>使用说明</h3>
                    <div dangerouslySetInnerHTML={{ __html: result.instructions }} />
                  </div>
                )
              }
            ]}
          />
        </Card>
      )}
    </div>
  );
}
```

### 3. AI 工作流集成

```typescript
// services/AIWorkflowService.ts
import { AIWorkflow, WorkflowStep } from '@linch-kit/ai';

export class AIWorkflowService {
  private workflows = new Map<string, AIWorkflow>();
  
  async createWorkflow(name: string, steps: WorkflowStep[]) {
    const workflow = new AIWorkflow(steps);
    this.workflows.set(name, workflow);
    return workflow;
  }
  
  async executeWorkflow(name: string, input: any) {
    const workflow = this.workflows.get(name);
    if (!workflow) {
      throw new Error(`Workflow not found: ${name}`);
    }
    
    return await workflow.execute(input);
  }
  
  // 数据分析工作流
  async createDataAnalysisWorkflow() {
    const steps: WorkflowStep[] = [
      {
        id: 'data-collection',
        type: 'data',
        config: {
          source: 'database',
          query: 'SELECT * FROM analytics_data WHERE date >= ?'
        }
      },
      {
        id: 'data-cleaning',
        type: 'ai',
        config: {
          prompt: '清理和验证以下数据，移除异常值和空值',
          model: 'gpt-4'
        },
        dependencies: ['data-collection']
      },
      {
        id: 'trend-analysis',
        type: 'ai',
        config: {
          prompt: '分析数据趋势，识别关键模式和洞察',
          model: 'gpt-4'
        },
        dependencies: ['data-cleaning']
      },
      {
        id: 'report-generation',
        type: 'ai',
        config: {
          prompt: '基于分析结果生成专业的数据报告',
          model: 'gpt-4'
        },
        dependencies: ['trend-analysis']
      },
      {
        id: 'visualization',
        type: 'code',
        config: {
          script: 'generateCharts',
          outputFormat: 'png'
        },
        dependencies: ['trend-analysis']
      }
    ];
    
    return await this.createWorkflow('data-analysis', steps);
  }
  
  // 内容生成工作流
  async createContentGenerationWorkflow() {
    const steps: WorkflowStep[] = [
      {
        id: 'topic-research',
        type: 'ai',
        config: {
          prompt: '研究指定主题，收集相关信息和数据',
          model: 'gpt-4'
        }
      },
      {
        id: 'outline-creation',
        type: 'ai',
        config: {
          prompt: '基于研究结果创建内容大纲',
          model: 'gpt-4'
        },
        dependencies: ['topic-research']
      },
      {
        id: 'content-writing',
        type: 'ai',
        config: {
          prompt: '按照大纲撰写详细内容',
          model: 'gpt-4'
        },
        dependencies: ['outline-creation']
      },
      {
        id: 'content-review',
        type: 'ai',
        config: {
          prompt: '审查内容质量，检查语法和逻辑',
          model: 'claude-3-sonnet'
        },
        dependencies: ['content-writing']
      },
      {
        id: 'seo-optimization',
        type: 'ai',
        config: {
          prompt: '优化内容的 SEO，添加关键词和元标签',
          model: 'gpt-3.5-turbo'
        },
        dependencies: ['content-review']
      }
    ];
    
    return await this.createWorkflow('content-generation', steps);
  }
  
  // 客户服务工作流
  async createCustomerServiceWorkflow() {
    const steps: WorkflowStep[] = [
      {
        id: 'intent-analysis',
        type: 'ai',
        config: {
          prompt: '分析客户消息的意图和情感',
          model: 'gpt-3.5-turbo'
        }
      },
      {
        id: 'knowledge-search',
        type: 'data',
        config: {
          source: 'knowledge_base',
          searchType: 'semantic'
        },
        dependencies: ['intent-analysis']
      },
      {
        id: 'response-generation',
        type: 'ai',
        config: {
          prompt: '基于知识库信息生成专业的客户回复',
          model: 'gpt-4'
        },
        dependencies: ['knowledge-search']
      },
      {
        id: 'escalation-check',
        type: 'decision',
        config: {
          condition: 'confidence < 0.8 || sentiment === "angry"',
          trueAction: 'escalate-to-human',
          falseAction: 'send-response'
        },
        dependencies: ['response-generation']
      }
    ];
    
    return await this.createWorkflow('customer-service', steps);
  }
}
```

```tsx
// components/WorkflowBuilder.tsx
import { useState } from 'react';
import { Card, Button, Modal, Form, Select } from '@linch-kit/ui';

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  
  const executeWorkflow = async (workflowId: string, input: any) => {
    try {
      const response = await fetch('/api/ai/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, input })
      });
      
      const result = await response.json();
      setExecutionResult(result);
    } catch (error) {
      console.error('Workflow execution error:', error);
    }
  };
  
  const predefinedWorkflows = [
    {
      id: 'data-analysis',
      name: '数据分析',
      description: '自动数据收集、清理、分析和报告生成'
    },
    {
      id: 'content-generation',
      name: '内容生成',
      description: '研究、大纲、写作、审查、SEO优化的完整流程'
    },
    {
      id: 'customer-service',
      name: '客户服务',
      description: '智能客户咨询处理和响应生成'
    }
  ];
  
  return (
    <div className="space-y-6">
      <Card title="AI 工作流">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predefinedWorkflows.map(workflow => (
            <div
              key={workflow.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setSelectedWorkflow(workflow);
                setIsModalOpen(true);
              }}
            >
              <h3 className="font-semibold">{workflow.name}</h3>
              <p className="text-sm text-gray-600 mt-2">
                {workflow.description}
              </p>
            </div>
          ))}
        </div>
      </Card>
      
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`执行工作流: ${selectedWorkflow?.name}`}
      >
        {selectedWorkflow && (
          <WorkflowExecutionForm
            workflow={selectedWorkflow}
            onExecute={(input) => {
              executeWorkflow(selectedWorkflow.id, input);
              setIsModalOpen(false);
            }}
          />
        )}
      </Modal>
      
      {executionResult && (
        <Card title="执行结果">
          <WorkflowResult result={executionResult} />
        </Card>
      )}
    </div>
  );
}

function WorkflowExecutionForm({ workflow, onExecute }) {
  const [input, setInput] = useState({});
  
  const getInputFields = () => {
    switch (workflow.id) {
      case 'data-analysis':
        return [
          { name: 'startDate', label: '开始日期', type: 'date' },
          { name: 'endDate', label: '结束日期', type: 'date' },
          { name: 'dataSource', label: '数据源', type: 'select', options: ['sales', 'users', 'analytics'] }
        ];
      case 'content-generation':
        return [
          { name: 'topic', label: '主题', type: 'text' },
          { name: 'length', label: '长度', type: 'select', options: ['短', '中', '长'] },
          { name: 'tone', label: '语调', type: 'select', options: ['正式', '友好', '专业'] }
        ];
      case 'customer-service':
        return [
          { name: 'message', label: '客户消息', type: 'textarea' },
          { name: 'language', label: '语言', type: 'select', options: ['中文', '英文'] }
        ];
      default:
        return [];
    }
  };
  
  return (
    <Form onSubmit={() => onExecute(input)}>
      {getInputFields().map(field => (
        <Form.Item key={field.name} label={field.label}>
          {field.type === 'select' ? (
            <Select
              value={input[field.name]}
              onChange={(value) => setInput({ ...input, [field.name]: value })}
              options={field.options.map(opt => ({ label: opt, value: opt }))}
            />
          ) : (
            <input
              type={field.type}
              value={input[field.name] || ''}
              onChange={(e) => setInput({ ...input, [field.name]: e.target.value })}
              className="w-full p-2 border rounded"
            />
          )}
        </Form.Item>
      ))}
      
      <Button type="submit">执行工作流</Button>
    </Form>
  );
}

function WorkflowResult({ result }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <strong>状态:</strong> {result.status}
        </div>
        <div>
          <strong>执行时间:</strong> {result.executionTime}ms
        </div>
      </div>
      
      <div>
        <strong>步骤进度:</strong>
        <div className="mt-2 space-y-2">
          {result.steps?.map((step, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                step.status === 'completed' ? 'bg-green-500' :
                step.status === 'running' ? 'bg-blue-500' :
                step.status === 'failed' ? 'bg-red-500' :
                'bg-gray-300'
              }`} />
              <span>{step.name}</span>
              <span className="text-sm text-gray-500">({step.duration}ms)</span>
            </div>
          ))}
        </div>
      </div>
      
      {result.output && (
        <div>
          <strong>输出结果:</strong>
          <pre className="mt-2 bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(result.output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

## 成本优化集成

### 1. 智能成本控制

```typescript
// services/CostOptimizationService.ts
import { AIManager } from '@linch-kit/ai';

export class CostOptimizationService {
  private ai: AIManager;
  private budgetLimits = new Map<string, number>();
  private currentSpending = new Map<string, number>();
  
  constructor(ai: AIManager) {
    this.ai = ai;
    this.setupBudgetMonitoring();
  }
  
  setBudgetLimit(period: 'daily' | 'weekly' | 'monthly', amount: number) {
    this.budgetLimits.set(period, amount);
  }
  
  async optimizeRequest(request: any): Promise<any> {
    // 1. 选择最优模型
    const optimalModel = await this.selectOptimalModel(request);
    
    // 2. 优化请求参数
    const optimizedParams = this.optimizeParameters(request, optimalModel);
    
    // 3. 检查预算限制
    await this.checkBudgetLimit(optimizedParams);
    
    return {
      ...request,
      ...optimizedParams,
      model: optimalModel
    };
  }
  
  private async selectOptimalModel(request: any): Promise<string> {
    const complexity = this.analyzeComplexity(request);
    const urgency = request.priority || 'normal';
    const budget = await this.getRemainingBudget();
    
    if (complexity === 'low' && budget.ratio < 0.2) {
      return 'gpt-3.5-turbo'; // 便宜快速的模型
    }
    
    if (complexity === 'high' && urgency === 'high') {
      return 'gpt-4'; // 高质量模型
    }
    
    if (complexity === 'medium') {
      return budget.ratio > 0.5 ? 'gpt-4' : 'claude-3-haiku';
    }
    
    return 'gpt-3.5-turbo'; // 默认选择
  }
  
  private analyzeComplexity(request: any): 'low' | 'medium' | 'high' {
    const indicators = {
      messageLength: request.messages?.join('').length || 0,
      hasCodeGeneration: request.type === 'code-generation',
      hasComplexReasoning: request.requiresReasoning,
      multiStep: request.steps && request.steps.length > 1
    };
    
    let score = 0;
    
    if (indicators.messageLength > 2000) score += 2;
    if (indicators.hasCodeGeneration) score += 3;
    if (indicators.hasComplexReasoning) score += 2;
    if (indicators.multiStep) score += 1;
    
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
  
  private optimizeParameters(request: any, model: string): any {
    const optimized = { ...request };
    
    // 根据模型调整参数
    if (model.includes('3.5-turbo')) {
      optimized.maxTokens = Math.min(optimized.maxTokens || 1000, 4000);
      optimized.temperature = optimized.temperature || 0.7;
    } else if (model.includes('gpt-4')) {
      optimized.maxTokens = Math.min(optimized.maxTokens || 2000, 8000);
      optimized.temperature = optimized.temperature || 0.3;
    }
    
    return optimized;
  }
  
  private async checkBudgetLimit(request: any): Promise<void> {
    const estimatedCost = await this.estimateCost(request);
    const dailySpent = this.currentSpending.get('daily') || 0;
    const dailyLimit = this.budgetLimits.get('daily');
    
    if (dailyLimit && (dailySpent + estimatedCost) > dailyLimit) {
      throw new Error(`Request would exceed daily budget limit of $${dailyLimit}`);
    }
  }
  
  private async estimateCost(request: any): Promise<number> {
    const tokenCount = this.estimateTokens(request);
    const model = request.model || 'gpt-3.5-turbo';
    
    const pricing = {
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.002,
      'claude-3-sonnet': 0.015,
      'claude-3-haiku': 0.0008
    };
    
    return (tokenCount / 1000) * (pricing[model] || 0.002);
  }
  
  private estimateTokens(request: any): number {
    if (request.messages) {
      return request.messages.reduce((total, msg) => {
        return total + Math.ceil(msg.content.length / 4);
      }, 0);
    }
    
    if (request.prompt) {
      return Math.ceil(request.prompt.length / 4);
    }
    
    return 1000; // 默认估计
  }
  
  private async getRemainingBudget(): Promise<{ amount: number; ratio: number }> {
    const dailyLimit = this.budgetLimits.get('daily') || 100;
    const dailySpent = this.currentSpending.get('daily') || 0;
    const remaining = dailyLimit - dailySpent;
    
    return {
      amount: remaining,
      ratio: remaining / dailyLimit
    };
  }
  
  private setupBudgetMonitoring(): void {
    // 每小时重置预算计数器
    setInterval(() => {
      const now = new Date();
      
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.currentSpending.set('daily', 0);
      }
      
      if (now.getDay() === 0 && now.getHours() === 0) {
        this.currentSpending.set('weekly', 0);
      }
      
      if (now.getDate() === 1 && now.getHours() === 0) {
        this.currentSpending.set('monthly', 0);
      }
    }, 60000); // 每分钟检查一次
  }
  
  recordSpending(amount: number): void {
    const periods = ['daily', 'weekly', 'monthly'];
    
    periods.forEach(period => {
      const current = this.currentSpending.get(period) || 0;
      this.currentSpending.set(period, current + amount);
    });
  }
  
  async getCostReport(): Promise<any> {
    const stats = await this.ai.getCostStats();
    
    return {
      ...stats,
      budgets: {
        daily: {
          limit: this.budgetLimits.get('daily') || 0,
          spent: this.currentSpending.get('daily') || 0
        },
        weekly: {
          limit: this.budgetLimits.get('weekly') || 0,
          spent: this.currentSpending.get('weekly') || 0
        },
        monthly: {
          limit: this.budgetLimits.get('monthly') || 0,
          spent: this.currentSpending.get('monthly') || 0
        }
      },
      recommendations: await this.generateCostOptimizationRecommendations()
    };
  }
  
  private async generateCostOptimizationRecommendations(): Promise<string[]> {
    const usage = await this.ai.getUsageStats();
    const recommendations = [];
    
    // 分析使用模式
    if (usage.gpt4Ratio > 0.8) {
      recommendations.push('考虑将简单任务迁移到 GPT-3.5-turbo 以降低成本');
    }
    
    if (usage.avgTokensPerRequest > 2000) {
      recommendations.push('优化提示词长度，减少不必要的上下文');
    }
    
    if (usage.errorRate > 0.1) {
      recommendations.push('提高输入质量以减少重试成本');
    }
    
    return recommendations;
  }
}
```

这些集成示例展示了如何在实际项目中使用 @linch-kit/ai，涵盖了基础聊天、自然语言查询、代码生成、AI 工作流和成本优化等关键功能的完整实现。

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "trpc-impl-guide", "content": "\u521b\u5efa trpc \u5b9e\u73b0\u6307\u5357", "status": "completed", "priority": "high"}, {"id": "trpc-integration-examples", "content": "\u521b\u5efa trpc \u96c6\u6210\u793a\u4f8b", "status": "completed", "priority": "high"}, {"id": "ui-complete-docs", "content": "\u521b\u5efa ui \u5b8c\u6574\u6587\u6863 (API\u53c2\u8003+\u5b9e\u73b0\u6307\u5357+\u96c6\u6210\u793a\u4f8b)", "status": "completed", "priority": "high"}, {"id": "console-complete-docs", "content": "\u521b\u5efa console \u5b8c\u6574\u6587\u6863 (API\u53c2\u8003+\u5b9e\u73b0\u6307\u5357+\u96c6\u6210\u793a\u4f8b)", "status": "completed", "priority": "high"}, {"id": "ai-complete-docs", "content": "\u521b\u5efa ai \u5b8c\u6574\u6587\u6863 (API\u53c2\u8003+\u5b9e\u73b0\u6307\u5357+\u96c6\u6210\u793a\u4f8b)", "status": "completed", "priority": "high"}]