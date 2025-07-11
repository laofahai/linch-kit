'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Badge } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/server'
import { Package, AlertCircle, CheckCircle } from 'lucide-react'

/**
 * Console 集成状态组件 - 简化版本
 * 移除对@linch-kit/console的依赖，使用静态展示
 */
export function ConsoleIntegrationStatus() {
  // 模拟集成状态数据
  const mockIntegrationState = {
    loadedExtensions: 0,
    registeredRoutes: 0,
    registeredComponents: 0,
    initialized: false,
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Console 集成状态
          </CardTitle>
          <CardDescription>Extension 系统运行状态和管理（开发中）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {mockIntegrationState.loadedExtensions}
              </div>
              <div className="text-sm text-muted-foreground">已加载 Extension</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {mockIntegrationState.registeredRoutes}
              </div>
              <div className="text-sm text-muted-foreground">动态路由</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {mockIntegrationState.registeredComponents}
              </div>
              <div className="text-sm text-muted-foreground">注册组件</div>
            </div>
            <div className="text-center">
              <Badge variant="secondary">开发中</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <AlertCircle className="h-4 w-4" />
            Extension 系统正在开发中，将在后续版本中提供完整功能
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Extension 系统开发中
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extension 列表</CardTitle>
          <CardDescription>Extension 状态和管理（开发中）</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Extension 系统架构设计已完成</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>基础Extension加载器已实现</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>动态路由注册功能开发中...</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Extension管理界面开发中...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
