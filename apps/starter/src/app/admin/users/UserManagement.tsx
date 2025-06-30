'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@linch-kit/ui/components'
import { Plus, Search, Edit, Trash2, Users, Mail, UserCheck, UserX, Shield } from 'lucide-react'

import { trpc as _trpc } from '@/components/providers/Providers'

// 创建用户表单schema
const createUserSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  name: z.string().min(2, '姓名至少2个字符'),
  password: z.string().min(8, '密码至少8个字符').optional(),
  roles: z.array(z.string()).default([]),
  tenantId: z.string().optional(),
})

type CreateUserForm = {
  email: string
  name: string
  password?: string
  roles: string[]
  tenantId?: string
}

// 模拟用户数据
const mockUsers = [
  {
    id: 'user-1',
    name: '张三',
    email: 'zhang.san@example.com',
    roles: ['admin', 'user'],
    status: 'active',
    tenantId: 'tenant-1',
    tenantName: '示例企业',
    lastLogin: '2025-06-30T10:30:00Z',
    createdAt: '2025-06-01T09:00:00Z',
  },
  {
    id: 'user-2',
    name: '李四',
    email: 'li.si@example.com',
    roles: ['user'],
    status: 'active',
    tenantId: 'tenant-1',
    tenantName: '示例企业',
    lastLogin: '2025-06-29T16:45:00Z',
    createdAt: '2025-06-15T14:30:00Z',
  },
  {
    id: 'user-3',
    name: '王五',
    email: 'wang.wu@demo.com',
    roles: ['user'],
    status: 'inactive',
    tenantId: 'tenant-2',
    tenantName: '演示公司',
    lastLogin: '2025-06-20T08:15:00Z',
    createdAt: '2025-05-20T11:00:00Z',
  },
]

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      roles: [] as string[],
      tenantId: '',
    },
  })

  // 过滤用户
  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.tenantName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateUser = (data: CreateUserForm) => {
    console.log('Creating user:', data)
    // TODO: 实现创建用户逻辑
    setIsCreateDialogOpen(false)
    form.reset()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><UserCheck className="w-3 h-3 mr-1" />活跃</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><UserX className="w-3 h-3 mr-1" />停用</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Users className="w-3 h-3 mr-1" />待激活</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadges = (roles: string[]) => {
    return roles.map(role => (
      <Badge key={role} variant="outline" className="mr-1">
        {role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
        {role}
      </Badge>
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 本月新增
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.filter(u => u.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              占总数的 {Math.round(mockUsers.filter(u => u.status === 'active').length / mockUsers.length * 100)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理员</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.filter(u => u.roles.includes('admin')).length}</div>
            <p className="text-xs text-muted-foreground">
              系统管理员数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日活跃</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              今日登录用户数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加用户
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>添加新用户</DialogTitle>
              <DialogDescription>
                创建新的用户账户。用户创建后将收到邮件通知。
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入用户姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>临时密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="留空将自动生成" {...field} />
                      </FormControl>
                      <FormDescription>
                        用户首次登录时需要更改密码
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所属租户</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择租户" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tenant-1">示例企业</SelectItem>
                          <SelectItem value="tenant-2">演示公司</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit">创建用户</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            显示了 {filteredUsers.length} 个用户，共 {mockUsers.length} 个
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>所属租户</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{user.tenantName}</div>
                    <div className="text-sm text-muted-foreground">{user.tenantId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getRoleBadges(user.roles)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(user.lastLogin)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}