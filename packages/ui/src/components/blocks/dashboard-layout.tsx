"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronRight, Home } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"
import { ThemeToggle } from "../theme-toggle"

/**
 * Navigation item configuration
 */
export interface NavigationItem {
  /** Item title */
  title: string
  /** Item URL */
  href: string
  /** Item icon */
  icon?: React.ComponentType<{ className?: string }>
  /** Whether item is disabled */
  disabled?: boolean
  /** Child navigation items */
  children?: NavigationItem[]
  /** Whether item is external */
  external?: boolean
}

/**
 * Breadcrumb item configuration
 */
export interface BreadcrumbItem {
  /** Item title */
  title: string
  /** Item URL (optional for current page) */
  href?: string
}

/**
 * Sidebar configuration
 */
export interface SidebarConfig {
  /** Logo component */
  logo?: React.ReactNode
  /** Navigation items */
  navigation: NavigationItem[]
  /** Whether sidebar is collapsible */
  collapsible?: boolean
  /** Footer content */
  footer?: React.ReactNode
}

/**
 * Header configuration
 */
export interface HeaderConfig {
  /** Whether to show breadcrumb */
  breadcrumb?: boolean
  /** Custom breadcrumb items */
  breadcrumbItems?: BreadcrumbItem[]
  /** Whether to show theme toggle */
  themeToggle?: boolean
  /** User menu component */
  userMenu?: React.ReactNode
  /** Additional header actions */
  actions?: React.ReactNode
}

/**
 * Props for DashboardLayout component
 */
export interface DashboardLayoutProps {
  /** Child content */
  children: React.ReactNode
  /** Sidebar configuration */
  sidebar: SidebarConfig
  /** Header configuration */
  header?: HeaderConfig
  /** Custom className */
  className?: string
}

/**
 * Navigation item component
 */
function NavigationItemComponent({ 
  item, 
  pathname, 
  onClick 
}: { 
  item: NavigationItem
  pathname: string
  onClick?: () => void
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const Icon = item.icon

  if (item.children?.length) {
    return (
      <div className="space-y-1">
        <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground">
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {item.title}
        </div>
        <div className="ml-4 space-y-1">
          {item.children.map((child) => (
            <NavigationItemComponent
              key={child.href}
              item={child}
              pathname={pathname}
              onClick={onClick}
            />
          ))}
        </div>
      </div>
    )
  }

  const content = (
    <div
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        item.disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {item.title}
    </div>
  )

  if (item.disabled) {
    return content
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={item.href} onClick={onClick}>
      {content}
    </Link>
  )
}

/**
 * Sidebar component
 */
function Sidebar({ 
  config, 
  className 
}: { 
  config: SidebarConfig
  className?: string
}) {
  const pathname = usePathname()

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Logo */}
      {config.logo && (
        <div className="flex h-14 items-center border-b px-4">
          {config.logo}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {config.navigation.map((item) => (
          <NavigationItemComponent
            key={item.href}
            item={item}
            pathname={pathname}
          />
        ))}
      </nav>

      {/* Footer */}
      {config.footer && (
        <div className="border-t p-4">
          {config.footer}
        </div>
      )}
    </div>
  )
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "首页", href: "/" }
  ]

  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    breadcrumbs.push({
      title: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : currentPath,
    })
  })

  return breadcrumbs
}

/**
 * Dashboard layout component with sidebar navigation and header
 * 
 * @example
 * ```tsx
 * const navigation = [
 *   {
 *     title: "Dashboard",
 *     href: "/dashboard",
 *     icon: Home,
 *   },
 *   {
 *     title: "Users",
 *     href: "/users",
 *     icon: Users,
 *   },
 * ]
 * 
 * <DashboardLayout
 *   sidebar={{
 *     logo: <Logo />,
 *     navigation,
 *   }}
 *   header={{
 *     breadcrumb: true,
 *     themeToggle: true,
 *     userMenu: <UserMenu />,
 *   }}
 * >
 *   {children}
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  children,
  sidebar,
  header = {},
  className,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const pathname = usePathname()

  const {
    breadcrumb = true,
    breadcrumbItems,
    themeToggle = true,
    userMenu,
    actions,
  } = header

  const breadcrumbs = breadcrumbItems || (breadcrumb ? generateBreadcrumbs(pathname) : [])

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Sidebar config={sidebar} className="border-r" />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar 
            config={sidebar} 
            className="h-full"
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink asChild>
                          <Link href={item.href}>{item.title}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.title}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {actions}
            {themeToggle && <ThemeToggle />}
            {userMenu}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
