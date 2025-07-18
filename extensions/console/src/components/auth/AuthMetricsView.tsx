/**
 * 认证性能监控组件
 * 
 * 展示认证系统的性能指标和统计数据
 */

import { useState, useEffect } from 'react'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Badge,
  Progress
} from '@linch-kit/ui'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  AlertTriangle,
  Clock,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface MetricCard {
  title: string
  value: string | number
  change: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon: React.ReactNode
  description: string
}

interface AuthMetricsViewProps {
  className?: string
}

/**
 * 认证性能监控视图组件
 */
export function AuthMetricsView({ className }: AuthMetricsViewProps) {
  const [timeRange, setTimeRange] = useState('24h')
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<{
    labels: string[]
    loginAttempts: number[]
    loginSuccess: number[]
    loginFailures: number[]
  }>({
    labels: [],
    loginAttempts: [],
    loginSuccess: [],
    loginFailures: []
  })

  useEffect(() => {
    loadMetrics()
  }, [timeRange])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockMetrics: MetricCard[] = [
        {
          title: '登录尝试',
          value: '1,234',
          change: { value: 12.5, type: 'increase' },
          icon: <Users className="h-4 w-4" />,
          description: '总登录尝试次数'
        },
        {
          title: '登录成功率',
          value: '94.2%',
          change: { value: 2.1, type: 'increase' },
          icon: <Shield className="h-4 w-4" />,
          description: '成功登录比例'
        },
        {
          title: '平均响应时间',
          value: '120ms',
          change: { value: 5.3, type: 'decrease' },
          icon: <Clock className="h-4 w-4" />,
          description: '认证请求平均处理时间'
        },
        {
          title: '异常登录',
          value: '23',
          change: { value: 8.7, type: 'increase' },
          icon: <AlertTriangle className="h-4 w-4" />,
          description: '被标记为可疑的登录尝试'
        },
        {
          title: 'JWT令牌发放',
          value: '1,156',
          change: { value: 15.2, type: 'increase' },
          icon: <Activity className="h-4 w-4" />,
          description: '成功发放的JWT令牌数量'
        },
        {
          title: '会话过期',
          value: '89',
          change: { value: 3.2, type: 'decrease' },
          icon: <TrendingDown className="h-4 w-4" />,
          description: '自然过期的会话数量'
        }
      ]
      
      setMetrics(mockMetrics)
      
      // 模拟图表数据
      const mockChartData = {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        loginAttempts: [45, 32, 68, 125, 98, 76],
        loginSuccess: [42, 30, 64, 118, 92, 71],
        loginFailures: [3, 2, 4, 7, 6, 5]
      }
      
      setChartData(mockChartData)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'decrease':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={className}>
      {/* 时间范围选择 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1小时</SelectItem>
              <SelectItem value="24h">24小时</SelectItem>
              <SelectItem value="7d">7天</SelectItem>
              <SelectItem value="30d">30天</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="outline" className="text-xs">
            实时数据
          </Badge>
        </div>
        
        <Button variant="outline" size="sm" onClick={loadMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                {metric.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  {getChangeIcon(metric.change.type)}
                  <span className={getChangeColor(metric.change.type)}>
                    {metric.change.value}%
                  </span>
                  <span className="text-muted-foreground">
                    相比上期
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 登录趋势图表 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            登录趋势分析
          </CardTitle>
          <CardDescription>
            查看不同时间段的登录尝试和成功率趋势
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                加载图表数据...
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.labels.map((label, index) => (
                <div key={label} className="flex-1 flex flex-col items-center">
                  <div className="w-full space-y-1 mb-2">
                    {/* 登录尝试 */}
                    <div className="relative">
                      <div className="text-xs text-center mb-1">
                        {chartData.loginAttempts[index]}
                      </div>
                      <div 
                        className="bg-blue-500 rounded-t"
                        style={{
                          height: `${(chartData.loginAttempts[index] / 150) * 180}px`
                        }}
                      />
                    </div>
                    
                    {/* 登录成功 */}
                    <div className="relative">
                      <div 
                        className="bg-green-500"
                        style={{
                          height: `${(chartData.loginSuccess[index] / 150) * 180}px`
                        }}
                      />
                    </div>
                    
                    {/* 登录失败 */}
                    <div className="relative">
                      <div 
                        className="bg-red-500 rounded-b"
                        style={{
                          height: `${(chartData.loginFailures[index] / 150) * 180}px`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 图例 */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm">登录尝试</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm">登录成功</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-sm">登录失败</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 性能指标 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">系统性能</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU使用率</span>
                <span>23%</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>内存使用率</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Redis连接池</span>
                <span>78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">错误统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Token验证失败</span>
              <Badge variant="outline">12</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">密码错误</span>
              <Badge variant="outline">8</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">账户锁定</span>
              <Badge variant="outline">3</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">超时错误</span>
              <Badge variant="outline">2</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuthMetricsView