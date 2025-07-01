#!/usr/bin/env tsx

/**
 * LinchKit 管理员创建工具
 * 
 * 使用方法:
 * npx tsx scripts/create-admin.ts
 * 或
 * npx tsx scripts/create-admin.ts --email=admin@company.com --name="管理员" --password=secure123
 */

import { Command } from 'commander'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { Logger } from '@linch-kit/core'

const program = new Command()

interface AdminData {
  email: string
  name: string
  password: string
}

// 创建管理员用户
async function createAdmin(data: AdminData) {
  try {
    Logger.info('开始创建超级管理员...', { email: data.email })
    
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })
    
    if (existingUser) {
      Logger.error('用户已存在', new Error(`邮箱 ${data.email} 已被使用`))
      console.error(`❌ 邮箱 ${data.email} 已被使用`)
      process.exit(1)
    }
    
    // 加密密码
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(data.password, saltRounds)
    
    // 创建超级管理员
    const admin = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(), // 直接标记为已验证
        avatar: `https://avatar.vercel.sh/${encodeURIComponent(data.name)}`,
      }
    })
    
    Logger.info('超级管理员创建成功', { 
      id: admin.id, 
      email: admin.email,
      role: admin.role 
    })
    
    console.log('\n🎉 超级管理员创建成功!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 邮箱: ${admin.email}`)
    console.log(`👤 姓名: ${admin.name}`)
    console.log(`🔑 角色: ${admin.role}`)
    console.log(`🆔 ID: ${admin.id}`)
    console.log(`✅ 状态: ${admin.status}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n现在你可以使用这个账户登录 LinchKit 平台了!')
    console.log(`🌐 登录地址: http://localhost:3000/sign-in`)
    
  } catch (error) {
    Logger.error('创建管理员失败', error instanceof Error ? error : new Error(String(error)))
    console.error('❌ 创建管理员失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 交互式输入
async function promptForData(): Promise<AdminData> {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve)
    })
  }
  
  try {
    console.log('🚀 LinchKit 超级管理员创建工具')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('请输入管理员信息:\n')
    
    const email = await question('📧 邮箱地址: ')
    const name = await question('👤 姓名: ')
    const password = await question('🔒 密码 (最少8位): ')
    
    console.log('')
    
    // 基本验证
    if (!email || !email.includes('@')) {
      throw new Error('请输入有效的邮箱地址')
    }
    
    if (!name || name.length < 2) {
      throw new Error('姓名至少需要2个字符')
    }
    
    if (!password || password.length < 8) {
      throw new Error('密码至少需要8个字符')
    }
    
    return { email: email.trim(), name: name.trim(), password: password.trim() }
  } finally {
    rl.close()
  }
}

// 命令行程序
program
  .name('create-admin')
  .description('创建 LinchKit 超级管理员')
  .version('1.0.0')
  .option('-e, --email <email>', '管理员邮箱')
  .option('-n, --name <name>', '管理员姓名')
  .option('-p, --password <password>', '管理员密码')
  .action(async (options) => {
    try {
      let adminData: AdminData
      
      if (options.email && options.name && options.password) {
        // 命令行参数模式
        adminData = {
          email: options.email,
          name: options.name,
          password: options.password
        }
        
        // 基本验证
        if (!adminData.email.includes('@')) {
          console.error('❌ 请输入有效的邮箱地址')
          process.exit(1)
        }
        
        if (adminData.name.length < 2) {
          console.error('❌ 姓名至少需要2个字符')
          process.exit(1)
        }
        
        if (adminData.password.length < 8) {
          console.error('❌ 密码至少需要8个字符')
          process.exit(1)
        }
      } else {
        // 交互式模式
        adminData = await promptForData()
      }
      
      await createAdmin(adminData)
      
    } catch (error) {
      console.error('❌ 操作失败:', error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })

// 检查环境
if (!process.env.DATABASE_URL) {
  console.error('❌ 请设置 DATABASE_URL 环境变量')
  console.error('请确保 .env 文件存在并包含正确的数据库连接信息')
  process.exit(1)
}

program.parse()