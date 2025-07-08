'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@linch-kit/ui'
import { Building } from 'lucide-react'

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">租户管理</h1>
          <p className="text-muted-foreground">管理多租户环境中的所有组织和租户</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>TODO: 租户管理功能</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              当前状态：等待 @linch-kit/console 包中的 TenantList 组件完善
            </div>
            <div className="text-sm text-muted-foreground">计划功能：</div>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>租户列表显示和筛选</li>
              <li>租户状态管理（激活/暂停）</li>
              <li>租户详情查看和编辑</li>
              <li>用户配额和权限管理</li>
              <li>计费计划管理</li>
            </ul>
            <div className="text-sm text-muted-foreground">
              架构设计：基于 @linch-kit/console 包的 TenantEntity 和相关组件
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
