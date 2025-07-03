/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useTabsStore, type Tab } from '@/lib/stores/tabs-store'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Home, 
  Settings, 
  Users, 
  X, 
  Pin, 
  PinOff, 
  MoreHorizontal,
  Circle,
  BarChart3,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface TabItemProps {
  tab: Tab
  index: number
  isActive: boolean
}

// 图标映射
const iconMap = {
  Home,
  Settings,
  Users,
  Pin,
  PinOff,
  Circle,
  BarChart3,
  Zap,
} as const

export function TabItem({ tab, index, isActive }: TabItemProps) {
  const { 
    setActiveTab, 
    removeTab, 
    pinTab, 
    unpinTab, 
    closeOthers, 
    updateTab 
  } = useTabsStore()
  
  const router = useRouter()

  const handleTabClick = () => {
    setActiveTab(tab.id)
    router.push(tab.path)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeTab(tab.id)
  }

  const handlePin = () => {
    if (tab.pinned) {
      unpinTab(tab.id)
    } else {
      pinTab(tab.id)
    }
  }

  const handleCloseOthers = () => {
    closeOthers(tab.id)
  }

  const handleRename = () => {
    const newTitle = prompt('Enter new title:', tab.title)
    if (newTitle && newTitle !== tab.title) {
      updateTab(tab.id, { title: newTitle })
    }
  }

  // 获取图标组件
  const IconComponent = tab.icon && iconMap[tab.icon as keyof typeof iconMap]

  return (
    <div
      className={cn(
        'group flex items-center min-w-0 max-w-60 border-r border-border/50 relative',
        isActive && 'bg-background',
        !isActive && 'bg-muted/50 hover:bg-muted/80'
      )}
    >
      {/* 活动标签页指示器 */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
      )}

      {/* 标签页内容 */}
      <button
        onClick={handleTabClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 min-w-0 flex-1 text-sm transition-colors',
          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {/* 图标 */}
        {IconComponent && (
          <IconComponent className="h-4 w-4 flex-shrink-0" />
        )}
        
        {/* 固定图标 */}
        {tab.pinned && (
          <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
        
        {/* 标题 */}
        <span className="truncate flex-1 text-left">
          {tab.title}
        </span>
        
        {/* 修改状态指示器 */}
        {tab.modified && (
          <Circle className="h-2 w-2 fill-current text-primary flex-shrink-0" />
        )}
      </button>

      {/* 操作按钮 */}
      <div className="flex items-center">
        {/* 关闭按钮 */}
        {tab.closable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className={cn(
              'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
              isActive && 'opacity-100'
            )}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* 更多操作菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                isActive && 'opacity-100'
              )}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePin}>
              {tab.pinned ? (
                <>
                  <PinOff className="h-4 w-4 mr-2" />
                  Unpin Tab
                </>
              ) : (
                <>
                  <Pin className="h-4 w-4 mr-2" />
                  Pin Tab
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRename}>
              Rename Tab
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCloseOthers}>
              Close Others
            </DropdownMenuItem>
            {tab.closable && (
              <DropdownMenuItem onClick={() => removeTab(tab.id)}>
                Close Tab
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}