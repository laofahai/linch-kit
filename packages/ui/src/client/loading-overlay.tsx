'use client'

import { useEffect } from 'react'

interface LoadingOverlayProps {
  message?: string
  isVisible: boolean
  showProgress?: boolean
}

export function LoadingOverlay({
  message = '加载中...',
  isVisible,
  showProgress = false,
}: LoadingOverlayProps) {
  // 防止页面滚动
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6 p-8">
        {/* Loading 动画 */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* 消息文本 */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">{message}</p>
          {showProgress && <p className="text-sm text-muted-foreground">请稍候，正在处理中...</p>}
        </div>
      </div>
    </div>
  )
}
