'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/components'
import { Button } from '@linch-kit/ui/components'
import { Input } from '@linch-kit/ui/components'
import { Label } from '@linch-kit/ui/components'
import { Switch } from '@linch-kit/ui/components'
import { Separator } from '@linch-kit/ui/components'
import { Settings, Bell, Shield, Database, Globe, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系统设置</h1>
          <p className="text-muted-foreground">
            配置系统参数和个人偏好设置
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 通用设置 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <CardTitle>通用设置</CardTitle>
            </div>
            <CardDescription>
              基本的系统配置选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">站点名称</Label>
                <Input id="siteName" defaultValue="LinchKit Starter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">站点URL</Label>
                <Input id="siteUrl" defaultValue="https://starter.linchkit.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">站点描述</Label>
              <Input id="description" defaultValue="AI-First 全栈开发框架 - 生产级应用" />
            </div>
          </CardContent>
        </Card>

        {/* 通知设置 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>通知设置</CardTitle>
            </div>
            <CardDescription>
              配置系统通知和提醒选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>邮件通知</Label>
                <p className="text-sm text-muted-foreground">接收重要系统事件的邮件通知</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>桌面通知</Label>
                <p className="text-sm text-muted-foreground">在浏览器中显示桌面通知</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>系统维护通知</Label>
                <p className="text-sm text-muted-foreground">系统维护和更新通知</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* 安全设置 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle>安全设置</CardTitle>
            </div>
            <CardDescription>
              配置系统安全和访问控制选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>双因子认证</Label>
                <p className="text-sm text-muted-foreground">为管理员账户启用2FA</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>强制HTTPS</Label>
                <p className="text-sm text-muted-foreground">强制使用HTTPS连接</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">会话超时 (分钟)</Label>
                <Input id="sessionTimeout" type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">最大登录尝试次数</Label>
                <Input id="maxLoginAttempts" type="number" defaultValue="5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 数据库设置 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              <CardTitle>数据库设置</CardTitle>
            </div>
            <CardDescription>
              数据库连接和备份配置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>自动备份</Label>
                <p className="text-sm text-muted-foreground">定期自动备份数据库</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">备份频率 (小时)</Label>
                <Input id="backupFrequency" type="number" defaultValue="24" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retentionDays">保留天数</Label>
                <Input id="retentionDays" type="number" defaultValue="30" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">重置</Button>
          <Button>保存设置</Button>
        </div>
      </div>
    </div>
  )
}