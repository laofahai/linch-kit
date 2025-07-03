'use client'

import { type Tab } from '@/lib/stores/tabs-store'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface TabContentProps {
  tab: Tab
  isActive: boolean
}

export function TabContent({ tab, isActive }: TabContentProps) {
  // 当标签页变为活动状态时，可以执行一些操作
  useEffect(() => {
    if (isActive) {
      // 这里可以添加标签页激活时的逻辑
      // 例如：更新浏览器标题、发送分析事件等
      document.title = `${tab.title} - LinchKit`
    }
  }, [isActive, tab.title])

  return (
    <div
      className={cn(
        'h-full w-full',
        isActive ? 'block' : 'hidden'
      )}
      data-tab-id={tab.id}
      data-tab-path={tab.path}
    >
      {/* 这里将渲染页面内容 */}
      {/* 在实际实现中，这里应该根据tab.path来决定渲染哪个页面组件 */}
      <div className="h-full w-full flex flex-col">
        {/* 页面内容占位符 */}
        <div className="flex-1 p-6">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">{tab.title}</h3>
            <p>Path: {tab.path}</p>
            <p className="text-sm mt-4">
              页面内容将在这里渲染。当前这是一个占位符。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}