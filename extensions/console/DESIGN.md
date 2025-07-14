# Console 模块架构设计

**版本**: v2.0.3 - 最终架构确认  
**更新日期**: 2025-07-14  
**定位**: 企业级管理功能库（Library），通过StarterIntegrationManager被集成使用
**状态**: 成熟功能库，基于实际代码分析确认

## 📋 核心定位 (基于架构分析最终确认)

### ✅ Console 是什么 (已验证)

- **企业功能库**：提供完整的企业级管理功能 (v2.0.3成熟版本) ✅
- **专门集成**：通过StarterIntegrationManager专门处理与starter的集成 ✅
- **完整特性**：Dashboard、TenantManager、ExtensionManager等企业级功能 ✅
- **成熟实现**：基于@linch-kit/*包的完整功能实现，不是空壳 ✅

### ✅ Console 不是什么 (架构协商确认)

- **不是应用外壳**：不是应用容器，而是被集成的功能库 ✅
- **不是独立应用**：需要starter等宿主应用提供运行环境 ✅
- **不是基础设施**：依赖packages/*提供的基础设施能力 ✅
- **不处理宿主职责**：不负责路由容器、Provider包装等宿主功能 ✅

## 🏗️ 架构设计 (基于实际代码实现)

### 0. 集成管理层 (StarterIntegrationManager) ✅ 已实现

Console的核心集成机制，专门处理与starter宿主应用的集成：

```typescript
// src/core/starter-integration.ts (已实现)
export class StarterIntegrationManager extends EventEmitter {
  /**
   * 初始化集成
   */
  async initialize(): Promise<void>
  
  /**
   * 获取集成状态
   */
  getState(): StarterIntegrationState
  
  /**
   * 获取所有动态路由
   */
  getAllRoutes(): DynamicRouteConfig[]
  
  /**
   * 获取菜单树
   */
  getMenuTree(): unknown[]
  
  /**
   * 手动加载Extension
   */
  async loadExtension(extensionName: string): Promise<void>
}

// 创建集成管理器实例 (已导出)
export function createStarterIntegrationManager(
  config?: Partial<StarterIntegrationConfig>
): StarterIntegrationManager

// 默认集成管理器实例 (已导出)
export const starterIntegrationManager = createStarterIntegrationManager()
```

**集成配置接口** (已实现):
```typescript
export interface StarterIntegrationConfig {
  autoInitialize: boolean      // 是否自动初始化
  enableHotReload: boolean     // 是否启用热重载
  enableCommunication: boolean // 是否启用Extension通信
  defaultExtensions: string[]  // 默认加载的Extension列表
  routePrefix: string         // 路由前缀
  enablePermissionCheck: boolean // 是否启用权限检查
}
```

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
    maxProjects: 10,
  }),

  // 计费信息
  plan: defineField.string().default('free'),
  billingCycle: defineField.enum(['monthly', 'yearly']).optional(),

  // 关系
  users: defineField.relation('User').oneToMany(),
  plugins: defineField.relation('Plugin').manyToMany(),

  // 时间戳
  createdAt: defineField.datetime().default('now'),
  updatedAt: defineField.datetime().updatedAt(),
})

// 导出实体集合
export const ConsoleEntities = {
  Tenant: TenantEntity,
  Plugin: PluginEntity,
  SystemMetric: SystemMetricEntity,
  AuditLog: AuditLogEntity,
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
      { path: '/schemas', component: lazy(() => import('./pages/schemas')) },
    ],

    // 导航项
    navigation: getNavigationItems(config),

    // 权限要求
    permissions: getRequiredPermissions(config),
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
      beforeCreate: async data => {
        // 验证域名唯一性
        // 设置默认配额
      },
      afterCreate: async tenant => {
        // 创建默认角色
        // 发送欢迎邮件
      },
    },
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
    },
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
    },
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

## 🔌 集成方式 (基于StarterIntegrationManager实现)

### 1. Starter 中集成 Console ✅ 已实现

```typescript
// apps/starter/lib/console-integration.ts
import { 
  starterIntegrationManager,
  createStarterIntegrationManager 
} from '@linch-kit/console'

// 使用默认集成管理器
export const consoleIntegration = starterIntegrationManager

// 或创建自定义配置的集成管理器
export const customConsoleIntegration = createStarterIntegrationManager({
  autoInitialize: true,
  enableHotReload: process.env.NODE_ENV === 'development',
  defaultExtensions: ['console', 'blog-extension'],
  routePrefix: '/dashboard/ext',
  enablePermissionCheck: true
})
```

### 2. Starter 路由集成 ✅ 基于实际实现

```typescript
// apps/starter/app/console/[[...slug]]/page.tsx
import { starterIntegrationManager } from '@linch-kit/console'

export default async function ConsolePage({ params }) {
  // 获取动态路由
  const routes = starterIntegrationManager.getAllRoutes()
  const menuTree = starterIntegrationManager.getMenuTree()
  
  return (
    <ConsoleContainer 
      routes={routes}
      menuTree={menuTree}
      params={params}
    />
  )
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

## 🚀 关键优势 (基于最终架构确认)

1. **专门集成机制**：StarterIntegrationManager专门处理与宿主应用的集成 ✅
2. **成熟功能库**：v2.0.3版本，功能完整的企业级管理特性 ✅
3. **Host-Container模式**：清晰的职责边界，避免架构职责倒置 ✅
4. **完整企业特性**：Dashboard、多租户、权限控制、扩展管理等 ✅
5. **类型安全集成**：基于@linch-kit/*的端到端类型安全 ✅

---

## 📋 最终架构确认

### ✅ Console v2.0.3 设计验证完成

通过实际代码分析和架构协商，Console的最终定位：

**Console = 企业级管理功能库 (不是应用外壳)**

- **功能定位**: 提供完整的企业管理功能实现
- **集成方式**: 通过StarterIntegrationManager被starter集成
- **依赖关系**: Console依赖packages/*基础设施，被starter宿主应用集成
- **版本状态**: v2.0.3成熟版本，功能完整可用

### 🎯 与架构其他部分的关系

- **starter**: 宿主容器，提供运行环境，集成console功能
- **console**: 功能库，提供企业管理特性，需要宿主环境
- **packages**: 基础设施，为console和starter提供核心能力

**核心原则**: Console专注功能实现，starter专注环境提供，packages专注基础支撑。
