/**
 * LinchKit UI Theme Hook
 * 用于管理主题的 React Hook
 */

import { useState, useEffect, useCallback } from 'react'
import { applyTheme, linchKitTheme, getThemeColor, setThemeColor } from '../utils/theme'
import type { Theme, ThemeMode } from '../types/theme'

export interface UseThemeReturn {
  /** 当前主题 */
  theme: Theme
  /** 当前主题模式 */
  mode: ThemeMode
  /** 设置主题 */
  setTheme: (theme: Theme) => void
  /** 设置主题模式 */
  setMode: (mode: ThemeMode) => void
  /** 切换主题模式 */
  toggleMode: () => void
  /** 应用主题 */
  applyCurrentTheme: () => void
  /** 获取主题颜色 */
  getColor: (colorName: keyof Theme['light']) => string
  /** 设置主题颜色 */
  setColor: (colorName: keyof Theme['light'], value: string) => void
  /** 重置为默认主题 */
  resetToDefault: () => void
  /** 是否为暗色模式 */
  isDark: boolean
  /** 主题名称 */
  themeName: string
}

export interface UseThemeOptions {
  /** 默认主题 */
  defaultTheme?: Theme
  /** 默认模式 */
  defaultMode?: ThemeMode
  /** 是否启用系统主题检测 */
  enableSystemTheme?: boolean
  /** 是否自动应用主题 */
  autoApply?: boolean
  /** 本地存储键名 */
  storageKey?: string
}

/**
 * 主题管理 Hook
 */
export const useTheme = (options: UseThemeOptions = {}): UseThemeReturn => {
  const {
    defaultTheme = linchKitTheme,
    defaultMode = 'light',
    enableSystemTheme = true,
    autoApply = true,
    storageKey = 'linchkit-theme',
  } = options

  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mode, setModeState] = useState<ThemeMode>(defaultMode)

  // 检测系统主题
  const getSystemTheme = useCallback((): ThemeMode => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  // 从本地存储加载主题设置
  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const { mode: storedMode } = JSON.parse(stored)
        if (storedMode) {
          setModeState(storedMode)
        }
        // 这里可以扩展以支持加载自定义主题
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error)
    }
  }, [storageKey])

  // 保存到本地存储
  const saveToStorage = useCallback((currentTheme: Theme, currentMode: ThemeMode) => {
    if (typeof window === 'undefined') return

    try {
      const toStore = {
        themeName: currentTheme.name,
        mode: currentMode,
      }
      localStorage.setItem(storageKey, JSON.stringify(toStore))
    } catch (error) {
      console.warn('Failed to save theme to storage:', error)
    }
  }, [storageKey])

  // 设置主题
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (autoApply) {
      applyTheme(newTheme, mode)
    }
    saveToStorage(newTheme, mode)
  }, [mode, autoApply, saveToStorage])

  // 设置主题模式
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    if (autoApply) {
      applyTheme(theme, newMode)
    }
    saveToStorage(theme, newMode)
  }, [theme, autoApply, saveToStorage])

  // 切换主题模式
  const toggleMode = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    setMode(newMode)
  }, [mode, setMode])

  // 应用当前主题
  const applyCurrentTheme = useCallback(() => {
    applyTheme(theme, mode)
  }, [theme, mode])

  // 获取主题颜色
  const getColor = useCallback((colorName: keyof Theme['light']) => {
    return getThemeColor(colorName)
  }, [])

  // 设置主题颜色
  const setColor = useCallback((colorName: keyof Theme['light'], value: string) => {
    setThemeColor(colorName, value)
  }, [])

  // 重置为默认主题
  const resetToDefault = useCallback(() => {
    setTheme(defaultTheme)
    setMode(defaultMode)
  }, [defaultTheme, defaultMode, setTheme, setMode])

  // 监听系统主题变化
  useEffect(() => {
    if (!enableSystemTheme || typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const systemMode = e.matches ? 'dark' : 'light'
      setMode(systemMode)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enableSystemTheme, setMode])

  // 初始化
  useEffect(() => {
    loadFromStorage()
    
    // 如果启用系统主题且没有存储的设置，使用系统主题
    if (enableSystemTheme && mode === defaultMode) {
      const systemMode = getSystemTheme()
      if (systemMode !== mode) {
        setModeState(systemMode)
      }
    }
  }, [loadFromStorage, enableSystemTheme, getSystemTheme, mode, defaultMode])

  // 自动应用主题
  useEffect(() => {
    if (autoApply) {
      applyCurrentTheme()
    }
  }, [autoApply, applyCurrentTheme])

  return {
    theme,
    mode,
    setTheme,
    setMode,
    toggleMode,
    applyCurrentTheme,
    getColor,
    setColor,
    resetToDefault,
    isDark: mode === 'dark',
    themeName: theme.name,
  }
}

export default useTheme