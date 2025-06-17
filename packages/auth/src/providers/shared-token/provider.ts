import CredentialsProvider from 'next-auth/providers/credentials'
import { loadSharedTokenSources } from '../../utils/env'

export const sharedTokenProvider = CredentialsProvider({
  id: 'shared-token',
  name: 'Shared Token',
  credentials: {
    token: { label: 'Token', type: 'text' },
    sourceId: { label: 'Source ID', type: 'text' },
  },
  async authorize(credentials) {
    const sharedTokenSources = loadSharedTokenSources()

    if (!credentials?.token) {
      throw new Error('Token is required')
    }

    const source = sharedTokenSources.find(s => s.id === credentials.sourceId)

    if (!source) {
      throw new Error('Invalid shared token source')
    }

    try {
      const res = await fetch(source.userInfoUrl, {
        headers: { Authorization: `Bearer ${credentials.token}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          console.error('Token认证失败：无效的token')
          // 返回专门的错误对象，而不是抛出异常
          return null
        }
        console.error(`API请求失败，状态码: ${res.status}`)
        return null
      }

      const userInfo = await res.json()

      // 验证基本用户信息
      if (!userInfo?.id) {
        console.error('无效的用户信息响应：缺少用户ID')
        return null
      }

      return {
        ...userInfo,
        provider: 'shared-token',
        sourceId: credentials.sourceId,
      }
    } catch (error) {
      // 记录详细的错误信息，便于调试
      console.error('SSO认证处理错误:', {
        sourceId: credentials.sourceId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return null
    }
  },
})
