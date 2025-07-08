'use client'

import { useEffect } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals'

interface WebVitalsProps {
  onMetric?: (metric: { name: string; value: number; rating: string }) => void
  debug?: boolean
}

declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: Record<string, unknown>) => void
  }
}

export const WebVitals: React.FC<WebVitalsProps> = ({ onMetric, debug = false }) => {
  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      const { name, value, rating } = metric

      if (debug) {
        console.log(`[WebVitals] ${name}: ${value.toFixed(2)}ms (${rating})`)
      }

      // 发送到分析服务
      if (onMetric) {
        onMetric({ name, value, rating })
      }

      // 发送到 Google Analytics 或其他分析服务
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', name, {
          value: Math.round(name === 'CLS' ? value * 1000 : value),
          event_category: 'Web Vitals',
          event_label: rating,
          non_interaction: true,
        })
      }
    }

    // 监听 Core Web Vitals
    onCLS(handleMetric)
    onINP(handleMetric) // INP 替代 FID
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
  }, [onMetric, debug])

  // 这是一个隐藏的监控组件，不渲染任何可见内容
  return null
}

export default WebVitals
