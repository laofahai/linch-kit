'use client'

import { LoadingOverlay } from '@/components/loading-overlay'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Github, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    setError('')
    setIsSubmitting(true)
    
    try {
      // 使用 NextAuth.js 的 signIn 函数
      const { signIn } = await import('next-auth/react')
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        setError('登录失败，请检查邮箱和密码')
        setIsSubmitting(false)
      } else if (result?.ok) {
        // 登录成功，显示全页loading并跳转
        setIsLoading(true)
        router.push(redirectTo)
      } else {
        setError('登录失败，请稍后重试')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('登录请求失败:', error)
      setError('网络错误，请稍后重试')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <LoadingOverlay isVisible={isLoading} message="正在登录" showProgress={true} />
      {/* 右侧登录表单区 */}
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight">欢迎回来</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              输入您的邮箱和密码登录账户
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting || isLoading}
                  className="h-10"
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    忘记密码？
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting || isLoading}
                  className="h-10"
                  autoComplete="current-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-10" 
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  或继续使用
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" type="button" disabled={isSubmitting || isLoading} className="h-10">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button variant="outline" type="button" disabled={isSubmitting || isLoading} className="h-10">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              还没有账户？{' '}
              <Link 
                href="/sign-up" 
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                立即注册
              </Link>
            </p>

            <p className="text-center text-xs text-muted-foreground">
              点击继续即表示您同意我们的{' '}
              <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
                服务条款
              </Link>{' '}
              和{' '}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                隐私政策
              </Link>
              。
            </p>
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
      {/* 左侧渐变背景区 */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background"></div>
        
        {/* 网格背景 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* 装饰性图形 */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-1 flex-col justify-between p-12">
          {/* Logo 和品牌 */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-primary-foreground">L</span>
            </div>
            <span className="text-xl font-semibold">LinchKit</span>
          </Link>
          
          {/* 中心内容 */}
          <div className="mx-auto max-w-lg space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight leading-tight">
                构建智能未来
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  AI-First 全栈开发框架
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Schema 驱动 · 智能原生 · 企业级
                <br />
                让开发者专注创造价值
              </p>
            </div>
            
            {/* 装饰性元素 */}
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 ring-2 ring-background"></div>
                <div className="h-8 w-8 rounded-full bg-primary/40 ring-2 ring-background"></div>
                <div className="h-8 w-8 rounded-full bg-primary/60 ring-2 ring-background"></div>
              </div>
            </div>
          </div>
          
          {/* 底部信息 */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>© 2025 LinchKit. All rights reserved.</p>
            <p>v4.2.0 · 生产就绪</p>
          </div>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {/* 移动端 Logo */}
        <Link href="/" className="mb-8 flex items-center space-x-3 lg:hidden hover:opacity-80 transition-opacity">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">L</span>
          </div>
          <span className="text-xl font-semibold">LinchKit</span>
        </Link>
        
        <Suspense fallback={
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">加载中...</span>
          </div>
        }>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}