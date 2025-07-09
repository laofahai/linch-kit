'use client'

// 强制动态渲染，避免静态生成问题
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import {
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@linch-kit/ui/client'
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@linch-kit/ui/server'
import { Save, RefreshCw, Shield, Mail, Database, Cloud, Bell, Globe, Lock } from 'lucide-react'

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    // 模拟保存操作
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    // TODO: 实现实际的保存逻辑和提示
    console.log('设置已保存')
  }

  return (
    <div className="w-full">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
            <p className="text-muted-foreground mt-2">管理系统配置和全局设置</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              重置
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">常规</TabsTrigger>
          <TabsTrigger value="security">安全</TabsTrigger>
          <TabsTrigger value="email">邮件</TabsTrigger>
          <TabsTrigger value="database">数据库</TabsTrigger>
          <TabsTrigger value="integrations">集成</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
        </TabsList>

        {/* 常规设置 */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <CardTitle>基本信息</CardTitle>
              </div>
              <CardDescription>配置系统的基本信息和显示设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systemName">系统名称</Label>
                  <Input id="systemName" defaultValue="LinchKit Starter" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemVersion">系统版本</Label>
                  <Input id="systemVersion" defaultValue="v1.0.0" disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemDescription">系统描述</Label>
                <Textarea
                  id="systemDescription"
                  placeholder="输入系统描述..."
                  defaultValue="AI-First 全栈开发框架"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">默认语言</Label>
                  <Select defaultValue="zh-CN">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">中文 (简体)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="ja-JP">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">时区</Label>
                  <Select defaultValue="Asia/Shanghai">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <CardTitle>安全策略</CardTitle>
              </div>
              <CardDescription>配置系统安全规则和访问控制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>强制双因素认证</Label>
                  <p className="text-sm text-muted-foreground">要求所有用户启用双因素认证</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>密码复杂度要求</Label>
                  <p className="text-sm text-muted-foreground">启用强密码策略验证</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">会话超时 (分钟)</Label>
                  <Input id="sessionTimeout" type="number" defaultValue="60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">最大登录尝试次数</Label>
                  <Input id="maxLoginAttempts" type="number" defaultValue="5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 邮件设置 */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <CardTitle>邮件配置</CardTitle>
              </div>
              <CardDescription>配置系统邮件发送服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP 主机</Label>
                  <Input id="smtpHost" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP 端口</Label>
                  <Input id="smtpPort" type="number" defaultValue="587" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">用户名</Label>
                  <Input id="smtpUsername" placeholder="your-email@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">密码</Label>
                  <Input id="smtpPassword" type="password" placeholder="••••••••" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用 TLS/SSL</Label>
                  <p className="text-sm text-muted-foreground">使用加密连接发送邮件</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据库设置 */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <CardTitle>数据库配置</CardTitle>
              </div>
              <CardDescription>监控和配置数据库连接</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>数据库类型</Label>
                  <Input value="PostgreSQL" disabled />
                </div>
                <div className="space-y-2">
                  <Label>连接状态</Label>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-600">已连接</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>连接池大小</Label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label>查询超时 (秒)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>空闲超时 (分钟)</Label>
                  <Input type="number" defaultValue="10" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用查询日志</Label>
                  <p className="text-sm text-muted-foreground">记录所有数据库查询用于调试</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 集成设置 */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Cloud className="h-5 w-5" />
                <CardTitle>第三方集成</CardTitle>
              </div>
              <CardDescription>配置外部服务和 API 集成</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Cloud className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">云存储服务</h4>
                      <p className="text-sm text-muted-foreground">AWS S3 文件存储</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Bell className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">推送通知</h4>
                      <p className="text-sm text-muted-foreground">Firebase Cloud Messaging</p>
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Lock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">单点登录</h4>
                      <p className="text-sm text-muted-foreground">SAML 2.0 / OAuth 2.0</p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <CardTitle>通知设置</CardTitle>
              </div>
              <CardDescription>配置系统通知和警报规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>用户注册通知</Label>
                    <p className="text-sm text-muted-foreground">新用户注册时发送通知</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>系统错误警报</Label>
                    <p className="text-sm text-muted-foreground">系统发生错误时发送警报</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>性能监控警报</Label>
                    <p className="text-sm text-muted-foreground">系统性能异常时发送警报</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>每日使用报告</Label>
                    <p className="text-sm text-muted-foreground">每日发送系统使用统计报告</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationEmail">通知邮箱</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  placeholder="admin@example.com"
                  defaultValue="admin@linchkit.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
