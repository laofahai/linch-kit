'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Badge } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/server'
import { Users, Building, Settings, Activity, TrendingUp, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 rounded-lg" />
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                管理中心 🛠️
              </h1>
              <p className="text-muted-foreground">
                系统管理和配置控制台，管理用户、租户和系统设置
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  系统设置
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/dashboard/admin/users">
                  <Users className="h-4 w-4 mr-2" />
                  用户管理
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总用户数</CardTitle>
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="flex items-center space-x-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-muted-foreground">本月增长</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">活跃租户</CardTitle>
            <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Building className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <div className="flex items-center space-x-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">+8.1%</span>
              <span className="text-muted-foreground">本月增长</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">系统活动</CardTitle>
            <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/20"
              >
                今日
              </Badge>
              <span className="text-xs text-muted-foreground">操作次数</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">安全状态</CardTitle>
            <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">健康</div>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20"
              >
                正常
              </Badge>
              <span className="text-xs text-muted-foreground">无威胁</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">管理功能</CardTitle>
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
                  <Badge variant="secondary" className="ml-auto">
                    1,247
                  </Badge>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link href="/dashboard/admin/tenants">
                  <Building className="mr-3 h-4 w-4" />
                  租户管理
                  <Badge variant="secondary" className="ml-auto">
                    48
                  </Badge>
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
            <CardTitle className="text-lg">TODO: Console 模块集成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">当前状态：使用 starter 内置组件</div>
              <div className="text-sm text-muted-foreground">
                计划：等待 @linch-kit/console 包完善后进行完整集成
              </div>
              <div className="text-sm text-muted-foreground">
                包括：Dashboard, TenantList, UserManager 等
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
