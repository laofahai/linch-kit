/**
 * @ai-context 进程管理工具
 * @ai-purpose 提供进程启动、管理和代理功能
 * @ai-usage 主要用于 CLI 命令代理到现有工具
 */

import { spawn, ChildProcess, SpawnOptions } from 'child_process'
import { logger } from './logger'

/**
 * @ai-interface 进程执行选项
 * @ai-purpose 定义进程执行的配置选项
 */
export interface ProcessOptions extends SpawnOptions {
  /** @ai-field 是否继承父进程的 stdio */
  inherit?: boolean
  
  /** @ai-field 是否使用 shell */
  shell?: boolean
  
  /** @ai-field 超时时间（毫秒） */
  timeout?: number
  
  /** @ai-field 是否记录输出 */
  logOutput?: boolean
}

/**
 * @ai-interface 进程执行结果
 * @ai-purpose 描述进程执行的结果
 */
export interface ProcessResult {
  /** @ai-field 退出码 */
  exitCode: number | null
  
  /** @ai-field 是否成功 */
  success: boolean
  
  /** @ai-field 标准输出 */
  stdout?: string
  
  /** @ai-field 标准错误 */
  stderr?: string
  
  /** @ai-field 执行时间（毫秒） */
  duration: number
  
  /** @ai-field 是否超时 */
  timedOut: boolean
}

/**
 * @ai-function 执行命令并等待结果
 * @ai-purpose 执行外部命令并返回结果
 * @ai-parameter command: string - 要执行的命令
 * @ai-parameter args: string[] - 命令参数
 * @ai-parameter options?: ProcessOptions - 执行选项
 * @ai-return Promise<ProcessResult> - 执行结果
 */
export async function executeCommand(
  command: string,
  args: string[] = [],
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const startTime = Date.now()
  
  logger.debug('Executing command', { command, args, options })
  
  return new Promise((resolve) => {
    const spawnOptions: SpawnOptions = {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      shell: options.shell !== false,
      stdio: options.inherit ? 'inherit' : 'pipe',
      ...options
    }
    
    const child = spawn(command, args, spawnOptions)
    
    let stdout = ''
    let stderr = ''
    let timedOut = false
    
    // AI: 收集输出（如果不是继承模式）
    if (!options.inherit) {
      child.stdout?.on('data', (data) => {
        const output = data.toString()
        stdout += output
        if (options.logOutput) {
          logger.debug('Command stdout', { command, output })
        }
      })
      
      child.stderr?.on('data', (data) => {
        const output = data.toString()
        stderr += output
        if (options.logOutput) {
          logger.debug('Command stderr', { command, output })
        }
      })
    }
    
    // AI: 设置超时
    let timeoutId: NodeJS.Timeout | undefined
    if (options.timeout) {
      timeoutId = setTimeout(() => {
        timedOut = true
        child.kill('SIGTERM')
        logger.warn('Command timed out', { command, timeout: options.timeout })
      }, options.timeout)
    }
    
    // AI: 处理进程退出
    child.on('exit', (code, signal) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      const duration = Date.now() - startTime
      const success = code === 0 && !timedOut
      
      const result: ProcessResult = {
        exitCode: code,
        success,
        stdout: options.inherit ? undefined : stdout,
        stderr: options.inherit ? undefined : stderr,
        duration,
        timedOut
      }
      
      logger.debug('Command completed', { 
        command, 
        exitCode: code, 
        signal, 
        duration, 
        success,
        timedOut
      })
      
      resolve(result)
    })
    
    // AI: 处理错误
    child.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      const duration = Date.now() - startTime
      
      logger.error('Command failed', { command, duration }, error)
      
      resolve({
        exitCode: null,
        success: false,
        stderr: error.message,
        duration,
        timedOut
      })
    })
  })
}

/**
 * @ai-function 启动长期运行的进程
 * @ai-purpose 启动并返回子进程实例，用于长期运行的服务
 * @ai-parameter command: string - 要执行的命令
 * @ai-parameter args: string[] - 命令参数
 * @ai-parameter options?: ProcessOptions - 执行选项
 * @ai-return ChildProcess - 子进程实例
 */
export function startProcess(
  command: string,
  args: string[] = [],
  options: ProcessOptions = {}
): ChildProcess {
  logger.info('Starting long-running process', { command, args })
  
  const spawnOptions: SpawnOptions = {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    shell: options.shell !== false,
    stdio: options.inherit ? 'inherit' : 'pipe',
    detached: false,
    ...options
  }
  
  const child = spawn(command, args, spawnOptions)
  
  // AI: 设置进程事件监听
  child.on('spawn', () => {
    logger.info('Process started', { command, pid: child.pid })
  })
  
  child.on('exit', (code, signal) => {
    logger.info('Process exited', { command, pid: child.pid, code, signal })
  })
  
  child.on('error', (error) => {
    logger.error('Process error', { command, pid: child.pid }, error)
  })
  
  return child
}

/**
 * @ai-function 代理命令到现有工具
 * @ai-purpose 将命令代理到现有的工具（如 npm, next, turbo）
 * @ai-parameter command: string - 要代理的命令
 * @ai-parameter args: string[] - 命令参数
 * @ai-parameter options?: ProcessOptions - 执行选项
 * @ai-return Promise<void> - 代理完成
 * @ai-usage 主要用于 CLI 命令的代理实现
 */
export async function proxyCommand(
  command: string,
  args: string[] = [],
  options: ProcessOptions = {}
): Promise<void> {
  logger.info('Proxying command', { command, args })
  
  const child = startProcess(command, args, {
    inherit: true,
    ...options
  })
  
  // AI: 处理进程信号
  const handleSignal = (signal: NodeJS.Signals) => {
    logger.debug('Received signal, forwarding to child', { signal, pid: child.pid })
    child.kill(signal)
  }
  
  process.on('SIGINT', handleSignal)
  process.on('SIGTERM', handleSignal)
  
  // AI: 等待子进程退出
  return new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      process.removeListener('SIGINT', handleSignal)
      process.removeListener('SIGTERM', handleSignal)
      
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
    
    child.on('error', (error) => {
      process.removeListener('SIGINT', handleSignal)
      process.removeListener('SIGTERM', handleSignal)
      reject(error)
    })
  })
}

/**
 * @ai-function 检查命令是否可用
 * @ai-purpose 检查系统中是否存在指定的命令
 * @ai-parameter command: string - 要检查的命令
 * @ai-return Promise<boolean> - 命令是否可用
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    const result = await executeCommand('which', [command], { 
      shell: true,
      logOutput: false
    })
    return result.success
  } catch {
    return false
  }
}

/**
 * @ai-function 获取命令的完整路径
 * @ai-purpose 获取命令在系统中的完整路径
 * @ai-parameter command: string - 命令名称
 * @ai-return Promise<string | null> - 命令路径或 null
 */
export async function getCommandPath(command: string): Promise<string | null> {
  try {
    const result = await executeCommand('which', [command], { 
      shell: true,
      logOutput: false
    })
    
    if (result.success && result.stdout) {
      return result.stdout.trim()
    }
    
    return null
  } catch {
    return null
  }
}
