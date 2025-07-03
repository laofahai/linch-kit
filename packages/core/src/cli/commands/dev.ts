/**
 * linch dev 命令
 * 
 * 启动开发服务器
 */

import { spawn } from 'child_process'
import { existsSync } from 'fs'

import { type CLIManager, type CLICommand } from '../index'
import { Logger } from '../../logger-client'

const devCommand: CLICommand = {
  name: 'dev',
  description: '启动开发服务器',
  category: 'dev',
  options: [
    {
      name: 'port',
      alias: 'p',
      description: '服务器端口',
      type: 'number',
      defaultValue: 3000
    },
    {
      name: 'host',
      alias: 'h',
      description: '服务器主机',
      type: 'string',
      defaultValue: 'localhost'
    },
    {
      name: 'turbo',
      description: '使用 Turbopack (实验性)',
      type: 'boolean',
      defaultValue: false
    }
  ],
  handler: async ({ options }) => {
    try {
      // 检查项目类型
      const isNextApp = existsSync('next.config.js') || existsSync('next.config.ts')
      const isViteApp = existsSync('vite.config.js') || existsSync('vite.config.ts')
      
      let command: string
      let args: string[] = []

      if (isNextApp) {
        command = 'next'
        args = ['dev']
        
        if (options.port) {
          args.push('-p', String(options.port))
        }
        if (options.host) {
          args.push('-H', String(options.host))
        }
        if (options.turbo) {
          args.push('--turbo')
        }
      } else if (isViteApp) {
        command = 'vite'
        args = []
        
        if (options.port) {
          args.push('--port', String(options.port))
        }
        if (options.host) {
          args.push('--host', String(options.host))
        }
      } else {
        // 默认使用 package.json 中的 dev 脚本
        command = 'pnpm'
        args = ['dev']
      }

      Logger.info(`Starting development server...`)
      Logger.info(`Command: ${command} ${args.join(' ')}`)

      // 使用 spawn 以保持输出流
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          PORT: String(options.port || 3000)
        }
      })

      child.on('error', (error) => {
        Logger.error('Failed to start dev server:', error)
        process.exit(1)
      })

      child.on('exit', (code) => {
        if (code !== 0) {
          process.exit(code || 1)
        }
      })

      // 处理进程信号
      process.on('SIGINT', () => {
        child.kill('SIGINT')
        process.exit(0)
      })

      process.on('SIGTERM', () => {
        child.kill('SIGTERM')
        process.exit(0)
      })

      // 保持进程运行
      await new Promise(() => {})
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

export function registerDevCommand(cli: CLIManager) {
  cli.registerCommand(devCommand)
}