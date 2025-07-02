/**
 * Console 通用 Hooks
 * 
 * 提供 Console 模块的通用功能和状态管理
 */

'use client'

// 临时使用 stub 实现，避免 tRPC 依赖问题
// TODO: 当 tRPC 集成完成后，切换回真实实现
export * from './useConsole-stubs'

// 真实实现（临时注释掉）
//
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { useCallback, useMemo } from 'react'
// import { trpc } from '@linch-kit/trpc/client'
// import { useConsoleTranslation } from '../i18n'
// import { toast } from '@linch-kit/ui'
// // 查询键
// export const consoleKeys = {
//   dashboard: ['console', 'dashboard'] as const,
//   stats: ['console', 'stats'] as const,
//   monitoring: ['console', 'monitoring'] as const,
//   notifications: ['console', 'notifications'] as const,
//   auditLogs: ['console', 'auditLogs'] as const
// }
// 
// /**
//  * 获取仪表板数据
//  */
// export function useDashboard() {
//   return useQuery({
//     queryKey: consoleKeys.dashboard,
//     queryFn: () => trpc.console.dashboard.overview.query(),
//     staleTime: 5 * 60 * 1000, // 5分钟
//     refetchInterval: 2 * 60 * 1000 // 2分钟自动刷新
//   })
// }
// 
// /**
//  * 获取系统统计
//  */
// export function useSystemStats() {
//   return useQuery({
//     queryKey: consoleKeys.stats,
//     queryFn: () => trpc.console.system.getStats.query(),
//     staleTime: 5 * 60 * 1000,
//     refetchInterval: 5 * 60 * 1000
//   })
// }
// 
// /**
//  * 获取系统监控数据
//  */
// export function useSystemMonitoring(
//   timeRange: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'
// ) {
//   return useQuery({
//     queryKey: [...consoleKeys.monitoring, timeRange],
//     queryFn: () => trpc.console.monitoring.getMetrics.query({ timeRange }),
//     staleTime: 2 * 60 * 1000, // 2分钟
//     refetchInterval: 30 * 1000 // 30秒自动刷新
//   })
// }
// 
// /**
//  * 获取用户通知
//  */
// export function useNotifications(userId?: string) {
//   return useQuery({
//     queryKey: [...consoleKeys.notifications, userId],
//     queryFn: () => trpc.console.notification.list.query({ userId }),
//     enabled: !!userId,
//     staleTime: 1 * 60 * 1000, // 1分钟
//     refetchInterval: 30 * 1000 // 30秒自动刷新
//   })
// }
// 
// /**
//  * 获取审计日志
//  */
// export function useAuditLogs(filters?: {
//   action?: string
//   resource?: string
//   userId?: string
//   tenantId?: string
//   startDate?: Date
//   endDate?: Date
//   page?: number
//   pageSize?: number
// }) {
//   return useQuery({
//     queryKey: [...consoleKeys.auditLogs, filters],
//     queryFn: () => trpc.console.audit.list.query(filters),
//     staleTime: 5 * 60 * 1000
//   })
// }
// 
// /**
//  * 标记通知为已读
//  */
// export function useMarkNotificationRead() {
//   const queryClient = useQueryClient()
//   const t = useConsoleTranslation()
//   
//   return useMutation({
//     mutationFn: (notificationId: string) =>
//       trpc.console.notification.markRead.mutate({ notificationId }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: consoleKeys.notifications })
//     },
//     onError: (error: Record<string, unknown>) => {
//       toast.error(t('error.notification.markReadFailed'))
//     }
//   })
// }
// 
// /**
//  * 创建系统通知
//  */
// export function useCreateNotification() {
//   const queryClient = useQueryClient()
//   const t = useConsoleTranslation()
//   
//   return useMutation({
//     mutationFn: (notification: {
//       userId: string
//       type: string
//       title: string
//       message: string
//       actionUrl?: string
//       actionLabel?: string
//     }) =>
//       trpc.console.notification.create.mutate(notification),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: consoleKeys.notifications })
//       toast.success(t('success.notification.created'))
//     },
//     onError: (error: Record<string, unknown>) => {
//       toast.error(t('error.notification.createFailed'))
//     }
//   })
// }
// 
// /**
//  * 权限检查
//  */
// export function usePermissions() {
//   const { data: user } = useQuery({
//     queryKey: ['user', 'permissions'],
//     queryFn: () => trpc.auth.user.getCurrentPermissions.query(),
//     staleTime: 10 * 60 * 1000 // 10分钟
//   })
//   
//   const hasPermission = useCallback((permission: string) => {
//     return user?.permissions?.includes(permission) || false
//   }, [user?.permissions])
//   
//   const hasAnyPermission = useCallback((permissions: string[]) => {
//     return permissions.some(permission => hasPermission(permission))
//   }, [hasPermission])
//   
//   const hasAllPermissions = useCallback((permissions: string[]) => {
//     return permissions.every(permission => hasPermission(permission))
//   }, [hasPermission])
//   
//   return {
//     permissions: user?.permissions || [],
//     hasPermission,
//     hasAnyPermission,
//     hasAllPermissions,
//     isAdmin: hasPermission('console:admin'),
//     isSystemAdmin: hasPermission('system:admin')
//   }
// }
// 
// /**
//  * 当前租户信息
//  */
// export function useCurrentTenant() {
//   return useQuery({
//     queryKey: ['user', 'currentTenant'],
//     queryFn: () => trpc.auth.user.getCurrentTenant.query(),
//     staleTime: 5 * 60 * 1000
//   })
// }
// 
// /**
//  * 切换租户
//  */
// export function useSwitchTenant() {
//   const queryClient = useQueryClient()
//   const t = useConsoleTranslation()
//   
//   return useMutation({
//     mutationFn: (tenantId: string) =>
//       trpc.auth.user.switchTenant.mutate({ tenantId }),
//     onSuccess: () => {
//       // 清除所有缓存，重新加载数据
//       queryClient.clear()
//       toast.success(t('success.tenant.switched'))
//     },
//     onError: (error: Record<string, unknown>) => {
//       toast.error(t('error.tenant.switchFailed'))
//     }
//   })
// }
// 
// /**
//  * Console 配置管理
//  */
// export function useConsoleConfig() {
//   const { data: config } = useQuery({
//     queryKey: ['console', 'config'],
//     queryFn: () => trpc.console.config.get.query(),
//     staleTime: 30 * 60 * 1000 // 30分钟
//   })
//   
//   const updateConfig = useMutation({
//     mutationFn: (updates: Record<string, any>) =>
//       trpc.console.config.update.mutate(updates),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['console', 'config'] })
//     }
//   })
//   
//   return {
//     config: config || {},
//     updateConfig: updateConfig.mutate,
//     isUpdating: updateConfig.isPending
//   }
// }
// 
// /**
//  * 系统健康检查
//  */
// export function useSystemHealth() {
//   return useQuery({
//     queryKey: ['console', 'health'],
//     queryFn: () => trpc.console.system.healthCheck.query(),
//     staleTime: 1 * 60 * 1000, // 1分钟
//     refetchInterval: 30 * 1000, // 30秒自动刷新
//     retry: 3
//   })
// }
// 
// /**
//  * 实时数据订阅（WebSocket）
//  */
// export function useRealtimeData(subscriptions: string[] = []) {
//   const queryClient = useQueryClient()
//   
//   // 这里应该集成 WebSocket 订阅
//   // 当收到实时数据时，更新相应的查询缓存
//   
//   const subscribe = useCallback((subscription: string) => {
//     // WebSocket 订阅逻辑
//     console.log(`Subscribing to ${subscription}`)
//   }, [])
//   
//   const unsubscribe = useCallback((subscription: string) => {
//     // WebSocket 取消订阅逻辑
//     console.log(`Unsubscribing from ${subscription}`)
//   }, [])
//   
//   return {
//     subscribe,
//     unsubscribe
//   }
// }
// 
// /**
//  * 导出数据
//  */
// export function useExportData() {
//   const t = useConsoleTranslation()
//   
//   return useMutation({
//     mutationFn: ({ 
//       type, 
//       format, 
//       filters 
//     }: {
//       type: 'tenants' | 'users' | 'plugins' | 'logs'
//       format: 'csv' | 'xlsx' | 'json'
//       filters?: Record<string, any>
//     }) =>
//       trpc.console.export.data.mutate({ type, format, filters }),
//     onSuccess: (data) => {
//       // 下载文件
//       const blob = new Blob([data.content], { type: data.mimeType })
//       const url = URL.createObjectURL(blob)
//       const a = document.createElement('a')
//       a.href = url
//       a.download = data.filename
//       a.click()
//       URL.revokeObjectURL(url)
//       
//       toast.success(t('success.export.completed'))
//     },
//     onError: (error: Record<string, unknown>) => {
//       toast.error(t('error.export.failed'))
//     }
//   })
// }
// 
// /**
//  * Console 总体状态
//  */
// export function useConsoleStatus() {
//   const dashboard = useDashboard()
//   const systemStats = useSystemStats()
//   const systemHealth = useSystemHealth()
//   const permissions = usePermissions()
//   const currentTenant = useCurrentTenant()
//   
//   const isLoading = useMemo(() => {
//     return dashboard.isLoading || 
//            systemStats.isLoading || 
//            systemHealth.isLoading
//   }, [dashboard.isLoading, systemStats.isLoading, systemHealth.isLoading])
//   
//   const hasErrors = useMemo(() => {
//     return dashboard.isError || 
//            systemStats.isError || 
//            systemHealth.isError
//   }, [dashboard.isError, systemStats.isError, systemHealth.isError])
//   
//   return {
//     isLoading,
//     hasErrors,
//     isReady: !isLoading && !hasErrors,
//     permissions: permissions.permissions,
//     currentTenant: currentTenant.data,
//     systemHealth: systemHealth.data
//   }
// }
