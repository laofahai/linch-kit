/**
 * Token 缓存 React Hook
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession, getSession } from 'next-auth/react'
import { tokenCache, type CachedToken } from '@/lib/token-cache'
import { Logger } from '@linch-kit/core'

interface UseTokenCacheReturn {
  /** 缓存的用户信息 */
  cachedUser: CachedToken['userInfo'] | null
  /** 是否已登录 */
  isAuthenticated: boolean
  /** 是否是管理员 */
  isAdmin: boolean
  /** 是否是超级管理员 */
  isSuperAdmin: boolean
  /** 获取有效Token */
  getValidToken: () => Promise<string | null>
  /** 刷新Token */
  refreshToken: () => Promise<boolean>
  /** 清除Token缓存 */
  clearCache: () => void
  /** 更新Token缓存 */
  updateCache: (token: string, expiresIn: number, userInfo: CachedToken['userInfo']) => void
  /** 恢复用户会话 */
  recoverSession: () => Promise<boolean>
}

export function useTokenCache(): UseTokenCacheReturn {
  const { data: session, status } = useSession()
  const [cachedUser, setCachedUser] = useState<CachedToken['userInfo'] | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 同步缓存状态
  const syncCacheState = useCallback(() => {
    const userInfo = tokenCache.getUserInfo()
    const authenticated = tokenCache.isAuthenticated()

    setCachedUser(userInfo)
    setIsAuthenticated(authenticated)
  }, [])

  // 恢复用户会话
  const recoverSession = useCallback(async (): Promise<boolean> => {
    try {
      Logger.info('尝试恢复用户会话')

      // 尝试从 NextAuth 获取最新会话
      const newSession = await getSession()

      if (newSession?.user) {
        const userInfo = {
          id: newSession.user.id || '',
          email: newSession.user.email || '',
          name: newSession.user.name || null,
          role: (newSession as { user: { roles?: string[] } }).user.roles?.[0] || 'USER',
        }

        // 重新生成 Token 缓存
        const tempToken = btoa(
          JSON.stringify({
            userId: userInfo.id,
            email: userInfo.email,
            role: userInfo.role,
            exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            iat: Math.floor(Date.now() / 1000),
          })
        )

        tokenCache.setCachedToken(tempToken, 30 * 24 * 60 * 60, userInfo)
        syncCacheState()

        Logger.info('用户会话恢复成功', { userId: userInfo.id })
        return true
      }

      Logger.warn('无法恢复用户会话：没有有效的会话数据')
      return false
    } catch (error) {
      Logger.error('用户会话恢复失败', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }, [syncCacheState])

  // 初始化和会话状态变化时同步
  useEffect(() => {
    // 优先从缓存中获取状态
    syncCacheState()

    // 延迟同步，确保 NextAuth session 完全加载
    const syncTimer = setTimeout(async () => {
      // 如果会话存在且有用户信息，更新缓存
      if (status === 'authenticated' && session?.user) {
        const userInfo = {
          id: session.user.id || '',
          email: session.user.email || '',
          name: session.user.name || null,
          role: (session as { user: { roles?: string[] } }).user.roles?.[0] || 'USER',
        }

        // 检查是否需要更新缓存
        const cached = tokenCache.getCachedToken()
        if (!cached || cached.userId !== userInfo.id) {
          // 生成临时token（在实际应用中，这应该从后端获取）
          const tempToken = btoa(
            JSON.stringify({
              userId: userInfo.id,
              email: userInfo.email,
              role: userInfo.role,
              exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
              iat: Math.floor(Date.now() / 1000),
            })
          )

          tokenCache.setCachedToken(tempToken, 30 * 24 * 60 * 60, userInfo)
          syncCacheState()
        }

        Logger.info('Token缓存状态同步完成', {
          userId: userInfo.id,
          hasSession: !!session,
          hasCachedToken: !!cached,
        })
      }

      // 如果 NextAuth 状态为 loading，但本地有缓存，尝试恢复会话
      if (status === 'loading' && tokenCache.getCachedToken()) {
        Logger.info('检测到本地缓存，尝试恢复会话')
        const recovered = await recoverSession()
        if (!recovered) {
          Logger.warn('会话恢复失败，将清除本地缓存')
          tokenCache.clearToken()
          syncCacheState()
        }
      }

      // 如果会话被清除，清理缓存
      if (status === 'unauthenticated') {
        tokenCache.clearToken()
        syncCacheState()
        Logger.info('用户会话已清除，缓存已清理')
      }
    }, 100) // 100ms 延迟确保 NextAuth 状态稳定

    return () => clearTimeout(syncTimer)
  }, [session, status, syncCacheState, recoverSession])

  // 获取有效Token
  const getValidToken = useCallback(async (): Promise<string | null> => {
    try {
      return await tokenCache.getValidToken()
    } catch (error) {
      Logger.error('获取有效Token失败', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }, [])

  // 刷新Token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const result = await tokenCache.refreshToken()
      if (result.success) {
        syncCacheState()
        return true
      }
      return false
    } catch (error) {
      Logger.error('刷新Token失败', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }, [syncCacheState])

  // 清除缓存
  const clearCache = useCallback(() => {
    tokenCache.clearToken()
    syncCacheState()
  }, [syncCacheState])

  // 更新缓存
  const updateCache = useCallback(
    (token: string, expiresIn: number, userInfo: CachedToken['userInfo']) => {
      tokenCache.setCachedToken(token, expiresIn, userInfo)
      syncCacheState()
    },
    [syncCacheState]
  )

  return {
    cachedUser,
    isAuthenticated,
    isAdmin: tokenCache.isAdmin(),
    isSuperAdmin: tokenCache.isSuperAdmin(),
    getValidToken,
    refreshToken,
    clearCache,
    updateCache,
    recoverSession,
  }
}
