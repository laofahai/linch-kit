'use client'

import { useStarterIntegration } from '@linch-kit/console'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Badge } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/server'
import { Package, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

/**
 * Console 集成状态组件
 * 显示 Extension 加载状态和管理功能
 */
export function ConsoleIntegrationStatus() {
  const {
    integrationState,
    extensions,
    loading,
    error,
    initialized,
    loadExtension,
    unloadExtension,
    reloadExtension,
    refresh,
  } = useStarterIntegration()

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
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">集成错误</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refresh} variant="outline" size="sm">
            重试
          </Button>
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

      {extensions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extension 列表</CardTitle>
            <CardDescription>当前已加载的 Extension 和状态管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extensions.map(ext => (
                <div
                  key={ext.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      {ext.loadStatus === 'loaded' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {ext.loadStatus === 'loading' && (
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                      {ext.loadStatus === 'failed' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{ext.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {ext.routeCount} 路由 · {ext.componentCount} 组件
                      </div>
                      {ext.error && <div className="text-sm text-red-600">{ext.error}</div>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge
                      variant={
                        ext.loadStatus === 'loaded'
                          ? 'default'
                          : ext.loadStatus === 'loading'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {ext.loadStatus}
                    </Badge>

                    <div className="flex gap-1">
                      {ext.loadStatus === 'loaded' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reloadExtension(ext.name)}
                            disabled={loading}
                          >
                            重载
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unloadExtension(ext.name)}
                            disabled={loading}
                          >
                            卸载
                          </Button>
                        </>
                      )}
                      {ext.loadStatus === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadExtension(ext.name)}
                          disabled={loading}
                        >
                          重试
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
