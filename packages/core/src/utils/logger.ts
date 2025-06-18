/**
 * @ai-context 结构化日志系统
 * @ai-purpose 提供便于 AI 分析的日志格式和功能
 * @ai-structured 使用 JSON 格式，便于解析和分析
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * @ai-interface 日志条目接口
 * @ai-purpose 定义标准的日志条目结构
 */
export interface LogEntry {
  /** @ai-field 日志级别 */
  level: LogLevel
  
  /** @ai-field 日志消息 */
  message: string
  
  /** @ai-field 上下文数据 */
  context?: Record<string, any>
  
  /** @ai-field 时间戳 */
  timestamp: string
  
  /** @ai-field 日志来源 */
  source: string
  
  /** @ai-field 错误堆栈 (仅错误级别) */
  stack?: string
}

/**
 * @ai-class 结构化日志记录器
 * @ai-purpose 提供便于 AI 分析的日志记录功能
 * @ai-structured 所有日志都是结构化的 JSON 格式
 */
export class Logger {
  private source: string
  private minLevel: LogLevel

  /**
   * @ai-constructor 创建日志记录器
   * @ai-parameter source: string - 日志来源标识
   * @ai-parameter minLevel?: LogLevel - 最小日志级别
   */
  constructor(source: string = 'linch-kit', minLevel: LogLevel = 'info') {
    this.source = source
    this.minLevel = minLevel
  }

  /**
   * @ai-method 记录调试级别日志
   * @ai-purpose 记录详细的调试信息
   * @ai-parameter message: string - 日志消息
   * @ai-parameter context?: Record<string, any> - 上下文数据
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  /**
   * @ai-method 记录信息级别日志
   * @ai-purpose 记录一般信息
   * @ai-parameter message: string - 日志消息
   * @ai-parameter context?: Record<string, any> - 上下文数据
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  /**
   * @ai-method 记录警告级别日志
   * @ai-purpose 记录警告信息
   * @ai-parameter message: string - 日志消息
   * @ai-parameter context?: Record<string, any> - 上下文数据
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  /**
   * @ai-method 记录错误级别日志
   * @ai-purpose 记录错误信息
   * @ai-parameter message: string - 日志消息
   * @ai-parameter context?: Record<string, any> - 上下文数据
   * @ai-parameter error?: Error - 错误对象
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    const logContext = { ...context }
    if (error) {
      logContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }
    this.log('error', message, logContext, error?.stack)
  }

  /**
   * @ai-method 核心日志记录方法
   * @ai-purpose 执行实际的日志记录
   * @ai-parameter level: LogLevel - 日志级别
   * @ai-parameter message: string - 日志消息
   * @ai-parameter context?: Record<string, any> - 上下文数据
   * @ai-parameter stack?: string - 错误堆栈
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, stack?: string): void {
    // AI: 检查日志级别
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      source: this.source,
      stack
    }

    // AI: 输出到控制台
    const output = JSON.stringify(entry)
    
    switch (level) {
      case 'debug':
      case 'info':
        console.log(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'error':
        console.error(output)
        break
    }
  }

  /**
   * @ai-method 检查是否应该记录日志
   * @ai-purpose 根据最小日志级别过滤日志
   * @ai-parameter level: LogLevel - 要检查的日志级别
   * @ai-return boolean - 是否应该记录
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    
    return levels[level] >= levels[this.minLevel]
  }

  /**
   * @ai-method 设置最小日志级别
   * @ai-purpose 动态调整日志级别
   * @ai-parameter level: LogLevel - 新的最小日志级别
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * @ai-method 创建子日志记录器
   * @ai-purpose 为特定模块创建专用的日志记录器
   * @ai-parameter subSource: string - 子模块名称
   * @ai-return Logger - 新的日志记录器实例
   */
  child(subSource: string): Logger {
    return new Logger(`${this.source}:${subSource}`, this.minLevel)
  }
}

/**
 * @ai-constant 默认日志记录器
 * @ai-purpose 提供全局可用的日志记录器
 */
export const logger = new Logger('linch-kit')

/**
 * @ai-function 创建日志记录器
 * @ai-purpose 便捷函数，创建指定来源的日志记录器
 * @ai-parameter source: string - 日志来源
 * @ai-parameter minLevel?: LogLevel - 最小日志级别
 * @ai-return Logger - 日志记录器实例
 */
export function createLogger(source: string, minLevel?: LogLevel): Logger {
  return new Logger(source, minLevel)
}
