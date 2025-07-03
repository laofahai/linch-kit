/**
 * tRPC 演示页面
 * 展示如何使用 tRPC 进行 API 调用
 */

'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/components/providers/trpc-provider'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui'
import { Logger } from '@linch-kit/core'

export default function TRPCDemoPage() {
  const [healthData, setHealthData] = useState<{
    ping: { message: string; timestamp: string; uptime: number }
    status: { status: string; timestamp: string }
  } | null>(null)
  const [systemData, setSystemData] = useState<{
    name: string; version: string; environment: string; nodeVersion: string
  } | null>(null)
  const [postsData, setPostsData] = useState<{
    users: Array<{ 
      id: string; 
      name: string; 
      email: string; 
      role: string; 
      status: string;
      createdAt: Date;
      lastLoginAt: Date | null;
    }>
    total: number
  } | null>(null)
  const [statsData, setStatsData] = useState<{
    totalUsers: number; activeUsers: number; totalSessions: number; revenue: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取健康检查数据
  const fetchHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      const ping = await trpc.health.ping.query()
      const status = await trpc.health.status.query()
      setHealthData({ ping, status })
      Logger.info('健康检查数据获取成功', { ping, status })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      Logger.error('健康检查失败', new Error(message))
    } finally {
      setLoading(false)
    }
  }

  // 获取系统信息
  const fetchSystemInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const info = await trpc.system.info.query()
      setSystemData(info)
      Logger.info('系统信息获取成功', info)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      Logger.error('系统信息获取失败', new Error(message))
    } finally {
      setLoading(false)
    }
  }

  // 获取用户列表 (需要管理员权限)
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const users = await trpc.user.list.query({ limit: 5, offset: 0 })
      setPostsData(users) // 复用现有状态
      Logger.info('用户列表获取成功', users)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      Logger.error('用户列表获取失败', new Error(message))
    } finally {
      setLoading(false)
    }
  }

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const stats = await trpc.stats.dashboard.query()
      setStatsData(stats)
      Logger.info('统计数据获取成功', stats)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      Logger.error('统计数据获取失败', new Error(message))
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时自动获取健康检查数据
  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            tRPC API 演示
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            展示 LinchKit tRPC 集成的各种 API 功能
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            错误: {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* 健康检查 */}
          <Card>
            <CardHeader>
              <CardTitle>健康检查 API</CardTitle>
              <CardDescription>测试服务器连接和状态</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchHealth} disabled={loading} className="mb-4">
                {loading ? '加载中...' : '检查服务器健康状态'}
              </Button>
              {healthData && (
                <div className="space-y-2 text-sm">
                  <div><strong>Ping:</strong> {healthData.ping.message}</div>
                  <div><strong>状态:</strong> {healthData.status.status}</div>
                  <div><strong>运行时间:</strong> {Math.round(healthData.ping.uptime)}s</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 系统信息 */}
          <Card>
            <CardHeader>
              <CardTitle>系统信息 API</CardTitle>
              <CardDescription>获取服务器系统信息</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchSystemInfo} disabled={loading} className="mb-4">
                {loading ? '加载中...' : '获取系统信息'}
              </Button>
              {systemData && (
                <div className="space-y-2 text-sm">
                  <div><strong>名称:</strong> {systemData.name}</div>
                  <div><strong>版本:</strong> {systemData.version}</div>
                  <div><strong>环境:</strong> {systemData.environment}</div>
                  <div><strong>Node版本:</strong> {systemData.nodeVersion}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 文章列表 */}
          <Card>
            <CardHeader>
              <CardTitle>用户列表 API</CardTitle>
              <CardDescription>获取用户数据（管理员API）</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchUsers} disabled={loading} className="mb-4">
                {loading ? '加载中...' : '获取用户列表'}
              </Button>
              {postsData && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    总计: {postsData.total} 个用户
                  </div>
                  {postsData.users.map((user) => (
                    <div key={user.id} className="border-l-4 border-blue-500 pl-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">
                        邮箱: {user.email} | 角色: {user.role}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 统计数据 */}
          <Card>
            <CardHeader>
              <CardTitle>统计数据 API</CardTitle>
              <CardDescription>获取仪表板统计信息</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchStats} disabled={loading} className="mb-4">
                {loading ? '加载中...' : '获取统计数据'}
              </Button>
              {statsData && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-600">总用户数</div>
                    <div className="text-xl">{statsData.totalUsers}</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">活跃用户</div>
                    <div className="text-xl">{statsData.activeUsers}</div>
                  </div>
                  <div>
                    <div className="font-medium text-purple-600">总会话数</div>
                    <div className="text-xl">{statsData.totalSessions}</div>
                  </div>
                  <div>
                    <div className="font-medium text-orange-600">收入</div>
                    <div className="text-xl">¥{statsData.revenue}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="outline"
          >
            返回 Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}