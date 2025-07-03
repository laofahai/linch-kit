/**
 * Modern Sidebar Layout Component for LinchKit Starter
 * 
 * Inspired by Vercel and Supabase design systems
 * Features: Mobile-first responsive design, smooth animations, modern aesthetics
 */

'use client'

import React, { ReactNode, useState, useEffect } from 'react'
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
  Zap,
  CircleUser,
  LogOut
} from 'lucide-react'

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
  { 
    label: 'Admin', 
    href: '/admin', 
    icon: Zap,
    badge: 'Pro'
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
  const Icon = item.icon
  const hasChildren = item.children && item.children.length > 0
  
  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  // For collapsed state with children, use dropdown
  if (isCollapsed && hasChildren) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'group flex items-center justify-center w-full p-2 mx-1 rounded-lg text-sm font-medium transition-all duration-200',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              item.active 
                ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black' 
                : 'text-gray-600 dark:text-gray-300'
            )}
            title={item.label}
          >
            <Icon className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="w-48">
          <DropdownMenuItem>
            <a href={item.href} className="flex items-center w-full">
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </a>
          </DropdownMenuItem>
          {item.children!.map((childItem) => {
            const ChildIcon = childItem.icon
            return (
              <DropdownMenuItem key={childItem.href}>
                <a href={childItem.href} className="flex items-center w-full">
                  <ChildIcon className="w-4 h-4 mr-2" />
                  {childItem.label}
                </a>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div>
      <a
        href={item.href}
        onClick={hasChildren && !isCollapsed ? (e) => { e.preventDefault(); toggleExpanded(); } : undefined}
        className={cn(
          'group flex items-center gap-3 px-2 py-2 mx-1 rounded-lg text-sm font-medium transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          item.active 
            ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black' 
            : 'text-gray-600 dark:text-gray-300',
          isCollapsed && 'justify-center px-2',
          level > 0 && 'ml-4'
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn(
          'flex-shrink-0 transition-colors w-5 h-5',
          item.active ? 'text-white dark:text-black' : 'text-gray-500 group-hover:text-gray-700'
        )} />
        
        {!isCollapsed && (
          <div className="flex items-center justify-between flex-1 min-w-0">
            <span className="truncate">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.badge && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs px-1.5 py-0.5 h-5 border-0',
                    item.active 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
              {hasChildren && (
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )} />
              )}
            </div>
          </div>
        )}
      </a>
      
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
  return (
    <div className={cn(
      'hidden md:flex h-screen bg-white dark:bg-black transition-all duration-300 ease-out',
      'border-r border-gray-200 dark:border-gray-800 flex-col fixed',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo Section */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed ? (
          <a href="/dashboard" className="flex items-center gap-3 transition-colors hover:opacity-80">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-black text-sm font-bold">L</span>
            </div>
            <div className="flex flex-col">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">LinchKit</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Starter</div>
            </div>
          </a>
        ) : (
          <a href="/dashboard" className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center mx-auto transition-colors hover:opacity-80">
            <span className="text-white dark:text-black text-sm font-bold">L</span>
          </a>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
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
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <CircleUser className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">Demo User</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">demo@linchkit.com</div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <CircleUser className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'w-full justify-center h-8 text-gray-500 hover:text-gray-900 dark:hover:text-white',
            isCollapsed && 'w-8 p-0'
          )}
        >
          <ChevronLeft className={cn(
            'w-4 h-4 transition-transform duration-200',
            isCollapsed && 'rotate-180'
          )} />
          {!isCollapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </div>
  )
}

/**
 * Premium Mobile Sidebar Component
 */
function MobileSidebar({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
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
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <CircleUser className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">Demo User</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">demo@linchkit.com</div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
 * Modern App Sidebar Layout
 */
export function AppSidebarLayout({
  children,
  title = 'LinchKit Dashboard',
  breadcrumbs = [],
  className
}: AppSidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

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
        'flex-1 flex flex-col min-w-0 transition-all duration-300',
        'md:ml-64',
        isCollapsed && 'md:ml-16'
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden mr-4 h-9 w-9 p-0"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-600 dark:text-gray-400 font-medium">{title}</BreadcrumbPage>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbSeparator className="text-gray-300 dark:text-gray-600" />
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-gray-900 dark:text-white font-medium">{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header Actions */}
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-500 hover:text-gray-900 dark:hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-950/50">
          <div className="container max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
            {children}
          </div>
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