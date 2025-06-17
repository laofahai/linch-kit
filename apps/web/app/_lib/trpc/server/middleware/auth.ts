import { cookies } from 'next/headers'
import { AuthManager, AuthStrategyType, SessionUser } from '@flex-report/auth'

let authManager: AuthManager | null = null

export async function getAuthManager(): Promise<AuthManager> {
  if (authManager) return authManager

  const strategy = process.env.NEXT_PUBLIC_AUTH_STRATEGY as AuthStrategyType
  authManager = await AuthManager.init(strategy)
  return authManager
}

// 获取当前会话用户
export async function getSessionUser(): Promise<SessionUser | null> {
  const manager = await getAuthManager()
  const cookiesData = await cookies()
  const sessionToken = cookiesData.get('sessionToken')?.value
  return manager.getSession(sessionToken)
}

// 检查权限
export async function checkPermission(resource: string): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) return false

  const manager = await getAuthManager()
  return manager.hasPermission(resource)
}
