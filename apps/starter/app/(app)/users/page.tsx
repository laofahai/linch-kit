'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/shadcn'
import { Button } from '@linch-kit/ui/shadcn'
import { Badge } from '@linch-kit/ui/shadcn'
import { Input } from '@linch-kit/ui/shadcn'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@linch-kit/ui/shadcn'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@linch-kit/ui/shadcn'
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Filter
} from 'lucide-react'

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    role: 'user',
    status: 'inactive',
    createdAt: '2024-01-25',
  },
]

export default function UsersPage() {
  const { t } = useTranslation()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'user':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('nav.users')}
          </h1>
          <p className="text-muted-foreground">
            管理系统用户和权限
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filter')}
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('common.create')}用户
          </Button>
        </div>
      </div>

      {/* 搜索和操作栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>
                共 {mockUsers.length} 个用户
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`${t('common.search')}用户...`}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(user.status)}>
                      {user.status === 'active' ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              总用户数
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 较上月
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              活跃用户
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockUsers.filter(u => u.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              +1 较上月
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              管理员
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockUsers.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              无变化
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
