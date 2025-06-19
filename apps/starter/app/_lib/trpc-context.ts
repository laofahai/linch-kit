import { getServerSession } from 'next-auth'
import authConfig from '../../auth.config'

export async function createContext({ req }: { req: Request }) {
  // NextAuth 的 getServerSession 需要 NextAuthOptions 类型
  const session = await getServerSession(authConfig)

  return {
    session,
    user: session?.user || null,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
