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
}: SSOCallbackHandlerProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      if (typeof window !== 'undefined') {
        try {
          const urlParams = new URLSearchParams(window.location.search)
          const token = urlParams.get('token')
          const sourceId = urlParams.get('sourceId')

          if (!token || !sourceId) {
            setStatus('error')
            setErrorMessage('Missing token or sourceId')
            return
          }

          // 使用token和sourceId进行登录
          const result = await signIn('shared-token', {
            token,
            sourceId,
            redirect: true,
            callbackUrl: redirectUrl,
          })

          if (result?.error) {
            setStatus('error')
            setErrorMessage(result.error)
          } else {
            setStatus('success')
          }
        } catch (error) {
          console.error('SSO callback error:', error)
          setStatus('error')
          setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred')
        }
      }
    }

    handleCallback()
  }, [redirectUrl])

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
