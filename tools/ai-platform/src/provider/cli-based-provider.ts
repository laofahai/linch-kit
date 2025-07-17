/**
 * 基于本地CLI的AI Provider
 * 通过调用本地安装的AI CLI工具来实现AI集成
 */

import { execSync } from 'child_process'

import { createLogger } from '@linch-kit/core'

const logger = createLogger('cli-ai-provider')

export interface CLIProviderConfig {
  command: string
  promptFlag: string
  timeoutMs?: number
  additionalArgs?: string[]
  outputParser?: (output: string) => string
}

export interface CLIAIResponse {
  content: string
  success: boolean
  error?: string
  provider: string
  executionTime: number
}

export class CLIBasedAIProvider {
  private config: CLIProviderConfig
  private providerName: string

  constructor(providerName: string, config: CLIProviderConfig) {
    this.providerName = providerName
    this.config = {
      timeoutMs: 30000,
      additionalArgs: [],
      outputParser: (output) => output.trim(),
      ...config
    }
  }

  async generate(prompt: string): Promise<CLIAIResponse> {
    const startTime = Date.now()
    
    try {
      // 检查CLI命令是否可用
      await this.validateCLI()
      
      // 构建命令
      const args = [
        this.config.promptFlag,
        `"${prompt.replace(/"/g, '\\"')}"`,
        ...(this.config.additionalArgs || [])
      ]
      
      const command = `${this.config.command} ${args.join(' ')}`
      
      logger.info(`Executing: ${this.config.command} ${this.config.promptFlag} "<prompt>"`)
      
      // 执行命令
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: this.config.timeoutMs,
        stdio: 'pipe'
      })
      
      const content = this.config.outputParser!(output)
      const executionTime = Date.now() - startTime
      
      logger.info(`${this.providerName} completed in ${executionTime}ms`)
      
      return {
        content,
        success: true,
        provider: this.providerName,
        executionTime
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      logger.error(`${this.providerName} failed after ${executionTime}ms:`, errorMessage)
      
      return {
        content: '',
        success: false,
        error: errorMessage,
        provider: this.providerName,
        executionTime
      }
    }
  }

  async validateCLI(): Promise<boolean> {
    try {
      execSync(`which ${this.config.command}`, { stdio: 'pipe' })
      return true
    } catch {
      throw new Error(`CLI command '${this.config.command}' not found. Please install it first.`)
    }
  }

  getProviderName(): string {
    return this.providerName
  }
}

// 预定义的常见CLI提供者配置
export const COMMON_CLI_PROVIDERS = {
  gemini: {
    command: 'gemini',
    promptFlag: '-p'
  },
  claude: {
    command: 'claude',
    promptFlag: '-p'
  },
  chatgpt: {
    command: 'chatgpt',
    promptFlag: '--prompt'
  },
  ollama: {
    command: 'ollama',
    promptFlag: 'run',
    additionalArgs: ['llama2'] // 默认模型，可配置
  }
} as const

export type CommonProvider = keyof typeof COMMON_CLI_PROVIDERS