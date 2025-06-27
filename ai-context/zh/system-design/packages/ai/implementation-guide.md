# @linch-kit/ai 实现指南

## 概述

@linch-kit/ai 是 LinchKit 的 AI 集成包，提供多提供商 AI 服务、智能代码生成、自然语言查询等企业级 AI 功能。采用插件化架构，支持多种 AI 提供商，具备成本优化、安全隐私保护等企业级特性。

## 核心架构

### 1. 项目结构

```
src/
├── core/                # 核心组件
│   ├── AIManager.ts     # AI 管理器
│   ├── Router.ts        # 智能路由
│   ├── Cache.ts         # 智能缓存
│   └── Security.ts      # 安全组件
├── providers/           # AI 提供商
│   ├── base/            # 基础抽象
│   ├── openai/          # OpenAI 集成
│   ├── claude/          # Claude 集成
│   ├── gemini/          # Gemini 集成
│   └── azure/           # Azure OpenAI 集成
├── engines/             # AI 引擎
│   ├── NLQueryEngine.ts # 自然语言查询
│   ├── CodeGenerator.ts # 代码生成
│   ├── DataAnalyzer.ts  # 数据分析
│   └── WorkflowEngine.ts# 工作流引擎
├── utils/               # 工具函数
│   ├── tokenizer.ts     # 分词器
│   ├── validator.ts     # 验证器
│   └── optimizer.ts     # 优化器
├── types/               # 类型定义
└── index.ts             # 主导出
```

### 2. 核心导出

```typescript
// src/index.ts
export * from './core';
export * from './providers';
export * from './engines';
export * from './utils';
export * from './types';

// 主要导出
export {
  // 核心组件
  AIManager,
  createAIConfig,
  
  // AI 引擎
  NLQueryEngine,
  CodeGenerator,
  DataAnalyzer,
  AIWorkflow,
  
  // 提供商
  OpenAIProvider,
  ClaudeProvider,
  GeminiProvider,
  
  // 工具函数
  detectProvider,
  optimizeCost,
  tokenCount,
  
  // 类型
  AIManagerConfig,
  ProviderConfig,
  QueryResult
} from './main';
```

## 核心组件实现

### 1. AI 管理器

```typescript
// src/core/AIManager.ts
import { EventEmitter } from 'events';
import { core } from '@linch-kit/core';
import { AIManagerConfig, AIProvider, Message, ChatResponse } from '../types';
import { Router } from './Router';
import { Cache } from './Cache';
import { Security } from './Security';

export class AIManager extends EventEmitter {
  private providers = new Map<string, AIProvider>();
  private router: Router;
  private cache: Cache;
  private security: Security;
  private initialized = false;
  
  constructor(private config: AIManagerConfig) {
    super();
    
    this.router = new Router(config.routing);
    this.cache = new Cache(config.cache);
    this.security = new Security(config.security);
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // 初始化提供商
    for (const [name, providerConfig] of Object.entries(this.config.providers)) {
      const provider = await this.createProvider(name, providerConfig);
      this.providers.set(name, provider);
    }
    
    // 初始化路由器
    await this.router.initialize(this.providers);
    
    // 初始化缓存
    await this.cache.initialize();
    
    // 初始化安全组件
    await this.security.initialize();
    
    this.initialized = true;
    this.emit('initialized');
    
    core.logger.info('AI Manager initialized', {
      providers: Array.from(this.providers.keys()),
      routing: this.config.routing.strategy
    });
  }
  
  async chat(
    messages: Message[], 
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    this.ensureInitialized();
    
    // 安全检查
    await this.security.validateRequest({ messages, options });
    
    // 生成缓存键
    const cacheKey = this.cache.generateKey('chat', { messages, options });
    
    // 尝试从缓存获取
    const cached = await this.cache.get(cacheKey);
    if (cached && !options.skipCache) {
      this.emit('cache:hit', { cacheKey });
      return cached;
    }
    
    // 选择提供商
    const provider = await this.router.selectProvider({
      type: 'chat',
      messages,
      options,
      usage: await this.getUsageStats()
    });
    
    const startTime = Date.now();
    
    try {
      // 发送请求
      const response = await provider.chat(messages, options);
      
      // 记录使用统计
      await this.recordUsage({
        provider: provider.name,
        type: 'chat',
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cost: response.usage.cost,
        latency: Date.now() - startTime
      });
      
      // 缓存响应
      if (options.cache !== false) {
        await this.cache.set(cacheKey, response, options.cacheTTL);
      }
      
      // 安全后处理
      await this.security.processResponse(response);
      
      this.emit('request:completed', {
        provider: provider.name,
        type: 'chat',
        latency: Date.now() - startTime
      });
      
      return response;
    } catch (error) {
      // 记录错误
      await this.recordError({
        provider: provider.name,
        type: 'chat',
        error: error.message,
        latency: Date.now() - startTime
      });
      
      // 尝试故障转移
      if (this.config.routing.fallbackEnabled && !options.noFallback) {
        return this.handleFallback(messages, options, error);
      }
      
      throw error;
    }
  }
  
  async complete(
    prompt: string, 
    options: CompletionOptions = {}
  ): Promise<string> {
    const messages = [{ role: 'user', content: prompt }];
    const response = await this.chat(messages, options);
    return response.content;
  }
  
  async embed(
    text: string, 
    options: EmbeddingOptions = {}
  ): Promise<number[]> {
    this.ensureInitialized();
    
    const provider = await this.router.selectProvider({
      type: 'embedding',
      text,
      options
    });
    
    return await provider.embed(text, options);
  }
  
  addProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider);
    this.router.addProvider(name, provider);
    
    this.emit('provider:added', { name });
  }
  
  removeProvider(name: string): void {
    this.providers.delete(name);
    this.router.removeProvider(name);
    
    this.emit('provider:removed', { name });
  }
  
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }
  
  async getUsageStats(): Promise<UsageStats> {
    const stats = await core.database.aggregate('ai_usage', [
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } },
          totalCost: { $sum: '$cost' },
          avgLatency: { $avg: '$latency' }
        }
      }
    ]);
    
    return stats[0] || {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0
    };
  }
  
  async getCostStats(): Promise<CostStats> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = await core.database.aggregate('ai_usage', [
      { $match: { timestamp: { $gte: last30Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          dailyCost: { $sum: '$cost' },
          dailyRequests: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return {
      daily: stats,
      total: stats.reduce((sum, day) => sum + day.dailyCost, 0),
      trend: this.calculateTrend(stats)
    };
  }
  
  private async createProvider(
    name: string, 
    config: ProviderConfig
  ): Promise<AIProvider> {
    const ProviderClass = await this.loadProviderClass(name);
    const provider = new ProviderClass(config);
    await provider.initialize();
    return provider;
  }
  
  private async loadProviderClass(name: string): Promise<any> {
    switch (name) {
      case 'openai':
        return (await import('../providers/openai')).OpenAIProvider;
      case 'claude':
        return (await import('../providers/claude')).ClaudeProvider;
      case 'gemini':
        return (await import('../providers/gemini')).GeminiProvider;
      case 'azure':
        return (await import('../providers/azure')).AzureProvider;
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }
  
  private async handleFallback(
    messages: Message[],
    options: ChatOptions,
    originalError: Error
  ): Promise<ChatResponse> {
    const fallbackProvider = await this.router.selectFallbackProvider();
    
    if (!fallbackProvider) {
      throw originalError;
    }
    
    core.logger.warn('Using fallback provider', {
      fallback: fallbackProvider.name,
      originalError: originalError.message
    });
    
    return await fallbackProvider.chat(messages, {
      ...options,
      noFallback: true
    });
  }
  
  private async recordUsage(usage: UsageRecord): Promise<void> {
    await core.database.create('ai_usage', {
      ...usage,
      timestamp: new Date(),
      userId: core.context.getCurrentUser()?.id,
      tenantId: core.context.getCurrentTenant()?.id
    });
  }
  
  private async recordError(error: ErrorRecord): Promise<void> {
    await core.database.create('ai_errors', {
      ...error,
      timestamp: new Date(),
      userId: core.context.getCurrentUser()?.id
    });
    
    this.emit('error', error);
  }
  
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AI Manager not initialized. Call initialize() first.');
    }
  }
  
  private calculateTrend(stats: any[]): 'up' | 'down' | 'stable' {
    if (stats.length < 2) return 'stable';
    
    const recent = stats.slice(-7);
    const previous = stats.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, day) => sum + day.dailyCost, 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + day.dailyCost, 0) / previous.length;
    
    const change = (recentAvg - previousAvg) / previousAvg;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }
}
```

### 2. 智能路由器

```typescript
// src/core/Router.ts
import { core } from '@linch-kit/core';
import { RoutingConfig, AIProvider, RoutingRequest } from '../types';

export class Router {
  private providers = new Map<string, AIProvider>();
  private healthScores = new Map<string, number>();
  private loadBalancer?: LoadBalancer;
  
  constructor(private config: RoutingConfig) {
    if (config.loadBalancing) {
      this.loadBalancer = new LoadBalancer(config.loadBalancing);
    }
  }
  
  async initialize(providers: Map<string, AIProvider>): Promise<void> {
    this.providers = providers;
    
    // 初始化健康检查
    if (this.config.healthCheck) {
      this.startHealthCheck();
    }
    
    // 初始化负载均衡器
    if (this.loadBalancer) {
      await this.loadBalancer.initialize(providers);
    }
  }
  
  async selectProvider(request: RoutingRequest): Promise<AIProvider> {
    const strategy = this.config.strategy || 'default';
    
    switch (strategy) {
      case 'cost-optimized':
        return this.selectByCost(request);
      case 'latency-optimized':
        return this.selectByLatency(request);
      case 'quality-optimized':
        return this.selectByQuality(request);
      case 'round-robin':
        return this.selectByRoundRobin(request);
      case 'weighted':
        return this.selectByWeight(request);
      default:
        return this.selectDefault(request);
    }
  }
  
  async selectFallbackProvider(): Promise<AIProvider | null> {
    const fallbackProviders = this.config.fallbackProviders || [];
    
    for (const providerName of fallbackProviders) {
      const provider = this.providers.get(providerName);
      if (provider && await this.isProviderHealthy(provider)) {
        return provider;
      }
    }
    
    return null;
  }
  
  private async selectByCost(request: RoutingRequest): Promise<AIProvider> {
    const candidates = await this.getAvailableProviders();
    const estimates = await Promise.all(
      candidates.map(async provider => ({
        provider,
        cost: await this.estimateCost(provider, request)
      }))
    );
    
    // 按成本排序，选择最便宜的
    estimates.sort((a, b) => a.cost - b.cost);
    
    return estimates[0].provider;
  }
  
  private async selectByLatency(request: RoutingRequest): Promise<AIProvider> {
    const candidates = await this.getAvailableProviders();
    const latencies = await this.getLatencyScores(candidates);
    
    // 选择延迟最低的
    let bestProvider = candidates[0];
    let bestLatency = latencies[0];
    
    for (let i = 1; i < candidates.length; i++) {
      if (latencies[i] < bestLatency) {
        bestLatency = latencies[i];
        bestProvider = candidates[i];
      }
    }
    
    return bestProvider;
  }
  
  private async selectByQuality(request: RoutingRequest): Promise<AIProvider> {
    const candidates = await this.getAvailableProviders();
    const qualityScores = await this.getQualityScores(candidates, request);
    
    // 选择质量分数最高的
    let bestProvider = candidates[0];
    let bestScore = qualityScores[0];
    
    for (let i = 1; i < candidates.length; i++) {
      if (qualityScores[i] > bestScore) {
        bestScore = qualityScores[i];
        bestProvider = candidates[i];
      }
    }
    
    return bestProvider;
  }
  
  private async selectByRoundRobin(request: RoutingRequest): Promise<AIProvider> {
    const candidates = await this.getAvailableProviders();
    
    if (this.loadBalancer) {
      return this.loadBalancer.getNext(candidates);
    }
    
    // 简单轮询实现
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }
  
  private async selectByWeight(request: RoutingRequest): Promise<AIProvider> {
    const candidates = await this.getAvailableProviders();
    const weights = this.config.weights || {};
    
    // 计算权重总和
    const totalWeight = candidates.reduce((sum, provider) => {
      return sum + (weights[provider.name] || 1);
    }, 0);
    
    // 随机选择
    let random = Math.random() * totalWeight;
    
    for (const provider of candidates) {
      const weight = weights[provider.name] || 1;
      random -= weight;
      
      if (random <= 0) {
        return provider;
      }
    }
    
    return candidates[0];
  }
  
  private async selectDefault(request: RoutingRequest): Promise<AIProvider> {
    // 应用自定义规则
    if (this.config.rules) {
      for (const rule of this.config.rules) {
        if (await rule.condition(request)) {
          const provider = this.providers.get(rule.provider);
          if (provider && await this.isProviderHealthy(provider)) {
            return provider;
          }
        }
      }
    }
    
    // 使用默认提供商
    const defaultProvider = this.providers.get(this.config.defaultProvider);
    if (defaultProvider && await this.isProviderHealthy(defaultProvider)) {
      return defaultProvider;
    }
    
    // 使用第一个可用的提供商
    const available = await this.getAvailableProviders();
    if (available.length === 0) {
      throw new Error('No available AI providers');
    }
    
    return available[0];
  }
  
  private async getAvailableProviders(): Promise<AIProvider[]> {
    const providers = Array.from(this.providers.values());
    const available = [];
    
    for (const provider of providers) {
      if (await this.isProviderHealthy(provider)) {
        available.push(provider);
      }
    }
    
    return available;
  }
  
  private async isProviderHealthy(provider: AIProvider): Promise<boolean> {
    const score = this.healthScores.get(provider.name);
    return score === undefined || score > 0.5;
  }
  
  private async estimateCost(
    provider: AIProvider, 
    request: RoutingRequest
  ): Promise<number> {
    const tokenCount = await this.estimateTokens(request);
    const model = request.options?.model || provider.defaultModel;
    const pricing = provider.getPricing(model);
    
    return (tokenCount / 1000) * pricing.costPer1K;
  }
  
  private async estimateTokens(request: RoutingRequest): Promise<number> {
    if (request.type === 'chat') {
      return request.messages.reduce((total, message) => {
        return total + this.countTokens(message.content);
      }, 0);
    }
    
    if (request.text) {
      return this.countTokens(request.text);
    }
    
    return 1000; // 默认估计
  }
  
  private countTokens(text: string): number {
    // 简单的 token 计数，实际应该使用更精确的方法
    return Math.ceil(text.length / 4);
  }
  
  private async getLatencyScores(providers: AIProvider[]): Promise<number[]> {
    return Promise.all(
      providers.map(async provider => {
        const stats = await this.getProviderStats(provider.name);
        return stats.avgLatency || 1000;
      })
    );
  }
  
  private async getQualityScores(
    providers: AIProvider[], 
    request: RoutingRequest
  ): Promise<number[]> {
    return Promise.all(
      providers.map(async provider => {
        const stats = await this.getProviderStats(provider.name);
        
        // 基于成功率、用户反馈等计算质量分数
        const successRate = stats.successRate || 0.9;
        const userRating = stats.avgUserRating || 0.8;
        
        return (successRate * 0.6 + userRating * 0.4);
      })
    );
  }
  
  private async getProviderStats(providerName: string): Promise<any> {
    const stats = await core.database.aggregate('ai_usage', [
      { $match: { provider: providerName } },
      {
        $group: {
          _id: null,
          avgLatency: { $avg: '$latency' },
          successRate: { $avg: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          avgUserRating: { $avg: '$userRating' }
        }
      }
    ]);
    
    return stats[0] || {};
  }
  
  private startHealthCheck(): void {
    const interval = this.config.healthCheck?.interval || 30000;
    
    setInterval(async () => {
      for (const [name, provider] of this.providers) {
        try {
          const startTime = Date.now();
          await provider.healthCheck();
          const latency = Date.now() - startTime;
          
          // 基于延迟计算健康分数
          const score = Math.max(0, 1 - (latency / 5000));
          this.healthScores.set(name, score);
        } catch (error) {
          this.healthScores.set(name, 0);
          
          core.logger.warn('Provider health check failed', {
            provider: name,
            error: error.message
          });
        }
      }
    }, interval);
  }
  
  addProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider);
    this.healthScores.set(name, 1.0);
  }
  
  removeProvider(name: string): void {
    this.providers.delete(name);
    this.healthScores.delete(name);
  }
}
```

### 3. 提供商基类

```typescript
// src/providers/base/AIProvider.ts
import { EventEmitter } from 'events';
import { core } from '@linch-kit/core';
import { 
  ProviderConfig, 
  Message, 
  ChatResponse, 
  CompletionOptions,
  EmbeddingOptions 
} from '../../types';

export abstract class AIProvider extends EventEmitter {
  abstract name: string;
  abstract defaultModel: string;
  
  protected config: ProviderConfig;
  protected initialized = false;
  
  constructor(config: ProviderConfig) {
    super();
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.validateConfig();
    await this.setupClient();
    
    this.initialized = true;
    this.emit('initialized');
  }
  
  abstract async chat(
    messages: Message[], 
    options?: ChatOptions
  ): Promise<ChatResponse>;
  
  abstract async complete(
    prompt: string, 
    options?: CompletionOptions
  ): Promise<string>;
  
  abstract async embed(
    text: string, 
    options?: EmbeddingOptions
  ): Promise<number[]>;
  
  abstract async healthCheck(): Promise<void>;
  
  abstract getPricing(model: string): { costPer1K: number };
  
  protected abstract validateConfig(): Promise<void>;
  protected abstract setupClient(): Promise<void>;
  
  protected async makeRequest(
    endpoint: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...options.headers
        },
        body: JSON.stringify(data),
        signal: options.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // 记录成功请求
      this.recordMetrics({
        endpoint,
        status: 'success',
        latency: Date.now() - startTime,
        tokens: result.usage?.total_tokens || 0
      });
      
      return result;
    } catch (error) {
      // 记录失败请求
      this.recordMetrics({
        endpoint,
        status: 'error',
        latency: Date.now() - startTime,
        error: error.message
      });
      
      throw error;
    }
  }
  
  protected recordMetrics(metrics: any): void {
    this.emit('metrics', {
      provider: this.name,
      timestamp: new Date(),
      ...metrics
    });
  }
  
  protected handleRateLimit(error: any): void {
    if (error.status === 429) {
      const retryAfter = error.headers?.['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
      
      this.emit('rate-limited', {
        provider: this.name,
        waitTime,
        timestamp: new Date()
      });
      
      throw new Error(`Rate limited. Retry after ${waitTime}ms`);
    }
  }
  
  protected async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // 指数退避
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        core.logger.warn('Retrying request', {
          provider: this.name,
          attempt,
          error: error.message
        });
      }
    }
    
    throw lastError;
  }
}
```

### 4. OpenAI 提供商实现

```typescript
// src/providers/openai/OpenAIProvider.ts
import { AIProvider } from '../base/AIProvider';
import { Message, ChatResponse, ChatOptions } from '../../types';

export class OpenAIProvider extends AIProvider {
  name = 'openai';
  defaultModel = 'gpt-4';
  
  private client: any;
  
  protected async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    if (!this.config.baseURL) {
      this.config.baseURL = 'https://api.openai.com/v1';
    }
  }
  
  protected async setupClient(): Promise<void> {
    // 设置 OpenAI 客户端
    this.client = {
      baseURL: this.config.baseURL,
      apiKey: this.config.apiKey,
      defaultHeaders: {
        'User-Agent': 'LinchKit-AI/1.0.0'
      }
    };
  }
  
  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const model = options.model || this.defaultModel;
    
    const requestData = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: options.maxTokens,
      temperature: options.temperature || 0.7,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop,
      stream: options.stream || false
    };
    
    // 移除 undefined 值
    Object.keys(requestData).forEach(key => {
      if (requestData[key] === undefined) {
        delete requestData[key];
      }
    });
    
    const response = await this.retry(async () => {
      return await this.makeRequest('/chat/completions', requestData, {
        signal: options.signal
      });
    });
    
    return {
      id: response.id,
      content: response.choices[0].message.content,
      role: response.choices[0].message.role,
      model: response.model,
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        cost: this.calculateCost(model, response.usage)
      },
      finishReason: response.choices[0].finish_reason,
      timestamp: new Date()
    };
  }
  
  async complete(prompt: string, options: CompletionOptions = {}): Promise<string> {
    const model = options.model || 'gpt-3.5-turbo-instruct';
    
    const requestData = {
      model,
      prompt,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stop
    };
    
    const response = await this.retry(async () => {
      return await this.makeRequest('/completions', requestData);
    });
    
    return response.choices[0].text;
  }
  
  async embed(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
    const model = options.model || 'text-embedding-ada-002';
    
    const requestData = {
      model,
      input: text,
      encoding_format: 'float'
    };
    
    const response = await this.retry(async () => {
      return await this.makeRequest('/embeddings', requestData);
    });
    
    return response.data[0].embedding;
  }
  
  async healthCheck(): Promise<void> {
    try {
      await this.makeRequest('/models', {}, { method: 'GET' });
    } catch (error) {
      throw new Error(`OpenAI health check failed: ${error.message}`);
    }
  }
  
  getPricing(model: string): { costPer1K: number } {
    const pricing = {
      'gpt-4': { costPer1K: 0.03 },
      'gpt-4-32k': { costPer1K: 0.06 },
      'gpt-3.5-turbo': { costPer1K: 0.002 },
      'gpt-3.5-turbo-16k': { costPer1K: 0.004 },
      'text-embedding-ada-002': { costPer1K: 0.0001 }
    };
    
    return pricing[model] || { costPer1K: 0.002 };
  }
  
  private calculateCost(model: string, usage: any): number {
    const pricing = this.getPricing(model);
    return (usage.total_tokens / 1000) * pricing.costPer1K;
  }
}
```

### 5. 自然语言查询引擎

```typescript
// src/engines/NLQueryEngine.ts
import { core } from '@linch-kit/core';
import { schema } from '@linch-kit/schema';
import { crud } from '@linch-kit/crud';
import { AIManager } from '../core/AIManager';
import { NLQueryOptions, QueryResult } from '../types';

export class NLQueryEngine {
  private ai: AIManager;
  private schema: any;
  private database: any;
  private queryCache = new Map<string, QueryResult>();
  
  constructor(private options: NLQueryOptions) {
    this.ai = options.aiManager || core.ai;
    this.schema = options.schema;
    this.database = options.database;
  }
  
  async query(naturalLanguage: string): Promise<QueryResult> {
    // 生成缓存键
    const cacheKey = this.generateCacheKey(naturalLanguage);
    
    // 检查缓存
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      return { ...cached, fromCache: true };
    }
    
    const startTime = Date.now();
    
    try {
      // 1. 分析自然语言意图
      const intent = await this.analyzeIntent(naturalLanguage);
      
      // 2. 生成 SQL 查询
      const sqlQuery = await this.generateSQL(naturalLanguage, intent);
      
      // 3. 验证和优化查询
      const optimizedQuery = await this.optimizeQuery(sqlQuery);
      
      // 4. 执行查询
      const data = await this.executeQuery(optimizedQuery);
      
      // 5. 生成解释
      const explanation = await this.generateExplanation(
        naturalLanguage, 
        optimizedQuery, 
        data
      );
      
      const result: QueryResult = {
        sql: optimizedQuery,
        data,
        explanation,
        confidence: intent.confidence,
        executionTime: Date.now() - startTime,
        intent,
        fromCache: false
      };
      
      // 缓存结果
      this.queryCache.set(cacheKey, result);
      
      // 记录查询统计
      await this.recordQueryStats(result);
      
      return result;
    } catch (error) {
      core.logger.error('NL Query failed', {
        query: naturalLanguage,
        error: error.message
      });
      
      throw new Error(`查询失败: ${error.message}`);
    }
  }
  
  async suggest(partialQuery: string): Promise<string[]> {
    const prompt = `
基于以下数据库 Schema 和部分查询，提供查询建议：

Schema: ${JSON.stringify(this.schema, null, 2)}

部分查询: "${partialQuery}"

请提供5个可能的完整查询建议，每行一个建议。
`;
    
    const response = await this.ai.complete(prompt, {
      maxTokens: 500,
      temperature: 0.3
    });
    
    return response.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
  }
  
  async optimize(query: string): Promise<OptimizedQuery> {
    const prompt = `
优化以下 SQL 查询：

原查询: ${query}

Schema: ${JSON.stringify(this.schema, null, 2)}

请提供：
1. 优化后的查询
2. 优化说明
3. 预期性能提升
`;
    
    const response = await this.ai.complete(prompt, {
      maxTokens: 1000,
      temperature: 0.2
    });
    
    // 解析响应
    const lines = response.split('\n');
    const optimizedQuery = lines.find(line => line.includes('SELECT'))?.trim() || query;
    const explanation = lines.slice(1).join('\n').trim();
    
    return {
      original: query,
      optimized: optimizedQuery,
      explanation,
      estimatedImprovement: this.estimateImprovement(query, optimizedQuery)
    };
  }
  
  private async analyzeIntent(query: string): Promise<QueryIntent> {
    const prompt = `
分析以下自然语言查询的意图：

查询: "${query}"

Schema: ${JSON.stringify(this.schema, null, 2)}

请返回JSON格式的分析结果：
{
  "type": "select|insert|update|delete|aggregate",
  "tables": ["table1", "table2"],
  "columns": ["col1", "col2"],
  "conditions": [{"column": "col", "operator": "=", "value": "val"}],
  "aggregations": ["count", "sum", "avg"],
  "orderBy": [{"column": "col", "direction": "asc|desc"}],
  "groupBy": ["col1"],
  "limit": 10,
  "confidence": 0.95
}
`;
    
    const response = await this.ai.complete(prompt, {
      maxTokens: 800,
      temperature: 0.1
    });
    
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        type: 'select',
        tables: [],
        columns: [],
        conditions: [],
        confidence: 0.5
      };
    }
  }
  
  private async generateSQL(query: string, intent: QueryIntent): Promise<string> {
    const prompt = `
根据自然语言查询和意图分析生成 SQL：

查询: "${query}"
意图: ${JSON.stringify(intent, null, 2)}
Schema: ${JSON.stringify(this.schema, null, 2)}

生成高质量的 SQL 查询，确保：
1. 语法正确
2. 性能优化
3. 安全性（防止注入）
4. 符合查询意图

只返回 SQL 语句：
`;
    
    const response = await this.ai.complete(prompt, {
      maxTokens: 1000,
      temperature: 0.1
    });
    
    // 清理响应，提取 SQL
    const sql = response
      .replace(/```sql/g, '')
      .replace(/```/g, '')
      .trim();
    
    return sql;
  }
  
  private async optimizeQuery(sql: string): Promise<string> {
    // 基本的 SQL 优化
    let optimized = sql;
    
    // 添加适当的索引提示
    if (this.options.addIndexHints) {
      optimized = this.addIndexHints(optimized);
    }
    
    // 限制结果数量
    if (!optimized.toLowerCase().includes('limit') && this.options.maxResults) {
      optimized += ` LIMIT ${this.options.maxResults}`;
    }
    
    return optimized;
  }
  
  private async executeQuery(sql: string): Promise<any[]> {
    // 验证查询安全性
    await this.validateQuerySafety(sql);
    
    // 执行查询
    const startTime = Date.now();
    const result = await this.database.query(sql);
    const executionTime = Date.now() - startTime;
    
    // 记录查询性能
    core.logger.info('Query executed', {
      sql: sql.substring(0, 200),
      executionTime,
      resultCount: result.length
    });
    
    return result;
  }
  
  private async generateExplanation(
    query: string,
    sql: string,
    data: any[]
  ): Promise<string> {
    const prompt = `
为以下查询生成用户友好的解释：

用户查询: "${query}"
生成的SQL: ${sql}
结果数量: ${data.length}

生成简洁的中文解释，说明：
1. 查询做了什么
2. 返回了什么数据
3. 结果的意义

解释:
`;
    
    const response = await this.ai.complete(prompt, {
      maxTokens: 300,
      temperature: 0.3
    });
    
    return response.trim();
  }
  
  private async validateQuerySafety(sql: string): Promise<void> {
    // 检查危险操作
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DELETE\s+FROM.*WHERE\s*$/i,
      /UPDATE.*SET.*WHERE\s*$/i,
      /TRUNCATE/i,
      /ALTER\s+TABLE/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        throw new Error('查询包含危险操作，已被拒绝');
      }
    }
    
    // 检查查询复杂度
    const complexity = this.calculateQueryComplexity(sql);
    if (complexity > 100) {
      throw new Error('查询过于复杂，可能影响性能');
    }
  }
  
  private calculateQueryComplexity(sql: string): number {
    let complexity = 0;
    
    // JOIN 复杂度
    const joinMatches = sql.match(/JOIN/gi);
    complexity += (joinMatches?.length || 0) * 10;
    
    // 子查询复杂度
    const subqueryMatches = sql.match(/\(/g);
    complexity += (subqueryMatches?.length || 0) * 15;
    
    // WHERE 条件复杂度
    const whereMatches = sql.match(/WHERE|AND|OR/gi);
    complexity += (whereMatches?.length || 0) * 5;
    
    return complexity;
  }
  
  private addIndexHints(sql: string): string {
    // 基于 Schema 添加索引提示
    // 这里简化实现，实际应该更智能
    return sql;
  }
  
  private estimateImprovement(original: string, optimized: string): number {
    // 简单的性能提升估计
    const originalComplexity = this.calculateQueryComplexity(original);
    const optimizedComplexity = this.calculateQueryComplexity(optimized);
    
    return Math.max(0, (originalComplexity - optimizedComplexity) / originalComplexity);
  }
  
  private generateCacheKey(query: string): string {
    const schemaHash = ctx.services.core.utils.hash(JSON.stringify(this.schema));
    const queryHash = ctx.services.core.utils.hash(query.toLowerCase().trim());
    return `${schemaHash}:${queryHash}`;
  }
  
  private async recordQueryStats(result: QueryResult): Promise<void> {
    await core.database.create('nl_query_stats', {
      query: result.intent,
      sql: result.sql,
      confidence: result.confidence,
      executionTime: result.executionTime,
      resultCount: result.data.length,
      timestamp: new Date(),
      userId: core.context.getCurrentUser()?.id
    });
  }
}
```

## 安全和隐私实现

### 1. 安全组件

```typescript
// src/core/Security.ts
import { createHash, createCipher, createDecipher } from 'crypto';
import { core } from '@linch-kit/core';
import { SecurityConfig } from '../types';

export class Security {
  private encryptionKey: string;
  private auditLog: AuditLogger;
  private contentFilter: ContentFilter;
  
  constructor(private config: SecurityConfig) {
    this.encryptionKey = config.encryptionKey || this.generateKey();
    this.auditLog = new AuditLogger(config.auditLog);
    this.contentFilter = new ContentFilter(config.contentFilter);
  }
  
  async initialize(): Promise<void> {
    await this.auditLog.initialize();
    await this.contentFilter.initialize();
  }
  
  async validateRequest(request: any): Promise<void> {
    // 内容过滤
    if (this.config.contentFilter?.enabled) {
      await this.contentFilter.validate(request);
    }
    
    // 权限检查
    await this.checkPermissions(request);
    
    // 速率限制检查
    await this.checkRateLimit(request);
    
    // 记录审计日志
    if (this.config.auditLog?.enabled) {
      await this.auditLog.logRequest(request);
    }
  }
  
  async processResponse(response: any): Promise<void> {
    // 内容后处理
    if (this.config.contentFilter?.enabled) {
      await this.contentFilter.processResponse(response);
    }
    
    // 数据脱敏
    if (this.config.anonymization?.enabled) {
      this.anonymizeResponse(response);
    }
    
    // 记录响应日志
    if (this.config.auditLog?.enabled) {
      await this.auditLog.logResponse(response);
    }
  }
  
  encryptData(data: string): string {
    if (!this.config.encryption?.enabled) {
      return data;
    }
    
    const cipher = createCipher('aes-256-gcm', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }
  
  decryptData(encryptedData: string): string {
    if (!this.config.encryption?.enabled) {
      return encryptedData;
    }
    
    const decipher = createDecipher('aes-256-gcm', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  hashPII(data: string): string {
    return createHash('sha256').update(data + this.encryptionKey).digest('hex');
  }
  
  private async checkPermissions(request: any): Promise<void> {
    const user = core.context.getCurrentUser();
    if (!user) {
      throw new Error('未认证的请求');
    }
    
    const requiredPermission = this.getRequiredPermission(request);
    if (!user.permissions.includes(requiredPermission)) {
      throw new Error(`缺少权限: ${requiredPermission}`);
    }
  }
  
  private async checkRateLimit(request: any): Promise<void> {
    const user = core.context.getCurrentUser();
    const key = `rate_limit:${user?.id || 'anonymous'}`;
    
    const current = await core.cache.get(key);
    const limit = this.config.rateLimit?.perUser?.requests || 1000;
    const window = this.config.rateLimit?.perUser?.window || '1h';
    
    if (current && current >= limit) {
      throw new Error('请求频率超限');
    }
    
    await ctx.services.core.cache.increment(key, { ttl: this.parseTimeWindow(window) });
  }
  
  private getRequiredPermission(request: any): string {
    if (request.type === 'query') return 'ai:query';
    if (request.type === 'generate') return 'ai:generate';
    if (request.type === 'workflow') return 'ai:workflow';
    return 'ai:basic';
  }
  
  private parseTimeWindow(window: string): number {
    const match = window.match(/(\d+)([hmsd])/);
    if (!match) return 3600000; // 默认1小时
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 3600000;
    }
  }
  
  private anonymizeResponse(response: any): void {
    const piiFields = this.config.anonymization?.piiFields || [];
    const strategy = this.config.anonymization?.strategy || 'hash';
    
    const anonymize = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;
      
      for (const [key, value] of Object.entries(obj)) {
        if (piiFields.includes(key) && typeof value === 'string') {
          switch (strategy) {
            case 'hash':
              obj[key] = this.hashPII(value);
              break;
            case 'redact':
              obj[key] = '*'.repeat(value.length);
              break;
            case 'fake':
              obj[key] = this.generateFakeData(key, value);
              break;
          }
        } else if (typeof value === 'object') {
          anonymize(value);
        }
      }
    };
    
    anonymize(response);
  }
  
  private generateFakeData(field: string, original: string): string {
    // 简单的假数据生成
    switch (field) {
      case 'email':
        return 'user@example.com';
      case 'phone':
        return '+1-555-0123';
      case 'name':
        return 'John Doe';
      default:
        return 'REDACTED';
    }
  }
  
  private generateKey(): string {
    return createHash('sha256')
      .update(process.env.AI_ENCRYPTION_KEY || 'default-key')
      .digest('hex');
  }
}
```

这个实现指南提供了 @linch-kit/ai 包的完整架构和核心组件实现，涵盖了 AI 管理器、智能路由、提供商抽象、自然语言查询引擎、安全隐私保护等关键功能的详细实现。