# @linch-kit/ui 包技术文档

**包版本**: v1.0.0
**创建日期**: 2025-06-23
**最后更新**: 2025-06-24
**开发优先级**: P1 - 高优先级
**依赖关系**: core → schema → auth → crud → trpc → ui
**维护状态**: 🔄 开发中

---

## 📖 目录

1. [模块概览](#1-模块概览)
2. [API 设计](#2-api-设计)
3. [实现细节](#3-实现细节)
4. [集成接口](#4-集成接口)
5. [最佳实践](#5-最佳实践)
6. [性能考量](#6-性能考量)
7. [测试策略](#7-测试策略)
8. [AI 集成支持](#8-ai-集成支持)

---

## 1. 模块概览

### 1.1 功能定位

@linch-kit/ui 是 LinchKit 的用户界面层核心包，基于 React + Tailwind CSS + shadcn/ui 构建。它位于依赖链的最顶层，依赖所有下层包提供的功能，为开发者提供完整的组件库生态，支持 Schema 驱动的自动化 UI 生成。

```mermaid
graph TB
    A[用户界面层] --> B[@linch-kit/ui]
    B --> C[基础组件层]
    B --> D[业务组件层]
    B --> E[布局组件层]

    C --> F[shadcn/ui]
    C --> G[Tailwind CSS]
    C --> H[Radix UI]

    D --> I[CRUD 组件]
    D --> J[认证组件]
    D --> K[数据展示组件]

    E --> L[仪表板布局]
    E --> M[导航组件]
    E --> N[响应式布局]

    F1[@linch-kit/trpc] --> B
    F2[@linch-kit/crud] --> B
    F3[@linch-kit/auth] --> B
    F4[@linch-kit/schema] --> B
    F5[@linch-kit/core] --> B
```

### 1.2 核心价值

- **🎨 设计系统**: 基于现代设计原则的完整设计系统
- **📱 响应式设计**: 移动优先的响应式布局和组件
- **🌙 主题系统**: 支持深色/浅色主题和自定义主题
- **♿ 可访问性**: 完整的 ARIA 支持和键盘导航
- **🔧 Schema 驱动**: 基于数据模型自动生成 UI 组件
- **🌍 国际化**: 完整的多语言支持和本地化

### 1.3 技术架构

```typescript
// 核心架构概览
interface UIArchitecture {
  // 基础层：shadcn/ui 组件
  foundation: {
    primitives: RadixUI
    styling: TailwindCSS
    components: ShadcnUI
  }

  // 组件层：业务组件
  components: {
    crud: CRUDComponents
    auth: AuthComponents
    layout: LayoutComponents
    blocks: CompositeComponents
  }

  // 系统层：主题和工具
  systems: {
    theme: ThemeSystem
    i18n: InternationalizationSystem
    accessibility: AccessibilitySystem
  }

  // 集成层：与其他包的集成
  integrations: {
    schema: SchemaIntegration
    trpc: TRPCIntegration
    auth: AuthIntegration
  }
}
```

### 1.4 职责边界

| 职责范围 | 包含功能 | 不包含功能 |
|---------|---------|-----------|
| **UI 组件** | 基础组件、业务组件、布局组件 | 业务逻辑实现 |
| **主题系统** | 主题切换、自定义主题、CSS 变量 | 设计资源管理 |
| **响应式设计** | 断点管理、移动适配、布局响应 | 设备特定功能 |
| **可访问性** | ARIA 支持、键盘导航、语义化 | 辅助技术集成 |
| **国际化** | 多语言支持、文本翻译、格式化 | 内容管理系统 |

---

## 2. API 设计

### 2.1 组件接口设计

#### 基础组件接口

```typescript
// 通用组件属性
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

// 可变体组件属性
export interface VariantComponentProps<T extends string> extends BaseComponentProps {
  variant?: T
  size?: 'sm' | 'md' | 'lg'
}

// 可控组件属性
export interface ControlledComponentProps<T> {
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
}

// 表单组件属性
export interface FormComponentProps<T> extends ControlledComponentProps<T> {
  name?: string
  label?: string
  placeholder?: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
}
```

#### CRUD 组件接口

```typescript
// 表单构建器接口
export interface FormBuilderProps<T extends Record<string, any>> {
  schema: EntitySchema<T>
  data?: Partial<T>
  onSubmit: (data: T) => void | Promise<void>
  onCancel?: () => void
  mode?: 'create' | 'edit' | 'view'
  disabled?: boolean
  loading?: boolean
  className?: string
  fieldOverrides?: Partial<Record<keyof T, FormFieldConfig>>
}

// 数据表格接口
export interface DataTableProps<T extends Record<string, any>> {
  schema: EntitySchema<T>
  data: T[]
  loading?: boolean
  error?: string
  pagination?: PaginationConfig
  sorting?: SortingConfig
  filtering?: FilteringConfig
  selection?: SelectionConfig
  actions?: TableAction<T>[]
  onRowClick?: (row: T) => void
  onRowSelect?: (rows: T[]) => void
  className?: string
  columnOverrides?: Partial<Record<keyof T, ColumnConfig>>
}

// CRUD 管理器接口
export interface CRUDManagerProps<T extends Record<string, any>> {
  entityName: string
  schema: EntitySchema<T>
  trpcRouter: TRPCRouter
  permissions?: CRUDPermissions
  layout?: 'table' | 'grid' | 'list'
  features?: CRUDFeatures
  customActions?: CustomAction<T>[]
  onEntityChange?: (entity: T, action: CRUDAction) => void
}
```

### 2.2 主题系统接口

#### 主题配置接口

```typescript
// 主题配置
export interface ThemeConfig {
  name: string
  displayName: string
  colors: {
    primary: ColorScale
    secondary: ColorScale
    accent: ColorScale
    neutral: ColorScale
    success: ColorScale
    warning: ColorScale
    error: ColorScale
    info: ColorScale
  }
  typography: TypographyConfig
  spacing: SpacingConfig
  borderRadius: BorderRadiusConfig
  shadows: ShadowConfig
}

// 颜色比例
export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

// 主题提供者接口
export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: 'light' | 'dark' | 'system'
  themes?: ThemeConfig[]
  storageKey?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

// 主题钩子接口
export interface UseThemeReturn {
  theme: string
  setTheme: (theme: string) => void
  themes: string[]
  systemTheme: 'light' | 'dark' | undefined
  resolvedTheme: string
}
```

### 2.3 国际化接口

#### i18n 配置接口

```typescript
// 国际化配置
export interface I18nConfig {
  defaultLocale: string
  locales: string[]
  fallbackLocale?: string
  interpolation?: InterpolationConfig
  pluralization?: PluralizationConfig
}

// 翻译资源
export interface TranslationResources {
  [locale: string]: {
    [namespace: string]: {
      [key: string]: string | TranslationResources
    }
  }
}

// 翻译钩子接口
export interface UseTranslationReturn {
  t: (key: string, options?: TranslationOptions) => string
  locale: string
  setLocale: (locale: string) => void
  isLoading: boolean
  error?: Error
}

// 翻译选项
export interface TranslationOptions {
  count?: number
  context?: string
  defaultValue?: string
  interpolation?: Record<string, any>
}
```

### 2.4 可访问性接口

#### 可访问性配置

```typescript
// 可访问性配置
export interface AccessibilityConfig {
  announcements: boolean
  keyboardNavigation: boolean
  focusManagement: boolean
  screenReaderSupport: boolean
  highContrast: boolean
  reducedMotion: boolean
}

// ARIA 属性接口
export interface AriaProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-selected'?: boolean
  'aria-checked'?: boolean
  'aria-disabled'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'off' | 'polite' | 'assertive'
  'aria-atomic'?: boolean
  'aria-relevant'?: string
  role?: string
}

// 键盘导航接口
export interface KeyboardNavigationProps {
  onKeyDown?: (event: React.KeyboardEvent) => void
  tabIndex?: number
  autoFocus?: boolean
  trapFocus?: boolean
}
```

### 2.5 响应式设计接口

#### 断点配置

```typescript
// 断点配置
export interface BreakpointConfig {
  xs: number    // 0px
  sm: number    // 640px
  md: number    // 768px
  lg: number    // 1024px
  xl: number    // 1280px
  '2xl': number // 1536px
}

// 响应式属性
export type ResponsiveValue<T> = T | {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}

// 响应式组件属性
export interface ResponsiveComponentProps {
  display?: ResponsiveValue<'block' | 'inline' | 'flex' | 'grid' | 'none'>
  width?: ResponsiveValue<string | number>
  height?: ResponsiveValue<string | number>
  padding?: ResponsiveValue<string | number>
  margin?: ResponsiveValue<string | number>
  fontSize?: ResponsiveValue<string | number>
}

// 媒体查询钩子
export interface UseMediaQueryReturn {
  matches: boolean
  media: string
}
```

---

## 3. 实现细节

### 3.1 Schema 驱动组件实现

#### 表单构建器实现

```typescript
export function FormBuilder<T extends Record<string, any>>({
  schema,
  data,
  onSubmit,
  onCancel,
  mode = 'create',
  disabled = false,
  loading = false,
  className,
  fieldOverrides = {}
}: FormBuilderProps<T>) {
  const { t } = useTranslation('form')

  // 表单配置
  const form = useForm<T>({
    resolver: zodResolver(schema.validator),
    defaultValues: data || schema.defaultValues,
    mode: 'onChange'
  })

  // 生成表单字段
  const fields = useMemo(() =>
    generateFormFields(schema, mode, fieldOverrides),
    [schema, mode, fieldOverrides]
  )

  // 提交处理
  const handleSubmit = async (formData: T) => {
    try {
      await onSubmit(formData)
      if (mode === 'create') {
        form.reset()
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-6", className)}
      >
        <div className="grid gap-4">
          {fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel className={field.required ? "required" : ""}>
                    {field.label}
                  </FormLabel>
                  <FormControl>
                    <FieldRenderer
                      field={field}
                      value={formField.value}
                      onChange={formField.onChange}
                      disabled={disabled || loading}
                    />
                  </FormControl>
                  {field.description && (
                    <FormDescription>{field.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
          )}
          <Button
            type="submit"
            disabled={disabled || loading || !form.formState.isValid}
            loading={loading}
          >
            {loading ? t('saving') : mode === 'create' ? t('create') : t('update')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// 字段渲染器
function FieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )

    case 'email':
      return (
        <Input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )

    case 'select':
      return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={field.rows || 3}
        />
      )

    case 'checkbox':
      return (
        <Checkbox
          checked={value || false}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      )

    case 'date':
      return (
        <DatePicker
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={field.placeholder}
        />
      )

    default:
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )
  }
}
```

#### 数据表格实现

```typescript
export function DataTable<T extends Record<string, any>>({
  schema,
  data,
  loading = false,
  error,
  pagination,
  sorting,
  filtering,
  selection,
  actions = [],
  onRowClick,
  onRowSelect,
  className,
  columnOverrides = {}
}: DataTableProps<T>) {
  const { t } = useTranslation('table')

  // 生成表格列
  const columns = useMemo(() =>
    generateTableColumns(schema, {
      actions,
      columnOverrides,
      onRowClick: onRowClick ? (row) => onRowClick(row) : undefined
    }),
    [schema, actions, columnOverrides, onRowClick]
  )

  // 表格状态
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sortingState, setSortingState] = useState<SortingState>([])

  // 表格实例
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSortingState,
    state: {
      rowSelection,
      columnFilters,
      sorting: sortingState,
      pagination: pagination?.state
    },
    onPaginationChange: pagination?.onChange,
    enableRowSelection: !!selection,
    enableSorting: !!sorting,
    enableColumnFilters: !!filtering,
  })

  // 选中行变化处理
  useEffect(() => {
    if (onRowSelect && selection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onRowSelect(selectedRows)
    }
  }, [rowSelection, onRowSelect, selection, table])

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-destructive">{t('error.loadFailed')}</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 工具栏 */}
      <DataTableToolbar
        table={table}
        schema={schema}
        filtering={filtering}
        selection={selection}
      />

      {/* 表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}>
                    <div
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex items-center space-x-2"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <SortIcon direction={header.column.getIsSorted()} />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Spinner size="sm" />
                    <span>{t('loading')}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">{t('noData')}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {pagination && (
        <DataTablePagination table={table} pagination={pagination} />
      )}
    </div>
  )
}
```

### 3.2 主题系统实现

#### 主题提供者实现

```typescript
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  themes = [lightTheme, darkTheme],
  storageKey = 'linch-kit-theme',
  enableSystem = true,
  disableTransitionOnChange = false
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<string>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>()

  // 监听系统主题变化
  useEffect(() => {
    if (!enableSystem) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enableSystem])

  // 应用主题
  useEffect(() => {
    const root = window.document.documentElement

    // 移除所有主题类
    themes.forEach(t => root.classList.remove(t.name))

    // 确定要应用的主题
    let resolvedTheme = theme
    if (theme === 'system' && systemTheme) {
      resolvedTheme = systemTheme
    }

    // 查找主题配置
    const themeConfig = themes.find(t => t.name === resolvedTheme) || themes[0]

    // 禁用过渡动画（可选）
    if (disableTransitionOnChange) {
      root.style.setProperty('--transition-duration', '0s')
    }

    // 应用主题
    root.classList.add(themeConfig.name)

    // 设置 CSS 变量
    Object.entries(themeConfig.colors).forEach(([key, colorScale]) => {
      Object.entries(colorScale).forEach(([shade, value]) => {
        root.style.setProperty(`--color-${key}-${shade}`, value)
      })
    })

    // 恢复过渡动画
    if (disableTransitionOnChange) {
      setTimeout(() => {
        root.style.removeProperty('--transition-duration')
      }, 0)
    }
  }, [theme, systemTheme, themes, disableTransitionOnChange])

  // 持久化主题设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme)
    }
  }, [theme, storageKey])

  // 从本地存储恢复主题
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setThemeState(stored)
      }
    }
  }, [storageKey])

  const setTheme = useCallback((newTheme: string) => {
    setThemeState(newTheme)
  }, [])

  const resolvedTheme = theme === 'system' ? systemTheme || 'light' : theme

  const value = useMemo(() => ({
    theme,
    setTheme,
    themes: themes.map(t => t.name),
    systemTheme,
    resolvedTheme
  }), [theme, setTheme, themes, systemTheme, resolvedTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// 主题钩子
export function useTheme(): UseThemeReturn {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// 主题切换器组件
export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme()
  const { t } = useTranslation('theme')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeName) => (
          <DropdownMenuItem
            key={themeName}
            onClick={() => setTheme(themeName)}
            className={theme === themeName ? "bg-accent" : ""}
          >
            {t(`themes.${themeName}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 3.3 国际化实现

#### i18n 提供者实现

```typescript
export function I18nProvider({
  children,
  config,
  resources,
  fallback = <div>Loading translations...</div>
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState(config.defaultLocale)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error>()
  const [translations, setTranslations] = useState<TranslationResources>({})

  // 加载翻译资源
  const loadTranslations = useCallback(async (targetLocale: string) => {
    setIsLoading(true)
    setError(undefined)

    try {
      // 如果资源已经加载，直接使用
      if (resources[targetLocale]) {
        setTranslations(prev => ({ ...prev, [targetLocale]: resources[targetLocale] }))
        setIsLoading(false)
        return
      }

      // 动态加载翻译资源
      const response = await fetch(`/locales/${targetLocale}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${targetLocale}`)
      }

      const data = await response.json()
      setTranslations(prev => ({ ...prev, [targetLocale]: data }))
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [resources])

  // 初始化加载
  useEffect(() => {
    loadTranslations(locale)
  }, [locale, loadTranslations])

  // 设置语言
  const setLocale = useCallback((newLocale: string) => {
    if (config.locales.includes(newLocale)) {
      setLocaleState(newLocale)
      localStorage.setItem('linch-kit-locale', newLocale)
    }
  }, [config.locales])

  // 翻译函数
  const t = useCallback((key: string, options: TranslationOptions = {}) => {
    const currentTranslations = translations[locale] || {}
    const fallbackTranslations = config.fallbackLocale
      ? translations[config.fallbackLocale] || {}
      : {}

    // 解析嵌套键
    const getValue = (obj: any, path: string): string | undefined => {
      return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    let value = getValue(currentTranslations, key) ||
                getValue(fallbackTranslations, key) ||
                options.defaultValue ||
                key

    // 处理插值
    if (options.interpolation) {
      Object.entries(options.interpolation).forEach(([placeholder, replacement]) => {
        value = value.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(replacement))
      })
    }

    // 处理复数
    if (typeof options.count === 'number') {
      const pluralKey = options.count === 1 ? `${key}_one` : `${key}_other`
      const pluralValue = getValue(currentTranslations, pluralKey) ||
                         getValue(fallbackTranslations, pluralKey)
      if (pluralValue) {
        value = pluralValue.replace('{{count}}', String(options.count))
      }
    }

    return value
  }, [translations, locale, config.fallbackLocale])

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
    isLoading,
    error
  }), [locale, setLocale, t, isLoading, error])

  if (isLoading) {
    return fallback
  }

  if (error) {
    console.error('I18n error:', error)
    return <div>Error loading translations: {error.message}</div>
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// 翻译钩子
export function useTranslation(namespace?: string): UseTranslationReturn {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }

  const { t: baseT, ...rest } = context

  const t = useCallback((key: string, options?: TranslationOptions) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return baseT(fullKey, options)
  }, [baseT, namespace])

  return { t, ...rest }
}
```

---

## 4. 集成接口

### 4.1 与 @linch-kit/schema 集成

#### Schema 驱动的组件生成

```typescript
import { EntitySchema } from '@linch-kit/schema'

export class UISchemaIntegration {
  // 生成表单字段配置
  static generateFormFields<T>(
    schema: EntitySchema<T>,
    mode: 'create' | 'edit' | 'view',
    overrides: Partial<Record<keyof T, FormFieldConfig>> = {}
  ): FormFieldConfig[] {
    return schema.fields
      .filter(field => {
        // 过滤不需要显示的字段
        if (mode === 'create' && field.generated) return false
        if (field.hidden) return false
        if (mode === 'view' && field.writeOnly) return false
        return true
      })
      .map(field => {
        const override = overrides[field.name as keyof T]

        return {
          name: field.name,
          label: field.label || this.formatFieldName(field.name),
          type: this.mapSchemaTypeToFormType(field.type),
          required: field.required && mode !== 'view',
          disabled: mode === 'view' || field.readOnly,
          placeholder: field.placeholder,
          description: field.description,
          options: field.options,
          validation: field.validation,
          ...override
        }
      })
  }

  // 生成表格列配置
  static generateTableColumns<T>(
    schema: EntitySchema<T>,
    options: TableColumnOptions = {}
  ): ColumnDef<T>[] {
    const columns: ColumnDef<T>[] = []

    // 选择列（如果启用）
    if (options.enableSelection) {
      columns.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      })
    }

    // 数据列
    schema.fields
      .filter(field => !field.hidden && field.showInTable !== false)
      .forEach(field => {
        const override = options.columnOverrides?.[field.name as keyof T]

        columns.push({
          accessorKey: field.name,
          header: field.label || this.formatFieldName(field.name),
          cell: ({ getValue }) => this.renderCellValue(getValue(), field.type),
          enableSorting: field.sortable !== false,
          enableHiding: true,
          ...override
        })
      })

    // 操作列
    if (options.actions && options.actions.length > 0) {
      columns.push({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <TableActions row={row.original} actions={options.actions!} />
        ),
        enableSorting: false,
        enableHiding: false,
      })
    }

    return columns
  }

  private static mapSchemaTypeToFormType(schemaType: string): FormFieldType {
    const typeMap: Record<string, FormFieldType> = {
      'string': 'text',
      'email': 'email',
      'password': 'password',
      'number': 'number',
      'integer': 'number',
      'boolean': 'checkbox',
      'date': 'date',
      'datetime': 'datetime',
      'time': 'time',
      'enum': 'select',
      'array': 'multiselect',
      'object': 'json',
      'text': 'textarea',
      'url': 'url',
      'file': 'file',
      'image': 'image'
    }

    return typeMap[schemaType] || 'text'
  }

  private static renderCellValue(value: any, type: string): React.ReactNode {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>
    }

    switch (type) {
      case 'boolean':
        return value ? <CheckIcon className="h-4 w-4 text-green-600" /> : <XIcon className="h-4 w-4 text-red-600" />

      case 'date':
      case 'datetime':
        return new Date(value).toLocaleDateString()

      case 'email':
        return <a href={`mailto:${value}`} className="text-blue-600 hover:underline">{value}</a>

      case 'url':
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{value}</a>

      case 'image':
        return <img src={value} alt="" className="h-8 w-8 rounded object-cover" />

      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value)

      default:
        return String(value)
    }
  }

  private static formatFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
}
```

### 4.2 与 @linch-kit/trpc 集成

#### tRPC 数据绑定

```typescript
import { TRPCRouter } from '@linch-kit/trpc'

export function useCRUDTable<T extends Record<string, any>>(
  entityName: string,
  schema: EntitySchema<T>,
  options: CRUDTableOptions = {}
) {
  const utils = trpc.useUtils()

  // 查询数据
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = trpc[entityName].paginated.useQuery({
    filter: options.filter,
    pagination: options.pagination,
    sorting: options.sorting
  }, {
    keepPreviousData: true,
    staleTime: 30 * 1000
  })

  // 删除操作
  const deleteMutation = trpc[entityName].delete.useMutation({
    onSuccess: () => {
      utils[entityName].paginated.invalidate()
      toast.success('Item deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`)
    }
  })

  // 批量删除
  const deleteMany = trpc[entityName].deleteMany.useMutation({
    onSuccess: (result) => {
      utils[entityName].paginated.invalidate()
      toast.success(`${result.count} items deleted`)
    },
    onError: (error) => {
      toast.error(`Failed to delete items: ${error.message}`)
    }
  })

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate({ id })
  }, [deleteMutation])

  const handleDeleteMany = useCallback((ids: string[]) => {
    deleteMany.mutate({ filter: { id: { in: ids } } })
  }, [deleteMany])

  return {
    data: response?.data || [],
    pagination: response?.pagination,
    isLoading,
    error: error?.message,
    refetch,
    handleDelete,
    handleDeleteMany,
    isDeleting: deleteMutation.isLoading || deleteMany.isLoading
  }
}

export function useCRUDForm<T extends Record<string, any>>(
  entityName: string,
  schema: EntitySchema<T>,
  mode: 'create' | 'edit',
  initialData?: Partial<T>
) {
  const utils = trpc.useUtils()
  const router = useRouter()

  // 创建操作
  const createMutation = trpc[entityName].create.useMutation({
    onSuccess: (data) => {
      utils[entityName].paginated.invalidate()
      toast.success('Item created successfully')
      router.push(`/${entityName}/${data.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`)
    }
  })

  // 更新操作
  const updateMutation = trpc[entityName].update.useMutation({
    onSuccess: (data) => {
      utils[entityName].paginated.invalidate()
      utils[entityName].get.setData({ id: data.id }, data)
      toast.success('Item updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`)
    }
  })

  const handleSubmit = useCallback((data: T) => {
    if (mode === 'create') {
      createMutation.mutate(data)
    } else {
      updateMutation.mutate({
        id: (initialData as any)?.id,
        data
      })
    }
  }, [mode, createMutation, updateMutation, initialData])

  return {
    handleSubmit,
    isLoading: createMutation.isLoading || updateMutation.isLoading,
    error: createMutation.error?.message || updateMutation.error?.message
  }
}
```

### 4.3 与 @linch-kit/auth 集成

#### 认证组件集成

```typescript
import { useAuth } from '@linch-kit/auth'

export function AuthGuard({
  children,
  fallback = <LoginForm />,
  permissions = [],
  roles = []
}: AuthGuardProps) {
  const { user, isLoading, hasPermission, hasRole } = useAuth()

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <Spinner size="lg" />
    </div>
  }

  if (!user) {
    return fallback
  }

  // 检查权限
  if (permissions.length > 0) {
    const hasRequiredPermissions = permissions.every(permission =>
      hasPermission(permission)
    )
    if (!hasRequiredPermissions) {
      return <div className="text-center p-8">
        <p className="text-destructive">Access denied. Insufficient permissions.</p>
      </div>
    }
  }

  // 检查角色
  if (roles.length > 0) {
    const hasRequiredRoles = roles.some(role => hasRole(role))
    if (!hasRequiredRoles) {
      return <div className="text-center p-8">
        <p className="text-destructive">Access denied. Required role not found.</p>
      </div>
    }
  }

  return <>{children}</>
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const { t } = useTranslation('auth')

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            {t('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon className="mr-2 h-4 w-4" />
            {t('settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 5. 最佳实践

### 5.1 组件设计最佳实践

#### 1. 组件组合优于继承

```typescript
// ✅ 推荐：使用组合模式
const DataTableWithActions = ({ data, schema, onEdit, onDelete }: Props) => {
  return (
    <DataTable
      schema={schema}
      data={data}
      actions={[
        {
          label: 'Edit',
          icon: EditIcon,
          onClick: onEdit,
          variant: 'default'
        },
        {
          label: 'Delete',
          icon: DeleteIcon,
          onClick: onDelete,
          variant: 'destructive',
          confirm: true
        }
      ]}
    />
  )
}

// ❌ 避免：复杂的继承结构
class ExtendedDataTable extends DataTable {
  // 复杂的继承逻辑
}
```

#### 2. 使用 Compound Components 模式

```typescript
// ✅ 推荐：Compound Components
const Card = ({ children, className }: CardProps) => {
  return <div className={cn("rounded-lg border bg-card", className)}>{children}</div>
}

const CardHeader = ({ children, className }: CardHeaderProps) => {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
}

const CardContent = ({ children, className }: CardContentProps) => {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>
}

// 使用方式
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

#### 3. 合理使用 forwardRef

```typescript
// ✅ 推荐：正确使用 forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
```

### 5.2 性能优化最佳实践

#### 1. 组件懒加载

```typescript
// ✅ 推荐：懒加载大型组件
const DataTable = lazy(() => import('./data-table'))
const FormBuilder = lazy(() => import('./form-builder'))
const ChartCard = lazy(() => import('./chart-card'))

// 使用 Suspense 包装
const Dashboard = () => {
  return (
    <div>
      <Suspense fallback={<TableSkeleton />}>
        <DataTable schema={userSchema} data={users} />
      </Suspense>

      <Suspense fallback={<FormSkeleton />}>
        <FormBuilder schema={userSchema} onSubmit={handleSubmit} />
      </Suspense>
    </div>
  )
}
```

#### 2. 虚拟化长列表

```typescript
// ✅ 推荐：使用虚拟化处理大量数据
import { FixedSizeList as List } from 'react-window'

const VirtualizedTable = ({ data, schema }: VirtualizedTableProps) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TableRow data={data[index]} schema={schema} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={data.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

#### 3. 优化重渲染

```typescript
// ✅ 推荐：使用 memo 和 useMemo 优化
const TableRow = memo(({ data, schema, onEdit, onDelete }: TableRowProps) => {
  const formattedData = useMemo(() =>
    formatRowData(data, schema),
    [data, schema]
  )

  const handleEdit = useCallback(() => onEdit(data), [onEdit, data])
  const handleDelete = useCallback(() => onDelete(data), [onDelete, data])

  return (
    <tr>
      {formattedData.map((cell, index) => (
        <td key={index}>{cell}</td>
      ))}
      <td>
        <Button onClick={handleEdit}>Edit</Button>
        <Button onClick={handleDelete}>Delete</Button>
      </td>
    </tr>
  )
})
```

### 5.3 可访问性最佳实践

#### 1. 语义化 HTML

```typescript
// ✅ 推荐：使用语义化标签
const Navigation = () => {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/users">Users</a></li>
        <li><a href="/settings">Settings</a></li>
      </ul>
    </nav>
  )
}

// ✅ 推荐：正确的表单标签
const FormField = ({ label, name, required, ...props }: FormFieldProps) => {
  return (
    <div>
      <label htmlFor={name} className={required ? "required" : ""}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        aria-describedby={`${name}-description`}
        {...props}
      />
      <div id={`${name}-description`} className="text-sm text-muted-foreground">
        {props.description}
      </div>
    </div>
  )
}
```

#### 2. 键盘导航支持

```typescript
// ✅ 推荐：完整的键盘导航
const DropdownMenu = ({ children, items }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex(prev =>
          prev < items.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : items.length - 1
        )
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (focusedIndex >= 0) {
          items[focusedIndex].onClick()
        }
        break
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {children}
      </button>

      {isOpen && (
        <ul
          role="menu"
          className="absolute top-full left-0 bg-white border rounded shadow"
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => (
            <li
              key={index}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              className={focusedIndex === index ? "bg-accent" : ""}
              onClick={item.onClick}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### 5.4 主题和样式最佳实践

#### 1. CSS 变量使用

```css
/* ✅ 推荐：使用 CSS 变量定义主题 */
:root {
  --color-primary: 222.2 84% 4.9%;
  --color-primary-foreground: 210 40% 98%;
  --color-secondary: 210 40% 96%;
  --color-secondary-foreground: 222.2 84% 4.9%;

  --radius: 0.5rem;
  --font-sans: 'Inter', sans-serif;
}

.dark {
  --color-primary: 210 40% 98%;
  --color-primary-foreground: 222.2 84% 4.9%;
  --color-secondary: 217.2 32.6% 17.5%;
  --color-secondary-foreground: 210 40% 98%;
}
```

#### 2. 响应式设计

```typescript
// ✅ 推荐：移动优先的响应式设计
const ResponsiveGrid = ({ children }: ResponsiveGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  )
}

// ✅ 推荐：使用断点钩子
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('sm')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else if (width >= 640) setBreakpoint('sm')
      else setBreakpoint('xs')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}
```

---

## 6. 性能考量

### 6.1 构建性能指标

| 指标 | 目标值 | 当前值 | 优化策略 |
|------|--------|--------|----------|
| **DTS 构建时间** | < 8秒 | 6秒 | 类型简化、增量构建 |
| **包大小** | < 1.5MB | 1.2MB | Tree-shaking、代码分割 |
| **组件懒加载** | 100% | 95% | 动态导入、路由分割 |
| **CSS 大小** | < 200KB | 180KB | 样式优化、未使用样式清理 |

### 6.2 运行时性能优化

#### 组件渲染性能

```typescript
// 性能监控装饰器
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    const renderStart = performance.now()

    useEffect(() => {
      const renderEnd = performance.now()
      const renderTime = renderEnd - renderStart

      if (renderTime > 16) { // 超过一帧的时间
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`)
      }

      // 记录性能指标
      if (typeof window !== 'undefined' && 'performance' in window) {
        performance.mark(`${componentName}-render-end`)
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        )
      }
    })

    useEffect(() => {
      performance.mark(`${componentName}-render-start`)
    })

    return <Component {...props} />
  })
}

// 使用示例
export const DataTable = withPerformanceMonitoring(
  DataTableComponent,
  'DataTable'
)
```

#### 表格性能优化

```typescript
// 虚拟化表格实现
export function VirtualizedDataTable<T>({
  data,
  schema,
  height = 400,
  rowHeight = 50
}: VirtualizedDataTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算可见行范围
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / rowHeight)
    const visibleCount = Math.ceil(height / rowHeight)
    const end = Math.min(start + visibleCount + 1, data.length)

    return { start, end }
  }, [scrollTop, rowHeight, height, data.length])

  // 渲染可见行
  const visibleRows = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end)
  }, [data, visibleRange])

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: data.length * rowHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.start * rowHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleRows.map((row, index) => (
            <TableRow
              key={visibleRange.start + index}
              data={row}
              schema={schema}
              style={{ height: rowHeight }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 6.3 内存管理

#### 防止内存泄漏

```typescript
// ✅ 推荐：正确清理事件监听器
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // 清理函数
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return size
}

// ✅ 推荐：使用 AbortController 取消请求
export function useAsyncData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const abortController = new AbortController()

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(url, {
          signal: abortController.signal
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err as Error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // 清理函数
    return () => abortController.abort()
  }, [url])

  return { data, loading, error }
}
```

---

## 7. 测试策略

### 7.1 测试架构

```mermaid
graph TB
    A[单元测试] --> B[集成测试]
    B --> C[端到端测试]
    C --> D[视觉回归测试]

    A1[组件测试] --> A
    A2[Hook 测试] --> A
    A3[工具函数测试] --> A

    B1[Schema 集成测试] --> B
    B2[主题系统测试] --> B
    B3[i18n 集成测试] --> B

    C1[用户流程测试] --> C
    C2[可访问性测试] --> C

    D1[组件快照测试] --> D
    D2[主题变化测试] --> D
    D3[响应式测试] --> D
```

### 7.2 单元测试

#### 组件测试

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { FormBuilder } from '../form-builder'
import { createTestSchema } from '../../test-utils'

describe('FormBuilder', () => {
  const mockOnSubmit = jest.fn()
  const testSchema = createTestSchema({
    name: { type: 'string', required: true, label: 'Name' },
    email: { type: 'email', required: true, label: 'Email' },
    age: { type: 'number', required: false, label: 'Age' }
  })

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('should render form fields based on schema', () => {
    render(<FormBuilder schema={testSchema} onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Age')).toBeInTheDocument()
  })

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup()

    render(<FormBuilder schema={testSchema} onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should submit valid form data', async () => {
    const user = userEvent.setup()

    render(<FormBuilder schema={testSchema} onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.type(screen.getByLabelText('Email'), 'john@example.com')
    await user.type(screen.getByLabelText('Age'), '30')

    const submitButton = screen.getByRole('button', { name: /create/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      })
    })
  })

  it('should handle edit mode correctly', () => {
    const initialData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 25
    }

    render(
      <FormBuilder
        schema={testSchema}
        onSubmit={mockOnSubmit}
        mode="edit"
        data={initialData}
      />
    )

    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })
})

describe('DataTable', () => {
  const testData = [
    { id: '1', name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 25 }
  ]

  const testSchema = createTestSchema({
    name: { type: 'string', label: 'Name' },
    email: { type: 'email', label: 'Email' },
    age: { type: 'number', label: 'Age' }
  })

  it('should render table with data', () => {
    render(<DataTable schema={testSchema} data={testData} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<DataTable schema={testSchema} data={[]} loading={true} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show empty state when no data', () => {
    render(<DataTable schema={testSchema} data={[]} />)

    expect(screen.getByText('No results.')).toBeInTheDocument()
  })

  it('should handle row click', async () => {
    const user = userEvent.setup()
    const mockOnRowClick = jest.fn()

    render(
      <DataTable
        schema={testSchema}
        data={testData}
        onRowClick={mockOnRowClick}
      />
    )

    const firstRow = screen.getByText('John Doe').closest('tr')
    await user.click(firstRow!)

    expect(mockOnRowClick).toHaveBeenCalledWith(testData[0])
  })
})
```

#### Hook 测试

```typescript
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../use-theme'
import { ThemeProvider } from '../theme-provider'

describe('useTheme', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  )

  it('should return default theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('system')
    expect(result.current.themes).toContain('light')
    expect(result.current.themes).toContain('dark')
  })

  it('should change theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('light')
    })

    expect(localStorage.getItem('linch-kit-theme')).toBe('light')
  })
})

describe('useTranslation', () => {
  const mockTranslations = {
    en: {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete'
      }
    }
  }

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nProvider config={{ defaultLocale: 'en', locales: ['en'] }} resources={mockTranslations}>
      {children}
    </I18nProvider>
  )

  it('should translate keys', () => {
    const { result } = renderHook(() => useTranslation('common'), { wrapper })

    expect(result.current.t('save')).toBe('Save')
    expect(result.current.t('cancel')).toBe('Cancel')
  })

  it('should handle missing keys', () => {
    const { result } = renderHook(() => useTranslation('common'), { wrapper })

    expect(result.current.t('missing')).toBe('common.missing')
  })

  it('should handle interpolation', () => {
    const { result } = renderHook(() => useTranslation('common'), { wrapper })

    expect(result.current.t('welcome', { interpolation: { name: 'John' } }))
      .toBe('Welcome, John!')
  })
})
```

### 7.3 集成测试

#### Schema 集成测试

```typescript
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { FormBuilder, DataTable } from '../components'
import { UISchemaIntegration } from '../schema-integration'
import { createEntitySchema } from '@linch-kit/schema'

describe('Schema Integration', () => {
  const userSchema = createEntitySchema('User', {
    name: { type: 'string', required: true, label: 'Full Name' },
    email: { type: 'email', required: true, label: 'Email Address' },
    role: {
      type: 'enum',
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'user', label: 'User' }
      ],
      label: 'Role'
    },
    isActive: { type: 'boolean', label: 'Active' }
  })

  describe('Form Generation', () => {
    it('should generate form fields from schema', () => {
      const fields = UISchemaIntegration.generateFormFields(userSchema, 'create')

      expect(fields).toHaveLength(4)
      expect(fields[0]).toMatchObject({
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: true
      })
      expect(fields[1]).toMatchObject({
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true
      })
    })

    it('should render form with generated fields', () => {
      render(<FormBuilder schema={userSchema} onSubmit={jest.fn()} />)

      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Role')).toBeInTheDocument()
      expect(screen.getByLabelText('Active')).toBeInTheDocument()
    })
  })

  describe('Table Generation', () => {
    it('should generate table columns from schema', () => {
      const columns = UISchemaIntegration.generateTableColumns(userSchema)

      expect(columns).toHaveLength(4)
      expect(columns[0]).toMatchObject({
        accessorKey: 'name',
        header: 'Full Name'
      })
    })

    it('should render table with generated columns', () => {
      const testData = [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', isActive: true }
      ]

      render(<DataTable schema={userSchema} data={testData} />)

      expect(screen.getByText('Full Name')).toBeInTheDocument()
      expect(screen.getByText('Email Address')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
```

### 7.4 可访问性测试

#### ARIA 和键盘导航测试

```typescript
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { DropdownMenu, Button } from '../components'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  describe('DropdownMenu', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <DropdownMenu>
          <Button>Menu</Button>
        </DropdownMenu>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu items={[
          { label: 'Item 1', onClick: jest.fn() },
          { label: 'Item 2', onClick: jest.fn() },
          { label: 'Item 3', onClick: jest.fn() }
        ]}>
          <Button>Menu</Button>
        </DropdownMenu>
      )

      const menuButton = screen.getByRole('button', { name: 'Menu' })

      // 打开菜单
      await user.click(menuButton)
      expect(screen.getByRole('menu')).toBeInTheDocument()

      // 使用箭头键导航
      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: 'Item 1' })).toHaveFocus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('menuitem', { name: 'Item 2' })).toHaveFocus()

      // 使用 Escape 关闭菜单
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(menuButton).toHaveFocus()
    })

    it('should have correct ARIA attributes', async () => {
      const user = userEvent.setup()

      render(
        <DropdownMenu items={[{ label: 'Item 1', onClick: jest.fn() }]}>
          <Button>Menu</Button>
        </DropdownMenu>
      )

      const menuButton = screen.getByRole('button', { name: 'Menu' })

      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu')

      await user.click(menuButton)

      expect(menuButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  describe('FormBuilder', () => {
    it('should have proper form labels and descriptions', () => {
      const schema = createTestSchema({
        name: {
          type: 'string',
          required: true,
          label: 'Name',
          description: 'Enter your full name'
        }
      })

      render(<FormBuilder schema={schema} onSubmit={jest.fn()} />)

      const nameInput = screen.getByLabelText('Name')
      expect(nameInput).toHaveAttribute('required')
      expect(nameInput).toHaveAttribute('aria-describedby')

      const description = screen.getByText('Enter your full name')
      expect(description).toHaveAttribute('id', nameInput.getAttribute('aria-describedby'))
    })
  })
})
```

### 7.5 视觉回归测试

#### Storybook 和 Chromatic 集成

```typescript
// stories/FormBuilder.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { FormBuilder } from '../src/components/crud/form-builder'
import { createTestSchema } from '../src/test-utils'

const meta: Meta<typeof FormBuilder> = {
  title: 'Components/FormBuilder',
  component: FormBuilder,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const userSchema = createTestSchema({
  name: { type: 'string', required: true, label: 'Name' },
  email: { type: 'email', required: true, label: 'Email' },
  role: {
    type: 'enum',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'user', label: 'User' }
    ],
    label: 'Role'
  }
})

export const Default: Story = {
  args: {
    schema: userSchema,
    onSubmit: (data) => console.log('Submitted:', data),
  },
}

export const EditMode: Story = {
  args: {
    schema: userSchema,
    mode: 'edit',
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    },
    onSubmit: (data) => console.log('Updated:', data),
  },
}

export const Loading: Story = {
  args: {
    schema: userSchema,
    loading: true,
    onSubmit: (data) => console.log('Submitted:', data),
  },
}

export const DarkTheme: Story = {
  args: {
    schema: userSchema,
    onSubmit: (data) => console.log('Submitted:', data),
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
}
```

---

## 8. AI 集成支持

### 8.1 智能组件生成

#### AI 驱动的 UI 生成

```typescript
export class AIUIGenerator {
  constructor(private aiService: AIService) {}

  async generateComponentFromDescription(
    description: string,
    context: UIGenerationContext
  ): Promise<ComponentCode> {
    const componentSpec = await this.aiService.generateComponent({
      description,
      context: {
        designSystem: context.designSystem,
        existingComponents: context.existingComponents,
        brandGuidelines: context.brandGuidelines
      }
    })

    return {
      code: componentSpec.code,
      styles: componentSpec.styles,
      tests: componentSpec.tests,
      stories: componentSpec.stories,
      documentation: componentSpec.documentation
    }
  }

  async suggestComponentImprovements(
    component: ComponentAnalysis,
    usage: ComponentUsageStats
  ): Promise<ComponentImprovement[]> {
    const analysis = await this.aiService.analyzeComponent({
      component,
      usage,
      designPatterns: await this.getDesignPatterns(),
      accessibilityGuidelines: await this.getA11yGuidelines()
    })

    return analysis.improvements.map(improvement => ({
      type: improvement.type,
      description: improvement.description,
      impact: improvement.impact,
      implementation: improvement.implementation,
      priority: improvement.priority
    }))
  }

  async generateFormFromSchema(
    schema: EntitySchema<any>,
    requirements: FormRequirements
  ): Promise<FormComponent> {
    const formSpec = await this.aiService.generateForm({
      schema: this.serializeSchema(schema),
      requirements: {
        layout: requirements.layout,
        validation: requirements.validation,
        styling: requirements.styling,
        accessibility: requirements.accessibility
      }
    })

    return this.buildFormComponent(formSpec)
  }
}
```

### 8.2 智能设计建议

#### AI 驱动的设计优化

```typescript
export class AIDesignOptimizer {
  constructor(private aiService: AIService) {}

  async analyzeDesignConsistency(
    components: ComponentAnalysis[],
    designSystem: DesignSystem
  ): Promise<DesignConsistencyReport> {
    const analysis = await this.aiService.analyzeDesign({
      components,
      designSystem,
      guidelines: await this.getDesignGuidelines()
    })

    return {
      score: analysis.consistencyScore,
      violations: analysis.violations,
      suggestions: analysis.suggestions,
      improvements: analysis.improvements
    }
  }

  async suggestColorPalette(
    brandColors: BrandColor[],
    accessibility: AccessibilityRequirements
  ): Promise<ColorPalette> {
    const palette = await this.aiService.generateColorPalette({
      brandColors,
      accessibility: {
        contrastRatio: accessibility.contrastRatio,
        colorBlindness: accessibility.colorBlindness,
        darkMode: accessibility.darkMode
      }
    })

    return {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      neutral: palette.neutral,
      semantic: palette.semantic,
      accessibility: palette.accessibilityReport
    }
  }
}
```

### 8.3 智能用户体验优化

#### AI 驱动的 UX 分析

```typescript
export class AIUXAnalyzer {
  constructor(private aiService: AIService) {}

  async analyzeUserInteractions(
    interactions: UserInteraction[],
    components: ComponentUsage[]
  ): Promise<UXAnalysis> {
    const analysis = await this.aiService.analyzeUX({
      interactions,
      components,
      patterns: await this.getUXPatterns()
    })

    return {
      usabilityScore: analysis.usabilityScore,
      painPoints: analysis.painPoints,
      improvements: analysis.improvements,
      recommendations: analysis.recommendations
    }
  }

  async suggestAccessibilityImprovements(
    component: ComponentSpec,
    a11yReport: AccessibilityReport
  ): Promise<AccessibilityImprovement[]> {
    const suggestions = await this.aiService.suggestA11yImprovements({
      component,
      report: a11yReport,
      guidelines: await this.getA11yGuidelines()
    })

    return suggestions.map(suggestion => ({
      type: suggestion.type,
      severity: suggestion.severity,
      description: suggestion.description,
      implementation: suggestion.implementation,
      impact: suggestion.impact
    }))
  }
}
```

### 8.4 智能主题生成

#### AI 驱动的主题系统

```typescript
export class AIThemeGenerator {
  constructor(private aiService: AIService) {}

  async generateThemeFromBrand(
    brandGuidelines: BrandGuidelines,
    preferences: ThemePreferences
  ): Promise<ThemeConfig> {
    const theme = await this.aiService.generateTheme({
      brand: {
        colors: brandGuidelines.colors,
        typography: brandGuidelines.typography,
        personality: brandGuidelines.personality
      },
      preferences: {
        style: preferences.style,
        accessibility: preferences.accessibility,
        platforms: preferences.platforms
      }
    })

    return {
      name: theme.name,
      displayName: theme.displayName,
      colors: this.processColorScale(theme.colors),
      typography: this.processTypography(theme.typography),
      spacing: this.processSpacing(theme.spacing),
      borderRadius: theme.borderRadius,
      shadows: theme.shadows
    }
  }

  async adaptThemeForAccessibility(
    theme: ThemeConfig,
    requirements: AccessibilityRequirements
  ): Promise<ThemeConfig> {
    const adaptedTheme = await this.aiService.adaptTheme({
      theme,
      requirements: {
        contrastRatio: requirements.contrastRatio,
        colorBlindness: requirements.colorBlindness,
        reducedMotion: requirements.reducedMotion,
        fontSize: requirements.fontSize
      }
    })

    return {
      ...theme,
      colors: adaptedTheme.colors,
      typography: adaptedTheme.typography,
      accessibility: adaptedTheme.accessibilityFeatures
    }
  }
}
```

---

## 📚 参考资料

### 相关文档
- [@linch-kit/core 包文档](./core.md)
- [@linch-kit/schema 包文档](./schema.md)
- [@linch-kit/auth 包文档](./auth.md)
- [@linch-kit/trpc 包文档](./trpc.md)
- [LinchKit 架构概览](../system-architecture.md)

### 外部依赖
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Table](https://tanstack.com/table)

### 设计系统参考
- [Material Design](https://material.io/design)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Ant Design](https://ant.design/)
- [Chakra UI](https://chakra-ui.com/)

### 可访问性资源
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

### 开发工具
- [Storybook](https://storybook.js.org/)
- [Chromatic](https://www.chromatic.com/)
- [Jest](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [axe-core](https://github.com/dequelabs/axe-core)

---

**最后更新**: 2025-06-23
**文档版本**: v1.0.0
**维护者**: LinchKit 开发团队

**重要提醒**: @linch-kit/ui 是用户界面的核心，必须确保组件的可用性、可访问性和性能，提供优秀的用户体验。
