'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@linch-kit/ui'
import { Badge } from '@linch-kit/ui'
import { Button } from '@linch-kit/ui'
import { Progress } from '@linch-kit/ui'
import { Avatar, AvatarFallback } from '@linch-kit/ui'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import {
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react'

// 真实的数据类型定义
export interface HealthStatus {
  status: 'healthy' | 'warning' | 'error'
  uptime: string
  database: boolean
  redis?: boolean
  memory: number
  cpu: number
  disk: number
  responseTime: number
  lastCheck: string
}

export interface SystemInfo {
  version: string
  environment: string
  nodeVersion: string
  platform: string
  totalMemory: string
  freeMemory: string
  loadAverage: number[]
  pid: number
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyRevenue: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  conversionRate: number
  bounceRate: number
  avgSessionDuration: number
  topPages: Array<{
    path: string
    views: number
    bounce: number
  }>
  recentActivity: Array<{
    id: string
    user: string
    action: string
    timestamp: string
    details?: unknown
  }>
  revenueHistory: Array<{
    date: string
    revenue: number
    orders: number
    users: number
  }>
  userGrowth: Array<{
    date: string
    newUsers: number
    activeUsers: number
    churnRate: number
  }>
  deviceStats: Array<{
    device: string
    users: number
    percentage: number
  }>
  trafficSources: Array<{
    source: string
    users: number
    percentage: number
    color: string
  }>
}

interface DashboardContentProps {
  healthStatus?: HealthStatus
  systemInfo?: SystemInfo
  dashboardStats?: DashboardStats
}

// 颜色配置
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#6366f1',
  chart: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#06b6d4', '#84cc16']
}

// 性能等级判断
const getPerformanceLevel = (value: number, type: 'cpu' | 'memory' | 'disk' | 'response') => {
  const thresholds = {
    cpu: { good: 70, warning: 85 },
    memory: { good: 70, warning: 85 },
    disk: { good: 80, warning: 90 },
    response: { good: 200, warning: 500 }
  }
  
  const threshold = thresholds[type]
  if (type === 'response') {
    if (value <= threshold.good) return 'good'
    if (value <= threshold.warning) return 'warning'
    return 'poor'
  } else {
    if (value <= threshold.good) return 'good'
    if (value <= threshold.warning) return 'warning'
    return 'poor'
  }
}

// 格式化数字
const formatNumber = (num: number, type: 'currency' | 'percentage' | 'number' = 'number') => {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(num)
    case 'percentage':
      return `${num.toFixed(1)}%`
    default:
      return new Intl.NumberFormat('zh-CN').format(num)
  }
}

// // 计算增长率 - 暂时未使用
// const calculateGrowth = (current: number, previous: number) => {
//   if (previous === 0) return 0
//   return ((current - previous) / previous) * 100
// }

export function DashboardContent({ healthStatus, systemInfo, dashboardStats }: DashboardContentProps) {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'orders'>('revenue')
  // const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  // 模拟实时数据更新
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: dashboardStats?.activeUsers || 2350,
    currentRevenue: dashboardStats?.totalRevenue || 452318,
    pendingOrders: dashboardStats?.pendingOrders || 23
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        currentRevenue: prev.currentRevenue + Math.floor(Math.random() * 1000),
        pendingOrders: prev.pendingOrders + Math.floor(Math.random() * 3 - 1)
      }))
    }, 10000) // 每10秒更新

    return () => clearInterval(interval)
  }, [])

  // 默认数据（当API数据不可用时）
  const defaultStats: DashboardStats = {
    totalUsers: 15420,
    activeUsers: realTimeData.activeUsers,
    totalRevenue: realTimeData.currentRevenue,
    monthlyRevenue: 89450,
    totalOrders: 5680,
    pendingOrders: realTimeData.pendingOrders,
    completedOrders: 5420,
    conversionRate: 24.5,
    bounceRate: 32.1,
    avgSessionDuration: 342,
    topPages: [
      { path: '/dashboard', views: 12450, bounce: 28 },
      { path: '/products', views: 8920, bounce: 35 },
      { path: '/analytics', views: 6780, bounce: 22 },
      { path: '/users', views: 4560, bounce: 31 }
    ],
    recentActivity: [
      { id: '1', user: '张三', action: '完成订单支付 ¥3,200', timestamp: '2分钟前' },
      { id: '2', user: '李四', action: '注册新账户', timestamp: '5分钟前' },
      { id: '3', user: '王五', action: '更新个人资料', timestamp: '8分钟前' },
      { id: '4', user: '赵六', action: '添加商品到购物车', timestamp: '12分钟前' },
      { id: '5', user: '钱七', action: '查看产品详情', timestamp: '15分钟前' }
    ],
    revenueHistory: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: 10000 + Math.random() * 15000,
      orders: 100 + Math.random() * 200,
      users: 50 + Math.random() * 100
    })),
    userGrowth: Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      newUsers: 800 + Math.random() * 400,
      activeUsers: 1500 + Math.random() * 800,
      churnRate: 5 + Math.random() * 5
    })),
    deviceStats: [
      { device: '桌面端', users: 8900, percentage: 58 },
      { device: '移动端', users: 5200, percentage: 34 },
      { device: '平板端', users: 1200, percentage: 8 }
    ],
    trafficSources: [
      { source: '直接访问', users: 6500, percentage: 42, color: COLORS.chart[0] },
      { source: '搜索引擎', users: 4200, percentage: 27, color: COLORS.chart[1] },
      { source: '社交媒体', users: 2800, percentage: 18, color: COLORS.chart[2] },
      { source: '邮件推广', users: 1300, percentage: 8, color: COLORS.chart[3] },
      { source: '其他', users: 700, percentage: 5, color: COLORS.chart[4] }
    ]
  }

  const stats = dashboardStats || defaultStats

  const defaultHealth: HealthStatus = {
    status: 'healthy',
    uptime: '15天 8小时 32分钟',
    database: true,
    redis: true,
    memory: 68,
    cpu: 45,
    disk: 72,
    responseTime: 125,
    lastCheck: new Date().toISOString()
  }

  const health = healthStatus || defaultHealth

  // 系统性能数据
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 68, network: 23 },
    { time: '04:00', cpu: 38, memory: 72, network: 18 },
    { time: '08:00', cpu: 65, memory: 78, network: 45 },
    { time: '12:00', cpu: 72, memory: 82, network: 58 },
    { time: '16:00', cpu: 68, memory: 75, network: 52 },
    { time: '20:00', cpu: 55, memory: 71, network: 38 },
    { time: '23:59', cpu: health.cpu, memory: health.memory, network: 28 }
  ]

  return (
    <div className="space-y-6">
      {/* 系统健康状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 系统状态 */}
        <Card className="relative overflow-hidden">
          <div className={`absolute inset-0 opacity-10 ${
            health.status === 'healthy' ? 'bg-green-500' :
            health.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统状态</CardTitle>
            {health.status === 'healthy' ? 
              <CheckCircle className="h-4 w-4 text-green-600" /> :
              health.status === 'warning' ?
              <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
              <AlertTriangle className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-2">
              <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                {health.status === 'healthy' ? '健康' : health.status === 'warning' ? '警告' : '错误'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              运行时间: {health.uptime}
            </p>
          </CardContent>
        </Card>

        {/* CPU 使用率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU 使用率</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.cpu}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={health.cpu} className="flex-1 h-2" />
              <Badge variant={getPerformanceLevel(health.cpu, 'cpu') === 'good' ? 'default' : 
                getPerformanceLevel(health.cpu, 'cpu') === 'warning' ? 'secondary' : 'destructive'}>
                {getPerformanceLevel(health.cpu, 'cpu') === 'good' ? '良好' : 
                 getPerformanceLevel(health.cpu, 'cpu') === 'warning' ? '一般' : '高'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 内存使用率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.memory}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={health.memory} className="flex-1 h-2" />
              <Badge variant={getPerformanceLevel(health.memory, 'memory') === 'good' ? 'default' : 
                getPerformanceLevel(health.memory, 'memory') === 'warning' ? 'secondary' : 'destructive'}>
                {getPerformanceLevel(health.memory, 'memory') === 'good' ? '良好' : 
                 getPerformanceLevel(health.memory, 'memory') === 'warning' ? '一般' : '高'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* API 响应时间 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API 响应</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.responseTime}ms</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getPerformanceLevel(health.responseTime, 'response') === 'good' ? 'default' : 
                getPerformanceLevel(health.responseTime, 'response') === 'warning' ? 'secondary' : 'destructive'}>
                {getPerformanceLevel(health.responseTime, 'response') === 'good' ? '快速' : 
                 getPerformanceLevel(health.responseTime, 'response') === 'warning' ? '一般' : '慢'}
              </Badge>
              <span className="text-xs text-muted-foreground">平均响应</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 核心业务指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 opacity-50" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{formatNumber(stats.totalRevenue, 'currency')}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">+12.5%</span>
              <span className="text-xs text-muted-foreground">较上月</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 opacity-50" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{formatNumber(stats.activeUsers)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">+8.2%</span>
              <span className="text-xs text-muted-foreground">较上周</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 opacity-50" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理订单</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{formatNumber(stats.pendingOrders)}</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">需要关注</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 opacity-50" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化率</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold">{formatNumber(stats.conversionRate, 'percentage')}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">+3.1%</span>
              <span className="text-xs text-muted-foreground">较上月</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要图表区域 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* 收入趋势图 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>收入趋势分析</CardTitle>
                <CardDescription>过去30天的收入、订单和用户增长</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={selectedMetric === 'revenue' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedMetric('revenue')}
                >
                  收入
                </Button>
                <Button 
                  variant={selectedMetric === 'orders' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedMetric('orders')}
                >
                  订单
                </Button>
                <Button 
                  variant={selectedMetric === 'users' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedMetric('users')}
                >
                  用户
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueHistory}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{label ? new Date(label).toLocaleDateString('zh-CN') : ''}</p>
                            {payload.map((entry, index) => (
                              <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {selectedMetric === 'revenue' ? '收入' : selectedMetric === 'orders' ? '订单' : '用户'}: 
                                {selectedMetric === 'revenue' ? formatNumber(Number(entry.value), 'currency') : formatNumber(Number(entry.value))}
                              </p>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 流量来源 */}
        <Card>
          <CardHeader>
            <CardTitle>流量来源分析</CardTitle>
            <CardDescription>用户访问来源分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="users"
                  >
                    {stats.trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatNumber(Number(value)), '用户数']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {stats.trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatNumber(source.users)}</span>
                    <span className="text-xs text-muted-foreground">({source.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 实时活动和性能监控 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 实时活动 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>实时活动</CardTitle>
                <CardDescription>最近的用户活动和系统事件</CardDescription>
              </div>
              <Badge variant="outline" className="animate-pulse">
                实时
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{activity.user[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                查看全部活动
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 系统性能监控 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>性能监控</CardTitle>
                <CardDescription>24小时系统性能趋势</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpu" stroke={COLORS.chart[0]} strokeWidth={2} name="CPU" />
                  <Line type="monotone" dataKey="memory" stroke={COLORS.chart[1]} strokeWidth={2} name="内存" />
                  <Line type="monotone" dataKey="network" stroke={COLORS.chart[2]} strokeWidth={2} name="网络" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* 关键指标 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{health.cpu}%</div>
                <div className="text-xs text-muted-foreground">CPU</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{health.memory}%</div>
                <div className="text-xs text-muted-foreground">内存</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{health.disk}%</div>
                <div className="text-xs text-muted-foreground">磁盘</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 热门页面和设备统计 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 热门页面 */}
        <Card>
          <CardHeader>
            <CardTitle>热门页面</CardTitle>
            <CardDescription>访问量最高的页面和跳出率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{page.path}</div>
                      <div className="text-sm text-muted-foreground">
                        跳出率: {page.bounce}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatNumber(page.views)}</div>
                    <div className="text-sm text-muted-foreground">浏览量</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 设备统计 */}
        <Card>
          <CardHeader>
            <CardTitle>设备分析</CardTitle>
            <CardDescription>不同设备类型的用户分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.deviceStats.map((device, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{device.device}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatNumber(device.users)}</span>
                      <span className="text-xs text-muted-foreground">({device.percentage}%)</span>
                    </div>
                  </div>
                  <Progress value={device.percentage} className="h-2" />
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-2">设备洞察</div>
              <div className="text-sm text-muted-foreground">
                移动端用户占比 {stats.deviceStats.find(d => d.device === '移动端')?.percentage}%，
                建议优化移动端体验以提升转化率。
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 系统信息详情 */}
      {systemInfo && (
        <Card>
          <CardHeader>
            <CardTitle>系统信息详情</CardTitle>
            <CardDescription>服务器环境和运行时信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">版本信息</span>
                </div>
                <div className="text-2xl font-bold">{systemInfo.version}</div>
                <div className="text-sm text-muted-foreground">LinchKit Framework</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">运行环境</span>
                </div>
                <div className="text-2xl font-bold capitalize">{systemInfo.environment}</div>
                <div className="text-sm text-muted-foreground">{systemInfo.platform}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">内存信息</span>
                </div>
                <div className="text-2xl font-bold">{systemInfo.totalMemory}</div>
                <div className="text-sm text-muted-foreground">可用: {systemInfo.freeMemory}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">负载均衡</span>
                </div>
                <div className="text-2xl font-bold">
                  {systemInfo.loadAverage?.[0]?.toFixed(2) || '0.45'}
                </div>
                <div className="text-sm text-muted-foreground">1分钟平均</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}