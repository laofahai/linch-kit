import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

// 临时类型定义，直到 auth-core 包构建完成
interface AuthUser {
  id: string
  name?: string
  email?: string
  image?: string
  role?: string
  permissions?: string[]
}

const authConfig: NextAuthOptions = {
  providers: [
    // Google OAuth 提供商
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    // 邮箱密码登录
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 这里应该验证用户凭据
        // 返回用户对象或 null
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // 临时示例 - 实际应用中应该验证数据库
        if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
          return {
            id: '1',
            name: 'Admin User',
            email: credentials.email,
            role: 'admin',
            permissions: ['read', 'write', 'delete']
          }
        }

        return null
      }
    })
  ],

  // 会话配置
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60   // 24 hours
  },

  // NextAuth 特定配置
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  // 回调配置
  callbacks: {
    // JWT 回调
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.role = (user as AuthUser).role
        token.permissions = (user as AuthUser).permissions
      }
      return token
    },

    // 会话回调
    async session({ session, token }) {
      if (token) {
        (session.user as AuthUser).id = token.id as string
        (session.user as AuthUser).role = token.role as string
        (session.user as AuthUser).permissions = token.permissions as string[]
      }
      return session
    }
  },

  // 页面配置
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error'
  },

  // 调试模式
  debug: process.env.NODE_ENV === 'development'
}

export default authConfig
