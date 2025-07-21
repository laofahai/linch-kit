/**
 * 显示辅助工具
 * 解决Claude Code输出折叠问题，提供清晰的用户界面反馈
 * 
 * @version 1.0.0
 */

import { createLogger } from '@linch-kit/core'

const logger = createLogger('display-helper')

/**
 * 显示配置
 */
export interface DisplayConfig {
  useConsole: boolean           // 是否使用console.log（解决Claude Code折叠）
  useLogger: boolean           // 是否同时使用logger
  forceVisible: boolean        // 是否强制显示（重要信息）
  prefix?: string              // 显示前缀
  border?: boolean             // 是否显示边框
  color?: 'info' | 'success' | 'warning' | 'error'
}

/**
 * 智能显示函数 - 解决Claude Code输出折叠问题
 */
export function smartDisplay(
  message: string, 
  config: Partial<DisplayConfig> = {}
): void {
  const defaultConfig: DisplayConfig = {
    useConsole: true,   // 默认使用console.log确保Claude Code可见
    useLogger: true,    // 同时记录到日志
    forceVisible: false,
    border: false,
    color: 'info'
  }
  
  const finalConfig = { ...defaultConfig, ...config }
  
  // 格式化消息
  let formattedMessage = message
  
  if (finalConfig.prefix) {
    formattedMessage = `${finalConfig.prefix} ${formattedMessage}`
  }
  
  // 添加颜色标记
  const colorPrefixes = {
    info: '📘',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }
  
  if (finalConfig.color && colorPrefixes[finalConfig.color]) {
    formattedMessage = `${colorPrefixes[finalConfig.color]} ${formattedMessage}`
  }
  
  // 添加边框
  if (finalConfig.border) {
    const borderLine = '='.repeat(Math.min(formattedMessage.length + 4, 80))
    formattedMessage = `\n${borderLine}\n  ${formattedMessage}\n${borderLine}`
  }
  
  // 强制显示重要信息（解决Claude Code折叠）
  if (finalConfig.forceVisible || finalConfig.useConsole) {
    console.log(formattedMessage)
  }
  
  // 同时记录到logger（用于调试和审计）
  if (finalConfig.useLogger) {
    const logLevel = finalConfig.color === 'error' ? 'error' :
                    finalConfig.color === 'warning' ? 'warn' : 'info'
    logger[logLevel](message) // 记录原始消息，不包含格式化
  }
}

/**
 * 显示工作流进度（强制可见）
 */
export function displayWorkflowProgress(
  currentState: string,
  progress: number,
  message?: string
): void {
  const states = ['INIT', 'ANALYZE', 'PLAN', 'IMPLEMENT', 'TEST', 'REVIEW', 'COMPLETE']
  const currentIndex = states.indexOf(currentState)
  
  const progressBar = states.map((state, index) => {
    if (index < currentIndex) return `[${state}] ✅`
    if (index === currentIndex) return `[${state}] 🔄`
    return `[${state}] ⏳`
  }).join(' → ')
  
  const displayMessage = [
    `当前状态: ${currentState} (${currentIndex + 1}/7)`,
    `进度: ${progress}%`,
    progressBar,
    message ? `消息: ${message}` : ''
  ].filter(Boolean).join('\n')
  
  smartDisplay(displayMessage, {
    useConsole: true,
    useLogger: true,
    forceVisible: true,
    border: true,
    color: 'info',
    prefix: '🔄 工作流进度'
  })
}

/**
 * 显示Graph RAG同步状态（强制可见）
 */
export function displayGraphRAGSync(
  status: 'starting' | 'success' | 'failed',
  details?: string
): void {
  const messages = {
    starting: '🔄 开始执行Graph RAG同步 (Essential_Rules.md要求)',
    success: '✅ Graph RAG同步完成 - 知识库已更新',
    failed: '❌ Graph RAG同步失败'
  }
  
  const colors: Record<typeof status, DisplayConfig['color']> = {
    starting: 'info',
    success: 'success', 
    failed: 'error'
  }
  
  let message = messages[status]
  if (details) {
    message += `\n   详情: ${details}`
  }
  
  if (status === 'failed') {
    message += '\n   建议: 手动运行 bun run ai:session sync'
  }
  
  smartDisplay(message, {
    useConsole: true,
    useLogger: true,
    forceVisible: true,
    border: true,
    color: colors[status]
  })
}

/**
 * 显示工作流完成摘要（强制可见）
 */
export function displayWorkflowSummary(summary: string): void {
  smartDisplay(summary, {
    useConsole: true,
    useLogger: true,
    forceVisible: true,
    border: true,
    color: 'success',
    prefix: '🚀 完成摘要'
  })
}

/**
 * 显示警告信息（强制可见）
 */
export function displayWarning(message: string, details?: string): void {
  let fullMessage = message
  if (details) {
    fullMessage += `\n   详情: ${details}`
  }
  
  smartDisplay(fullMessage, {
    useConsole: true,
    useLogger: true,
    forceVisible: true,
    border: true,
    color: 'warning'
  })
}

/**
 * 显示错误信息（强制可见）
 */
export function displayError(message: string, error?: Error | string): void {
  let fullMessage = message
  if (error) {
    const errorMsg = error instanceof Error ? error.message : error
    fullMessage += `\n   错误: ${errorMsg}`
  }
  
  smartDisplay(fullMessage, {
    useConsole: true,
    useLogger: true,
    forceVisible: true,
    border: true,
    color: 'error'
  })
}

/**
 * 显示AI工作流状态（强制可见）
 */
export function displayAIWorkflowStatus(
  sessionId: string,
  taskDescription: string,
  currentState: string,
  additionalInfo?: Record<string, unknown>
): void {
  const status = [
    `会话ID: ${sessionId}`,
    `任务: ${taskDescription}`,
    `当前状态: ${currentState}`,
    additionalInfo ? `附加信息: ${JSON.stringify(additionalInfo, null, 2)}` : ''
  ].filter(Boolean).join('\n')
  
  smartDisplay(status, {
    useConsole: true,
    useLogger: true,
    forceVisible: true,
    border: true,
    color: 'info',
    prefix: '🤖 AI工作流状态'
  })
}

/**
 * 批量替换console.log为智能显示
 * 这个函数帮助迁移现有代码
 */
export function migrateConsoleLog() {
  // 提供迁移指南
  smartDisplay(
    '代码迁移指南:\n' +
    '  console.log(msg) → smartDisplay(msg)\n' +
    '  console.warn(msg) → displayWarning(msg)\n' +
    '  console.error(msg) → displayError(msg)',
    {
      useConsole: true,
      useLogger: true,
      border: true,
      color: 'info',
      prefix: '📋 迁移指南'
    }
  )
}