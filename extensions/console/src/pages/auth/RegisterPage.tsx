'use client'

/**
 * Console 注册页面
 * 集成@linch-kit/auth认证系统的注册功能
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@linch-kit/ui/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from '@linch-kit/ui/server'
import { Input } from '@linch-kit/ui/client'

export function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })

  const callbackUrl = searchParams.get('callbackUrl') || '/console'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 基础验证
      if (formData.password !== formData.confirmPassword) {
        throw new Error('密码不匹配')
      }

      if (!formData.acceptTerms) {
        throw new Error('请同意服务条款')
      }

      // TODO: 集成 @linch-kit/auth 的注册逻辑
      console.log('Register attempt:', { 
        name: formData.name, 
        email: formData.email, 
        callbackUrl 
      })
      
      // 模拟注册成功 - 稍后替换为真实的认证逻辑
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 注册成功后跳转到登录页面
      router.push(`/console/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } catch (error) {
      console.error('Registration failed:', error)
      // TODO: 显示错误信息
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'acceptTerms' ? e.target.checked : e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">注册 LinchKit Console</CardTitle>
              <CardDescription>
                创建账户以开始使用管理控制台
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="输入您的姓名"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    required
                    disabled={isLoading}
                  />
                </div>
                
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
                    placeholder="设置密码（至少8位）"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="再次输入密码"
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="terms"
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange('acceptTerms')}
                    required
                    disabled={isLoading}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    我同意
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 mx-1"
                      disabled={isLoading}
                    >
                      服务条款
                    </button>
                    和
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800 mx-1"
                      disabled={isLoading}
                    >
                      隐私政策
                    </button>
                  </Label>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? '创建中...' : '创建账户'}
                </Button>
                
                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                  已有账户？
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 ml-1"
                    onClick={() => router.push(`/console/auth?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
                    disabled={isLoading}
                  >
                    立即登录
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}