import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { Logger } from '@linch-kit/core'

const JWT_SECRET = process.env.JWT_SECRET || 'linchkit-dev-secret-key-change-in-production'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar: string | null
  role: 'USER' | 'TENANT_ADMIN' | 'SUPER_ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  emailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthContext {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
}

/**
 * 服务器端获取当前用户信息
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }
    
    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    
    // 从数据库获取最新用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!user || user.status !== 'ACTIVE') {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role as AuthUser['role'],
      status: user.status as AuthUser['status'],
      emailVerified: !!user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }
    
  } catch (error) {
    Logger.warn('获取当前用户失败', { error: error instanceof Error ? error.message : String(error) })
    return null
  }
}

/**
 * 获取认证上下文
 */
export async function getAuthContext(): Promise<AuthContext> {
  const user = await getCurrentUser()
  
  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN'
  }
}

/**
 * 权限检查函数
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('需要登录')
  }
  
  return user
}

/**
 * 管理员权限检查
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('需要管理员权限')
  }
  
  return user
}

/**
 * 超级管理员权限检查
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('需要超级管理员权限')
  }
  
  return user
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload: {
  userId: string
  email: string
  role: string
  name: string
}): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'linchkit',
    audience: 'linchkit-app'
  })
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): { userId: string; email: string; role: string; name: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string; name: string }
}