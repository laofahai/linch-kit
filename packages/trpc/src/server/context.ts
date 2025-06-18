// 临时类型定义，等待 auth-core 集成
type AuthUser = {
  id: string
  name?: string | null
  email?: string | null
  [key: string]: any
}

// 基础上下文类型
export type Context = {
  user: AuthUser | null
  session?: any | null
  tenant?: string | null
}

// 创建上下文的选项
export interface CreateContextOptions {
  req?: any
  res?: any
}

// 基础上下文创建器
export async function createContext(opts?: CreateContextOptions): Promise<Context> {
  // 临时实现，后续会与 auth-core 集成
  const user = null // await getSessionUser(opts?.req)

  return {
    user,
    session: null,
    tenant: null
  }
}
