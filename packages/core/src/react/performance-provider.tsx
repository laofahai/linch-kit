'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { Logger } from '../logger-client'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
  isLoading: boolean
}

interface PageLoadingContextValue {
  metrics: PerformanceMetrics
  startLoading: () => void
  stopLoading: () => void
  recordInteraction: (action: string) => void
}

const PageLoadingContext = createContext<PageLoadingContextValue | undefined>(undefined)

export function usePageLoading() {
  const context = useContext(PageLoadingContext)
  if (!context) {
    throw new Error('usePageLoading must be used within a PageLoadingProvider')
  }
  return context
}

interface PageLoadingProviderProps {
  children: ReactNode
}

export function PageLoadingProvider({ children }: PageLoadingProviderProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    isLoading: false,
  })
  const [loadStartTime, setLoadStartTime] = useState<number>(0)
  const [renderStartTime, setRenderStartTime] = useState<number>(0)

  useEffect(() => {
    // 记录页面加载性能
    const recordPageLoad = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = window.performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart
        const renderTime =
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart

        setMetrics(prev => ({
          ...prev,
          loadTime,
          renderTime,
        }))

        // 记录性能日志
        Logger.info('页面加载性能', {
          loadTime,
          renderTime,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstContentfulPaint: navigation.loadEventEnd - navigation.fetchStart,
          url: window.location.href,
          userAgent: window.navigator.userAgent,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // 页面加载完成后记录性能
    if (document.readyState === 'complete') {
      recordPageLoad()
    } else {
      window.addEventListener('load', recordPageLoad)
      return () => window.removeEventListener('load', recordPageLoad)
    }
  }, [])

  const startLoading = () => {
    setLoadStartTime(Date.now())
    setRenderStartTime(Date.now())
    setMetrics(prev => ({ ...prev, isLoading: true }))
  }

  const stopLoading = () => {
    const endTime = Date.now()
    const loadTime = endTime - loadStartTime
    const renderTime = endTime - renderStartTime

    setMetrics(prev => ({
      ...prev,
      loadTime,
      renderTime,
      isLoading: false,
    }))

    // 记录加载性能
    Logger.info('页面加载完成', {
      loadTime,
      renderTime,
      timestamp: new Date().toISOString(),
    })
  }

  const recordInteraction = (action: string) => {
    const interactionTime = Date.now()
    setMetrics(prev => ({ ...prev, interactionTime }))

    Logger.info('用户交互', {
      action,
      interactionTime,
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <PageLoadingContext.Provider value={{ metrics, startLoading, stopLoading, recordInteraction }}>
      {children}
    </PageLoadingContext.Provider>
  )
}

// 性能监控组件
export function PerformanceMonitor() {
  const { metrics } = usePageLoading()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div>加载时间: {metrics.loadTime}ms</div>
        <div>渲染时间: {metrics.renderTime}ms</div>
        <div
          className={`flex items-center gap-2 ${metrics.isLoading ? 'text-yellow-400' : 'text-green-400'}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${metrics.isLoading ? 'bg-yellow-400' : 'bg-green-400'}`}
          ></div>
          {metrics.isLoading ? '加载中' : '就绪'}
        </div>
      </div>
    </div>
  )
}
