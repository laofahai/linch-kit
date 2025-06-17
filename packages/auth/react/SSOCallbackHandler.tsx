'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'

export interface SSOCallbackHandlerProps {
  /**
   * 登录成功后重定向的URL
   */
  redirectUrl?: string

  /**
   * 发生错误时重定向的URL
   */
  errorRedirectUrl?: string

  /**
   * 自定义加载状态渲染
   */
  renderLoading?: () => React.ReactNode

  /**
   * 自定义错误状态渲染
   */
  renderError?: (error: string, goToSignIn: () => void) => React.ReactNode

  /**
   * 自定义成功状态渲染
   */
  renderSuccess?: () => React.ReactNode

  /**
   * 自定义类名
   */
  className?: string

  /**
   * Token 参数名称，默认查找 'token' 或 'sign_in_token'
   */
  tokenParamName?: string | string[]

  /**
   * 提供者 ID 参数名称，默认查找 'sourceId' 或 'providerId'
   */
  providerIdParamName?: string | string[]

  /**
   * 默认提供者 ID，当 URL 中没有提供时使用
   */
  defaultProviderId?: string
}

/**
 * 用于SSO回调的组件，处理token和回调逻辑
 * 将此组件放置在SSO回调页面中，它会自动处理URL参数中的token和sourceId
 */
export function SSOCallbackHandler({
  redirectUrl = '/account',
  errorRedirectUrl = '/account/sign-in',
  renderLoading = () => (
    <div>
      <h2>处理登录中...</h2>
      <p>请稍候，正在验证您的登录信息</p>
    </div>
  ),
  renderError = (errorMessage, goToSignIn) => (
    <div>
      <h2>认证错误</h2>
      <p>{errorMessage || '认证过程中发生错误'}</p>
      <button onClick={goToSignIn}>返回登录页面</button>
    </div>
  ),
  renderSuccess = () => (
    <div>
      <h2>登录成功!</h2>
      <p>正在为您重定向到应用...</p>
    </div>
  ),
  className = '',
  tokenParamName = ['token', 'sign_in_token'],
  providerIdParamName = ['sourceId', 'providerId'],
  defaultProviderId = 'sso',
}: SSOCallbackHandlerProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      if (typeof window !== 'undefined') {
        try {
          const urlParams = new URLSearchParams(window.location.search)

          // 检查可能的 token 参数
          let token: string | null = null
          const tokenNames = Array.isArray(tokenParamName) ? tokenParamName : [tokenParamName]
          for (const name of tokenNames) {
            const value = urlParams.get(name)
            if (value) {
              token = value
              break
            }
          }

          if (!token) {
            setStatus('error')
            setErrorMessage('未找到有效的认证令牌')
            return
          }

          // 检查可能的提供者 ID 参数
          let providerId: string | null = null
          const providerIdNames = Array.isArray(providerIdParamName)
            ? providerIdParamName
            : [providerIdParamName]
          for (const name of providerIdNames) {
            const value = urlParams.get(name)
            if (value) {
              providerId = value
              break
            }
          }

          // 如果 URL 中没有提供者 ID，使用默认值
          const effectiveProviderId = providerId || defaultProviderId

          console.log(`SSO Callback: Using token with providerId: ${effectiveProviderId}`)

          // 使用 token 和 providerId 进行登录
          const result = await signIn('shared-token', {
            token,
            sourceId: effectiveProviderId, // sharedTokenProvider 期望的参数名是 sourceId
            redirect: false,
            callbackUrl: redirectUrl,
          })

          console.log(result, redirectUrl)

          if (result?.error) {
            console.error(`SSO login error: ${result.error}`)
            setStatus('error')
            setErrorMessage(result.error)
          } else if (result?.url) {
            // 登录成功，等待一秒后重定向，以便用户看到成功消息
            setStatus('success')
            setTimeout(() => {
              window.location.href = result.url!
            }, 1000)
          } else {
            setStatus('success')
            setTimeout(() => {
              window.location.href = redirectUrl
            }, 1000)
          }
        } catch (error) {
          console.error('SSO callback error:', error)
          setStatus('error')
          setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred')
        }
      }
    }

    handleCallback()
  }, [redirectUrl, tokenParamName, providerIdParamName, defaultProviderId])

  const goToSignIn = () => {
    window.location.href = errorRedirectUrl
  }

  return (
    <div className={className}>
      {status === 'loading' && renderLoading()}
      {status === 'error' && renderError(errorMessage, goToSignIn)}
      {status === 'success' && renderSuccess()}
    </div>
  )
}

export default SSOCallbackHandler
