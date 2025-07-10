'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'

/**
 * 系统设置页面
 * 简洁的系统设置界面
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">系统设置</h1>
        <p className="text-gray-600 dark:text-gray-400">配置系统参数和选项</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系统设置功能</CardTitle>
          <CardDescription>集成 @linch-kit/console 的完整系统配置功能</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            系统设置功能已集成到 Console 模块中。完整的配置界面将在后续版本中提供。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
