/**
 * 认证页面 - 使用@linch-kit/auth包的AuthService接口
 * 
 * 实现依赖反转原则：
 * - 基于IAuthService接口进行认证
 * - 支持功能开关（Mock/JWT实现切换）
 * - 提供稳定的认证体验
 */

'use client'

import { AuthProvider } from '@linch-kit/auth/client'
import { Logger } from '@linch-kit/core/client'
import { Button } from '@linch-kit/ui/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

// 客户端日志实例  
const logger = Logger.child({ component: 'auth-page' })

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 调用登录API端点
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      const result = await response.json()

      if (result.success && result.tokens) {
        logger.info('用户登录成功', {
          action: 'login',
          userId: result.user?.id,
          callbackUrl
        })
        
        // 设置认证Cookie
        document.cookie = `session=${result.tokens.accessToken}; path=/; max-age=3600`
        
        // 跳转到回调URL
        router.push(callbackUrl)
      } else {
        logger.warn('用户登录失败', {
          action: 'login',
          error: result.error,
          callbackUrl
        })
        setError(result.error ?? '认证失败')
      }
    } catch (err) {
      logger.error('认证过程中出错', err instanceof Error ? err : undefined, {
        action: 'login',
        callbackUrl,
        errorType: err instanceof Error ? err.constructor.name : 'Unknown'
      })
      setError('认证系统暂时不可用，请稍后再试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">LinchKit 认证</CardTitle>
              <CardDescription>
                登录到 LinchKit 平台
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => {
                  handleLogin().catch(() => {
                    // Error is handled within handleLogin
                  })
                }}
                disabled={isLoading}
              >
                {isLoading ? '正在登录...' : '登录'}
              </Button>
              
              {error && (
                <div className="text-center text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                <p>正在使用 @linch-kit/auth AuthService</p>
                <p className="mt-1">认证成功后将跳转到: {callbackUrl}</p>
                <p className="mt-1 text-xs">
                  功能开关: JWT认证 (可回退至Mock)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthPageContent />
      </Suspense>
    </AuthProvider>
  )
}