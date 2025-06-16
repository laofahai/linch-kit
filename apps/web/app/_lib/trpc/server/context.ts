import { getSessionUser } from './middleware/auth'
import { AuthManager } from '@flex-report/auth'

export type Context = {
  user: Awaited<ReturnType<typeof getSessionUser>>
  authManager: AuthManager
}

export async function createContext(): Promise<Context> {
  const authManager = await AuthManager.init(process.env.AUTH_STRATEGY)
  const user = await getSessionUser()

  return {
    user,
    authManager,
  }
}
