import NextAuth, { type NextAuthOptions } from 'next-auth'
import { sharedTokenProvider } from './providers/shared-token/provider'
// import ClerkProvider from 'next-auth/providers/clerk'
import { getAuthProviders } from './utils/env'

export const authOptions: NextAuthOptions = {
  providers: [],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // 首次登录
      if (user) {
        return {
          ...token,
          ...user,
        }
      }
      return token
    },
    async session({ session, token }) {
      // 将JWT中的信息传递到会话
      if (token.error) {
        // @ts-ignore
        session.error = token.error
      }

      return {
        ...session,
        user: {
          id: token.id,
          username: token.username,
          name: token.name,
          email: token.email,
          permissions: token.permissions,
          provider: token.provider,
          sourceId: token.sourceId,
        },
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  events: {
    async signOut({ token }) {
      // 登出时可能的清理操作
    },
  },
}

// 动态添加启用的提供者
export const initializeAuthProviders = () => {
  const providers = getAuthProviders()

  providers.forEach(providerId => {
    switch (providerId) {
      case 'shared-token':
        authOptions.providers.push(sharedTokenProvider)
        break
      case 'clerk':
        // authOptions.providers.push(
        //   ClerkProvider({
        //     clientId: process.env.CLERK_CLIENT_ID!,
        //     clientSecret: process.env.CLERK_SECRET_KEY!,
        //   })
        // )
        break
    }
  })

  return authOptions
}

// 初始化提供者
initializeAuthProviders()

// 导出配置好的NextAuth
export default NextAuth(authOptions)
