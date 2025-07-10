---
package: '@linch-kit/ui'
version: '2.0.2'
layer: 'L5'
dependencies: ['@linch-kit/core', 'tools/schema', '@linch-kit/auth', '@linch-kit/platform']
completeness: 85
test_coverage: 80
status: 'production_ready'
document_type: 'api_reference'
purpose: 'Graph RAG knowledge base - Schema驱动的企业级React组件库，基于shadcn/ui构建'
api_exports:
  - name: 'SchemaForm'
    type: 'component'
    status: 'stable'
  - name: 'SchemaTable'
    type: 'component'
    status: 'stable'
  - name: 'SchemaFieldRenderer'
    type: 'component'
    status: 'stable'
  - name: 'Button'
    type: 'component'
    status: 'stable'
  - name: 'Card'
    type: 'component'
    status: 'stable'
  - name: 'Input'
    type: 'component'
    status: 'stable'
  - name: 'Table'
    type: 'component'
    status: 'stable'
  - name: 'Dialog'
    type: 'component'
    status: 'stable'
  - name: 'useUITranslation'
    type: 'hook'
    status: 'stable'
  - name: 'useToast'
    type: 'hook'
    status: 'stable'
  - name: 'cn'
    type: 'function'
    status: 'stable'
relationships:
  - type: 'depends_on'
    targets: ['@linch-kit/core', 'tools/schema', '@linch-kit/auth', '@linch-kit/platform']
  - type: 'integrates_with'
    targets: ['React', 'Radix UI', 'Tailwind CSS', 'shadcn/ui']
last_verified: '2025-07-07'
---

# LinchKit UI 包 API 文档

## 📋 包概述

**包名**: `@linch-kit/ui`  
**版本**: 2.0.2  
**架构层级**: L5 (UI组件层)  
**描述**: LinchKit UI组件库 - Schema驱动的企业级React组件

## 🏗️ 架构设计

### 核心设计原则

1. **Schema驱动**: 基于 `tools/schema` 的实体定义自动生成UI组件
2. **shadcn/ui集成**: 基于 shadcn/ui + Radix UI 构建的现代化组件库
3. **主题系统**: 支持 Tailwind CSS v4 + CSS变量的完整主题系统
4. **类型安全**: 100% TypeScript，完整的类型定义和推断
5. **企业级特性**: 内置国际化、可访问性、插件系统

### 包结构

```
packages/ui/
├── src/
│   ├── infrastructure/        # 基础设施集成
│   ├── plugin.ts             # Core插件集成
│   ├── components/           # 基础UI组件
│   │   ├── ui/              # shadcn/ui组件
│   │   └── hooks/           # UI相关Hook
│   ├── forms/               # Schema驱动表单
│   ├── tables/              # Schema驱动表格
│   ├── types/               # 类型定义
│   ├── utils/               # 工具函数
│   └── styles/              # 样式文件
│       ├── globals.css      # 全局样式
│       └── themes/          # 主题定义
└── dist/                    # 构建输出
```

## 🔗 依赖关系

### 核心依赖

- `@linch-kit/core` - 基础设施 (日志、配置、国际化、插件)
- `tools/schema` - Schema定义和验证
- `@linch-kit/auth` - 认证和权限控制
- `@linch-kit/platform` - CRUD操作集成

### 外部依赖

- **UI框架**: Radix UI 组件集
- **样式**: Tailwind CSS v4, clsx, tailwind-merge
- **表单**: react-hook-form (peer dependency)
- **表格**: @tanstack/react-table
- **工具**: class-variance-authority, lucide-react

## 📦 导出结构

### 主入口 (`index.ts`)

```typescript
// 核心基础设施
export * from './infrastructure'
export * from './plugin'

// 基础组件
export * from './components'

// Schema驱动组件
export * from './forms'
export * from './tables'

// 类型定义
export * from './types'

// 工具函数
export * from './utils'
```

### 子包导出

1. **`/components`** - 基础UI组件和Hook
2. **`/forms`** - Schema驱动表单组件
3. **`/tables`** - Schema驱动表格组件
4. **`/utils`** - 工具函数
5. **`/components/ui/*`** - 单个shadcn/ui组件
6. **`/styles/globals.css`** - 全局样式文件

## 🏗️ 核心API

### 1. 基础设施 (`infrastructure`)

#### 日志系统

```typescript
import { logger } from '@linch-kit/ui/infrastructure'

// 日志记录方法
logger.debug(message: string, data?: Record<string, unknown>)
logger.info(message: string, data?: Record<string, unknown>)
logger.warn(message: string, data?: Record<string, unknown>)
logger.error(message: string, error?: Error | string, data?: Record<string, unknown>)
logger.fatal(message: string, error?: Error, data?: Record<string, unknown>)
```

#### 国际化Hook

```typescript
import { useUITranslation } from '@linch-kit/ui/infrastructure'

function MyComponent() {
  const { t } = useUITranslation()

  return (
    <div>
      <button>{t('form.create')}</button>
      <span>{t('form.create_title', { entity: 'User' })}</span>
    </div>
  )
}
```

#### 主题配置

```typescript
import { getThemeConfig, UIThemeConfig } from '@linch-kit/ui/infrastructure'

interface UIThemeConfig {
  colorMode: 'light' | 'dark' | 'auto'
  primaryColor: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  density: 'compact' | 'comfortable' | 'spacious'
}

const themeConfig = getThemeConfig()
```

### 2. Schema驱动表单 (`forms`)

#### SchemaForm 组件

```typescript
import { SchemaForm } from '@linch-kit/ui/forms'
import type { SchemaFormProps } from '@linch-kit/ui/types'

interface SchemaFormProps extends BaseComponentProps {
  schema: UIEntityDefinition
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void
  onCancel?: () => void
  initialData?: Record<string, unknown>
  mode?: 'create' | 'edit' | 'view'
  validation?: 'strict' | 'permissive'
}

// 使用示例
const userSchema = {
  name: 'User',
  displayName: '用户',
  fields: {
    name: { type: 'string', required: true },
    email: { type: 'email', required: true },
    age: { type: 'number', min: 0, max: 150 }
  }
}

<SchemaForm
  schema={userSchema}
  onSubmit={async (data) => {
    console.log('提交数据:', data)
  }}
  mode="create"
  validation="strict"
/>
```

#### SchemaFieldRenderer 组件

```typescript
import { SchemaFieldRenderer } from '@linch-kit/ui/forms'

interface SchemaFieldRendererProps {
  name: string
  field: FieldDefinition
  control: Control<Record<string, unknown>>
  disabled?: boolean
  error?: string
  className?: string
}

// 支持的字段类型
- string, email, url
- number
- boolean
- text (多行文本)
- enum (枚举选择)
- date
- array, object, json (JSON编辑器)
```

### 3. Schema驱动表格 (`tables`)

#### SchemaTable 组件

```typescript
import { SchemaTable } from '@linch-kit/ui/tables'
import type { SchemaTableProps } from '@linch-kit/ui/types'

interface SchemaTableProps extends BaseComponentProps {
  schema: UIEntityDefinition
  data: Array<Record<string, unknown>>
  onEdit?: (item: Record<string, unknown>) => void
  onDelete?: (item: Record<string, unknown>) => void
  onView?: (item: Record<string, unknown>) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
  sorting?: {
    field: string
    direction: 'asc' | 'desc'
    onSort: (field: string, direction: 'asc' | 'desc') => void
  }
  filtering?: {
    filters: Record<string, unknown>
    onFilter: (filters: Record<string, unknown>) => void
  }
}

// 使用示例
<SchemaTable
  schema={userSchema}
  data={users}
  onEdit={(user) => console.log('编辑用户:', user)}
  onDelete={(user) => console.log('删除用户:', user)}
  pagination={{
    page: 1,
    pageSize: 10,
    total: 100,
    onPageChange: (page) => setPage(page)
  }}
  sorting={{
    field: 'name',
    direction: 'asc',
    onSort: (field, direction) => handleSort(field, direction)
  }}
/>
```

### 4. 基础UI组件 (`components`)

#### shadcn/ui 组件集

```typescript
// 导入方式
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  // ... 更多组件
} from '@linch-kit/ui/components'

// 按需导入
import { Button } from '@linch-kit/ui/components/ui/button'
import { Card } from '@linch-kit/ui/components/ui/card'
```

#### 可用组件列表

- **布局**: Card, Separator, Sheet, Sidebar
- **表单**: Button, Input, Label, Select, Switch, Textarea
- **导航**: Breadcrumb, Tabs, Dropdown Menu
- **反馈**: Alert, Toast, Tooltip, Progress, Skeleton
- **数据展示**: Avatar, Badge, Table, Accordion, Collapsible
- **高级交互**: Dialog, Popover

#### UI Hook

```typescript
import { useToast, useMobile } from '@linch-kit/ui/components'

// Toast Hook
const { toast } = useToast()
toast({
  title: '成功',
  description: '操作已完成',
  variant: 'default',
})

// 移动端检测Hook
const isMobile = useMobile()
```

### 5. 工具函数 (`utils`)

#### 样式合并工具

```typescript
import { cn } from '@linch-kit/ui/utils'

// 合并Tailwind CSS类名
const className = cn('base-class', condition && 'conditional-class', 'override-class')
```

### 6. 类型定义 (`types`)

#### 核心类型

```typescript
import type {
  BaseComponentProps,
  UIEntityDefinition,
  SchemaFormProps,
  SchemaTableProps,
  FieldRendererProps,
  Variant,
  Size,
} from '@linch-kit/ui/types'

// 基础组件属性
interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

// UI实体定义
interface UIEntityDefinition extends EntityDefinition {
  displayName?: string
}

// 主题变体
type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

// 大小变体
type Size = 'default' | 'sm' | 'lg' | 'icon'
```

## 🎨 主题系统

### CSS变量定义

```css
:root {
  --primary: hsl(222.2 47.4% 11.2%);
  --primary-foreground: hsl(210 40% 98%);
  --secondary: hsl(210 40% 96%);
  --secondary-foreground: hsl(222.2 84% 4.9%);
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222.2 84% 4.9%);
  --border: hsl(214.3 31.8% 91.4%);
  --input: hsl(214.3 31.8% 91.4%);
  --ring: hsl(222.2 47.4% 11.2%);
  --radius: 0.5rem;
}

.dark {
  --primary: hsl(210 40% 98%);
  --primary-foreground: hsl(222.2 84% 4.9%);
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  /* ... 更多暗色主题变量 */
}
```

### 主题应用

```typescript
// 样式导入
import '@linch-kit/ui/styles/globals.css'

// 组件中使用
<div className="bg-background text-foreground border-border">
  <Button variant="default">主题按钮</Button>
</div>
```

## 🔌 插件系统

### UI插件集成

```typescript
import { uiPlugin } from '@linch-kit/ui'
import { PluginSystem } from '@linch-kit/core'

// 插件元数据
const uiPlugin: Plugin = {
  metadata: {
    id: '@linch-kit/ui',
    name: 'LinchKit UI Components',
    version: '1.0.0',
    description: 'LinchKit UI组件库 - Schema驱动的企业级React组件',
    dependencies: ['@linch-kit/core', 'tools/schema'],
  },
  // 生命周期方法
  async init() {
    /* 初始化逻辑 */
  },
  async setup() {
    /* 设置逻辑 */
  },
  async start() {
    /* 启动逻辑 */
  },
  async ready() {
    /* 就绪逻辑 */
  },
  async stop() {
    /* 停止逻辑 */
  },
  async destroy() {
    /* 销毁逻辑 */
  },
}

// 注册插件
const pluginSystem = new PluginSystem()
await pluginSystem.register(uiPlugin)
```

## 🌐 国际化支持

### 架构设计

UI包采用LinchKit统一的国际化架构：

- **统一基础设施**: 使用 `@linch-kit/core` 提供的国际化基础设施
- **包级命名空间**: 独立的UI翻译空间，避免与其他包冲突
- **传入翻译函数模式**: 宿主应用提供翻译函数，包使用统一接口
- **优雅回退机制**: 用户翻译 → 包默认翻译 → 系统消息

### 国际化实现

```typescript
// UI包国际化配置
const uiI18n = createPackageI18n({
  packageName: 'ui',
  defaultLocale: 'zh-CN', // 默认中文
  defaultMessages: {
    'zh-CN': {
      /* 中文翻译 */
    },
    en: {
      /* 英文翻译 */
    },
  },
})

// 获取翻译函数
export function useUITranslation() {
  const coreT = coreUseTranslation() // 获取用户提供的翻译函数
  return {
    t: uiI18n.getTranslation(coreT), // 结合用户翻译和默认翻译
  }
}
```

### 内置翻译

#### 中文翻译 (zh-CN)

```typescript
const zhCN = {
  // 表单相关
  'form.create': '创建',
  'form.update': '更新',
  'form.cancel': '取消',
  'form.submitting': '提交中...',
  'form.create_title': '创建{entity}',
  'form.edit_title': '编辑{entity}',
  'form.view_title': '查看{entity}',

  // 表格相关
  'table.actions': '操作',
  'table.view': '查看',
  'table.edit': '编辑',
  'table.delete': '删除',
  'table.confirm_delete': '确认删除吗？',
  'table.search': '搜索...',
  'table.no_data': '暂无数据',
  'table.showing': '显示',
  'table.of': '共',
  'table.entries': '条',
  'table.page': '第',
  'table.previous': '上一页',
  'table.next': '下一页',

  // 通用
  'common.yes': '是',
  'common.no': '否',
}
```

#### 英文翻译 (en)

```typescript
const enUS = {
  // 表单相关
  'form.create': 'Create',
  'form.update': 'Update',
  'form.cancel': 'Cancel',
  'form.submitting': 'Submitting...',
  'form.create_title': 'Create {entity}',
  'form.edit_title': 'Edit {entity}',
  'form.view_title': 'View {entity}',

  // 表格相关
  'table.actions': 'Actions',
  'table.view': 'View',
  'table.edit': 'Edit',
  'table.delete': 'Delete',
  'table.confirm_delete': 'Are you sure to delete?',
  'table.search': 'Search...',
  'table.no_data': 'No data',
  'table.showing': 'Showing',
  'table.of': 'of',
  'table.entries': 'entries',
  'table.page': 'Page',
  'table.previous': 'Previous',
  'table.next': 'Next',

  // 通用
  'common.yes': 'Yes',
  'common.no': 'No',
}
```

### 宿主应用集成

```typescript
// 在宿主应用中提供翻译函数
import { PluginSystem } from '@linch-kit/core'
import { uiPlugin } from '@linch-kit/ui'

const pluginSystem = new PluginSystem()

// 注册UI插件
await pluginSystem.register(uiPlugin)

// 提供自定义翻译函数
const customTranslation = (key: string, params?: Record<string, unknown>) => {
  // 自定义翻译逻辑
  return translate(key, params)
}

// UI组件会自动使用宿主应用提供的翻译函数
```

## 📦 构建配置

### tsup 配置

```typescript
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/components/index.ts',
    'src/forms/index.ts',
    'src/tables/index.ts',
    'src/utils/index.ts',
    'src/components/ui/button.tsx',
    'src/components/ui/card.tsx',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@hookform/resolvers',
    '@linch-kit/core',
    '@linch-kit/platform',
    'tools/schema',
    'react-hook-form',
  ],
  treeshake: true,
  target: 'es2020',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    }
  },
})
```

## 🧪 测试和质量保证

### 测试配置

- **框架**: Vitest + @testing-library/react
- **覆盖率**: 目标 >80%
- **类型检查**: TypeScript 严格模式
- **代码质量**: ESLint + Prettier

### 命令

```bash
bun test          # 运行测试
bun test:ui       # 运行UI测试
bun test:coverage # 生成覆盖率报告
bun type-check    # 类型检查
bun lint          # 代码检查
bun build         # 构建
```

## 🔒 架构约束

### 设计原则

1. **单一职责**: 每个组件都有明确的职责边界
2. **依赖倒置**: 依赖抽象接口而非具体实现
3. **开闭原则**: 对扩展开放，对修改关闭
4. **组合优于继承**: 使用组合模式构建复杂组件

### 技术约束

1. **TypeScript严格模式**: 禁止使用 `any`，使用 `unknown` 替代
2. **React 19兼容**: 支持最新的React特性和API
3. **无状态组件**: 优先使用函数组件和Hook
4. **性能优化**: 合理使用 React.memo、useMemo、useCallback
5. **可访问性**: 遵循WAI-ARIA标准

### 依赖管理

1. **对等依赖**: React、react-dom、react-hook-form 作为 peerDependencies
2. **外部依赖**: 最小化第三方依赖，优先使用轻量级库
3. **版本锁定**: 关键依赖版本锁定，确保稳定性

## 🚀 最佳实践

### 组件开发

```typescript
// 1. 使用TypeScript严格类型
interface MyComponentProps {
  title: string
  onAction: (data: FormData) => void
  optional?: boolean
}

// 2. 使用forwardRef传递ref
const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ title, onAction, optional = false }, ref) => {
    return (
      <div ref={ref} className="my-component">
        <h2>{title}</h2>
        {optional && <span>Optional content</span>}
        <button onClick={() => onAction(new FormData())}>
          Action
        </button>
      </div>
    )
  }
)

// 3. 性能优化
const OptimizedComponent = React.memo(MyComponent)
```

### Schema驱动开发

```typescript
// 1. 定义Schema
const productSchema = {
  name: 'Product',
  displayName: '产品',
  fields: {
    name: { type: 'string', required: true, displayName: '产品名称' },
    price: { type: 'number', required: true, min: 0, displayName: '价格' },
    category: { type: 'enum', values: ['electronics', 'clothing', 'books'], displayName: '分类' },
    description: { type: 'text', displayName: '描述' },
    isActive: { type: 'boolean', displayName: '是否启用' }
  }
}

// 2. 自动生成表单
<SchemaForm
  schema={productSchema}
  onSubmit={handleSubmit}
  mode="create"
/>

// 3. 自动生成表格
<SchemaTable
  schema={productSchema}
  data={products}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### 样式开发

```typescript
// 1. 使用cn工具合并类名
const buttonClass = cn(
  "base-button-styles",
  variant === 'primary' && "primary-styles",
  size === 'lg' && "large-styles",
  disabled && "disabled-styles",
  className
)

// 2. 使用CSS变量
<div className="bg-primary text-primary-foreground border-border">
  主题相关内容
</div>

// 3. 响应式设计
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  响应式网格
</div>
```

## 📚 使用示例

### 完整CRUD示例

```typescript
import {
  SchemaForm,
  SchemaTable,
  useUITranslation
} from '@linch-kit/ui'

function UserManagement() {
  const { t } = useUITranslation()
  const [users, setUsers] = useState([])
  const [editingUser, setEditingUser] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const userSchema = {
    name: 'User',
    displayName: '用户',
    fields: {
      name: { type: 'string', required: true, displayName: '姓名' },
      email: { type: 'email', required: true, displayName: '邮箱' },
      role: { type: 'enum', values: ['admin', 'user'], displayName: '角色' },
      isActive: { type: 'boolean', displayName: '是否启用' }
    }
  }

  const handleSubmit = async (data) => {
    if (editingUser) {
      // 更新用户
      await updateUser(editingUser.id, data)
    } else {
      // 创建用户
      await createUser(data)
    }
    setShowForm(false)
    setEditingUser(null)
    // 重新加载数据
    loadUsers()
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleDelete = async (user) => {
    await deleteUser(user.id)
    loadUsers()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Button onClick={() => setShowForm(true)}>
          {t('form.create')}
        </Button>
      </div>

      <SchemaTable
        schema={userSchema}
        data={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pagination={{
          page: 1,
          pageSize: 10,
          total: users.length,
          onPageChange: (page) => setPage(page)
        }}
      />

      {showForm && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <SchemaForm
              schema={userSchema}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              initialData={editingUser}
              mode={editingUser ? 'edit' : 'create'}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
```

---

## 📖 相关文档

- [LinchKit Core API](./core.md) - 基础设施和插件系统
- [LinchKit Schema API](./schema.md) - Schema定义和验证
- [LinchKit Auth API](./auth.md) - 认证和权限控制
- [LinchKit CRUD API](./crud.md) - CRUD操作
- [LinchKit架构设计](../architecture/) - 整体架构设计
- [开发约束和规范](../core/workflow_and_constraints.md) - 开发规范

**版本**: 2.0.2  
**更新**: 2025-01-xx  
**状态**: ✅ 已完成API文档化
