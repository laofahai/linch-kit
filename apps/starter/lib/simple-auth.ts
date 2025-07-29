/**
 * 简化的认证服务 - 用于快速实现功能
 */

import { logger } from '@linch-kit/core/server'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// 持久化用户存储 (使用文件存储)
const usersFile = './users.json'
let users = new Map()

// 加载用户数据
function loadUsers() {
  try {
    if (typeof window !== 'undefined') return // 只在服务器端执行
    
    const fs = require('fs')
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf8')
      const usersData = JSON.parse(data)
      users = new Map(Object.entries(usersData))
    }
  } catch (error) {
    console.log('Failed to load users file, starting with empty storage')
  }
}

// 保存用户数据
function saveUsers() {
  try {
    if (typeof window !== 'undefined') return // 只在服务器端执行
    
    const fs = require('fs')
    const usersData = Object.fromEntries(users)
    fs.writeFileSync(usersFile, JSON.stringify(usersData, null, 2))
  } catch (error) {
    console.error('Failed to save users file:', error)
  }
}

// 初始化用户数据
loadUsers()

// 注册用户
export async function registerUser(email: string, password: string, name?: string) {
  try {
    // 检查用户是否已存在
    if (users.has(email)) {
      return { success: false, error: '该邮箱已被注册' }
    }

    // 创建用户
    const user = {
      id: crypto.randomUUID(),
      email,
      name: name || email,
      password: password, // 实际应用中应该加密
      createdAt: new Date().toISOString()
    }

    users.set(email, user)
    saveUsers() // 保存到文件

    logger.info('用户注册成功', {
      service: 'simple-auth',
      userId: user.id,
      email: email.slice(0, 3) + '***'
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }
  } catch (error) {
    logger.error('注册失败', error instanceof Error ? error : undefined)
    return { success: false, error: '注册失败，请稍后再试' }
  }
}

// 登录用户
export async function loginUser(email: string, password: string) {
  try {
    const user = users.get(email)

    if (!user) {
      return { success: false, error: '用户不存在' }
    }

    if (user.password !== password) {
      return { success: false, error: '密码错误' }
    }

    // 生成 JWT token
    const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production-min-32-chars'
    const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '15m'
    const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d'

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        iss: 'linchkit-starter',
        aud: 'linchkit-starter-app'
      },
      jwtSecret,
      { expiresIn: accessTokenExpiry }
    )

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        type: 'refresh'
      },
      jwtSecret,
      { expiresIn: refreshTokenExpiry }
    )

    // 计算过期时间（秒）
    const expiresIn = accessTokenExpiry.endsWith('m') 
      ? parseInt(accessTokenExpiry) * 60
      : accessTokenExpiry.endsWith('h')
      ? parseInt(accessTokenExpiry) * 3600
      : parseInt(accessTokenExpiry)

    logger.info('用户登录成功', {
      service: 'simple-auth',
      userId: user.id,
      email: email.slice(0, 3) + '***'
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      accessToken,
      refreshToken,
      expiresIn
    }
  } catch (error) {
    logger.error('登录失败', error instanceof Error ? error : undefined)
    return { success: false, error: '登录失败，请稍后再试' }
  }
}

// 验证 JWT token
export function verifyToken(token: string) {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production-min-32-chars'
    return jwt.verify(token, jwtSecret)
  } catch (error) {
    return null
  }
}