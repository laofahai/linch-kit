# Linch Kit UI 组件标准

**最后更新**: 2025-06-21  
**文档版本**: v3.0  
**原始来源**: `standards/ui-component-best-practices.md`, `architecture/ui-components-architecture.md`, 项目实际实现  
**维护责任**: UI 团队

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
@linch-kit/ui (基础 UI 组件)
    ↓
@linch-kit/crud-ui (CRUD UI 组件) - 规划中
    ↓
@linch-kit/auth-ui (认证 UI 组件) - 规划中
    ↓
应用级组件 (业务特定组件)
```

### 当前组件状态

#### @linch-kit/ui ✅ 基础完成
- **基础组件**: Button, Input, Card, Dialog 等 shadcn/ui 组件
- **布局组件**: Container, Grid, Flex 等响应式布局
- **主题系统**: 深色/浅色主题支持
- **工具函数**: cn() 类名合并工具

#### @linch-kit/crud-ui 📋 规划中
- **数据表格**: DataTable, Pagination, Sorting
- **表单组件**: CRUDForm, FieldRenderer, ValidationDisplay
- **列表组件**: CRUDList, ItemCard, FilterBar
- **操作组件**: ActionButtons, BulkActions, ConfirmDialog

#### @linch-kit/auth-ui 📋 规划中
- **认证表单**: LoginForm, RegisterForm, ForgotPasswordForm
- **权限组件**: PermissionGate, RoleGate, AuthGuard
- **用户组件**: UserProfile, UserMenu, UserAvatar
- **会话组件**: SessionStatus, LogoutButton

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

## 🎨 设计系统规范

### 颜色系统
```css
/* 主色调 */
--primary: 222.2 84% 4.9%;
--primary-foreground: 210 40% 98%;

/* 次要色调 */
--secondary: 210 40% 96%;
--secondary-foreground: 222.2 84% 4.9%;

/* 背景色 */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;

/* 边框和输入 */
--border: 214.3 31.8% 91.4%;
--input: 214.3 31.8% 91.4%;
--ring: 222.2 84% 4.9%;
```

### 间距系统
```typescript
// 使用 Tailwind 间距类
const spacing = {
  xs: "p-2",      // 8px
  sm: "p-3",      // 12px
  md: "p-4",      // 16px
  lg: "p-6",      // 24px
  xl: "p-8",      // 32px
}
```

### 字体系统
```typescript
const typography = {
  h1: "text-4xl font-bold tracking-tight",
  h2: "text-3xl font-semibold tracking-tight",
  h3: "text-2xl font-semibold tracking-tight",
  body: "text-sm font-medium",
  caption: "text-xs text-muted-foreground"
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
