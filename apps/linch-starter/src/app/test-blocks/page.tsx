"use client"

import { useState } from "react"
import { Home, Users, Settings, BarChart3, FileText, Bell } from "lucide-react"
import { 
  DashboardLayout, 
  LoginForm, 
  RegisterForm, 
  StatsCard, 
  StatsGrid, 
  ChartContainer,
  GridLayout,
  ListLayout
} from "@linch-kit/ui/blocks"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@linch-kit/ui"

// 示例导航配置
const navigation = [
  {
    title: "首页",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "用户管理",
    href: "/users",
    icon: Users,
  },
  {
    title: "数据分析",
    href: "/analytics",
    icon: BarChart3,
    children: [
      {
        title: "概览",
        href: "/analytics/overview",
      },
      {
        title: "报告",
        href: "/analytics/reports",
      },
    ],
  },
  {
    title: "文档",
    href: "/docs",
    icon: FileText,
  },
  {
    title: "设置",
    href: "/settings",
    icon: Settings,
  },
]

// 示例统计数据
const statsData = [
  {
    title: "总用户数",
    value: "2,543",
    description: "活跃用户",
    change: 12.5,
    changePeriod: "vs 上月",
    icon: Users,
    actions: [
      { label: "查看详情", onClick: () => console.log("查看用户详情") },
      { label: "导出数据", onClick: () => console.log("导出用户数据") },
    ],
  },
  {
    title: "月收入",
    value: "¥45,231",
    description: "本月收入",
    change: -2.1,
    changePeriod: "vs 上月",
    icon: BarChart3,
  },
  {
    title: "订单数量",
    value: "1,234",
    description: "本月订单",
    change: 8.3,
    changePeriod: "vs 上月",
    icon: FileText,
  },
  {
    title: "转化率",
    value: "3.2%",
    description: "平均转化率",
    change: 0.5,
    changePeriod: "vs 上月",
    icon: Bell,
  },
]

export default function TestBlocksPage() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authSuccess, setAuthSuccess] = useState("")

  // 认证表单处理
  const handleAuthSubmit = async (data: any) => {
    setAuthLoading(true)
    setAuthError("")
    setAuthSuccess("")

    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log("认证数据:", data)
      setAuthSuccess(authMode === "login" ? "登录成功！" : "注册成功！")
    } catch (error) {
      setAuthError("操作失败，请重试")
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <DashboardLayout
      sidebar={{
        logo: (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="font-semibold">LinchKit</span>
          </div>
        ),
        navigation,
        footer: (
          <div className="text-xs text-muted-foreground">
            © 2024 LinchKit
          </div>
        ),
      }}
      header={{
        breadcrumb: true,
        themeToggle: true,
        userMenu: (
          <Button variant="ghost" size="sm">
            用户菜单
          </Button>
        ),
        actions: (
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            通知
          </Button>
        ),
      }}
    >
      <div className="space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">UI Blocks 测试</h1>
          <p className="text-muted-foreground mt-2">
            测试 Dashboard Layout、Authentication Forms 和 Data Display Blocks
          </p>
        </div>

        {/* 统计卡片网格 */}
        <Card>
          <CardHeader>
            <CardTitle>统计卡片网格</CardTitle>
            <CardDescription>
              响应式统计卡片布局，支持趋势指示器和操作菜单
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatsGrid data={statsData} />
          </CardContent>
        </Card>

        {/* 图表容器示例 */}
        <ChartContainer
          title="收入趋势"
          description="过去6个月的收入变化趋势"
          actions={
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">导出</Button>
              <Button variant="outline" size="sm">刷新</Button>
            </div>
          }
        >
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">
              图表组件将在这里显示
              <br />
              <span className="text-sm">(预留给未来的图表库集成)</span>
            </p>
          </div>
        </ChartContainer>

        {/* 认证表单测试 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>认证表单测试</CardTitle>
              <CardDescription>
                测试登录和注册表单组件
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant={authMode === "login" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMode("login")}
                >
                  登录表单
                </Button>
                <Button
                  variant={authMode === "register" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAuthMode("register")}
                >
                  注册表单
                </Button>
              </div>

              {authMode === "login" ? (
                <LoginForm
                  onSubmit={handleAuthSubmit}
                  loading={authLoading}
                  error={authError}
                  success={authSuccess}
                />
              ) : (
                <RegisterForm
                  onSubmit={handleAuthSubmit}
                  loading={authLoading}
                  error={authError}
                  success={authSuccess}
                />
              )}
            </CardContent>
          </Card>

          {/* 布局组件测试 */}
          <Card>
            <CardHeader>
              <CardTitle>布局组件测试</CardTitle>
              <CardDescription>
                测试 GridLayout 和 ListLayout 组件
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Grid Layout</h4>
                <GridLayout gap="sm">
                  {statsData.slice(0, 4).map((stats, index) => (
                    <StatsCard key={index} data={stats} />
                  ))}
                </GridLayout>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">List Layout</h4>
                <ListLayout gap="sm">
                  {statsData.slice(0, 2).map((stats, index) => (
                    <StatsCard key={index} data={stats} />
                  ))}
                </ListLayout>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能演示说明 */}
        <Card>
          <CardHeader>
            <CardTitle>功能特性</CardTitle>
            <CardDescription>
              UI Blocks 组件的主要功能特性
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Dashboard Layout</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 响应式侧边栏导航</li>
                  <li>• 自动面包屑导航</li>
                  <li>• 移动端抽屉菜单</li>
                  <li>• 主题切换集成</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Authentication Forms</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 基于 FormBuilder 构建</li>
                  <li>• Zod 验证集成</li>
                  <li>• 加载状态和错误处理</li>
                  <li>• 响应式设计</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Data Display</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 统计卡片和趋势指示器</li>
                  <li>• 图表容器预留接口</li>
                  <li>• 灵活的布局组件</li>
                  <li>• 加载状态支持</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
