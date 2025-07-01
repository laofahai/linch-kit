'use client'

import { useState, useEffect } from 'react'
import { Logger } from '@linch-kit/core'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge
} from '@linch-kit/ui'
// DataService 移除，改用 API 调用

// 用户角色类型
type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER'

// 模块类型
type AppModule = {
  id: string
  title: string
  description: string
  icon: string
  category: 'system' | 'tenant' | 'business'
  requiredRoles: UserRole[]
  href: string
  isEnabled: boolean
  stats?: {
    label: string
    value: string
  }
}

// Dashboard 统计数据类型
type DashboardStats = {
  totalUsers: number
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  lastUpdated: string
}

// 快捷操作类型
type QuickAction = {
  title: string
  description: string
  icon: string
  action: () => void
  variant: 'default' | 'secondary' | 'outline'
}

export default function DashboardPage() {
  // 模拟当前用户角色（实际应从认证系统获取）
  const [currentUserRole] = useState<UserRole>('TENANT_ADMIN') // 模拟为租户管理员
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    lastUpdated: new Date().toISOString()
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // 应用模块定义
  const appModules: AppModule[] = [
    // 系统管理模块（仅超级管理员可见）
    {
      id: 'system-tenants',
      title: '多租户管理',
      description: '创建、配置和管理所有租户',
      icon: '🏢',
      category: 'system',
      requiredRoles: ['SUPER_ADMIN'],
      href: '/admin/tenants',
      isEnabled: true,
      stats: { label: '活跃租户', value: '47' }
    },
    {
      id: 'system-config',
      title: '系统配置',
      description: '全局参数和系统设置管理',
      icon: '⚙️',
      category: 'system',
      requiredRoles: ['SUPER_ADMIN'],
      href: '/admin/config',
      isEnabled: true
    },
    {
      id: 'system-monitoring',
      title: '系统监控',
      description: '性能监控和告警管理',
      icon: '📈',
      category: 'system',
      requiredRoles: ['SUPER_ADMIN'],
      href: '/admin/monitoring',
      isEnabled: true
    },
    
    // 租户管理模块（租户管理员可见）
    {
      id: 'tenant-users',
      title: '用户管理',
      description: '管理租户内的用户和权限',
      icon: '👥',
      category: 'tenant',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      href: '/dashboard/users',
      isEnabled: true,
      stats: { label: '用户数', value: '234' }
    },
    {
      id: 'tenant-settings',
      title: '租户设置',
      description: '租户配置和个性化设置',
      icon: '🛠️',
      category: 'tenant',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      href: '/dashboard/settings',
      isEnabled: true
    },
    
    // 业务应用模块（所有用户可见）
    {
      id: 'app-erp',
      title: 'ERP 系统',
      description: '企业资源计划管理系统',
      icon: '🏦',
      category: 'business',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'USER'],
      href: '/apps/erp',
      isEnabled: true,
      stats: { label: '订单', value: '1,245' }
    },
    {
      id: 'app-crm',
      title: 'CRM 管理',
      description: '客户关系管理系统',
      icon: '🤝',
      category: 'business',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'USER'],
      href: '/apps/crm',
      isEnabled: true,
      stats: { label: '客户', value: '567' }
    },
    {
      id: 'app-wms',
      title: 'WMS 仓储',
      description: '仓库管理系统',
      icon: '📦',
      category: 'business',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'USER'],
      href: '/apps/wms',
      isEnabled: true,
      stats: { label: '库存', value: '12,345' }
    },
    {
      id: 'app-reports',
      title: '报表分析',
      description: '数据分析和报表生成',
      icon: '📊',
      category: 'business',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'USER'],
      href: '/apps/reports',
      isEnabled: true,
      stats: { label: '报表', value: '89' }
    }
  ]
  
  // 根据用户角色过滤模块
  const availableModules = appModules.filter(module => 
    module.requiredRoles.includes(currentUserRole)
  )
  
  // 按类别分组模块
  const modulesByCategory = {
    system: availableModules.filter(m => m.category === 'system'),
    tenant: availableModules.filter(m => m.category === 'tenant'),
    business: availableModules.filter(m => m.category === 'business')
  }
  
  // 快捷操作
  const quickActions: QuickAction[] = [
    {
      title: '创建用户',
      description: '添加新的用户到系统',
      icon: '➕',
      action: () => Logger.info('创建用户操作'),
      variant: 'default'
    },
    {
      title: '生成报表',
      description: '生成数据分析报表',
      icon: '📈',
      action: () => Logger.info('生成报表操作'),
      variant: 'outline'
    },
    {
      title: '系统备份',
      description: '执行数据备份操作',
      icon: '💾',
      action: () => Logger.info('系统备份操作'),
      variant: 'secondary'
    }
  ]

  const loadDashboardData = async () => {
    try {
      Logger.info('Dashboard: 开始加载数据')
      setIsLoading(true)
      
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
        Logger.info('Dashboard: 数据加载完成', result.data)
      } else {
        throw new Error(result.message || '获取统计数据失败')
      }
      
      setIsLoading(false)
    } catch (error) {
      Logger.error('Dashboard: 数据加载失败', 
        error instanceof Error ? error : new Error(String(error))
      )
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在加载工作台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">个人工作台</h1>
          <Badge variant="outline">
            {currentUserRole === 'SUPER_ADMIN' && '超级管理员'}
            {currentUserRole === 'TENANT_ADMIN' && '租户管理员'}
            {currentUserRole === 'USER' && '用户'}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          欢迎使用 LinchKit 平台，根据您的角色显示可用的功能模块
        </p>
      </div>

      {/* 快捷操作 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{action.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 业务应用模块 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">💼</span>
          业务应用
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modulesByCategory.business.map((module) => (
            <Card key={module.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{module.icon}</span>
                  {module.stats && (
                    <Badge variant="secondary">
                      {module.stats.label}: {module.stats.value}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {module.description}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  进入应用
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle>数据概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">总用户数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <div className="text-sm text-muted-foreground">总文章数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.publishedPosts}</div>
              <div className="text-sm text-muted-foreground">已发布文章</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.draftPosts}</div>
              <div className="text-sm text-muted-foreground">草稿文章</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}