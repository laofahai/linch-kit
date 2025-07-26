/**
 * 认证管理页面
 * 
 * 提供完整的认证系统管理界面
 */

import { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Badge,
  Alert,
  AlertDescription
} from '@linch-kit/ui'
import { Shield, Users, Settings, Activity, AlertTriangle } from 'lucide-react'

import { AuthSessionManager } from '../components/auth/AuthSessionManager'
import { AuthMetricsView } from '../components/auth/AuthMetricsView'
import { AuthConfigManager } from '../components/auth/AuthConfigManager'
import { AuthSecurityAlerts } from '../components/auth/AuthSecurityAlerts'

interface AuthManagerProps {
  className?: string
}

/**
 * 认证管理主页面
 */
export function AuthManager({ className }: AuthManagerProps) {
  const [activeTab, setActiveTab] = useState('sessions')
  const [systemStatus, setSystemStatus] = useState<{
    activeSessions: number
    suspiciousActivity: number
    systemHealth: 'healthy' | 'warning' | 'critical'
  }>({
    activeSessions: 0,
    suspiciousActivity: 0,
    systemHealth: 'healthy'
  })

  useEffect(() => {
    // 模拟系统状态加载
    const loadSystemStatus = async () => {
      try {
        // 这里会调用实际的API
        setSystemStatus({
          activeSessions: 125,
          suspiciousActivity: 3,
          systemHealth: 'healthy'
        })
      } catch (error) {
        console.error('Failed to load system status:', error)
      }
    }

    loadSystemStatus()
  }, [])

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy': return 'default'
      case 'warning': return 'secondary'
      case 'critical': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className={className}>
      {/* 页面标题和概览 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">认证管理</h1>
          <p className="text-muted-foreground">
            管理用户会话、监控认证性能和配置安全设置
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={getHealthBadgeVariant(systemStatus.systemHealth)}>
            系统状态: {systemStatus.systemHealth}
          </Badge>
          <Button variant="outline" size="sm">
            导出报告
          </Button>
        </div>
      </div>

      {/* 系统状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃会话</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              较昨日增加 +12.5%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可疑活动</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.suspiciousActivity}</div>
            <p className="text-xs text-muted-foreground">
              需要关注的异常登录
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统性能</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              认证服务可用性
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 安全警报 */}
      {systemStatus.suspiciousActivity > 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            检测到 {systemStatus.suspiciousActivity} 个可疑活动，建议立即查看并采取必要措施。
          </AlertDescription>
        </Alert>
      )}

      {/* 功能选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            会话管理
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            性能监控
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            配置管理
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            安全警报
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用户会话管理</CardTitle>
              <CardDescription>
                查看和管理所有活跃用户会话，支持强制下线和会话监控
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthSessionManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>认证性能监控</CardTitle>
              <CardDescription>
                查看认证系统的性能指标、使用统计和趋势分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthMetricsView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>认证配置管理</CardTitle>
              <CardDescription>
                管理JWT配置、会话设置、OAuth配置和安全策略
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthConfigManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>安全警报中心</CardTitle>
              <CardDescription>
                监控安全事件、可疑活动和异常行为
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthSecurityAlerts />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuthManager