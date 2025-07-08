/**
 * 生产环境监控配置
 * 支持多种监控服务集成
 */

// Vercel Analytics
export const initVercelAnalytics = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Vercel Analytics 会自动注入，无需额外配置
    console.log('Vercel Analytics initialized')
  }
}

// Sentry 错误监控配置
export const sentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  beforeSend(event: unknown) {
    // 过滤敏感信息
    const eventObj = event as Record<string, unknown>
    const request = eventObj.request as Record<string, unknown>

    if (request?.cookies) {
      delete request.cookies
    }
    if (request?.headers) {
      const headers = request.headers as Record<string, unknown>
      delete headers.authorization
      delete headers.cookie
    }
    return event
  },
}

// 自定义性能监控
export const performanceMonitor = {
  // 记录页面加载性能
  recordPageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart
      const tcpTime = perfData.connectEnd - perfData.connectStart
      const requestTime = perfData.responseEnd - perfData.requestStart
      const domTime = perfData.domComplete - perfData.domLoading

      // 发送到分析服务
      console.log('Performance metrics:', {
        pageLoadTime,
        dnsTime,
        tcpTime,
        requestTime,
        domTime,
      })
    }
  },

  // 记录 API 调用性能
  recordApiCall: (endpoint: string, duration: number, status: number) => {
    // 发送到分析服务
    console.log('API performance:', {
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString(),
    })
  },
}

// 用户行为追踪
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'production') {
    // 发送到分析服务
    console.log('Track event:', eventName, properties)
  }
}

// 初始化所有监控服务
export const initMonitoring = () => {
  if (typeof window !== 'undefined') {
    // 初始化 Vercel Analytics
    initVercelAnalytics()

    // 监听页面加载完成
    window.addEventListener('load', () => {
      performanceMonitor.recordPageLoad()
    })

    // 监听错误
    window.addEventListener('error', event => {
      console.error('Global error:', event)
    })

    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled promise rejection:', event)
    })
  }
}
