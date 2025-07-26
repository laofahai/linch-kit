/**
 * 用户列表页面
 *
 * 显示系统中所有用户的列表，支持搜索、筛选和用户管理操作
 */

'use client'

import React, { useState } from 'react'
import {
  Button,
  Input,
} from '@linch-kit/ui/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@linch-kit/ui/server'
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
  UserX,
  UserCheck,
  Users,
  Shield,
  Crown,
  Calendar,
  Mail,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

import { DataTable } from '../../components/shared/DataTable'
import { StatCard } from '../../components/shared/StatCard'
import { useUsers, useUserOperations } from '../../hooks/useUsers'
import { useConsoleTranslation } from '../../i18n'
import { useConsolePermission } from '../../providers/ConsoleProvider'

/**
 * 用户列表主页面
 */
export function UserList() {
  const t = useConsoleTranslation()
  const canCreate = useConsolePermission('user:create')
  const canEdit = useConsolePermission('user:edit')
  const canDelete = useConsolePermission('user:delete')
  const canSuspend = useConsolePermission('user:suspend')
  const canManageRoles = useConsolePermission('user:manage_roles')

  // 状态管理
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [tenantFilter, setTenantFilter] = useState<string>('all')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    user?: Record<string, unknown>
  }>({ open: false })
  const [suspendDialog, setSuspendDialog] = useState<{
    open: boolean
    user?: Record<string, unknown>
  }>({ open: false })

  // 数据获取
  const {
    data: usersData,
    isLoading,
    error,
  } = useUsers({
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    role: roleFilter === 'all' ? undefined : roleFilter,
    tenantId: tenantFilter === 'all' ? undefined : tenantFilter,
    page: 1,
    pageSize: 20,
  })

  // 操作hooks
  const { deleteUser, suspendUser, activateUser } = useUserOperations()

  const users = usersData?.data || []
  const stats = usersData?.stats || {}

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

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'destructive'
      case 'tenant_admin':
        return 'default'
      case 'manager':
        return 'secondary'
      case 'user':
        return 'outline'
      default:
        return 'outline'
    }
  }

  // 处理删除
  const handleDelete = async () => {
    if (!deleteDialog.user) return

    try {
      await deleteUser.mutateAsync(String(deleteDialog.user.id))
      setDeleteDialog({ open: false })
    } catch (error) {
      console.error('Delete user failed:', error)
    }
  }

  // 处理暂停/激活
  const handleSuspend = async () => {
    if (!suspendDialog.user) return

    try {
      if (suspendDialog.user.status === 'active') {
        await suspendUser.mutateAsync(String(suspendDialog.user.id))
      } else {
        await activateUser.mutateAsync(String(suspendDialog.user.id))
      }
      setSuspendDialog({ open: false })
    } catch (error) {
      console.error('Suspend/Activate user failed:', error)
    }
  }

  // 表格列定义
  const columns = [
    {
      key: 'user',
      title: '用户信息',
      render: (user: Record<string, unknown>) => (
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={String(user.avatar || '')} alt={String(user.name)} />
            <AvatarFallback>
              {String(user.name || '?')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
                {String(user.name)}
              </Link>
              {user.role === 'system_admin' && <Crown className="h-4 w-4 text-yellow-500" />}
              {user.role === 'tenant_admin' && <Shield className="h-4 w-4 text-blue-500" />}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span>{String(user.email)}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'tenant',
      title: '所属租户',
      render: (user: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{String(user.tenantName || '系统用户')}</span>
        </div>
      ),
    },
    {
      key: 'role',
      title: '角色',
      render: (user: Record<string, unknown>) => (
        <Badge variant={getRoleColor(String(user.role))}>
          {t(`console.entities.user.roles.${user.role}`)}
        </Badge>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (user: Record<string, unknown>) => (
        <Badge variant={getStatusColor(String(user.status))}>
          {t(`console.entities.user.status.${user.status}`)}
        </Badge>
      ),
    },
    {
      key: 'lastLoginAt',
      title: '最后登录',
      render: (user: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {user.lastLoginAt
              ? format(new Date(String(user.lastLoginAt)), 'yyyy-MM-dd HH:mm')
              : '从未登录'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (user: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}`}>查看详情</Link>
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${user.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </Link>
              </DropdownMenuItem>
            )}
            {canManageRoles && (
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${user.id}/roles`}>
                  <Shield className="mr-2 h-4 w-4" />
                  角色权限
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {canSuspend && user.role !== 'system_admin' && (
              <DropdownMenuItem onClick={() => setSuspendDialog({ open: true, user })}>
                {user.status === 'active' ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    暂停
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    激活
                  </>
                )}
              </DropdownMenuItem>
            )}
            {canDelete && user.status !== 'active' && user.role !== 'system_admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialog({ open: true, user })}
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
            <div className="text-center text-destructive">加载用户列表失败: {String(error)}</div>
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
          <h1 className="text-3xl font-bold tracking-tight">{t('console.users.title')}</h1>
          <p className="text-muted-foreground">管理系统中的所有用户账户</p>
        </div>

        {canCreate && (
          <Button asChild>
            <Link href="/admin/users/create">
              <Plus className="h-4 w-4 mr-2" />
              {t('console.users.createUser')}
            </Link>
          </Button>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="总用户数"
          value={stats.total || 0}
          icon={<Users className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          title="活跃用户"
          value={stats.active || 0}
          icon={<UserCheck className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          title="管理员"
          value={stats.admins || 0}
          icon={<Shield className="h-4 w-4" />}
          variant="primary"
        />
        <StatCard
          title="今日新增"
          value={stats.todayNew || 0}
          icon={<Plus className="h-4 w-4" />}
          variant="warning"
        />
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户名称或邮箱..."
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

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="角色筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="system_admin">系统管理员</SelectItem>
                <SelectItem value="tenant_admin">租户管理员</SelectItem>
                <SelectItem value="manager">管理员</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="租户筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部租户</SelectItem>
                <SelectItem value="system">系统用户</SelectItem>
                {/* 这里应该动态加载租户列表 */}
              </SelectContent>
            </Select>
          </div>

          {/* 用户表格 */}
          <DataTable
            data={users}
            columns={columns}
            loading={isLoading}
            emptyMessage="暂无用户数据"
          />
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除用户 "{String(deleteDialog.user?.name)}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 暂停/激活确认对话框 */}
      <Dialog open={suspendDialog.open} onOpenChange={open => setSuspendDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {suspendDialog.user?.status === 'active' ? '暂停用户' : '激活用户'}
            </DialogTitle>
            <DialogDescription>
              确定要{suspendDialog.user?.status === 'active' ? '暂停' : '激活'}用户 "
              {String(suspendDialog.user?.name)}" 吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false })}>
              取消
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={suspendUser.isPending || activateUser.isPending}
            >
              {suspendUser.isPending || activateUser.isPending
                ? '处理中...'
                : suspendDialog.user?.status === 'active'
                  ? '确认暂停'
                  : '确认激活'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserList