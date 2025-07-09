/**
 * Starter 集成 React Hook
 * @module hooks/useStarterIntegration
 */

'use client'

import { useEffect, useState, useCallback } from 'react'

import { starterIntegrationManager } from '../core/starter-integration'
import type { 
  StarterIntegrationState, 
  ExtensionStateSummary,
  StarterIntegrationConfig
} from '../core/starter-integration'
import type { DynamicRouteConfig } from '../core/enhanced-app-registry'
import type { ExtensionMessage } from '../core/extension-communication'

/**
 * Hook 状态
 */
interface UseStarterIntegrationState {
  /** 集成状态 */
  integrationState: StarterIntegrationState
  /** Extension 状态摘要 */
  extensions: ExtensionStateSummary[]
  /** 动态路由 */
  routes: DynamicRouteConfig[]
  /** 菜单树 */
  menu: any[]
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error: string | null
  /** 是否已初始化 */
  initialized: boolean
}

/**
 * Hook 操作
 */
interface UseStarterIntegrationActions {
  /** 加载 Extension */
  loadExtension: (name: string) => Promise<void>
  /** 卸载 Extension */
  unloadExtension: (name: string) => Promise<void>
  /** 重载 Extension */
  reloadExtension: (name: string) => Promise<void>
  /** 刷新状态 */
  refresh: () => void
  /** 更新配置 */
  updateConfig: (config: Partial<StarterIntegrationConfig>) => void
  /** 获取状态报告 */
  getStatusReport: () => any
}

/**
 * Starter 集成 Hook
 * 
 * 提供：
 * - 集成状态管理
 * - Extension 操作
 * - 实时状态更新
 * - 错误处理
 */
export function useStarterIntegration(): UseStarterIntegrationState & UseStarterIntegrationActions {
  const [state, setState] = useState<UseStarterIntegrationState>({
    integrationState: starterIntegrationManager.getState(),
    extensions: [],
    routes: [],
    menu: [],
    loading: true,
    error: null,
    initialized: false
  })

  // 刷新状态
  const refresh = useCallback(() => {
    try {
      setState(prevState => ({
        ...prevState,
        integrationState: starterIntegrationManager.getState(),
        extensions: starterIntegrationManager.getExtensionStateSummary(),
        routes: starterIntegrationManager.getAllRoutes(),
        menu: starterIntegrationManager.getMenuTree(),
        loading: false,
        error: null
      }))
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [])

  // 加载 Extension
  const loadExtension = useCallback(async (name: string) => {
    try {
      setState(prevState => ({
        ...prevState,
        loading: true,
        error: null
      }))
      
      await starterIntegrationManager.loadExtension(name)
      refresh()
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load extension'
      }))
    }
  }, [refresh])

  // 卸载 Extension
  const unloadExtension = useCallback(async (name: string) => {
    try {
      setState(prevState => ({
        ...prevState,
        loading: true,
        error: null
      }))
      
      await starterIntegrationManager.unloadExtension(name)
      refresh()
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to unload extension'
      }))
    }
  }, [refresh])

  // 重载 Extension
  const reloadExtension = useCallback(async (name: string) => {
    try {
      setState(prevState => ({
        ...prevState,
        loading: true,
        error: null
      }))
      
      await starterIntegrationManager.reloadExtension(name)
      refresh()
    } catch (error) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to reload extension'
      }))
    }
  }, [refresh])

  // 更新配置
  const updateConfig = useCallback((config: Partial<StarterIntegrationConfig>) => {
    starterIntegrationManager.updateConfig(config)
    refresh()
  }, [refresh])

  // 获取状态报告
  const getStatusReport = useCallback(() => {
    return starterIntegrationManager.getStatusReport()
  }, [])

  // 设置事件监听器
  useEffect(() => {
    const handleInitialized = () => {
      setState(prevState => ({
        ...prevState,
        initialized: true
      }))
      refresh()
    }

    const handleStateUpdated = () => {
      refresh()
    }

    const handleExtensionLoaded = () => {
      refresh()
    }

    const handleExtensionUnloaded = () => {
      refresh()
    }

    const handleRoutesUpdated = () => {
      refresh()
    }

    const handleError = (event: { error: Error }) => {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: event.error.message
      }))
    }

    // 添加事件监听器
    starterIntegrationManager.on('initialized', handleInitialized)
    starterIntegrationManager.on('stateUpdated', handleStateUpdated)
    starterIntegrationManager.on('extensionLoaded', handleExtensionLoaded)
    starterIntegrationManager.on('extensionUnloaded', handleExtensionUnloaded)
    starterIntegrationManager.on('routesUpdated', handleRoutesUpdated)
    starterIntegrationManager.on('initializationFailed', handleError)
    starterIntegrationManager.on('extensionLoadFailed', handleError)
    starterIntegrationManager.on('extensionUnloadFailed', handleError)

    // 初始化状态
    if (starterIntegrationManager.getState().initialized) {
      setState(prevState => ({
        ...prevState,
        initialized: true
      }))
      refresh()
    }

    return () => {
      // 清理事件监听器
      starterIntegrationManager.off('initialized', handleInitialized)
      starterIntegrationManager.off('stateUpdated', handleStateUpdated)
      starterIntegrationManager.off('extensionLoaded', handleExtensionLoaded)
      starterIntegrationManager.off('extensionUnloaded', handleExtensionUnloaded)
      starterIntegrationManager.off('routesUpdated', handleRoutesUpdated)
      starterIntegrationManager.off('initializationFailed', handleError)
      starterIntegrationManager.off('extensionLoadFailed', handleError)
      starterIntegrationManager.off('extensionUnloadFailed', handleError)
    }
  }, [refresh])

  return {
    ...state,
    loadExtension,
    unloadExtension,
    reloadExtension,
    refresh,
    updateConfig,
    getStatusReport
  }
}

/**
 * Extension 消息监听 Hook
 */
export function useExtensionMessages(
  extensionName?: string,
  subject?: string
): {
  messages: ExtensionMessage[]
  latestMessage: ExtensionMessage | null
  messageCount: number
} {
  const [messages, setMessages] = useState<ExtensionMessage[]>([])
  const [latestMessage, setLatestMessage] = useState<ExtensionMessage | null>(null)

  useEffect(() => {
    const handleMessage = (message: ExtensionMessage) => {
      // 过滤消息
      if (extensionName && message.from !== extensionName && message.to !== extensionName) {
        return
      }
      
      if (subject && message.subject !== subject) {
        return
      }

      setMessages(prev => [...prev.slice(-99), message]) // 保留最近100条消息
      setLatestMessage(message)
    }

    // 监听消息事件
    starterIntegrationManager.on('extensionMessage', handleMessage)

    return () => {
      starterIntegrationManager.off('extensionMessage', handleMessage)
    }
  }, [extensionName, subject])

  return {
    messages,
    latestMessage,
    messageCount: messages.length
  }
}

/**
 * Extension 生命周期监听 Hook
 */
export function useExtensionLifecycle(extensionName?: string): {
  currentPhase: string | null
  phaseHistory: any[]
  isLoading: boolean
  hasError: boolean
} {
  const [lifecycleState, setLifecycleState] = useState({
    currentPhase: null as string | null,
    phaseHistory: [] as any[],
    isLoading: false,
    hasError: false
  })

  useEffect(() => {
    const handleLifecycleEvent = (event: any) => {
      if (extensionName && event.extensionName !== extensionName) {
        return
      }

      setLifecycleState(prev => ({
        ...prev,
        currentPhase: event.phase,
        phaseHistory: [...prev.phaseHistory.slice(-19), event], // 保留最近20个事件
        isLoading: event.phase === 'loading',
        hasError: event.phase === 'failed'
      }))
    }

    // 监听生命周期事件
    starterIntegrationManager.on('extensionLifecycleEvent', handleLifecycleEvent)

    return () => {
      starterIntegrationManager.off('extensionLifecycleEvent', handleLifecycleEvent)
    }
  }, [extensionName])

  return lifecycleState
}

/**
 * 动态路由 Hook
 */
export function useDynamicRoutes(): {
  routes: DynamicRouteConfig[]
  routeCount: number
  getRoutesByExtension: (extensionName: string) => DynamicRouteConfig[]
} {
  const { routes } = useStarterIntegration()

  const getRoutesByExtension = useCallback((extensionName: string) => {
    return routes.filter(route => 
      route.metadata?.extensionName === extensionName
    )
  }, [routes])

  return {
    routes,
    routeCount: routes.length,
    getRoutesByExtension
  }
}

/**
 * Extension 状态 Hook
 */
export function useExtensionState(extensionName: string): {
  extension: ExtensionStateSummary | null
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
  error: string | null
} {
  const { extensions } = useStarterIntegration()

  const extension = extensions.find(ext => ext.name === extensionName) || null

  return {
    extension,
    isLoaded: extension?.loadStatus === 'loaded',
    isLoading: extension?.loadStatus === 'loading',
    hasError: extension?.loadStatus === 'failed',
    error: extension?.error || null
  }
}