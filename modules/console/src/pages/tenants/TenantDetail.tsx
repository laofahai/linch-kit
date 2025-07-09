/**
 * 租户详情页面
 *
 * 显示租户的详细信息，包括基本信息、配额、用户、插件等
 */

'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsValue,
  Progress,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@linch-kit/ui/server'
import {
  Building2,
  Users,
  Puzzle,
  Database,
  Calendar,
  Edit,
  Trash2,
  Pause,
  Play,
  Settings,
  BarChart3,
  Download,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

// import { DataTable } from '../../components/shared/DataTable'
import { StatCard } from '../../components/shared/StatCard'
import { useTenant, useTenantQuotas, useTenantOperations } from '../../hooks/useTenants'
import { useConsoleTranslation } from '../../i18n'
import { useConsolePermission } from '../../providers/ConsoleProvider'

/**
 * 租户详情主页面
 */
export function TenantDetail() {
  const params = useParams()
  const tenantId = params.id as string
  const t = useConsoleTranslation()

  const canEdit = useConsolePermission('tenant:edit')
  const canDelete = useConsolePermission('tenant:delete')
  const canSuspend = useConsolePermission('tenant:suspend')
  const canManageQuotas = useConsolePermission('tenant:manage_quotas')

  // 状态管理
  const [activeTab, setActiveTab] = useState('overview')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [suspendDialog, setSuspendDialog] = useState(false)

  // 数据获取
  const { data: tenant, isLoading: tenantLoading } = useTenant(tenantId)
  const { data: quotas } = useTenantQuotas(tenantId)

  // 操作hooks
  const { deleteTenant, suspendTenant, activateTenant } = useTenantOperations()

  if (tenantLoading) {
    return <TenantDetailSkeleton />
  }

  if (!tenant) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">租户不存在</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'suspended':
        return 'secondary'
      case 'deleted':
        return 'destructive'
      case 'pending':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // 计算配额使用率
  const calculateUsagePercentage = (current: number, max: number) => {
    if (!max) return 0
    return Math.min((current / max) * 100, 100)
  }

  // 处理删除
  const handleDelete = async () => {
    try {
      await deleteTenant.mutateAsync(tenantId)
      setDeleteDialog(false)
      // 跳转到租户列表
      window.location.href = '/admin/tenants'
    } catch (error) {
      console.error('Delete tenant failed:', error)
    }
  }

  // 处理暂停/激活
  const handleSuspend = async () => {
    try {
      if (tenant.status === 'active') {
        await suspendTenant.mutateAsync(tenantId)
      } else {
        await activateTenant.mutateAsync(tenantId)
      }
      setSuspendDialog(false)
    } catch (error) {
      console.error('Suspend/Activate tenant failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
              <Badge variant={getStatusColor(tenant.status)}>
                {t(`console.entities.tenant.status.${tenant.status}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{tenant.domain || tenant.slug}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>创建于 {format(new Date(tenant.createdAt), 'yyyy年MM月dd日')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="outline">{t(`console.entities.tenant.plan.${tenant.plan}`)}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            查看报告
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/tenants/${tenantId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Link>
            </Button>
          )}
          {canSuspend && (
            <Button variant="outline" size="sm" onClick={() => setSuspendDialog(true)}>
              {tenant.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  暂停
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  激活
                </>
              )}
            </Button>
          )}
          {canDelete && tenant.status !== 'active' && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="用户数量"
          value={tenant.userCount || 0}
          change={tenant.userGrowth}
          icon={Users}
          color="blue"
        />
        <StatCard title="插件数量" value={tenant.pluginCount || 0} icon={Puzzle} color="green" />
        <StatCard
          title="存储使用"
          value={`${tenant.storageUsed || 0}MB`}
          icon={Database}
          color="orange"
        />
        <StatCard
          title="API调用"
          value={tenant.apiCalls || 0}
          change={tenant.apiGrowth}
          icon={RefreshCw}
          color="purple"
        />
      </div>

      {/* 详细信息标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsValue value="overview">概览</TabsValue>
          <TabsValue value="quotas">配额管理</TabsValue>
          <TabsValue value="users">用户管理</TabsValue>
          <TabsValue value="plugins">插件管理</TabsValue>
          <TabsValue value="settings">设置</TabsValue>
          <TabsValue value="logs">日志</TabsValue>
        </TabsList>

        {/* 概览标签 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">租户名称</label>
                    <div className="mt-1">{tenant.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URL标识</label>
                    <div className="mt-1">{tenant.slug}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">自定义域名</label>
                    <div className="mt-1">{tenant.domain || '未设置'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">订阅计划</label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {t(`console.entities.tenant.plan.${tenant.plan}`)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {tenant.businessLicense && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      营业执照号码
                    </label>
                    <div className="mt-1">{tenant.businessLicense}</div>
                  </div>
                )}

                {tenant.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">描述</label>
                    <div className="mt-1">{tenant.description}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 配额快速概览 */}
            {quotas && (
              <Card>
                <CardHeader>
                  <CardTitle>配额使用情况</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>用户数量</span>
                        <span>
                          {quotas.currentUsers} / {quotas.maxUsers}
                        </span>
                      </div>
                      <Progress
                        value={calculateUsagePercentage(quotas.currentUsers, quotas.maxUsers)}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>存储空间</span>
                        <span>
                          {quotas.currentStorage}MB / {quotas.maxStorage}MB
                        </span>
                      </div>
                      <Progress
                        value={calculateUsagePercentage(quotas.currentStorage, quotas.maxStorage)}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>API调用</span>
                        <span>
                          {quotas.currentApiCalls} / {quotas.maxApiCalls}
                        </span>
                      </div>
                      <Progress
                        value={calculateUsagePercentage(quotas.currentApiCalls, quotas.maxApiCalls)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 最近活动 */}
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.recentActivities?.length > 0 ? (
                <div className="space-y-3">
                  {tenant.recentActivities
                    .slice(0, 5)
                    .map((activity: Record<string, unknown>, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无最近活动</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 配额管理标签 */}
        <TabsContent value="quotas" className="space-y-6">
          <QuotaManagement tenantId={tenantId} quotas={quotas} canManage={canManageQuotas} />
        </TabsContent>

        {/* 用户管理标签 */}
        <TabsContent value="users" className="space-y-6">
          <TenantUserManagement tenantId={tenantId} />
        </TabsContent>

        {/* 插件管理标签 */}
        <TabsContent value="plugins" className="space-y-6">
          <TenantPluginManagement tenantId={tenantId} />
        </TabsContent>

        {/* 设置标签 */}
        <TabsContent value="settings" className="space-y-6">
          <TenantSettings tenantId={tenantId} tenant={tenant} />
        </TabsContent>

        {/* 日志标签 */}
        <TabsContent value="logs" className="space-y-6">
          <TenantAuditLogs tenantId={tenantId} />
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除租户 "{tenant.name}" 吗？此操作无法撤销，将删除所有相关数据。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTenant.isPending}>
              {deleteTenant.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 暂停/激活确认对话框 */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tenant.status === 'active' ? '暂停租户' : '激活租户'}</DialogTitle>
            <DialogDescription>
              确定要{tenant.status === 'active' ? '暂停' : '激活'}租户 "{tenant.name}" 吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={suspendTenant.isPending || activateTenant.isPending}
            >
              {suspendTenant.isPending || activateTenant.isPending
                ? '处理中...'
                : tenant.status === 'active'
                  ? '确认暂停'
                  : '确认激活'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * 配额管理组件
 */
function QuotaManagement({
  tenantId: _tenantId,
  quotas,
  canManage: _canManage,
}: {
  tenantId: string
  quotas: Record<string, unknown>
  canManage: boolean
}) {
  if (!quotas) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">配额信息加载中...</div>
        </CardContent>
      </Card>
    )
  }

  const quotaItems = [
    {
      name: '最大用户数',
      current: quotas.currentUsers,
      max: quotas.maxUsers,
      unit: '个',
    },
    {
      name: '存储空间',
      current: quotas.currentStorage,
      max: quotas.maxStorage,
      unit: 'MB',
    },
    {
      name: 'API调用次数',
      current: quotas.currentApiCalls,
      max: quotas.maxApiCalls,
      unit: '次',
    },
    {
      name: '插件数量',
      current: quotas.currentPlugins,
      max: quotas.maxPlugins,
      unit: '个',
    },
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>配额详情</CardTitle>
        {canManage && (
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            调整配额
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {quotaItems.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span>
                  {item.current} / {item.max} {item.unit}
                </span>
              </div>
              <Progress value={item.max ? (item.current / item.max) * 100 : 0} className="h-2" />
              <div className="text-xs text-muted-foreground">
                使用率: {item.max ? Math.round((item.current / item.max) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 租户用户管理组件
 */
function TenantUserManagement({ tenantId: _tenantId }: { tenantId: string }) {
  // 这里应该获取租户的用户列表
  return (
    <Card>
      <CardHeader>
        <CardTitle>用户列表</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">用户管理功能开发中...</div>
      </CardContent>
    </Card>
  )
}

/**
 * 租户插件管理组件
 */
function TenantPluginManagement({ tenantId: _tenantId }: { tenantId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>已安装插件</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">插件管理功能开发中...</div>
      </CardContent>
    </Card>
  )
}

/**
 * 租户设置组件
 */
function TenantSettings({
  tenantId: _tenantId,
  tenant: _tenant,
}: {
  tenantId: string
  tenant: Record<string, unknown>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>租户设置</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">设置管理功能开发中...</div>
      </CardContent>
    </Card>
  )
}

/**
 * 租户审计日志组件
 */
function TenantAuditLogs({ tenantId: _tenantId }: { tenantId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>审计日志</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">审计日志功能开发中...</div>
      </CardContent>
    </Card>
  )
}

/**
 * 租户详情骨架屏
 */
function TenantDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>

      <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
    </div>
  )
}

export default TenantDetail
