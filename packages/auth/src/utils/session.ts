import { getServerSession } from 'next-auth'
import { authOptions } from '../config'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Session, User } from '../types'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'
import { minimatch } from 'minimatch'

/**
 * 获取当前会话用户 - 用于服务器组件和API路由
 * @returns 当前登录用户或null
 */
export async function getSessionUser(): Promise<User | null> {
  const session = (await getServerSession(authOptions)) as Session
  return session?.user ?? null
}

/**
 * 检查当前用户是否具有指定权限 - 用于服务器组件和API路由
 * @param resource 资源权限标识符
 * @returns 是否具有权限
 */
export async function checkPermission(resource: string | string[]): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) return false
  return hasPermission(user, resource)
}

/**
 * 从请求中获取用户Token - 用于Edge Runtime环境（如中间件）
 * @param req NextRequest对象
 * @returns 解析后的token或null
 */
export async function getUserToken(req: NextRequest) {
  try {
    return await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })
  } catch (error) {
    console.error('Error getting token:', error)
    return null
  }
}

/**
 * 检查用户是否拥有指定权限（单个或多个）
 * 使用 minimatch 支持 glob 风格的权限匹配
 *
 * @param user 用户对象
 * @param permission 单个权限字符串或权限字符串数组
 * @returns 如果用户拥有任一指定权限，返回 true
 *
 * @example
 * // 精确匹配
 * hasPermission(user, 'reports:read')
 *
 * // 使用 * 匹配零个或多个字符
 * hasPermission(user, 'reports:*') // 匹配 reports:read, reports:write 等
 *
 * // 使用 ** 匹配跨越层级的多个字符
 * hasPermission(user, 'admin:**') // 匹配所有以 admin: 开头的权限
 *
 * // 使用 ? 匹配单个字符
 * hasPermission(user, 'user:?dit') // 匹配 user:edit, user:adit 等
 *
 * // 使用 [...] 匹配括号内的任一字符
 * hasPermission(user, 'reports:[rw]ead') // 匹配 reports:read, reports:wead
 */
export function hasPermission(user: User | null, permission: string | string[]): boolean {
  if (!user) return false
  if (!user.permissions?.length) return false

  // 将单个权限转换为数组以统一处理
  const requiredPermissions = Array.isArray(permission) ? permission : [permission]

  // 检查用户是否拥有任一指定权限
  return requiredPermissions.some(requiredPerm => {
    // 如果包含通配符，使用 minimatch 进行匹配
    if (requiredPerm.includes('*') || requiredPerm.includes('?') || requiredPerm.includes('[')) {
      return user.permissions.some(userPerm => minimatch(userPerm, requiredPerm))
    }
    // 否则使用精确匹配
    return user.permissions.includes(requiredPerm)
  })
}
