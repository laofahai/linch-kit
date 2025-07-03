/**
 * 租户设置页面
 * 展示配置管理和CRUD操作
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
  Separator
} from '@linch-kit/ui'
import { Logger } from '@linch-kit/core'
import { Save, RefreshCw } from 'lucide-react'

type ConfigItem = {
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'
  category: string
  description: string
  isPublic: boolean
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 基础设置
  const [appName, setAppName] = useState('LinchKit Starter')
  const [appDescription, setAppDescription] = useState('AI-First 全栈开发框架')
  const [adminEmail, setAdminEmail] = useState('admin@linchkit.dev')
  
  // 功能开关
  const [enableRegistration, setEnableRegistration] = useState(true)
  const [enableEmailVerification, setEnableEmailVerification] = useState(true)
  const [enableTwoFactor, setEnableTwoFactor] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  
  // 限制设置
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5')
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [passwordMinLength, setPasswordMinLength] = useState('8')
  
  // 通知设置
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [systemAlerts, setSystemAlerts] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // 配置项列表（模拟从数据库加载）
  const [, setConfigs] = useState<ConfigItem[]>([])

  // 加载配置
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      Logger.info('加载租户设置')
      
      // 模拟从API加载配置
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 设置默认配置项
      setConfigs([
        {
          key: 'app.name',
          value: appName,
          type: 'STRING',
          category: 'general',
          description: '应用名称',
          isPublic: true,
        },
        {
          key: 'auth.registration.enabled',
          value: String(enableRegistration),
          type: 'BOOLEAN',
          category: 'auth',
          description: '允许用户注册',
          isPublic: false,
        },
        {
          key: 'auth.max_login_attempts',
          value: maxLoginAttempts,
          type: 'NUMBER',
          category: 'auth',
          description: '最大登录尝试次数',
          isPublic: false,
        },
      ])
      
      toast({
        title: '设置加载成功',
        description: '租户配置已加载',
      })
    } catch (error) {
      Logger.error('加载设置失败', error as Error)
      toast({
        title: '加载失败',
        description: '无法加载租户设置',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [appName, enableRegistration, maxLoginAttempts, toast])

  // 保存设置
  const saveSettings = async () => {
    try {
      setSaving(true)
      Logger.info('保存租户设置', {
        appName,
        enableRegistration,
        maxLoginAttempts,
      })
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: '保存成功',
        description: '租户设置已更新',
      })
    } catch (error) {
      Logger.error('保存设置失败', error as Error)
      toast({
        title: '保存失败',
        description: '无法保存租户设置',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在加载设置...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">租户设置</h1>
            <p className="text-muted-foreground mt-2">
              管理租户的配置和系统设置
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </div>

      {/* 设置选项卡 */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">基础设置</TabsTrigger>
          <TabsTrigger value="auth">认证安全</TabsTrigger>
          <TabsTrigger value="limits">限制配置</TabsTrigger>
          <TabsTrigger value="notifications">通知设置</TabsTrigger>
        </TabsList>

        {/* 基础设置 */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>基础设置</CardTitle>
              <CardDescription>
                配置应用的基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">应用名称</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="输入应用名称"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appDescription">应用描述</Label>
                <Input
                  id="appDescription"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="输入应用描述"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminEmail">管理员邮箱</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>维护模式</Label>
                  <p className="text-sm text-muted-foreground">
                    启用后，只有管理员可以访问系统
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 认证安全 */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>认证与安全</CardTitle>
              <CardDescription>
                管理用户认证和安全设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>允许用户注册</Label>
                  <p className="text-sm text-muted-foreground">
                    允许新用户自行注册账号
                  </p>
                </div>
                <Switch
                  checked={enableRegistration}
                  onCheckedChange={setEnableRegistration}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>邮箱验证</Label>
                  <p className="text-sm text-muted-foreground">
                    要求用户验证邮箱地址
                  </p>
                </div>
                <Switch
                  checked={enableEmailVerification}
                  onCheckedChange={setEnableEmailVerification}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>双因素认证</Label>
                  <p className="text-sm text-muted-foreground">
                    启用双因素认证增强安全性
                  </p>
                </div>
                <Switch
                  checked={enableTwoFactor}
                  onCheckedChange={setEnableTwoFactor}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 限制配置 */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>限制配置</CardTitle>
              <CardDescription>
                设置系统的各项限制参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">最大登录尝试次数</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(e.target.value)}
                  min="1"
                  max="10"
                />
                <p className="text-sm text-muted-foreground">
                  超过此次数后账号将被临时锁定
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">会话超时时间（分钟）</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  min="5"
                  max="1440"
                />
                <p className="text-sm text-muted-foreground">
                  用户无操作后自动退出登录
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">密码最小长度</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={passwordMinLength}
                  onChange={(e) => setPasswordMinLength(e.target.value)}
                  min="6"
                  max="32"
                />
                <p className="text-sm text-muted-foreground">
                  用户密码的最小字符数要求
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>
                配置系统通知和邮件设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>邮件通知</Label>
                  <p className="text-sm text-muted-foreground">
                    接收重要的系统邮件通知
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>系统告警</Label>
                  <p className="text-sm text-muted-foreground">
                    接收系统异常和告警通知
                  </p>
                </div>
                <Switch
                  checked={systemAlerts}
                  onCheckedChange={setSystemAlerts}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>营销邮件</Label>
                  <p className="text-sm text-muted-foreground">
                    接收产品更新和推广邮件
                  </p>
                </div>
                <Switch
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}