/**
 * Console Hooks - Stub Implementation
 *
 * Temporary stub implementations to make Console work without tRPC/backend
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

// Mock toast function
const toast = {
  success: (message: string) => console.log('✅ Success:', message),
  error: (message: string) => console.error('❌ Error:', message),
  info: (message: string) => console.info('ℹ️ Info:', message),
  warning: (message: string) => console.warn('⚠️ Warning:', message),
}

// Mock data generators
function generateMockDashboard() {
  return {
    stats: {
      totalTenants: Math.floor(Math.random() * 50) + 10,
      totalUsers: Math.floor(Math.random() * 1000) + 100,
      activePlugins: Math.floor(Math.random() * 20) + 5,
      tenantGrowth: `+${Math.floor(Math.random() * 20)}%`,
      userGrowth: `+${Math.floor(Math.random() * 30)}%`,
      pluginGrowth: `+${Math.floor(Math.random() * 10)}`,
    },
    recentActivities: [
      {
        description: '新用户注册',
        timestamp: '2分钟前',
        type: 'user_register',
      },
      {
        description: '插件更新完成',
        timestamp: '5分钟前',
        type: 'plugin_update',
      },
      {
        description: '租户配置变更',
        timestamp: '10分钟前',
        type: 'tenant_config',
      },
    ],
    topTenants: [
      { name: '示例公司A', status: 'active', users: 45, plugins: 8 },
      { name: '示例公司B', status: 'active', users: 32, plugins: 6 },
      { name: '示例公司C', status: 'suspended', users: 18, plugins: 3 },
    ],
    pluginStatus: [
      { name: '用户管理插件', version: '1.2.0', status: 'active' },
      { name: '报告生成器', version: '2.1.1', status: 'active' },
      { name: '数据同步工具', version: '1.0.5', status: 'inactive' },
    ],
    recentAlerts: [
      {
        title: 'CPU使用率告警',
        description: 'CPU使用率超过80%阈值',
        timestamp: '30分钟前',
        severity: 'warning',
      },
    ],
  }
}

function generateMockSystemStats() {
  return {
    cpu: {
      usage: Math.floor(Math.random() * 100),
      trend: '+2%',
    },
    memory: {
      usage: Math.floor(Math.random() * 90) + 10,
      trend: '-1%',
    },
    disk: {
      usage: Math.floor(Math.random() * 80) + 20,
      trend: '+3%',
    },
    network: {
      inbound: '50 MB/s',
      outbound: '30 MB/s',
    },
  }
}

function generateMockSystemHealth() {
  const statuses = ['healthy', 'warning', 'error']
  const status = statuses[Math.floor(Math.random() * statuses.length)]

  return {
    status,
    lastCheck: '刚刚',
    issues:
      status === 'healthy'
        ? []
        : [{ message: '数据库连接延迟较高' }, { message: '部分服务响应缓慢' }],
  }
}

// 查询键
export const consoleKeys = {
  dashboard: ['console', 'dashboard'] as const,
  stats: ['console', 'stats'] as const,
  monitoring: ['console', 'monitoring'] as const,
  notifications: ['console', 'notifications'] as const,
  auditLogs: ['console', 'auditLogs'] as const,
}

/**
 * 获取仪表板数据 (Stub)
 */
export function useDashboard() {
  return useQuery({
    queryKey: consoleKeys.dashboard,
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800)) // 模拟网络延迟
      return generateMockDashboard()
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })
}

/**
 * 获取系统统计 (Stub)
 */
export function useSystemStats() {
  return useQuery({
    queryKey: consoleKeys.stats,
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600))
      return generateMockSystemStats()
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * 获取系统监控数据 (Stub)
 */
export function useSystemMonitoring(timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h') {
  return useQuery({
    queryKey: [...consoleKeys.monitoring, timeRange],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        timeRange,
        metrics: generateMockSystemStats(),
        charts: {
          cpu: Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            value: Math.floor(Math.random() * 100),
          })),
          memory: Array.from({ length: 24 }, (_, i) => ({
            time: `${i}:00`,
            value: Math.floor(Math.random() * 90) + 10,
          })),
        },
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000,
  })
}

/**
 * 获取系统健康检查 (Stub)
 */
export function useSystemHealth() {
  return useQuery({
    queryKey: ['console', 'health'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return generateMockSystemHealth()
    },
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000,
    retry: 3,
  })
}

/**
 * 获取用户通知 (Stub)
 */
export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: [...consoleKeys.notifications, userId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
      return [
        {
          id: '1',
          type: 'info',
          title: '系统维护通知',
          message: '系统将在今晚进行例行维护',
          read: false,
          createdAt: new Date(),
        },
        {
          id: '2',
          type: 'warning',
          title: '存储空间告警',
          message: '租户存储空间使用率超过90%',
          read: true,
          createdAt: new Date(),
        },
      ]
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000,
  })
}

/**
 * 获取审计日志 (Stub)
 */
export function useAuditLogs(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...consoleKeys.auditLogs, filters],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 600))
      return {
        data: [
          {
            id: '1',
            action: 'user.login',
            resource: 'User',
            userId: 'user123',
            tenantId: 'tenant1',
            timestamp: new Date(),
            details: { ip: '192.168.1.1' },
          },
          {
            id: '2',
            action: 'tenant.create',
            resource: 'Tenant',
            userId: 'admin',
            tenantId: 'tenant2',
            timestamp: new Date(),
            details: { name: 'New Tenant' },
          },
        ],
        total: 2,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 10,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 权限检查 (Stub)
 */
export function usePermissions() {
  const mockPermissions = [
    'console:access',
    'console:admin',
    'tenant:create',
    'tenant:read',
    'tenant:update',
    'tenant:delete',
    'user:manage',
    'plugin:manage',
    'monitoring:view',
    'system:admin',
  ]

  const hasPermission = useCallback((permission: string) => {
    return mockPermissions.includes(permission)
  }, [])

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      return permissions.some(permission => hasPermission(permission))
    },
    [hasPermission]
  )

  const hasAllPermissions = useCallback(
    (permissions: string[]) => {
      return permissions.every(permission => hasPermission(permission))
    },
    [hasPermission]
  )

  return {
    permissions: mockPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: hasPermission('console:admin'),
    isSystemAdmin: hasPermission('system:admin'),
  }
}

/**
 * 当前租户信息 (Stub)
 */
export function useCurrentTenant() {
  return useQuery({
    queryKey: ['user', 'currentTenant'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        id: 'tenant1',
        name: '示例租户',
        slug: 'demo-tenant',
        domain: 'demo.example.com',
        status: 'active',
        plan: 'pro',
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Mutation stubs that just show success messages
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return { id: notificationId, read: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consoleKeys.notifications })
      toast.success('通知已标记为已读')
    },
    onError: () => {
      toast.error('标记通知失败')
    },
  })
}

export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notification: Record<string, unknown>) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { id: Date.now().toString(), ...notification }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consoleKeys.notifications })
      toast.success('通知创建成功')
    },
    onError: () => {
      toast.error('创建通知失败')
    },
  })
}

export function useSwitchTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenantId: string) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return { tenantId }
    },
    onSuccess: () => {
      queryClient.clear()
      toast.success('租户切换成功')
    },
    onError: () => {
      toast.error('租户切换失败')
    },
  })
}

export function useConsoleConfig() {
  const queryClient = useQueryClient()

  const { data: config } = useQuery({
    queryKey: ['console', 'config'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
      return {
        theme: { primary: '#3b82f6', darkMode: false },
        features: ['dashboard', 'tenants', 'users', 'plugins', 'monitoring'],
        notifications: { email: true, inApp: true },
        security: { sessionTimeout: 24 * 60 * 60 * 1000 },
      }
    },
    staleTime: 30 * 60 * 1000,
  })

  const updateConfig = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      await new Promise(resolve => setTimeout(resolve, 600))
      return { ...config, ...updates }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['console', 'config'] })
      toast.success('配置更新成功')
    },
    onError: () => {
      toast.error('配置更新失败')
    },
  })

  return {
    config: config || {},
    updateConfig: updateConfig.mutate,
    isUpdating: updateConfig.isPending,
  }
}

export function useExportData() {
  return useMutation({
    mutationFn: async ({ type, format, filters }: Record<string, unknown>) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const mockData = JSON.stringify({ type, format, filters, data: [] })
      return {
        content: mockData,
        filename: `export_${type}_${Date.now()}.${format}`,
        mimeType: format === 'json' ? 'application/json' : 'text/csv',
      }
    },
    onSuccess: data => {
      // Mock file download
      const blob = new Blob([data.content], { type: data.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      a.click()
      URL.revokeObjectURL(url)

      toast.success('数据导出成功')
    },
    onError: () => {
      toast.error('数据导出失败')
    },
  })
}

export function useRealtimeData(_subscriptions: string[] = []) {
  const subscribe = useCallback((subscription: string) => {
    console.log(`订阅实时数据: ${subscription}`)
  }, [])

  const unsubscribe = useCallback((subscription: string) => {
    console.log(`取消订阅: ${subscription}`)
  }, [])

  return {
    subscribe,
    unsubscribe,
  }
}

export function useConsoleStatus() {
  const dashboard = useDashboard()
  const systemStats = useSystemStats()
  const systemHealth = useSystemHealth()
  const permissions = usePermissions()
  const currentTenant = useCurrentTenant()

  const isLoading = useMemo(() => {
    return dashboard.isLoading || systemStats.isLoading || systemHealth.isLoading
  }, [dashboard.isLoading, systemStats.isLoading, systemHealth.isLoading])

  const hasErrors = useMemo(() => {
    return dashboard.isError || systemStats.isError || systemHealth.isError
  }, [dashboard.isError, systemStats.isError, systemHealth.isError])

  return {
    isLoading,
    hasErrors,
    isReady: !isLoading && !hasErrors,
    permissions: permissions.permissions,
    currentTenant: currentTenant.data,
    systemHealth: systemHealth.data,
  }
}
