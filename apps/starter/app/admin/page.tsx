'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Badge } from '@linch-kit/ui/server'
import { LayoutDashboard, Users, Building, Package, Shield, Settings, Activity } from 'lucide-react'

/**
 * 管理员控制台首页
 * 简洁的管理控制台概览
 */
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">系统概览</h1>
        <p className="text-gray-600 dark:text-gray-400">LinchKit 管理控制台</p>
      </div>

      {/* 系统状态 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Console 集成</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">已激活</div>
            <p className="text-xs text-muted-foreground">@linch-kit/console 集成正常运行</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extension 系统</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">就绪</div>
            <p className="text-xs text-muted-foreground">动态 Extension 加载已配置</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统状态</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">健康</div>
            <p className="text-xs text-muted-foreground">所有核心服务正常运行</p>
          </CardContent>
        </Card>
      </div>

      {/* 功能模块 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            集成功能模块
          </CardTitle>
          <CardDescription>LinchKit Console 提供的管理功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">用户管理</div>
                <div className="text-sm text-muted-foreground">用户账户和权限管理</div>
              </div>
              <Badge variant="secondary">集成</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Building className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">租户管理</div>
                <div className="text-sm text-muted-foreground">多租户组织管理</div>
              </div>
              <Badge variant="secondary">集成</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Package className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-medium">Extension管理</div>
                <div className="text-sm text-muted-foreground">动态Extension加载</div>
              </div>
              <Badge variant="default">活跃</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <div className="font-medium">安全管理</div>
                <div className="text-sm text-muted-foreground">安全策略和监控</div>
              </div>
              <Badge variant="secondary">集成</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Settings className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">系统设置</div>
                <div className="text-sm text-muted-foreground">系统配置管理</div>
              </div>
              <Badge variant="secondary">集成</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
