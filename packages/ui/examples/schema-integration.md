# Schema 集成使用示例

本文档展示如何使用 @linch-kit/ui 的 Schema 集成功能，基于 @linch-kit/schema 的实体定义自动生成 UI 组件。

## 1. 定义实体 Schema

首先，使用 @linch-kit/schema 定义实体：

```typescript
import { defineEntity, defineField } from '@linch-kit/schema'
import { z } from 'zod'

// 定义用户实体
export const User = defineEntity('User', {
  id: defineField(z.string().uuid(), {
    primary: true,
    label: '用户ID',
    table: { width: 200, sortable: false },
    form: { type: 'text', readonly: true }
  }),
  
  name: defineField(z.string().min(1).max(50), {
    label: '姓名',
    placeholder: '请输入姓名',
    required: true,
    order: 1,
    table: { width: 150, sortable: true },
    form: { type: 'text', layout: { colSpan: 6 } }
  }),
  
  email: defineField(z.string().email(), {
    label: '邮箱',
    placeholder: '请输入邮箱地址',
    required: true,
    unique: true,
    order: 2,
    table: { width: 200, sortable: true, filterable: true },
    form: { type: 'email', layout: { colSpan: 6 } }
  }),
  
  age: defineField(z.number().int().min(0).max(120), {
    label: '年龄',
    placeholder: '请输入年龄',
    order: 3,
    table: { width: 80, align: 'center' },
    form: { type: 'number' }
  }),
  
  status: defineField(z.enum(['active', 'inactive', 'pending']), {
    label: '状态',
    order: 4,
    table: { 
      width: 100, 
      render: 'status',
      filterable: true 
    },
    form: { 
      type: 'select',
      options: [
        { label: '激活', value: 'active' },
        { label: '未激活', value: 'inactive' },
        { label: '待审核', value: 'pending' }
      ]
    }
  }),
  
  createdAt: defineField(z.date(), {
    label: '创建时间',
    createdAt: true,
    order: 5,
    table: { 
      width: 150, 
      render: 'datetime',
      sortable: true 
    },
    form: { type: 'date', readonly: true }
  })
})
```

## 2. 使用 Schema DataTable

```typescript
import React from 'react'
import { SchemaDataTable } from '@linch-kit/ui'
import { User } from './schemas/user'

function UserList() {
  const [users, setUsers] = React.useState([])
  const [loading, setLoading] = React.useState(false)

  return (
    <SchemaDataTable
      entity={User}
      data={users}
      loading={loading}
      
      // 自定义包含/排除字段
      exclude={['id']}
      
      // 自定义列配置
      customColumns={{
        name: {
          cell: ({ getValue }) => (
            <span className="font-medium">{getValue()}</span>
          )
        }
      }}
      
      // 操作回调
      onView={(user) => console.log('查看用户:', user)}
      onEdit={(user) => console.log('编辑用户:', user)}
      onDelete={(user) => console.log('删除用户:', user)}
      
      // DataTable 配置
      config={{
        searchable: true,
        searchColumn: 'name',
        selectable: true,
        pagination: {
          pageSize: 10
        }
      }}
    />
  )
}
```

## 3. 使用 Schema FormBuilder

```typescript
import React from 'react'
import { SchemaFormBuilder } from '@linch-kit/ui'
import { User } from './schemas/user'

function UserForm({ mode = 'create', initialData, onSubmit }) {
  return (
    <SchemaFormBuilder
      entity={User}
      mode={mode}
      defaultValues={initialData}
      onSubmit={onSubmit}
      
      // 根据模式排除字段
      exclude={mode === 'create' ? ['id', 'createdAt'] : ['createdAt']}
      
      // 自定义字段配置
      customFields={{
        email: {
          description: '邮箱地址将用于登录和通知'
        },
        status: {
          dependencies: [{
            field: 'age',
            condition: { gte: 18 },
            action: 'show'
          }]
        }
      }}
      
      // 字段分组
      groups={[
        {
          name: 'basic',
          label: '基本信息',
          fields: ['name', 'email', 'age']
        },
        {
          name: 'status',
          label: '状态信息',
          fields: ['status']
        }
      ]}
      
      submitText={mode === 'create' ? '创建用户' : '更新用户'}
    />
  )
}
```

## 4. 高级配置示例

### 4.1 自定义渲染函数

```typescript
// 在 DataTable 中自定义状态渲染
const statusRenderer = (value: string) => {
  const statusMap = {
    active: { label: '激活', color: 'green' },
    inactive: { label: '未激活', color: 'red' },
    pending: { label: '待审核', color: 'yellow' }
  }
  
  const status = statusMap[value]
  return (
    <span className={`px-2 py-1 rounded text-xs bg-${status.color}-100 text-${status.color}-800`}>
      {status.label}
    </span>
  )
}
```

### 4.2 异步选项加载

```typescript
// 在 Schema 定义中配置异步选项
department: defineField(z.string(), {
  label: '部门',
  form: {
    type: 'select',
    asyncOptions: {
      url: '/api/departments',
      valueField: 'id',
      labelField: 'name',
      searchParam: 'q'
    }
  }
})
```

### 4.3 字段依赖关系

```typescript
// 配置字段依赖
salary: defineField(z.number().optional(), {
  label: '薪资',
  form: {
    type: 'number',
    dependencies: [{
      field: 'position',
      condition: { in: ['manager', 'director'] },
      action: 'show'
    }]
  }
})
```

## 5. 国际化支持

Schema 集成完全支持国际化：

```typescript
import { setI18nConfig } from '@linch-kit/ui'

// 设置翻译函数
setI18nConfig({
  t: (key, params, fallback) => {
    // 你的翻译逻辑
    return translate(key, params) || fallback || key
  },
  locale: 'zh-CN'
})
```

## 6. 类型安全

所有 Schema 集成组件都提供完整的 TypeScript 类型支持：

```typescript
// 类型安全的数据处理
const handleUserSubmit = (data: z.infer<typeof User.schema>) => {
  // data 具有完整的类型信息
  console.log(data.name) // string
  console.log(data.age)  // number
  console.log(data.status) // 'active' | 'inactive' | 'pending'
}
```

## 7. 最佳实践

1. **字段配置分离**：将复杂的字段配置提取到单独的配置对象中
2. **渐进式增强**：先使用基本配置，再根据需要添加高级功能
3. **类型安全**：充分利用 TypeScript 的类型检查
4. **性能优化**：使用 React.memo 和 useMemo 优化渲染性能
5. **测试友好**：为自定义渲染函数和验证逻辑编写单元测试
