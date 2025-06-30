'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/components'
import { Badge } from '@linch-kit/ui/components'
import { Progress } from '@linch-kit/ui/components'
import { AlertCircle, CheckCircle, Clock, Database, Globe, Users } from 'lucide-react'

const SystemMonitoring = () => {
  // 模拟监控数据
  const systemStats = {
    uptime: '15天 8小时 23分钟',
    totalUsers: 1247,
    activeUsers: 89,
    totalTenants: 23,
    activeTenants: 18,
    systemLoad: 65,
    memoryUsage: 78,
    diskUsage: 45,
    requestsPerMinute: 324
  }

  const services = [
    { name: '数据库', status: 'healthy', uptime: '99.9%', responseTime: '12ms' },
    { name: 'API服务', status: 'healthy', uptime: '99.8%', responseTime: '45ms' },
    { name: '认证服务', status: 'warning', uptime: '98.5%', responseTime: '89ms' },
    { name: '文件存储', status: 'healthy', uptime: '99.7%', responseTime: '23ms' },
    { name: '缓存服务', status: 'healthy', uptime: '99.9%', responseTime: '8ms' },
    { name: '消息队列', status: 'error', uptime: '95.2%', responseTime: '156ms' }
  ]

  const recentAlerts = [
    { id: 1, type: 'warning', message: '认证服务响应时间较慢', time: '5分钟前' },
    { id: 2, type: 'error', message: '消息队列连接失败', time: '12分钟前' },
    { id: 3, type: 'info', message: '系统更新完成', time: '1小时前' },
    { id: 4, type: 'warning', message: '磁盘空间使用率超过80%', time: '2小时前' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status === 'healthy' ? '正常' : status === 'warning' ? '警告' : '错误'}
      </Badge>
    )
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">系统监控</h1>
        <p className="text-muted-foreground">实时监控系统状态和性能指标</p>
      </div>

      {/* 系统概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统运行时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.uptime}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              总用户数: {systemStats.totalUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃租户</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeTenants}</div>
            <p className="text-xs text-muted-foreground">
              总租户数: {systemStats.totalTenants}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">请求速率</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.requestsPerMinute}</div>
            <p className="text-xs text-muted-foreground">
              每分钟请求数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 性能指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>系统负载</CardTitle>
            <CardDescription>当前系统负载情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>CPU使用率</span>
                <span>{systemStats.systemLoad}%</span>
              </div>
              <Progress value={systemStats.systemLoad} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>内存使用率</CardTitle>
            <CardDescription>系统内存使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>内存使用率</span>
                <span>{systemStats.memoryUsage}%</span>
              </div>
              <Progress value={systemStats.memoryUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>磁盘使用率</CardTitle>
            <CardDescription>磁盘空间使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>磁盘使用率</span>
                <span>{systemStats.diskUsage}%</span>
              </div>
              <Progress value={systemStats.diskUsage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 服务状态 */}
      <Card>
        <CardHeader>
          <CardTitle>服务状态</CardTitle>
          <CardDescription>各个服务的运行状态和性能指标</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(service.status)}
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      运行时间: {service.uptime} | 响应时间: {service.responseTime}
                    </p>
                  </div>
                </div>
                {getStatusBadge(service.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 最近告警 */}
      <Card>
        <CardHeader>
          <CardTitle>最近告警</CardTitle>
          <CardDescription>系统最近的告警和通知</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SystemMonitoring