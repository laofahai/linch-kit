# LinchKit UI 主题系统

完整的主题系统，支持用户自定义主题和类型安全的主题管理。

## 🎯 概览

LinchKit UI 主题系统提供了：

- **完整的主题 utilities** - 所有主题相关的 CSS 实用类
- **类型安全的主题配置** - TypeScript 类型定义
- **主题工具函数** - 创建、应用和管理主题的工具
- **React Hook** - 用于主题管理的 `useTheme` Hook
- **灵活的自定义选项** - 支持完全自定义的主题

## 🚀 快速开始

### 1. 导入完整主题系统

```css
/* 在你的 globals.css 中 */
@import "tailwindcss";
@import "@linch-kit/ui/styles";
```

这将自动导入：
- 基础样式
- 默认 LinchKit 量子主题
- 所有主题实用类

### 2. 在 React 中使用主题

```tsx
import { useTheme, createTheme } from '@linch-kit/ui'

function MyComponent() {
  const { theme, mode, setMode, toggleMode } = useTheme()

  return (
    <div className="bg-primary text-primary-foreground p-4 rounded-theme">
      <h1>当前主题: {theme.displayName}</h1>
      <button 
        onClick={toggleMode}
        className="bg-accent text-accent-foreground px-4 py-2 rounded-theme hover:bg-accent/90"
      >
        切换到 {mode === 'light' ? '暗色' : '浅色'} 模式
      </button>
    </div>
  )
}
```

## 📦 主题系统组件

### 1. 样式文件结构

```
packages/ui/src/styles/
├── index.css           # 完整主题系统入口
├── globals.css         # 基础样式
├── utilities.css       # 主题实用类
└── themes/
    └── linch-kit.css   # 默认量子主题
```

### 2. 可用的实用类

#### 背景色
- `bg-primary` - 主要背景色
- `bg-secondary` - 次要背景色
- `bg-accent` - 强调背景色
- `bg-muted` - 静音背景色
- `bg-card` - 卡片背景色
- `bg-destructive` - 危险背景色
- `bg-background` - 页面背景色

#### 文字颜色
- `text-primary` - 主要文字色
- `text-primary-foreground` - 主要前景色
- `text-secondary-foreground` - 次要前景色
- `text-accent-foreground` - 强调前景色
- `text-muted-foreground` - 静音前景色
- `text-foreground` - 页面前景色

#### 边框和聚焦
- `border-border` - 边框颜色
- `border-input` - 输入框边框
- `ring-ring` - 聚焦环颜色

#### 透明度变体
- `bg-primary/50` - 50% 透明度
- `bg-primary/20` - 20% 透明度
- `bg-primary/10` - 10% 透明度

#### 主题化圆角
- `rounded-theme` - 主题圆角
- `rounded-theme-sm` - 小圆角
- `rounded-theme-lg` - 大圆角
- `rounded-theme-xl` - 超大圆角

### 3. TypeScript 类型

```typescript
import type { Theme, ThemeConfig, ThemeMode } from '@linch-kit/ui'

// 主题配置
interface ThemeConfig {
  primary: string
  'primary-foreground': string
  secondary: string
  // ... 所有主题变量
}

// 完整主题定义
interface Theme {
  name: string
  displayName: string
  light: ThemeConfig
  dark: ThemeConfig
  description?: string
  author?: string
  version?: string
}
```

## 🎨 创建自定义主题

### 方法1: 使用 `createTheme` 函数

```typescript
import { createTheme } from '@linch-kit/ui'

const customTheme = createTheme({
  primary: '142 76% 36%',        // 森林绿
  accent: '39 100% 50%',         // 金黄色
  ring: '142 76% 36%',           // 森林绿聚焦环
})
```

### 方法2: 完整主题定义

```typescript
import type { Theme } from '@linch-kit/ui'

const forestTheme: Theme = {
  name: 'forest',
  displayName: '森林主题',
  description: '自然绿色调的主题',
  author: 'Your Name',
  version: '1.0.0',
  light: {
    primary: '142 76% 36%',
    'primary-foreground': '355 100% 97%',
    secondary: '210 40% 98%',
    // ... 其他颜色配置
  },
  dark: {
    primary: '142 76% 36%',
    'primary-foreground': '355 100% 97%',
    secondary: '217 32% 17%',
    // ... 其他颜色配置
  },
}
```

### 方法3: 直接在 CSS 中定义

```css
/* 在你的 CSS 文件中 */
:root {
  --primary: 142 76% 36%;        /* 森林绿 */
  --primary-foreground: 355 100% 97%;
  --accent: 39 100% 50%;         /* 金黄色强调 */
  --accent-foreground: 355 100% 97%;
  /* ... 其他变量 */
}

.dark {
  --primary: 142 76% 36%;
  --primary-foreground: 355 100% 97%;
  /* ... 暗色模式配置 */
}
```

## 🔧 主题工具函数

### 基础工具

```typescript
import { 
  applyTheme, 
  getThemeColor, 
  setThemeColor,
  linchKitTheme 
} from '@linch-kit/ui'

// 应用主题
applyTheme(forestTheme, 'light')

// 获取当前主题颜色
const primaryColor = getThemeColor('primary')

// 设置主题颜色
setThemeColor('primary', '270 95% 60%')

// 使用默认主题
applyTheme(linchKitTheme, 'dark')
```

### useTheme Hook

```typescript
import { useTheme } from '@linch-kit/ui'

function ThemeManager() {
  const {
    theme,           // 当前主题
    mode,            // 当前模式 ('light' | 'dark')
    setTheme,        // 设置主题
    setMode,         // 设置模式
    toggleMode,      // 切换模式
    getColor,        // 获取颜色
    setColor,        // 设置颜色
    resetToDefault,  // 重置为默认主题
    isDark,          // 是否为暗色模式
    themeName,       // 主题名称
  } = useTheme({
    defaultTheme: linchKitTheme,
    defaultMode: 'light',
    enableSystemTheme: true,
    autoApply: true,
  })

  return (
    <div>
      <p>当前主题: {theme.displayName}</p>
      <p>当前模式: {mode}</p>
      <button onClick={toggleMode}>切换模式</button>
      <button onClick={resetToDefault}>重置主题</button>
    </div>
  )
}
```

## 🌟 高级用法

### 1. 主题特定的样式

```css
/* 在主题文件中定义特殊效果 */
@layer utilities {
  .forest-glow {
    box-shadow: 0 0 20px hsla(142, 76%, 36%, 0.3);
  }
  
  .forest-gradient {
    background: linear-gradient(135deg, 
      hsl(var(--primary)) 0%, 
      hsl(var(--accent)) 100%);
  }
}
```

### 2. 条件主题导入

```css
/* 仅导入基础样式和实用类 */
@import "@linch-kit/ui/styles/globals.css";
@import "@linch-kit/ui/styles/utilities.css";

/* 然后导入你的自定义主题 */
@import "./my-custom-theme.css";
```

### 3. 动态主题切换

```typescript
import { applyTheme, createTheme } from '@linch-kit/ui'

// 创建多个主题
const themes = {
  linchkit: linchKitTheme,
  forest: forestTheme,
  ocean: createTheme({
    primary: '200 100% 50%',
    accent: '180 100% 50%',
  }),
}

// 动态切换主题
function switchTheme(themeName: keyof typeof themes) {
  applyTheme(themes[themeName], 'light')
}
```

## 📚 示例文件

项目中包含了完整的示例文件：

- `apps/starter/app/test-styles/theme-utils-example.tsx` - React 使用示例
- `apps/starter/app/test-styles/custom-theme-example.css` - CSS 自定义主题示例

## 🎭 默认主题 (LinchKit Quantum)

默认主题采用量子蓝 + 宇宙紫的现代科技风格：

- **主色调**: 量子蓝 (217 91% 60%)
- **强调色**: 宇宙紫 (262 84% 59%)
- **专属特效**: 量子辉光、星际背景、量子渐变
- **响应式**: 完全支持明暗模式切换

## 🔄 迁移指南

### 从旧版本迁移

如果你之前在 `apps/starter/app/globals.css` 中定义了自定义实用类，现在可以：

1. **简单迁移**: 直接使用 `@import "@linch-kit/ui/styles"`
2. **保留自定义**: 使用基础导入 + 自定义主题
3. **渐进迁移**: 逐步迁移到新的主题系统

### 好处

- ✅ **统一管理**: 所有主题相关样式在 `@linch-kit/ui` 中
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **可扩展**: 支持无限自定义主题
- ✅ **性能优化**: 更好的样式组织和加载
- ✅ **开发体验**: 更好的 IDE 支持和代码提示

## 🎯 总结

新的主题系统提供了完整的主题管理解决方案，支持：

- **开箱即用**: 导入即可使用的完整主题
- **高度可定制**: 支持完全自定义的主题
- **类型安全**: TypeScript 类型定义
- **开发友好**: 丰富的工具函数和 Hook
- **性能优化**: 更好的样式组织

开始使用新的主题系统，让你的应用拥有专业的主题管理能力！