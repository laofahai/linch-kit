/**
 * tRPC 演示页面
 * 展示如何使用 tRPC 进行 API 调用
 */

'use client'

import { useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@linch-kit/ui/server'
import { Logger } from '@linch-kit/core/client'

import { api as trpc } from '@/lib/trpc-client'

export default function TRPCDemoPage() {
  // 使用 tRPC hooks
  const {
    data: pingData,
    isLoading: pingLoading,
    error: pingError,
    refetch: refetchPing,
  } = trpc.health.status.useQuery()
  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = trpc.health.status.useQuery()
  const {
    data: systemData,
    isLoading: systemLoading,
    error: systemError,
    refetch: refetchSystem,
  } = trpc.system.info.useQuery()
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = trpc.stats.dashboard.useQuery()

  const isLoading = pingLoading || statusLoading || systemLoading || statsLoading
  const hasError = pingError || statusError || systemError || statsError

  useEffect(() => {
    // 记录数据加载状态
    if (pingData && statusData && systemData && statsData) {
      Logger.info('tRPC 数据加载完成', {
        ping: pingData,
        status: statusData,
        system: systemData,
        stats: statsData,
      })
    }
    if (hasError) {
      Logger.error('tRPC 数据加载失败', hasError as unknown as Error)
    }
  }, [pingData, statusData, systemData, statsData, hasError])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">tRPC API 演示</h1>
        <p className="text-muted-foreground mt-2">展示 tRPC 类型安全的 API 调用和实时数据获取</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center min-h-32">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加载数据...</p>
          </div>
        </div>
      )}

      {hasError && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">错误信息</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{hasError.message || '未知错误'}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 健康检查 */}
        <Card>
          <CardHeader>
            <CardTitle>健康检查</CardTitle>
            <CardDescription>系统健康状态和响应测试</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pingData && (
              <div>
                <p className="text-sm font-medium">Ping 响应</p>
                <p className="text-xs text-muted-foreground">状态: {pingData.status}</p>
                <p className="text-xs text-muted-foreground">运行时间: {pingData.uptime}s</p>
              </div>
            )}
            {statusData && (
              <div>
                <p className="text-sm font-medium">系统状态</p>
                <p className="text-xs text-muted-foreground">状态: {statusData.status}</p>
                <p className="text-xs text-muted-foreground">时间: {statusData.timestamp}</p>
              </div>
            )}
            <Button
              onClick={() => {
                refetchPing()
                refetchStatus()
              }}
              size="sm"
              disabled={pingLoading || statusLoading}
            >
              刷新健康检查
            </Button>
          </CardContent>
        </Card>

        {/* 系统信息 */}
        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>服务器环境和版本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemData && (
              <>
                <div>
                  <p className="text-sm font-medium">应用版本</p>
                  <p className="text-xs text-muted-foreground">{systemData.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">环境</p>
                  <p className="text-xs text-muted-foreground">{systemData.environment}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Node.js 版本</p>
                  <p className="text-xs text-muted-foreground">{systemData.nodeVersion}</p>
                </div>
                <Button onClick={() => refetchSystem()} size="sm" disabled={systemLoading}>
                  刷新系统信息
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 统计数据 */}
        <Card>
          <CardHeader>
            <CardTitle>业务统计</CardTitle>
            <CardDescription>实时业务数据统计</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsData && (
              <>
                <div>
                  <p className="text-sm font-medium">总用户数</p>
                  <p className="text-2xl font-bold">{statsData.totalUsers}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">活跃用户</p>
                  <p className="text-2xl font-bold">{statsData.activeUsers}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">总收入</p>
                  <p className="text-2xl font-bold">¥{statsData.revenue.toLocaleString()}</p>
                </div>
                <Button onClick={() => refetchStats()} size="sm" disabled={statsLoading}>
                  刷新统计数据
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">tRPC 特性演示</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✅ 类型安全的 API 调用</li>
          <li>✅ 自动数据获取和缓存</li>
          <li>✅ 实时错误处理</li>
          <li>✅ 加载状态管理</li>
          <li>✅ 数据刷新机制</li>
          <li>✅ TypeScript 端到端类型推导</li>
        </ul>
      </div>
    </div>
  )
}
