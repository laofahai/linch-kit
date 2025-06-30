'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
} from '@linch-kit/ui/components'
import {
  Activity,
  Users,
  Building,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Cpu,
  HardDrive,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export function Dashboard() {
  // 模拟数据
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalTenants: 24,
    activeTenants: 22,
    systemHealth: 98.5,
    cpuUsage: 45,
    memoryUsage: 68,
    diskUsage: 34,
  }

  const recentActivities = [
    {
      id: 1,
      type: 'user_created',
      message: '新用户 李明 已注册',
      timestamp: '2 分钟前',
      status: 'success',
    },
    {
      id: 2,
      type: 'tenant_updated',
      message: '租户 "科技公司" 更新了配置',
      timestamp: '15 分钟前',
      status: 'info',
    },
    {
      id: 3,
      type: 'system_alert',
      message: '数据库连接池达到 80% 使用率',
      timestamp: '1 小时前',
      status: 'warning',
    },
    {
      id: 4,
      type: 'backup_completed',
      message: '每日数据备份已完成',
      timestamp: '2 小时前',
      status: 'success',
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created':
        return <Users className="h-4 w-4" />
      case 'tenant_updated':
        return <Building className="h-4 w-4" />
      case 'system_alert':
        return <AlertTriangle className="h-4 w-4" />
      case 'backup_completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* 核心指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +12% 本月增长
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              活跃率 {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">租户数量</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTenants} 个活跃租户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统健康度</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
              所有服务正常
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 系统资源 */}
        <Card>
          <CardHeader>
            <CardTitle>系统资源</CardTitle>
            <CardDescription>服务器性能监控</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Cpu className="h-4 w-4 mr-2 text-blue-600" />
                  CPU 使用率
                </div>
                <span className="font-medium">{stats.cpuUsage}%</span>
              </div>
              <Progress value={stats.cpuUsage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2 text-green-600" />
                  内存使用率
                </div>
                <span className="font-medium">{stats.memoryUsage}%</span>
              </div>
              <Progress value={stats.memoryUsage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-2 text-purple-600" />
                  磁盘使用率
                </div>
                <span className="font-medium">{stats.diskUsage}%</span>
              </div>
              <Progress value={stats.diskUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>系统最新动态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${getActivityColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用管理功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <span>管理用户</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Building className="h-6 w-6" />
              <span>管理租户</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Server className="h-6 w-6" />
              <span>系统监控</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Database className="h-6 w-6" />
              <span>数据管理</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}