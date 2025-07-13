'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Badge } from '@linch-kit/ui/server'
import { Progress } from '@linch-kit/ui/server'
import { Database, Server, Shield, Cpu, Activity } from 'lucide-react'
import { useLinchKit, useLinchKitConfig } from '@/components/providers/linchkit-provider'

interface SystemHealth {
  database: { status: 'connected' | 'disconnected' | 'error'; latency?: number }
  auth: { status: 'active' | 'inactive' | 'error'; providers: number }
  api: { status: 'healthy' | 'degraded' | 'down'; responseTime?: number }
  memory: { used: number; total: number; percentage: number }
  uptime: number
}

export function SystemStatus() {
  const { isInitialized } = useLinchKit()
  const dbConfig = useLinchKitConfig<{ url?: string }>('database')
  const authConfig = useLinchKitConfig<{ 
    secret?: string
    providers?: Record<string, { enabled?: boolean }>
  }>('auth')
  
  const [health, setHealth] = useState<SystemHealth>({
    database: { status: 'disconnected' },
    auth: { status: 'inactive', providers: 0 },
    api: { status: 'down' },
    memory: { used: 0, total: 0, percentage: 0 },
    uptime: 0,
  })
  
  const [, setLoading] = useState(true)

  const checkSystemHealth = useCallback(async () => {
    if (!isInitialized) return

    setLoading(true)
    try {
      // 模拟系统健康检查
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockHealth: SystemHealth = {
        database: {
          status: dbConfig?.url ? 'connected' : 'disconnected',
          latency: Math.floor(Math.random() * 50) + 10,
        },
        auth: {
          status: authConfig?.secret ? 'active' : 'inactive',
          providers: Object.keys(authConfig?.providers || {}).filter(
            key => authConfig?.providers?.[key]?.enabled
          ).length || 1,
        },
        api: {
          status: 'healthy',
          responseTime: Math.floor(Math.random() * 100) + 50,
        },
        memory: {
          used: Math.floor(Math.random() * 200) + 100,
          total: 512,
          percentage: Math.floor(Math.random() * 60) + 20,
        },
        uptime: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
      }
      
      setHealth(mockHealth)
    } catch (error) {
      console.error('Failed to check system health:', error)
    } finally {
      setLoading(false)
    }
  }, [isInitialized, dbConfig, authConfig])

  useEffect(() => {
    if (isInitialized) {
      checkSystemHealth()
      const interval = setInterval(checkSystemHealth, 30000) // 30秒刷新一次
      return () => clearInterval(interval)
    }
  }, [isInitialized, checkSystemHealth])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'healthy':
        return 'text-green-600'
      case 'degraded':
      case 'inactive':
        return 'text-yellow-600'
      case 'disconnected':
      case 'error':
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'healthy':
        return 'default'
      case 'degraded':
      case 'inactive':
        return 'secondary'
      case 'disconnected':
      case 'error':
      case 'down':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}天 ${hours}小时`
    if (hours > 0) return `${hours}小时 ${minutes}分钟`
    return `${minutes}分钟`
  }

  if (!isInitialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            系统状态
          </CardTitle>
          <CardDescription>系统正在初始化...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            系统运行状态
          </CardTitle>
          <CardDescription>
            实时监控系统核心组件的运行状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 数据库状态 */}
            <div className="text-center p-4 border rounded-lg">
              <Database className={`h-8 w-8 mx-auto mb-2 ${getStatusColor(health.database.status)}`} />
              <div className="font-semibold">数据库</div>
              <Badge variant={getStatusBadge(health.database.status)} className="mt-1">
                {health.database.status === 'connected' ? '已连接' : '未连接'}
              </Badge>
              {health.database.latency && (
                <div className="text-xs text-muted-foreground mt-1">
                  延迟: {health.database.latency}ms
                </div>
              )}
            </div>

            {/* 认证状态 */}
            <div className="text-center p-4 border rounded-lg">
              <Shield className={`h-8 w-8 mx-auto mb-2 ${getStatusColor(health.auth.status)}`} />
              <div className="font-semibold">认证系统</div>
              <Badge variant={getStatusBadge(health.auth.status)} className="mt-1">
                {health.auth.status === 'active' ? '运行中' : '未配置'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {health.auth.providers} 个提供商
              </div>
            </div>

            {/* API状态 */}
            <div className="text-center p-4 border rounded-lg">
              <Server className={`h-8 w-8 mx-auto mb-2 ${getStatusColor(health.api.status)}`} />
              <div className="font-semibold">API服务</div>
              <Badge variant={getStatusBadge(health.api.status)} className="mt-1">
                {health.api.status === 'healthy' ? '正常' : '异常'}
              </Badge>
              {health.api.responseTime && (
                <div className="text-xs text-muted-foreground mt-1">
                  响应: {health.api.responseTime}ms
                </div>
              )}
            </div>

            {/* 内存使用 */}
            <div className="text-center p-4 border rounded-lg">
              <Cpu className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="font-semibold">内存使用</div>
              <div className="mt-2">
                <Progress value={health.memory.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {health.memory.used}MB / {health.memory.total}MB
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>运行时信息</CardTitle>
          <CardDescription>系统运行时统计信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">运行时间</div>
              <div className="text-lg font-semibold">{formatUptime(health.uptime)}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">环境</div>
              <div className="text-lg font-semibold capitalize">
                {process.env.NODE_ENV || 'development'}
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">版本</div>
              <div className="text-lg font-semibold">v1.0.0</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}