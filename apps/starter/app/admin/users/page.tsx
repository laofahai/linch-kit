'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'

/**
 * 用户管理页面
 * 简洁的用户管理界面
 */
export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">用户管理</h1>
        <p className="text-gray-600 dark:text-gray-400">管理系统中的所有用户</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户管理功能</CardTitle>
          <CardDescription>集成 @linch-kit/console 的完整用户管理功能</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            用户管理功能已集成到 Console 模块中。完整的用户管理界面将在后续版本中提供。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
