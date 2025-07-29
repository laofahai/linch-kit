/**
 * 用户注册页面 - 完整的表单实现
 * 
 * 功能：
 * - 用户注册表单
 * - 表单验证和错误处理
 * - 与后端API集成
 * - 注册成功后跳转到登录页
 */

'use client'

import { AuthProvider } from '@linch-kit/auth/client'
import { Logger } from '@linch-kit/core/client'
import { Button } from '@linch-kit/ui/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

// 客户端日志实例  
const logger = Logger.child({ component: 'register-page' })

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validateForm = () => {
    const errors: {
      name?: string
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    // 姓名验证
    if (!formData.name) {
      errors.name = '请输入姓名'
    } else if (formData.name.length < 2) {
      errors.name = '姓名长度至少2位'
    }

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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])|(?=.*[a-z])(?=.*[0-9])|(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      errors.password = '密码应包含大小写字母或数字'
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      logger.info('开始用户注册', {
        action: 'register-start',
        email: formData.email.slice(0, 3) + '***',
        name: formData.name
      })

      // 调用注册API端点
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      const result = await response.json()

      if (result.success) {
        logger.info('用户注册成功', {
          action: 'register-success',
          userId: result.user?.id,
          email: formData.email.slice(0, 3) + '***'
        })
        
        setSuccess('注册成功！3秒后自动跳转到登录页面...')
        
        // 3秒后跳转到登录页面
        window.setTimeout(() => {
          router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        }, 3000)
      } else {
        logger.warn('用户注册失败', {
          action: 'register-failure',
          error: result.error,
          email: formData.email.slice(0, 3) + '***'
        })
        setError(result.error ?? '注册失败，请重试')
      }
    } catch (err) {
      logger.error('注册过程中出错', err instanceof Error ? err : undefined, {
        action: 'register-error',
        errorType: err instanceof Error ? err.constructor.name : 'Unknown'
      })
      setError('注册服务暂时不可用，请稍后再试')
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
              <CardTitle className="text-2xl">用户注册</CardTitle>
              <CardDescription>
                创建您的 LinchKit 账户
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { handleRegister(e).catch((error) => { Logger.error('Register error:', error) }) }} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    姓名
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="请输入您的姓名"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.name
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {validationErrors.name}
                    </p>
                  )}
                </div>

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

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    确认密码
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="请再次输入密码"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.confirmPassword
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                    disabled={isLoading}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit"
                  className="w-full" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? '正在注册...' : '注册'}
                </Button>
                
                {error && (
                  <div className="text-center text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-3 rounded-md">
                    {success}
                  </div>
                )}
              </form>
              
              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  已有账户？
                  <button
                    type="button"
                    onClick={() => { router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`); }}
                    className="ml-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    立即登录
                  </button>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  注册并登录后将跳转到: {callbackUrl}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterPageContent />
      </Suspense>
    </AuthProvider>
  )
}