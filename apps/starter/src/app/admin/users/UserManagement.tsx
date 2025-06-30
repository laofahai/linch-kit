'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
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
  DialogTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@linch-kit/ui/components'
import { Plus, Users, UserCheck, Shield } from 'lucide-react'

import { UserTable } from '@/components/admin/UserTable'

// 创建用户表单schema
const createUserSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  name: z.string().min(2, '姓名至少2个字符'),
  password: z.string().min(8, '密码至少8个字符').optional(),
  roles: z.array(z.string()),
  tenantId: z.string().optional(),
})

type CreateUserForm = z.infer<typeof createUserSchema>

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      roles: [],
      tenantId: '',
    },
  })

  const handleCreateUser = (data: CreateUserForm) => {
    console.log('Creating user:', data)
    // TODO: 实现创建用户逻辑
    setIsCreateDialogOpen(false)
    form.reset()
  }

  const handleUserEdit = (user: any) => {
    setSelectedUser(user)
    setIsCreateDialogOpen(true)
    // 填充表单数据
    form.reset({
      email: user.email,
      name: user.name,
      roles: user.roles,
      tenantId: user.tenantId,
    })
  }

  const handleUserDelete = (userId: string) => {
    console.log('Deleting user:', userId)
    // TODO: 实现删除用户逻辑
  }

  const handleUserCreate = () => {
    setSelectedUser(null)
    setIsCreateDialogOpen(true)
    form.reset()
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

      {/* 用户表格 */}
      <UserTable 
        onUserEdit={handleUserEdit}
        onUserDelete={handleUserDelete}
        onUserCreate={handleUserCreate}
      />

      {/* 创建/编辑用户对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? '编辑用户' : '添加新用户'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? '修改用户信息。保存后用户将收到通知。' 
                : '创建新的用户账户。用户创建后将收到邮件通知。'
              }
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
              {!selectedUser && (
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
              )}
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
                <Button type="submit">
                  {selectedUser ? '保存更改' : '创建用户'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}