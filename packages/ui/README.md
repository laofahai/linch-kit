# @linch-kit/ui

LinchKit UI组件库 - Schema驱动的企业级React组件

## 🚀 特性

- **Schema驱动**: 基于LinchKit Schema自动生成表单和表格组件
- **企业级**: 内置权限控制、国际化、主题系统
- **现代化**: 基于shadcn/ui + Radix UI + Tailwind CSS构建
- **类型安全**: 100% TypeScript，端到端类型安全
- **可扩展**: 插件化架构，易于扩展和定制

## 📦 安装

```bash
pnpm add @linch-kit/ui
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
/>
```

### 基础组件

```tsx
import { Button, Input, Card } from '@linch-kit/ui/components'

<Card>
  <Input placeholder="请输入..." />
  <Button variant="primary">提交</Button>
</Card>
```

## 🎨 主题定制

组件支持通过Tailwind CSS变量进行主题定制：

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}
```

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

| 属性 | 类型 | 描述 |
|------|------|------|
| schema | UIEntityDefinition | Schema定义 |
| onSubmit | Function | 提交处理函数 |
| mode | 'create' \| 'edit' \| 'view' | 表单模式 |
| initialData | Record<string, unknown> | 初始数据 |

### SchemaTable Props

| 属性 | 类型 | 描述 |
|------|------|------|
| schema | UIEntityDefinition | Schema定义 |
| data | Array<Record<string, unknown>> | 表格数据 |
| onEdit | Function | 编辑处理函数 |
| onDelete | Function | 删除处理函数 |
| pagination | Object | 分页配置 |

## 🧪 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm type-check
```

## 📄 License

MIT License