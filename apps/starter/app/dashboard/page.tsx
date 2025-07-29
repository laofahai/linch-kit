/**
 * 用户Dashboard页面 - 功能完整的用户控制面板
 * 展示用户信息、会话状态、快捷操作等
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/client'
import { Badge } from '@linch-kit/ui/server'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string
  status: string
  createdAt: string
  lastLoginAt?: string
}

interface Session {
  id: string
  isActive: boolean
  createdAt: string
  expiresAt: string
  deviceInfo?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // 检查用户认证状态
      const userResponse = await fetch('/api/auth/user')
      if (!userResponse.ok) {
        router.push('/auth/login')
        return
      }

      const userData = await userResponse.json()
      if (!userData.success) {
        router.push('/auth/login')
        return
      }

      setUser(userData.user)

      // 加载用户会话信息
      const sessionsResponse = await fetch('/api/auth/user/sessions')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        if (sessionsData.success) {
          setSessions(sessionsData.sessions || [])
        }
      }
    } catch (err) {
      setError('加载用户数据失败')
      console.error('Dashboard data loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      if (response.ok) {
        router.push('/auth/login')
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/auth/user/sessions/${sessionId}/revoke`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // 重新加载会话列表
        checkAuthAndLoadData()
      }
    } catch (err) {
      console.error('Revoke session error:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                正在加载用户信息...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-4">{error || '用户信息加载失败'}</p>
              <Button onClick={() => router.push('/auth/login')}>
                返回登录
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 用户信息卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">用户控制面板</CardTitle>
                <CardDescription>
                  欢迎回来，{user.name}！
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status === 'active' ? '活跃' : user.status}
                </Badge>
                <Button variant="outline" onClick={handleLogout}>
                  退出登录
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">用户ID:</span>
                    <span className="font-mono text-sm">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">邮箱:</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">姓名:</span>
                    <span>{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">注册时间:</span>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                  {user.lastLoginAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">最后登录:</span>
                      <span>{formatDate(user.lastLoginAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">快速操作</h3>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start"
                    onClick={() => router.push('/console')}
                  >
                    打开 LinchKit Console
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/auth/profile')}
                  >
                    编辑个人资料
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/auth/security')}
                  >
                    安全设置
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('/api/docs', '_blank')}
                  >
                    API 文档
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 会话管理卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>活跃会话</CardTitle>
            <CardDescription>
              管理您的登录会话，可以撤销不需要的设备访问
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-4">
                没有找到活跃的会话
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={session.isActive ? 'default' : 'secondary'}>
                          {session.isActive ? '活跃' : '已过期'}
                        </Badge>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {session.deviceInfo || '未知设备'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        创建时间: {formatDate(session.createdAt)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        过期时间: {formatDate(session.expiresAt)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {session.isActive && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          撤销
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 系统信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>
              当前系统的运行状态和版本信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">LinchKit</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">v8.0</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">认证系统</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">正常运行</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">Console</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">已集成</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 快速导航 */}
        <Card>
          <CardHeader>
            <CardTitle>快速导航</CardTitle>
            <CardDescription>
              快速访问常用功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => router.push('/console')}
              >
                <div className="text-lg">🎛️</div>
                <div className="text-sm">Console</div>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => router.push('/auth/profile')}
              >
                <div className="text-lg">👤</div>
                <div className="text-sm">个人资料</div>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => router.push('/auth/security')}
              >
                <div className="text-lg">🔒</div>
                <div className="text-sm">安全设置</div>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col"
                onClick={() => window.open('https://docs.linchkit.com', '_blank')}
              >
                <div className="text-lg">📚</div>
                <div className="text-sm">文档</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}