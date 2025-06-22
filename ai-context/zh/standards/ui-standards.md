# Linch Kit UI 组件标准

**最后更新**: 2025-06-21
**文档版本**: v3.1 (UI 架构统一更新)
**原始来源**: `standards/ui-component-best-practices.md`, `architecture/ui-components-architecture.md`, 项目实际实现
**维护责任**: UI 团队
**更新内容**: UI 包架构统一，移除独立 crud-ui 和 auth-ui 包引用

---

## 🎨 UI 设计系统概览

### 核心设计原则
- **一致性优先**: 所有组件遵循统一的设计语言
- **可访问性**: 符合 WCAG 2.1 AA 标准
- **响应式设计**: 支持移动端和桌面端
- **主题化**: 支持深色/浅色主题切换
- **类型安全**: 完整的 TypeScript 支持

### 技术栈
- **基础组件**: shadcn/ui (基于 Radix UI)
- **样式系统**: Tailwind CSS
- **图标系统**: Lucide React
- **状态管理**: React Context + Hooks
- **表单处理**: React Hook Form + Zod 验证

## 📦 组件架构

### 组件层次结构
```
@linch-kit/ui (完整 UI 组件库)
    ├── 基础 UI 组件 (shadcn/ui)
    ├── CRUD UI 组件 (DataTable, FormBuilder 等)
    ├── 认证 UI 组件 (LoginForm, AuthGuard 等)
    └── 布局组件 (DashboardLayout 等)
    ↓
应用级组件 (业务特定组件)
```

### 当前组件状态

#### @linch-kit/ui ✅ 完整实现
**包含所有 UI 组件的统一包，分为以下子模块**：

##### 基础 UI 组件 (shadcn/ui)
- **基础组件**: Button, Input, Card, Dialog, Table 等
- **表单组件**: Form, Textarea, Checkbox, Switch, Select 等
- **交互组件**: Dialog, Popover, Tooltip, Tabs 等
- **数据展示**: Badge, Avatar, Alert, Pagination 等
- **导航组件**: Breadcrumb, Sheet 等

##### CRUD UI 组件 ✅ 已实现
- **数据表格**: DataTable (支持排序、筛选、分页、操作)
- **表单构建**: FormBuilder (动态表单生成)
- **搜索组件**: SearchableSelect (异步搜索支持)
- **Schema 驱动**: SchemaDataTable, SchemaFormBuilder

##### 认证 UI 组件 ✅ 已实现
- **认证表单**: LoginForm, RegisterForm, PasswordResetForm
- **权限组件**: AuthGuard (路由保护)
- **用户组件**: UserProfileForm
- **布局组件**: DashboardLayout

##### 共享特性
- **主题系统**: 深色/浅色主题支持，完整的设计系统
- **国际化支持**: 使用 @linch-kit/core 的 i18n 系统
- **响应式设计**: 支持移动端和桌面端
- **TypeScript 支持**: 完整的类型定义和类型安全

## 🔧 组件开发标准

### 1. 组件命名规范
```typescript
// ✅ 正确：使用 PascalCase
export const UserProfile = () => { ... }
export const DataTable = () => { ... }

// ❌ 错误：使用其他命名方式
export const userProfile = () => { ... }
export const data_table = () => { ... }
```

### 2. Props 接口定义
```typescript
// ✅ 正确：完整的 Props 接口
interface UserProfileProps {
  /** 用户数据 */
  user: User
  /** 是否显示编辑按钮 */
  showEditButton?: boolean
  /** 编辑回调函数 */
  onEdit?: (user: User) => void
  /** 自定义类名 */
  className?: string
  /** 子组件 */
  children?: React.ReactNode
}

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  showEditButton = true,
  onEdit,
  className,
  children
}) => {
  // 组件实现
}
```

### 3. JSDoc 文档要求
```typescript
/**
 * @description 用户资料显示组件，支持查看和编辑用户信息
 * @param user - 用户数据对象
 * @param showEditButton - 是否显示编辑按钮，默认为 true
 * @param onEdit - 编辑按钮点击回调函数
 * @param className - 自定义 CSS 类名
 * @param children - 子组件内容
 * @returns 用户资料组件
 * @example
 * ```tsx
 * <UserProfile 
 *   user={currentUser} 
 *   onEdit={(user) => setEditingUser(user)}
 * />
 * ```
 * @since v1.0.0
 */
export const UserProfile: React.FC<UserProfileProps> = ({ ... }) => {
  // 组件实现
}
```

### 4. 样式规范
```typescript
// ✅ 正确：使用 Tailwind CSS 类名
const UserProfile = ({ className, ...props }) => {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      "p-6 space-y-4",
      className
    )}>
      {/* 组件内容 */}
    </div>
  )
}

// ✅ 正确：使用 CSS 变量支持主题
const styles = {
  container: "bg-background text-foreground",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground"
}
```

### 5. 状态管理规范
```typescript
// ✅ 正确：使用 React Hooks
const UserProfile = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(user)
  
  const handleSave = useCallback(async (data: User) => {
    try {
      await updateUser(data)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }, [])
  
  return (
    // 组件 JSX
  )
}
```

## 🎨 统一设计系统 (基于 shadcn/ui)

### 设计系统原则
- **统一使用 shadcn/ui 默认规范**：所有模块和插件必须使用 `@linch-kit/ui` 提供的设计系统
- **禁止自定义设计规范**：不得偏离 shadcn/ui 的设计语言和组件规范
- **主题一致性**：使用统一的颜色变量和主题系统

### 样式系统架构
```typescript
// @linch-kit/ui 提供的统一样式系统
import { cn } from '@linch-kit/ui/lib/utils'
import { ThemeProvider, useTheme } from '@linch-kit/ui'

// 模块和插件的样式扩展方式
export function MyModuleComponent({ className, ...props }) {
  return (
    <div className={cn(
      "base-styles-from-shadcn", // 使用 shadcn/ui 基础样式
      className // 允许外部样式覆盖
    )}>
      {/* 组件内容 */}
    </div>
  )
}
```

### 为模块和插件提供样式自定义的方法

#### 1. 使用 CSS 变量系统
```css
/* 模块可以通过 CSS 变量自定义主题 */
.my-module {
  --primary: oklch(0.646 0.222 41.116);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
}
```

#### 2. 使用 Tailwind CSS 类名组合
```typescript
// 推荐的样式扩展方式
import { cn } from '@linch-kit/ui/lib/utils'

export function ModuleCard({ variant = 'default', className, ...props }) {
  return (
    <div className={cn(
      // 基础样式 (来自 shadcn/ui)
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      // 变体样式
      {
        "border-primary bg-primary/5": variant === 'primary',
        "border-destructive bg-destructive/5": variant === 'destructive',
      },
      // 外部自定义样式
      className
    )}>
      {props.children}
    </div>
  )
}
```

#### 3. 主题提供者集成
```typescript
// 模块应该使用 @linch-kit/ui 的主题系统
import { ThemeProvider, useTheme } from '@linch-kit/ui'

export function MyModuleProvider({ children }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="my-module-theme">
      {children}
    </ThemeProvider>
  )
}

// 在组件中使用主题
export function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <div className={cn(
      "transition-colors duration-200",
      theme === 'dark' ? 'bg-gray-900' : 'bg-white'
    )}>
      {/* 组件内容 */}
    </div>
  )
}
```

## 🔄 响应式设计标准

### 断点系统
```typescript
const breakpoints = {
  sm: "640px",   // 手机横屏
  md: "768px",   // 平板
  lg: "1024px",  // 桌面
  xl: "1280px",  // 大屏桌面
  "2xl": "1536px" // 超大屏
}
```

### 响应式组件示例
```typescript
const ResponsiveCard = () => {
  return (
    <div className={cn(
      "w-full",
      "sm:w-1/2 md:w-1/3 lg:w-1/4",  // 响应式宽度
      "p-4 sm:p-6",                   // 响应式内边距
      "text-sm sm:text-base"          // 响应式字体大小
    )}>
      {/* 卡片内容 */}
    </div>
  )
}
```

## ♿ 可访问性标准

### 1. 语义化 HTML
```typescript
// ✅ 正确：使用语义化标签
const UserCard = () => {
  return (
    <article role="article" aria-labelledby="user-name">
      <header>
        <h2 id="user-name">{user.name}</h2>
      </header>
      <main>
        <p>{user.description}</p>
      </main>
    </article>
  )
}
```

### 2. 键盘导航支持
```typescript
// ✅ 正确：支持键盘导航
const InteractiveButton = ({ onClick, children }) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }
  
  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="执行操作"
    >
      {children}
    </button>
  )
}
```

### 3. ARIA 属性
```typescript
// ✅ 正确：使用 ARIA 属性
const LoadingButton = ({ isLoading, children }) => {
  return (
    <button
      disabled={isLoading}
      aria-busy={isLoading}
      aria-describedby={isLoading ? "loading-text" : undefined}
    >
      {children}
      {isLoading && (
        <span id="loading-text" className="sr-only">
          正在加载...
        </span>
      )}
    </button>
  )
}
```

## 🧪 组件测试标准

### 1. 单元测试
```typescript
// UserProfile.test.tsx
import { render, screen } from '@testing-library/react'
import { UserProfile } from './UserProfile'

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com'
  }
  
  it('renders user information correctly', () => {
    render(<UserProfile user={mockUser} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
  
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<UserProfile user={mockUser} onEdit={onEdit} />)
    
    fireEvent.click(screen.getByText('编辑'))
    expect(onEdit).toHaveBeenCalledWith(mockUser)
  })
})
```

### 2. Storybook 故事
```typescript
// UserProfile.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { UserProfile } from './UserProfile'

const meta: Meta<typeof UserProfile> = {
  title: 'Components/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    }
  }
}

export const WithoutEditButton: Story = {
  args: {
    ...Default.args,
    showEditButton: false
  }
}
```

## 📋 组件开发检查清单

### 开发前检查
- [ ] 确认组件设计符合设计系统规范
- [ ] 检查是否有现有组件可以复用
- [ ] 确定组件的 Props 接口设计

### 开发中检查
- [ ] 使用 TypeScript 定义完整的 Props 接口
- [ ] 添加完整的 JSDoc 文档注释
- [ ] 使用 Tailwind CSS 类名而非自定义 CSS
- [ ] 支持 className 属性用于样式扩展
- [ ] 实现响应式设计
- [ ] 添加可访问性支持 (ARIA 属性、键盘导航)

### 开发后检查
- [ ] 编写单元测试用例
- [ ] 创建 Storybook 故事
- [ ] 在不同设备上测试响应式效果
- [ ] 使用屏幕阅读器测试可访问性
- [ ] 通过 ESLint 代码检查
- [ ] 更新相关文档

---

**重要提醒**: 所有 UI 组件的开发都必须严格遵循本标准。新组件开发前请先查看现有组件库，避免重复实现。
