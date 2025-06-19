# UI 包 AI 上下文

## 概述

`@linch-kit/ui` 是 Linch Kit 的 React UI 组件库，基于 Tailwind CSS 和 Radix UI，提供现代化、可访问的组件系统。

## 核心功能

### 1. 组件系统

```typescript
// 基础组件
import {
  Button,
  Input,
  Card,
  Dialog,
  Form,
  Table,
  Select,
  Checkbox,
  Radio,
  Switch
} from '@linch-kit/ui'

// 布局组件
import {
  Container,
  Grid,
  Flex,
  Stack,
  Spacer
} from '@linch-kit/ui/layout'

// 反馈组件
import {
  Alert,
  Toast,
  Modal,
  Popover,
  Tooltip,
  Progress,
  Skeleton
} from '@linch-kit/ui/feedback'
```

### 2. 主题系统

```typescript
// 主题配置
const theme = createTheme({
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem'
    }
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem'
  }
})
```

### 3. 表单系统

```typescript
// 基于 Schema 的表单
import { Form, useForm } from '@linch-kit/ui'
import { userSchema } from './schemas'

function UserForm() {
  const form = useForm({
    schema: userSchema,
    defaultValues: {
      name: '',
      email: '',
      role: 'user'
    }
  })

  return (
    <Form form={form} onSubmit={handleSubmit}>
      <Form.Field name="name">
        <Form.Label>姓名</Form.Label>
        <Form.Input />
        <Form.Message />
      </Form.Field>
      
      <Form.Field name="email">
        <Form.Label>邮箱</Form.Label>
        <Form.Input type="email" />
        <Form.Message />
      </Form.Field>
      
      <Form.Field name="role">
        <Form.Label>角色</Form.Label>
        <Form.Select>
          <Form.Option value="admin">管理员</Form.Option>
          <Form.Option value="user">用户</Form.Option>
        </Form.Select>
        <Form.Message />
      </Form.Field>
      
      <Form.Submit>提交</Form.Submit>
    </Form>
  )
}
```

## 架构设计

### 1. 组件架构

```
UI 包架构
├── 基础层 (Foundation)
│   ├── Design Tokens
│   ├── Theme System
│   └── CSS Variables
├── 原子层 (Atoms)
│   ├── Button
│   ├── Input
│   ├── Icon
│   └── Typography
├── 分子层 (Molecules)
│   ├── Form Field
│   ├── Search Box
│   ├── Card Header
│   └── Navigation Item
├── 组织层 (Organisms)
│   ├── Form
│   ├── Table
│   ├── Navigation
│   └── Modal
└── 模板层 (Templates)
    ├── Page Layout
    ├── Dashboard Layout
    └── Form Layout
```

### 2. 组件设计原则

```typescript
interface ComponentDesignPrinciples {
  accessibility: {
    keyboardNavigation: 'Full keyboard support'
    screenReader: 'ARIA labels and descriptions'
    colorContrast: 'WCAG AA compliance'
    focusManagement: 'Logical focus flow'
  }
  
  composability: {
    compound: 'Compound component pattern'
    slots: 'Flexible content slots'
    polymorphic: 'as prop for element type'
    forwarding: 'Ref and prop forwarding'
  }
  
  consistency: {
    api: 'Consistent prop naming'
    behavior: 'Predictable interactions'
    styling: 'Unified design language'
    documentation: 'Comprehensive examples'
  }
  
  performance: {
    bundleSize: 'Tree-shakable exports'
    rendering: 'Optimized re-renders'
    loading: 'Lazy loading support'
    caching: 'Memoized computations'
  }
}
```

## 组件实现模式

### 1. 复合组件模式

```typescript
// Card 组件实现
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
)

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)

// 组合导出
Card.Header = CardHeader
Card.Title = CardTitle
Card.Content = CardContent
Card.Footer = CardFooter

export { Card }
```

### 2. 多态组件模式

```typescript
// 多态 Button 组件
interface ButtonProps<T extends React.ElementType = 'button'> {
  as?: T
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

function Button<T extends React.ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonProps<T>>) {
  const Component = as || 'button'
  
  return (
    <Component
      className={cn(
        buttonVariants({ variant, size }),
        loading && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </Component>
  )
}
```

### 3. 受控/非受控模式

```typescript
// Input 组件支持受控和非受控模式
interface InputProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  // ... 其他 props
}

function Input({
  value: controlledValue,
  defaultValue,
  onChange,
  ...props
}: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    
    if (!isControlled) {
      setInternalValue(newValue)
    }
    
    onChange?.(newValue)
  }
  
  return (
    <input
      value={value}
      onChange={handleChange}
      {...props}
    />
  )
}
```

## 样式系统

### 1. CSS-in-JS 与 Tailwind 结合

```typescript
// 使用 class-variance-authority 管理变体
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground'
      },
      size: {
        sm: 'h-9 px-3 rounded-md',
        md: 'h-10 py-2 px-4',
        lg: 'h-11 px-8 rounded-md'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)
```

### 2. 主题切换

```typescript
// 主题提供者
function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [theme, setTheme] = useState(defaultTheme)
  
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 主题切换钩子
function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

## 开发工具

### 1. Storybook 集成

```typescript
// Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes.'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost']
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg']
    }
  }
} as Meta<typeof Button>

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary'
  }
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
}
```

### 2. 测试工具

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
  
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
  
  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })
})
```

这个 UI 包为 Linch Kit 提供了完整、现代化和可访问的 React 组件系统。
