'use client'

import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { Logger } from '../logger-client'

export function MonitoringProvider() {
  useEffect(() => {
    // 使用 @linch-kit/core 的 Logger 初始化监控
    Logger.info('Monitoring initialized for starter app')
  }, [])

  return (
    <>
      {/* Vercel Analytics - 自动追踪页面浏览和 Web Vitals */}
      <Analytics />
      {/* Vercel Speed Insights - 实时性能监控 */}
      <SpeedInsights />
    </>
  )
}
