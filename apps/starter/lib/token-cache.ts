/**
 * Token 缓存管理器
 * 提供客户端 Token 缓存和刷新机制
 */

import { Logger } from '@linch-kit/core'

interface CachedToken {
  token: string
  expiresAt: number
  userId: string
  userInfo: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

interface RefreshResult {
  success: boolean
  token?: string
  error?: string
}

class TokenCacheManager {
  private readonly CACHE_KEY = 'linchkit_user_token'
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000 // 5分钟

  /**
   * 获取缓存的 Token
   */
  getCachedToken(): CachedToken | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (!cached) return null

      const token = JSON.parse(cached) as CachedToken
      
      // 检查是否过期（增加1分钟缓冲时间，避免边界情况）
      const bufferTime = 60 * 1000 // 1分钟缓冲
      if (Date.now() >= token.expiresAt + bufferTime) {
        Logger.info('Token已过期，清除缓存', { 
          expiresAt: new Date(token.expiresAt).toISOString(),
          currentTime: new Date().toISOString()
        })
        this.clearToken()
        return null
      }

      return token
    } catch (error) {
      Logger.error('获取缓存Token失败', error instanceof Error ? error : new Error(String(error)))
      this.clearToken()
      return null
    }
  }

  /**
   * 设置 Token 缓存
   */
  setCachedToken(token: string, expiresIn: number, userInfo: CachedToken['userInfo']): void {
    try {
      const cachedToken: CachedToken = {
        token,
        expiresAt: Date.now() + expiresIn * 1000,
        userId: userInfo.id,
        userInfo
      }

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cachedToken))
      Logger.info('Token缓存已更新', { userId: userInfo.id })
    } catch (error) {
      Logger.error('设置Token缓存失败', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * 清除 Token 缓存
   */
  clearToken(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY)
      Logger.info('Token缓存已清除')
    } catch (error) {
      Logger.error('清除Token缓存失败', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * 检查 Token 是否需要刷新
   */
  shouldRefreshToken(): boolean {
    const cached = this.getCachedToken()
    if (!cached) return false

    const timeUntilExpiry = cached.expiresAt - Date.now()
    // 增加缓冲时间，避免误判（允许过期后1分钟内仍可用）
    const bufferTime = 60 * 1000 // 1分钟缓冲
    return timeUntilExpiry <= this.REFRESH_THRESHOLD && timeUntilExpiry > -bufferTime
  }

  /**
   * 刷新 Token
   */
  async refreshToken(): Promise<RefreshResult> {
    try {
      const cached = this.getCachedToken()
      if (!cached) {
        return { success: false, error: '没有可用的Token' }
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cached.token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        Logger.error('Token刷新失败', new Error(`HTTP ${response.status}: ${errorData.message || '刷新失败'}`))
        this.clearToken()
        return { success: false, error: errorData.message || '刷新失败' }
      }

      const data = await response.json()
      
      // 更新缓存
      this.setCachedToken(data.token, data.expiresIn, cached.userInfo)
      
      Logger.info('Token刷新成功', { userId: cached.userId })
      return { success: true, token: data.token }
    } catch (error) {
      Logger.error('Token刷新异常', error instanceof Error ? error : new Error(String(error)))
      this.clearToken()
      return { success: false, error: '网络错误' }
    }
  }

  /**
   * 获取有效的 Token（自动刷新）
   */
  async getValidToken(): Promise<string | null> {
    const cached = this.getCachedToken()
    if (!cached) return null

    // 如果需要刷新，则刷新 Token
    if (this.shouldRefreshToken()) {
      const result = await this.refreshToken()
      if (!result.success) {
        return null
      }
      return result.token || null
    }

    return cached.token
  }

  /**
   * 获取用户信息
   */
  getUserInfo(): CachedToken['userInfo'] | null {
    const cached = this.getCachedToken()
    return cached?.userInfo || null
  }

  /**
   * 检查用户是否登录
   */
  isAuthenticated(): boolean {
    return this.getCachedToken() !== null
  }

  /**
   * 检查用户是否有管理员权限
   */
  isAdmin(): boolean {
    const userInfo = this.getUserInfo()
    return userInfo?.role === 'TENANT_ADMIN' || userInfo?.role === 'SUPER_ADMIN'
  }

  /**
   * 检查用户是否有超级管理员权限
   */
  isSuperAdmin(): boolean {
    const userInfo = this.getUserInfo()
    return userInfo?.role === 'SUPER_ADMIN'
  }
}

// 导出单例实例
export const tokenCache = new TokenCacheManager()

// 导出类型
export type { CachedToken, RefreshResult }