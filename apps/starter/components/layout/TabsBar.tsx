'use client'

import { useTabsStore } from '@/lib/stores/tabs-store'
import { TabItem } from './TabItem'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function TabsBar() {
  const { tabs, activeTabId, addTab } = useTabsStore()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // 检查是否需要显示滚动按钮
  useEffect(() => {
    const checkScrollButtons = () => {
      if (!scrollAreaRef.current) return

      const { scrollLeft, scrollWidth, clientWidth } = scrollAreaRef.current
      const needsScroll = scrollWidth > clientWidth

      setShowScrollButtons(needsScroll)
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth)
    }

    checkScrollButtons()
    
    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      scrollArea.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
      
      return () => {
        scrollArea.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', checkScrollButtons)
      }
    }
  }, [tabs])

  const scrollLeft = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  const handleAddTab = () => {
    // 添加新标签页的逻辑，这里可以打开一个新的dashboard或指定页面
    addTab({
      title: 'New Tab',
      path: '/dashboard/new',
      icon: 'Plus',
    })
  }

  return (
    <div className="flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* 左滚动按钮 */}
      {showScrollButtons && (
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* 标签页滚动区域 */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex min-w-max">
          {tabs.map((tab, index) => (
            <TabItem
              key={tab.id}
              tab={tab}
              index={index}
              isActive={tab.id === activeTabId}
            />
          ))}
        </div>
      </div>

      {/* 右滚动按钮 */}
      {showScrollButtons && (
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollRight}
          disabled={!canScrollRight}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* 添加标签页按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddTab}
        className="h-8 w-8 p-0 flex-shrink-0 ml-1"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}