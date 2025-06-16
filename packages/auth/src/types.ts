export type AuthStrategyType = NodeJS.ProcessEnv['AUTH_STRATEGY']

export interface SessionUser {
  id: string
  username: string
  avatar?: string
  email?: string
  mobile?: string
  permissions: string[]
  [key: string]: any
}

export interface AuthStrategy {
  /**
   * 根据传入的 token 或凭证获取当前用户 Session 信息
   */
  getSession(token?: string | null): Promise<SessionUser | null>

  /**
   * 登录，返回认证后的用户信息和 token 等
   */
  login?(credentials: any): Promise<{ user: SessionUser; token: string } | null>

  /**
   * 判断用户是否有权限
   */
  hasPermission(user: SessionUser | null, resource: string): boolean

  /**
   * （可选）刷新 Session 或 Token
   */
  refreshSession?(token: string): Promise<SessionUser | null>
}
