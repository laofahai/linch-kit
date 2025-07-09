'use client'

import { Dashboard } from '@linch-kit/console'
import { Card, CardContent, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Badge } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/server'
import { Users, Building, Settings, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      {/* 使用 Console 模块的 Dashboard 组件 */}
      <Dashboard />

      {/* 保留一些starter特定的内容作为补充 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">快速操作</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/admin/users">
                  查看全部
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/dashboard/admin/users">
                  <Users className="mr-3 h-4 w-4" />
                  用户管理
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/dashboard/admin/tenants">
                  <Building className="mr-3 h-4 w-4" />
                  租户管理
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/dashboard/admin/settings">
                  <Settings className="mr-3 h-4 w-4" />
                  系统设置
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Console 模块集成状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                  已集成
                </Badge>
                <span className="text-sm">@linch-kit/console Dashboard</span>
              </div>
              <div className="text-sm text-muted-foreground">
                下一步：继续集成更多Console组件，如TenantList、UserManager等
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
