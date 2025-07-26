/**
 * 用户详情页面
 *
 * 显示用户的详细信息，包括基本信息、权限、活动记录等
 */

'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Users,
  Mail,
  Calendar,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  Building2,
  Activity,
  Key,
  BarChart3,
  Download,
  Clock,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

import { DataTable } from '../../components/shared/DataTable'
import { StatCard } from '../../components/shared/StatCard'
import { useUser, useUserActivities, useUserOperations } from '../../hooks/useUsers'
import { useConsoleTranslation } from '../../i18n'
import { useConsolePermission } from '../../providers/ConsoleProvider'

/**
 * 用户详情主页面
 */
export function UserDetail() {
  const params = useParams()
  const userId = params.id as string
  const t = useConsoleTranslation()

  const canEdit = useConsolePermission('user:edit')
  const canDelete = useConsolePermission('user:delete')
  const canSuspend = useConsolePermission('user:suspend')
  const canManageRoles = useConsolePermission('user:manage_roles')

  // 状态管理
  const [activeTab, setActiveTab] = useState('overview')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [suspendDialog, setSuspendDialog] = useState(false)

  // 数据获取
  const { data: user, isLoading: userLoading } = useUser(userId)
  const { data: activities } = useUserActivities(userId)

  // 操作hooks
  const { deleteUser, suspendUser, activateUser } = useUserOperations()

  if (userLoading) {
    return <UserDetailSkeleton />
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">用户不存在</div>
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
    try {
      await deleteUser.mutateAsync(userId)
      setDeleteDialog(false)
      // 跳转到用户列表
      window.location.href = '/admin/users'
    } catch (error) {
      console.error('Delete user failed:', error)
    }
  }

  // 处理暂停/激活
  const handleSuspend = async () => {
    try {
      if (user.status === 'active') {
        await suspendUser.mutateAsync(userId)
      } else {
        await activateUser.mutateAsync(userId)
      }
      setSuspendDialog(false)
    } catch (error) {
      console.error('Suspend/Activate user failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
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
              <h1 className="text-3xl font-bold tracking-tight">{String(user.name)}</h1>
              <Badge variant={getStatusColor(String(user.status))}>
                {t(`console.entities.user.status.${user.status}`)}
              </Badge>
              <Badge variant={getRoleColor(String(user.role))}>
                {t(`console.entities.user.roles.${user.role}`)}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Mail className="h-4 w-4" />
                <span>{String(user.email)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Building2 className="h-4 w-4" />
                <span>{String(user.tenantName || '系统用户')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>加入于 {format(new Date(String(user.createdAt)), 'yyyy年MM月dd日')}</span>
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
            活动报告
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users/${userId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Link>
            </Button>
          )}
          {canManageRoles && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users/${userId}/roles`}>
                <Shield className="h-4 w-4 mr-2" />
                角色权限
              </Link>
            </Button>
          )}
          {canSuspend && user.role !== 'system_admin' && (
            <Button variant="outline" size="sm" onClick={() => setSuspendDialog(true)}>
              {user.status === 'active' ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  暂停
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  激活
                </>
              )}
            </Button>
          )}
          {canDelete && user.status !== 'active' && user.role !== 'system_admin' && (
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
          title="登录次数"
          value={user.loginCount || 0}
          icon={<Users className="h-4 w-4" />}
          variant="default"
        />
        <StatCard
          title="最后登录"
          value={user.lastLoginAt ? format(new Date(String(user.lastLoginAt)), 'MM-dd HH:mm') : '从未'}
          icon={<Clock className="h-4 w-4" />}
          variant="primary"
        />
        <StatCard
          title="活动次数"
          value={user.activityCount || 0}
          icon={<Activity className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          title="权限数量"
          value={user.permissionCount || 0}
          icon={<Key className="h-4 w-4" />}
          variant="warning"
        />
      </div>

      {/* 详细信息标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="profile">个人资料</TabsTrigger>
          <TabsTrigger value="permissions">权限管理</TabsTrigger>
          <TabsTrigger value="activities">活动记录</TabsTrigger>
          <TabsTrigger value="sessions">登录会话</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
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
                    <label className="text-sm font-medium text-muted-foreground">用户名</label>
                    <div className="mt-1">{String(user.name)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                    <div className="mt-1">{String(user.email)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">手机号</label>
                    <div className="mt-1">{String(user.phone || '未设置')}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">所属租户</label>
                    <div className="mt-1">{String(user.tenantName || '系统用户')}</div>
                  </div>
                </div>

                {user.department && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">部门</label>
                    <div className="mt-1">{String(user.department)}</div>
                  </div>
                )}

                {user.title && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">职位</label>
                    <div className="mt-1">{String(user.title)}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 账户信息 */}
            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">用户ID</label>
                    <div className="mt-1 font-mono text-sm">{String(user.id)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">账户状态</label>
                    <div className="mt-1">
                      <Badge variant={getStatusColor(String(user.status))}>
                        {t(`console.entities.user.status.${user.status}`)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">用户角色</label>
                    <div className="mt-1">
                      <Badge variant={getRoleColor(String(user.role))}>
                        {t(`console.entities.user.roles.${user.role}`)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">邮箱验证</label>
                    <div className="mt-1">
                      <Badge variant={user.emailVerified ? 'default' : 'secondary'}>
                        {user.emailVerified ? '已验证' : '未验证'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                    <div className="mt-1 text-sm">
                      {format(new Date(String(user.createdAt)), 'yyyy-MM-dd HH:mm:ss')}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">最后更新</label>
                    <div className="mt-1 text-sm">
                      {format(new Date(String(user.updatedAt)), 'yyyy-MM-dd HH:mm:ss')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最近活动 */}
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
            </CardHeader>
            <CardContent>
              {activities?.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity: Record<string, unknown>, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{String(activity.description)}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{String(activity.timestamp)}</span>
                          {activity.location && (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span>{String(activity.location)}</span>
                            </>
                          )}
                        </div>
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

        {/* 个人资料标签 */}
        <TabsContent value="profile" className="space-y-6">
          <UserProfile userId={userId} user={user} />
        </TabsContent>

        {/* 权限管理标签 */}
        <TabsContent value="permissions" className="space-y-6">
          <UserPermissions userId={userId} />
        </TabsContent>

        {/* 活动记录标签 */}
        <TabsContent value="activities" className="space-y-6">
          <UserActivities userId={userId} activities={activities || []} />
        </TabsContent>

        {/* 登录会话标签 */}
        <TabsContent value="sessions" className="space-y-6">
          <UserSessions userId={userId} />
        </TabsContent>

        {/* 设置标签 */}
        <TabsContent value="settings" className="space-y-6">
          <UserSettings userId={userId} user={user} />
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除用户 "{String(user.name)}" 吗？此操作无法撤销，将删除所有相关数据。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 暂停/激活确认对话框 */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.status === 'active' ? '暂停用户' : '激活用户'}</DialogTitle>
            <DialogDescription>
              确定要{user.status === 'active' ? '暂停' : '激活'}用户 "{String(user.name)}" 吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={suspendUser.isPending || activateUser.isPending}
            >
              {suspendUser.isPending || activateUser.isPending
                ? '处理中...'
                : user.status === 'active'
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
 * 用户资料组件
 */
function UserProfile({
  userId: _userId,
  user: _user,
}: {
  userId: string
  user: Record<string, unknown>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>个人资料</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">个人资料编辑功能开发中...</div>
      </CardContent>
    </Card>
  )
}

/**
 * 用户权限组件
 */
function UserPermissions({ userId: _userId }: { userId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>权限管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">权限管理功能开发中...</div>
      </CardContent>
    </Card>
  )
}

/**
 * 用户活动记录组件
 */
function UserActivities({
  userId: _userId,
  activities,
}: {
  userId: string
  activities: Record<string, unknown>[]
}) {
  const columns = [
    { key: 'action', label: '操作' },
    { key: 'resource', label: '资源' },
    { key: 'timestamp', label: '时间' },
    { key: 'location', label: '位置' },
    { key: 'status', label: '状态' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>活动记录</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          data={activities}
          columns={columns}
          emptyMessage="暂无活动记录"
        />
      </CardContent>
    </Card>
  )
}

/**
 * 用户会话组件
 */
function UserSessions({ userId: _userId }: { userId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>登录会话</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">会话管理功能开发中...</div>
      </CardContent>
    </Card>
  )
}

/**
 * 用户设置组件
 */
function UserSettings({
  userId: _userId,
  user: _user,
}: {
  userId: string
  user: Record<string, unknown>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>用户设置</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground">用户设置功能开发中...</div>
      </CardContent>
    </Card>
  )
}

/**
 * 用户详情骨架屏
 */
function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
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

export default UserDetail