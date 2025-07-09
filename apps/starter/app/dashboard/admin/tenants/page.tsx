'use client'

/**
 * 租户管理页面 - 已迁移到 @linch-kit/console
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
import { ArrowRight, Building, Shield, Settings } from 'lucide-react'
import Link from 'next/link'

export default function TenantsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">租户管理</h1>
        <p className="text-muted-foreground mt-2">租户管理功能已迁移到 LinchKit Console 模块</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            功能迁移通知
          </CardTitle>
          <CardDescription>
            租户管理功能现在集成在 Console 模块中，提供更完整的多租户管理体验。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/console/tenants" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                前往 Console 租户管理
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                返回仪表板
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
