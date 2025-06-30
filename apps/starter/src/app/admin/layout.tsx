'use client'

import { ConsoleProvider } from '@linch-kit/console'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarInset, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarSeparator, 
  SidebarTrigger 
} from '@linch-kit/ui/components'
import { Button } from '@linch-kit/ui/components'
import { Input } from '@linch-kit/ui/components'
import { Badge } from '@linch-kit/ui/components'
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Activity, 
  Settings, 
  Bell,
  Search,
  User,
  Sparkles,
  Brain,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <SidebarProvider>
        <Sidebar variant="inset">
          <SidebarHeader>
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
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>核心功能</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild
                        isActive={item.current}
                        tooltip={item.name}
                      >
                        <Link href={item.href} className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <item.icon className="mr-3 h-4 w-4" />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <Badge 
                              variant={item.current ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>AI助手</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">智能分析</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">实时洞察和建议</p>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-primary to-primary/90"
                  >
                    启动AI分析
                  </Button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
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
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center flex-1 justify-between">
              <div className="relative hidden sm:block ml-4">
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
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse" />
                </Button>
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ConsoleProvider>
  )
}