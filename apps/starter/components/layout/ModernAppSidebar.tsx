/**
 * Starter 应用的现代化 Sidebar 布局组件
 * 
 * 完全独立的实现，不依赖 console 模块
 */

'use client'

import React, { ReactNode, useState, useEffect } from 'react'
import { cn } from '@linch-kit/ui/utils'
import { 
  Button, 
  Card, 
  CardContent, 
  Separator, 
  Avatar, 
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
  Badge
} from '@linch-kit/ui'
import { 
  Menu, 
  Home, 
  Settings, 
  Users, 
  BarChart3,
  FileText,
  Shield,
  Database,
  Globe,
  Coffee,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  disabled?: boolean
  children?: NavItem[]
  badge?: string | number
}

interface BreadcrumbItem {
  label: string
  href?: string
}

export interface AppSidebarLayoutProps {
  /** 页面内容 */
  children: ReactNode
  /** 页面标题 */
  title?: string
  /** 页面描述 */
  description?: string
  /** 页面动作 */
  actions?: ReactNode
  /** 面包屑导航 */
  breadcrumbs?: BreadcrumbItem[]
  /** 自定义类名 */
  className?: string
  /** 用户信息 */
  user?: {
    name: string
    email: string
    avatar?: string
  }
  /** 是否显示卡片容器 */
  showCard?: boolean
  /** 内边距大小 */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** 是否显示通知 */
  showNotifications?: boolean
  /** 是否显示主题切换 */
  showThemeToggle?: boolean
  /** 是否显示搜索 */
  showSearch?: boolean
  /** 默认折叠状态 */
  defaultCollapsed?: boolean
  /** 响应式断点 */
  responsiveBreakpoint?: 'sm' | 'md' | 'lg'
}

// Starter 应用的导航项目
const starterNavItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: Home, 
    active: true 
  },
  { 
    label: 'Users', 
    href: '/dashboard/users', 
    icon: Users, 
    badge: '24'
  },
  { 
    label: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    badge: 'New'
  },
  { 
    label: 'tRPC Demo', 
    href: '/trpc-demo', 
    icon: Database 
  },
  { 
    label: 'Test Sidebar', 
    href: '/test-sidebar', 
    icon: FileText 
  },
  { 
    label: 'Admin Panel', 
    href: '/admin', 
    icon: Shield,
    badge: '!'
  },
  { 
    label: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings 
  },
  { 
    label: 'API Status', 
    href: '/status', 
    icon: Globe,
    badge: 'Live'
  },
  { 
    label: 'Coffee Break', 
    href: '/coffee', 
    icon: Coffee,
    disabled: true
  }
]

/**
 * Starter 应用的现代化 Sidebar 布局
 */
export function AppSidebarLayout({
  children,
  title,
  description,
  actions,
  breadcrumbs = [],
  className,
  user = {
    name: 'John Doe',
    email: 'john@example.com'
  },
  showCard = false,
  padding = 'lg',
  showNotifications = true,
  showThemeToggle = true,
  showSearch = true,
  defaultCollapsed = false,
  responsiveBreakpoint = 'md'
}: AppSidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMobile, setIsMobile] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  // 响应式检测
  useEffect(() => {
    const checkDevice = () => {
      const breakpoints = {
        sm: 640,
        md: 768,
        lg: 1024
      }
      setIsMobile(window.innerWidth < breakpoints[responsiveBreakpoint])
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [responsiveBreakpoint])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  // 移动端侧边栏
  const MobileSidebar = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )

  // 侧边栏内容
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* 品牌区域 */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-xl text-gray-900 dark:text-white truncate">
                LinchKit
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                Starter App
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 导航区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <nav className="space-y-2">
          {starterNavItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              isCollapsed={isCollapsed && !isMobile}
            />
          ))}
        </nav>
      </div>

      {/* 用户区域 */}
      {user && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  // 导航项组件
  const NavItemComponent = ({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) => {
    const Icon = item.icon
    
    const content = (
      <a
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
          'hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm',
          item.active && 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 text-green-700 dark:text-green-400 shadow-sm border border-green-200 dark:border-green-800',
          item.disabled && 'opacity-50 cursor-not-allowed',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn(
          'h-5 w-5 flex-shrink-0 transition-all duration-200',
          item.active && 'text-green-600 dark:text-green-400',
          'group-hover:scale-110'
        )} />
        
        {!isCollapsed && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <Badge 
                variant={item.active ? "default" : "secondary"} 
                className={cn(
                  "ml-auto h-5 px-2 text-xs",
                  item.active && "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                )}
              >
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </a>
    )

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return content
  }

  return (
    <div className={cn('flex min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <aside
          className={cn(
            'relative bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-16' : 'w-80'
          )}
        >
          <SidebarContent />
          
          {/* 折叠按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute -right-4 top-6 h-8 w-8 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </aside>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4">
          {/* 移动端菜单 */}
          <MobileSidebar />

          {/* 面包屑导航 */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* 右侧操作区 */}
          <div className="ml-auto flex items-center gap-2">
            {/* 搜索 */}
            {showSearch && (
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* 通知 */}
            {showNotifications && (
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            )}

            {/* 主题切换 */}
            {showThemeToggle && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme}>
                <ThemeIcon className="h-4 w-4" />
              </Button>
            )}

            {/* 分割线 */}
            <Separator orientation="vertical" className="h-6 mx-2" />
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto">
          <AppPage
            title={title}
            description={description}
            actions={actions}
            showCard={showCard}
            padding={padding}
          >
            {children}
          </AppPage>
        </main>
      </div>
    </div>
  )
}

/**
 * 简化版页面容器（不含 sidebar）
 */
export interface AppPageProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  showCard?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export function AppPage({
  title,
  description,
  actions,
  children,
  className,
  showCard = false,
  padding = 'lg'
}: AppPageProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  }

  const content = (
    <div className={cn(paddingClasses[padding], className)}>
      {/* 页面头部 */}
      {(title || description || actions) && (
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            
            {actions && (
              <div className="ml-6 flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 页面内容 */}
      <div className="space-y-8">
        {children}
      </div>
    </div>
  )

  if (showCard) {
    return (
      <div className="p-6">
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-950">
          <CardContent className="p-0">
            {content}
          </CardContent>
        </Card>
      </div>
    )
  }

  return content
}