'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { signIn } from 'next-auth/react'
import { redirectToSSO } from './sso'
import { AuthSource, SignInContextType } from './types'

// 创建登录组件上下文
const SignInContext = createContext<SignInContextType | null>(null)

/**
 * 获取登录组件上下文
 */
export function useSignIn() {
  const context = useContext(SignInContext)
  if (!context) {
    throw new Error('useSignIn must be used within a SignInProvider')
  }
  return context
}

export interface SignInProviderProps {
  /**
   * 重定向URL，登录成功后跳转到的地址
   */
  redirectUrl?: string
  /**
   * 是否在只有一个SSO提供者时自动跳转
   */
  autoRedirectIfSingleProvider?: boolean
  /**
   * SSO 提供者列表，由服务器端传入
   */
  ssoSources?: AuthSource[]
  /**
   * 可用的认证提供者，由服务器端传入
   */
  availableProviders?: string[]
  /**
   * SSO 回调参数的名称，默认为 callbackUrl
   */
  callbackParamName?: string
  /**
   * 子组件
   */
  children: React.ReactNode
}

/**
 * 认证提供者组件 - 提供认证状态和方法，不处理 UI 渲染
 */
export function SignInProvider({
  redirectUrl = '/account/sso-callback',
  autoRedirectIfSingleProvider = true,
  ssoSources = [],
  availableProviders = [],
  callbackParamName = 'callbackUrl',
  children,
}: SignInProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [providers, setProviders] = useState<string[]>(availableProviders)

  useEffect(() => {
    const initializeSignIn = async () => {
      setIsLoading(true)
      try {
        // 传入的可用认证提供者为空时，回退到客户端环境变量检测
        let detectedProviders = availableProviders
        if (detectedProviders.length === 0 && typeof window !== 'undefined') {
          const clientProviders: string[] = []
          if (process.env.NEXT_PUBLIC_AUTH_CLERK_ENABLED === 'true') {
            clientProviders.push('clerk')
          }

          if (process.env.NEXT_PUBLIC_AUTH_SHARED_TOKEN_ENABLED === 'true') {
            clientProviders.push('shared-token')
          }
          detectedProviders = clientProviders
        }

        setProviders(detectedProviders)

        // 只有一个SSO提供者时自动重定向
        if (
          autoRedirectIfSingleProvider &&
          detectedProviders.includes('shared-token') &&
          detectedProviders.length === 1 &&
          ssoSources.length === 1
        ) {
          // 直接传入 SSO source 对象，自动获取 providerId
          redirectToSSO(ssoSources[0], redirectUrl, {
            callbackParamName,
          })
          return
        }
      } catch (error) {
        console.error('Failed to initialize sign-in', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSignIn()
  }, [autoRedirectIfSingleProvider, ssoSources, availableProviders, redirectUrl, callbackParamName])

  const handleSignIn = async (providerId: string, options?: any) => {
    try {
      await signIn(providerId, {
        callbackUrl: redirectUrl,
        ...options,
      })
    } catch (error) {
      console.error(`Error signing in with ${providerId}`, error)
    }
  }

  // 构建上下文值
  const contextValue: SignInContextType = {
    isLoading,
    providers,
    ssoSources,
    handleSignIn,
    redirectUrl,
    callbackParamName,
  }

  return <SignInContext.Provider value={contextValue}>{children}</SignInContext.Provider>
}

/**
 * 用于 SSO 登录的按钮
 */
export function SSOSignInButton({
  source,
  className = '',
  children,
}: {
  source: AuthSource
  className?: string
  children?: React.ReactNode
}) {
  const { redirectUrl, callbackParamName } = useSignIn()
  return (
    <button
      className={className}
      onClick={() => redirectToSSO(source, redirectUrl, { callbackParamName })}
    >
      {children || `Sign in with ${source.name}`}
    </button>
  )
}

/**
 * 用于 Clerk 登录的按钮
 */
export function ClerkSignInButton({
  className = '',
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  const { handleSignIn } = useSignIn()

  return (
    <button className={className} onClick={() => handleSignIn('clerk')}>
      {children || 'Sign in with Clerk'}
    </button>
  )
}

// 为了保持向后兼容，保留原来的组件名，但它现在只是 SignInProvider 的别名
export const SignInComponent = SignInProvider

export default SignInProvider
