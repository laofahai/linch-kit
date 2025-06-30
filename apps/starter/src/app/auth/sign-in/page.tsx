'use client'

import React from 'react'
import { Button } from '@linch-kit/ui/components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/components'
import { Input } from '@linch-kit/ui/components'
import { Label } from '@linch-kit/ui/components'
import { Separator } from '@linch-kit/ui/components'
import { Github, Mail, Brain, Sparkles } from 'lucide-react'

import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function SignInPage() {
  const handleSignIn = (provider: string) => {
    // 模拟登录流程
    console.log(`Signing in with ${provider}`)
    // 在实际应用中，这里会调用 NextAuth 或其他认证服务
    window.location.href = '/admin'
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
              <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
              <CardDescription>
                登录到 LinchKit AI 管理控制台
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 社交登录 */}
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleSignIn('github')}
                  className="w-full h-11 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  <Github className="mr-2 h-4 w-4" />
                  使用 GitHub 登录
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleSignIn('google')}
                  className="w-full h-11 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  使用 Google 登录
                </Button>
              </div>

              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground font-medium">
                    或使用邮箱登录
                  </span>
                </div>
              </div>

              {/* 邮箱登录表单 */}
              <form onSubmit={(e) => {
                e.preventDefault()
                handleSignIn('email')
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">邮箱地址</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com"
                    className="h-11"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                  <Input 
                    id="password" 
                    type="password"
                    className="h-11"
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md transition-all duration-200 hover:scale-[1.02]"
                >
                  登录到控制台
                </Button>
              </form>

              <div className="space-y-4 text-center text-sm">
                <a href="#" className="text-primary hover:underline transition-colors">
                  忘记密码？
                </a>
                
                <div className="text-muted-foreground">
                  还没有账户？{' '}
                  <a href="#" className="text-primary hover:underline transition-colors font-medium">
                    立即注册
                  </a>
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