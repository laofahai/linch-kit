import { clerkClient } from '@clerk/clerk-sdk-node'

import type { AuthStrategy, SessionUser } from '../types'

export class ClerkStrategy implements AuthStrategy {
  async getSession(token?: string | null): Promise<SessionUser | null> {
    if (!token) return null
    try {
      const user = await clerkClient.users.getUser(token)
      return {
        id: user.id,
        username: user.username ?? '',
        email: user.emailAddresses[0]?.emailAddress ?? '',
        avatar: user.imageUrl ?? '',
        permissions: [],
        token,
      }
    } catch (e) {
      return null
    }
  }

  hasPermission(user: SessionUser | null, resource: string): boolean {
    // 示例：实际项目中可能需从 user.publicMetadata 或 roles 中判断
    return !!user
  }

  async login(): Promise<never> {
    throw new Error('Clerk strategy does not support direct login')
  }
}
