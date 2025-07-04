'use client'

import { useTabsStore, type Tab } from '@/lib/stores/tabs-store'
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
  Pin, 
  PinOff,
  Circle,
  BarChart3,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface TabItemProps {
  tab: Tab
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

export function TabItem({ tab, isActive }: TabItemProps) {
  const { 
    setActiveTab, 
    removeTab, 
    pinTab, 
    unpinTab, 
    closeOthers, 
    updateTab 
  } = useTabsStore()
  
  const router = useRouter()
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)

  const handleTabClick = () => {
    setActiveTab(tab.id)
    router.push(tab.path)
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
    <div className="relative">
      {/* 主标签按钮 */}
      <button
        onClick={handleTabClick}
        onContextMenu={(e) => {
          e.preventDefault()
          setIsContextMenuOpen(true)
        }}
        className={cn(
          'flex items-center gap-2 px-3 h-8 min-w-0 max-w-60 text-sm font-medium rounded-lg',
          'cursor-pointer whitespace-nowrap transition-all duration-200 ease-in-out',
          'group relative',
          isActive 
            ? 'bg-muted text-foreground' 
            : 'text-muted-foreground bg-transparent hover:bg-muted/50 hover:text-foreground'
        )}
      >
        {/* 图标 */}
        {IconComponent && (
          <IconComponent className="h-4 w-4 flex-shrink-0" />
        )}
        
        {/* 固定图标 */}
        {tab.pinned && (
          <Pin className="h-4 w-4 flex-shrink-0 opacity-70" />
        )}
        
        {/* 标题 */}
        <span className="truncate flex-1 text-left">
          {tab.title}
        </span>
        
        {/* 修改状态指示器 */}
        {tab.modified && (
          <Circle className="h-2 w-2 fill-current flex-shrink-0" />
        )}
      </button>

      {/* 右键菜单 */}
      <DropdownMenu open={isContextMenuOpen} onOpenChange={setIsContextMenuOpen}>
        <DropdownMenuTrigger asChild>
          <div className="absolute inset-0 pointer-events-none" />
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={handlePin}>
            {tab.pinned ? (
              <>
                <PinOff className="h-4 w-4 mr-2" />
                取消固定
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 mr-2" />
                固定标签
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRename}>
            重命名标签
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCloseOthers}>
            关闭其他标签
          </DropdownMenuItem>
          {tab.closable && (
            <DropdownMenuItem onClick={() => removeTab(tab.id)} className="text-destructive">
              关闭标签
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}