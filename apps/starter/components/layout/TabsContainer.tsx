'use client'

import { useTabsStore } from '@/lib/stores/tabs-store'
import { TabsBar } from './TabsBar'
import { TabContent } from './TabContent'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface TabsContainerProps {
  className?: string
}

export function TabsContainer({ className }: TabsContainerProps) {
  const { tabs, activeTabId } = useTabsStore()
  const isDesktop = useIsDesktop()

  // 响应式标签页显示策略
  const shouldShowTabs = isDesktop && tabs.length > 1

  // 如果不应该显示标签页，直接返回 null
  if (!shouldShowTabs) {
    return null
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 标签栏 */}
      <TabsBar />
      
      {/* 标签内容区域 */}
      <div className="flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <TabContent
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
          />
        ))}
      </div>
    </div>
  )
}