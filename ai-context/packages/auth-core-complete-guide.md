# Auth Core 完整功能指南

## 🎯 包概述

`@linch-kit/auth-core` 是 Linch Kit 框架的认证和授权核心包，提供完整的企业级认证解决方案。

### ✅ 核心功能验证

#### 1. 认证系统 ✅
- **NextAuth.js 集成**: 完全兼容 NextAuth.js 生态
- **多种认证提供者**: OAuth、凭据、共享令牌
- **类型安全**: 完整的 TypeScript 支持
- **会话管理**: JWT 和数据库会话策略

#### 2. 权限系统 ✅
- **RBAC 支持**: 基于角色的访问控制
- **ABAC 支持**: 基于属性的访问控制
- **层级权限**: 部门和组织层级权限
- **模块化权限**: 跨模块权限管理

#### 3. 多租户支持 ✅
- **租户隔离**: 完整的多租户数据隔离
- **租户权限**: 租户级别的权限管理
- **动态租户**: 运行时租户切换

#### 4. Schema 集成 ✅
- **实体模板**: 4种预设用户模板
- **自动生成**: Prisma schema 自动生成
- **类型安全**: 端到端类型安全

#### 5. 插件系统 ✅
- **CLI 插件**: 认证相关命令行工具
- **配置插件**: 动态配置管理
- **扩展性**: 支持第三方扩展

## 🏗️ 架构设计

### 核心模块结构
```
src/
├── core/                    # 核心功能
│   ├── auth.ts             # NextAuth 配置
│   ├── permissions.ts      # 基础权限系统
│   ├── modular-permission-checker.ts  # 模块化权限
│   ├── permission-registry.ts         # 权限注册表
│   └── session.ts          # 会话管理
├── schemas/                 # 实体模板
│   ├── user.ts             # 用户实体模板
│   ├── session.ts          # 会话实体模板
│   ├── permissions.ts      # 权限实体模板
│   └── index.ts            # 预设套件
├── providers/               # 认证提供者
│   ├── oauth.ts            # OAuth 提供者
│   └── shared-token/       # 共享令牌提供者
├── integrations/            # 第三方集成
│   └── trpc-middleware.ts  # tRPC 权限中间件
├── plugins/                 # 插件系统
│   ├── cli-plugin.ts       # CLI 命令插件
│   └── config-plugin.ts    # 配置插件
├── types/                   # 类型定义
│   ├── auth.ts             # 认证类型
│   ├── permissions.ts      # 权限类型
│   └── user.ts             # 用户类型
└── i18n/                    # 国际化
    └── messages.ts          # 默认消息
```

## 🚀 快速开始

### 1. 基础认证配置

```typescript
import { createAuthConfig, oauthProviders } from '@linch-kit/auth-core'

const authConfig = createAuthConfig({
  providers: [
    oauthProviders.google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    oauthProviders.github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async session(session, user) {
      // 自定义会话处理
      return session
    }
  }
})
```

### 2. 使用实体模板

```typescript
import { 
  BasicAuthKit, 
  EnterpriseAuthKit,
  MultiTenantAuthKit 
} from '@linch-kit/auth-core'

// 基础套件 - 最小化用户和会话
const basicEntities = BasicAuthKit

// 企业套件 - 包含角色权限和部门
const enterpriseEntities = EnterpriseAuthKit

// 多租户套件 - 完整的多租户支持
const multiTenantEntities = MultiTenantAuthKit
```

### 3. 权限检查

```typescript
import { 
  createPermissionChecker,
  createHierarchicalPermissionChecker 
} from '@linch-kit/auth-core'

// 基础权限检查器
const permissionChecker = createPermissionChecker({
  async hasPermission(userId, resource, action, context) {
    // 自定义权限检查逻辑
    return true
  }
})

// 层级权限检查器
const hierarchicalChecker = createHierarchicalPermissionChecker({
  enabled: true,
  superiorCanViewSubordinate: true,
  superiorCanManageSubordinate: true
})
```

### 4. 模块化权限

```typescript
import { 
  createPermissionRegistry,
  createModularPermissionChecker 
} from '@linch-kit/auth-core'

// 创建权限注册表
const registry = createPermissionRegistry()

// 注册模块权限
await registry.registerModule({
  moduleName: 'wms',
  resources: [
    {
      name: 'warehouse',
      actions: [
        { name: 'create', description: '创建仓库' },
        { name: 'read', description: '查看仓库' }
      ]
    }
  ]
})

// 创建模块化权限检查器
const modularChecker = createModularPermissionChecker(registry)

// 检查模块权限
const hasPermission = await modularChecker.hasModulePermission(
  'user-123', 'wms', 'warehouse', 'create'
)
```

## 🔧 高级功能

### 1. tRPC 集成

```typescript
import { createAuthMiddleware } from '@linch-kit/auth-core'

const authMiddleware = createAuthMiddleware({
  permissionChecker: modularChecker,
  multiTenant: {
    enabled: true,
    tenantResolver: (req) => req.headers['x-tenant-id']
  }
})

// 在 tRPC 中使用
const protectedProcedure = publicProcedure.use(authMiddleware)
```

### 2. 共享令牌认证

```typescript
import { createSharedTokenProvider } from '@linch-kit/auth-core'

const sharedTokenProvider = createSharedTokenProvider({
  token: process.env.SHARED_TOKEN!,
  apiUrl: 'https://api.example.com',
  userEndpoint: '/user/me'
})
```

### 3. CLI 工具

```bash
# 初始化认证配置
linch auth:init --type ts

# 生成认证实体
linch auth:generate --kit enterprise --roles --departments

# 生成权限系统
linch auth:permissions --strategy rbac --hierarchical

# 验证配置
linch auth:validate

# 显示配置信息
linch auth:info
```

## 📋 实体模板详解

### 用户模板

1. **MinimalUserTemplate**: 最小化用户 (id, name)
2. **BasicUserTemplate**: 基础用户 (email, phone, username, avatar)
3. **EnterpriseUserTemplate**: 企业用户 (角色, 权限, 部门, 员工ID)
4. **MultiTenantUserTemplate**: 多租户用户 (全局身份, 租户关联)

### 会话模板

1. **SessionTemplate**: 基础会话 (token, userId, expires)
2. **ExtendedSessionTemplate**: 扩展会话 (设备信息, 位置, 状态)
3. **AccountTemplate**: OAuth 账户 (provider, tokens)

### 权限模板

1. **RoleTemplate**: 角色定义 (权限列表, 继承关系)
2. **PermissionTemplate**: 权限定义 (资源, 操作, 条件)
3. **UserRoleTemplate**: 用户角色关联
4. **DepartmentTemplate**: 部门层级
5. **UserDepartmentTemplate**: 用户部门关联
6. **TenantTemplate**: 租户定义

## 🔌 插件系统

### CLI 插件功能

- `auth:init`: 初始化认证配置
- `auth:generate`: 生成认证实体
- `auth:permissions`: 生成权限系统
- `auth:validate`: 验证配置
- `auth:info`: 显示配置信息

### 配置插件功能

- 动态配置注册
- 配置模板生成
- 配置验证
- 多格式支持 (TS/JS/JSON)

## 🎯 最佳实践

### 1. 渐进式采用

```typescript
// 第一步：基础认证
const basicAuth = createAuthConfig({
  providers: [oauthProviders.google(googleConfig)]
})

// 第二步：添加权限
const withPermissions = createAuthConfig({
  providers: [oauthProviders.google(googleConfig)],
  permissions: {
    strategy: 'rbac',
    checkPermission: permissionChecker.hasPermission
  }
})

// 第三步：多租户
const multiTenant = createAuthConfig({
  providers: [oauthProviders.google(googleConfig)],
  permissions: { /* ... */ },
  multiTenant: {
    enabled: true,
    tenantResolver: (req) => req.headers['x-tenant-id']
  }
})
```

### 2. 模块化权限设计

```typescript
// 按业务模块组织权限
const modulePermissions = {
  wms: {
    resources: ['warehouse', 'inventory', 'shipping'],
    roles: ['warehouse-manager', 'operator']
  },
  crm: {
    resources: ['customer', 'order', 'contract'],
    roles: ['sales-manager', 'sales-rep']
  }
}
```

### 3. 类型安全使用

```typescript
// 使用实体模板确保类型安全
import type { Entity } from '@linch-kit/schema'
import { EnterpriseUserTemplate } from '@linch-kit/auth-core'

type User = Entity<typeof EnterpriseUserTemplate>['type']

// 类型安全的权限检查
const hasPermission: boolean = await permissionChecker.hasPermission(
  user.id,
  'warehouse' as const,
  'create' as const
)
```

## 🔍 故障排除

### 常见问题

1. **类型错误**: 确保正确导入类型定义
2. **权限检查失败**: 检查权限注册和用户角色
3. **多租户问题**: 验证租户解析器配置
4. **会话问题**: 检查会话策略和存储配置

### 调试技巧

```typescript
// 启用调试模式
const authConfig = createAuthConfig({
  // ...
  debug: true
})

// 使用权限工具函数
import { permissionUtils } from '@linch-kit/auth-core'

const hasAnyPermission = await permissionUtils.hasAnyPermission(
  checker, userId, [
    { resource: 'warehouse', action: 'read' },
    { resource: 'inventory', action: 'read' }
  ]
)
```

## 📈 性能优化

### 1. 权限缓存

```typescript
// 实现权限缓存
const cachedChecker = createPermissionChecker({
  async hasPermission(userId, resource, action, context) {
    const cacheKey = `${userId}:${resource}:${action}`
    const cached = cache.get(cacheKey)
    if (cached !== undefined) return cached
    
    const result = await actualPermissionCheck(userId, resource, action, context)
    cache.set(cacheKey, result, { ttl: 300 }) // 5分钟缓存
    return result
  }
})
```

### 2. 批量权限检查

```typescript
// 批量检查权限
const permissions = await Promise.all([
  checker.hasPermission(userId, 'warehouse', 'read'),
  checker.hasPermission(userId, 'inventory', 'read'),
  checker.hasPermission(userId, 'shipping', 'read')
])
```

## 🚀 未来规划

### 即将推出的功能

1. **审计日志**: 完整的权限操作审计
2. **动态权限**: 运行时权限规则更新
3. **联邦认证**: SAML/OIDC 支持
4. **权限可视化**: 权限关系图表
5. **性能监控**: 权限检查性能分析

### 生态系统集成

1. **@linch-kit/crud**: CRUD 操作权限集成
2. **@linch-kit/workflow**: 工作流权限集成
3. **@linch-kit/plugin-system**: 插件权限管理
4. **@linch-kit/monitoring**: 权限监控和告警

## 📚 相关资源

- [NextAuth.js 文档](https://next-auth.js.org/)
- [Prisma 文档](https://www.prisma.io/docs/)
- [tRPC 文档](https://trpc.io/)
- [Zod 文档](https://zod.dev/)

---

**版本**: 0.1.0  
**最后更新**: 2024-12-18  
**状态**: ✅ 功能完整，类型安全
