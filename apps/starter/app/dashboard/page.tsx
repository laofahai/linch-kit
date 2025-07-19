/**
 * Dashboard页面 - 认证后的主要控制面板
 * 基于Gemini协商的混合架构：重定向到console扩展
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  
  useEffect(() => {
    // 重定向到console扩展的dashboard
    const timer = window.setTimeout(() => {
      router.push('/console')
    }, 1000)
    
    return () => { window.clearTimeout(timer); }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">正在跳转到 Dashboard</CardTitle>
            <CardDescription>
              即将为您打开 LinchKit Console 控制面板...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              正在加载控制面板，请稍候...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}