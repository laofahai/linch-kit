/**
 * linch build 命令
 *
 * 构建生产版本
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

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
      execSync('rm -rf .next dist build out', { stdio: 'inherit' })

      // 2. 生成 Prisma 客户端（如果存在）
      if (existsSync('prisma/schema.prisma')) {
        Logger.info('生成 Prisma 客户端...')
        execSync('prisma generate', { stdio: 'inherit' })
      }

      // 3. 类型检查
      Logger.info('运行类型检查...')
      try {
        execSync('tsc --noEmit', { stdio: 'inherit' })
      } catch {
        // 忽略类型检查错误
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
        execSync('next build', { stdio: 'inherit', env })

        // 显示构建信息
        Logger.info('✅ Next.js 项目构建完成')
        Logger.info('构建输出: .next/')

        if (options.analyze) {
          Logger.info('包分析报告已生成')
        }
      } else if (isViteApp) {
        execSync('vite build', { stdio: 'inherit', env })
        Logger.info('✅ Vite 项目构建完成')
        Logger.info('构建输出: dist/')
      } else {
        // 默认使用 package.json 中的 build 脚本
        execSync('pnpm build', { stdio: 'inherit', env })
        Logger.info('✅ 项目构建完成')
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
