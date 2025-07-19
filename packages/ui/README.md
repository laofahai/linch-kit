# @linch-kit/ui

LinchKit UI组件库 - Schema驱动的企业级React组件

## 🚀 特性

- **Schema驱动**: 基于LinchKit Schema自动生成表单和表格组件
- **企业级**: 内置权限控制、国际化、完整主题系统
- **现代化**: 基于shadcn/ui + Radix UI + Tailwind CSS构建
- **类型安全**: 100% TypeScript，端到端类型安全
- **可扩展**: 插件化架构，易于扩展和定制
- **主题系统**: 完整的主题管理，支持自定义主题和暗色模式

## 📦 安装

```bash
bun add @linch-kit/ui
```

## 🔧 依赖

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "@linch-kit/core": "workspace:*",
    "@linch-kit/schema": "workspace:*",
    "@linch-kit/crud": "workspace:*"
  }
}
```

## 📚 组件

### Schema驱动表单

```tsx
import { SchemaForm } from '@linch-kit/ui/forms'

const userSchema = {
  name: 'User',
  displayName: '用户',
  fields: {
    name: { type: 'string', displayName: '姓名', rules: { required: true } },
    email: { type: 'email', displayName: '邮箱', rules: { required: true } },
    age: { type: 'number', displayName: '年龄', rules: { min: 0, max: 150 } }
  }
}

<SchemaForm
  schema={userSchema}
  onSubmit={async (data) => {
    console.log('提交数据:', data)
  }}
  mode="create"
/>
```

### Schema驱动表格

```tsx
import { SchemaTable } from '@linch-kit/ui/tables'
;<SchemaTable
  schema={userSchema}
  data={users}
  onEdit={user => console.log('编辑用户:', user)}
  onDelete={user => console.log('删除用户:', user)}
  pagination={{
    page: 1,
    pageSize: 10,
    total: 100,
    onPageChange: page => setPage(page),
  }}
/>
```

### 基础组件

```tsx
import { Button, Input, Card } from '@linch-kit/ui/components'
;<Card>
  <Input placeholder="请输入..." />
  <Button variant="primary">提交</Button>
</Card>
```

## 🎨 主题系统

### 快速开始

```css
/* 导入完整主题系统 */
@import "tailwindcss";
@import "@linch-kit/ui/styles";
```

### 使用主题工具

```tsx
import { useTheme, createTheme } from '@linch-kit/ui'

function ThemeExample() {
  const { theme, mode, toggleMode } = useTheme()

  return (
    <div className="bg-primary text-primary-foreground p-4 rounded-theme">
      <h1>当前主题: {theme.displayName}</h1>
      <button 
        onClick={toggleMode}
        className="bg-accent text-accent-foreground px-4 py-2 rounded-theme hover:bg-accent/90"
      >
        切换模式
      </button>
    </div>
  )
}
```

### 创建自定义主题

```typescript
import { createTheme } from '@linch-kit/ui'

const customTheme = createTheme({
  primary: '142 76% 36%',        // 森林绿
  accent: '39 100% 50%',         // 金黄色
  ring: '142 76% 36%',           // 聚焦环
})
```

### 主题实用类

- **背景**: `bg-primary`, `bg-secondary`, `bg-accent`, `bg-muted`
- **文字**: `text-primary-foreground`, `text-muted-foreground`
- **边框**: `border-border`, `border-primary`
- **圆角**: `rounded-theme`, `rounded-theme-lg`
- **透明度**: `bg-primary/50`, `text-primary/70`

详细文档请参考：[主题系统文档](../../ai-context/02_Guides/15_Theme_System_Guide.md)

## 🔌 插件集成

UI包作为LinchKit Core插件运行：

```tsx
import { uiPlugin } from '@linch-kit/ui'
import { PluginSystem } from '@linch-kit/core'

const pluginSystem = new PluginSystem()
await pluginSystem.register(uiPlugin)
```

## 📖 API文档

### SchemaForm Props

| 属性        | 类型                         | 描述         |
| ----------- | ---------------------------- | ------------ |
| schema      | UIEntityDefinition           | Schema定义   |
| onSubmit    | Function                     | 提交处理函数 |
| mode        | 'create' \| 'edit' \| 'view' | 表单模式     |
| initialData | Record<string, unknown>      | 初始数据     |

### SchemaTable Props

| 属性       | 类型                           | 描述         |
| ---------- | ------------------------------ | ------------ |
| schema     | UIEntityDefinition             | Schema定义   |
| data       | Array<Record<string, unknown>> | 表格数据     |
| onEdit     | Function                       | 编辑处理函数 |
| onDelete   | Function                       | 删除处理函数 |
| pagination | Object                         | 分页配置     |

## 🧪 开发

```bash
# 安装依赖
bun install

# 开发模式
bun dev

# 构建
bun build

# 测试
bun test

# 代码检查
bun lint

# 类型检查
bun type-check
```

## 📄 License

MIT License
