"use client"

import { useState } from 'react'
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  Checkbox,
  Switch,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Alert,
  AlertDescription,
  AlertTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Toast
} from '@linch-kit/ui'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AlertCircle, Info, Settings, User } from 'lucide-react'

const formSchema = z.object({
  username: z.string().min(2, {
    message: "用户名至少需要2个字符。",
  }),
  email: z.string().email({
    message: "请输入有效的邮箱地址。",
  }),
  bio: z.string().max(160, {
    message: "简介不能超过160个字符。",
  }),
  notifications: z.boolean().default(false),
  theme: z.string(),
})

/**
 * @description LinchKit UI 组件综合测试页面
 * @since v1.0.0
 */
export default function TestComponentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
      notifications: false,
      theme: "light",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    Toast.success("表单提交成功！", {
      description: `用户名: ${values.username}, 邮箱: ${values.email}`
    })
  }

  const tableData = [
    { id: "1", name: "张三", email: "zhangsan@example.com", role: "管理员" },
    { id: "2", name: "李四", email: "lisi@example.com", role: "用户" },
    { id: "3", name: "王五", email: "wangwu@example.com", role: "编辑" },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          LinchKit UI 组件库
        </h1>
        <p className="text-lg text-gray-600">
          基于 shadcn/ui 构建的企业级 React 组件库
        </p>
      </div>

      {/* 基础组件 */}
      <Card>
        <CardHeader>
          <CardTitle>基础组件</CardTitle>
          <CardDescription>按钮、输入框、标签等基础 UI 组件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>按钮组件</Label>
            <div className="flex gap-2 flex-wrap">
              <Button>默认按钮</Button>
              <Button variant="destructive">危险按钮</Button>
              <Button variant="outline">轮廓按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
              <Button variant="link">链接按钮</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-input">输入框组件</Label>
            <Input id="test-input" placeholder="请输入内容..." />
          </div>
        </CardContent>
      </Card>

      {/* 表单组件 */}
      <Card>
        <CardHeader>
          <CardTitle>表单组件</CardTitle>
          <CardDescription>完整的表单解决方案，集成 React Hook Form + Zod</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入用户名" {...field} />
                      </FormControl>
                      <FormDescription>
                        这是您的公开显示名称。
                      </FormDescription>
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
                        <Input placeholder="请输入邮箱" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>个人简介</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="告诉我们一些关于您的信息"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="notifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          邮件通知
                        </FormLabel>
                        <FormDescription>
                          接收关于您账户的邮件通知。
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

                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>主题</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择主题" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">浅色</SelectItem>
                          <SelectItem value="dark">深色</SelectItem>
                          <SelectItem value="system">系统</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit">提交表单</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 交互组件 */}
      <Card>
        <CardHeader>
          <CardTitle>交互组件</CardTitle>
          <CardDescription>对话框、弹出框、工具提示等交互组件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">打开对话框</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>编辑资料</DialogTitle>
                  <DialogDescription>
                    在这里修改您的资料信息。完成后点击保存。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      姓名
                    </Label>
                    <Input id="name" defaultValue="张三" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      用户名
                    </Label>
                    <Input id="username" defaultValue="@zhangsan" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => setIsDialogOpen(false)}>
                    保存更改
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">打开弹出框</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">尺寸设置</h4>
                    <p className="text-sm text-muted-foreground">
                      设置组件的尺寸和间距。
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="width">宽度</Label>
                      <Input
                        id="width"
                        defaultValue="100%"
                        className="col-span-2 h-8"
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="height">高度</Label>
                      <Input
                        id="height"
                        defaultValue="25px"
                        className="col-span-2 h-8"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">悬停提示</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>这是一个工具提示</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* 数据展示组件 */}
      <Card>
        <CardHeader>
          <CardTitle>数据展示组件</CardTitle>
          <CardDescription>表格、徽章、头像、警告等数据展示组件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 表格 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">数据表格</h3>
            <Table>
              <TableCaption>用户列表</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.name}`} />
                          <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === '管理员' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">打开菜单</span>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem>查看详情</DropdownMenuItem>
                          <DropdownMenuItem>编辑用户</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            删除用户
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 警告组件 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">警告提示</h3>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>提示</AlertTitle>
                <AlertDescription>
                  这是一个信息提示，用于显示一般性信息。
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>
                  这是一个错误提示，用于显示错误信息和警告。
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* 标签页 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">标签页</h3>
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account">账户</TabsTrigger>
                <TabsTrigger value="password">密码</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>账户信息</CardTitle>
                    <CardDescription>
                      在这里修改您的账户信息。
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="current">当前用户名</Label>
                      <Input id="current" defaultValue="@zhangsan" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new">新用户名</Label>
                      <Input id="new" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>保存更改</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="password" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>密码设置</CardTitle>
                    <CardDescription>
                      在这里修改您的密码。
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="current-password">当前密码</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new-password">新密码</Label>
                      <Input id="new-password" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>更新密码</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>如何在项目中使用这些组件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">安装</h4>
              <pre className="bg-gray-100 p-3 rounded-md text-sm">
                <code>pnpm add @linch-kit/ui</code>
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">导入组件</h4>
              <pre className="bg-gray-100 p-3 rounded-md text-sm">
                <code>{`import { Button, Card, Toast } from '@linch-kit/ui'`}</code>
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">特性</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>基于 shadcn/ui 构建，确保组件质量和一致性</li>
                <li>完整的 TypeScript 类型支持</li>
                <li>支持深色/浅色主题切换</li>
                <li>响应式设计，适配各种屏幕尺寸</li>
                <li>无障碍访问支持</li>
                <li>与 React Hook Form + Zod 完美集成</li>
                <li>基于 Sonner 的现代 Toast 通知系统</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
