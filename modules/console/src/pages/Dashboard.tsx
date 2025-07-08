/**
 * Dashboard 页面组件
 *
 * 系统概览仪表板，显示关键指标和快速操作
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@linch-kit/ui'
import { Button } from '@linch-kit/ui'
import { Badge } from '@linch-kit/ui'
import {
  Users,
  Building2,
  Puzzle,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Settings,
  BarChart3,
  Shield,
} from 'lucide-react'

import { StatCard } from '../components/shared/StatCard'
import { DataTable } from '../components/shared/DataTable'
import { useDashboard, useSystemStats, useSystemHealth } from '../hooks/useConsole'
import { useConsoleTranslation } from '../i18n'
import { useConsolePermission } from '../providers/ConsoleProvider'

/**
 * Dashboard 主页面
 */
export function Dashboard() {
  const t = useConsoleTranslation()
  const canManage = useConsolePermission('console:admin')

  // 数据获取
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard()
  const { data: systemStats, isLoading: statsLoading } = useSystemStats()
  const { data: systemHealth, isLoading: healthLoading } = useSystemHealth()

  // 快速操作权限
  const canCreateTenant = useConsolePermission('tenant:create')
  const canManageUsers = useConsolePermission('user:manage')
  const canManagePlugins = useConsolePermission('plugin:manage')
  const canViewMonitoring = useConsolePermission('monitoring:view')

  if (dashboardLoading || statsLoading || healthLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.description')}</p>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {t('dashboard.settings')}
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('dashboard.reports')}
            </Button>
          </div>
        )}
      </div>

      {/* 系统健康状态 */}
      <SystemHealthCard health={systemHealth || {}} />

      {/* 核心指标统计 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.stats.totalTenants')}
          value={dashboard?.stats?.totalTenants || 0}
          // change={dashboard?.stats?.tenantGrowth}
          icon={<Building2 className="h-4 w-4" />}
          // color="blue"
        />
        <StatCard
          title={t('dashboard.stats.totalUsers')}
          value={dashboard?.stats?.totalUsers || 0}
          // change={dashboard?.stats?.userGrowth}
          icon={<Users className="h-4 w-4" />}
          // color="green"
        />
        <StatCard
          title={t('dashboard.stats.activePlugins')}
          value={dashboard?.stats?.activePlugins || 0}
          // change={dashboard?.stats?.pluginGrowth}
          icon={<Puzzle className="h-4 w-4" />}
          // color="purple"
        />
        <StatCard
          title={t('dashboard.stats.systemLoad')}
          value={`${systemStats?.cpu?.usage || 0}%`}
          // change={systemStats?.cpu?.trend}
          icon={<Activity className="h-4 w-4" />}
          // color="orange"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 快速操作 */}
        <QuickActionsCard
          canCreateTenant={canCreateTenant}
          canManageUsers={canManageUsers}
          canManagePlugins={canManagePlugins}
          canViewMonitoring={canViewMonitoring}
        />

        {/* 最近活动 */}
        <RecentActivityCard activities={dashboard?.recentActivities || []} />

        {/* 系统资源使用 */}
        <SystemResourcesCard stats={systemStats || {}} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 租户概览 */}
        <TenantOverviewCard tenants={dashboard?.topTenants || []} />

        {/* 插件状态 */}
        <PluginStatusCard plugins={dashboard?.pluginStatus || []} />
      </div>

      {/* 最近告警 */}
      {dashboard?.recentAlerts && dashboard.recentAlerts.length > 0 && (
        <RecentAlertsCard alerts={dashboard.recentAlerts} />
      )}
    </div>
  )
}

/**
 * 系统健康状态卡片
 */
function SystemHealthCard({ health }: { health: Record<string, unknown> | undefined }) {
  const t = useConsoleTranslation()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircle
      case 'warning':
        return AlertTriangle
      case 'error':
        return AlertTriangle
      default:
        return Clock
    }
  }

  if (!health) return null

  const StatusIcon = getStatusIcon(String(health?.status || 'unknown'))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('dashboard.systemHealth.title')}</CardTitle>
        <StatusIcon className={`h-4 w-4 ${getStatusColor(String(health?.status || 'unknown'))}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Badge
            variant={health?.status === 'healthy' ? 'default' : 'destructive'}
            className={getStatusColor(String(health?.status || 'unknown'))}
          >
            {t(`dashboard.systemHealth.status.${health?.status || 'unknown'}`)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t('dashboard.systemHealth.lastCheck')}: {String(health?.lastCheck || 'N/A')}
          </span>
        </div>

        {Array.isArray(health?.issues) && health.issues.length > 0 && (
          <div className="mt-3 space-y-1">
            {health.issues.slice(0, 3).map((issue: Record<string, unknown>, index: number) => (
              <div key={index} className="text-sm text-muted-foreground">
                • {String(issue?.message || 'Unknown issue')}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 快速操作卡片
 */
function QuickActionsCard({
  canCreateTenant,
  canManageUsers,
  canManagePlugins,
  canViewMonitoring,
}: {
  canCreateTenant: boolean
  canManageUsers: boolean
  canManagePlugins: boolean
  canViewMonitoring: boolean
}) {
  const t = useConsoleTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {canCreateTenant && (
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard.quickActions.createTenant')}
          </Button>
        )}

        {canManageUsers && (
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Users className="h-4 w-4 mr-2" />
            {t('dashboard.quickActions.manageUsers')}
          </Button>
        )}

        {canManagePlugins && (
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Puzzle className="h-4 w-4 mr-2" />
            {t('dashboard.quickActions.managePlugins')}
          </Button>
        )}

        {canViewMonitoring && (
          <Button variant="outline" className="w-full justify-start" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('dashboard.quickActions.viewMonitoring')}
          </Button>
        )}

        <Button variant="outline" className="w-full justify-start" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          {t('dashboard.quickActions.viewLogs')}
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * 最近活动卡片
 */
function RecentActivityCard({ activities }: { activities: Record<string, unknown>[] }) {
  const t = useConsoleTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recentActivity.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.recentActivity.empty')}</p>
          ) : (
            activities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {String(activity?.description || 'No description')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {String(activity?.timestamp || 'Unknown time')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 系统资源使用卡片
 */
function SystemResourcesCard({ stats }: { stats: Record<string, unknown> | undefined }) {
  const t = useConsoleTranslation()

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.systemResources.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('dashboard.systemResources.cpu')}</span>
            <span>{Number((stats?.cpu as Record<string, unknown>)?.usage || 0)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Number((stats?.cpu as Record<string, unknown>)?.usage || 0)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('dashboard.systemResources.memory')}</span>
            <span>{Number((stats?.memory as Record<string, unknown>)?.usage || 0)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${Number((stats?.memory as Record<string, unknown>)?.usage || 0)}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('dashboard.systemResources.disk')}</span>
            <span>{Number((stats?.disk as Record<string, unknown>)?.usage || 0)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${Number((stats?.disk as Record<string, unknown>)?.usage || 0)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 租户概览卡片
 */
function TenantOverviewCard({ tenants }: { tenants: Record<string, unknown>[] }) {
  const t = useConsoleTranslation()

  const columns = [
    { key: 'name', title: t('dashboard.tenantOverview.columns.name') },
    { key: 'status', title: t('dashboard.tenantOverview.columns.status') },
    { key: 'users', title: t('dashboard.tenantOverview.columns.users') },
    { key: 'plugins', title: t('dashboard.tenantOverview.columns.plugins') },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.tenantOverview.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={tenants}
          columns={columns}
          // emptyMessage={t('dashboard.tenantOverview.empty')}
        />
      </CardContent>
    </Card>
  )
}

/**
 * 插件状态卡片
 */
function PluginStatusCard({ plugins }: { plugins: Record<string, unknown>[] }) {
  const t = useConsoleTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.pluginStatus.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plugins.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.pluginStatus.empty')}</p>
          ) : (
            plugins.slice(0, 5).map((plugin, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                    <Puzzle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {String(plugin?.name || 'Unknown plugin')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      v{String(plugin?.version || '0.0.0')}
                    </p>
                  </div>
                </div>
                <Badge variant={plugin?.status === 'active' ? 'default' : 'secondary'}>
                  {t(`dashboard.pluginStatus.status.${plugin?.status || 'unknown'}`)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 最近告警卡片
 */
function RecentAlertsCard({ alerts }: { alerts: Record<string, unknown>[] }) {
  const t = useConsoleTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
          {t('dashboard.recentAlerts.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{String(alert?.title || 'Unknown alert')}</p>
                <p className="text-sm text-muted-foreground">
                  {String(alert?.description || 'No description')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {String(alert?.timestamp || 'Unknown time')}
                </p>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                {String(alert?.severity || 'Unknown')}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Dashboard 骨架屏
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default Dashboard
