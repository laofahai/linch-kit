# LinchKit UI 组件开发最佳实践

## 📋 文档说明

本文档定义了 LinchKit 项目中 UI 组件开发的标准化要求和最佳实践，确保组件的一致性、可维护性和可扩展性。

**最后更新**: 2025-06-21
**适用范围**: @linch-kit/ui 统一 UI 组件库，以及 starter 应用中的认证 UI 组件

---

## 🏗️ 组件分类和放置原则

### 组件分层架构

```
@linch-kit/ui (统一组件层)
├── components/
│   ├── ui/             # 基础 shadcn/ui 组件 (Button, Input, Card)
│   ├── crud/           # CRUD 专用组件 (DataTable, FormBuilder, SearchableSelect)
│   ├── blocks/         # shadcn/ui blocks 封装 (LoginBlock, DashboardBlock)
│   └── theme/          # 主题相关组件 (ThemeToggle, ThemeProvider)
├── providers/          # 上下文提供者 (ThemeProvider, ToastProvider)
├── hooks/              # 通用 Hooks (useTheme, useToast)
├── lib/                # 工具函数 (utils, toast helpers)
└── utils/              # 简化调用方法 (Dialog.confirm, Toast.success)

导出结构:
├── "@linch-kit/ui"         # 基础组件 (Button, Input, Card, etc.)
├── "@linch-kit/ui/crud"    # CRUD 组件 (DataTable, FormBuilder, etc.)
├── "@linch-kit/ui/blocks"  # Blocks 组件 (LoginBlock, DashboardBlock, etc.)
└── "@linch-kit/ui/theme"   # 主题组件 (ThemeProvider, ThemeToggle, etc.)

Starter 应用认证组件 (应用层)
├── components/auth/    # 认证组件 (LoginForm, RegisterForm)
├── guards/            # 权限守卫 (AuthGuard, RoleGuard)
└── hooks/             # 认证 Hooks (useAuth, usePermissions)
```

### 组件放置规则

1. **基础组件** → `@linch-kit/ui`

   - 无业务逻辑的通用 UI 组件
   - 可在任何上下文中复用
   - 例：Button, Input, Modal, Card

2. **CRUD 组件** → `@linch-kit/ui/crud`

   - 数据操作相关的高级组件
   - 基于基础组件构建，提供完整的 CRUD 功能
   - 例：DataTable, FormBuilder, SearchableSelect

3. **Blocks 组件** → `@linch-kit/ui/blocks`

   - 基于 shadcn/ui blocks 的预制组件
   - 提供完整的页面级功能模块
   - 例：LoginBlock, DashboardBlock, StatsBlock

4. **认证组件** → Starter 应用中直接实现

   - 便于用户根据需求自定义
   - 提供完整的认证流程示例
   - 例：LoginForm, RegisterForm, AuthGuard

5. **主题组件** → `@linch-kit/ui/theme`
   - 主题系统相关组件
   - 提供主题切换和配置功能
   - 例：ThemeProvider, ThemeToggle

---

## 🚀 @linch-kit/ui 包增强功能

### shadcn/ui 二次封装策略

@linch-kit/ui 包基于 shadcn/ui 进行二次封装，提供更便捷的使用方式：

#### 简化调用方法

```typescript
// 传统方式
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// 简化方式
import { Dialog } from '@linch-kit/ui'

// 使用简化 API
Dialog.confirm({
  title: '确认删除',
  description: '此操作不可撤销',
  onConfirm: () => handleDelete(),
})

Dialog.alert({
  title: '操作成功',
  description: '数据已保存',
})

// Toast 简化调用
Toast.success('操作成功')
Toast.error('操作失败')
Toast.warning('请注意')
Toast.info('提示信息')
```

#### shadcn/ui Blocks 集成

优先使用 shadcn/ui 提供的预制 blocks：

```typescript
// Login page blocks
import { LoginBlock } from '@linch-kit/ui/blocks'

export function LoginPage() {
  return (
    <LoginBlock
      onLogin={handleLogin}
      onRegister={handleRegister}
      theme="default"
    />
  )
}

// Dashboard sidebar blocks
import { DashboardSidebar } from '@linch-kit/ui/blocks'

export function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <DashboardSidebar navigation={navItems} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

#### 常用组件模式封装

```typescript
// 数据表格模式
import { DataTable } from '@linch-kit/ui'

<DataTable
  data={users}
  columns={userColumns}
  searchable
  filterable
  pagination
  onRowClick={handleRowClick}
/>

// 表单模式
import { Form } from '@linch-kit/ui'

<Form
  schema={userSchema}
  onSubmit={handleSubmit}
  loading={isLoading}
  mode="create" // create | edit | view
/>
```

---

## 🎨 主题系统架构

### ThemeProvider 实现规范

```typescript
// 主题配置接口
interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  colors: ColorPalette
  typography: TypographyScale
  spacing: SpacingScale
  breakpoints: BreakpointConfig
}

// ThemeProvider 组件
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'linch-kit-theme',
}: ThemeProviderProps) {
  // 实现主题状态管理
  // 支持系统主题检测
  // 提供主题切换功能
  // 处理主题持久化
}
```

### CSS 变量系统

```css
/* 主题令牌定义 */
:root {
  /* 颜色系统 */
  --color-primary: 220 100% 50%;
  --color-secondary: 210 40% 60%;
  --color-background: 0 0% 100%;
  --color-foreground: 0 0% 3.9%;

  /* 间距系统 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* 字体系统 */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}

/* 深色主题覆盖 */
[data-theme='dark'] {
  --color-background: 0 0% 3.9%;
  --color-foreground: 0 0% 98%;
  /* 其他深色主题变量 */
}
```

### 预设主题配置

```typescript
// 主题预设
export const themes = {
  light: {
    name: 'Light',
    colors: {
      primary: 'hsl(220, 100%, 50%)',
      background: 'hsl(0, 0%, 100%)',
      // ...
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: 'hsl(220, 100%, 60%)',
      background: 'hsl(0, 0%, 3.9%)',
      // ...
    },
  },
  system: {
    name: 'System',
    // 自动检测系统主题
  },
} as const
```

---

## 🔧 组件开发规范

### 组件结构模板

```typescript
// ComponentName.tsx
import React from 'react'
import { cn } from '@/lib/utils'
import { VariantProps, cva } from 'class-variance-authority'

// 样式变体定义
const componentVariants = cva(
  "base-classes", // 基础样式
  {
    variants: {
      variant: {
        default: "default-styles",
        secondary: "secondary-styles",
      },
      size: {
        sm: "small-styles",
        md: "medium-styles",
        lg: "large-styles",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

// 组件属性接口
export interface ComponentNameProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // 组件特有属性
  children?: React.ReactNode
  disabled?: boolean
}

// 组件实现
export const ComponentName = React.forwardRef<
  HTMLDivElement,
  ComponentNameProps
>(({ className, variant, size, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </div>
  )
})

ComponentName.displayName = "ComponentName"

export { componentVariants }
```

### TypeScript 类型定义规范

```typescript
// 基础属性类型
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

// 变体属性类型
export interface VariantProps {
  variant?: 'default' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

// 状态属性类型
export interface StateProps {
  loading?: boolean
  disabled?: boolean
  error?: string | boolean
}

// 组合属性类型
export interface ComponentProps extends BaseComponentProps, VariantProps, StateProps {
  // 组件特有属性
}
```

### 可访问性要求

```typescript
// 可访问性属性
export interface AccessibilityProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-hidden'?: boolean
  role?: string
  tabIndex?: number
}

// 键盘导航支持
const handleKeyDown = (event: React.KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      // 处理激活操作
      break
    case 'Escape':
      // 处理取消操作
      break
    case 'ArrowDown':
    case 'ArrowUp':
      // 处理导航操作
      break
  }
}
```

---

## 📚 Storybook 文档规范

### Story 文件结构

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './ComponentName'

const meta: Meta<typeof ComponentName> = {
  title: 'UI/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '组件功能描述和使用场景'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive']
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg']
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// 基础示例
export const Default: Story = {
  args: {
    children: 'Button Text'
  }
}

// 变体示例
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <ComponentName variant="default">Default</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
      <ComponentName variant="destructive">Destructive</ComponentName>
    </div>
  )
}

// 交互示例
export const Interactive: Story = {
  args: {
    children: 'Click me'
  },
  play: async ({ canvasElement }) => {
    // 交互测试逻辑
  }
}
```

### 文档注释规范

````typescript
/**
 * 通用按钮组件
 *
 * @description 提供一致的按钮样式和交互行为，支持多种变体和尺寸
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 *
 * @see {@link https://design-system.example.com/button} 设计规范
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', ...props }, ref) => {
    // 组件实现
  }
)
````

---

## 🔗 包间集成规范

### CRUD 组件集成

```typescript
// CRUD 组件已集成到 @linch-kit/ui 包中，提供统一的导入方式
import { Button, Input, Table } from '@linch-kit/ui'
import { DataTable, FormBuilder } from '@linch-kit/ui/crud'
import { useCRUD } from '@linch-kit/crud'

export function CRUDList<T>({ schema, ...props }: CRUDListProps<T>) {
  const { data, loading, error } = useCRUD(schema)

  return (
    <div className="crud-list">
      <DataTable data={data} loading={loading} schema={schema} />
      {/* 使用统一的 CRUD 组件 */}
    </div>
  )
}
```

### Starter 应用认证组件集成

```typescript
// 认证组件在 starter 应用中直接实现，使用统一的设计语言
import { Form, Input, Button, LoginBlock } from '@linch-kit/ui'
import { useAuth } from '@linch-kit/auth-core'

// 方式1：使用预制 LoginBlock
export function LoginPage() {
  const { login } = useAuth()

  return (
    <LoginBlock
      onLogin={login}
      theme="default"
      // 用户可以自定义样式和行为
    />
  )
}

// 方式2：自定义实现
export function CustomLoginForm({ onSuccess }: LoginFormProps) {
  const { login, loading } = useAuth()

  return (
    <Form onSubmit={handleSubmit}>
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Button type="submit" loading={loading}>
        Sign In
      </Button>
    </Form>
  )
}
```

### 主题一致性保证

```typescript
// 所有 UI 包都应该使用相同的主题系统
import { useTheme } from '@linch-kit/ui'

export function BusinessComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <div data-theme={theme}>
      {/* 组件内容 */}
    </div>
  )
}
```

---

## ✅ 开发检查清单

### 组件开发完成标准

- [ ] **功能完整性**

  - [ ] 组件功能符合设计要求
  - [ ] 支持所有必要的属性和变体
  - [ ] 错误处理和边界情况处理

- [ ] **代码质量**

  - [ ] TypeScript 类型定义完整
  - [ ] 通过 ESLint 和 Prettier 检查
  - [ ] 代码注释和 JSDoc 完整

- [ ] **可访问性**

  - [ ] ARIA 标签正确设置
  - [ ] 键盘导航支持
  - [ ] 颜色对比度符合 WCAG 标准

- [ ] **主题支持**

  - [ ] 支持深色/浅色主题
  - [ ] CSS 变量正确使用
  - [ ] 主题切换无异常

- [ ] **文档和测试**

  - [ ] Storybook 文档完整
  - [ ] 使用示例清晰
  - [ ] 单元测试覆盖率 > 80%

- [ ] **性能优化**
  - [ ] 组件渲染性能优秀
  - [ ] 内存泄漏检查通过
  - [ ] Bundle 大小合理

---

**维护说明**: 本文档应该随着组件库的发展持续更新，确保最佳实践与实际开发保持同步。所有 UI 相关的包都应该遵循这些规范，以保证整个 LinchKit 生态系统的一致性。
