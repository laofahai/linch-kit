/**
 * 用户管理页面
 * 展示完整的CRUD操作和权限控制
 */

'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/components/providers/trpc-provider'
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Input,
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
  Label,
  useToast
} from '@linch-kit/ui'
import { Logger } from '@linch-kit/core'
import { ChevronLeft, ChevronRight, Search, UserPlus, MoreHorizontal } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
  role: 'USER' | 'TENANT_ADMIN' | 'SUPER_ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: Date
  lastLoginAt: Date | null
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<User['status']>('ACTIVE')
  
  const limit = 10

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const result = await trpc.user.list.query({
        limit,
        offset: (currentPage - 1) * limit,
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter as User['role'],
      })
      
      setUsers(result.users)
      setTotal(result.total)
      Logger.info('用户列表获取成功', { count: result.users.length, total: result.total })
    } catch (error) {
      Logger.error('用户列表获取失败', error as Error)
      toast({
        title: '获取用户列表失败',
        description: '请检查您的权限或稍后重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新用户状态
  const updateUserStatus = async () => {
    if (!selectedUser) return
    
    try {
      setLoading(true)
      const result = await trpc.user.updateStatus.mutate({
        userId: selectedUser.id,
        status: newStatus,
      })
      
      if (result.success) {
        toast({
          title: '操作成功',
          description: result.message,
        })
        setShowStatusDialog(false)
        fetchUsers() // 刷新列表
      }
    } catch (error) {
      Logger.error('更新用户状态失败', error as Error)
      toast({
        title: '操作失败',
        description: '更新用户状态时出错',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 监听搜索和筛选变化
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchUsers()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search, roleFilter])

  // 监听页码变化
  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  const totalPages = Math.ceil(total / limit)

  const getRoleBadge = (role: User['role']) => {
    const variants = {
      USER: { variant: 'secondary' as const, label: '普通用户' },
      TENANT_ADMIN: { variant: 'default' as const, label: '租户管理员' },
      SUPER_ADMIN: { variant: 'destructive' as const, label: '超级管理员' },
    }
    const { variant, label } = variants[role]
    return <Badge variant={variant}>{label}</Badge>
  }

  const getStatusBadge = (status: User['status']) => {
    const variants = {
      ACTIVE: { variant: 'default' as const, label: '活跃' },
      INACTIVE: { variant: 'secondary' as const, label: '未激活' },
      SUSPENDED: { variant: 'outline' as const, label: '已暂停' },
      DELETED: { variant: 'destructive' as const, label: '已删除' },
    }
    const { variant, label } = variants[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <div className="w-full">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
            <p className="text-muted-foreground mt-2">
              管理系统中的所有用户账户和权限
            </p>
          </div>
          <Button onClick={() => toast({ title: '功能开发中', description: '创建用户功能即将推出' })}>
            <UserPlus className="h-4 w-4 mr-2" />
            创建用户
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户名或邮箱..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有角色</SelectItem>
                <SelectItem value="USER">普通用户</SelectItem>
                <SelectItem value="TENANT_ADMIN">租户管理员</SelectItem>
                <SelectItem value="SUPER_ADMIN">超级管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            共 {total} 个用户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>最后登录</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      没有找到用户
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                      <TableCell>
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN')
                          : '从未登录'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setNewStatus(user.status)
                            setShowStatusDialog(true)
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                显示第 {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, total)} 条，共 {total} 条
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <span className="text-sm">
                  第 {currentPage} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 状态更新对话框 */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新用户状态</DialogTitle>
            <DialogDescription>
              修改用户 {selectedUser?.name} 的账户状态
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                状态
              </Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as User['status'])}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">活跃</SelectItem>
                  <SelectItem value="INACTIVE">未激活</SelectItem>
                  <SelectItem value="SUSPENDED">暂停</SelectItem>
                  <SelectItem value="DELETED">删除</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              取消
            </Button>
            <Button onClick={updateUserStatus} disabled={loading}>
              {loading ? '更新中...' : '确认更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}