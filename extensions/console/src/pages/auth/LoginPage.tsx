'use client'

/**
 * Console 登录页面
 * 集成@linch-kit/auth认证系统的完整UI实现
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@linch-kit/ui/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from '@linch-kit/ui/server'
import { Input } from '@linch-kit/ui/client'

import { consoleAuthService } from '../../services/auth.service'

export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })
  const [error, setError] = useState<string | null>(null)

  const callbackUrl = searchParams.get('callbackUrl') || '/console'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await consoleAuthService.login({
        email: formData.email,
        password: formData.password,
      })

      if (result.success) {
        // 登录成功后跳转到回调URL
        router.push(callbackUrl)
      } else {
        setError(result.error || '登录失败')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setError('登录过程中发生错误')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'remember' ? e.target.checked : e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">登录 LinchKit Console</CardTitle>
              <CardDescription>
                使用您的账户信息登录管理控制台
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="输入您的邮箱地址"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="输入您的密码"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="rounded border-slate-300"
                      checked={formData.remember}
                      onChange={handleInputChange('remember')}
                      disabled={isLoading}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">
                      记住我
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800"
                    disabled={isLoading}
                  >
                    忘记密码？
                  </button>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
                
                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                  还没有账户？
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 ml-1"
                    onClick={() => router.push(`/console/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
                    disabled={isLoading}
                  >
                    立即注册
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 font-medium">演示账户</p>
                  <p className="text-xs text-blue-600 mt-1">
                    管理员: admin@linchkit.com / admin123<br />
                    用户: user@linchkit.com / user123
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}