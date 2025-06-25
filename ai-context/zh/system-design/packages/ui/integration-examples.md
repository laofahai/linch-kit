# @linch-kit/ui 集成示例

## 基础集成

### 1. Next.js 应用集成

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { LinchKitUIProvider } from '@linch-kit/ui';
import '@linch-kit/ui/dist/styles.css';

// 自定义主题
const customTheme = {
  colors: {
    primary: '#1890ff',
    secondary: '#722ed1'
  }
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LinchKitUIProvider 
      theme={customTheme}
      locale="zh-CN"
    >
      <Component {...pageProps} />
    </LinchKitUIProvider>
  );
}

export default MyApp;
```

```tsx
// pages/index.tsx
import { Layout, Card, Button, SchemaForm } from '@linch-kit/ui';

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名', minLength: 2 },
    email: { type: 'string', format: 'email', title: '邮箱' },
    age: { type: 'number', minimum: 0, maximum: 150, title: '年龄' },
    gender: {
      type: 'string',
      title: '性别',
      enum: ['male', 'female', 'other'],
      enumNames: ['男', '女', '其他']
    }
  },
  required: ['name', 'email']
};

export default function Home() {
  const handleSubmit = (data: any) => {
    console.log('Form data:', data);
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card title="用户注册">
          <SchemaForm
            schema={userSchema}
            onSubmit={handleSubmit}
            layout="horizontal"
          />
        </Card>
      </div>
    </Layout>
  );
}
```

### 2. React 应用集成

```tsx
// src/App.tsx
import React from 'react';
import { LinchKitUIProvider, SchemaTable, toast } from '@linch-kit/ui';
import { trpc } from './utils/trpc';

const App: React.FC = () => {
  const { data: users, isLoading } = trpc.user.list.useQuery();

  const userSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', title: 'ID' },
      name: { type: 'string', title: '姓名' },
      email: { type: 'string', title: '邮箱' },
      role: { type: 'string', title: '角色' },
      createdAt: { type: 'string', format: 'date-time', title: '创建时间' }
    }
  };

  const handleAction = (action: string, record: any) => {
    switch (action) {
      case 'edit':
        toast.info(`编辑用户: ${record.name}`);
        break;
      case 'delete':
        toast.warning(`删除用户: ${record.name}`);
        break;
    }
  };

  return (
    <LinchKitUIProvider>
      <div className="p-8">
        <SchemaTable
          schema={userSchema}
          data={users || []}
          loading={isLoading}
          actions={[
            { key: 'edit', label: '编辑', icon: '✏️' },
            { key: 'delete', label: '删除', icon: '🗑️', danger: true }
          ]}
          onAction={handleAction}
        />
      </div>
    </LinchKitUIProvider>
  );
};

export default App;
```

### 3. Vite 项目集成

```tsx
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
});
```

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LinchKitUIProvider } from '@linch-kit/ui';
import App from './App';
import './index.css';
import '@linch-kit/ui/dist/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LinchKitUIProvider>
      <App />
    </LinchKitUIProvider>
  </React.StrictMode>
);
```

## Schema 驱动开发

### 1. 动态表单生成

```tsx
// components/DynamicForm.tsx
import React, { useState } from 'react';
import { SchemaForm, Card, Button } from '@linch-kit/ui';
import { schema } from '@linch-kit/schema';

interface DynamicFormProps {
  entityName: string;
  onSubmit: (data: any) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  entityName,
  onSubmit
}) => {
  const [formSchema, setFormSchema] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // 从后端获取 Schema
    schema.getEntitySchema(entityName)
      .then(setFormSchema)
      .finally(() => setLoading(false));
  }, [entityName]);

  if (loading) return <div>加载中...</div>;
  if (!formSchema) return <div>Schema 未找到</div>;

  return (
    <Card title={`创建 ${entityName}`}>
      <SchemaForm
        schema={formSchema}
        onSubmit={onSubmit}
        layout="vertical"
      />
    </Card>
  );
};
```

### 2. 智能表格

```tsx
// components/SmartTable.tsx
import React from 'react';
import { SchemaTable, useBreakpoint } from '@linch-kit/ui';
import { useQuery } from '@tanstack/react-query';

interface SmartTableProps {
  endpoint: string;
  schema: any;
  permissions?: string[];
}

export const SmartTable: React.FC<SmartTableProps> = ({
  endpoint,
  schema,
  permissions = []
}) => {
  const { sm, md, lg } = useBreakpoint();
  
  const { data, isLoading, error } = useQuery({
    queryKey: [endpoint],
    queryFn: () => fetch(endpoint).then(res => res.json())
  });

  // 根据屏幕大小调整显示的列
  const visibleColumns = React.useMemo(() => {
    const columns = Object.keys(schema.properties);
    
    if (!sm) {
      // 移动端只显示关键列
      return columns.slice(0, 2);
    } else if (!md) {
      // 平板显示更多列
      return columns.slice(0, 4);
    }
    // 桌面端显示所有列
    return columns;
  }, [sm, md, schema]);

  const filteredSchema = {
    ...schema,
    properties: Object.fromEntries(
      visibleColumns.map(col => [col, schema.properties[col]])
    )
  };

  const actions = [];
  if (permissions.includes('edit')) {
    actions.push({ key: 'edit', label: '编辑', icon: '✏️' });
  }
  if (permissions.includes('delete')) {
    actions.push({ key: 'delete', label: '删除', icon: '🗑️', danger: true });
  }

  if (error) return <div>加载失败</div>;

  return (
    <SchemaTable
      schema={filteredSchema}
      data={data || []}
      loading={isLoading}
      actions={actions}
      pagination={{
        pageSize: sm ? 10 : 5,
        showSizeChanger: lg
      }}
    />
  );
};
```

### 3. 条件渲染表单

```tsx
// components/ConditionalForm.tsx
import React, { useState } from 'react';
import { SchemaForm, Card } from '@linch-kit/ui';

const productSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: '产品名称' },
    type: {
      type: 'string',
      title: '产品类型',
      enum: ['physical', 'digital', 'service'],
      enumNames: ['实物商品', '数字商品', '服务']
    }
  },
  required: ['name', 'type'],
  dependencies: {
    type: {
      oneOf: [
        {
          properties: {
            type: { enum: ['physical'] },
            weight: { type: 'number', title: '重量(kg)' },
            dimensions: {
              type: 'object',
              title: '尺寸',
              properties: {
                length: { type: 'number', title: '长(cm)' },
                width: { type: 'number', title: '宽(cm)' },
                height: { type: 'number', title: '高(cm)' }
              }
            }
          }
        },
        {
          properties: {
            type: { enum: ['digital'] },
            fileSize: { type: 'number', title: '文件大小(MB)' },
            downloadUrl: { type: 'string', format: 'uri', title: '下载链接' }
          }
        },
        {
          properties: {
            type: { enum: ['service'] },
            duration: { type: 'number', title: '服务时长(小时)' },
            maxParticipants: { type: 'number', title: '最大参与人数' }
          }
        }
      ]
    }
  }
};

export const ConditionalForm: React.FC = () => {
  const [formData, setFormData] = useState({});

  const handleSubmit = (data: any) => {
    console.log('提交数据:', data);
    setFormData(data);
  };

  return (
    <div className="space-y-4">
      <Card title="创建产品">
        <SchemaForm
          schema={productSchema}
          onSubmit={handleSubmit}
        />
      </Card>
      
      {Object.keys(formData).length > 0 && (
        <Card title="提交的数据">
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
};
```

## 主题定制

### 1. 企业品牌主题

```tsx
// themes/corporate.ts
import { createTheme } from '@linch-kit/ui';

export const corporateTheme = createTheme({
  colors: {
    primary: '#003366',
    secondary: '#006699',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    
    // 自定义颜色
    brand: {
      blue: '#003366',
      lightBlue: '#0066cc',
      gray: '#666666',
      lightGray: '#f5f5f5'
    }
  },
  
  typography: {
    fontFamily: {
      sans: ['Helvetica Neue', 'Arial', 'sans-serif'],
      display: ['Georgia', 'serif']
    },
    fontSize: {
      base: ['16px', '24px'],
      lg: ['18px', '28px']
    }
  },
  
  spacing: {
    unit: 8,
    page: {
      padding: 24,
      maxWidth: 1200
    }
  },
  
  components: {
    button: {
      borderRadius: '4px',
      fontWeight: 600,
      textTransform: 'uppercase'
    },
    card: {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderRadius: '8px'
    }
  }
});
```

```tsx
// App.tsx
import { LinchKitUIProvider, Layout } from '@linch-kit/ui';
import { corporateTheme } from './themes/corporate';

function App() {
  return (
    <LinchKitUIProvider theme={corporateTheme}>
      <Layout>
        {/* 应用内容 */}
      </Layout>
    </LinchKitUIProvider>
  );
}
```

### 2. 深色模式切换

```tsx
// components/ThemeToggle.tsx
import React from 'react';
import { Button, useTheme } from '@linch-kit/ui';
import { darkTheme, defaultTheme } from '@linch-kit/ui/themes';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme.colors.background === darkTheme.colors.background;

  const toggleTheme = () => {
    setTheme(isDark ? defaultTheme : darkTheme);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      icon={isDark ? '☀️' : '🌙'}
    >
      {isDark ? '浅色' : '深色'}
    </Button>
  );
};
```

### 3. 动态主题生成

```tsx
// components/ThemeCustomizer.tsx
import React, { useState } from 'react';
import { Card, Input, Button, createTheme, useTheme } from '@linch-kit/ui';

export const ThemeCustomizer: React.FC = () => {
  const { setTheme } = useTheme();
  const [colors, setColors] = useState({
    primary: '#1890ff',
    secondary: '#722ed1',
    success: '#52c41a',
    error: '#ff4d4f'
  });

  const handleColorChange = (colorName: string, value: string) => {
    setColors(prev => ({ ...prev, [colorName]: value }));
  };

  const applyTheme = () => {
    const customTheme = createTheme({
      colors: {
        ...colors,
        // 自动生成相关颜色
        primaryForeground: '#ffffff',
        secondaryForeground: '#ffffff',
        successForeground: '#ffffff',
        errorForeground: '#ffffff'
      }
    });
    
    setTheme(customTheme);
  };

  return (
    <Card title="主题定制">
      <div className="space-y-4">
        {Object.entries(colors).map(([name, value]) => (
          <div key={name} className="flex items-center space-x-4">
            <label className="w-24">{name}</label>
            <Input
              type="color"
              value={value}
              onChange={(e) => handleColorChange(name, e.target.value)}
            />
            <span className="text-sm text-gray-500">{value}</span>
          </div>
        ))}
        <Button onClick={applyTheme}>应用主题</Button>
      </div>
    </Card>
  );
};
```

## 高级组件集成

### 1. 数据网格与编辑

```tsx
// components/EditableDataGrid.tsx
import React, { useState } from 'react';
import { SchemaTable, Modal, SchemaForm, toast } from '@linch-kit/ui';

interface EditableDataGridProps {
  schema: any;
  data: any[];
  onSave: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditableDataGrid: React.FC<EditableDataGridProps> = ({
  schema,
  data,
  onSave,
  onDelete
}) => {
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (record: any) => {
    if (window.confirm(`确定删除 ${record.name || record.id}？`)) {
      try {
        await onDelete(record.id);
        toast.success('删除成功');
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await onSave({ ...editingRecord, ...formData });
      toast.success('保存成功');
      setIsModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SchemaTable
        schema={schema}
        data={data}
        actions={[
          {
            key: 'edit',
            label: '编辑',
            icon: '✏️',
            onClick: handleEdit
          },
          {
            key: 'delete',
            label: '删除',
            icon: '🗑️',
            danger: true,
            onClick: handleDelete
          }
        ]}
      />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="编辑记录"
        width={600}
      >
        <SchemaForm
          schema={schema}
          data={editingRecord}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </Modal>
    </>
  );
};
```

### 2. 文件上传集成

```tsx
// components/FileUploadForm.tsx
import React, { useState } from 'react';
import { Card, Button, Progress, toast } from '@linch-kit/ui';

interface FileUploadFormProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // MB
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
  onUpload,
  accept = '*',
  multiple = false,
  maxSize = 10
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // 验证文件大小
    const oversizedFiles = selectedFiles.filter(
      file => file.size > maxSize * 1024 * 1024
    );
    
    if (oversizedFiles.length > 0) {
      toast.error(`文件大小不能超过 ${maxSize}MB`);
      return;
    }
    
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.warning('请选择文件');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 模拟上传进度
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(files);
      
      clearInterval(interval);
      setProgress(100);
      toast.success('上传成功');
      setFiles([]);
    } catch (error) {
      toast.error('上传失败');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card title="文件上传">
      <div className="space-y-4">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        
        <label htmlFor="file-input">
          <Button as="span" variant="outline">
            选择文件
          </Button>
        </label>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">已选择的文件：</h4>
            {files.map((file, index) => (
              <div key={index} className="text-sm text-gray-600">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <Progress value={progress} className="w-full" />
        )}

        <Button
          onClick={handleUpload}
          loading={uploading}
          disabled={files.length === 0}
        >
          开始上传
        </Button>
      </div>
    </Card>
  );
};
```

### 3. 实时协作组件

```tsx
// components/CollaborativeEditor.tsx
import React, { useState, useEffect } from 'react';
import { Card, Avatar, Badge, useToast } from '@linch-kit/ui';
import { trpc } from '../utils/trpc';

interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

interface CollaborativeEditorProps {
  documentId: string;
  content: string;
  onContentChange: (content: string) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  content,
  onContentChange
}) => {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [localContent, setLocalContent] = useState(content);
  const { toast } = useToast();

  // 订阅文档更新
  trpc.collaboration.onDocumentUpdate.useSubscription(
    { documentId },
    {
      onData: (update) => {
        if (update.type === 'content') {
          setLocalContent(update.content);
          onContentChange(update.content);
        } else if (update.type === 'user_joined') {
          setActiveUsers(prev => [...prev, update.user]);
          toast.info(`${update.user.name} 加入协作`);
        } else if (update.type === 'user_left') {
          setActiveUsers(prev => prev.filter(u => u.id !== update.userId));
        }
      }
    }
  );

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    
    // 发送更新到服务器
    trpc.collaboration.updateDocument.mutate({
      documentId,
      content: newContent
    });
  };

  return (
    <Card
      title="协作编辑器"
      extra={
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {activeUsers.length} 人在线
          </span>
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map(user => (
              <Avatar
                key={user.id}
                src={user.avatar}
                alt={user.name}
                style={{ borderColor: user.color }}
                className="border-2"
              />
            ))}
            {activeUsers.length > 3 && (
              <Badge count={`+${activeUsers.length - 3}`} />
            )}
          </div>
        </div>
      }
    >
      <textarea
        value={localContent}
        onChange={handleContentChange}
        className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="开始输入..."
      />
      
      <div className="mt-4 flex flex-wrap gap-2">
        {activeUsers.map(user => (
          <div
            key={user.id}
            className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm"
            style={{ backgroundColor: `${user.color}20`, color: user.color }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: user.color }}
            />
            <span>{user.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
```

## 可访问性增强

### 1. 键盘导航支持

```tsx
// components/AccessibleMenu.tsx
import React, { useRef, useState } from 'react';
import { Card, Button } from '@linch-kit/ui';

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
}

interface AccessibleMenuProps {
  items: MenuItem[];
}

export const AccessibleMenu: React.FC<AccessibleMenuProps> = ({ items }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        items[focusedIndex].action();
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
    }
  };

  return (
    <Card title="可访问菜单">
      <div
        ref={menuRef}
        role="menu"
        onKeyDown={handleKeyDown}
        className="space-y-2"
      >
        {items.map((item, index) => (
          <Button
            key={item.id}
            role="menuitem"
            variant={focusedIndex === index ? 'primary' : 'ghost'}
            onClick={item.action}
            onFocus={() => setFocusedIndex(index)}
            tabIndex={focusedIndex === index ? 0 : -1}
            className="w-full justify-start"
            icon={item.icon}
          >
            {item.label}
          </Button>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        提示：使用方向键导航，Enter 或空格键选择
      </div>
    </Card>
  );
};
```

### 2. 屏幕阅读器支持

```tsx
// components/ScreenReaderTable.tsx
import React from 'react';
import { Table } from '@linch-kit/ui';

interface ScreenReaderTableProps {
  data: any[];
  columns: any[];
}

export const ScreenReaderTable: React.FC<ScreenReaderTableProps> = ({
  data,
  columns
}) => {
  return (
    <div role="region" aria-label="数据表格">
      <Table
        data={data}
        columns={columns}
        aria-label="用户数据表"
        summary="显示系统中所有用户的详细信息"
        renderRow={(record, index) => ({
          'aria-rowindex': index + 2, // +1 for header, +1 for 1-based index
          'aria-label': `用户 ${record.name} 的信息`
        })}
        renderCell={(value, column) => ({
          'aria-label': `${column.title}: ${value}`
        })}
      />
      
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        共 {data.length} 条记录
      </div>
    </div>
  );
};
```

这些集成示例展示了如何在实际项目中使用 @linch-kit/ui，涵盖了基础集成、Schema 驱动开发、主题定制、高级组件和可访问性等关键场景。