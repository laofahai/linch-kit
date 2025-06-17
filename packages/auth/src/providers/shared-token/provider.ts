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
          throw new Error('Unauthorized: Invalid token')
        }
        throw new Error(`API request failed with status ${res.status}`)
      }

      const userInfo = await res.json()

      // 验证基本用户信息
      if (!userInfo?.id) {
        throw new Error('Invalid user info response')
      }

      return {
        ...userInfo,
        provider: 'shared-token',
        sourceId: credentials.sourceId,
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  },
})
