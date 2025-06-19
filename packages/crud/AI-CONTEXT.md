# @linch-kit/crud 包设计上下文

## 📋 包概述

### 核心理念
- **逻辑与 UI 分离**: 核心包专注业务逻辑，UI 包负责界面展示
- **Schema 驱动**: 基于 @linch-kit/schema 自动生成 CRUD 操作
- **权限集成**: 与 @linch-kit/auth-core 深度集成，支持细粒度权限控制
- **tRPC 集成**: 与 @linch-kit/trpc 深度集成，自动生成类型安全的 API
- **类型安全**: 端到端 TypeScript 类型推导
- **框架无关**: 核心逻辑可适配多种 UI 框架

### 包结构设计

```
@linch-kit/crud              # 核心逻辑包 (框架无关)
├── 数据操作抽象 (CRUD Operations)
├── 权限检查逻辑 (Permission Integration)
├── Schema 集成 (Schema Integration)
├── tRPC 集成 (tRPC Integration)
├── 状态管理 (State Management)
├── 验证逻辑 (Validation Logic)
├── 查询构建器 (Query Builder)
└── 事件系统 (Event System)

@linch-kit/crud-ui           # React UI 组件包
├── 列表组件 (List Components)
├── 表单组件 (Form Components)
├── 详情组件 (Detail Components)
├── 搜索组件 (Search Components)
├── 分页组件 (Pagination Components)
└── 布局组件 (Layout Components)

@linch-kit/crud-ui-vue       # Vue UI 组件包 (未来)
@linch-kit/crud-ui-solid     # Solid UI 组件包 (未来)
```

## 🎯 核心功能设计

### 1. 数据操作抽象 (CRUD Operations)

```typescript
interface CRUDOperations<T> {
  // 查询操作
  list(options: ListOptions): Promise<PaginatedResponse<T>>
  get(id: string): Promise<T | null>
  search(query: SearchQuery): Promise<PaginatedResponse<T>>
  
  // 变更操作
  create(data: CreateInput<T>): Promise<T>
  update(id: string, data: UpdateInput<T>): Promise<T>
  delete(id: string): Promise<void>
  bulkDelete(ids: string[]): Promise<void>
  
  // 批量操作
  bulkCreate(data: CreateInput<T>[]): Promise<T[]>
  bulkUpdate(updates: BulkUpdateInput<T>[]): Promise<T[]>
}
```

### 2. 权限集成设计

```typescript
interface CRUDPermissions {
  // 基础权限
  canList: boolean
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  
  // 高级权限
  canBulkDelete: boolean
  canExport: boolean
  canImport: boolean
  
  // 字段级权限
  fieldPermissions: Record<string, FieldPermission>
  
  // 行级权限 (基于数据内容)
  rowPermissions?: (item: any) => RowPermission
}

interface FieldPermission {
  canRead: boolean
  canWrite: boolean
  canFilter: boolean
  canSort: boolean
}
```

### 3. Schema 集成设计

```typescript
interface CRUDSchemaIntegration<T> {
  // 从 Schema 自动推导
  entity: EntityDefinition<T>
  fields: FieldDefinition[]
  relations: RelationDefinition[]

  // UI 配置
  listView: ListViewConfig
  detailView: DetailViewConfig
  formView: FormViewConfig

  // 验证规则
  validation: ValidationRules<T>

  // 权限映射
  permissionMapping: PermissionMapping
}
```

### 4. tRPC 集成设计

```typescript
interface CRUDTRPCIntegration<T> {
  // 自动生成 tRPC 路由
  generateRouter(): TRPCRouter

  // 路由配置
  routerConfig: {
    basePath: string // 如 'user', 'product'
    procedures: {
      list: boolean
      get: boolean
      create: boolean
      update: boolean
      delete: boolean
      search: boolean
      bulkOperations: boolean
    }
  }

  // 中间件集成
  middleware: {
    auth: boolean
    permissions: boolean
    validation: boolean
    logging: boolean
  }

  // 客户端生成
  generateClient(): TRPCClient<T>
}
```

## 🏗️ 架构设计

### 核心架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    @linch-kit/crud-ui                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ ListComponent│ │FormComponent│ │DetailComponent│         │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     @linch-kit/crud                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ CRUDManager │ │PermissionMgr│ │ SchemaAdapter│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ QueryBuilder│ │ StateManager│ │ TRPCAdapter │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐                           │
│  │ EventEmitter│ │ RouterGen   │                           │
│  └─────────────┘ └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              基础包依赖                                      │
│  @linch-kit/schema  @linch-kit/auth-core  @linch-kit/trpc   │
└─────────────────────────────────────────────────────────────┘
```

### 数据流设计

```
用户操作 → UI 组件 → CRUD Manager → 权限检查 → Schema 验证 → 数据操作 → 状态更新 → UI 更新
    ↑                                                                              │
    └──────────────────── 事件反馈 ←─────────────────────────────────────────────┘
```

## 🔧 API 设计

### 1. 核心 CRUD Manager

```typescript
class CRUDManager<T> {
  constructor(config: CRUDConfig<T>)
  
  // 配置方法
  withPermissions(permissions: CRUDPermissions): this
  withSchema(schema: EntityDefinition<T>): this
  withDataSource(dataSource: DataSource<T>): this
  
  // 操作方法
  operations(): CRUDOperations<T>
  permissions(): CRUDPermissions
  schema(): CRUDSchemaIntegration<T>
  
  // 事件方法
  on(event: CRUDEvent, handler: EventHandler): void
  emit(event: CRUDEvent, data: any): void
}
```

### 2. 工厂函数

```typescript
// 基础创建
function createCRUD<T>(config: CRUDConfig<T>): CRUDManager<T>

// Schema 驱动创建
function createCRUDFromSchema<T>(
  entity: EntityDefinition<T>,
  options?: CRUDOptions
): CRUDManager<T>

// 权限集成创建
function createCRUDWithAuth<T>(
  config: CRUDConfig<T>,
  authConfig: AuthCRUDConfig
): CRUDManager<T>
```

### 3. tRPC 路由生成器

```typescript
// 自动生成 tRPC 路由
function generateCRUDRouter<T>(
  manager: CRUDManager<T>,
  options?: TRPCRouterOptions
): TRPCRouter

// 路由配置
interface TRPCRouterOptions {
  basePath: string
  procedures: ProcedureConfig
  middleware: MiddlewareConfig
  auth: AuthConfig
}

// 使用示例
const userRouter = generateCRUDRouter(userCRUD, {
  basePath: 'user',
  procedures: {
    list: true,
    get: true,
    create: true,
    update: true,
    delete: true,
    search: true
  },
  middleware: {
    auth: true,
    permissions: true,
    validation: true
  }
})
```

### 4. React Hooks (crud-ui 包)

```typescript
// 基础 Hooks
function useCRUD<T>(manager: CRUDManager<T>): CRUDHookResult<T>
function useCRUDList<T>(manager: CRUDManager<T>): ListHookResult<T>
function useCRUDForm<T>(manager: CRUDManager<T>): FormHookResult<T>

// tRPC 集成 Hooks
function useCRUDTRPC<T>(router: TRPCRouter): CRUDTRPCHooks<T>
function useCRUDQuery<T>(procedure: string, input?: any): QueryResult<T>
function useCRUDMutation<T>(procedure: string): MutationResult<T>

// 高级 Hooks
function useCRUDPermissions<T>(manager: CRUDManager<T>): PermissionHookResult
function useCRUDValidation<T>(manager: CRUDManager<T>): ValidationHookResult<T>
```

## 🎨 UI 组件设计

### 1. 列表组件

```typescript
interface CRUDListProps<T> {
  manager: CRUDManager<T>
  columns?: ColumnDefinition[]
  actions?: ActionDefinition[]
  filters?: FilterDefinition[]
  pagination?: PaginationConfig
  selection?: SelectionConfig
  layout?: 'table' | 'grid' | 'list'
}
```

### 2. 表单组件

```typescript
interface CRUDFormProps<T> {
  manager: CRUDManager<T>
  mode: 'create' | 'edit'
  initialData?: Partial<T>
  fields?: FieldConfig[]
  layout?: FormLayout
  validation?: ValidationConfig
}
```

### 3. 详情组件

```typescript
interface CRUDDetailProps<T> {
  manager: CRUDManager<T>
  id: string
  fields?: FieldConfig[]
  actions?: ActionDefinition[]
  layout?: DetailLayout
  relations?: RelationConfig[]
}
```

## 🔐 权限集成策略

### 1. 声明式权限配置

```typescript
const userCRUD = createCRUDFromSchema(UserEntity)
  .withPermissions({
    list: 'user:list',
    read: 'user:read', 
    create: 'user:create',
    update: 'user:update',
    delete: 'user:delete',
    
    // 字段级权限
    fields: {
      email: { read: 'user:read:email', write: 'user:write:email' },
      password: { read: false, write: 'user:write:password' }
    },
    
    // 行级权限
    rowLevel: (user, currentUser) => ({
      canRead: user.id === currentUser.id || currentUser.hasRole('admin'),
      canUpdate: user.id === currentUser.id || currentUser.hasRole('admin'),
      canDelete: currentUser.hasRole('admin')
    })
  })
```

### 2. 自动权限检查

```typescript
// 操作前自动检查权限
const result = await userCRUD.operations().create(userData)
// 内部自动调用权限检查，无权限时抛出错误

// UI 组件自动隐藏无权限的操作
<CRUDList manager={userCRUD} />
// 自动隐藏用户无权限的按钮和字段
```

## 📊 状态管理设计

### 1. 状态结构

```typescript
interface CRUDState<T> {
  // 数据状态
  items: T[]
  currentItem: T | null
  
  // 加载状态
  loading: {
    list: boolean
    detail: boolean
    create: boolean
    update: boolean
    delete: boolean
  }
  
  // 错误状态
  errors: {
    list: Error | null
    detail: Error | null
    form: Record<string, string>
  }
  
  // 分页状态
  pagination: PaginationState
  
  // 筛选状态
  filters: FilterState
  
  // 选择状态
  selection: SelectionState
}
```

### 2. 状态更新

```typescript
interface CRUDActions<T> {
  // 数据操作
  loadList(options?: ListOptions): Promise<void>
  loadItem(id: string): Promise<void>
  createItem(data: CreateInput<T>): Promise<T>
  updateItem(id: string, data: UpdateInput<T>): Promise<T>
  deleteItem(id: string): Promise<void>
  
  // 状态操作
  setFilters(filters: FilterState): void
  setPagination(pagination: PaginationState): void
  setSelection(selection: SelectionState): void
  clearErrors(): void
}
```

## 🎯 开发优先级

### 阶段 1: 核心包基础 (2-3小时)
1. ✅ 创建包结构和配置
2. ✅ 实现 CRUDManager 核心类
3. ✅ 实现基础 CRUD 操作接口
4. ✅ 集成权限检查逻辑
5. ✅ 集成 Schema 适配器

### 阶段 2: 状态管理 (1-2小时)  
1. ✅ 实现状态管理器
2. ✅ 实现事件系统
3. ✅ 添加查询构建器
4. ✅ 添加验证逻辑

### 阶段 3: UI 组件包 (3-4小时)
1. ✅ 创建 React Hooks
2. ✅ 实现列表组件
3. ✅ 实现表单组件
4. ✅ 实现详情组件

### 阶段 4: 高级功能 (2-3小时)
1. ✅ 批量操作支持
2. ✅ 导入导出功能
3. ✅ 关联数据处理
4. ✅ 自定义操作支持

## 🔗 依赖关系

### 核心依赖
- `@linch-kit/schema` - Schema 定义和验证
- `@linch-kit/auth-core` - 权限检查
- `@linch-kit/trpc` - tRPC 集成和类型安全 API

### UI 包依赖
- `@linch-kit/crud` - 核心逻辑
- `@linch-kit/ui` - 基础 UI 组件
- `react` + `@tanstack/react-query` - React 生态

### 可选依赖
- `@linch-kit/database` - 数据库操作 (未来)
- `@linch-kit/validation` - 高级验证 (未来)

## 📝 使用示例预览

```typescript
// 1. 创建 CRUD 管理器
const userCRUD = createCRUDFromSchema(UserEntity)
  .withPermissions(userPermissions)
  .withDataSource(userDataSource)
  .withTRPC({ basePath: 'user' })

// 2. 生成 tRPC 路由
const userRouter = generateCRUDRouter(userCRUD, {
  basePath: 'user',
  procedures: {
    list: true,
    get: true,
    create: true,
    update: true,
    delete: true,
    search: true
  }
})

// 3. 在 tRPC 应用路由中使用
const appRouter = router({
  user: userRouter,
  // 其他路由...
})

// 4. 在 React 中使用
function UserManagement() {
  return (
    <CRUDProvider manager={userCRUD}>
      <CRUDList
        columns={['name', 'email', 'role']}
        actions={['edit', 'delete']}
        filters={['role', 'status']}
      />
      <CRUDForm mode="create" />
    </CRUDProvider>
  )
}

// 5. 使用 tRPC 客户端
const { data: users } = trpc.user.list.useQuery({ page: 1, limit: 10 })
const createUser = trpc.user.create.useMutation()

// 6. 编程式使用
const users = await userCRUD.operations().list({ page: 1, limit: 10 })
const newUser = await userCRUD.operations().create({ name: 'John', email: 'john@example.com' })
```

这个设计为后续开发提供了清晰的指导方向。
