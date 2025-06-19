'use client'

import { Button } from '@linch-kit/ui/shadcn'
import { Menu, Search, Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UserMenu } from '../auth/UserMenu'
import { Input } from '@linch-kit/ui/shadcn'
import { Badge } from '@linch-kit/ui/shadcn'

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { t } = useTranslation()

  return (
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* 移动端菜单按钮 */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">{t('nav.openSidebar')}</span>
      </Button>

      {/* 分隔线 */}
      <div className="h-6 w-px bg-border lg:hidden" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* 搜索框 */}
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            {t('common.search')}
          </label>
          <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground pl-3" />
          <Input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-10 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm"
            placeholder={`${t('common.search')}...`}
            type="search"
            name="search"
          />
        </form>

        {/* 右侧操作区域 */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* 通知按钮 */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="sr-only">{t('nav.viewNotifications')}</span>
            {/* 通知徽章 */}
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* 分隔线 */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

          {/* 用户菜单 */}
          <UserMenu />
        </div>
      </div>
    </div>
  )
}
