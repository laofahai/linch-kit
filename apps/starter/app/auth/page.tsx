/**
 * 认证页面 - 使用@linch-kit/auth包
 * 这是正确的架构：starter应用负责认证，console扩展只负责管理功能
 */

'use client'

import { AuthProvider } from '@linch-kit/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleLogin = async () => {
    // 这里应该集成@linch-kit/auth的登录逻辑
    // 暂时模拟登录成功
    document.cookie = 'session=mock-session-token; path=/; max-age=86400'
    router.push(callbackUrl)
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
                onClick={handleLogin}
              >
                模拟登录
              </Button>
              
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                <p>正在使用 @linch-kit/auth 包</p>
                <p className="mt-1">认证成功后将跳转到: {callbackUrl}</p>
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