/**
 * 租户列表页面
 *
 * 显示所有租户的列表，支持搜索、筛选和操作
 */

'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@linch-kit/ui/server'
import {
  Button,
  Input,
} from '@linch-kit/ui/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@linch-kit/ui/client'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Pause,
  Play,
  Users,
  Building2,
  Crown,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

import { DataTable } from '../../components/shared/DataTable'
import { StatCard } from '../../components/shared/StatCard'
import { useTenants, useTenantOperations } from '../../hooks/useTenants'
import { useConsoleTranslation } from '../../i18n'
import { useConsolePermission } from '../../providers/ConsoleProvider'

/**
 * 租户列表主页面
 */
export function TenantList() {
  const t = useConsoleTranslation()
  const canCreate = useConsolePermission('tenant:create')
  const canEdit = useConsolePermission('tenant:edit')
  const canDelete = useConsolePermission('tenant:delete')
  const canSuspend = useConsolePermission('tenant:suspend')

  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    tenant?: Record<string, unknown>
  }>({ open: false })
  const [suspendDialog, setSuspendDialog] = useState<{
    open: boolean
    tenant?: Record<string, unknown>
  }>({ open: false })

  // 数据获取
  const {
    data: tenantsData,
    isLoading,
    error,
  } = useTenants({
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    plan: planFilter === 'all' ? undefined : planFilter,
    page: 1,
    pageSize: 20,
  })

  // 操作hooks
  const { deleteTenant, suspendTenant, activateTenant } = useTenantOperations()

  const tenants = tenantsData?.data || []
  const stats = tenantsData?.stats || {}

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

  // 获取计划颜色
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'default'
      case 'professional':
        return 'secondary'
      case 'starter':
        return 'outline'
      case 'free':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // 处理删除
  const handleDelete = async () => {
    if (!deleteDialog.tenant) return

    try {
      await deleteTenant.mutateAsync(deleteDialog.tenant.id)
      setDeleteDialog({ open: false })
    } catch (error) {
      console.error('Delete tenant failed:', error)
    }
  }

  // 处理暂停/激活
  const handleSuspend = async () => {
    if (!suspendDialog.tenant) return

    try {
      if (suspendDialog.tenant.status === 'active') {
        await suspendTenant.mutateAsync(suspendDialog.tenant.id)
      } else {
        await activateTenant.mutateAsync(suspendDialog.tenant.id)
      }
      setSuspendDialog({ open: false })
    } catch (error) {
      console.error('Suspend/Activate tenant failed:', error)
    }
  }

  // 表格列定义
  const columns = [
    {
      key: 'name',
      label: t('console.entities.tenant.fields.name'),
      render: (tenant: Record<string, unknown>) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <Link href={`/admin/tenants/${tenant.id}`} className="font-medium hover:underline">
                {tenant.name}
              </Link>
              {tenant.plan === 'enterprise' && <Crown className="h-4 w-4 text-yellow-500" />}
            </div>
            <div className="text-sm text-muted-foreground">{tenant.domain || tenant.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('console.entities.tenant.fields.status'),
      render: (tenant: Record<string, unknown>) => (
        <Badge variant={getStatusColor(tenant.status)}>
          {t(`console.entities.tenant.status.${tenant.status}`)}
        </Badge>
      ),
    },
    {
      key: 'plan',
      label: t('console.entities.tenant.fields.plan'),
      render: (tenant: Record<string, unknown>) => (
        <Badge variant={getPlanColor(tenant.plan)}>
          {t(`console.entities.tenant.plan.${tenant.plan}`)}
        </Badge>
      ),
    },
    {
      key: 'users',
      label: '用户数',
      render: (tenant: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{tenant.userCount || 0}</span>
          {tenant.maxUsers && <span className="text-muted-foreground">/ {tenant.maxUsers}</span>}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: t('console.entities.tenant.fields.createdAt'),
      render: (tenant: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{format(new Date(tenant.createdAt), 'yyyy-MM-dd')}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (tenant: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/tenants/${tenant.id}`}>查看详情</Link>
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem asChild>
                <Link href={`/admin/tenants/${tenant.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {canSuspend && (
              <DropdownMenuItem onClick={() => setSuspendDialog({ open: true, tenant })}>
                {tenant.status === 'active' ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    暂停
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    激活
                  </>
                )}
              </DropdownMenuItem>
            )}
            {canDelete && tenant.status !== 'active' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialog({ open: true, tenant })}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">加载租户列表失败: {error.message}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('console.tenants.title')}</h1>
          <p className="text-muted-foreground">管理系统中的所有租户</p>
        </div>

        {canCreate && (
          <Button asChild>
            <Link href="/admin/tenants/create">
              <Plus className="h-4 w-4 mr-2" />
              {t('console.tenants.createTenant')}
            </Link>
          </Button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="总租户数" value={stats.total || 0} icon={Building2} color="blue" />
        <StatCard title="活跃租户" value={stats.active || 0} icon={Users} color="green" />
        <StatCard title="暂停租户" value={stats.suspended || 0} icon={Pause} color="orange" />
        <StatCard title="企业版租户" value={stats.enterprise || 0} icon={Crown} color="purple" />
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>租户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索租户名称或域名..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="suspended">已暂停</SelectItem>
                <SelectItem value="pending">待激活</SelectItem>
                <SelectItem value="deleted">已删除</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="计划筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部计划</SelectItem>
                <SelectItem value="free">免费版</SelectItem>
                <SelectItem value="starter">入门版</SelectItem>
                <SelectItem value="professional">专业版</SelectItem>
                <SelectItem value="enterprise">企业版</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 租户表格 */}
          <DataTable
            data={tenants}
            columns={columns}
            loading={isLoading}
            emptyMessage="暂无租户数据"
          />
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除租户 "{deleteDialog.tenant?.name}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTenant.isPending}>
              {deleteTenant.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 暂停/激活确认对话框 */}
      <Dialog open={suspendDialog.open} onOpenChange={open => setSuspendDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {suspendDialog.tenant?.status === 'active' ? '暂停租户' : '激活租户'}
            </DialogTitle>
            <DialogDescription>
              确定要{suspendDialog.tenant?.status === 'active' ? '暂停' : '激活'}租户 "
              {suspendDialog.tenant?.name}" 吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false })}>
              取消
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={suspendTenant.isPending || activateTenant.isPending}
            >
              {suspendTenant.isPending || activateTenant.isPending
                ? '处理中...'
                : suspendDialog.tenant?.status === 'active'
                  ? '确认暂停'
                  : '确认激活'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TenantList
