/**
 * Enhanced Theme Provider
 * 集成 @linch-kit/ui 的主题系统
 */

'use client'

import { Logger } from '@linch-kit/core/client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import * as React from 'react'

import { uiIntegration } from '@/lib/ui-integration'

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

interface EnhancedThemeProviderProps extends Omit<ThemeProviderProps, 'attribute' | 'defaultTheme' | 'enableSystem' | 'storageKey'> {
  useUIIntegration?: boolean
}

export function ThemeProvider({ 
  children, 
  useUIIntegration = true,
  ...props 
}: EnhancedThemeProviderProps) {
  // 使用UI集成配置或自定义配置
  const themeConfig = useUIIntegration ? uiIntegration.getThemeConfig() : {
    attribute: 'class',
    defaultTheme: 'system',
    enableSystem: true,
    storageKey: 'theme'
  }

  React.useEffect(() => {
    if (useUIIntegration) {
      Logger.debug('[Theme] Using LinchKit UI integration theme config')
    }
  }, [useUIIntegration])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={themeConfig.defaultTheme}
      enableSystem={themeConfig.enableSystem}
      storageKey={themeConfig.storageKey}
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}