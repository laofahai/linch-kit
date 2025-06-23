# @linch-kit/ui

🎨 **Linch Kit UI 包** - 现代化的 React UI 组件库，基于 shadcn/ui、Tailwind CSS 和 Radix UI，提供完整的组件生态系统。

## ✨ 核心特性

- 🎨 **现代设计系统** - 基于 shadcn/ui 的精美组件设计
- 🔒 **类型安全** - 完整的 TypeScript 支持和类型推导
- 🎯 **可访问性** - 基于 Radix UI 的无障碍组件
- 🎨 **主题系统** - 深色/浅色主题支持，完全可定制
- 📱 **响应式设计** - 移动端优先的响应式布局
- 🔧 **CRUD 组件** - 数据表格、表单构建器等高级组件
- 🔐 **认证组件** - 登录、注册、权限控制等认证相关组件
- 🌍 **国际化支持** - 内置多语言支持
- 🏗️ **布局系统** - 仪表板布局和页面模板
- 🤖 **AI-First** - 为 AI 辅助开发优化的组件设计

## 📦 安装

```bash
pnpm add @linch-kit/ui
# 或
npm install @linch-kit/ui
```

### 对等依赖

```bash
pnpm add react react-dom tailwindcss @radix-ui/react-*
```

## 🚀 快速开始

### 基础组件

```tsx
import {
  Button,
  Input,
  Card,
  Dialog,
  Form,
  Table,
  Badge,
  Avatar,
  Alert
} from '@linch-kit/ui'

function MyComponent() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Avatar src="/avatar.jpg" alt="User" />
          <Badge variant="secondary">Active</Badge>
        </div>

        <Form>
          <Input placeholder="Enter your name" />
          <Button type="submit">Submit</Button>
        </Form>

        <Alert>
          <AlertDescription>
            This is an informational alert.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  )
}
```

### CRUD 组件

```tsx
import {
  DataTable,
  FormBuilder,
  SearchableSelect,
  SchemaDataTable
} from '@linch-kit/ui/crud'

// 数据表格
function UserTable() {
  const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Role' }
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      searchable
      filterable
      pagination
      onRowClick={(user) => console.log('Selected:', user)}
    />
  )
}

// 动态表单
function UserForm() {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['admin', 'user'])
  })

  return (
    <FormBuilder
      schema={schema}
      onSubmit={(data) => console.log('Form data:', data)}
      submitText="Create User"
    />
  )
}
```

### 认证组件

```tsx
import {
  LoginForm,
  RegisterForm,
  AuthGuard,
  UserProfile
} from '@linch-kit/ui/auth'

// 登录表单
function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm
        onSubmit={async (credentials) => {
          // 处理登录逻辑
          await signIn(credentials)
        }}
        providers={['email', 'google', 'github']}
        redirectTo="/dashboard"
      />
    </div>
  )
}

// 权限保护
function ProtectedPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminDashboard />
    </AuthGuard>
  )
}
```

### 布局组件

```tsx
import {
  DashboardLayout,
  Sidebar,
  Header,
  Breadcrumb
} from '@linch-kit/ui/blocks'

// 仪表板布局
function Dashboard() {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Settings', href: '/settings', icon: SettingsIcon }
  ]

  return (
    <DashboardLayout
      navigation={navigation}
      user={{
        name: 'John Doe',
        email: 'john@example.com',
        avatar: '/avatar.jpg'
      }}
      breadcrumbs={[
        { name: 'Dashboard', href: '/' },
        { name: 'Users', href: '/users' },
        { name: 'Profile' }
      ]}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {/* 页面内容 */}
      </div>
    </DashboardLayout>
  )
}
```

### 主题系统

```tsx
import { ThemeProvider, useTheme, ThemeToggle } from '@linch-kit/ui'

// 应用根组件
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <div className="min-h-screen bg-background">
        <Header>
          <ThemeToggle />
        </Header>
        <main>
          <MyApp />
        </main>
      </div>
    </ThemeProvider>
  )
}

// 在组件中使用主题
function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-4">
      <p>Current theme: {theme}</p>
      <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </Button>
    </div>
  )
}
```

### 国际化支持

```tsx
import { useUITranslation } from '@linch-kit/ui/i18n'

function MyComponent() {
  const { t } = useUITranslation()

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <Button>{t('common.submit')}</Button>
      <p>{t('table.noData')}</p>
    </div>
  )
}

// 自定义翻译
import { getUITranslation } from '@linch-kit/ui/i18n'

const customT = getUITranslation((key) => {
  // 使用你的翻译系统
  return i18n.t(key)
})
```

## 📚 API 文档

### 组件分类

#### 基础 UI 组件 (shadcn/ui)

```tsx
// 从 @linch-kit/ui 导入
import {
  Button,
  Input,
  Card,
  Dialog,
  Form,
  Table,
  Badge,
  Avatar,
  Alert,
  Tabs,
  Select,
  Checkbox,
  Switch,
  Textarea,
  Popover,
  Tooltip,
  Breadcrumb,
  Sheet,
  Pagination,
  Command
} from '@linch-kit/ui'
```

#### CRUD 组件

```tsx
// 从 @linch-kit/ui/crud 导入
import {
  DataTable,
  FormBuilder,
  SearchableSelect,
  SchemaDataTable,
  SchemaFormBuilder,
  FilterBuilder,
  SortBuilder
} from '@linch-kit/ui/crud'
```

#### 认证组件

```tsx
// 从 @linch-kit/ui/auth 导入
import {
  LoginForm,
  RegisterForm,
  AuthGuard,
  UserProfile,
  PasswordResetForm,
  TwoFactorForm
} from '@linch-kit/ui/auth'
```

#### 布局组件

```tsx
// 从 @linch-kit/ui/blocks 导入
import {
  DashboardLayout,
  Sidebar,
  Header,
  Footer,
  StatsCard,
  MetricCard,
  ChartCard
} from '@linch-kit/ui/blocks'
```

#### 工具和 Hooks

```tsx
// 从 @linch-kit/ui 导入
import {
  useTheme,
  useToast,
  useLocalStorage,
  useDebounce,
  cn,
  formatDate,
  formatCurrency
} from '@linch-kit/ui'
```

### 主要组件 API

#### DataTable

```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[]          // 列定义
  data: T[]                        // 数据
  searchable?: boolean             // 是否可搜索
  filterable?: boolean             // 是否可过滤
  pagination?: boolean             // 是否分页
  sorting?: boolean                // 是否可排序
  selection?: boolean              // 是否可选择
  onRowClick?: (row: T) => void    // 行点击事件
  onSelectionChange?: (rows: T[]) => void  // 选择变化事件
}
```

#### FormBuilder

```tsx
interface FormBuilderProps<T> {
  schema: ZodSchema<T>              // Zod 验证模式
  defaultValues?: Partial<T>       // 默认值
  onSubmit: (data: T) => void      // 提交处理
  submitText?: string              // 提交按钮文本
  resetText?: string               // 重置按钮文本
  layout?: 'vertical' | 'horizontal'  // 布局方向
}
```

#### AuthGuard

```tsx
interface AuthGuardProps {
  children: React.ReactNode        // 子组件
  requiredRoles?: string[]         // 必需角色
  requiredPermissions?: string[]   // 必需权限
  fallback?: React.ReactNode       // 无权限时显示
  redirectTo?: string              // 重定向路径
}
```

## 🔧 配置

### Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@linch-kit/ui/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
```

### CSS 变量

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}
```

## 🔧 配置

### Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@linch-kit/ui/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          foreground: 'hsl(var(--color-primary-foreground))'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

## 🧪 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# Storybook
pnpm storybook

# 测试
pnpm test

# 类型检查
pnpm check-types

# 代码检查
pnpm lint

# 生成组件
pnpm generate:component
```

## 📋 变更日志

### v0.1.0 (2024-06-21)

**新增功能**
- ✨ 完整的 shadcn/ui 基础组件库
- ✨ CRUD 组件系统（DataTable、FormBuilder 等）
- ✨ 认证组件（LoginForm、AuthGuard 等）
- ✨ 布局组件（DashboardLayout、Sidebar 等）
- ✨ 主题系统（深色/浅色主题支持）
- ✨ 国际化支持（基于 @linch-kit/core）
- ✨ 完整的 TypeScript 类型支持

**基础组件**
- 🎨 Button、Input、Card、Dialog、Form、Table 等
- 🎨 Badge、Avatar、Alert、Tabs、Select 等
- 🎨 Popover、Tooltip、Breadcrumb、Sheet 等

**高级组件**
- 📊 DataTable（排序、筛选、分页、搜索）
- 📝 FormBuilder（Schema 驱动的动态表单）
- 🔍 SearchableSelect（异步搜索支持）
- 🔐 AuthGuard（权限控制组件）
- 🏗️ DashboardLayout（完整的仪表板布局）

**技术特性**
- 🔒 完整的类型安全
- 🎨 可定制的主题系统
- 📱 响应式设计
- ♿ 可访问性支持
- 🚀 AI-First 设计理念

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/laofahai/linch-kit)
- [AI 上下文文档](../../ai-context/packages/ui.md)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Radix UI 文档](https://www.radix-ui.com/docs)
- [Storybook 文档](https://storybook.js.org/)
- [示例项目](../../apps/starter)
