/**
 * LinchKit UI Theme Utilities
 * 主题工具函数
 */

import type { Theme, ThemeConfig, ThemeMode, ThemeCreator, HSLColor } from '../types/theme'

/**
 * 默认 LinchKit 量子主题配置
 */
export const defaultLinchKitTheme: Theme = {
  name: 'linch-kit',
  displayName: 'LinchKit Quantum',
  description: '量子蓝 + 宇宙紫的现代科技主题',
  author: 'LinchKit Team',
  version: '1.0.0',
  light: {
    background: '0 0% 100%',
    foreground: '224 10% 10%',
    card: '0 0% 100%',
    'card-foreground': '224 10% 10%',
    popover: '0 0% 100%',
    'popover-foreground': '224 10% 10%',
    primary: '217 91% 60%',
    'primary-foreground': '210 20% 98%',
    secondary: '220 15% 96%',
    'secondary-foreground': '222 47% 11%',
    muted: '220 15% 96%',
    'muted-foreground': '220 9% 45%',
    accent: '262 84% 59%',
    'accent-foreground': '210 20% 98%',
    destructive: '0 84% 60%',
    'destructive-foreground': '210 20% 98%',
    border: '220 13% 91%',
    input: '220 13% 91%',
    ring: '262 84% 59%',
    radius: '0.5rem',
    'chart-1': '217 91% 60%',
    'chart-2': '262 84% 59%',
    'chart-3': '195 100% 50%',
    'chart-4': '280 100% 70%',
    'chart-5': '150 100% 40%',
    'sidebar-background': '220 20% 98%',
    'sidebar-foreground': '220 15% 40%',
    'sidebar-primary': '217 91% 60%',
    'sidebar-primary-foreground': '210 20% 98%',
    'sidebar-accent': '262 84% 59%',
    'sidebar-accent-foreground': '210 20% 98%',
    'sidebar-border': '220 13% 91%',
    'sidebar-ring': '262 84% 59%',
    sidebar: '220 20% 98%',
  },
  dark: {
    background: '224 71% 4%',
    foreground: '210 20% 98%',
    card: '224 71% 6%',
    'card-foreground': '210 20% 98%',
    popover: '224 71% 4%',
    'popover-foreground': '210 20% 98%',
    primary: '217 91% 60%',
    'primary-foreground': '210 20% 98%',
    secondary: '215 28% 17%',
    'secondary-foreground': '210 20% 98%',
    muted: '215 28% 17%',
    'muted-foreground': '215 20% 65%',
    accent: '262 84% 59%',
    'accent-foreground': '210 20% 98%',
    destructive: '0 72% 51%',
    'destructive-foreground': '210 20% 98%',
    border: '215 28% 17%',
    input: '215 28% 17%',
    ring: '262 84% 59%',
    radius: '0.5rem',
    'chart-1': '217 91% 70%',
    'chart-2': '262 84% 69%',
    'chart-3': '195 100% 60%',
    'chart-4': '280 100% 80%',
    'chart-5': '150 100% 50%',
    'sidebar-background': '224 71% 3%',
    'sidebar-foreground': '215 20% 65%',
    'sidebar-primary': '217 91% 60%',
    'sidebar-primary-foreground': '210 20% 98%',
    'sidebar-accent': '262 84% 59%',
    'sidebar-accent-foreground': '210 20% 98%',
    'sidebar-border': '215 28% 17%',
    'sidebar-ring': '262 84% 59%',
    sidebar: '224 71% 3%',
  },
}

/**
 * 创建自定义主题
 */
export const createTheme: ThemeCreator = (baseTheme = {}) => {
  const lightConfig = { ...defaultLinchKitTheme.light, ...baseTheme }
  const darkConfig = { ...defaultLinchKitTheme.dark, ...baseTheme }

  return {
    name: 'custom',
    displayName: 'Custom Theme',
    description: 'User-defined custom theme',
    light: lightConfig,
    dark: darkConfig,
  }
}

/**
 * 应用主题到 DOM
 */
export const applyTheme = (theme: Theme, mode: ThemeMode = 'light'): void => {
  const root = document.documentElement
  const config = theme[mode]

  // 应用主题变量
  Object.entries(config).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })

  // 设置主题模式 class
  root.classList.remove('light', 'dark')
  root.classList.add(mode)
}

/**
 * 从 CSS 变量获取颜色值
 */
export const getThemeColor = (colorName: keyof ThemeConfig): string => {
  const root = document.documentElement
  const value = getComputedStyle(root).getPropertyValue(`--${colorName}`)
  return value.trim()
}

/**
 * 设置主题颜色
 */
export const setThemeColor = (colorName: keyof ThemeConfig, value: HSLColor): void => {
  const root = document.documentElement
  root.style.setProperty(`--${colorName}`, value)
}

/**
 * 验证 HSL 颜色值格式
 */
export const isValidHSLColor = (color: string): boolean => {
  // 匹配格式: "217 91% 60%" 或 "217 91% 60% / 0.5"
  const hslRegex = /^\d+\s+\d+%\s+\d+%(\s*\/\s*[\d.]+)?$/
  return hslRegex.test(color.trim())
}

/**
 * 将 HSL 颜色转换为 CSS hsl() 函数格式
 */
export const hslToCSS = (color: HSLColor): string => {
  return `hsl(${color})`
}

/**
 * 创建预设主题
 */
export const createPresetTheme = (name: string, colors: Partial<ThemeConfig>): Theme => {
  return {
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    description: `${name} theme`,
    light: { ...defaultLinchKitTheme.light, ...colors },
    dark: { ...defaultLinchKitTheme.dark, ...colors },
  }
}

/**
 * 主题工具对象
 */
export const themeUtils = {
  createTheme,
  applyTheme,
  getThemeColor,
  setThemeColor,
  isValidHSLColor,
  hslToCSS,
  createPresetTheme,
  defaultTheme: defaultLinchKitTheme,
}

/**
 * 导出默认主题
 */
export { defaultLinchKitTheme as linchKitTheme }
export default themeUtils