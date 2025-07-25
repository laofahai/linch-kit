/**
 * 用户登录页面 - 完整的表单实现
 * 
 * 功能：
 * - 用户名密码登录表单
 * - 表单验证和错误处理
 * - 与后端API集成
 * - 登录成功后跳转
 */

'use client'

import { AuthProvider } from '@linch-kit/auth/client'
import { Logger } from '@linch-kit/core/client'
import { Button } from '@linch-kit/ui/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

// 客户端日志实例  
const logger = Logger.child({ component: 'login-page' })

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {}

    // 邮箱验证
    if (!formData.email) {
      errors.email = '请输入邮箱'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '邮箱格式不正确'
    }

    // 密码验证
    if (!formData.password) {
      errors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      errors.password = '密码长度至少6位'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 清除字段错误
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      logger.info('开始用户登录', {
        action: 'login-start',
        email: formData.email.slice(0, 3) + '***',
        callbackUrl
      })

      // 调用登录API端点
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const result = await response.json()

      if (result.success && result.tokens) {
        logger.info('用户登录成功', {
          action: 'login-success',
          userId: result.user?.id,
          callbackUrl
        })
        
        // 设置认证Cookie
        document.cookie = `session=${result.tokens.accessToken}; path=/; max-age=3600; secure; samesite=strict`
        
        // 跳转到回调URL
        router.push(callbackUrl)
      } else {
        logger.warn('用户登录失败', {
          action: 'login-failure',
          error: result.error,
          callbackUrl
        })
        setError(result.error ?? '登录失败，请检查邮箱和密码')
      }
    } catch (err) {
      logger.error('登录过程中出错', err instanceof Error ? err : undefined, {
        action: 'login-error',
        callbackUrl,
        errorType: err instanceof Error ? err.constructor.name : 'Unknown'
      })
      setError('登录服务暂时不可用，请稍后再试')
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
              <CardTitle className="text-2xl">用户登录</CardTitle>
              <CardDescription>
                请输入您的邮箱和密码登录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    邮箱
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入邮箱"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.email
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    密码
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="请输入密码"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.password
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit"
                  className="w-full" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? '正在登录...' : '登录'}
                </Button>
                
                {error && (
                  <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-md">
                    {error}
                  </div>
                )}
              </form>
              
              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  还没有账户？
                  <button
                    type="button"
                    onClick={() => router.push(`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
                    className="ml-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    立即注册
                  </button>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  登录成功后将跳转到: {callbackUrl}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginPageContent />
      </Suspense>
    </AuthProvider>
  )
}