import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type NextRequest } from 'next/server'

import { db } from '../../lib/db'

/**
 * tRPC Context
 *
 * @description tRPC 上下文，包含请求信息和认证数据
 * @since 2025-06-20
 */
export interface Context {
  req: NextRequest | Request
  user?: {
    id: string
    email: string
    name: string
    role: string
    roles: string[]
  }
  session?: {
    id: string
    userId: string
    sessionToken: string
    expires: Date
    metadata?: any
  }
}

/**
 * 从请求头中提取认证令牌
 * @description 从 Authorization header 或 localStorage 中获取令牌
 * @param req - 请求对象
 * @returns 认证令牌或 null
 * @since 2025-06-20
 */
function extractAuthToken(req: NextRequest | Request): string | null {
  // 从 Authorization header 中提取
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 从 cookie 中提取（如果使用 cookie 存储）
  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    if (cookies.authToken) {
      return cookies.authToken
    }
  }

  return null
}

/**
 * 根据会话令牌获取用户信息
 * @description 验证会话令牌并返回用户数据
 * @param sessionToken - 会话令牌
 * @returns 用户和会话信息或 null
 * @since 2025-06-20
 */
async function getUserFromSession(sessionToken: string) {
  try {
    // 查找有效的会话
    const session = await db.session.findFirst({
      where: {
        sessionToken,
        expires: {
          gt: new Date(), // 会话未过期
        },
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    })

    if (!session || !session.user) {
      return null
    }

    // 检查用户状态
    if (session.user.globalStatus !== 'active') {
      return null
    }

    // 提取用户角色
    const roles = session.user.userRoles.map(ur => ur.role.name)

    return {
      user: {
        id: session.user.id,
        email: session.user.globalEmail || '',
        name: session.user.name || '',
        role: roles.includes('admin') ? 'admin' : 'user', // 向后兼容
        roles,
      },
      session: {
        id: session.id,
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
        metadata: session.metadata,
      },
    }
  } catch (error) {
    console.error('Error fetching user from session:', error)
    return null
  }
}

/**
 * Create context for tRPC procedures
 *
 * @description 为每个 tRPC 请求创建上下文，包含认证信息
 * @param opts - 创建上下文的选项
 * @returns 包含用户和会话信息的上下文
 * @since 2025-06-20
 */
export async function createContext(opts: CreateNextContextOptions): Promise<Context> {
  const { req } = opts

  // 提取认证令牌
  const authToken = extractAuthToken(req)

  if (!authToken) {
    return {
      req,
      user: undefined,
      session: undefined,
    }
  }

  // 根据令牌获取用户信息
  const authData = await getUserFromSession(authToken)

  return {
    req,
    user: authData?.user,
    session: authData?.session,
  }
}

export type TRPCContext = Context
