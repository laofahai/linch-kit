import { DefaultSession, DefaultUser } from 'next-auth'
import 'next-auth'

export interface User extends DefaultUser {
  username: string
  mobile?: string
  permissions: string[]
  provider: 'shared-token' | 'clerk'
  sourceId?: string // 仅对 shared-token
  [key: string]: any
}

export interface Session extends DefaultSession {
  user: User
  error?: 'RefreshAccessTokenError' | 'InvalidToken' | 'SourceNotFound'
}

export interface JWT {
  id: string
  username: string
  name?: string | null
  email?: string | null
  permissions: string[]
  provider: 'shared-token' | 'clerk'
  sourceId?: string // 仅对 shared-token
}
