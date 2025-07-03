#!/usr/bin/env tsx
/**
 * LinchKit Starter 初始化脚本
 * 
 * 用于初始化新的 LinchKit 项目
 * 使用方法: pnpm init:project
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import readline from 'readline'
import { Logger } from '@linch-kit/core'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('===========================================')
  console.log('🚀 LinchKit Starter 初始化向导')
  console.log('===========================================\n')

  try {
    // 1. 检查环境
    Logger.info('检查环境...')
    checkEnvironment()

    // 2. 创建环境变量文件
    if (!existsSync('.env.local')) {
      Logger.info('创建环境变量文件...')
      await createEnvFile()
    } else {
      const overwrite = await question('\n.env.local 文件已存在，是否覆盖？(y/N): ')
      if (overwrite.toLowerCase() === 'y') {
        await createEnvFile()
      }
    }

    // 3. 安装依赖
    const installDeps = await question('\n是否安装依赖包？(Y/n): ')
    if (installDeps.toLowerCase() !== 'n') {
      Logger.info('安装依赖包...')
      execSync('pnpm install', { stdio: 'inherit' })
    }

    // 4. 初始化数据库
    const initDb = await question('\n是否初始化数据库？(Y/n): ')
    if (initDb.toLowerCase() !== 'n') {
      Logger.info('初始化数据库...')
      await initDatabase()
    }

    // 5. 创建管理员账号
    const createAdmin = await question('\n是否创建管理员账号？(Y/n): ')
    if (createAdmin.toLowerCase() !== 'n') {
      await createAdminUser()
    }

    // 6. 完成
    console.log('\n===========================================')
    console.log('✅ LinchKit Starter 初始化完成！')
    console.log('===========================================')
    console.log('\n下一步:')
    console.log('1. 编辑 .env.local 文件，配置你的环境变量')
    console.log('2. 运行 pnpm dev 启动开发服务器')
    console.log('3. 访问 http://localhost:3000')
    console.log('\n祝你使用愉快！🎉')

  } catch (error) {
    Logger.error('初始化失败:', error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

function checkEnvironment() {
  // 检查 Node.js 版本
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1))
  if (majorVersion < 18) {
    throw new Error(`需要 Node.js 18 或更高版本，当前版本: ${nodeVersion}`)
  }

  // 检查 pnpm
  try {
    execSync('pnpm --version', { stdio: 'ignore' })
  } catch {
    throw new Error('未找到 pnpm，请先安装: npm install -g pnpm')
  }

  Logger.info('✓ 环境检查通过')
}

async function createEnvFile() {
  const envExample = readFileSync('.env.example', 'utf-8')
  let envContent = envExample

  // 交互式配置
  console.log('\n请配置基本信息:')
  
  // 数据库配置
  const dbUrl = await question('PostgreSQL 连接字符串 (回车使用默认值): ')
  if (dbUrl) {
    envContent = envContent.replace(
      'DATABASE_URL="postgresql://postgres:password@localhost:5432/linchkit?schema=public"',
      `DATABASE_URL="${dbUrl}"`
    )
    envContent = envContent.replace(
      'DIRECT_URL="postgresql://postgres:password@localhost:5432/linchkit?schema=public"',
      `DIRECT_URL="${dbUrl}"`
    )
  }

  // NextAuth 密钥
  const generateSecret = await question('是否自动生成 NextAuth 密钥？(Y/n): ')
  if (generateSecret.toLowerCase() !== 'n') {
    const secret = generateRandomString(32)
    envContent = envContent.replace(
      'NEXTAUTH_SECRET="your-nextauth-secret-here"',
      `NEXTAUTH_SECRET="${secret}"`
    )
  }

  // JWT 密钥
  const generateJwtSecret = await question('是否自动生成 JWT 密钥？(Y/n): ')
  if (generateJwtSecret.toLowerCase() !== 'n') {
    const jwtSecret = generateRandomString(32)
    envContent = envContent.replace(
      'JWT_SECRET="your-very-secure-jwt-secret-min-32-chars"',
      `JWT_SECRET="${jwtSecret}"`
    )
  }

  writeFileSync('.env.local', envContent)
  Logger.info('✓ 环境变量文件创建成功')
}

async function initDatabase() {
  try {
    // 生成 Prisma 客户端
    Logger.info('生成 Prisma 客户端...')
    execSync('pnpm db:generate', { stdio: 'inherit' })

    // 推送数据库架构
    Logger.info('推送数据库架构...')
    execSync('pnpm db:push', { stdio: 'inherit' })

    Logger.info('✓ 数据库初始化成功')
  } catch (error) {
    Logger.error('数据库初始化失败，请检查数据库连接配置')
    throw error
  }
}

async function createAdminUser() {
  console.log('\n创建管理员账号:')
  
  const email = await question('管理员邮箱: ')
  const password = await question('管理员密码: ')
  const name = await question('管理员姓名 (可选): ')

  try {
    // 保存到环境变量供 create-admin.ts 使用
    process.env.ADMIN_EMAIL = email
    process.env.ADMIN_PASSWORD = password
    process.env.ADMIN_NAME = name || email

    execSync('pnpm create-admin', { stdio: 'inherit' })
    Logger.info('✓ 管理员账号创建成功')
  } catch (error) {
    Logger.error('创建管理员账号失败')
    throw error
  }
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 执行主函数
main().catch(error => {
  console.error('错误:', error)
  process.exit(1)
})