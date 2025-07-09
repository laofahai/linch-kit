'use client'

/**
 * 设置页面 - 已迁移到 @linch-kit/console
 *
 * 该功能已迁移到 console 模块，提供更完整和标准化的设置管理体验。
 * starter 应用不再直接实现复杂的设置功能，遵循 LinchKit 架构原则。
 */

// 强制动态渲染，避免静态生成问题
export const dynamic = 'force-dynamic'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@linch-kit/ui/server'
import { ArrowRight, Settings as SettingsIcon, Shield, Home } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground mt-2">设置管理功能已迁移到 LinchKit Console 模块</p>
      </div>

      {/* 迁移说明卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            功能迁移通知
          </CardTitle>
          <CardDescription>
            为了提供更好的用户体验和功能一致性，系统设置功能已整合到 Console 模块中。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-medium text-blue-900 mb-2">设置功能包括：</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 个人资料管理和账户设置</li>
                <li>• 系统配置和环境变量管理</li>
                <li>• 权限和角色管理</li>
                <li>• 通知和邮件设置</li>
                <li>• 安全设置和双因素认证</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link href="/console/settings" className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  前往 Console 设置
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  返回仪表板
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 开发者信息 */}
      <Card>
        <CardHeader>
          <CardTitle>开发者信息</CardTitle>
          <CardDescription>如需在自定义应用中实现设置管理功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>推荐做法：</strong>使用{' '}
              <code className="text-sm bg-gray-100 px-1 rounded">@linch-kit/console</code>{' '}
              中的设置组件
            </div>
            <div>
              <strong>集成方式：</strong>
              <pre className="mt-2 p-3 bg-gray-50 rounded-md text-xs overflow-x-auto">
                {`import { SettingsManager } from '@linch-kit/console'
import { ConsoleLayout } from '@linch-kit/console'

export default function CustomSettingsPage() {
  return (
    <ConsoleLayout title="设置">
      <SettingsManager />
    </ConsoleLayout>
  )
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
