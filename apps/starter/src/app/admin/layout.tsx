'use client'

import { ConsoleProvider } from '@linch-kit/console'
import { Button } from '@linch-kit/ui/components'
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
    { name: '概览', href: '/admin', icon: LayoutDashboard, current: pathname === '/admin' },
    { name: '租户管理', href: '/admin/tenants', icon: Building, current: pathname === '/admin/tenants' },
    { name: '用户管理', href: '/admin/users', icon: Users, current: pathname === '/admin/users' },
    { name: '系统监控', href: '/admin/monitoring', icon: Activity, current: pathname === '/admin/monitoring' },
    { name: '设置', href: '/admin/settings', icon: Settings, current: pathname === '/admin/settings' },
  ]

  return (
    <ConsoleProvider>
      <div className="min-h-screen bg-background">
        {/* 移动端侧边栏遮罩 */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* 侧边栏 */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">LK</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold">LinchKit</h1>
                <p className="text-xs text-muted-foreground">管理控制台</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${item.current
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          {/* 底部用户信息 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">管理员</p>
                <p className="text-xs text-muted-foreground truncate">admin@example.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="lg:pl-64">
          {/* 顶部导航栏 */}
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索..."
                    className="pl-10 pr-4 py-2 w-64 bg-muted rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 页面内容 */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ConsoleProvider>
  )
}