/**
 * 认证安全警报组件
 * 
 * 监控和显示认证相关的安全事件和警报
 */

import { useState, useEffect } from 'react'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@linch-kit/ui'
import { 
  AlertTriangle,
  Shield,
  Eye,
  Clock,
  MapPin,
  User,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface SecurityAlert {
  id: string
  type: 'suspicious_login' | 'multiple_failures' | 'unusual_location' | 'brute_force' | 'token_abuse' | 'account_lockout'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: Date
  userEmail?: string
  ipAddress?: string
  location?: string
  userAgent?: string
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
  metadata?: Record<string, unknown>
}

interface SecurityEvent {
  id: string
  eventType: string
  timestamp: Date
  userEmail?: string
  ipAddress?: string
  success: boolean
  details: string
  riskScore: number
}

interface AuthSecurityAlertsProps {
  className?: string
}

/**
 * 认证安全警报组件
 */
export function AuthSecurityAlerts({ className }: AuthSecurityAlertsProps) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('alerts')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'suspicious_login',
          severity: 'high',
          title: '可疑登录检测',
          description: '检测到来自异常地理位置的登录尝试',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          userEmail: 'admin@example.com',
          ipAddress: '192.168.1.100',
          location: '未知位置',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'active',
          metadata: {
            previousLocation: 'Beijing, China',
            distanceKm: 2500
          }
        },
        {
          id: '2',
          type: 'multiple_failures',
          severity: 'medium',
          title: '多次登录失败',
          description: '用户在短时间内多次登录失败',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          userEmail: 'john@example.com',
          ipAddress: '10.0.0.50',
          location: 'Shanghai, China',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          status: 'investigating',
          metadata: {
            failureCount: 8,
            timeWindow: 300
          }
        },
        {
          id: '3',
          type: 'brute_force',
          severity: 'critical',
          title: '暴力破解攻击',
          description: '检测到针对多个账户的暴力破解尝试',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          ipAddress: '203.0.113.1',
          location: '未知位置',
          userAgent: 'curl/7.68.0',
          status: 'resolved',
          metadata: {
            targetAccounts: ['user1@example.com', 'user2@example.com', 'admin@example.com'],
            attemptCount: 150
          }
        },
        {
          id: '4',
          type: 'token_abuse',
          severity: 'medium',
          title: 'Token滥用',
          description: '检测到JWT令牌的异常使用模式',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          userEmail: 'api@example.com',
          ipAddress: '172.16.0.10',
          location: 'Guangzhou, China',
          status: 'active',
          metadata: {
            requestCount: 1000,
            timeWindow: 60
          }
        }
      ]

      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          eventType: 'LOGIN_SUCCESS',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          userEmail: 'admin@example.com',
          ipAddress: '192.168.1.100',
          success: true,
          details: '用户成功登录',
          riskScore: 2
        },
        {
          id: '2',
          eventType: 'LOGIN_FAILURE',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          userEmail: 'john@example.com',
          ipAddress: '10.0.0.50',
          success: false,
          details: '密码错误',
          riskScore: 5
        },
        {
          id: '3',
          eventType: 'TOKEN_REFRESH',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          userEmail: 'api@example.com',
          ipAddress: '172.16.0.10',
          success: true,
          details: '刷新令牌成功',
          riskScore: 1
        },
        {
          id: '4',
          eventType: 'ACCOUNT_LOCKED',
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          userEmail: 'test@example.com',
          ipAddress: '203.0.113.1',
          success: false,
          details: '账户因多次失败尝试被锁定',
          riskScore: 8
        }
      ]

      setAlerts(mockAlerts)
      setEvents(mockEvents)
    } catch (error) {
      console.error('Failed to load security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">严重</Badge>
      case 'high':
        return <Badge variant="destructive">高</Badge>
      case 'medium':
        return <Badge variant="warning">中</Badge>
      case 'low':
        return <Badge variant="secondary">低</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive">活跃</Badge>
      case 'investigating':
        return <Badge variant="warning">调查中</Badge>
      case 'resolved':
        return <Badge variant="success">已解决</Badge>
      case 'false_positive':
        return <Badge variant="secondary">误报</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 8) return 'text-red-600'
    if (score >= 5) return 'text-orange-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-green-600'
  }

  const updateAlertStatus = async (alertId: string, newStatus: string) => {
    try {
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, status: newStatus as SecurityAlert['status'] } : alert
      ))
    } catch (error) {
      console.error('Failed to update alert status:', error)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.ipAddress?.includes(searchTerm)
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter
    
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '刚才'
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}小时前`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}天前`
  }

  return (
    <div className={className}>
      {/* 摘要统计 */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃警报</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">严重警报</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.severity === 'critical').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">调查中</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.status === 'investigating').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已解决</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts">安全警报</TabsTrigger>
          <TabsTrigger value="events">安全事件</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* 搜索和过滤 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索警报..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="严重程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有</SelectItem>
                <SelectItem value="critical">严重</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="investigating">调查中</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
                <SelectItem value="false_positive">误报</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>

          {/* 警报列表 */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48" />
                        <div className="h-3 bg-gray-200 rounded w-64" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 bg-gray-200 rounded w-12" />
                        <div className="h-6 bg-gray-200 rounded w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">暂无安全警报</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <h3 className="font-medium">{alert.title}</h3>
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {alert.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(alert.timestamp)}
                          </div>
                          
                          {alert.userEmail && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {alert.userEmail}
                            </div>
                          )}
                          
                          {alert.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {alert.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAlertStatus(alert.id, 'investigating')}
                            >
                              调查
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAlertStatus(alert.id, 'resolved')}
                            >
                              解决
                            </Button>
                          </>
                        )}
                        
                        {alert.status === 'investigating' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAlertStatus(alert.id, 'resolved')}
                          >
                            标记已解决
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>安全事件日志</CardTitle>
              <CardDescription>
                查看所有认证相关的安全事件和活动记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>事件类型</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>风险评分</TableHead>
                    <TableHead>详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm">
                        {formatTimeAgo(event.timestamp)}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {event.eventType}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {event.userEmail || '-'}
                      </TableCell>
                      
                      <TableCell className="text-sm font-mono">
                        {event.ipAddress}
                      </TableCell>
                      
                      <TableCell>
                        {event.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <span className={`font-medium ${getRiskScoreColor(event.riskScore)}`}>
                          {event.riskScore}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {event.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuthSecurityAlerts