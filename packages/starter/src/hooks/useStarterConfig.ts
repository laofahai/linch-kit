'use client'

import { useState, useCallback } from 'react'

import { StarterConfig, StarterConfigSchema } from '../types'

export interface UseStarterConfigResult {
  /** 当前配置 */
  config: StarterConfig
  /** 更新配置 */
  updateConfig: (newConfig: Partial<StarterConfig>) => void
  /** 添加扩展 */
  addExtension: (extensionName: string) => void
  /** 移除扩展 */
  removeExtension: (extensionName: string) => void
  /** 验证配置 */
  validateConfig: (config: unknown) => config is StarterConfig
  /** 重置配置 */
  resetConfig: () => void
}

const DEFAULT_CONFIG: StarterConfig = {
  appName: 'LinchKit Starter App',
  version: '1.0.0',
  extensions: [],
  auth: {
    enabled: true,
    provider: 'supabase',
  },
  database: {
    enabled: true,
    provider: 'prisma',
  },
  trpc: {
    enabled: true,
  },
  ui: {
    theme: 'system',
    components: [],
  },
}

/**
 * Hook for managing Starter configuration
 */
export function useStarterConfig(initialConfig?: Partial<StarterConfig>): UseStarterConfigResult {
  const [config, setConfig] = useState<StarterConfig>(() => {
    const merged = { ...DEFAULT_CONFIG, ...initialConfig }
    return StarterConfigSchema.parse(merged)
  })

  const updateConfig = useCallback((newConfig: Partial<StarterConfig>) => {
    setConfig(prevConfig => {
      const updated = { ...prevConfig, ...newConfig }
      return StarterConfigSchema.parse(updated)
    })
  }, [])

  const addExtension = useCallback((extensionName: string) => {
    updateConfig({
      extensions: [...config.extensions, extensionName],
    })
  }, [config.extensions, updateConfig])

  const removeExtension = useCallback((extensionName: string) => {
    updateConfig({
      extensions: config.extensions.filter(name => name !== extensionName),
    })
  }, [config.extensions, updateConfig])

  const validateConfig = useCallback((configToValidate: unknown): configToValidate is StarterConfig => {
    return StarterConfigSchema.safeParse(configToValidate).success
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
  }, [])

  return {
    config,
    updateConfig,
    addExtension,
    removeExtension,
    validateConfig,
    resetConfig,
  }
}