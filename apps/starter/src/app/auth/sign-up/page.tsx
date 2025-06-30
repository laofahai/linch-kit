'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, Brain, Loader2, Github, Mail, Sparkles, UserPlus } from 'lucide-react'

import { Button } from '@linch-kit/ui/components'
import { Input } from '@linch-kit/ui/components'
import { Label } from '@linch-kit/ui/components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/components'
import { Alert, AlertDescription } from '@linch-kit/ui/components'
import { Separator } from '@linch-kit/ui/components'
// import { Checkbox } from '@linch-kit/ui/components'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const signUpSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少8位'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val, '请同意服务条款'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密码不匹配",
  path: ["confirmPassword"],
})

type SignUpForm = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const t = useTranslations('auth.signup')
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  })

  const handleSocialSignUp = async (provider: string) => {
    setIsLoading(true)
    try {
      // 在实际应用中，这里调用社交媒体注册
      console.log(`Signing up with ${provider}`)
      // await signIn(provider, { callbackUrl: '/dashboard' })
    } catch (err) {
      setError('注册失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // 模拟注册API调用
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      if (response.ok) {
        setSuccess('注册成功！请查收验证邮件。')
        setTimeout(() => {
          router.push('/auth/sign-in')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || '注册失败，请稍后重试')
      }
    } catch (err) {
      setError('注册失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      {/* Header with theme toggle */}
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and branding */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Brain className="h-8 w-8 text-primary-foreground" />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                LinchKit
              </h1>
              <div className="flex items-center justify-center space-x-1 mt-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground font-medium">AI-First 开发平台</p>
              </div>
            </div>
          </div>

          {/* Auth card */}
          <Card className="w-full border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                加入 LinchKit
              </CardTitle>
              <CardDescription>
                创建您的 AI-First 开发账户
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}

              {/* 社交注册 */}
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleSocialSignUp('github')}
                  disabled={isLoading}
                  className="w-full h-11 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  <Github className="mr-2 h-4 w-4" />
                  使用 GitHub 注册
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleSocialSignUp('google')}
                  disabled={isLoading}
                  className="w-full h-11 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  使用 Google 注册
                </Button>
              </div>

              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground font-medium">
                    或使用邮箱注册
                  </span>
                </div>
              </div>

              {/* 注册表单 */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">姓名</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="张三"
                    className={`h-11 ${errors.name ? 'border-destructive' : ''}`}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">邮箱地址</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com"
                    className={`h-11 ${errors.email ? 'border-destructive' : ''}`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="至少8位密码"
                      className={`h-11 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                      {...register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">确认密码</Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="再次输入密码"
                      className={`h-11 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      {...register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    className="h-4 w-4 rounded border border-input"
                    {...register('acceptTerms')}
                  />
                  <Label 
                    htmlFor="acceptTerms" 
                    className={`text-sm ${errors.acceptTerms ? 'text-destructive' : ''}`}
                  >
                    我同意{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      服务条款
                    </Link>
                    {' '}和{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      隐私政策
                    </Link>
                  </Label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
                )}
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md transition-all duration-200 hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      注册中...
                    </>
                  ) : (
                    '创建账户'
                  )}
                </Button>
              </form>

              <div className="text-center text-sm">
                <div className="text-muted-foreground">
                  已有账户？{' '}
                  <Link href="/auth/sign-in" className="text-primary hover:underline transition-colors font-medium">
                    立即登录
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p>© 2024 LinchKit. 基于 AI-First 架构构建.</p>
          </div>
        </div>
      </div>
    </div>
  )
}