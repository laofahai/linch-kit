'use client'

/**
 * Console 认证主页面
 * 提供登录和注册选项的入口页面
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@linch-kit/ui/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'

export function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const callbackUrl = searchParams.get('callbackUrl') || '/console'

  const handleLoginClick = () => {
    router.push(`/console/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const handleRegisterClick = () => {
    router.push(`/console/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">LinchKit Console</CardTitle>
              <CardDescription>
                选择认证方式以访问管理控制台
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleLoginClick}
              >
                用户登录
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg" 
                onClick={handleRegisterClick}
              >
                注册账户
              </Button>
              
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                <button
                  className="hover:text-slate-900 dark:hover:text-slate-100"
                  onClick={() => router.push('/')}
                >
                  返回首页
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}