'use client'

import { DashboardContent } from '@/components/dashboard-content'
import { Skeleton } from '@linch-kit/ui'
import { api } from '@/lib/trpc-client'
import { type HealthStatus, type SystemInfo, type DashboardStats } from '@/components/dashboard-content'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@linch-kit/ui'
import { Button } from '@linch-kit/ui'
import { Badge } from '@linch-kit/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@linch-kit/ui'
import { Users, DollarSign, Activity, CreditCard, TrendingUp, Package, ShoppingCart, Calendar, Settings, Bell } from 'lucide-react'
import { Progress } from '@linch-kit/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@linch-kit/ui'

export default function DashboardPage() {
  const { data: healthData, isLoading: healthLoading } = api.health.status.useQuery()
  const { data: systemInfo, isLoading: systemLoading } = api.system.info.useQuery()
  const { data: stats, isLoading: statsLoading } = api.stats.dashboard.useQuery()

  const isLoading = healthLoading || systemLoading || statsLoading

  // 转换 healthData 为 HealthStatus 格式
  const convertedHealthData: HealthStatus | undefined = healthData ? {
    status: healthData.status === 'healthy' ? 'healthy' : healthData.status === 'degraded' ? 'warning' : 'error',
    uptime: '99.9%',
    database: healthData.status === 'healthy',
    memory: 65,
    cpu: 42,
    disk: 78,
    responseTime: 120,
    lastCheck: new Date().toISOString(),
  } : undefined

  // 转换 systemInfo 为 SystemInfo 格式
  const convertedSystemInfo: SystemInfo | undefined = systemInfo ? {
    version: systemInfo.version,
    environment: systemInfo.environment,
    nodeVersion: systemInfo.nodeVersion,
    platform: 'linux',
    totalMemory: '16GB',
    freeMemory: '8GB',
    loadAverage: [0.5, 0.7, 0.8],
    pid: 12345,
  } : undefined

  // 转换 stats 为 DashboardStats 格式
  const convertedStats: DashboardStats | undefined = stats ? {
    totalUsers: stats.totalUsers,
    activeUsers: stats.activeUsers,
    totalRevenue: stats.revenue,
    monthlyRevenue: stats.revenue * 0.1,
    totalOrders: stats.totalSessions,
    pendingOrders: Math.floor(stats.totalSessions * 0.1),
    completedOrders: Math.floor(stats.totalSessions * 0.9),
    conversionRate: (stats.activeUsers / stats.totalUsers) * 100,
    bounceRate: 32.5,
    avgSessionDuration: 245,
    topPages: [
      { path: '/dashboard', views: 1250, bounce: 28 },
      { path: '/users', views: 980, bounce: 35 },
      { path: '/settings', views: 756, bounce: 42 },
    ],
    recentActivity: [
      { id: '1', user: '张三', action: '创建用户', timestamp: '2分钟前' },
      { id: '2', user: '李四', action: '更新设置', timestamp: '5分钟前' },
      { id: '3', user: '王五', action: '删除数据', timestamp: '10分钟前' },
    ],
    revenueHistory: [
      { date: '2024-01', revenue: 45000, orders: 120, users: 98 },
      { date: '2024-02', revenue: 52000, orders: 135, users: 112 },
      { date: '2024-03', revenue: 48000, orders: 128, users: 105 },
    ],
    userGrowth: [
      { date: '2024-01', newUsers: 28, activeUsers: 450, churnRate: 2.1 },
      { date: '2024-02', newUsers: 35, activeUsers: 485, churnRate: 1.8 },
      { date: '2024-03', newUsers: 31, activeUsers: 516, churnRate: 2.3 },
    ],
    deviceStats: [
      { device: 'Desktop', users: 1250, percentage: 65 },
      { device: 'Mobile', users: 580, percentage: 30 },
      { device: 'Tablet', users: 96, percentage: 5 },
    ],
    trafficSources: [
      { source: 'Direct', users: 850, percentage: 45, color: '#3B82F6' },
      { source: 'Search', users: 640, percentage: 34, color: '#10B981' },
      { source: 'Social', users: 280, percentage: 15, color: '#F59E0B' },
      { source: 'Referral', users: 113, percentage: 6, color: '#EF4444' },
    ],
  } : undefined

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部欢迎区域 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">欢迎回来，管理员</h1>
          <p className="text-muted-foreground">
            今天是星期四，2025年1月3日。这是您的企业平台概览。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            查看日程
          </Button>
          <Button>
            <Activity className="mr-2 h-4 w-4" />
            查看实时数据
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">¥{stats?.revenue || '452,318.89'}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +20.1% 相比上月
            </p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{stats?.activeUsers || '2,350'}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +180 较上周
            </p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新订单</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{stats?.totalSessions || '1,234'}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +19% 相比上月
            </p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化率</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{((stats?.activeUsers || 0) / (stats?.totalUsers || 1) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +3.2% 相比上月
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
          <TabsTrigger value="reports">报告</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
            {/* 收入趋势图 */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>收入趋势</CardTitle>
                    <CardDescription>
                      过去12个月的收入变化趋势
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    配置
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DashboardContent
                  healthStatus={convertedHealthData}
                  systemInfo={convertedSystemInfo}
                  dashboardStats={convertedStats}
                />
              </CardContent>
            </Card>
            
            {/* 最新活动 */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle>最新活动</CardTitle>
                <CardDescription>
                  实时业务动态
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      user: '张三', 
                      action: '完成了订单支付', 
                      amount: '¥3,200', 
                      time: '2分钟前',
                      avatar: '/avatars/user1.jpg'
                    },
                    { 
                      user: '李四', 
                      action: '创建了新项目', 
                      amount: null, 
                      time: '15分钟前',
                      avatar: '/avatars/user2.jpg'
                    },
                    { 
                      user: '王五', 
                      action: '提交了报告', 
                      amount: null, 
                      time: '1小时前',
                      avatar: '/avatars/user3.jpg'
                    },
                    { 
                      user: '赵六', 
                      action: '更新了库存', 
                      amount: '1,800件', 
                      time: '2小时前',
                      avatar: '/avatars/user4.jpg'
                    },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.avatar} />
                        <AvatarFallback>{activity.user[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {activity.user} {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      {activity.amount && (
                        <div className="text-sm font-medium text-green-600">
                          {activity.amount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 性能指标 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">服务器性能</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU 使用率</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>内存使用率</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>磁盘使用率</span>
                    <span className="font-medium">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">业务指标</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">月度目标完成</span>
                  <span className="text-2xl font-bold text-green-600">85%</span>
                </div>
                <Progress value={85} className="h-2" />
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold">156</div>
                    <div className="text-xs text-muted-foreground">新客户</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">92%</div>
                    <div className="text-xs text-muted-foreground">满意度</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">团队概览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">在线团队成员</span>
                  <Badge variant="secondary">23/28</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>开发团队</span>
                    <span className="font-medium">8/10</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>设计团队</span>
                    <span className="font-medium">4/5</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>产品团队</span>
                    <span className="font-medium">6/8</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>运营团队</span>
                    <span className="font-medium">5/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>常用功能和快捷方式</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Package className="h-5 w-5" />
                  <span>产品管理</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>订单中心</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Users className="h-5 w-5" />
                  <span>客户管理</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Activity className="h-5 w-5" />
                  <span>营销活动</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>数据分析</CardTitle>
              <CardDescription>深入分析您的业务数据</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">高级分析功能</h3>
                <p className="text-muted-foreground mb-4">
                  包含实时数据分析、趋势预测、客户行为分析等功能正在开发中
                </p>
                <Button>
                  <Bell className="mr-2 h-4 w-4" />
                  订阅更新通知
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>报告中心</CardTitle>
              <CardDescription>生成和下载各类业务报告</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">企业级报告系统</h3>
                <p className="text-muted-foreground mb-4">
                  自动化报告生成、数据导出、定制报表等功能正在开发中
                </p>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  预约演示
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知中心</CardTitle>
              <CardDescription>管理您的所有通知和消息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: '系统更新',
                    message: 'LinchKit v4.2.0 已发布，包含多项改进',
                    time: '5分钟前',
                    type: 'info',
                    unread: true
                  },
                  {
                    title: '新用户注册',
                    message: '3个新用户加入了您的租户',
                    time: '1小时前',
                    type: 'success',
                    unread: true
                  },
                  {
                    title: '权限变更',
                    message: '管理员角色权限已更新',
                    time: '2小时前',
                    type: 'warning',
                    unread: false
                  },
                  {
                    title: '备份完成',
                    message: '数据备份已成功完成',
                    time: '昨天',
                    type: 'success',
                    unread: false
                  }
                ].map((notification, index) => (
                  <div key={index} className={`flex items-start p-4 rounded-lg border ${notification.unread ? 'bg-muted/50' : ''}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                      notification.type === 'info' ? 'bg-blue-500' :
                      notification.type === 'success' ? 'bg-green-500' :
                      notification.type === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}