# 🔄 Linch Kit 全面重构计划

## 📋 重构目标

1. **简化 API 设计**：减少复杂的嵌套装饰器，提供更直观的配置方式
2. **统一设计语言**：所有包采用一致的 API 设计模式
3. **增强类型安全**：更好的 TypeScript 支持和类型推导
4. **提升开发体验**：更好的 IDE 支持、错误提示和文档
5. **模块化架构**：清晰的包职责划分和依赖关系

## 🎯 核心设计原则

### 1. 配置优于约定 (Configuration over Convention)
- 提供合理的默认值
- 允许用户灵活覆盖配置
- 配置应该是声明式的，而不是命令式的

### 2. 组合优于继承 (Composition over Inheritance)
- 使用配置对象而不是嵌套装饰器
- 功能通过组合实现，而不是复杂的继承链

### 3. 渐进增强 (Progressive Enhancement)
- 基础功能开箱即用
- 高级功能可选配置
- 向后兼容性保证

## 📦 包重构计划

### 1. @linch-kit/schema (已重构)

**重构内容**：
- ✅ 统一的 `field()` 装饰器替代多个嵌套装饰器
- ✅ 简化的 i18n 支持（只需要 key，不绑定具体库）
- ✅ 更清晰的类型定义

**新 API 设计**：
```typescript
// 旧写法（复杂）
email: order(label(unique(z.string().email()), 'Email'), 1)

// 新写法（简洁）
email: field(z.string().email(), {
  unique: true,
  label: 'user.email.label',
  order: 1
})
```

### 2. @linch-kit/auth (需重构)

**当前问题**：
- 认证配置分散
- 缺少统一的权限管理接口
- 与 UI 组件耦合度高

**重构目标**：
```typescript
// 统一的认证配置
const authConfig = createAuthConfig({
  providers: [
    googleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    credentialsProvider({
      authorize: async (credentials) => {
        // 自定义认证逻辑
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  permissions: {
    roles: ['USER', 'ADMIN', 'MODERATOR'],
    resources: ['users', 'posts', 'comments'],
    actions: ['create', 'read', 'update', 'delete']
  }
})

// 权限检查
const canUserEditPost = checkPermission(user, 'posts', 'update', post)
```

### 3. @linch-kit/ui (需重构)

**当前问题**：
- 组件功能单一
- 缺少复合组件
- 与业务逻辑耦合

**重构目标**：
```typescript
// 表单组件
<SchemaForm 
  schema={UserSchema}
  onSubmit={handleSubmit}
  i18n={t}
/>

// 数据表格
<SchemaTable 
  schema={UserSchema}
  data={users}
  actions={['edit', 'delete']}
  i18n={t}
/>

// 详情视图
<SchemaDetail 
  schema={UserSchema}
  data={user}
  i18n={t}
/>
```

### 4. @linch-kit/crud (新增)

**功能**：基于 Schema 的 CRUD 操作
```typescript
const userCrud = createCrud({
  schema: UserSchema,
  api: {
    baseUrl: '/api/users',
    endpoints: {
      list: 'GET /',
      create: 'POST /',
      update: 'PUT /:id',
      delete: 'DELETE /:id'
    }
  },
  permissions: {
    create: 'users:create',
    update: 'users:update',
    delete: 'users:delete'
  }
})

// 自动生成的 hooks
const { data, isLoading } = userCrud.useList()
const { mutate: createUser } = userCrud.useCreate()
```

### 5. @linch-kit/forms (新增)

**功能**：基于 Schema 的表单生成
```typescript
const UserForm = createForm({
  schema: UserSchema,
  layout: 'vertical',
  validation: 'onChange',
  i18n: t
})

// 使用
<UserForm 
  defaultValues={user}
  onSubmit={handleSubmit}
  onValidationError={handleError}
/>
```

### 6. @linch-kit/table (新增)

**功能**：基于 Schema 的数据表格
```typescript
const UserTable = createTable({
  schema: UserSchema,
  features: ['sorting', 'filtering', 'pagination'],
  actions: ['edit', 'delete', 'view'],
  i18n: t
})
```

## 🔧 技术重构

### 1. 类型系统增强

```typescript
// 更好的类型推导
type InferredUser = InferEntity<typeof UserSchema>
type CreateUserInput = InferCreateInput<typeof UserSchema>
type UpdateUserInput = InferUpdateInput<typeof UserSchema>

// 类型安全的字段访问
const emailField = UserSchema.fields.email // 类型安全
const emailConfig = getFieldConfig(UserSchema, 'email') // 完整配置
```

### 2. 插件系统

```typescript
// 插件接口
interface LinchKitPlugin {
  name: string
  version: string
  install(app: LinchKitApp): void
}

// 使用插件
const app = createLinchKitApp({
  plugins: [
    authPlugin(),
    i18nPlugin(),
    validationPlugin()
  ]
})
```

### 3. 开发工具

```typescript
// CLI 工具增强
npx linch-kit generate schema User
npx linch-kit generate crud User
npx linch-kit generate form User
npx linch-kit generate table User

// 代码生成
npx linch-kit codegen --watch
```

## 📅 重构时间线

### Phase 1: 核心重构 (2 周)
- ✅ @linch-kit/schema 重构完成
- 🔄 @linch-kit/auth 重构
- 🔄 @linch-kit/ui 基础组件重构

### Phase 2: 新包开发 (3 周)
- 🆕 @linch-kit/crud 开发
- 🆕 @linch-kit/forms 开发
- 🆕 @linch-kit/table 开发

### Phase 3: 集成测试 (1 周)
- 🧪 starter 应用更新
- 🧪 文档更新
- 🧪 示例项目

### Phase 4: 发布准备 (1 周)
- 📚 迁移指南
- 📖 API 文档
- 🎥 视频教程

## 🎯 成功指标

1. **开发体验**：
   - 减少 50% 的样板代码
   - 提升 IDE 支持和类型提示
   - 更清晰的错误信息

2. **性能**：
   - 减少 bundle 大小
   - 更好的 tree-shaking
   - 运行时性能优化

3. **可维护性**：
   - 更清晰的包职责划分
   - 更好的测试覆盖率
   - 更简单的升级路径

4. **社区采用**：
   - 更低的学习曲线
   - 更好的文档和示例
   - 更活跃的社区贡献

## 🚀 下一步行动

1. **立即开始**：@linch-kit/auth 重构
2. **并行进行**：@linch-kit/ui 组件设计
3. **准备工作**：新包的 API 设计文档
4. **社区反馈**：收集用户对新 API 的意见

这个重构计划将使 Linch Kit 成为一个更加现代化、易用且强大的全栈开发框架。
