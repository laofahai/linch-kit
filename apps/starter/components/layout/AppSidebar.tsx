/**
 * Modern Sidebar Layout Component for LinchKit Starter
 * 
 * Inspired by Vercel and Supabase design systems
 * Features: Mobile-first responsive design, smooth animations, modern aesthetics
 */

'use client'

import React, { ReactNode, useState, useEffect, useCallback } from 'react'
import { cn } from '@linch-kit/ui/utils'
import { 
  Button, 
  Sheet, 
  SheetContent,
  Badge, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@linch-kit/ui'
import { 
  Menu, 
  Home, 
  Settings, 
  Users, 
  BarChart3,
  ChevronLeft,
  ChevronDown,
  CircleUser,
  LogOut,
  Globe
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useSession, signOut } from 'next-auth/react'
import { TabsContainer } from './TabsContainer'
import { TabContent } from './TabContent'
import { useTabsStore } from '@/lib/stores/tabs-store'
import { useIsTabletOrDesktop } from '@/hooks/useMediaQuery'

export interface AppSidebarLayoutProps {
  /** 页面内容 */
  children: ReactNode
  /** 页面标题 */
  title?: string
  /** 面包屑导航 */
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  /** 自定义类名 */
  className?: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  badge?: string
  children?: NavItem[]
}

// Vercel-style navigation structure with hierarchy
const modernNavItems: NavItem[] = [
  { 
    label: 'Overview', 
    href: '/dashboard', 
    icon: Home, 
    active: true 
  },
  { 
    label: 'Users', 
    href: '/dashboard/users', 
    icon: Users,
    badge: '12'
  },
  { 
    label: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    children: [
      { label: 'Traffic', href: '/dashboard/analytics/traffic', icon: BarChart3 },
      { label: 'Conversions', href: '/dashboard/analytics/conversions', icon: BarChart3 },
    ]
  },
  { 
    label: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    children: [
      { label: 'General', href: '/dashboard/settings/general', icon: Settings },
      { label: 'Security', href: '/dashboard/settings/security', icon: Settings },
      { label: 'Billing', href: '/dashboard/settings/billing', icon: Settings },
    ]
  },
]

/**
 * Vercel-style Navigation Item Component
 */
function NavMenuItem({ 
  item, 
  isCollapsed, 
  level = 0 
}: { 
  item: NavItem
  isCollapsed: boolean
  level?: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { addTab } = useTabsStore()
  const Icon = item.icon
  const hasChildren = item.children && item.children.length > 0
  
  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleNavClick = (navItem: NavItem) => {
    // 映射图标组件到图标名称
    const getIconName = (iconComponent: React.ComponentType<{ className?: string }>) => {
      if (iconComponent === Home) return 'Home'
      if (iconComponent === Users) return 'Users'
      if (iconComponent === Settings) return 'Settings'
      if (iconComponent === BarChart3) return 'BarChart3'
      return 'Home' // 默认图标
    }

    // 创建新的标签页
    addTab({
      title: navItem.label,
      path: navItem.href,
      icon: getIconName(navItem.icon),
    })
  }

  // For collapsed state with children, use dropdown
  if (isCollapsed && hasChildren) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-10 w-full p-0 text-sm font-medium rounded-none',
              item.active 
                ? 'bg-accent/20 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground' 
                : 'text-muted-foreground'
            )}
            title={item.label}
          >
            <Icon className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="w-48">
          <DropdownMenuItem onClick={() => handleNavClick(item)}>
            <Icon className="w-4 h-4 mr-2" />
            {item.label}
          </DropdownMenuItem>
          {item.children!.map((childItem) => {
            const ChildIcon = childItem.icon
            return (
              <DropdownMenuItem key={childItem.href} onClick={() => handleNavClick(childItem)}>
                <ChildIcon className="w-4 h-4 mr-2" />
                {childItem.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (isCollapsed) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavClick(item)}
          className={cn(
            'h-10 w-full p-0 text-sm font-medium rounded-none',
            item.active 
              ? 'bg-accent/20 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground' 
              : 'text-muted-foreground'
          )}
          title={item.label}
        >
          <Icon className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={hasChildren ? toggleExpanded : () => handleNavClick(item)}
        className={cn(
          'group flex items-center gap-3 px-2 py-1.5 mx-1 rounded-lg text-sm font-medium transition-all duration-100 cursor-pointer',
          'hover:bg-accent/30 dark:hover:bg-accent/40 active:bg-accent/50 dark:active:bg-accent/60',
          item.active 
            ? 'bg-accent/20 text-accent-foreground dark:bg-accent/30 dark:text-accent-foreground' 
            : 'text-muted-foreground',
          level > 0 && 'ml-4'
        )}
      >
        <Icon className={cn(
          'flex-shrink-0 transition-colors w-4 h-4',
          item.active ? 'text-accent-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
        )} />
        
        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="truncate">{item.label}</span>
          <div className="flex items-center gap-2">
            {item.badge && (
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs px-1.5 py-0.5 h-5 border-0',
                  item.active 
                    ? 'bg-accent/30 text-accent-foreground' 
                    : 'bg-accent/10 text-muted-foreground'
                )}
              >
                {item.badge}
              </Badge>
            )}
            {hasChildren && (
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform duration-100',
                isExpanded && 'rotate-180'
              )} />
            )}
          </div>
        </div>
      </div>
      
      {/* Submenu */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1">
          {item.children!.map((childItem) => (
            <NavMenuItem 
              key={childItem.href} 
              item={childItem} 
              isCollapsed={isCollapsed}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Vercel-style Desktop Sidebar Component
 */
function DesktopSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const { data: session } = useSession()
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/sign-in' })
  }
  
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  
  return (
    <div className={cn(
      'hidden md:flex h-screen bg-white dark:bg-black transition-all duration-150 ease-out',
      'border-r border-gray-200 dark:border-gray-800 flex-col fixed',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo Section */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <a href="/dashboard" className={cn(
          "flex items-center transition-all duration-150 hover:opacity-80",
          isCollapsed ? "justify-center w-full" : "gap-3"
        )}>
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white dark:text-black text-sm font-bold">L</span>
          </div>
          <div className={cn(
            "flex flex-col transition-all duration-150 overflow-hidden",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <div className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">LinchKit</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Starter</div>
          </div>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className={cn(
          "space-y-1",
          isCollapsed ? "px-0" : "px-2"
        )}>
          {modernNavItems.map((item) => (
            <NavMenuItem 
              key={item.href} 
              item={item} 
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className={cn(
        "border-t border-gray-200 dark:border-gray-800",
        isCollapsed ? "p-0" : "p-3"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {!isCollapsed ? (
              <Button variant="ghost" className="w-full justify-start gap-3 p-2 h-auto">
                <div className="w-7 h-7 bg-accent/20 rounded-full flex items-center justify-center">
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'User'} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-accent-foreground">
                      {getUserInitials(session?.user?.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-foreground truncate">
                    {session?.user?.name || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {session?.user?.email || 'No email'}
                  </div>
                </div>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-10 w-full p-0 rounded-none">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-accent-foreground">
                    {getUserInitials(session?.user?.name)}
                  </span>
                )}
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "top"} className="w-56">
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-accent-foreground">
                    {getUserInitials(session?.user?.name)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {session?.user?.name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {session?.user?.email || 'No email'}
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CircleUser className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Actions & Toggle */}
      <div className={cn(
        "border-t border-gray-200 dark:border-gray-800",
        isCollapsed ? "p-0" : "p-3"
      )}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  title="Language"
                >
                  <Globe className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="center">
                <DropdownMenuItem>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem>
                  中文
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 ml-auto text-muted-foreground hover:text-foreground"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-100" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-1">
            {/* Theme Toggle - no extra wrapper button */}
            <div className="flex items-center justify-center h-10 w-full">
              <ThemeToggle className="h-10 w-full hover:bg-accent/30 dark:hover:bg-accent/40 active:bg-accent/50 dark:active:bg-accent/60 transition-colors rounded-none" />
            </div>
            
            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-10 w-full p-0 text-muted-foreground hover:text-foreground rounded-none"
              title="Expand sidebar"
            >
              <ChevronLeft className="w-4 h-4 transition-transform duration-100 rotate-180" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Premium Mobile Sidebar Component
 */
function MobileSidebar({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: session } = useSession()
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/sign-in' })
  }
  
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 bg-white dark:bg-black border-gray-200 dark:border-gray-800">
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-800">
            <a href="/dashboard" className="flex items-center gap-3 transition-colors hover:opacity-80">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black text-sm font-bold">L</span>
              </div>
              <div className="flex flex-col">
                <div className="font-semibold text-gray-900 dark:text-white text-sm">LinchKit</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Starter</div>
              </div>
            </a>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="space-y-1 px-4">
              {modernNavItems.map((item) => (
                <NavMenuItem 
                  key={item.href} 
                  item={item} 
                  isCollapsed={false}
                />
              ))}
            </div>
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 dark:hover:bg-accent/40 active:bg-accent/50 dark:active:bg-accent/60 transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-accent-foreground">
                    {getUserInitials(session?.user?.name)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {session?.user?.email || 'No email'}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Custom hook for sidebar state persistence
 */
function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState))
    }
  }, [])
  
  // Save state to localStorage when changed
  const toggleSidebar = useCallback(() => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }, [isCollapsed])
  
  return { isCollapsed, toggleSidebar }
}

/**
 * Modern App Sidebar Layout
 */
export function AppSidebarLayout({
  children,
  title = 'LinchKit Dashboard',
  breadcrumbs = [],
  className
}: AppSidebarLayoutProps) {
  const { isCollapsed, toggleSidebar } = useSidebarState()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { tabs, activeTabId } = useTabsStore()
  const isTabletOrDesktop = useIsTabletOrDesktop()

  // 优化的响应式导航策略：
  // - 移动端(≤640px): 始终显示面包屑，节省空间
  // - 平板端(641-1023px): 根据标签数量智能选择
  // - 桌面端(≥1024px): 优先显示标签页，提供完整功能
  const shouldShowTabs = isTabletOrDesktop && tabs.length > 1

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [])

  return (
    <div className={cn('flex min-h-screen bg-white dark:bg-black', className)}>
      {/* Desktop Sidebar */}
      <DesktopSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      
      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} />

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0 transition-all duration-150',
        'md:ml-64',
        isCollapsed && 'md:ml-16'
      )}>
        {/* 统一动态导航栏 - 优化版本 */}
        <header className={cn(
          "sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-between",
          shouldShowTabs ? "h-16 px-0" : "h-16 px-4 md:px-6 border-b border-gray-200 dark:border-gray-800"
        )}>
          {shouldShowTabs ? (
            /* PC端：完整宽度的标签栏 */
            <div className="flex items-center w-full h-full">
              {/* Mobile Menu Button */}
              <div className="md:hidden px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
              
              {/* 标签栏占满宽度 */}
              <div className="flex-1 h-full">
                <TabsContainer headerOnly={true} />
              </div>
            </div>
          ) : (
            /* 移动端：传统导航 */
            <>
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden mr-4 h-9 w-9 p-0"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* 面包屑导航 - 移动端优化 */}
              <div className="flex-1 px-2">
                <Breadcrumb>
                  <BreadcrumbList className="flex-wrap">
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium text-foreground text-sm md:text-base">
                        {title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={index}>
                        <BreadcrumbSeparator className="mx-1" />
                        <BreadcrumbItem>
                          {crumb.href ? (
                            <BreadcrumbLink href={crumb.href} className="text-sm md:text-base">
                              {crumb.label}
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage className="font-medium text-foreground text-sm md:text-base">
                              {crumb.label}
                            </BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </>
          )}
        </header>

        {/* 页面内容区域 */}
        <main className="flex-1 overflow-hidden bg-gray-50/50 dark:bg-gray-950/50">
          {shouldShowTabs ? (
            /* PC端：标签页内容区域（不包含标签栏） */
            <div className="h-full">
              {/* 显示所有标签页内容，但只有活动的可见 */}
              {tabs.map((tab) => (
                <TabContent
                  key={tab.id}
                  tab={tab}
                  isActive={tab.id === activeTabId}
                />
              ))}
            </div>
          ) : (
            /* 移动端：传统页面内容 */
            <div className="h-full overflow-auto p-4 md:p-6">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/**
 * Modern Page Container
 */
export interface AppPageProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function AppPage({
  title,
  description,
  actions,
  children,
  className
}: AppPageProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      {(title || description || actions) && (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Page Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}