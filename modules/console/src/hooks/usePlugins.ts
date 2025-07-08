/**
 * 插件管理 Hooks
 *
 * 提供插件市场和插件管理的数据操作
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@linch-kit/trpc/client'
import { toast } from '@linch-kit/ui'

import { useConsoleTranslation } from '../i18n'
import type { PluginInput, TenantPlugin } from '../entities'

// 查询键
export const pluginKeys = {
  all: ['plugins'] as const,
  marketplace: () => [...pluginKeys.all, 'marketplace'] as const,
  marketplaceList: (filters?: Record<string, unknown>) =>
    [...pluginKeys.marketplace(), filters] as const,
  installed: () => [...pluginKeys.all, 'installed'] as const,
  installedList: (tenantId: string) => [...pluginKeys.installed(), tenantId] as const,
  details: () => [...pluginKeys.all, 'detail'] as const,
  detail: (id: string) => [...pluginKeys.details(), id] as const,
  stats: () => [...pluginKeys.all, 'stats'] as const,
}

/**
 * 获取插件市场列表
 */
export function useMarketplacePlugins(filters?: {
  category?: string
  search?: string
  isFeatured?: boolean
  isOfficial?: boolean
  page?: number
  pageSize?: number
}) {
  const t = useConsoleTranslation()

  return useQuery({
    queryKey: pluginKeys.marketplaceList(filters),
    queryFn: () => trpc.console.plugin.marketplace.query(filters),
    staleTime: 10 * 60 * 1000, // 10分钟
    onError: (_error: Record<string, unknown>) => {
      toast.error(t('error.plugin.loadFailed'))
    },
  })
}

/**
 * 获取插件详情
 */
export function usePlugin(id: string) {
  const t = useConsoleTranslation()

  return useQuery({
    queryKey: pluginKeys.detail(id),
    queryFn: () => trpc.console.plugin.get.query({ id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    onError: (_error: Record<string, unknown>) => {
      toast.error(t('error.plugin.notFound'))
    },
  })
}

/**
 * 获取租户已安装插件
 */
export function useInstalledPlugins(tenantId: string) {
  const t = useConsoleTranslation()

  return useQuery({
    queryKey: pluginKeys.installedList(tenantId),
    queryFn: () => trpc.console.plugin.installed.query({ tenantId }),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2分钟
    onError: (_error: Record<string, unknown>) => {
      toast.error(t('error.plugin.installedLoadFailed'))
    },
  })
}

/**
 * 获取插件统计
 */
export function usePluginStats() {
  return useQuery({
    queryKey: pluginKeys.stats(),
    queryFn: () => trpc.console.plugin.getStats.query(),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * 创建插件
 */
export function useCreatePlugin() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: (input: PluginInput) => trpc.console.plugin.create.mutate(input),
    onSuccess: _data => {
      queryClient.invalidateQueries({ queryKey: pluginKeys.marketplace() })
      queryClient.invalidateQueries({ queryKey: pluginKeys.stats() })

      toast.success(t('success.plugin.created'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.plugin.createFailed'))
    },
  })
}

/**
 * 发布插件
 */
export function usePublishPlugin() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: (id: string) => trpc.console.plugin.publish.mutate({ id }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: pluginKeys.marketplace() })
      queryClient.invalidateQueries({ queryKey: pluginKeys.detail(variables) })
      queryClient.invalidateQueries({ queryKey: pluginKeys.stats() })

      toast.success(t('success.plugin.published'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.plugin.publishFailed'))
    },
  })
}

/**
 * 安装插件
 */
export function useInstallPlugin() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({
      tenantId,
      pluginId,
      version,
      config,
    }: {
      tenantId: string
      pluginId: string
      version?: string
      config?: Record<string, unknown>
    }) =>
      trpc.console.plugin.install.mutate({
        tenantId,
        pluginId,
        version,
        config,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: pluginKeys.installedList(variables.tenantId),
      })
      queryClient.invalidateQueries({
        queryKey: pluginKeys.detail(variables.pluginId),
      })

      toast.success(t('success.plugin.installed'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.plugin.installFailed'))
    },
  })
}

/**
 * 卸载插件
 */
export function useUninstallPlugin() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({ tenantId, pluginId }: { tenantId: string; pluginId: string }) =>
      trpc.console.plugin.uninstall.mutate({
        tenantId,
        pluginId,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: pluginKeys.installedList(variables.tenantId),
      })

      toast.success(t('success.plugin.uninstalled'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.plugin.uninstallFailed'))
    },
  })
}

/**
 * 激活插件
 */
export function useActivatePlugin() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({ tenantId, pluginId }: { tenantId: string; pluginId: string }) =>
      trpc.console.plugin.activate.mutate({
        tenantId,
        pluginId,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: pluginKeys.installedList(variables.tenantId),
      })

      toast.success(t('success.plugin.activated'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.plugin.activateFailed'))
    },
  })
}

/**
 * 停用插件
 */
export function useDeactivatePlugin() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({ tenantId, pluginId }: { tenantId: string; pluginId: string }) =>
      trpc.console.plugin.deactivate.mutate({
        tenantId,
        pluginId,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: pluginKeys.installedList(variables.tenantId),
      })

      toast.success(t('success.plugin.deactivated'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.plugin.deactivateFailed'))
    },
  })
}

/**
 * 配置插件
 */
export function useConfigurePlugin() {
  const queryClient = useQueryClient()
  const t = useConsoleTranslation()

  return useMutation({
    mutationFn: ({
      tenantId,
      pluginId,
      config,
    }: {
      tenantId: string
      pluginId: string
      config: Record<string, unknown>
    }) =>
      trpc.console.plugin.configure.mutate({
        tenantId,
        pluginId,
        config,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: pluginKeys.installedList(variables.tenantId),
      })

      toast.success(t('success.plugin.configured'))
    },
    onError: (_error: Record<string, unknown>) => {
      toast.error(error.message || t('error.plugin.configureFailed'))
    },
  })
}

/**
 * 插件操作集合
 */
export function usePluginOperations() {
  const createPlugin = useCreatePlugin()
  const publishPlugin = usePublishPlugin()
  const installPlugin = useInstallPlugin()
  const uninstallPlugin = useUninstallPlugin()
  const activatePlugin = useActivatePlugin()
  const deactivatePlugin = useDeactivatePlugin()
  const configurePlugin = useConfigurePlugin()

  return {
    create: createPlugin,
    publish: publishPlugin,
    install: installPlugin,
    uninstall: uninstallPlugin,
    activate: activatePlugin,
    deactivate: deactivatePlugin,
    configure: configurePlugin,

    // 便捷方法
    isLoading:
      createPlugin.isPending ||
      publishPlugin.isPending ||
      installPlugin.isPending ||
      uninstallPlugin.isPending ||
      activatePlugin.isPending ||
      deactivatePlugin.isPending ||
      configurePlugin.isPending,
  }
}

/**
 * 插件状态管理
 */
export function usePluginStatus(tenantId: string, pluginId: string) {
  const { data: installedPlugins } = useInstalledPlugins(tenantId)

  const installedPlugin = installedPlugins?.find((p: TenantPlugin) => p.pluginId === pluginId)

  return {
    isInstalled: !!installedPlugin,
    isActive: installedPlugin?.status === 'active',
    status: installedPlugin?.status,
    version: installedPlugin?.version,
    config: installedPlugin?.config,
    installedAt: installedPlugin?.installedAt,
    lastError: installedPlugin?.lastError,
  }
}

/**
 * 插件搜索和筛选
 */
export function usePluginSearch() {
  const queryClient = useQueryClient()

  const searchPlugins = (query: string, filters?: Record<string, unknown>) => {
    return queryClient.fetchQuery({
      queryKey: pluginKeys.marketplaceList({ search: query, ...filters }),
      queryFn: () => trpc.console.plugin.marketplace.query({ search: query, ...filters }),
      staleTime: 30 * 1000, // 30秒
    })
  }

  return { searchPlugins }
}
