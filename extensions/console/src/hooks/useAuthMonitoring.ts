/**
 * 认证监控React Hooks
 * 
 * 提供认证监控数据的React hooks
 */

import { useState, useEffect, useCallback } from 'react'

import { authMonitoringService, AuthEventType } from '../services/auth-monitoring.service'

/**
 * 认证统计数据
 */
export interface AuthStatistics {
  totalAttempts: number
  successfulLogins: number
  failedLogins: number
  uniqueUsers: number
  suspiciousActivities: number
  averageResponseTime: number
  errorRate: number
}

/**
 * 认证监控状态
 */
export interface AuthMonitoringState {
  statistics: AuthStatistics | null
  loading: boolean
  error: string | null
}

/**
 * 使用认证统计数据
 */
export function useAuthStatistics(
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
) {
  const [state, setState] = useState<AuthMonitoringState>({
    statistics: null,
    loading: true,
    error: null
  })

  const fetchStatistics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const statistics = await authMonitoringService.getAuthStatistics(timeRange)
      
      setState({
        statistics,
        loading: false,
        error: null
      })
    } catch (error) {
      setState({
        statistics: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [timeRange])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchStatistics, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchStatistics])

  return {
    ...state,
    refetch: fetchStatistics
  }
}

/**
 * 认证事件记录器
 */
export function useAuthEventRecorder() {
  const [recording, setRecording] = useState(false)

  const recordEvent = useCallback(async (
    eventType: AuthEventType,
    data: {
      userId?: string
      sessionId?: string
      ipAddress?: string
      userAgent?: string
      location?: string
      success: boolean
      duration?: number
      errorCode?: string
      errorMessage?: string
      riskScore?: number
      metadata?: Record<string, unknown>
    }
  ) => {
    setRecording(true)
    try {
      await authMonitoringService.recordAuthEvent({
        eventType,
        ...data
      })
    } catch (error) {
      console.error('Failed to record auth event:', error)
      throw error
    } finally {
      setRecording(false)
    }
  }, [])

  return {
    recordEvent,
    recording
  }
}

/**
 * 登录监控器
 */
export function useLoginMonitor() {
  const [monitoring, setMonitoring] = useState(false)

  const monitorLogin = useCallback(async (
    userEmail: string,
    ipAddress: string,
    userAgent?: string,
    location?: string
  ) => {
    setMonitoring(true)
    try {
      const result = await authMonitoringService.monitorLoginAttempt(
        userEmail,
        ipAddress,
        userAgent,
        location
      )
      return result
    } catch (error) {
      console.error('Failed to monitor login:', error)
      throw error
    } finally {
      setMonitoring(false)
    }
  }, [])

  return {
    monitorLogin,
    monitoring
  }
}

/**
 * JWT令牌监控器
 */
export function useTokenMonitor() {
  const [monitoring, setMonitoring] = useState(false)

  const monitorToken = useCallback(async (
    operation: 'issue' | 'refresh' | 'revoke' | 'validate',
    tokenId: string,
    options: {
      userId?: string
      sessionId?: string
      success?: boolean
      duration?: number
      errorCode?: string
    } = {}
  ) => {
    setMonitoring(true)
    try {
      await authMonitoringService.monitorTokenOperation(
        operation,
        tokenId,
        options.userId,
        options.sessionId,
        options.success,
        options.duration,
        options.errorCode
      )
    } catch (error) {
      console.error('Failed to monitor token operation:', error)
      throw error
    } finally {
      setMonitoring(false)
    }
  }, [])

  return {
    monitorToken,
    monitoring
  }
}

/**
 * 会话监控器
 */
export function useSessionMonitor() {
  const [monitoring, setMonitoring] = useState(false)

  const monitorSession = useCallback(async (
    sessionId: string,
    userId: string,
    event: 'created' | 'accessed' | 'expired' | 'revoked',
    ipAddress?: string,
    userAgent?: string
  ) => {
    setMonitoring(true)
    try {
      await authMonitoringService.monitorSessionLifecycle(
        sessionId,
        userId,
        event,
        ipAddress,
        userAgent
      )
    } catch (error) {
      console.error('Failed to monitor session:', error)
      throw error
    } finally {
      setMonitoring(false)
    }
  }, [])

  return {
    monitorSession,
    monitoring
  }
}

/**
 * 综合认证监控器
 */
export function useAuthMonitoring() {
  const statistics = useAuthStatistics()
  const eventRecorder = useAuthEventRecorder()
  const loginMonitor = useLoginMonitor()
  const tokenMonitor = useTokenMonitor()
  const sessionMonitor = useSessionMonitor()

  return {
    statistics,
    eventRecorder,
    loginMonitor,
    tokenMonitor,
    sessionMonitor
  }
}

/**
 * 实时认证监控
 */
export function useRealtimeAuthMonitoring() {
  const [events, setEvents] = useState<Array<{
    id: string
    type: AuthEventType
    timestamp: Date
    userId?: string
    success: boolean
    metadata?: Record<string, unknown>
  }>>([])

  const addEvent = useCallback((event: {
    type: AuthEventType
    userId?: string
    success: boolean
    metadata?: Record<string, unknown>
  }) => {
    const newEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    }

    setEvents(prev => [newEvent, ...prev.slice(0, 99)]) // 保留最近100个事件
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return {
    events,
    addEvent,
    clearEvents
  }
}

/**
 * 认证性能监控
 */
export function useAuthPerformanceMonitoring() {
  const [metrics, setMetrics] = useState<{
    responseTime: number[]
    throughput: number[]
    errorRate: number[]
    timestamp: Date[]
  }>({
    responseTime: [],
    throughput: [],
    errorRate: [],
    timestamp: []
  })

  const addMetric = useCallback((
    responseTime: number,
    throughput: number,
    errorRate: number
  ) => {
    const timestamp = new Date()
    
    setMetrics(prev => ({
      responseTime: [...prev.responseTime, responseTime].slice(-50),
      throughput: [...prev.throughput, throughput].slice(-50),
      errorRate: [...prev.errorRate, errorRate].slice(-50),
      timestamp: [...prev.timestamp, timestamp].slice(-50)
    }))
  }, [])

  const clearMetrics = useCallback(() => {
    setMetrics({
      responseTime: [],
      throughput: [],
      errorRate: [],
      timestamp: []
    })
  }, [])

  return {
    metrics,
    addMetric,
    clearMetrics
  }
}

/**
 * 认证安全监控
 */
export function useAuthSecurityMonitoring() {
  const [alerts, setAlerts] = useState<Array<{
    id: string
    type: 'suspicious_login' | 'brute_force' | 'token_abuse' | 'account_compromise'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    timestamp: Date
    metadata?: Record<string, unknown>
  }>>([])

  const addAlert = useCallback((alert: {
    type: 'suspicious_login' | 'brute_force' | 'token_abuse' | 'account_compromise'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    metadata?: Record<string, unknown>
  }) => {
    const newAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alert
    }

    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]) // 保留最近50个警报
  }, [])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  return {
    alerts,
    addAlert,
    clearAlerts,
    removeAlert
  }
}