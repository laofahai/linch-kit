'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { cn } from '@linch-kit/ui/lib/utils'
import { Button } from '@linch-kit/ui/shadcn'
import { 
  Home, 
  Users, 
  Settings, 
  Database,
  FileText,
  BarChart3,
  X
} from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

// 导航配置将在组件内部使用翻译

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: Home },
    { name: t('nav.users'), href: '/users', icon: Users },
    { name: t('nav.data'), href: '/data', icon: Database },
    { name: t('nav.reports'), href: '/reports', icon: BarChart3 },
    { name: t('nav.docs'), href: '/docs', icon: FileText },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* 桌面端侧边栏 */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-foreground">
              {t('app.title')}
            </h1>
          </div>

          {/* 导航菜单 */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* 移动端侧边栏 */}
      <div className={cn(
        'fixed inset-y-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4 border-r border-border">
          {/* 头部 */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">
              {t('app.title')}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t('nav.closeSidebar')}</span>
            </Button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
