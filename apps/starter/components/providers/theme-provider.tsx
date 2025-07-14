/**
 * Theme Provider
 * 提供主题切换功能
 */

'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}