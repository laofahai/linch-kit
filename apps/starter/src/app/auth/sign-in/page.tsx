'use client'

import React from 'react'
import { Button } from '@linch-kit/ui/components'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/components'
import { Input } from '@linch-kit/ui/components'
import { Label } from '@linch-kit/ui/components'
import { Github, Mail } from 'lucide-react'

export default function SignInPage() {
  const handleSignIn = (provider: string) => {
    // 模拟登录流程
    console.log(`Signing in with ${provider}`)
    // 在实际应用中，这里会调用 NextAuth 或其他认证服务
    window.location.href = '/admin'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
          <CardDescription>
            登录到 LinchKit 管理控制台
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 社交登录 */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleSignIn('github')}
              className="w-full"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSignIn('google')}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或使用邮箱
              </span>
            </div>
          </div>

          {/* 邮箱登录表单 */}
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSignIn('email')
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input 
                id="password" 
                type="password"
                required 
              />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>

          <div className="text-center text-sm">
            <a href="#" className="text-primary hover:underline">
              忘记密码？
            </a>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            还没有账户？{' '}
            <a href="#" className="text-primary hover:underline">
              注册
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}