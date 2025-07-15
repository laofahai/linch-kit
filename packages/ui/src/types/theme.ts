/**
 * LinchKit UI Theme System Types
 * 主题系统的 TypeScript 类型定义
 */

/**
 * HSL 颜色值类型
 * 格式: "hue saturation lightness" (例如: "217 91% 60%")
 */
export type HSLColor = string

/**
 * CSS 变量名称类型
 */
export type CSSVariableName = string

/**
 * 主题颜色配置
 */
export interface ThemeColors {
  /** 主要颜色 */
  primary: HSLColor
  /** 主要颜色前景色 */
  'primary-foreground': HSLColor
  /** 次要颜色 */
  secondary: HSLColor
  /** 次要颜色前景色 */
  'secondary-foreground': HSLColor
  /** 强调色 */
  accent: HSLColor
  /** 强调色前景色 */
  'accent-foreground': HSLColor
  /** 静音色 */
  muted: HSLColor
  /** 静音色前景色 */
  'muted-foreground': HSLColor
  /** 卡片背景色 */
  card: HSLColor
  /** 卡片前景色 */
  'card-foreground': HSLColor
  /** 弹出层背景色 */
  popover: HSLColor
  /** 弹出层前景色 */
  'popover-foreground': HSLColor
  /** 页面背景色 */
  background: HSLColor
  /** 页面前景色 */
  foreground: HSLColor
  /** 破坏性操作颜色 */
  destructive: HSLColor
  /** 破坏性操作前景色 */
  'destructive-foreground': HSLColor
  /** 边框颜色 */
  border: HSLColor
  /** 输入框边框颜色 */
  input: HSLColor
  /** 聚焦环颜色 */
  ring: HSLColor
}

/**
 * 图表颜色配置
 */
export interface ThemeChartColors {
  'chart-1': HSLColor
  'chart-2': HSLColor
  'chart-3': HSLColor
  'chart-4': HSLColor
  'chart-5': HSLColor
}

/**
 * 侧边栏颜色配置
 */
export interface ThemeSidebarColors {
  /** 侧边栏背景色 */
  'sidebar-background': HSLColor
  /** 侧边栏前景色 */
  'sidebar-foreground': HSLColor
  /** 侧边栏主要颜色 */
  'sidebar-primary': HSLColor
  /** 侧边栏主要颜色前景色 */
  'sidebar-primary-foreground': HSLColor
  /** 侧边栏强调色 */
  'sidebar-accent': HSLColor
  /** 侧边栏强调色前景色 */
  'sidebar-accent-foreground': HSLColor
  /** 侧边栏边框颜色 */
  'sidebar-border': HSLColor
  /** 侧边栏聚焦环颜色 */
  'sidebar-ring': HSLColor
  /** 侧边栏通用背景色 */
  sidebar: HSLColor
}

/**
 * 主题几何配置
 */
export interface ThemeGeometry {
  /** 圆角半径 */
  radius: string
}

/**
 * 完整主题配置
 */
export interface ThemeConfig extends ThemeColors, ThemeChartColors, ThemeSidebarColors, ThemeGeometry {}

/**
 * 主题模式
 */
export type ThemeMode = 'light' | 'dark'

/**
 * 完整的主题定义
 */
export interface Theme {
  /** 主题名称 */
  name: string
  /** 主题显示名称 */
  displayName: string
  /** 浅色模式配置 */
  light: ThemeConfig
  /** 深色模式配置 */
  dark: ThemeConfig
  /** 主题描述 */
  description?: string
  /** 主题作者 */
  author?: string
  /** 主题版本 */
  version?: string
}

/**
 * 主题创建器函数类型
 */
export type ThemeCreator = (baseTheme?: Partial<ThemeConfig>) => Theme

/**
 * 主题实用工具类型
 */
export interface ThemeUtils {
  /** 创建自定义主题 */
  createTheme: ThemeCreator
  /** 应用主题到 DOM */
  applyTheme: (theme: Theme, mode: ThemeMode) => void
  /** 从 CSS 变量获取颜色值 */
  getThemeColor: (colorName: keyof ThemeColors) => string
  /** 设置主题颜色 */
  setThemeColor: (colorName: keyof ThemeColors, value: HSLColor) => void
}

/**
 * 预定义主题名称
 */
export type PresetThemeName = 'linch-kit' | 'github' | 'vercel' | 'notion'

/**
 * 主题提供者属性
 */
export interface ThemeProviderProps {
  /** 默认主题 */
  defaultTheme?: PresetThemeName | Theme
  /** 子组件 */
  children: React.ReactNode
  /** 强制主题模式 */
  forcedTheme?: ThemeMode
  /** 启用系统主题 */
  enableSystem?: boolean
  /** 禁用过渡动画 */
  disableTransitionOnChange?: boolean
}