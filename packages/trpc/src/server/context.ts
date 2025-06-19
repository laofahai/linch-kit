import type { BaseContext, AuthUser, AuthSession, PermissionChecker } from './types'

/**
 * 扩展的上下文类型，继承自 BaseContext
 */
export interface Context extends BaseContext {
  user?: AuthUser | null
  session?: AuthSession | null
  permissions?: Record<string, boolean> | null // 存储权限检查结果
  permissionChecker?: PermissionChecker | null // 权限检查器实例
  tenant?: string | null
  // 可以添加更多应用特定的上下文属性
  db?: any // 数据库连接
  req?: any // HTTP 请求对象
  res?: any // HTTP 响应对象
}

/**
 * 创建上下文的选项
 */
export interface CreateContextOptions {
  req?: any
  res?: any
  headers?: Record<string, string>
}

/**
 * 基础上下文创建器
 * 这是一个工厂函数，用于创建 tRPC 上下文
 */
export async function createContext(opts?: CreateContextOptions): Promise<Context> {
  // 临时实现，后续会与 auth-core 集成
  const user = null // await getSessionUser(opts?.req)
  const session = null // await getSession(opts?.req)
  const tenant = null // await extractTenant(opts?.req)

  return {
    user,
    session,
    tenant,
    permissions: null, // 权限检查结果存储
    permissionChecker: null, // await getPermissionChecker(user?.id)
    req: opts?.req,
    res: opts?.res
  }
}

/**
 * 从请求中提取租户信息 (多租户支持)
 */
export function extractTenant(req?: any): string | null {
  // 临时实现
  if (!req) return null

  // 可以从 header、subdomain 或 path 中提取
  const tenantHeader = req.headers?.['x-tenant-id']
  if (tenantHeader) return tenantHeader

  // 从子域名提取
  const host = req.headers?.host
  if (host && host.includes('.')) {
    const subdomain = host.split('.')[0]
    if (subdomain !== 'www' && subdomain !== 'api') {
      return subdomain
    }
  }

  return null
}

/**
 * 获取会话用户信息
 */
export async function getSessionUser(_req?: any): Promise<AuthUser | null> {
  // 临时实现，等待 auth-core 集成
  // const session = await getSession(req)
  // return session?.user || null
  return null
}
