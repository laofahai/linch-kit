/**
 * linch build 命令
 *
 * 构建生产版本
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'

const execAsync = promisify(exec)

import { type CLIManager, type CLICommand } from '../index'
import { Logger } from '../../logger-client'

const buildCommand: CLICommand = {
  name: 'build',
  description: '构建生产版本',
  category: 'dev',
  options: [
    {
      name: 'analyze',
      description: '分析构建包大小',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'profile',
      description: '生成性能分析文件',
      type: 'boolean',
      defaultValue: false,
    },
  ],
  handler: async ({ options }) => {
    try {
      Logger.info('开始构建 LinchKit 项目...')

      // 1. 清理构建目录
      Logger.info('清理构建目录...')
      try {
        await execAsync('rm -rf .next dist build out')
        Logger.info('✓ 构建目录清理完成')
      } catch (error) {
        Logger.error('Clean directory failed:', error instanceof Error ? error : new Error(String(error)))
        throw new Error('清理构建目录失败')
      }

      // 2. 生成 Prisma 客户端（如果存在）
      if (existsSync('prisma/schema.prisma')) {
        Logger.info('生成 Prisma 客户端...')
        try {
          await execAsync('prisma generate')
          Logger.info('✓ Prisma 客户端生成完成')
        } catch (error) {
          Logger.error('Prisma generate failed:', error instanceof Error ? error : new Error(String(error)))
          throw new Error('Prisma 客户端生成失败')
        }
      }

      // 3. 类型检查
      Logger.info('运行类型检查...')
      try {
        await execAsync('tsc --noEmit')
        Logger.info('✓ 类型检查通过')
      } catch (error) {
        Logger.error('Type check failed:', error instanceof Error ? error : new Error(String(error)))
        Logger.error('类型检查失败，继续构建...')
      }

      // 4. 构建项目
      Logger.info('构建项目...')

      const env: Record<string, string> = {
        ...process.env,
        NODE_ENV: 'production',
      }

      if (options.analyze) {
        env.ANALYZE = 'true'
      }

      if (options.profile) {
        env.PROFILE = 'true'
      }

      // 检查项目类型
      const isNextApp = existsSync('next.config.js') || existsSync('next.config.ts')
      const isViteApp = existsSync('vite.config.js') || existsSync('vite.config.ts')

      if (isNextApp) {
        try {
          await execAsync('next build', { env })
          Logger.info('✅ Next.js 项目构建完成')
          Logger.info('构建输出: .next/')
          if (options.analyze) {
            Logger.info('包分析报告已生成')
          }
        } catch (error) {
          Logger.error('Next.js build failed:', error instanceof Error ? error : new Error(String(error)))
          throw new Error('Next.js 构建失败')
        }
      } else if (isViteApp) {
        try {
          await execAsync('vite build', { env })
          Logger.info('✅ Vite 项目构建完成')
          Logger.info('构建输出: dist/')
        } catch (error) {
          Logger.error('Vite build failed:', error instanceof Error ? error : new Error(String(error)))
          throw new Error('Vite 构建失败')
        }
      } else {
        try {
          await execAsync('pnpm build', { env })
          Logger.info('✅ 项目构建完成')
        } catch (error) {
          Logger.error('Build failed:', error instanceof Error ? error : new Error(String(error)))
          throw new Error('项目构建失败')
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

export function registerBuildCommand(cli: CLIManager) {
  cli.registerCommand(buildCommand)
}
