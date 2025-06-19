# @linch-kit/ui

现代化的 React UI 组件库，基于 Tailwind CSS 和 Radix UI，提供类型安全的组件系统。

## 📦 安装

```bash
npm install @linch-kit/ui
# 或
pnpm add @linch-kit/ui
# 或
yarn add @linch-kit/ui
```

## 🚀 特性

- 🎨 **现代设计** - 基于最新设计系统
- 🔒 **类型安全** - 完整的 TypeScript 支持
- 🎯 **可访问性** - 基于 Radix UI 的无障碍组件
- 🎨 **可定制** - 基于 Tailwind CSS 的主题系统
- 📱 **响应式** - 移动端优先的响应式设计
- 🤖 **AI-First** - 为 AI 辅助开发优化

## 📖 使用方式

### 基础组件

```tsx
import {
  Button,
  Input,
  Card,
  Dialog,
  Form,
  Table
} from '@linch-kit/ui'

function App() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>用户信息</Card.Title>
      </Card.Header>
      <Card.Content>
        <Form>
          <Input
            label="姓名"
            placeholder="请输入姓名"
            required
          />
          <Input
            label="邮箱"
            type="email"
            placeholder="请输入邮箱"
            required
          />
          <Button type="submit">
            保存
          </Button>
        </Form>
      </Card.Content>
    </Card>
  )
}
```

### 表单组件

```tsx
import { Form, useForm } from '@linch-kit/ui'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
  age: z.number().min(18, '年龄必须大于18岁')
})

function UserForm() {
  const form = useForm({
    schema: userSchema,
    defaultValues: {
      name: '',
      email: '',
      age: 18
    }
  })

  return (
    <Form form={form} onSubmit={(data) => console.log(data)}>
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
      
      <Form.Field name="age">
        <Form.Label>年龄</Form.Label>
        <Form.Input type="number" />
        <Form.Message />
      </Form.Field>
      
      <Form.Submit>提交</Form.Submit>
    </Form>
  )
}
```

### 数据表格

```tsx
import { Table, useTable } from '@linch-kit/ui'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}

function UserTable() {
  const table = useTable<User>({
    columns: [
      {
        key: 'name',
        title: '姓名',
        sortable: true
      },
      {
        key: 'email',
        title: '邮箱',
        sortable: true
      },
      {
        key: 'role',
        title: '角色',
        render: (value) => (
          <Badge variant={value === 'admin' ? 'primary' : 'secondary'}>
            {value}
          </Badge>
        )
      },
      {
        key: 'createdAt',
        title: '创建时间',
        render: (value) => new Date(value).toLocaleDateString()
      },
      {
        key: 'actions',
        title: '操作',
        render: (_, record) => (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              编辑
            </Button>
            <Button size="sm" variant="destructive">
              删除
            </Button>
          </div>
        )
      }
    ],
    data: users,
    pagination: true,
    search: true,
    filters: [
      {
        key: 'role',
        title: '角色',
        options: [
          { label: '管理员', value: 'admin' },
          { label: '用户', value: 'user' }
        ]
      }
    ]
  })

  return <Table table={table} />
}
```

## 📚 组件列表

### 基础组件

- **Button** - 按钮组件
- **Input** - 输入框组件
- **Textarea** - 文本域组件
- **Select** - 选择器组件
- **Checkbox** - 复选框组件
- **Radio** - 单选框组件
- **Switch** - 开关组件

### 布局组件

- **Card** - 卡片组件
- **Container** - 容器组件
- **Grid** - 网格布局
- **Flex** - 弹性布局
- **Stack** - 堆叠布局

### 反馈组件

- **Alert** - 警告提示
- **Toast** - 消息提示
- **Modal** - 模态框
- **Dialog** - 对话框
- **Popover** - 弹出框
- **Tooltip** - 工具提示

### 数据展示

- **Table** - 数据表格
- **List** - 列表组件
- **Badge** - 徽章组件
- **Avatar** - 头像组件
- **Progress** - 进度条
- **Skeleton** - 骨架屏

### 导航组件

- **Menu** - 菜单组件
- **Breadcrumb** - 面包屑
- **Tabs** - 标签页
- **Pagination** - 分页组件

## 🎨 主题定制

### 使用主题

```tsx
import { ThemeProvider, createTheme } from '@linch-kit/ui'

const theme = createTheme({
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    }
  },
  fonts: {
    sans: ['Inter', 'sans-serif']
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem'
  }
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <YourApp />
    </ThemeProvider>
  )
}
```

### CSS 变量

```css
:root {
  --color-primary: 59 130 246;
  --color-secondary: 107 114 128;
  --color-success: 34 197 94;
  --color-warning: 245 158 11;
  --color-error: 239 68 68;
  
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --radius: 0.5rem;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
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
```

## 📄 许可证

MIT License

## 🔗 相关链接

- [Linch Kit 文档](https://github.com/linch-tech/linch-kit)
- [Storybook 文档](https://storybook.js.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Radix UI 文档](https://www.radix-ui.com/docs)
