'use client'

import { useState, useEffect } from 'react'
import { Logger } from '@linch-kit/core'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge,
  Separator
} from '@linch-kit/ui'

// 系统管理导航菜单项定义
type AdminNavItem = {
  title: string
  icon: string
  href: string
  isActive?: boolean
  description: string
}

const adminNavItems: AdminNavItem[] = [
  { title: '系统总览', icon: '🖥️', href: '/admin', isActive: true, description: '系统运行状态和关键指标' },
  { title: '多租户管理', icon: '🏢', href: '/admin/tenants', description: '租户创建、配置和管理' },
  { title: '系统配置', icon: '⚙️', href: '/admin/config', description: '全局参数和系统设置' },
  { title: '用户权限', icon: '👤', href: '/admin/users', description: '系统用户和权限管理' },
  { title: '日志管理', icon: '📋', href: '/admin/logs', description: '系统日志和审计追踪' },
  { title: '安全中心', icon: '🔒', href: '/admin/security', description: '安全策略和访问控制' },
  { title: '系统监控', icon: '📈', href: '/admin/monitoring', description: '性能监控和告警管理' },
  { title: '备份恢复', icon: '💾', href: '/admin/backup', description: '数据备份和恢复策略' }
]

// 系统管理 KPI 指标类型
type SystemKPI = {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: string
  description: string
}

// 系统管理 KPI 数据
const systemKPIs: SystemKPI[] = [
  {
    title: '系统运行时间',
    value: '99.98%',
    change: '稳定运行',
    trend: 'stable',
    icon: '⏱️',
    description: '系统可用性指标'
  },
  {
    title: '活跃租户数',
    value: '47',
    change: '+3',
    trend: 'up',
    icon: '🏢',
    description: '当前活跃的租户数量'
  },
  {
    title: '系统用户',
    value: '12',
    change: '+1',
    trend: 'up',
    icon: '👨‍💼',
    description: '系统管理员用户数'
  },
  {
    title: '存储使用率',
    value: '67%',
    change: '+5%',
    trend: 'up',
    icon: '💾',
    description: '系统存储空间使用情况'
  }
]

// 系统管理活动日志类型
type SystemActivity = {
  admin: string
  action: string
  target: string
  time: string
  level: 'info' | 'warning' | 'error' | 'critical'
  ip?: string
}

// 系统管理活动日志
const systemActivities: SystemActivity[] = [
  {
    admin: '超级管理员',
    action: '创建租户',
    target: '企业客户A',
    time: '5分钟前',
    level: 'info',
    ip: '192.168.1.100'
  },
  {
    admin: '系统管理员',
    action: '修改系统配置',
    target: 'SMTP服务器设置',
    time: '12分钟前',
    level: 'warning',
    ip: '192.168.1.101'
  },
  {
    admin: '数据库管理员',
    action: '执行数据备份',
    target: '用户数据库',
    time: '30分钟前',
    level: 'info',
    ip: '192.168.1.102'
  },
  {
    admin: '安全管理员',
    action: '检测异常登录',
    target: '租户B管理员',
    time: '45分钟前',
    level: 'critical',
    ip: '203.0.113.15'
  }
]

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        Logger.info('Admin: 管理页面初始化开始')
        
        // 模拟初始化过程
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setIsLoading(false)
        Logger.info('Admin: 管理页面初始化完成')
      } catch (error) {
        Logger.error('Admin: 管理页面初始化失败',
          error instanceof Error ? error : new Error(String(error))
        )
        setIsLoading(false)
      }
    }

    initializeAdmin()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加载管理控制台...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">LinchKit 系统管理</h1>
            <Badge>Admin</Badge>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <span className="mr-2">🔔</span>
              通知
            </Button>
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              AD
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full flex-col">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">系统管理</h2>
              <nav className="space-y-1">
                {adminNavItems.map((item) => (
                  <Button
                    key={item.href}
                    variant={item.isActive ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    size="sm"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">系统管理总览</h1>
            <p className="text-muted-foreground mt-2">
              LinchKit 系统管理控制台 - 多租户、配置、日志等系统级管理功能
            </p>
          </div>

          {/* 系统状态指标 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {systemKPIs.map((kpi) => (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {kpi.title}
                  </CardTitle>
                  <span className="text-2xl">{kpi.icon}</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className={`inline-flex items-center ${
                      kpi.trend === 'up' ? 'text-green-600' : 
                      kpi.trend === 'down' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {kpi.trend === 'up' && '↗'}
                      {kpi.trend === 'down' && '↘'}
                      {kpi.trend === 'stable' && '→'}
                      <span className="ml-1">{kpi.change}</span>
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {kpi.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* 系统管理日志 */}
            <Card>
              <CardHeader>
                <CardTitle>系统管理日志</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.level === 'info' ? 'bg-blue-500' :
                        activity.level === 'warning' ? 'bg-yellow-500' :
                        activity.level === 'error' ? 'bg-red-500' :
                        'bg-red-700'
                      }`}></div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.admin}</p>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activity.action} → {activity.target}
                        </p>
                        {activity.ip && (
                          <p className="text-xs text-muted-foreground">
                            IP: {activity.ip}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        activity.level === 'info' ? 'default' :
                        activity.level === 'warning' ? 'secondary' :
                        activity.level === 'error' ? 'outline' :
                        'destructive'
                      }>
                        {activity.level === 'info' && '信息'}
                        {activity.level === 'warning' && '警告'}
                        {activity.level === 'error' && '错误'}
                        {activity.level === 'critical' && '严重'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 系统服务状态 */}
            <Card>
              <CardHeader>
                <CardTitle>系统服务状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">PostgreSQL 数据库</span>
                    </div>
                    <Badge variant="default">运行中</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">tRPC API 服务</span>
                    </div>
                    <Badge variant="default">运行中</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Redis 缓存</span>
                    </div>
                    <Badge variant="secondary">连接异常</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">文件存储系统</span>
                    </div>
                    <Badge variant="default">运行中</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">邮件服务 (SMTP)</span>
                    </div>
                    <Badge variant="default">运行中</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 系统管理功能模块 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>系统管理功能模块</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">🏢</span>
                    <h5 className="font-medium">多租户管理</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    创建、配置和管理租户
                  </p>
                  <Badge variant="outline">47 个租户</Badge>
                </div>

                <div className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">⚙️</span>
                    <h5 className="font-medium">系统配置</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    全局参数和功能设置
                  </p>
                  <Badge variant="outline">12 项配置</Badge>
                </div>

                <div className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">📋</span>
                    <h5 className="font-medium">日志管理</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    系统日志和审计追踪
                  </p>
                  <Badge variant="outline">实时监控</Badge>
                </div>

                <div className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">🔒</span>
                    <h5 className="font-medium">安全中心</h5>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    访问控制和安全策略
                  </p>
                  <Badge variant="secondary">需要关注</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}