# Console 路由系统

Console 模块的路由系统提供了完整的路由配置和导航生成功能，可以轻松集成到 Next.js Starter 应用中。

## 特性

- 🚀 **开箱即用** - 提供完整的 Console 路由配置
- 🔒 **权限控制** - 内置路由级权限检查
- 🎨 **高度可配置** - 支持自定义路由、禁用默认路由
- 📱 **响应式** - 自动生成导航和面包屑
- 🔄 **动态路由** - 支持参数路由和嵌套路由
- 🌐 **国际化** - 完整的多语言支持

## 基础用法

### 1. 在 Starter 应用中集成

```typescript
// apps/starter/src/app/admin/[[...slug]]/page.tsx
import { ConsoleRouter } from '@linch-kit/console/routes'
import { getCurrentUser, getUserPermissions } from '~/lib/auth'

export default async function AdminPage({
  params
}: {
  params: { slug?: string[] }
}) {
  const user = await getCurrentUser()
  const permissions = await getUserPermissions(user.id)

  return (
    <ConsoleRouter
      config={{
        basePath: '/admin',
        features: ['dashboard', 'tenants', 'users', 'plugins'],
        permissions: {
          access: ['console:access'],
          admin: ['console:admin']
        }
      }}
      params={params}
      permissions={permissions}
      tenantId={user.currentTenantId}
    />
  )
}
```

### 2. 生成导航菜单

```typescript
// apps/starter/src/components/layout/Sidebar.tsx
import { createConsoleRoutes } from '@linch-kit/console/routes'
import { usePermissions } from '~/hooks/usePermissions'

export function Sidebar() {
  const permissions = usePermissions()

  const consoleRoutes = createConsoleRoutes({
    basePath: '/admin',
    features: ['dashboard', 'tenants', 'users', 'plugins']
  })

  return (
    <nav className="space-y-1">
      {consoleRoutes.navigation.map(item => (
        <SidebarItem
          key={item.id}
          item={item}
          userPermissions={permissions}
        />
      ))}
    </nav>
  )
}
```

## 配置选项

### ConsoleConfig

```typescript
interface ConsoleConfig {
  // 基础路径，默认 '/admin'
  basePath?: string

  // 启用的功能模块
  features?: ConsoleFeature[]

  // 权限配置
  permissions?: {
    access?: string[] // 访问 Console 的权限
    admin?: string[] // 管理员权限
  }

  // 主题配置
  theme?: {
    primary?: string // 主色调
    darkMode?: boolean // 暗色模式
  }

  // 自定义路由
  customRoutes?: ConsoleRoute[]

  // 禁用的默认路由
  disabledRoutes?: string[]
}
```

### 功能模块

```typescript
type ConsoleFeature =
  | 'dashboard' // 仪表板
  | 'tenants' // 租户管理
  | 'users' // 用户管理
  | 'permissions' // 权限管理
  | 'plugins' // 插件市场
  | 'monitoring' // 系统监控
  | 'schemas' // Schema 管理
  | 'settings' // 系统设置
```

## 高级用法

### 1. 自定义路由

```typescript
const customRoutes: ConsoleRoute[] = [
  {
    path: '/custom',
    component: lazy(() => import('./CustomPage')),
    meta: {
      title: 'Custom Page',
      icon: 'Star',
      requireAuth: true,
      permissions: ['custom:read'],
      order: 10,
    },
  },
]

const config: ConsoleConfig = {
  basePath: '/admin',
  features: ['dashboard', 'tenants'],
  customRoutes,
}
```

### 2. 禁用默认路由

```typescript
const config: ConsoleConfig = {
  basePath: '/admin',
  features: ['dashboard', 'tenants', 'users', 'plugins'],
  disabledRoutes: ['/settings'], // 禁用设置页面
}
```

### 3. 权限检查

```typescript
import { createConsoleRouter } from '@linch-kit/console/routes'

const router = createConsoleRouter(config)
const route = router.match('/admin/tenants')
const hasPermission = router.checkPermissions(route, userPermissions)

if (!hasPermission) {
  // 处理权限不足
}
```

### 4. 面包屑导航

```typescript
const router = createConsoleRouter(config)
const breadcrumbs = router.getBreadcrumbs('/admin/tenants/123')

// 结果: [
//   { title: 'Dashboard', path: '/admin' },
//   { title: 'Tenants', path: '/admin/tenants' },
//   { title: 'Tenant Details', path: '/admin/tenants/123' }
// ]
```

## 路由权限

每个路由都可以配置权限要求：

```typescript
{
  path: '/tenants',
  component: TenantsPage,
  meta: {
    requireAuth: true,
    permissions: ['console:tenant:read']
  }
}
```

### 权限映射

| 功能模块    | 权限列表                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------- |
| dashboard   | `console:dashboard:read`                                                                           |
| tenants     | `console:tenant:read`, `console:tenant:create`, `console:tenant:update`, `console:tenant:delete`   |
| users       | `console:user:read`, `console:user:create`, `console:user:update`, `console:user:delete`           |
| permissions | `console:permission:read`, `console:permission:manage`, `console:role:read`, `console:role:manage` |
| plugins     | `console:plugin:read`, `console:plugin:install`, `console:plugin:configure`                        |
| monitoring  | `console:monitoring:read`, `console:monitoring:metrics`, `console:monitoring:alerts`               |
| schemas     | `console:schema:read`, `console:schema:design`, `console:schema:generate`                          |
| settings    | `console:settings:read`, `console:settings:update`                                                 |

## 国际化

路由标题支持国际化，使用 i18n key：

```typescript
{
  path: '/tenants',
  component: TenantsPage,
  meta: {
    title: 'console.nav.tenants', // 将自动翻译
    icon: 'Building2'
  }
}
```

## TypeScript 支持

所有类型都完全导出，提供完整的 TypeScript 支持：

```typescript
import type {
  ConsoleConfig,
  ConsoleRoute,
  NavigationItem,
  RouteContext,
} from '@linch-kit/console/routes'
```

## 错误处理

路由系统提供了完善的错误处理：

```typescript
<ConsoleRouter
  config={config}
  params={params}
  permissions={permissions}
  errorBoundary={CustomErrorBoundary}
  fallback={<CustomLoading />}
/>
```

## 最佳实践

1. **权限设计** - 使用细粒度权限，便于灵活控制
2. **功能模块** - 只启用必要的功能模块，减少包大小
3. **自定义路由** - 将业务特定路由放在自定义路由中
4. **国际化** - 为所有路由标题使用 i18n key
5. **错误边界** - 为路由组件添加错误边界处理

## 示例项目

查看 `apps/starter` 目录中的完整示例，了解如何在实际项目中使用 Console 路由系统。
