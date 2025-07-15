/**
 * 主题工具函数使用示例
 * 展示如何使用 LinchKit UI 的主题系统
 */

'use client'

import { 
  createTheme, 
  applyTheme, 
  getThemeColor, 
  setThemeColor,
  linchKitTheme,
  type Theme
} from '@linch-kit/ui'

// 示例1: 创建自定义主题
export const createCustomTheme = (): Theme => {
  return createTheme({
    // 覆盖默认主题的部分颜色
    primary: '142 76% 36%',        // 森林绿
    accent: '39 100% 50%',         // 金黄色
    ring: '142 76% 36%',           // 森林绿聚焦环
  })
}

// 示例2: 创建完整的自定义主题
export const forestTheme: Theme = {
  name: 'forest',
  displayName: '森林主题',
  description: '自然绿色调的主题',
  author: 'Your Name',
  version: '1.0.0',
  light: {
    background: '0 0% 100%',
    foreground: '222 84% 4%',
    primary: '142 76% 36%',
    'primary-foreground': '355 100% 97%',
    secondary: '210 40% 98%',
    'secondary-foreground': '142 76% 36%',
    accent: '39 100% 50%',
    'accent-foreground': '355 100% 97%',
    muted: '210 40% 98%',
    'muted-foreground': '215 13% 65%',
    card: '0 0% 100%',
    'card-foreground': '222 84% 4%',
    popover: '0 0% 100%',
    'popover-foreground': '222 84% 4%',
    destructive: '0 84% 60%',
    'destructive-foreground': '210 40% 98%',
    border: '214 32% 91%',
    input: '214 32% 91%',
    ring: '142 76% 36%',
    radius: '0.5rem',
    'chart-1': '142 76% 36%',
    'chart-2': '39 100% 50%',
    'chart-3': '195 100% 50%',
    'chart-4': '280 100% 70%',
    'chart-5': '150 100% 40%',
    'sidebar-background': '210 40% 98%',
    'sidebar-foreground': '142 76% 36%',
    'sidebar-primary': '142 76% 36%',
    'sidebar-primary-foreground': '355 100% 97%',
    'sidebar-accent': '39 100% 50%',
    'sidebar-accent-foreground': '355 100% 97%',
    'sidebar-border': '214 32% 91%',
    'sidebar-ring': '142 76% 36%',
    sidebar: '210 40% 98%',
  },
  dark: {
    background: '222 84% 4%',
    foreground: '210 40% 98%',
    primary: '142 76% 36%',
    'primary-foreground': '355 100% 97%',
    secondary: '217 32% 17%',
    'secondary-foreground': '210 40% 98%',
    accent: '39 100% 50%',
    'accent-foreground': '355 100% 97%',
    muted: '217 32% 17%',
    'muted-foreground': '215 20% 65%',
    card: '222 84% 4%',
    'card-foreground': '210 40% 98%',
    popover: '222 84% 4%',
    'popover-foreground': '210 40% 98%',
    destructive: '0 62% 30%',
    'destructive-foreground': '210 40% 98%',
    border: '217 32% 17%',
    input: '217 32% 17%',
    ring: '142 76% 36%',
    radius: '0.5rem',
    'chart-1': '142 76% 46%',
    'chart-2': '39 100% 60%',
    'chart-3': '195 100% 60%',
    'chart-4': '280 100% 80%',
    'chart-5': '150 100% 50%',
    'sidebar-background': '222 84% 3%',
    'sidebar-foreground': '215 20% 65%',
    'sidebar-primary': '142 76% 36%',
    'sidebar-primary-foreground': '355 100% 97%',
    'sidebar-accent': '39 100% 50%',
    'sidebar-accent-foreground': '355 100% 97%',
    'sidebar-border': '217 32% 17%',
    'sidebar-ring': '142 76% 36%',
    sidebar: '222 84% 3%',
  },
}

// 示例3: 主题切换组件
export const ThemeExampleComponent = () => {
  const handleApplyForestTheme = () => {
    applyTheme(forestTheme, 'light')
  }

  const handleApplyDefaultTheme = () => {
    applyTheme(linchKitTheme, 'light')
  }

  const handleApplyDarkMode = () => {
    applyTheme(forestTheme, 'dark')
  }

  const handleGetCurrentPrimaryColor = () => {
    const primaryColor = getThemeColor('primary')
    // eslint-disable-next-line no-console -- 这是演示功能，需要打印到控制台
    console.log('当前主色:', primaryColor)
  }

  const handleSetCustomPrimaryColor = () => {
    setThemeColor('primary', '270 95% 60%') // 设置为紫色
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-foreground">主题系统演示</h2>
      
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={handleApplyForestTheme}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-theme hover:bg-primary/90"
        >
          应用森林主题
        </button>
        
        <button 
          onClick={handleApplyDefaultTheme}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-theme hover:bg-secondary/90"
        >
          应用默认主题
        </button>
        
        <button 
          onClick={handleApplyDarkMode}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-theme hover:bg-accent/90"
        >
          切换暗色模式
        </button>
        
        <button 
          onClick={handleGetCurrentPrimaryColor}
          className="px-4 py-2 bg-muted text-muted-foreground rounded-theme hover:bg-muted/90"
        >
          获取当前主色
        </button>
        
        <button 
          onClick={handleSetCustomPrimaryColor}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-theme hover:bg-destructive/90"
        >
          设置紫色主色
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-card text-card-foreground rounded-theme border border-border">
        <h3 className="text-lg font-semibold mb-2">主题颜色展示</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2 bg-primary text-primary-foreground rounded-theme-sm">Primary</div>
          <div className="p-2 bg-secondary text-secondary-foreground rounded-theme-sm">Secondary</div>
          <div className="p-2 bg-accent text-accent-foreground rounded-theme-sm">Accent</div>
          <div className="p-2 bg-muted text-muted-foreground rounded-theme-sm">Muted</div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-popover text-popover-foreground rounded-theme border border-border">
        <h3 className="text-lg font-semibold mb-2">渐变效果示例</h3>
        <div className="space-y-2">
          <div className="p-3 bg-gradient-primary text-primary-foreground rounded-theme">
            Primary Gradient
          </div>
          <div className="p-3 bg-gradient-primary-accent text-primary-foreground rounded-theme">
            Primary to Accent Gradient
          </div>
        </div>
      </div>
    </div>
  )
}

// 示例4: 在 React 应用中使用主题
export const useThemeExample = () => {
  // 在组件中使用主题工具函数
  const switchToForestTheme = () => {
    applyTheme(forestTheme, 'light')
  }

  const switchToDarkMode = () => {
    const currentTheme = forestTheme // 或者从状态中获取
    applyTheme(currentTheme, 'dark')
  }

  return {
    switchToForestTheme,
    switchToDarkMode,
    forestTheme,
    defaultTheme: linchKitTheme,
  }
}

export default ThemeExampleComponent