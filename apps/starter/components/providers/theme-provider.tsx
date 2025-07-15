/**
 * Theme Provider
 * 提供主题切换功能
 */

'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import * as React from 'react'

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}