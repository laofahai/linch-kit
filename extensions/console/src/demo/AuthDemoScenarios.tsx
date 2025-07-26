/**
 * 认证功能演示场景
 * 
 * 提供完整的认证系统演示和测试场景
 */

import { useState, useEffect } from 'react'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@linch-kit/ui'
import { 
  Play,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react'

import { useAuthMonitoring } from '../hooks/useAuthMonitoring'
import { AuthEventType } from '../services/auth-monitoring.service'

interface DemoScenario {
  id: string
  title: string
  description: string
  type: 'login' | 'token' | 'session' | 'security'
  steps: DemoStep[]
  duration: number
  expectedResults: string[]
}

interface DemoStep {
  id: string
  title: string
  description: string
  action: () => Promise<void>
  expectedOutcome: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  duration?: number
}

interface AuthDemoScenariosProps {
  className?: string
}

/**
 * 认证演示场景组件
 */
export function AuthDemoScenarios({ className }: AuthDemoScenariosProps) {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([])
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [_runningStep, _setRunningStep] = useState<string | null>(null)
  const [demoResults, setDemoResults] = useState<Array<{
    scenarioId: string
    stepId: string
    success: boolean
    message: string
    timestamp: Date
  }>>([])

  const { eventRecorder, loginMonitor, tokenMonitor, sessionMonitor } = useAuthMonitoring()

  useEffect(() => {
    initializeScenarios()
  }, [])

  const initializeScenarios = () => {
    const mockScenarios: DemoScenario[] = [
      {
        id: 'login-flow',
        title: '用户登录流程演示',
        description: '演示完整的用户登录、JWT令牌生成和会话创建过程',
        type: 'login',
        duration: 60000,
        expectedResults: [
          '成功验证用户凭据',
          '生成JWT访问令牌',
          '创建用户会话',
          '记录登录事件'
        ],
        steps: [
          {
            id: 'step1',
            title: '用户凭据验证',
            description: '验证用户名和密码',
            action: async () => {
              await simulateUserCredentialValidation()
            },
            expectedOutcome: '凭据验证成功',
            status: 'pending'
          },
          {
            id: 'step2',
            title: '风险评估',
            description: '评估登录请求的风险等级',
            action: async () => {
              await simulateRiskAssessment()
            },
            expectedOutcome: '风险评估完成，等级为低',
            status: 'pending'
          },
          {
            id: 'step3',
            title: 'JWT令牌生成',
            description: '生成访问令牌和刷新令牌',
            action: async () => {
              await simulateTokenGeneration()
            },
            expectedOutcome: 'JWT令牌生成成功',
            status: 'pending'
          },
          {
            id: 'step4',
            title: '会话创建',
            description: '创建用户会话并记录设备信息',
            action: async () => {
              await simulateSessionCreation()
            },
            expectedOutcome: '会话创建成功',
            status: 'pending'
          }
        ]
      },
      {
        id: 'token-refresh',
        title: 'JWT令牌刷新演示',
        description: '演示JWT令牌过期后的自动刷新机制',
        type: 'token',
        duration: 45000,
        expectedResults: [
          '检测到令牌即将过期',
          '使用刷新令牌获取新的访问令牌',
          '更新会话信息',
          '记录令牌刷新事件'
        ],
        steps: [
          {
            id: 'step1',
            title: '令牌过期检测',
            description: '检测访问令牌是否即将过期',
            action: async () => {
              await simulateTokenExpirationCheck()
            },
            expectedOutcome: '检测到令牌即将过期',
            status: 'pending'
          },
          {
            id: 'step2',
            title: '刷新令牌验证',
            description: '验证刷新令牌的有效性',
            action: async () => {
              await simulateRefreshTokenValidation()
            },
            expectedOutcome: '刷新令牌验证成功',
            status: 'pending'
          },
          {
            id: 'step3',
            title: '新令牌生成',
            description: '生成新的访问令牌',
            action: async () => {
              await simulateNewTokenGeneration()
            },
            expectedOutcome: '新令牌生成成功',
            status: 'pending'
          }
        ]
      },
      {
        id: 'security-monitoring',
        title: '安全监控演示',
        description: '演示异常登录检测和安全警报触发',
        type: 'security',
        duration: 90000,
        expectedResults: [
          '检测到可疑登录行为',
          '触发安全警报',
          '自动阻止高风险操作',
          '记录安全事件'
        ],
        steps: [
          {
            id: 'step1',
            title: '异常登录模拟',
            description: '模拟来自异常地理位置的登录尝试',
            action: async () => {
              await simulateAnomalousLogin()
            },
            expectedOutcome: '检测到异常登录',
            status: 'pending'
          },
          {
            id: 'step2',
            title: '暴力破解检测',
            description: '模拟多次密码错误尝试',
            action: async () => {
              await simulateBruteForceAttack()
            },
            expectedOutcome: '检测到暴力破解尝试',
            status: 'pending'
          },
          {
            id: 'step3',
            title: '自动防护响应',
            description: '触发自动防护机制',
            action: async () => {
              await simulateAutomaticProtection()
            },
            expectedOutcome: '自动防护机制激活',
            status: 'pending'
          }
        ]
      },
      {
        id: 'session-management',
        title: '会话管理演示',
        description: '演示会话生命周期管理和强制下线功能',
        type: 'session',
        duration: 75000,
        expectedResults: [
          '创建多个用户会话',
          '监控会话活动',
          '强制撤销特定会话',
          '清理过期会话'
        ],
        steps: [
          {
            id: 'step1',
            title: '多会话创建',
            description: '为同一用户创建多个会话',
            action: async () => {
              await simulateMultipleSessionCreation()
            },
            expectedOutcome: '多个会话创建成功',
            status: 'pending'
          },
          {
            id: 'step2',
            title: '会话活动监控',
            description: '监控各会话的活动状态',
            action: async () => {
              await simulateSessionMonitoring()
            },
            expectedOutcome: '会话活动监控启动',
            status: 'pending'
          },
          {
            id: 'step3',
            title: '会话强制下线',
            description: '强制撤销可疑会话',
            action: async () => {
              await simulateSessionRevocation()
            },
            expectedOutcome: '可疑会话已撤销',
            status: 'pending'
          }
        ]
      }
    ]

    setScenarios(mockScenarios)
  }

  const runScenario = async (scenarioId: string) => {
    setActiveScenario(scenarioId)
    
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) return

    // 重置所有步骤状态
    setScenarios(prev => prev.map(s => 
      s.id === scenarioId 
        ? { ...s, steps: s.steps.map(step => ({ ...step, status: 'pending' as const })) }
        : s
    ))

    // 逐步执行演示步骤
    for (const step of scenario.steps) {
      await runStep(scenarioId, step.id)
    }

    setActiveScenario(null)
  }

  const runStep = async (scenarioId: string, stepId: string) => {
    _setRunningStep(stepId)
    
    // 更新步骤状态为运行中
    setScenarios(prev => prev.map(s => 
      s.id === scenarioId 
        ? { 
            ...s, 
            steps: s.steps.map(step => 
              step.id === stepId 
                ? { ...step, status: 'running' as const }
                : step
            )
          }
        : s
    ))

    const scenario = scenarios.find(s => s.id === scenarioId)
    const step = scenario?.steps.find(s => s.id === stepId)
    
    if (!step) return

    const startTime = Date.now()
    
    try {
      await step.action()
      const duration = Date.now() - startTime
      
      // 更新步骤状态为完成
      setScenarios(prev => prev.map(s => 
        s.id === scenarioId 
          ? { 
              ...s, 
              steps: s.steps.map(st => 
                st.id === stepId 
                  ? { 
                      ...st, 
                      status: 'completed' as const,
                      result: step.expectedOutcome,
                      duration
                    }
                  : st
              )
            }
          : s
      ))

      // 记录演示结果
      setDemoResults(prev => [...prev, {
        scenarioId,
        stepId,
        success: true,
        message: step.expectedOutcome,
        timestamp: new Date()
      }])

    } catch (error) {
      const duration = Date.now() - startTime
      
      // 更新步骤状态为失败
      setScenarios(prev => prev.map(s => 
        s.id === scenarioId 
          ? { 
              ...s, 
              steps: s.steps.map(st => 
                st.id === stepId 
                  ? { 
                      ...st, 
                      status: 'failed' as const,
                      result: error instanceof Error ? error.message : '执行失败',
                      duration
                    }
                  : st
              )
            }
          : s
      ))

      // 记录演示结果
      setDemoResults(prev => [...prev, {
        scenarioId,
        stepId,
        success: false,
        message: error instanceof Error ? error.message : '执行失败',
        timestamp: new Date()
      }])
    } finally {
      _setRunningStep(null)
    }
  }

  const getScenarioProgress = (scenario: DemoScenario) => {
    const completedSteps = scenario.steps.filter(step => step.status === 'completed').length
    return (completedSteps / scenario.steps.length) * 100
  }

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const clearResults = () => {
    setDemoResults([])
    setScenarios(prev => prev.map(s => ({
      ...s,
      steps: s.steps.map(step => ({ ...step, status: 'pending' as const }))
    })))
  }

  // 模拟函数
  const simulateUserCredentialValidation = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    await eventRecorder.recordEvent(AuthEventType.LOGIN_ATTEMPT, {
      userId: 'demo-user@example.com',
      ipAddress: '192.168.1.100',
      success: true
    })
  }

  const simulateRiskAssessment = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    await loginMonitor.monitorLogin(
      'demo-user@example.com',
      '192.168.1.100',
      'Mozilla/5.0 (Demo Browser)',
      'Beijing, China'
    )
  }

  const simulateTokenGeneration = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    await tokenMonitor.monitorToken(
      'issue',
      'demo-token-123',
      {
        userId: 'demo-user@example.com',
        sessionId: 'demo-session-456',
        success: true,
        duration: 50
      }
    )
  }

  const simulateSessionCreation = async () => {
    await new Promise(resolve => setTimeout(resolve, 1200))
    await sessionMonitor.monitorSession(
      'demo-session-456',
      'demo-user@example.com',
      'created',
      '192.168.1.100',
      'Mozilla/5.0 (Demo Browser)'
    )
  }

  const simulateTokenExpirationCheck = async () => {
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  const simulateRefreshTokenValidation = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const simulateNewTokenGeneration = async () => {
    await new Promise(resolve => setTimeout(resolve, 1200))
    await tokenMonitor.monitorToken(
      'refresh',
      'demo-token-789',
      {
        userId: 'demo-user@example.com',
        sessionId: 'demo-session-456',
        success: true,
        duration: 75
      }
    )
  }

  const simulateAnomalousLogin = async () => {
    await new Promise(resolve => setTimeout(resolve, 2500))
    await loginMonitor.monitorLogin(
      'demo-user@example.com',
      '203.0.113.1',
      'curl/7.68.0',
      'Unknown Location'
    )
  }

  const simulateBruteForceAttack = async () => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    for (let i = 0; i < 3; i++) {
      await eventRecorder.recordEvent(AuthEventType.LOGIN_FAILURE, {
        userId: 'demo-user@example.com',
        ipAddress: '203.0.113.1',
        success: false,
        errorCode: 'INVALID_CREDENTIALS'
      })
    }
  }

  const simulateAutomaticProtection = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    await eventRecorder.recordEvent(AuthEventType.LOGIN_FAILURE, {
      userId: 'demo-user@example.com',
      ipAddress: '203.0.113.1',
      success: false,
      errorCode: 'ACCOUNT_LOCKED',
      riskScore: 9
    })
  }

  const simulateMultipleSessionCreation = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const sessions = ['session-1', 'session-2', 'session-3']
    for (const sessionId of sessions) {
      await sessionMonitor.monitorSession(
        sessionId,
        'demo-user@example.com',
        'created',
        `192.168.1.${Math.floor(Math.random() * 255)}`
      )
    }
  }

  const simulateSessionMonitoring = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  const simulateSessionRevocation = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    await sessionMonitor.monitorSession(
      'session-2',
      'demo-user@example.com',
      'revoked',
      '192.168.1.200'
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">认证功能演示</h2>
          <p className="text-muted-foreground">
            体验完整的认证系统功能和安全监控
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearResults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重置
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出结果
          </Button>
        </div>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">演示场景</TabsTrigger>
          <TabsTrigger value="results">执行结果</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <Badge 
                      variant={scenario.type === 'security' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {scenario.type}
                    </Badge>
                  </div>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* 预期结果 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">预期结果</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {scenario.expectedResults.map((result, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {result}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 进度条 */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>执行进度</span>
                        <span>{Math.round(getScenarioProgress(scenario))}%</span>
                      </div>
                      <Progress value={getScenarioProgress(scenario)} className="h-2" />
                    </div>

                    {/* 步骤列表 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">执行步骤</h4>
                      <div className="space-y-2">
                        {scenario.steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-2 text-sm">
                            {getStepStatusIcon(step.status)}
                            <span className={step.status === 'completed' ? 'text-green-600' : 
                                           step.status === 'failed' ? 'text-red-600' : 
                                           step.status === 'running' ? 'text-blue-600' : 'text-gray-500'}>
                              {step.title}
                            </span>
                            {step.duration && (
                              <span className="text-xs text-muted-foreground">
                                ({step.duration}ms)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 执行按钮 */}
                    <Button 
                      onClick={() => runScenario(scenario.id)}
                      disabled={activeScenario !== null}
                      className="w-full"
                    >
                      {activeScenario === scenario.id ? (
                        <>
                          <Activity className="h-4 w-4 mr-2 animate-pulse" />
                          执行中...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          开始演示
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>演示执行结果</CardTitle>
              <CardDescription>
                查看所有演示场景的详细执行结果和日志
              </CardDescription>
            </CardHeader>
            <CardContent>
              {demoResults.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">暂无演示结果</p>
                  <p className="text-sm text-muted-foreground">
                    运行任意演示场景后，结果将显示在这里
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>场景</TableHead>
                      <TableHead>步骤</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>结果</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demoResults.map((result, index) => {
                      const scenario = scenarios.find(s => s.id === result.scenarioId)
                      const step = scenario?.steps.find(s => s.id === result.stepId)
                      
                      return (
                        <TableRow key={index}>
                          <TableCell className="text-sm">
                            {result.timestamp.toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {scenario?.title}
                          </TableCell>
                          <TableCell className="text-sm">
                            {step?.title}
                          </TableCell>
                          <TableCell>
                            {result.success ? (
                              <Badge variant="default" className="text-xs">
                                成功
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                失败
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {result.message}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuthDemoScenarios