# UI 包模块扩展架构实施计划

## 🎯 目标
实施 UI 包的模块扩展功能，通过 TypeScript 模块扩展机制将复杂的 UI 类型从 Schema 包中分离出来，提升构建性能的同时保持功能完整性。

## 📋 当前状态分析

### 已有基础
- `packages/ui/src/schema/field-config-extensions.ts` 文件已存在
- 基础的模块扩展结构已定义
- UI 类型定义已从 Schema 包分离

### 需要完善的部分
1. **完整的 UI 类型定义**
2. **运行时类型验证**
3. **组件集成机制**
4. **文档和示例**

## 🛠️ 实施方案

### 阶段 1：完善 UI 类型定义系统

#### 1.1 扩展 TableFieldConfig
```typescript
// packages/ui/src/schema/table-field-config.ts
export interface TableFieldConfig {
  /** 是否在表格中显示 */
  visible?: boolean
  /** 列宽度 */
  width?: number | string
  /** 列对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 是否可排序 */
  sortable?: boolean
  /** 是否可筛选 */
  filterable?: boolean
  /** 自定义渲染器 */
  render?: 'text' | 'number' | 'date' | 'boolean' | 'image' | 'link' | 'custom'
  /** 自定义渲染函数 */
  renderFunction?: (value: any, record: any) => React.ReactNode
  /** 列固定位置 */
  fixed?: 'left' | 'right'
  /** 列分组 */
  group?: string
}
```

#### 1.2 扩展 FormFieldConfig
```typescript
// packages/ui/src/schema/form-field-config.ts
export interface FormFieldConfig {
  /** 表单控件类型 */
  component?: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'upload' | 'custom'
  /** 控件属性 */
  props?: Record<string, any>
  /** 验证规则 */
  rules?: ValidationRule[]
  /** 字段依赖 */
  dependencies?: string[]
  /** 条件显示 */
  when?: (values: any) => boolean
  /** 字段布局 */
  layout?: {
    span?: number
    offset?: number
    labelCol?: { span: number }
    wrapperCol?: { span: number }
  }
  /** 字段分组 */
  group?: string
  /** 字段顺序 */
  order?: number
}
```

#### 1.3 扩展 PermissionFieldConfig
```typescript
// packages/ui/src/schema/permission-field-config.ts
export interface PermissionFieldConfig {
  /** 查看权限 */
  read?: string | string[] | ((user: any, context: any) => boolean)
  /** 编辑权限 */
  write?: string | string[] | ((user: any, context: any) => boolean)
  /** 字段级别的权限检查 */
  check?: (user: any, action: 'read' | 'write', context: any) => Promise<boolean>
  /** 权限不足时的行为 */
  onDenied?: 'hide' | 'disable' | 'readonly'
  /** 权限不足时的提示信息 */
  deniedMessage?: string
}
```

### 阶段 2：实现运行时类型验证

#### 2.1 创建类型验证器
```typescript
// packages/ui/src/schema/validators.ts
export function validateTableFieldConfig(config: any): config is TableFieldConfig {
  return (
    typeof config === 'object' &&
    (config.visible === undefined || typeof config.visible === 'boolean') &&
    (config.width === undefined || typeof config.width === 'number' || typeof config.width === 'string') &&
    (config.align === undefined || ['left', 'center', 'right'].includes(config.align))
    // ... 其他验证逻辑
  )
}

export function validateFormFieldConfig(config: any): config is FormFieldConfig {
  return (
    typeof config === 'object' &&
    (config.component === undefined || 
     ['input', 'textarea', 'select', 'checkbox', 'radio', 'date', 'upload', 'custom'].includes(config.component))
    // ... 其他验证逻辑
  )
}
```

#### 2.2 集成到 Schema 包
```typescript
// packages/ui/src/schema/integration.ts
import { registerFieldConfigValidator } from '@linch-kit/schema'

// 注册 UI 相关的字段配置验证器
registerFieldConfigValidator('table', validateTableFieldConfig)
registerFieldConfigValidator('form', validateFormFieldConfig)
registerFieldConfigValidator('permissions', validatePermissionFieldConfig)
```

### 阶段 3：组件集成机制

#### 3.1 创建字段渲染器工厂
```typescript
// packages/ui/src/components/field-renderer-factory.ts
export interface FieldRendererProps {
  value: any
  field: any
  config: any
  onChange?: (value: any) => void
  readonly?: boolean
}

export class FieldRendererFactory {
  private renderers = new Map<string, React.ComponentType<FieldRendererProps>>()

  register(type: string, component: React.ComponentType<FieldRendererProps>) {
    this.renderers.set(type, component)
  }

  render(type: string, props: FieldRendererProps) {
    const Renderer = this.renderers.get(type)
    if (!Renderer) {
      console.warn(`No renderer found for field type: ${type}`)
      return <DefaultFieldRenderer {...props} />
    }
    return <Renderer {...props} />
  }
}

export const fieldRendererFactory = new FieldRendererFactory()
```

#### 3.2 创建表格列生成器
```typescript
// packages/ui/src/components/table-column-generator.ts
export function generateTableColumns(entity: Entity): ColumnType[] {
  const columns: ColumnType[] = []
  
  for (const [fieldName, fieldSchema] of Object.entries(entity.schema.shape)) {
    const fieldMeta = getFieldMetadata(fieldSchema)
    const tableConfig = fieldMeta?.table
    
    if (tableConfig?.visible !== false) {
      columns.push({
        title: fieldMeta?.label || fieldName,
        dataIndex: fieldName,
        key: fieldName,
        width: tableConfig?.width,
        align: tableConfig?.align,
        sorter: tableConfig?.sortable,
        render: (value, record) => {
          if (tableConfig?.renderFunction) {
            return tableConfig.renderFunction(value, record)
          }
          return fieldRendererFactory.render(tableConfig?.render || 'text', {
            value,
            field: fieldSchema,
            config: tableConfig,
            readonly: true
          })
        }
      })
    }
  }
  
  return columns
}
```

#### 3.3 创建表单字段生成器
```typescript
// packages/ui/src/components/form-field-generator.ts
export function generateFormFields(entity: Entity): FormFieldType[] {
  const fields: FormFieldType[] = []
  
  for (const [fieldName, fieldSchema] of Object.entries(entity.schema.shape)) {
    const fieldMeta = getFieldMetadata(fieldSchema)
    const formConfig = fieldMeta?.form
    
    if (formConfig?.component !== 'hidden') {
      fields.push({
        name: fieldName,
        label: fieldMeta?.label || fieldName,
        component: formConfig?.component || 'input',
        rules: formConfig?.rules || [],
        dependencies: formConfig?.dependencies,
        when: formConfig?.when,
        layout: formConfig?.layout,
        render: (props) => fieldRendererFactory.render(
          formConfig?.component || 'input',
          {
            ...props,
            field: fieldSchema,
            config: formConfig
          }
        )
      })
    }
  }
  
  return fields.sort((a, b) => (a.order || 0) - (b.order || 0))
}
```

### 阶段 4：高级功能实现

#### 4.1 权限集成
```typescript
// packages/ui/src/components/permission-wrapper.tsx
export interface PermissionWrapperProps {
  children: React.ReactNode
  permission: PermissionFieldConfig
  user: any
  context: any
  action: 'read' | 'write'
}

export function PermissionWrapper({ 
  children, 
  permission, 
  user, 
  context, 
  action 
}: PermissionWrapperProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  
  useEffect(() => {
    checkPermission(permission, user, action, context)
      .then(setHasPermission)
      .catch(() => setHasPermission(false))
  }, [permission, user, action, context])
  
  if (hasPermission === null) {
    return <Skeleton />
  }
  
  if (!hasPermission) {
    switch (permission.onDenied) {
      case 'hide':
        return null
      case 'disable':
        return <div style={{ opacity: 0.5, pointerEvents: 'none' }}>{children}</div>
      case 'readonly':
        return <div style={{ pointerEvents: 'none' }}>{children}</div>
      default:
        return <div title={permission.deniedMessage}>{children}</div>
    }
  }
  
  return <>{children}</>
}
```

#### 4.2 动态表单生成
```typescript
// packages/ui/src/components/dynamic-form.tsx
export interface DynamicFormProps {
  entity: Entity
  initialValues?: any
  onSubmit: (values: any) => void
  mode?: 'create' | 'edit' | 'view'
  user?: any
  context?: any
}

export function DynamicForm({ 
  entity, 
  initialValues, 
  onSubmit, 
  mode = 'create',
  user,
  context 
}: DynamicFormProps) {
  const [form] = Form.useForm()
  const fields = generateFormFields(entity)
  
  return (
    <Form
      form={form}
      initialValues={initialValues}
      onFinish={onSubmit}
      layout="vertical"
    >
      {fields.map(field => (
        <PermissionWrapper
          key={field.name}
          permission={field.permission || {}}
          user={user}
          context={context}
          action={mode === 'view' ? 'read' : 'write'}
        >
          <Form.Item
            name={field.name}
            label={field.label}
            rules={field.rules}
            dependencies={field.dependencies}
            {...field.layout}
          >
            {field.render({
              value: form.getFieldValue(field.name),
              onChange: (value) => form.setFieldValue(field.name, value),
              readonly: mode === 'view'
            })}
          </Form.Item>
        </PermissionWrapper>
      ))}
      
      {mode !== 'view' && (
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {mode === 'create' ? '创建' : '更新'}
          </Button>
        </Form.Item>
      )}
    </Form>
  )
}
```

## 🔄 实施步骤

### 步骤 1：类型定义完善 (1-2 天)
1. 完善所有 UI 类型定义
2. 创建类型验证器
3. 更新模块扩展文件

### 步骤 2：组件集成 (2-3 天)
1. 实现字段渲染器工厂
2. 创建表格和表单生成器
3. 集成权限系统

### 步骤 3：高级功能 (2-3 天)
1. 实现动态组件生成
2. 添加权限包装器
3. 创建完整的示例

### 步骤 4：测试和文档 (1-2 天)
1. 单元测试和集成测试
2. 性能测试
3. 文档和示例更新

## ✅ 成功标准

### 功能标准
- 完整的 UI 类型扩展系统
- 动态组件生成功能
- 权限集成机制
- 类型安全性保证

### 性能标准
- Schema 包 DTS 构建时间不受影响
- UI 包构建时间 < 15 秒
- 运行时性能良好

### 开发体验标准
- IDE 智能提示完全可用
- 类型错误提示准确
- 文档完整易懂
