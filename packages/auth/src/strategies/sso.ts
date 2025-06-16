import type { AuthStrategy, SessionUser } from '../types'

export class SSOStrategy implements AuthStrategy {
  async getSession(token?: string | null): Promise<SessionUser | null> {
    if (!token) return null
    try {
      if (!process.env.SSO_USERINFO_ENDPOINT) {
        throw new Error('SSO_USERINFO_ENDPOINT must be defined in environment variables')
      }

      const url = new URL(process.env.SSO_USERINFO_ENDPOINT)

      const data = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const raw = await data.json()
      return raw as SessionUser
    } catch {
      return null
    }
  }

  hasPermission(user: SessionUser | null, resource: string): boolean {
    if (!user) return false
    return user.permissions?.includes(`${resource}`) || false
  }

  async login(): Promise<never> {
    throw new Error('SSO strategy does not implement login')
  }
}
