'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/shadcn'
import { Button } from '@linch-kit/ui/shadcn'
import { Badge } from '@linch-kit/ui/shadcn'
import { 
  Users, 
  Database, 
  BarChart3, 
  TrendingUp, 
  Activity,
  DollarSign
} from 'lucide-react'

export default function DashboardPage() {
  const { t } = useTranslation()

  const stats = [
    {
      title: t('nav.users'),
      value: '2,350',
      change: '+20.1%',
      trend: 'up',
      icon: Users,
    },
    {
      title: t('nav.data'),
      value: '12,234',
      change: '+15.3%',
      trend: 'up',
      icon: Database,
    },
    {
      title: t('nav.reports'),
      value: '573',
      change: '+2.5%',
      trend: 'up',
      icon: BarChart3,
    },
    {
      title: '收入',
      value: '¥45,231',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('nav.dashboard')}
          </h1>
          <p className="text-muted-foreground">
            {t('app.welcome')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            {t('common.export')}
          </Button>
          <Button>
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stat.change} 较上月</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 主要内容区域 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* 图表区域 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>概览</CardTitle>
            <CardDescription>
              最近 7 天的数据趋势
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4" />
                <p>图表组件将在这里显示</p>
                <p className="text-sm">集成 Chart.js 或 Recharts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 侧边栏信息 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>
              系统最新动态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: '新用户注册', user: '张三', time: '2分钟前', type: 'user' },
                { action: '数据导入完成', user: '系统', time: '5分钟前', type: 'data' },
                { action: '报表生成', user: '李四', time: '10分钟前', type: 'report' },
                { action: '权限更新', user: '管理员', time: '15分钟前', type: 'admin' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Badge variant={activity.type === 'admin' ? 'destructive' : 'secondary'}>
                      {activity.type}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.user} • {activity.time}
                    </p>
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
          <CardDescription>
            常用功能快速入口
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>{t('nav.users')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Database className="h-6 w-6" />
              <span>{t('nav.data')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>{t('nav.reports')}</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Activity className="h-6 w-6" />
              <span>监控</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
