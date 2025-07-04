'use client'

import { useState, useEffect } from 'react'

/**
 * 响应式媒体查询 Hook
 * 用于检测屏幕尺寸变化，支持 SSR
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // 使用现代 API
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  // SSR 兼容：首次渲染时返回 false，避免水合不匹配
  if (!mounted) {
    return false
  }

  return matches
}

/**
 * 预定义的断点 Hooks
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')
export const useIsTablet = () => useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
export const useIsMobile = () => useMediaQuery('(max-width: 639px)')