/**
 * LinchKit AI Platform 核心常量定义
 * 集中管理所有硬编码值，便于维护和配置
 * 
 * @version 1.0.0
 */

/**
 * 超时配置常量 (毫秒)
 */
export const TIMEOUTS = {
  /** 默认超时时间 */
  DEFAULT: 30000,
  /** 数据库连接超时 */
  CONNECTION: 30000,
  /** 事务重试超时 */
  TRANSACTION_RETRY: 30000,
  /** AI Provider 调用超时 */
  AI_PROVIDER: 60000,
  /** 缓存有效期 */
  CACHE_TTL: 300000, // 5分钟
  /** 指标导出间隔 */
  METRICS_EXPORT_INTERVAL: 30000,
} as const

/**
 * 阈值和限制常量
 */
export const THRESHOLDS = {
  /** Neo4j 关系数量限制 */
  NEO4J_RELATIONS_LIMIT: 300000,
  /** 关系集合大小限制 */
  RELATIONSHIP_SET_LIMIT: 30000,
  /** AI 语义分析阈值 */
  SEMANTIC_AI: 10000,
  /** 规则引擎语义分析阈值 */
  SEMANTIC_RULES: 3000,
  /** 批处理大小 */
  BATCH_SIZE: 3000,
  /** 最大并发操作数 */
  MAX_CONCURRENT_OPS: 5,
  /** 性能警告阈值 */
  PERFORMANCE_WARNING_MS: 30000,
} as const

/**
 * 文件路径常量
 */
export const PATHS = {
  /** 工作流状态目录 */
  WORKFLOW_STATES: '.linchkit/workflow-states',
  /** 测试工作流状态目录 */
  TEST_WORKFLOW_STATES: '.linchkit/test-workflow-states',
  /** Graph 数据目录 */
  GRAPH_DATA: 'tools/ai-platform/graph-data',
  /** Neo4j 配置文件 */
  NEO4J_CONFIG: 'graph_db_connection.json',
  /** 环境变量文件 */
  ENV_FILE: '.env',
} as const

/**
 * AI Provider 配置
 */
export const AI_PROVIDERS = {
  /** 默认 Provider */
  DEFAULT: 'gemini-sdk',
  /** 支持的 Provider 列表 */
  SUPPORTED: ['gemini-sdk', 'claude-cli', 'openai', 'ollama'] as const,
  /** 默认模型配置 */
  DEFAULT_MODELS: {
    'gemini-sdk': 'gemini-1.5-flash',
    'claude-cli': 'claude-3-sonnet',
    'openai': 'gpt-4',
    'ollama': 'llama2',
  },
} as const

/**
 * 日志级别配置
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const

/**
 * 错误重试配置
 */
export const RETRY_CONFIG = {
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 重试延迟基数 (毫秒) */
  RETRY_DELAY_BASE: 1000,
  /** 重试延迟指数 */
  RETRY_DELAY_MULTIPLIER: 2,
  /** 是否启用降级 */
  ENABLE_FALLBACK: true,
} as const

/**
 * Neo4j 连接配置
 */
export const NEO4J_CONFIG = {
  /** 支持的协议 */
  SUPPORTED_PROTOCOLS: ['neo4j://', 'neo4j+s://', 'bolt://', 'bolt+s://'] as const,
  /** 默认数据库名 */
  DEFAULT_DATABASE: 'neo4j',
  /** 连接池大小 */
  MAX_CONNECTION_POOL_SIZE: 50,
} as const

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  /** 是否启用缓存 */
  ENABLED: true,
  /** 缓存键前缀 */
  KEY_PREFIX: 'linchkit:ai:',
  /** 缓存大小限制 */
  MAX_SIZE: 1000,
} as const

/**
 * 类型守卫
 */
export type Timeout = typeof TIMEOUTS[keyof typeof TIMEOUTS]
export type Threshold = typeof THRESHOLDS[keyof typeof THRESHOLDS]
export type Path = typeof PATHS[keyof typeof PATHS]
export type Provider = typeof AI_PROVIDERS.SUPPORTED[number]
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS]