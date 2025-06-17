export interface AuthSource {
  id: string
  name: string
  loginUrl: string
}

/**
 * 登录组件上下文，提供给子组件使用
 */
export interface SignInContextType {
  /**
   * 是否正在加载
   */
  isLoading: boolean
  /**
   * 可用的认证提供者列表
   */
  providers: string[]
  /**
   * 可用的 SSO 源列表
   */
  ssoSources: AuthSource[]
  /**
   * 处理登录操作
   */
  handleSignIn: (providerId: string, options?: any) => Promise<void>
  /**
   * 重定向URL
   */
  redirectUrl: string
  /**
   * SSO 回调参数的名称
   */
  callbackParamName: string
}
