# Console 模块架构设计

**版本**: v2.0  
**更新日期**: 2025-06-28  
**定位**: 功能库（Library），作为 npm 包被 Starter 或其他应用集成使用

## 📋 核心定位

### Console 是什么
- **功能库**：提供企业级管理控制台的完整功能组件和逻辑
- **可插拔模块**：可被任何 LinchKit 应用集成使用
- **UI + 逻辑**：包含完整的管理界面和业务逻辑，但不包含基础设施

### Console 不是什么
- **不是独立应用**：不能单独运行，需要宿主应用提供运行环境
- **不包含数据库**：Prisma schema 由宿主应用生成
- **不处理认证**：使用宿主应用配置的认证系统

## 🏗️ 架构设计

### 1. 实体定义层（Schema Entities）

```typescript
// modules/console/src/entities/tenant.entity.ts
import { defineEntity, defineField } from '@linch-kit/schema'

export const TenantEntity = defineEntity('Tenant', {
  // 基础字段
  name: defineField.string().required().min(2).max(100),
  domain: defineField.string().required().unique(),
  status: defineField.enum(['active', 'suspended', 'deleted']).default('active'),
  
  // 配额管理
  quotas: defineField.json<TenantQuotas>().default({
    maxUsers: 100,
    maxStorage: 10737418240, // 10GB
    maxProjects: 10
  }),
  
  // 计费信息
  plan: defineField.string().default('free'),
  billingCycle: defineField.enum(['monthly', 'yearly']).optional(),
  
  // 关系
  users: defineField.relation('User').oneToMany(),
  plugins: defineField.relation('Plugin').manyToMany(),
  
  // 时间戳
  createdAt: defineField.datetime().default('now'),
  updatedAt: defineField.datetime().updatedAt()
})

// 导出实体集合
export const ConsoleEntities = {
  Tenant: TenantEntity,
  Plugin: PluginEntity,
  SystemMetric: SystemMetricEntity,
  AuditLog: AuditLogEntity
}
```

### 2. 路由暴露层（Route Exports）

```typescript
// modules/console/src/routes/index.ts
export function createConsoleRoutes(config?: ConsoleConfig) {
  return {
    // 基础路径
    basePath: config?.basePath || '/admin',
    
    // 路由定义
    routes: [
      { path: '/', component: lazy(() => import('./pages/dashboard')) },
      { path: '/tenants', component: lazy(() => import('./pages/tenants')) },
      { path: '/users', component: lazy(() => import('./pages/users')) },
      { path: '/permissions', component: lazy(() => import('./pages/permissions')) },
      { path: '/plugins', component: lazy(() => import('./pages/plugins')) },
      { path: '/monitoring', component: lazy(() => import('./pages/monitoring')) },
      { path: '/schemas', component: lazy(() => import('./pages/schemas')) }
    ],
    
    // 导航项
    navigation: getNavigationItems(config),
    
    // 权限要求
    permissions: getRequiredPermissions(config)
  }
}
```

### 3. 服务层（Services）

```typescript
// modules/console/src/services/tenant.service.ts
import { createCRUDService } from '@linch-kit/crud'
import { TenantEntity } from '../entities'

export const createTenantService = (db: PrismaClient) => {
  const baseService = createCRUDService({
    entity: TenantEntity,
    db,
    hooks: {
      beforeCreate: async (data) => {
        // 验证域名唯一性
        // 设置默认配额
      },
      afterCreate: async (tenant) => {
        // 创建默认角色
        // 发送欢迎邮件
      }
    }
  })
  
  // 扩展特定业务逻辑
  return {
    ...baseService,
    
    // 租户特定操作
    suspend: async (tenantId: string) => {
      // 暂停租户逻辑
    },
    
    updateQuotas: async (tenantId: string, quotas: TenantQuotas) => {
      // 更新配额逻辑
    }
  }
}
```

### 4. 组件层（Components）

```typescript
// modules/console/src/components/tenant/TenantList.tsx
import { SchemaTable } from '@linch-kit/ui'
import { TenantEntity } from '../../entities'

export function TenantList() {
  const { data, isLoading } = useTenants()
  
  return (
    <SchemaTable
      entity={TenantEntity}
      data={data}
      loading={isLoading}
      columns={['name', 'domain', 'status', 'plan']}
      actions={[
        { label: 'Edit', action: 'edit' },
        { label: 'Suspend', action: 'suspend' },
        { label: 'Delete', action: 'delete' }
      ]}
    />
  )
}
```

### 5. Hooks 层（React Hooks）

```typescript
// modules/console/src/hooks/useTenants.ts
import { api } from '../lib/api'

export function useTenants(filters?: TenantFilters) {
  return api.console.tenant.list.useQuery(filters)
}

export function useCreateTenant() {
  const utils = api.useContext()
  
  return api.console.tenant.create.useMutation({
    onSuccess: () => {
      utils.console.tenant.list.invalidate()
    }
  })
}
```

## 📦 导出结构

```typescript
// modules/console/src/index.ts
// 路由相关
export { createConsoleRoutes } from './routes'
export type { ConsoleRouteConfig } from './routes/types'

// Provider
export { ConsoleProvider } from './providers/ConsoleProvider'

// 类型
export type { ConsoleConfig, ConsoleContext } from './types'

// Hooks
export * from './hooks'

// modules/console/package.json
{
  "name": "@linch-kit/console",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./entities": {
      "types": "./dist/entities/index.d.ts",
      "import": "./dist/entities/index.js"
    },
    "./services": {
      "types": "./dist/services/index.d.ts",
      "import": "./dist/services/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "import": "./dist/components/index.js"
    },
    "./hooks": {
      "types": "./dist/hooks/index.d.ts",
      "import": "./dist/hooks/index.js"
    }
  }
}
```

## 🔌 集成方式

### 1. Starter 中生成 Schema

```bash
# apps/starter/package.json
{
  "scripts": {
    "schema:generate": "linch-kit schema generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push"
  }
}

# 执行生成
pnpm schema:generate
```

### 2. Starter 中集成路由

```typescript
// apps/starter/src/app/admin/[[...slug]]/page.tsx
import { createConsoleRoutes } from '@linch-kit/console'

const consoleRoutes = createConsoleRoutes({
  basePath: '/admin',
  features: ['tenant', 'user', 'plugin', 'monitoring']
})

export default function AdminPage({ params }) {
  return <ConsoleRouter routes={consoleRoutes} params={params} />
}
```

### 3. Starter 中配置 API

```typescript
// apps/starter/src/server/api/root.ts
import { createConsoleRouter } from '@linch-kit/console/api'
import { db } from '~/lib/db'

export const appRouter = createTRPCRouter({
  console: createConsoleRouter({ db }),
  // 其他路由...
})
```

## 🎯 开发计划

### Phase 1: 基础架构（当前）
1. ✅ 实体定义（entities）
2. ⏳ 服务层实现（services）
3. ⏳ 基础组件（components）
4. ⏳ 路由系统（routes）

### Phase 2: 核心功能
1. ⏳ 仪表板页面
2. ⏳ 租户管理
3. ⏳ 用户管理
4. ⏳ 权限管理

### Phase 3: 高级功能
1. ⏳ 插件市场
2. ⏳ 系统监控
3. ⏳ Schema 管理器
4. ⏳ 审计日志

### Phase 4: 优化完善
1. ⏳ 性能优化
2. ⏳ 测试覆盖
3. ⏳ 文档完善
4. ⏳ 示例应用

## 📋 目录结构

```
modules/console/
├── src/
│   ├── entities/         # Schema 实体定义
│   │   ├── tenant.entity.ts
│   │   ├── plugin.entity.ts
│   │   ├── system-metric.entity.ts
│   │   ├── audit-log.entity.ts
│   │   └── index.ts
│   ├── services/         # 业务逻辑服务
│   │   ├── tenant.service.ts
│   │   ├── plugin.service.ts
│   │   └── index.ts
│   ├── components/       # React 组件
│   │   ├── dashboard/
│   │   ├── tenant/
│   │   ├── user/
│   │   ├── permission/
│   │   ├── plugin/
│   │   ├── monitoring/
│   │   ├── schema/
│   │   └── shared/
│   ├── routes/          # 路由配置
│   │   ├── index.ts
│   │   ├── pages/
│   │   └── types.ts
│   ├── hooks/           # React Hooks
│   │   ├── useTenants.ts
│   │   ├── usePlugins.ts
│   │   └── index.ts
│   ├── lib/             # 工具函数
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── types/           # TypeScript 类型
│   │   └── index.ts
│   ├── providers/       # React Providers
│   │   └── ConsoleProvider.tsx
│   └── index.ts         # 主入口
├── package.json
├── tsconfig.json
├── README.md
└── DESIGN.md
```

## 🚀 关键优势

1. **完全解耦**：Console 不依赖具体的数据库实现
2. **类型安全**：从 Schema 到 UI 的端到端类型安全
3. **易于集成**：简单的 API 即可集成到任何应用
4. **功能完整**：提供企业级管理平台的所有功能
5. **高度可配置**：通过配置控制功能和行为