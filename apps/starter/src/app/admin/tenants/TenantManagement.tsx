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
  Textarea,
  Switch,
} from '@linch-kit/ui/components'
import { Plus, Search, Trash2, Users, Building } from 'lucide-react'

import { trpc as _trpc } from '@/components/providers/Providers'

// 创建租户表单schema
const createTenantSchema = z.object({
  name: z.string().min(2, '名称至少2个字符'),
  slug: z.string().min(2, '标识符至少2个字符').regex(/^[a-z0-9-]+$/, '只能包含小写字母、数字和横线'),
  description: z.string().optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
  maxUsers: z.number().min(1).max(10000),
  maxStorage: z.number().min(100).max(1000000),
  maxApiCalls: z.number().min(1000).max(100000000),
  maxPlugins: z.number().min(0).max(100),
  domain: z.string().url().optional().or(z.literal('')),
  autoActivate: z.boolean(),
})

type CreateTenantForm = z.infer<typeof createTenantSchema>

export function TenantManagement() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // 查询租户列表 - TODO: Fix tRPC types
  // const { data: tenants, isLoading, refetch } = // trpc.console.tenant - TODO: Fix types.list.useQuery({
  //   page,
  //   pageSize: 10,
  //   search: search || undefined,
  // })
  const tenants = { 
    data: [] as Array<{
      id: string
      name: string
      slug: string
      status: string
      plan: string
      domain?: string
      description?: string
      userCount: number
      storageUsed: number
      createdAt: string
      _count?: { users: number }
      maxUsers: number
      quotas?: { storageLimit: number }
    }>, 
    total: 0,
    pageSize: 10
  }
  const isLoading = false
  const _refetch = () => {}

  // 创建租户 - TODO: Fix tRPC types  
  // const createMutation = // trpc.console.tenant - TODO: Fix types.create.useMutation({
  const createMutation = {
    mutate: (_data: unknown) => {},
    mutateAsync: async (_data: unknown) => {},
    isPending: false,
    isLoading: false
  }

  // 删除租户 - TODO: Fix tRPC types
  // const deleteMutation = // trpc.console.tenant - TODO: Fix types.delete.useMutation({
  const deleteMutation = {
    mutate: (_data: unknown) => {},
    isPending: false
  }

  // 切换状态 - TODO: Fix tRPC types
  const toggleStatusMutation = {
    mutate: (_data: unknown) => {},
    isPending: false
  }

  // 表单
  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      plan: 'free',
      maxUsers: 5,
      maxStorage: 1000,
      maxApiCalls: 10000,
      maxPlugins: 3,
      domain: '',
      autoActivate: true,
    },
  })

  // 提交创建
  async function onSubmit(data: CreateTenantForm) {
    try {
      await createMutation.mutateAsync(data)
      form.reset()
    } catch (error) {
      console.error('创建失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">租户管理</h1>
          <p className="text-muted-foreground mt-2">管理系统中的所有租户</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建租户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建新租户</DialogTitle>
              <DialogDescription>
                创建一个新的租户，设置基本信息和资源配额
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>租户名称</FormLabel>
                        <FormControl>
                          <Input placeholder="示例公司" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标识符</FormLabel>
                        <FormControl>
                          <Input placeholder="example-company" {...field} />
                        </FormControl>
                        <FormDescription>用于URL和API调用</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>描述</FormLabel>
                      <FormControl>
                        <Textarea placeholder="租户描述信息..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>订阅计划</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择计划" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">免费版</SelectItem>
                          <SelectItem value="starter">入门版</SelectItem>
                          <SelectItem value="professional">专业版</SelectItem>
                          <SelectItem value="enterprise">企业版</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>最大用户数</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxStorage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>存储配额 (MB)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="autoActivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">自动激活</FormLabel>
                        <FormDescription>
                          创建后立即激活租户
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={createMutation.isLoading}>
                    {createMutation.isLoading ? '创建中...' : '创建租户'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索租户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
      </Card>

      {/* 租户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>租户列表</CardTitle>
          <CardDescription>
            共 {tenants?.total || 0} 个租户
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : (
            <div className="space-y-4">
              {tenants?.data?.map((tenant) => (
                <Card key={tenant.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                        <CardDescription>{tenant.slug}</CardDescription>
                        {tenant.description && (
                          <p className="text-sm mt-2">{tenant.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                          {tenant.status === 'active' ? '活跃' : '暂停'}
                        </Badge>
                        <Badge variant="outline">{tenant.plan}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex justify-between">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {tenant._count?.users || 0} / {tenant.maxUsers} 用户
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        创建于 {new Date(tenant.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatusMutation.mutate(tenant.id)}
                      >
                        {tenant.status === 'active' ? '暂停' : '激活'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('确定要删除这个租户吗？')) {
                            deleteMutation.mutate(tenant.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        {tenants && tenants.total > tenants.pageSize && (
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              第 {page} 页，共 {Math.ceil(tenants.total / tenants.pageSize)} 页
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page * tenants.pageSize >= tenants.total}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}