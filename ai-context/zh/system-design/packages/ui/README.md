# @linch-kit/ui

LinchKit 的 UI 组件库，提供 Schema 驱动的企业级 React 组件。基于现代设计系统，支持主题定制、国际化和无障碍访问。

## 特性

- 🎨 **Schema 驱动**: 根据数据 Schema 自动生成表单和显示组件
- 🎭 **设计系统**: 基于现代设计原则的一致性组件
- 🌈 **主题定制**: 支持深色/浅色模式和自定义主题
- 🌍 **国际化**: 内置多语言支持
- ♿ **无障碍**: 符合 WCAG 2.1 AA 标准
- 📱 **响应式**: 适配各种屏幕尺寸
- 🔧 **TypeScript**: 完整的类型定义

## 安装

```bash
pnpm add @linch-kit/ui
```

## 快速开始

### 1. 基础设置

```tsx
import { LinchKitUIProvider } from '@linch-kit/ui';

function App() {
  return (
    <LinchKitUIProvider>
      <YourApp />
    </LinchKitUIProvider>
  );
}
```

### 2. 使用基础组件

```tsx
import { Button, Input, Card } from '@linch-kit/ui';

function Example() {
  return (
    <Card>
      <Input placeholder="输入内容" />
      <Button variant="primary">提交</Button>
    </Card>
  );
}
```

### 3. Schema 驱动组件

```tsx
import { SchemaForm, SchemaTable } from '@linch-kit/ui';

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名' },
    email: { type: 'string', format: 'email', title: '邮箱' },
    age: { type: 'number', minimum: 0, title: '年龄' }
  },
  required: ['name', 'email']
};

function UserForm() {
  return (
    <SchemaForm
      schema={userSchema}
      onSubmit={(data) => console.log(data)}
    />
  );
}
```

## 📁 文档导航

| 文档 | 状态 | 描述 |
|------|------|------|
| [实现指南](./implementation-guide.md) | ✅ 完成 | 组件架构和样式系统 |
| [集成示例](./integration-examples.md) | ✅ 完成 | Schema集成和使用示例 |

## API 参考

### 核心组件

#### LinchKitUIProvider

UI 库的根提供器，管理主题、国际化和全局配置。

```tsx
interface LinchKitUIProviderProps {
  theme?: Theme;
  locale?: string;
  rtl?: boolean;
  children: React.ReactNode;
}

<LinchKitUIProvider
  theme={customTheme}
  locale="zh-CN"
  rtl={false}
>
  {children}
</LinchKitUIProvider>
```

#### 基础组件

##### Button

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
}

<Button variant="primary" size="lg" loading={isLoading}>
  保存
</Button>
```

##### Input

```tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onChange?: (value: string) => void;
}

<Input
  placeholder="请输入邮箱"
  type="email"
  error={errors.email}
  onChange={setEmail}
/>
```

##### Card

```tsx
interface CardProps {
  title?: string;
  extra?: React.ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

<Card title="用户信息" extra={<Button>编辑</Button>}>
  <p>内容区域</p>
</Card>
```

##### Modal

```tsx
interface ModalProps {
  open: boolean;
  title?: string;
  width?: number;
  closable?: boolean;
  maskClosable?: boolean;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

<Modal
  open={isOpen}
  title="确认删除"
  onClose={() => setIsOpen(false)}
  footer={
    <>
      <Button onClick={() => setIsOpen(false)}>取消</Button>
      <Button variant="danger" onClick={handleDelete}>删除</Button>
    </>
  }
>
  <p>确定要删除这个项目吗？</p>
</Modal>
```

##### Table

```tsx
interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationConfig;
  selection?: SelectionConfig<T>;
  onRow?: (record: T) => RowProps;
}

interface Column<T> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: Filter[];
  width?: number;
  fixed?: 'left' | 'right';
}

<Table
  columns={columns}
  data={users}
  pagination={{
    current: page,
    pageSize: 10,
    total: totalCount,
    onChange: setPage
  }}
  selection={{
    type: 'checkbox',
    selectedRowKeys: selectedKeys,
    onChange: setSelectedKeys
  }}
/>
```

#### Schema 驱动组件

##### SchemaForm

根据 JSON Schema 自动生成表单。

```tsx
interface SchemaFormProps {
  schema: JSONSchema;
  data?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelWidth?: number;
}

<SchemaForm
  schema={schema}
  data={initialData}
  onSubmit={handleSubmit}
  layout="horizontal"
  labelWidth={100}
/>
```

##### SchemaTable

根据 Schema 生成数据表格。

```tsx
interface SchemaTableProps {
  schema: JSONSchema;
  data: any[];
  actions?: ActionConfig[];
  filters?: FilterConfig[];
  onAction?: (action: string, record: any) => void;
}

<SchemaTable
  schema={userSchema}
  data={users}
  actions={[
    { key: 'edit', label: '编辑', icon: 'edit' },
    { key: 'delete', label: '删除', icon: 'delete', danger: true }
  ]}
  onAction={handleAction}
/>
```

##### SchemaCard

根据 Schema 生成数据卡片。

```tsx
interface SchemaCardProps {
  schema: JSONSchema;
  data: any;
  layout?: 'vertical' | 'horizontal';
  actions?: ActionConfig[];
  onAction?: (action: string) => void;
}

<SchemaCard
  schema={userSchema}
  data={user}
  layout="horizontal"
  actions={[
    { key: 'edit', label: '编辑' }
  ]}
/>
```

### 主题系统

#### 主题配置

```tsx
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}
```

#### 自定义主题

```tsx
import { createTheme } from '@linch-kit/ui';

const customTheme = createTheme({
  colors: {
    primary: '#1890ff',
    secondary: '#722ed1',
    // ... 其他颜色
  },
  spacing: {
    unit: 8 // 基础间距单位
  }
});

<LinchKitUIProvider theme={customTheme}>
  {children}
</LinchKitUIProvider>
```

### Hooks

#### useTheme

```tsx
import { useTheme } from '@linch-kit/ui';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <div style={{ color: theme.colors.primary }}>
      主题颜色文本
    </div>
  );
}
```

#### useBreakpoint

```tsx
import { useBreakpoint } from '@linch-kit/ui';

function ResponsiveComponent() {
  const { sm, md, lg } = useBreakpoint();
  
  return (
    <div>
      {sm && <span>小屏幕</span>}
      {md && <span>中等屏幕</span>}
      {lg && <span>大屏幕</span>}
    </div>
  );
}
```

## 最佳实践

1. **一致性**: 使用统一的设计系统和组件
2. **可访问性**: 遵循 WCAG 标准，支持键盘导航
3. **性能**: 使用懒加载和代码分割
4. **主题**: 支持深色模式和自定义主题
5. **响应式**: 适配各种设备和屏幕尺寸

## License

MIT