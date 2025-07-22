'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { StarterConfig } from '../types'

interface StarterContextValue {
  config: StarterConfig
  updateConfig: (newConfig: Partial<StarterConfig>) => void
}

const StarterContext = createContext<StarterContextValue | undefined>(undefined)

export interface StarterProviderProps {
  children: ReactNode
  config: StarterConfig
  onConfigUpdate?: (config: StarterConfig) => void
}

/**
 * LinchKit Starter Provider
 * 为Starter应用提供配置上下文
 */
export function StarterProvider({ 
  children, 
  config, 
  onConfigUpdate 
}: StarterProviderProps) {
  const updateConfig = (newConfig: Partial<StarterConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    onConfigUpdate?.(updatedConfig)
  }

  const value: StarterContextValue = {
    config,
    updateConfig,
  }

  return (
    <StarterContext.Provider value={value}>
      {children}
    </StarterContext.Provider>
  )
}

/**
 * Hook for accessing Starter configuration
 */
export function useStarterContext() {
  const context = useContext(StarterContext)
  if (!context) {
    throw new Error('useStarterContext must be used within a StarterProvider')
  }
  return context
}