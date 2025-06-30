'use client'

import { ConsoleProvider } from '@linch-kit/console'
import { Button } from '@linch-kit/ui/components'
import { Input } from '@linch-kit/ui/components'
import { Badge } from '@linch-kit/ui/components'
import { Separator } from '@linch-kit/ui/components'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Activity, 
  Settings, 
  Bell,
  Search,
  User,
  Menu,
  X,
  Sparkles,
  Brain,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { 
      name: '智能概览', 
      href: '/admin', 
      icon: LayoutDashboard, 
      current: pathname === '/admin',
      badge: 'AI'
    },
    { 
      name: '租户管理', 
      href: '/admin/tenants', 
      icon: Building, 
      current: pathname === '/admin/tenants' 
    },
    { 
      name: '用户管理', 
      href: '/admin/users', 
      icon: Users, 
      current: pathname === '/admin/users' 
    },
    { 
      name: '智能监控', 
      href: '/admin/monitoring', 
      icon: Activity, 
      current: pathname === '/admin/monitoring',
      badge: 'Live'
    },
    { 
      name: '系统设置', 
      href: '/admin/settings', 
      icon: Settings, 
      current: pathname === '/admin/settings' 
    },
  ]

  return (
    <ConsoleProvider>
      <div className="min-h-screen bg-background">
        {/* 移动端侧边栏遮罩 */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setSidebarOpen(false)} 
            />
          </div>
        )}

        {/* 侧边栏 - AI风格设计 */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 
          transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          shadow-2xl lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* 品牌区域 - AI主题 */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Brain className="h-5 w-5 text-primary-foreground" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  LinchKit
                </h1>
                <div className="flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  <p className="text-xs text-muted-foreground font-medium">AI控制台</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 hover:bg-accent/50"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 导航菜单 */}
          <nav className="mt-6 px-4">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group relative flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl 
                    transition-all duration-200 hover:scale-[1.02] hover:shadow-md
                    ${item.current
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <item.icon className={`mr-3 h-4 w-4 flex-shrink-0 ${item.current ? 'animate-pulse' : ''}`} />
                    {item.name}
                  </div>
                  {item.badge && (
                    <Badge 
                      variant={item.current ? "secondary" : "outline"} 
                      className={`text-xs px-2 py-0.5 ${item.current ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30' : ''}`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {item.current && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
                  )}
                </Link>
              ))}
            </div>
          </nav>

          <Separator className="mx-4 my-6" />

          {/* AI助手快捷操作 */}
          <div className="px-4 mb-6">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI助手</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">智能分析和建议</p>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
              >
                启动AI分析
              </Button>
            </div>
          </div>

          {/* 底部用户信息 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-4 w-4 text-primary" />
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">AI管理员</p>
                <p className="text-xs text-muted-foreground truncate">admin@linchkit.ai</p>
              </div>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="lg:pl-72">
          {/* 顶部导航栏 - 现代毛玻璃效果 */}
          <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9 hover:bg-accent/50"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                {/* AI搜索栏 */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="AI智能搜索..."
                    className="pl-10 pr-4 w-80 bg-accent/30 border-border/50 focus:bg-accent/50 transition-all duration-200 hover:bg-accent/40"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      ⌘K
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 通知按钮 */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-accent/50">
                  <Bell className="h-4 w-4" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse" />
                </Button>
                
                {/* 主题切换 */}
                <ThemeToggle />
                
                {/* 用户菜单 */}
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent/50">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 页面内容 - 带AI风格的容器 */}
          <main className="p-6 bg-gradient-to-br from-background via-background to-accent/5 min-h-screen">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ConsoleProvider>
  )
}