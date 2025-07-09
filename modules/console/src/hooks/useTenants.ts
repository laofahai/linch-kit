/**
 * 租户管理 Hooks
 *
 * 使用 @linch-kit/trpc 和 React Query 提供租户数据管理
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@linch-kit/trpc/client'
import { toast } from 'sonner'

import { useConsoleTranslation } from '../i18n'
import type { TenantInput, TenantUpdate, TenantQuotas } from '../entities'

// 查询键
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...tenantKeys.lists(), filters] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  quotas: (id: string) => [...tenantKeys.detail(id), 'quotas'] as const,
  stats: () => [...tenantKeys.all, 'stats'] as const,
}

/**
 * 获取租户列表
 */
export function useTenants(filters?: {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const t = useConsoleTranslation()

  return useQuery({
    queryKey: tenantKeys.list(filters),
    queryFn: () => trpc.console.tenant.list.query(filters),
    staleTime: 5 * 60 * 1000, // 5分钟
    onError: (_error: Record<string, unknown>) => {
      toast.error(t('error.tenant.loadFailed'))
    },
  })
}

/**
 * 获取租户详情
 */
export function useTenant(id: string) {
  const t = useConsoleTranslation()

  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => trpc.console.tenant.get.query({ id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    onError: (_error: Record<string, unknown>) => {
      toast.error(t('error.tenant.notFound'))
    },
  })
}

/**
 * 获取租户配额
 */
export function useTenantQuotas(tenantId: string) {
  const t = useConsoleTranslation()

  return useQuery({
    queryKey: tenantKeys.quotas(tenantId),
    queryFn: () => trpc.console.tenant.getQuotas.query({ tenantId }),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2分钟
    onError: (_error: Record<string, unknown>) => {
      toast.error(t('error.tenant.quotasLoadFailed'))
    },
  })
}

/**
 * 获取租户统计
 */
export function useTenantStats() {
  return useQuery({
    queryKey: tenantKeys.stats(),
    queryFn: () => trpc.console.tenant.getStats.query(),
    staleTime: 10 * 60 * 1000, // 10分钟
    refetchInterval: 5 * 60 * 1000, // 5分钟自动刷新
  })
}

/**
 * 创建租户
 */
export function useCreateTenant() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: (input: TenantInput) => trpc.console.tenant.create.mutate(input),
    onSuccess: _data => {
      // 更新相关查询
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tenantKeys.stats() })

      toast.success(t('success.tenant.created'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.tenant.createFailed'))
    },
  })
}

/**
 * 更新租户
 */
export function useUpdateTenant() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TenantUpdate }) =>
      trpc.console.tenant.update.mutate({ id, ...input }),
    onSuccess: (data, variables) => {
      // 更新相关查询
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) })

      toast.success(t('success.tenant.updated'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.tenant.updateFailed'))
    },
  })
}

/**
 * 删除租户
 */
export function useDeleteTenant() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: (id: string) => trpc.console.tenant.delete.mutate({ id }),
    onSuccess: (data, variables) => {
      // 更新相关查询
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tenantKeys.stats() })
      queryClient.removeQueries({ queryKey: tenantKeys.detail(variables) })

      toast.success(t('success.tenant.deleted'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.tenant.deleteFailed'))
    },
  })
}

/**
 * 暂停租户
 */
export function useSuspendTenant() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      trpc.console.tenant.suspend.mutate({ id, reason }),
    onSuccess: (data, variables) => {
      // 更新相关查询
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.stats() })

      toast.success(t('success.tenant.suspended'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.tenant.suspendFailed'))
    },
  })
}

/**
 * 激活租户
 */
export function useActivateTenant() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: (id: string) => trpc.console.tenant.activate.mutate({ id }),
    onSuccess: (data, variables) => {
      // 更新相关查询
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.stats() })

      toast.success(t('success.tenant.activated'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.tenant.activateFailed'))
    },
  })
}

/**
 * 更新租户配额
 */
export function useUpdateTenantQuotas() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({ tenantId, quotas }: { tenantId: string; quotas: Partial<TenantQuotas> }) =>
      trpc.console.tenant.updateQuotas.mutate({ tenantId, quotas }),
    onSuccess: (data, variables) => {
      // 更新相关查询
      queryClient.invalidateQueries({ queryKey: tenantKeys.quotas(variables.tenantId) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.tenantId) })

      toast.success(t('success.tenant.quotasUpdated'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.tenant.quotasUpdateFailed'))
    },
  })
}

/**
 * 批量操作租户
 */
export function useBatchTenantOperation() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({
      operation,
      tenantIds,
      data,
    }: {
      operation: 'suspend' | 'activate' | 'delete'
      tenantIds: string[]
      data?: Record<string, unknown>
    }) => {
      switch (operation) {
        case 'suspend':
          return trpc.console.tenant.batchSuspend.mutate({ tenantIds, reason: data?.reason })
        case 'activate':
          return trpc.console.tenant.batchActivate.mutate({ tenantIds })
        case 'delete':
          return trpc.console.tenant.batchDelete.mutate({ tenantIds })
        default:
          throw new Error(`Unknown operation: ${operation}`)
      }
    },
    onSuccess: (data, variables) => {
      // 更新所有相关查询
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tenantKeys.stats() })

      // 移除或更新详情查询
      variables.tenantIds.forEach(id => {
        if (variables.operation === 'delete') {
          queryClient.removeQueries({ queryKey: tenantKeys.detail(id) })
        } else {
          queryClient.invalidateQueries({ queryKey: tenantKeys.detail(id) })
        }
      })

      toast.success(t(`success.tenant.batch${variables.operation}`))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.tenant.batchOperationFailed'))
    },
  })
}

/**
 * 自定义 Hook - 租户操作
 */
export function useTenantOperations() {
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()
  const deleteTenant = useDeleteTenant()
  const suspendTenant = useSuspendTenant()
  const activateTenant = useActivateTenant()
  const updateQuotas = useUpdateTenantQuotas()
  const batchOperation = useBatchTenantOperation()

  return {
    create: createTenant,
    update: updateTenant,
    delete: deleteTenant,
    suspend: suspendTenant,
    activate: activateTenant,
    updateQuotas,
    batchOperation,

    // 便捷方法
    isLoading:
      createTenant.isPending ||
      updateTenant.isPending ||
      deleteTenant.isPending ||
      suspendTenant.isPending ||
      activateTenant.isPending ||
      updateQuotas.isPending ||
      batchOperation.isPending,
  }
}
