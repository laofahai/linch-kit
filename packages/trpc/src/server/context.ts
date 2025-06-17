import { getSessionUser } from '@flex-report/auth'
import type { User } from '@flex-report/auth'

// 明确定义 Context 类型，不再依赖 getSessionUser 的返回类型
export type Context = {
  user: User | null
}

export async function createContext(): Promise<Context> {
  const user = await getSessionUser()

  return {
    user,
  }
}
