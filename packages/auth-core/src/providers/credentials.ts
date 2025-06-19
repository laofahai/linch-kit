import CredentialsProvider from 'next-auth/providers/credentials'

import type { AuthUser } from '../types/auth'
import { authT } from '../i18n'

/**
 * 凭据认证选项
 */
export interface CredentialsOptions {
  /** 认证函数 */
  authorize: (credentials: Record<string, string>) => Promise<AuthUser | null>
  /** 凭据字段配置 */
  credentials?: Record<
    string,
    {
      label: string
      type: string
      placeholder?: string
    }
  >
  /** 提供者名称 */
  name?: string
  /** 提供者 ID */
  id?: string
}

/**
 * 创建凭据认证提供者
 */
export function createCredentialsProvider(options: CredentialsOptions) {
  return CredentialsProvider({
    id: options.id || 'credentials',
    name: options.name || authT('provider.credentials', {}, 'Credentials'),
    credentials: options.credentials || {
      email: {
        label: authT('signIn.email', {}, 'Email'),
        type: 'email',
        placeholder: authT('signIn.emailPlaceholder', {}, 'Enter your email'),
      },
      password: {
        label: authT('signIn.password', {}, 'Password'),
        type: 'password',
        placeholder: authT('signIn.passwordPlaceholder', {}, 'Enter your password'),
      },
    },
    async authorize(credentials) {
      try {
        return await options.authorize(credentials || {})
      } catch (error) {
        console.error('Credentials authentication error:', error)
        return null
      }
    },
  })
}

/**
 * 创建邮箱密码认证提供者
 */
export function createEmailPasswordProvider(
  authorize: (email: string, password: string) => Promise<AuthUser | null>
) {
  return createCredentialsProvider({
    id: 'email-password',
    name: authT('provider.emailPassword', {}, 'Email & Password'),
    credentials: {
      email: {
        label: authT('signIn.email', {}, 'Email'),
        type: 'email',
        placeholder: authT('signIn.emailPlaceholder', {}, 'Enter your email'),
      },
      password: {
        label: authT('signIn.password', {}, 'Password'),
        type: 'password',
        placeholder: authT('signIn.passwordPlaceholder', {}, 'Enter your password'),
      },
    },
    authorize: async credentials => {
      const { email, password } = credentials
      if (!email || !password) {
        throw new Error(authT('error.emailPasswordRequired', {}, 'Email and password are required'))
      }
      return await authorize(email, password)
    },
  })
}

/**
 * 创建手机号密码认证提供者
 */
export function createPhonePasswordProvider(
  authorize: (phone: string, password: string) => Promise<AuthUser | null>
) {
  return createCredentialsProvider({
    id: 'phone-password',
    name: authT('provider.phonePassword', {}, 'Phone & Password'),
    credentials: {
      phone: {
        label: authT('signIn.phone', {}, 'Phone'),
        type: 'tel',
        placeholder: authT('signIn.phonePlaceholder', {}, 'Enter your phone number'),
      },
      password: {
        label: authT('signIn.password', {}, 'Password'),
        type: 'password',
        placeholder: authT('signIn.passwordPlaceholder', {}, 'Enter your password'),
      },
    },
    authorize: async credentials => {
      const { phone, password } = credentials
      if (!phone || !password) {
        throw new Error(authT('error.phonePasswordRequired', {}, 'Phone and password are required'))
      }
      return await authorize(phone, password)
    },
  })
}

/**
 * 创建用户名密码认证提供者
 */
export function createUsernamePasswordProvider(
  authorize: (username: string, password: string) => Promise<AuthUser | null>
) {
  return createCredentialsProvider({
    id: 'username-password',
    name: authT('provider.usernamePassword', {}, 'Username & Password'),
    credentials: {
      username: {
        label: authT('signIn.username', {}, 'Username'),
        type: 'text',
        placeholder: authT('signIn.usernamePlaceholder', {}, 'Enter your username'),
      },
      password: {
        label: authT('signIn.password', {}, 'Password'),
        type: 'password',
        placeholder: authT('signIn.passwordPlaceholder', {}, 'Enter your password'),
      },
    },
    authorize: async credentials => {
      const { username, password } = credentials
      if (!username || !password) {
        throw new Error(
          authT('error.usernamePasswordRequired', {}, 'Username and password are required')
        )
      }
      return await authorize(username, password)
    },
  })
}

/**
 * 创建手机验证码认证提供者
 */
export function createPhoneCodeProvider(
  authorize: (phone: string, code: string) => Promise<AuthUser | null>
) {
  return createCredentialsProvider({
    id: 'phone-code',
    name: authT('provider.phoneCode', {}, 'Phone & Code'),
    credentials: {
      phone: {
        label: authT('signIn.phone', {}, 'Phone'),
        type: 'tel',
        placeholder: authT('signIn.phonePlaceholder', {}, 'Enter your phone number'),
      },
      code: {
        label: authT('signIn.verificationCode', {}, 'Verification Code'),
        type: 'text',
        placeholder: authT('signIn.codePlaceholder', {}, 'Enter verification code'),
      },
    },
    authorize: async credentials => {
      const { phone, code } = credentials
      if (!phone || !code) {
        throw new Error(
          authT('error.phoneCodeRequired', {}, 'Phone and verification code are required')
        )
      }
      return await authorize(phone, code)
    },
  })
}
