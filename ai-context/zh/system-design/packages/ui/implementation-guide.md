# @linch-kit/ui 实现指南

## 概述

@linch-kit/ui 是 LinchKit 的 UI 组件库，提供 Schema 驱动的企业级 React 组件。基于 shadcn/ui 和现代设计系统，支持主题定制、国际化和无障碍访问。

## 核心架构

### 1. 项目结构

```
src/
├── components/           # 组件目录
│   ├── base/            # 基础组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── Modal/
│   ├── schema/          # Schema 驱动组件
│   │   ├── SchemaForm/
│   │   ├── SchemaTable/
│   │   └── SchemaCard/
│   ├── layout/          # 布局组件
│   │   ├── Layout/
│   │   ├── Grid/
│   │   └── Container/
│   └── feedback/        # 反馈组件
│       ├── Toast/
│       ├── Loading/
│       └── Alert/
├── hooks/               # React Hooks
├── context/             # React Context
├── themes/              # 主题系统
├── utils/               # 工具函数
├── types/               # 类型定义
└── index.ts             # 主导出
```

### 2. 核心导出

```typescript
// src/index.ts
export * from './components';
export * from './hooks';
export * from './context';
export * from './themes';
export * from './utils';
export * from './types';

// 主要导出
export {
  // Provider
  LinchKitUIProvider,
  
  // 基础组件
  Button,
  Input,
  Card,
  Modal,
  Table,
  
  // Schema 组件
  SchemaForm,
  SchemaTable,
  SchemaCard,
  
  // 布局组件
  Layout,
  Grid,
  Container,
  
  // Hooks
  useTheme,
  useBreakpoint,
  useModal,
  useToast,
  
  // 主题
  defaultTheme,
  darkTheme,
  createTheme,
  
  // 工具
  toast
} from './main';
```

## 组件实现

### 1. 基础组件 - Button

```typescript
// src/components/base/Button/Button.tsx
import React from 'react';
import { cn } from '../../../utils';
import { useTheme } from '../../../hooks';
import { ButtonProps } from './types';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  className,
  onClick,
  ...props
}) => {
  const theme = useTheme();
  
  const baseClasses = [
    'inline-flex items-center justify-center rounded-md font-medium',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ];
  
  const variantClasses = {
    primary: [
      'bg-primary text-primary-foreground hover:bg-primary/90',
      'focus:ring-primary'
    ],
    secondary: [
      'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      'focus:ring-secondary'
    ],
    outline: [
      'border border-input bg-background hover:bg-accent',
      'hover:text-accent-foreground focus:ring-primary'
    ],
    ghost: [
      'hover:bg-accent hover:text-accent-foreground',
      'focus:ring-primary'
    ],
    danger: [
      'bg-danger text-danger-foreground hover:bg-danger/90',
      'focus:ring-danger'
    ]
  };
  
  const sizeClasses = {
    sm: ['h-9 px-3 text-sm'],
    md: ['h-10 px-4 py-2'],
    lg: ['h-11 px-8 text-base']
  };
  
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
```

```typescript
// src/components/base/Button/types.ts
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}
```

### 2. Schema 驱动组件 - SchemaForm

```typescript
// src/components/schema/SchemaForm/SchemaForm.tsx
import React, { useState } from 'react';
import { JSONSchema7 } from 'json-schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { schema } from '@linch-kit/schema';
import { SchemaFormProps } from './types';
import { FormField } from './FormField';
import { Button } from '../../base/Button';

export const SchemaForm: React.FC<SchemaFormProps> = ({
  schema: jsonSchema,
  data,
  onSubmit,
  onCancel,
  loading = false,
  disabled = false,
  layout = 'vertical',
  labelWidth = 120
}) => {
  // 将 JSON Schema 转换为 Zod Schema
  const zodSchema = schema.jsonToZod(jsonSchema);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: data
  });
  
  const renderField = (key: string, fieldSchema: JSONSchema7) => {
    return (
      <FormField
        key={key}
        name={key}
        schema={fieldSchema}
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
        layout={layout}
        labelWidth={labelWidth}
        disabled={disabled}
      />
    );
  };
  
  const renderFields = (properties: Record<string, JSONSchema7>) => {
    return Object.entries(properties).map(([key, fieldSchema]) =>
      renderField(key, fieldSchema)
    );
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {jsonSchema.properties && renderFields(jsonSchema.properties as Record<string, JSONSchema7>)}
      
      <div className="flex space-x-2">
        <Button
          type="submit"
          loading={loading}
          disabled={disabled}
        >
          提交
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
        )}
      </div>
    </form>
  );
};
```

```typescript
// src/components/schema/SchemaForm/FormField.tsx
import React from 'react';
import { JSONSchema7 } from 'json-schema';
import { Input } from '../../base/Input';
import { Select } from '../../base/Select';
import { Checkbox } from '../../base/Checkbox';
import { FormFieldProps } from './types';

export const FormField: React.FC<FormFieldProps> = ({
  name,
  schema,
  register,
  errors,
  layout,
  labelWidth,
  disabled
}) => {
  const error = errors[name]?.message as string;
  const label = schema.title || name;
  const required = schema.required?.includes(name);
  const placeholder = schema.description || `请输入${label}`;
  
  const renderInput = () => {
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return (
            <Select
              {...register(name)}
              options={schema.enum.map(value => ({
                label: value as string,
                value: value as string
              }))}
              placeholder={placeholder}
              error={error}
              disabled={disabled}
            />
          );
        }
        
        if (schema.format === 'email') {
          return (
            <Input
              {...register(name)}
              type="email"
              placeholder={placeholder}
              error={error}
              disabled={disabled}
            />
          );
        }
        
        if (schema.format === 'password') {
          return (
            <Input
              {...register(name)}
              type="password"
              placeholder={placeholder}
              error={error}
              disabled={disabled}
            />
          );
        }
        
        return (
          <Input
            {...register(name)}
            type="text"
            placeholder={placeholder}
            error={error}
            disabled={disabled}
          />
        );
      
      case 'number':
      case 'integer':
        return (
          <Input
            {...register(name, { valueAsNumber: true })}
            type="number"
            min={schema.minimum}
            max={schema.maximum}
            placeholder={placeholder}
            error={error}
            disabled={disabled}
          />
        );
      
      case 'boolean':
        return (
          <Checkbox
            {...register(name)}
            label={label}
            error={error}
            disabled={disabled}
          />
        );
      
      default:
        return (
          <Input
            {...register(name)}
            type="text"
            placeholder={placeholder}
            error={error}
            disabled={disabled}
          />
        );
    }
  };
  
  if (schema.type === 'boolean') {
    return (
      <div className="form-field">
        {renderInput()}
      </div>
    );
  }
  
  return (
    <div className={`form-field form-field-${layout}`}>
      <label className="form-label" style={{ width: layout === 'horizontal' ? labelWidth : undefined }}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="form-control">
        {renderInput()}
      </div>
    </div>
  );
};
```

### 3. 主题系统

```typescript
// src/themes/types.ts
export interface Theme {
  colors: {
    // 主色调
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    
    // 状态色
    success: string;
    successForeground: string;
    warning: string;
    warningForeground: string;
    error: string;
    errorForeground: string;
    info: string;
    infoForeground: string;
    
    // 背景色
    background: string;
    foreground: string;
    surface: string;
    surfaceForeground: string;
    
    // 边框和分割线
    border: string;
    input: string;
    ring: string;
    
    // 文本色
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
  };
  
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  
  typography: {
    fontFamily: {
      sans: string[];
      mono: string[];
    };
    fontSize: {
      xs: [string, string];
      sm: [string, string];
      base: [string, string];
      lg: [string, string];
      xl: [string, string];
      '2xl': [string, string];
      '3xl': [string, string];
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}
```

```typescript
// src/themes/default.ts
import { Theme } from './types';

export const defaultTheme: Theme = {
  colors: {
    primary: 'hsl(222.2 84% 4.9%)',
    primaryForeground: 'hsl(210 40% 98%)',
    secondary: 'hsl(210 40% 96%)',
    secondaryForeground: 'hsl(222.2 84% 4.9%)',
    
    success: 'hsl(142.1 76.2% 36.3%)',
    successForeground: 'hsl(355.7 100% 97.3%)',
    warning: 'hsl(38.1 100% 57.1%)',
    warningForeground: 'hsl(210 40% 98%)',
    error: 'hsl(0 84.2% 60.2%)',
    errorForeground: 'hsl(210 40% 98%)',
    info: 'hsl(221.2 83.2% 53.3%)',
    infoForeground: 'hsl(210 40% 98%)',
    
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    surface: 'hsl(0 0% 100%)',
    surfaceForeground: 'hsl(222.2 84% 4.9%)',
    
    border: 'hsl(214.3 31.8% 91.4%)',
    input: 'hsl(214.3 31.8% 91.4%)',
    ring: 'hsl(222.2 84% 4.9%)',
    
    muted: 'hsl(210 40% 96%)',
    mutedForeground: 'hsl(215.4 16.3% 46.9%)',
    accent: 'hsl(210 40% 96%)',
    accentForeground: 'hsl(222.2 84% 4.9%)'
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', '1rem'],
      sm: ['0.875rem', '1.25rem'],
      base: ['1rem', '1.5rem'],
      lg: ['1.125rem', '1.75rem'],
      xl: ['1.25rem', '1.75rem'],
      '2xl': ['1.5rem', '2rem'],
      '3xl': ['1.875rem', '2.25rem']
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};
```

```typescript
// src/themes/dark.ts
import { Theme } from './types';
import { defaultTheme } from './default';

export const darkTheme: Theme = {
  ...defaultTheme,
  colors: {
    primary: 'hsl(210 40% 98%)',
    primaryForeground: 'hsl(222.2 84% 4.9%)',
    secondary: 'hsl(217.2 32.6% 17.5%)',
    secondaryForeground: 'hsl(210 40% 98%)',
    
    success: 'hsl(142.1 70.6% 45.3%)',
    successForeground: 'hsl(144.9 80.4% 10%)',
    warning: 'hsl(38.1 92.1% 50.4%)',
    warningForeground: 'hsl(48.3 95.8% 6.7%)',
    error: 'hsl(0 62.8% 30.6%)',
    errorForeground: 'hsl(0 85.7% 97.3%)',
    info: 'hsl(217.2 91.2% 59.8%)',
    infoForeground: 'hsl(222.2 84% 4.9%)',
    
    background: 'hsl(222.2 84% 4.9%)',
    foreground: 'hsl(210 40% 98%)',
    surface: 'hsl(222.2 84% 4.9%)',
    surfaceForeground: 'hsl(210 40% 98%)',
    
    border: 'hsl(217.2 32.6% 17.5%)',
    input: 'hsl(217.2 32.6% 17.5%)',
    ring: 'hsl(212.7 26.8% 83.9%)',
    
    muted: 'hsl(217.2 32.6% 17.5%)',
    mutedForeground: 'hsl(215 20.2% 65.1%)',
    accent: 'hsl(217.2 32.6% 17.5%)',
    accentForeground: 'hsl(210 40% 98%)'
  }
};
```

### 4. Context 和 Provider

```typescript
// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { Theme } from '../themes/types';
import { defaultTheme } from '../themes/default';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  theme?: Theme;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme: initialTheme = defaultTheme,
  children
}) => {
  const [theme, setTheme] = useState(initialTheme);
  const [isDark, setIsDark] = useState(false);
  
  const toggleDark = () => {
    setIsDark(!isDark);
    // 这里可以切换到深色主题
  };
  
  const value = {
    theme,
    setTheme,
    isDark,
    toggleDark
  };
  
  return (
    <ThemeContext.Provider value={value}>
      <div
        className="linch-kit-ui"
        style={{
          '--primary': theme.colors.primary,
          '--primary-foreground': theme.colors.primaryForeground,
          '--secondary': theme.colors.secondary,
          '--secondary-foreground': theme.colors.secondaryForeground,
          // ... 其他 CSS 变量
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
```

```typescript
// src/context/LinchKitUIProvider.tsx
import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { I18nProvider } from './I18nContext';
import { ModalProvider } from './ModalContext';
import { ToastProvider } from './ToastContext';
import { Theme } from '../themes/types';

interface LinchKitUIProviderProps {
  theme?: Theme;
  locale?: string;
  rtl?: boolean;
  children: React.ReactNode;
}

export const LinchKitUIProvider: React.FC<LinchKitUIProviderProps> = ({
  theme,
  locale = 'zh-CN',
  rtl = false,
  children
}) => {
  return (
    <ThemeProvider theme={theme}>
      <I18nProvider locale={locale} rtl={rtl}>
        <ModalProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ModalProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};
```

### 5. Hooks 实现

```typescript
// src/hooks/useBreakpoint.ts
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface BreakpointState {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

export const useBreakpoint = (): BreakpointState => {
  const { theme } = useTheme();
  const [breakpoints, setBreakpoints] = useState<BreakpointState>({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    '2xl': false
  });
  
  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      
      setBreakpoints({
        sm: width >= parseInt(theme.breakpoints.sm),
        md: width >= parseInt(theme.breakpoints.md),
        lg: width >= parseInt(theme.breakpoints.lg),
        xl: width >= parseInt(theme.breakpoints.xl),
        '2xl': width >= parseInt(theme.breakpoints['2xl'])
      });
    };
    
    updateBreakpoints();
    window.addEventListener('resize', updateBreakpoints);
    
    return () => window.removeEventListener('resize', updateBreakpoints);
  }, [theme.breakpoints]);
  
  return breakpoints;
};
```

```typescript
// src/hooks/useModal.ts
import { useContext } from 'react';
import { ModalContext } from '../context/ModalContext';

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
```

### 6. 工具函数

```typescript
// src/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```typescript
// src/utils/schema.ts
import { JSONSchema7 } from 'json-schema';

export const getFieldType = (schema: JSONSchema7): string => {
  if (schema.enum) return 'select';
  if (schema.type === 'boolean') return 'checkbox';
  if (schema.type === 'number' || schema.type === 'integer') return 'number';
  if (schema.format === 'email') return 'email';
  if (schema.format === 'password') return 'password';
  if (schema.format === 'date') return 'date';
  if (schema.format === 'time') return 'time';
  if (schema.format === 'date-time') return 'datetime-local';
  return 'text';
};

export const getFieldValidation = (schema: JSONSchema7) => {
  const validation: any = {};
  
  if (schema.minLength) validation.minLength = schema.minLength;
  if (schema.maxLength) validation.maxLength = schema.maxLength;
  if (schema.minimum) validation.min = schema.minimum;
  if (schema.maximum) validation.max = schema.maximum;
  if (schema.pattern) validation.pattern = new RegExp(schema.pattern);
  
  return validation;
};
```

## 样式系统

### 1. CSS 变量系统

```css
/* src/styles/variables.css */
:root {
  /* 颜色 */
  --primary: hsl(222.2 84% 4.9%);
  --primary-foreground: hsl(210 40% 98%);
  --secondary: hsl(210 40% 96%);
  --secondary-foreground: hsl(222.2 84% 4.9%);
  
  /* 间距 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* 字体 */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  
  /* 边框半径 */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.dark {
  --primary: hsl(210 40% 98%);
  --primary-foreground: hsl(222.2 84% 4.9%);
  --secondary: hsl(217.2 32.6% 17.5%);
  --secondary-foreground: hsl(210 40% 98%);
  /* ... 深色模式变量 */
}
```

### 2. Tailwind CSS 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        success: 'hsl(var(--success))',
        'success-foreground': 'hsl(var(--success-foreground))',
        warning: 'hsl(var(--warning))',
        'warning-foreground': 'hsl(var(--warning-foreground))',
        error: 'hsl(var(--error))',
        'error-foreground': 'hsl(var(--error-foreground))',
        info: 'hsl(var(--info))',
        'info-foreground': 'hsl(var(--info-foreground))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        'surface-foreground': 'hsl(var(--surface-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))'
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)'
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)'
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)'
      }
    }
  },
  plugins: []
};
```

## 测试策略

### 1. 单元测试

```typescript
// src/components/base/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import { LinchKitUIProvider } from '../../../context';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <LinchKitUIProvider>
      {component}
    </LinchKitUIProvider>
  );
};

describe('Button', () => {
  it('should render correctly', () => {
    renderWithProvider(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('should handle click events', () => {
    const handleClick = jest.fn();
    renderWithProvider(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should show loading state', () => {
    renderWithProvider(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('should apply variant classes', () => {
    renderWithProvider(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });
});
```

### 2. 集成测试

```typescript
// src/components/schema/SchemaForm/SchemaForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SchemaForm } from './SchemaForm';
import { LinchKitUIProvider } from '../../../context';

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: '姓名' },
    email: { type: 'string', format: 'email', title: '邮箱' },
    age: { type: 'number', minimum: 0, title: '年龄' }
  },
  required: ['name', 'email']
};

describe('SchemaForm', () => {
  it('should render form fields based on schema', () => {
    const handleSubmit = jest.fn();
    
    render(
      <LinchKitUIProvider>
        <SchemaForm schema={userSchema} onSubmit={handleSubmit} />
      </LinchKitUIProvider>
    );
    
    expect(screen.getByLabelText('姓名 *')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱 *')).toBeInTheDocument();
    expect(screen.getByLabelText('年龄')).toBeInTheDocument();
  });
  
  it('should validate form data', async () => {
    const handleSubmit = jest.fn();
    
    render(
      <LinchKitUIProvider>
        <SchemaForm schema={userSchema} onSubmit={handleSubmit} />
      </LinchKitUIProvider>
    );
    
    fireEvent.click(screen.getByText('提交'));
    
    await waitFor(() => {
      expect(screen.getByText('姓名是必需的')).toBeInTheDocument();
      expect(screen.getByText('邮箱是必需的')).toBeInTheDocument();
    });
  });
  
  it('should submit valid data', async () => {
    const handleSubmit = jest.fn();
    
    render(
      <LinchKitUIProvider>
        <SchemaForm schema={userSchema} onSubmit={handleSubmit} />
      </LinchKitUIProvider>
    );
    
    fireEvent.change(screen.getByLabelText('姓名 *'), {
      target: { value: '张三' }
    });
    fireEvent.change(screen.getByLabelText('邮箱 *'), {
      target: { value: 'zhangsan@example.com' }
    });
    fireEvent.change(screen.getByLabelText('年龄'), {
      target: { value: '25' }
    });
    
    fireEvent.click(screen.getByText('提交'));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: '张三',
        email: 'zhangsan@example.com',
        age: 25
      });
    });
  });
});
```

### 3. 视觉回归测试

```typescript
// src/components/base/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Base/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger']
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg']
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary'
  }
};

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary'
  }
};

export const Loading: Story = {
  args: {
    children: 'Button',
    loading: true
  }
};

export const WithIcon: Story = {
  args: {
    children: 'Button',
    icon: '🚀'
  }
};
```

## 性能优化

### 1. 懒加载

```typescript
// src/components/index.ts
import { lazy } from 'react';

// 基础组件 - 立即加载
export { Button } from './base/Button';
export { Input } from './base/Input';
export { Card } from './base/Card';

// 复杂组件 - 懒加载
export const Modal = lazy(() => import('./base/Modal').then(m => ({ default: m.Modal })));
export const Table = lazy(() => import('./base/Table').then(m => ({ default: m.Table })));
export const SchemaForm = lazy(() => import('./schema/SchemaForm').then(m => ({ default: m.SchemaForm })));
export const SchemaTable = lazy(() => import('./schema/SchemaTable').then(m => ({ default: m.SchemaTable })));
```

### 2. Bundle 分析

```typescript
// build/analyze.ts
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

export const analyzeConfig = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'server',
      openAnalyzer: true
    })
  ]
};
```

### 3. Tree Shaking

```json
{
  "sideEffects": [
    "**/*.css",
    "**/*.scss",
    "./src/styles/**"
  ]
}
```

## 构建配置

### 1. Rollup 配置

```typescript
// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  external: ['react', 'react-dom'],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.build.json'
    }),
    postcss({
      extract: true,
      minimize: true
    }),
    terser()
  ]
};
```

### 2. TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.*", "**/*.stories.*"]
}
```

这个实现指南提供了 @linch-kit/ui 包的完整架构和实现方案，确保创建一个现代化、可维护且高性能的 UI 组件库。