'use client'

import { useStarterIntegration } from '@linch-kit/console/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Badge } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/server'
import { Package, AlertCircle, Loader2 } from 'lucide-react'

/**
 * Console 集成状态组件
 * 显示 Extension 加载状态和管理功能
 */
export function ConsoleIntegrationStatus() {
  const { integrationState, loading, error, initialized, refresh } = useStarterIntegration()

  if (!initialized && !error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">初始化 Console 集成中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Console 集成初始化失败</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
            <Button onClick={refresh} variant="outline" size="sm" className="mt-3">
              重新尝试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Console 集成状态
          </CardTitle>
          <CardDescription>Extension 系统运行状态和管理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {integrationState.loadedExtensions}
              </div>
              <div className="text-sm text-muted-foreground">已加载 Extension</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {integrationState.registeredRoutes}
              </div>
              <div className="text-sm text-muted-foreground">动态路由</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {integrationState.registeredComponents}
              </div>
              <div className="text-sm text-muted-foreground">注册组件</div>
            </div>
            <div className="text-center">
              <Badge variant={integrationState.initialized ? 'default' : 'secondary'}>
                {integrationState.initialized ? '已初始化' : '未初始化'}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              刷新状态
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extension列表功能暂时禁用，等待类型问题修复 */}
      <Card>
        <CardHeader>
          <CardTitle>Extension 列表</CardTitle>
          <CardDescription>Extension 状态和管理（开发中）</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Extension 列表功能正在开发中，敬请期待...</p>
        </CardContent>
      </Card>
    </div>
  )
}
