import { NextAuth, createLinchKitAuthConfig } from '@linch-kit/auth'
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from '@/lib/prisma'

// 使用 LinchKit 认证适配器创建配置
const authConfig = createLinchKitAuthConfig({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    credentials: {
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string
          }
        })

        if (!user) {
          return null
        }

        // TODO: 在实际应用中，这里应该验证密码哈希
        // const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        // if (!isPasswordValid) {
        //   return null
        // }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: null, // User model doesn't have image field
        }
      }
    }
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/sign-in',
    error: '/auth/error',
  },
  callbacks: {
    extendSession: async (session, token) => {
      // LinchKit 企业级会话扩展
      if (token.sub && session.user) {
        (session.user as any).id = token.sub
      }
      return session
    },
    extendJWT: async (token, user) => {
      // LinchKit 企业级 JWT 扩展
      if (user?.id) {
        token.sub = user.id
      }
      return token
    }
  },
  events: {
    onSignIn: async ({ user, account, profile }) => {
      // LinchKit 企业级登录事件
      console.log('User signed in:', { userId: user.id, provider: account?.provider })
    },
    onSignOut: async ({ session, token }) => {
      // LinchKit 企业级登出事件
      console.log('User signed out:', { userId: session?.user?.id || token?.sub })
    }
  },
  debug: process.env.NODE_ENV === 'development',
})

// 添加 Prisma 适配器
const configWithAdapter = {
  ...authConfig,
  adapter: PrismaAdapter(prisma),
}

const handler = NextAuth(configWithAdapter)

export { handler as GET, handler as POST }