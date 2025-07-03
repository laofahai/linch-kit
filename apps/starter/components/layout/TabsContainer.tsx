'use client'

import { useTabsStore } from '@/lib/stores/tabs-store'
import { TabsBar } from './TabsBar'
import { TabContent } from './TabContent'
import { cn } from '@/lib/utils'

interface TabsContainerProps {
  className?: string
}

export function TabsContainer({ className }: TabsContainerProps) {
  const { tabs, activeTabId } = useTabsStore()

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