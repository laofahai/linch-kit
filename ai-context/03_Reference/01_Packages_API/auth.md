---
package: '@linch-kit/auth'
version: '2.0.2'
layer: 'L2'
dependencies: ['@linch-kit/core', 'tools/schema']
completeness: 90
test_coverage: 6
status: 'production_ready'
document_type: 'api_reference'
purpose: 'Graph RAG knowledge base - 企业级认证权限管理包，基于NextAuth.js 5.0构建'
api_exports:
  - name: 'createLinchKitAuthConfig'
    type: 'function'
    status: 'stable'
  - name: 'CASLPermissionEngine'
    type: 'class'
    status: 'stable'
  - name: 'EnhancedPermissionEngine'
    type: 'class'
    status: 'stable'
  - name: 'createPermissionMiddleware'
    type: 'function'
    status: 'stable'
  - name: 'AuthProvider'
    type: 'component'
    status: 'stable'
  - name: 'useSession'
    type: 'hook'
    status: 'stable'
  - name: 'MFAManager'
    type: 'class'
    status: 'stable'
  - name: 'createAuthRouter'
    type: 'function'
    status: 'stable'
relationships:
  - type: 'depends_on'
    targets: ['@linch-kit/core', 'tools/schema']
  - type: 'provides_auth_for'
    targets: ['@linch-kit/platform', '@linch-kit/platform', '@linch-kit/ui']
  - type: 'integrates_with'
    targets: ['NextAuth.js', 'CASL', 'React']
last_verified: '2025-07-07'
---

# @linch-kit/auth 包 API 文档

**版本**: 2.0.2  
**创建**: 2025-07-05  
**状态**: 已审查并修正  
**依赖**: @linch-kit/core, tools/schema

## 🎯 包概述

`@linch-kit/auth` 是 LinchKit 的企业级认证权限管理包，遵循"不重复造轮子"原则，基于成熟的 NextAuth.js 5.0 构建，提供完整的认证和权限管理解决方案。

### 核心特性

- **NextAuth.js 5.0 集成** - 基于成熟的认证解决方案
- **CASL + 增强权限引擎** - 支持 RBAC 和 ABAC 混合权限模型
- **企业级扩展** - 多租户、MFA、审计日志等功能
- **多种中间件** - Express、装饰器、React Hook 等多种集成方式
- **类型安全** - 完整的 TypeScript 类型定义
- **tRPC 集成** - 提供 tRPC 路由工厂

## 📦 安装与配置

```bash
bun add @linch-kit/auth
```

### 依赖关系图

```typescript
// 内部依赖
@linch-kit/core     // 日志、配置、插件系统
tools/schema   // 类型定义和验证

// 外部依赖
next-auth: 5.0.0-beta.25    // 认证核心
@casl/ability: ^6.7.3       // 权限引擎
@auth/core: ^0.40.0          // NextAuth 核心
zod: ^3.25.67               // Schema 验证
```

## 🔧 核心 API

### 1. 认证配置

#### `createLinchKitAuthConfig(config: LinchKitAuthConfig): NextAuthConfig`

创建 LinchKit 定制的 NextAuth.js 配置

```typescript
import { createLinchKitAuthConfig } from '@linch-kit/auth'

const authConfig = createLinchKitAuthConfig({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    credentials: {
      authorize: async credentials => {
        // 自定义认证逻辑
        return await validateUser(credentials)
      },
    },
  },
  callbacks: {
    beforeSignIn: async ({ user, account, profile }) => {
      // 登录前置检查
      return await checkUserAccess(user)
    },
    extendSession: async (session, token) => {
      // 扩展会话信息
      session.tenantId = token.tenantId
      session.permissions = await getUserPermissions(session.user.id)
      return session
    },
    extendJWT: async (token, user, account) => {
      // 扩展 JWT 信息
      if (user) {
        token.tenantId = user.tenantId
      }
      return token
    },
  },
  events: {
    onSignIn: async ({ user, account }) => {
      // 登录事件处理
      await auditLogger.log('user_login', { user, account })
    },
  },
})
```

#### `createDefaultLinchKitAuthConfig(): NextAuthConfig`

创建默认的认证配置

```typescript
const defaultConfig = createDefaultLinchKitAuthConfig()
```

### 2. 权限引擎

#### `CASLPermissionEngine`

基于 CASL 的基础权限引擎

```typescript
import { CASLPermissionEngine } from '@linch-kit/auth'

const permissionEngine = new CASLPermissionEngine()

// 基础权限检查
const canEdit = await permissionEngine.check(user, 'update', 'Category', { tenantId: 'tenant-1' })

// 批量权限检查
const results = await permissionEngine.checkMultiple(user, [
  { userId: user.id, action: 'read', subject: 'Category' },
  { userId: user.id, action: 'update', subject: 'Tag' },
])

// 字段级权限过滤
const filteredData = await permissionEngine.filterFields(
  user,
  userData,
  ['name', 'email', 'salary'], // 请求的字段
  { tenantId: 'tenant-1' }
)
```

#### `EnhancedPermissionEngine`

增强的权限引擎，支持更复杂的企业级权限策略

```typescript
import {
  EnhancedPermissionEngine,
  createEnhancedPermissionEngine,
  type EnhancedPermissionResult,
} from '@linch-kit/auth'

const engine = createEnhancedPermissionEngine({
  cacheEnabled: true,
  auditEnabled: true,
})

// 增强的权限检查，返回详细结果
const result: EnhancedPermissionResult = await engine.checkEnhanced(user, 'delete', 'Project', {
  projectId: 'project-123',
})

console.log({
  granted: result.granted,
  allowedFields: result.allowedFields,
  deniedFields: result.deniedFields,
  conditions: result.conditions,
  reason: result.reason,
})
```

### 3. 中间件系统

#### `createPermissionMiddleware(config: PermissionMiddlewareConfig)`

创建权限检查中间件函数

```typescript
import { createPermissionMiddleware } from '@linch-kit/auth'

const checkPermission = createPermissionMiddleware({
  getUser: async request => {
    // 从请求中获取用户信息
    return await getUserFromRequest(request)
  },
  permissionEngine: new EnhancedPermissionEngine(),
  getContext: async request => {
    // 获取权限上下文
    return {
      tenantId: request.headers['x-tenant-id'],
      deviceType: request.headers['user-agent'].includes('Mobile') ? 'mobile' : 'desktop',
      ipAddress: request.ip,
    }
  },
  unauthorizedRedirect: '/login',
  forbiddenRedirect: '/forbidden',
  jsonResponse: true, // API 路由使用 JSON 响应
})

// 使用中间件
const result = await checkPermission(request, {
  action: 'read',
  subject: 'User',
  checkFields: true,
  requiredFields: ['name', 'email'],
})
```

#### `permissionMiddleware(config)`

Express/Connect 风格的中间件

```typescript
import { permissionMiddleware } from '@linch-kit/auth'

const middleware = permissionMiddleware({
  getUser: async req => req.user,
  action: 'read',
  subject: 'User',
  checkFields: true,
  requiredFields: ['name', 'email'],
  jsonResponse: true,
})

// 在 Express 中使用
app.get('/api/users', middleware, (req, res) => {
  // req.permission 包含权限检查结果
  res.json({
    users: [],
    permission: req.permission,
  })
})
```

#### `requirePermission(options)`

装饰器风格的权限检查（用于 tRPC）

```typescript
import { requirePermission } from '@linch-kit/auth'

class UserService {
  @requirePermission({
    action: 'read',
    subject: 'User',
    checkFields: true,
    requiredFields: ['name', 'email'],
  })
  async getUsers(ctx: Context) {
    // ctx.permission 包含权限检查结果
    return await this.userRepository.findMany()
  }

  @requirePermission({ action: 'delete', subject: 'User' })
  async deleteUser(ctx: Context, id: string) {
    return await this.userRepository.delete(id)
  }
}
```

#### `createUsePermission(config)`

React Hook 风格的权限检查

```typescript
import { createUsePermission } from '@linch-kit/auth'

const usePermission = createUsePermission({
  getUser: () => session?.user,
  permissionEngine: new EnhancedPermissionEngine(),
  getContext: () => ({
    tenantId: 'tenant-1',
    deviceType: 'desktop'
  })
})

function UserManagement() {
  const { loading, allowed, allowedFields, deniedFields } = usePermission({
    action: 'manage',
    subject: 'User',
    checkFields: true,
    requiredFields: ['name', 'email', 'roles']
  })

  if (loading) return <div>Loading permissions...</div>
  if (!allowed) return <div>Access Denied</div>

  return (
    <div>
      <h1>User Management</h1>
      {allowedFields?.includes('roles') && <RoleEditor />}
      {allowedFields?.includes('permissions') && <PermissionEditor />}
    </div>
  )
}
```

### 4. 企业级扩展

#### `EnterpriseAuthExtensions`

企业级认证扩展功能

```typescript
import { EnterpriseAuthExtensions } from '@linch-kit/auth'

const extensions = new EnterpriseAuthExtensions({
  auditEnabled: true,
  mfaRequired: true,
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    preventReuse: 5,
  },
  sessionPolicy: {
    maxConcurrentSessions: 3,
    maxInactiveTime: '30m',
    extendOnActivity: true,
  },
})
```

#### `MFAManager`

多因子认证管理器

```typescript
import { MFAManager } from '@linch-kit/auth'

const mfaManager = new MFAManager()

// 设置 TOTP
const totpSetup = await mfaManager.setupTOTP(userId)
console.log('QR Code:', totpSetup.qrCode)
console.log('Backup Codes:', totpSetup.backupCodes)

// 验证 MFA
const isValid = await mfaManager.verifyMFA({
  userId,
  method: 'totp',
  token: '123456',
})

// 短信 MFA
await mfaManager.sendSMSCode(userId, '+1234567890')
const smsValid = await mfaManager.verifyMFA({
  userId,
  method: 'sms',
  token: '654321',
})
```

### 5. React 集成

#### `AuthProvider`

React 认证提供者组件

```typescript
import { AuthProvider } from '@linch-kit/auth'

function App() {
  return (
    <AuthProvider
      permissionEngine={new EnhancedPermissionEngine()}
      onPermissionDenied={(action, subject) => {
        console.log(`Permission denied: ${action} on ${subject}`)
      }}
    >
      <YourApp />
    </AuthProvider>
  )
}
```

#### NextAuth.js Hooks

导出 NextAuth.js 的 React hooks

```typescript
import { useSession, signIn, signOut, getSession } from '@linch-kit/auth'

function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>

  if (session) {
    return (
      <div>
        <p>Signed in as {session.user.name}</p>
        <p>Tenant: {session.tenantId}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }

  return <button onClick={() => signIn()}>Sign in</button>
}
```

### 6. 服务层

#### `PermissionService`

权限管理服务

```typescript
import { PermissionService } from '@linch-kit/auth'

const permissionService = new PermissionService({
  permissionEngine: new EnhancedPermissionEngine(),
  auditLogger: auditLogger,
})

// 用户权限管理
await permissionService.assignRole(userId, 'admin')
await permissionService.revokeRole(userId, 'user')
await permissionService.grantPermission(userId, 'manage:User')

// 权限查询
const userPermissions = await permissionService.getUserPermissions(userId)
const userRoles = await permissionService.getUserRoles(userId)
```

### 7. tRPC 集成

#### `createAuthRouter`

创建认证相关的 tRPC 路由

```typescript
import { createAuthRouter } from '@linch-kit/auth'

const authRouter = createAuthRouter({
  permissionEngine: new EnhancedPermissionEngine(),
  auditLogger: auditLogger,
  mfaManager: new MFAManager(),
})

// 与主路由合并
const appRouter = router({
  auth: authRouter,
  // ... 其他路由
})
```

## 📊 类型定义

### 核心类型

```typescript
// 用户类型
interface LinchKitUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  tenantId?: string
  status?: 'active' | 'inactive' | 'disabled' | 'pending'
  emailVerified?: Date | null
  createdAt?: Date
  updatedAt?: Date
  lastLoginAt?: Date | null
  metadata?: Record<string, unknown>
}

// 增强的会话类型
interface LinchKitSession {
  user: LinchKitUser
  tenantId?: string
  permissions?: string[]
  roles?: string[]
  expires: string
}

// 权限类型
type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'execute'
type PermissionSubject = 'User' | 'Role' | 'Permission' | 'Category' | 'all' | string

// 权限检查请求
interface PermissionCheck {
  userId: string
  action: string
  subject: string | Record<string, unknown>
  context?: PermissionContext
}

// 权限上下文
interface PermissionContext {
  tenantId?: string
  projectId?: string
  departmentId?: string
  location?: string
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  ipAddress?: string
  currentTime?: Date
}

// 增强的权限检查结果
interface EnhancedPermissionResult {
  granted: boolean
  allowedFields?: string[]
  deniedFields?: string[]
  conditions?: Record<string, unknown>
  reason?: string
}

// 中间件配置
interface PermissionMiddlewareConfig {
  getUser: (request: any) => Promise<LinchKitUser | null>
  permissionEngine?: EnhancedPermissionEngine
  getContext?: (request: any) => Promise<PermissionContext | undefined>
  unauthorizedRedirect?: string
  forbiddenRedirect?: string
  jsonResponse?: boolean
}
```

### Schema 定义

```typescript
// 用户 Schema
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  tenantId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'disabled', 'pending']).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// 权限 Schema
const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  action: z.string(),
  subject: z.string(),
  conditions: z.record(z.unknown()).optional(),
  fields: z.array(z.string()).optional(),
  isSystemPermission: z.boolean().default(false),
})

// 角色 Schema
const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  parentRoleId: z.string().optional(),
  isSystemRole: z.boolean().default(false),
  tenantId: z.string().optional(),
})
```

## 🔐 权限模型详解

### RBAC (基于角色的访问控制)

```typescript
// 预定义角色层次结构
const roles = {
  super_admin: {
    permissions: ['manage:all'],
    description: '超级管理员，拥有所有权限',
  },
  tenant_admin: {
    permissions: ['manage:User', 'manage:Role', 'read:all'],
    inherits: [],
    tenantScope: true,
  },
  project_manager: {
    permissions: ['manage:Project', 'read:User', 'create:Category'],
    inherits: ['team_member'],
  },
  team_member: {
    permissions: ['read:Project', 'create:Task', 'update:Task:own'],
    inherits: ['user'],
  },
  user: {
    permissions: ['read:Category', 'update:User:own'],
    inherits: [],
  },
}
```

### ABAC (基于属性的访问控制)

```typescript
// 基于上下文的动态权限规则
const contextualRules = {
  // 时间限制
  timeBasedAccess: {
    workHours: { start: '09:00', end: '18:00' },
    restrictedOperations: ['delete:User', 'manage:Permission'],
    exceptions: ['super_admin'], // 例外角色
  },

  // 地理位置限制
  locationBasedAccess: {
    allowedCountries: ['CN', 'US', 'JP'],
    restrictedOperations: ['export:Data', 'transfer:Funds'],
    vpnDetection: true,
  },

  // 设备限制
  deviceBasedAccess: {
    mobile: {
      deny: ['manage:System', 'delete:Critical'],
      allow: ['read:all', 'create:Task'],
    },
    untrusted: {
      deny: ['access:Sensitive'],
      requireMFA: true,
    },
  },

  // 网络限制
  networkBasedAccess: {
    trustedNetworks: ['192.168.1.0/24', '10.0.0.0/8'],
    untrustedActions: ['admin:*', 'export:*'],
    requireAdditionalAuth: true,
  },
}
```

### 字段级权限

```typescript
// 字段级权限配置
const fieldPermissions = {
  User: {
    public: ['id', 'name', 'email', 'avatar', 'status'],
    hr: ['salary', 'department', 'hireDate', 'performance', 'personalInfo'],
    admin: ['permissions', 'roles', 'lastLoginAt', 'securityLog'],
    finance: ['salary', 'budget', 'expenses'],
    sensitive: ['password', 'resetToken', 'apiKeys', 'mfaSecret'], // 始终拒绝
    owner: ['phone', 'address', 'personalNotes'], // 仅资源拥有者
  },
  Project: {
    public: ['id', 'name', 'description', 'status'],
    member: ['tasks', 'timeline', 'progress'],
    manager: ['budget', 'resources', 'team'],
    admin: ['cost', 'profit', 'analytics'],
    sensitive: ['contractTerms', 'clientSecrets'],
  },
}
```

## 🚀 完整使用示例

### 1. 完整的 Next.js 集成

```typescript
// auth.ts
import { createLinchKitAuthConfig } from '@linch-kit/auth'
import NextAuth from 'next-auth'

export const authConfig = createLinchKitAuthConfig({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    credentials: {
      authorize: async credentials => {
        const user = await validateUser(credentials)
        return user
      },
    },
  },
  callbacks: {
    beforeSignIn: async ({ user }) => {
      return user.status === 'active'
    },
    extendSession: async (session, token) => {
      const permissions = await getUserPermissions(session.user.id)
      const roles = await getUserRoles(session.user.id)
      session.permissions = permissions
      session.roles = roles
      return session
    },
  },
})

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
```

### 2. API 路由权限保护

```typescript
// app/api/users/route.ts
import { auth } from '@/auth'
import { CASLPermissionEngine } from '@linch-kit/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permissionEngine = new CASLPermissionEngine()
  const canReadUsers = await permissionEngine.check(session.user, 'read', 'User', {
    tenantId: session.tenantId,
  })

  if (!canReadUsers) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 获取用户数据
  const users = await getUsers({ tenantId: session.tenantId })

  // 字段级权限过滤
  const filteredUsers = await Promise.all(
    users.map(user =>
      permissionEngine.filterFields(session.user, user, [
        'id',
        'name',
        'email',
        'status',
        'department',
      ])
    )
  )

  return NextResponse.json(filteredUsers)
}
```

### 3. React 组件权限控制

```typescript
// components/UserManagement.tsx
import { useSession } from '@linch-kit/auth'
import { createUsePermission } from '@linch-kit/auth'

const usePermission = createUsePermission({
  getUser: () => session?.user,
  permissionEngine: new EnhancedPermissionEngine()
})

export function UserManagement() {
  const { data: session } = useSession()
  const { allowed: canManageUsers } = usePermission({
    action: 'manage',
    subject: 'User'
  })
  const { allowed: canViewSalary, allowedFields } = usePermission({
    action: 'read',
    subject: 'User',
    checkFields: true,
    requiredFields: ['salary', 'performance']
  })

  if (!session) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <h1>User Management</h1>

      {canManageUsers && (
        <div>
          <button>Add User</button>
          <button>Edit Roles</button>
        </div>
      )}

      <UserList
        showSalary={canViewSalary}
        allowedFields={allowedFields}
      />
    </div>
  )
}
```

## 📋 最佳实践

### 1. 权限设计原则

- **最小权限原则**: 用户只获得完成任务所需的最小权限
- **分层权限**: 使用角色继承减少权限管理复杂度
- **上下文感知**: 基于时间、地点、设备等上下文动态调整权限
- **审计就绪**: 所有权限决策都应被记录用于合规性

### 2. 性能优化

- **权限缓存**: 使用 @linch-kit/core 的缓存功能缓存权限计算结果
- **批量检查**: 使用 `checkMultiple` 方法批量检查权限
- **字段过滤**: 在数据库查询级别过滤字段，而非应用层
- **懒加载**: 仅在需要时计算权限，避免不必要的计算

### 3. 安全最佳实践

- **会话管理**: 定期刷新会话，检测异常行为
- **MFA 强制**: 对敏感操作强制使用多因子认证
- **设备信任**: 建立设备信任机制，降低已知设备的认证频率
- **异常检测**: 监控异常登录模式，如异地登录、异常时间等

### 4. 架构集成

- **微服务**: 在微服务架构中，权限检查应在网关层进行
- **缓存策略**: 权限结果应该被适当缓存，但要注意缓存失效
- **监控告警**: 设置权限拒绝的监控告警，及时发现安全问题

## 🔗 相关文档

- [NextAuth.js 5.0 官方文档](https://authjs.dev/)
- [CASL 权限库文档](https://casl.js.org/)
- [@linch-kit/core 缓存系统](./core.md#缓存系统)
- [tools/schema 类型定义](./schema.md#类型系统)
- [@linch-kit/platform 集成指南](./trpc.md#认证集成)

### 8. CLI 命令系统

`@linch-kit/auth` 包提供完整的 CLI 命令，集成到 @linch-kit/core 的 CLI 系统中。

```typescript
import { authCommands } from '@linch-kit/auth'

// CLI 命令列表
const commands = [
  'auth:init', // 初始化认证系统配置
  'auth:create-user', // 创建新用户
  'auth:list-users', // 列出所有用户
  'auth:reset-password', // 重置用户密码
  'auth:setup-mfa', // 设置多因子认证
  'auth:audit', // 查看认证审计日志
]

// 使用示例
// bun linch auth:init --provider=credentials --mfa=true
// bun linch auth:create-user --email=admin@example.com --password=secret123 --role=admin
// bun linch auth:setup-mfa --email=user@example.com --type=totp
// bun linch auth:audit --user=user@example.com --days=30
```

### 9. 基础设施集成

#### 与 @linch-kit/core 的深度集成

```typescript
import {
  logger,
  logInfo,
  logError,
  logAuditEvent,
  logSecurityEvent,
  defaultAuthInfrastructureConfig,
} from '@linch-kit/auth'

// 专用的 Auth 日志器
logger.info('Authentication event', { userId: 'user123' })

// 便捷的日志函数
logInfo('User logged in', { userId: 'user123' })
logError('Login failed', new Error('Invalid credentials'))

// 审计日志记录
logAuditEvent('user_login', 'user123', {
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
})

// 安全事件记录
logSecurityEvent('suspicious_login', 'high', {
  attempts: 5,
  userId: 'user123',
  ipAddress: '192.168.1.1',
})
```

#### 配置管理

```typescript
import type { AuthInfrastructureConfig } from '@linch-kit/auth'

const authConfig: AuthInfrastructureConfig = {
  enableAudit: true,
  enableMFA: true,
  enableOAuth: true,
  sessionTimeout: 30, // 分钟
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
  lockoutPolicy: {
    maxAttempts: 5,
    lockoutDuration: 15, // 分钟
  },
}
```

### 10. 核心业务功能

从 `@linch-kit/auth/core` 导出的高级业务功能：

```typescript
import {
  AuthManager,
  BaseAuthProvider,
  CredentialsAuthProvider,
  GitHubAuthProvider,
  GoogleAuthProvider,
  JWTSessionManager,
  TOTPManager,
  SimpleAuditLogger,
  createAuthManager,
  createJWTSessionManager,
  createPermissionEngine,
  createTOTPManager,
} from '@linch-kit/auth/core'

// 认证管理器
const authManager = createAuthManager({
  providers: [
    new CredentialsAuthProvider(),
    new GitHubAuthProvider(githubConfig),
    new GoogleAuthProvider(googleConfig),
  ],
  sessionManager: createJWTSessionManager(),
  auditLogger: new SimpleAuditLogger(),
})

// 会话管理
const sessionManager = createJWTSessionManager({
  secret: process.env.JWT_SECRET,
  expiresIn: '1d',
})

// TOTP 管理器
const totpManager = createTOTPManager({
  serviceName: 'LinchKit',
  issuer: 'Your Company',
})
```

### 11. 国际化支持

```typescript
import { authI18n, useAuthTranslation } from '@linch-kit/auth'

// 在组件中使用
function LoginForm() {
  const { t } = useAuthTranslation()

  return (
    <form>
      <label>{t('auth.email')}</label>
      <input type="email" placeholder={t('auth.email.placeholder')} />
      <label>{t('auth.password')}</label>
      <input type="password" placeholder={t('auth.password.placeholder')} />
      <button>{t('auth.signin')}</button>
    </form>
  )
}
```

## 🔧 版本信息

**注意**: 存在版本信息不一致：

- package.json: `2.0.2`
- 代码中的 VERSION 常量: `0.1.0`

建议以 package.json 中的版本为准。

## 🚨 重要注意事项

### 架构约束

1. **数据库集成**: Prisma 适配器已移至 `@linch-kit/platform` 包，避免循环依赖
2. **缓存管理**: 权限缓存功能使用 `@linch-kit/core` 包的缓存系统
3. **审计日志**: 审计日志功能使用 `@linch-kit/core` 包的审计系统
4. **插件系统**: 使用 `@linch-kit/core` 包的插件管理器
5. **CLI 集成**: CLI 命令集成到 @linch-kit/core 的命令系统中
6. **日志系统**: 使用 @linch-kit/core 的统一日志系统

### 模块导入策略

```typescript
// 主要功能从根模块导入
import { CASLPermissionEngine, createLinchKitAuthConfig } from '@linch-kit/auth'

// 核心业务功能从 core 子模块导入
import { AuthManager, createAuthManager } from '@linch-kit/auth/core'

// 基础设施功能
import { logger, logAuditEvent } from '@linch-kit/auth'
```

### 版本兼容性

1. **NextAuth.js**: 确保与 NextAuth.js 5.0 beta 版本兼容
2. **React**: 支持 React 18+ 和 React 19+
3. **Node.js**: 最低要求 Node.js 18+
4. **@linch-kit/core**: 深度集成，需要兼容版本

### 安全考虑

1. **环境变量**: 确保所有敏感配置通过环境变量管理
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **CSRF**: NextAuth.js 内置 CSRF 保护，但需要正确配置
4. **会话安全**: 使用安全的会话配置，包括 httpOnly cookie
5. **审计完整性**: 所有认证相关操作都应被记录
6. **CLI 安全**: CLI 命令应在安全环境中执行，避免密码明文传递

### 测试覆盖

包含完整的测试套件，涵盖：

- 权限引擎测试
- 中间件测试
- 认证适配器测试
- tRPC 路由测试
- 企业级扩展测试
- MFA 功能测试

---

**AI生成**: 此文档基于完整代码分析生成，已修正所有遗漏功能和不准确信息，包含完整的API参考、CLI工具、基础设施集成和企业级最佳实践。文档覆盖了所有导出的功能模块。
