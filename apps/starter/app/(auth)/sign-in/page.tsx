'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const urlError = searchParams.get('error')

  useEffect(() => {
    if (urlError === 'token_expired') {
      setError('登录已过期，请重新登录')
    } else if (urlError === 'access_denied') {
      setError('访问被拒绝，权限不足')
    }
  }, [urlError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 登录成功，重定向到目标页面
        router.push(redirectTo)
      } else {
        // 登录失败，显示错误信息
        setError(data.message || '登录失败')
      }
    } catch (error) {
      console.error('登录请求失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* 右侧登录表单区 */}
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              输入您的邮箱和密码来访问您的账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@linchkit.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密码</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="admin123456"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <Separator className="my-4" />

            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link 
                href="/sign-up" 
                className="text-primary hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* 移动端品牌信息 */}
        <div className="lg:hidden mt-8 text-center">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">LinchKit</h2>
            <p className="text-sm text-muted-foreground">
              AI-First 全栈开发框架
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 items-center justify-center">
        <div className="max-w-md text-center space-y-6">
          {/* LinchKit 品牌区域 */}
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">L</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">LinchKit</h1>
            <p className="text-lg text-muted-foreground">
              AI-First 全栈开发框架
            </p>
          </div>
          
          {/* 产品价值主张 */}
          <div className="space-y-4">
            <div className="text-left space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Schema 驱动的端到端类型安全</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">企业级多租户架构</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">现代化 AI 集成能力</span>
              </div>
            </div>
          </div>

          {/* 版本信息 */}
          <div className="text-xs text-muted-foreground">
            Version 4.2.0 - 统一工作台架构
          </div>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Suspense fallback={<div>加载中...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}