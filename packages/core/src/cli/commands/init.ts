/**
 * linch init 命令
 * 
 * 初始化 LinchKit 项目
 */

import { type CLIManager, type CLICommand } from '../index'
import { Logger } from '../../logger-client'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

const initCommand: CLICommand = {
  name: 'init',
  description: '初始化 LinchKit 项目',
  category: 'core',
  options: [
    {
      name: 'skip-env',
      description: '跳过环境变量配置',
      type: 'boolean',
      defaultValue: false
    },
    {
      name: 'skip-deps',
      description: '跳过依赖安装',
      type: 'boolean',
      defaultValue: false
    },
    {
      name: 'skip-db',
      description: '跳过数据库初始化',
      type: 'boolean',
      defaultValue: false
    }
  ],
  handler: async ({ options }) => {
    try {
      console.log('===========================================')
      console.log('🚀 LinchKit 项目初始化向导')
      console.log('===========================================\n')

      // 1. 检查是否在 LinchKit 项目中
      if (!existsSync('package.json')) {
        return {
          success: false,
          error: '未找到 package.json，请在 LinchKit 项目根目录运行此命令'
        }
      }

      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
      const hasLinchKitDeps = Object.keys({
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }).some(dep => dep.startsWith('@linch-kit/'))

      if (!hasLinchKitDeps) {
        return {
          success: false,
          error: '当前项目不是 LinchKit 项目'
        }
      }

      // 2. 创建环境变量文件
      if (!options.skipEnv) {
        Logger.info('配置环境变量...')
        await createEnvFile()
      }

      // 3. 安装依赖
      if (!options.skipDeps) {
        const installDeps = await question('\n是否安装依赖包？(Y/n): ')
        if (installDeps.toLowerCase() !== 'n') {
          Logger.info('安装依赖包...')
          execSync('pnpm install', { stdio: 'inherit' })
        }
      }

      // 4. 初始化数据库
      if (!options.skipDb) {
        const initDb = await question('\n是否初始化数据库？(Y/n): ')
        if (initDb.toLowerCase() !== 'n') {
          Logger.info('初始化数据库...')
          execSync('pnpm db:generate', { stdio: 'inherit' })
          execSync('pnpm db:push', { stdio: 'inherit' })
        }
      }

      // 5. 完成
      console.log('\n===========================================')
      console.log('✅ LinchKit 项目初始化完成！')
      console.log('===========================================')
      console.log('\n下一步:')
      console.log('1. 编辑 .env.local 文件，配置你的环境变量')
      console.log('2. 运行 pnpm linch dev 启动开发服务器')
      console.log('3. 访问 http://localhost:3000')

      rl.close()
      return { success: true }
    } catch (error) {
      rl.close()
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

async function createEnvFile() {
  if (!existsSync('.env.example')) {
    Logger.warn('未找到 .env.example 文件')
    return
  }

  if (existsSync('.env.local')) {
    const overwrite = await question('\n.env.local 文件已存在，是否覆盖？(y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      return
    }
  }

  const envExample = readFileSync('.env.example', 'utf-8')
  let envContent = envExample

  // 交互式配置
  console.log('\n请配置基本信息:')
  
  // 数据库配置
  const dbUrl = await question('PostgreSQL 连接字符串 (回车使用默认值): ')
  if (dbUrl) {
    envContent = envContent.replace(
      /DATABASE_URL=".*"/,
      `DATABASE_URL="${dbUrl}"`
    )
  }

  // NextAuth 密钥
  const generateSecret = await question('是否自动生成 NextAuth 密钥？(Y/n): ')
  if (generateSecret.toLowerCase() !== 'n') {
    const secret = generateRandomString(32)
    envContent = envContent.replace(
      /NEXTAUTH_SECRET=".*"/,
      `NEXTAUTH_SECRET="${secret}"`
    )
  }

  writeFileSync('.env.local', envContent)
  Logger.info('✓ 环境变量文件创建成功')
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function registerInitCommand(cli: CLIManager) {
  cli.registerCommand(initCommand)
}