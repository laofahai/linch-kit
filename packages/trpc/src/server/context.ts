import { getSessionUser } from '@linch-kit/auth'
import type { User } from '@linch-kit/auth'

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
