# @linch-kit/auth 包详细规划

**包版本**: v1.0.0
**创建日期**: 2025-06-23
**开发优先级**: P1 - 高优先级
**预估工期**: P1 阶段
**依赖**: core, schema

---

## 📋 模块概览

### 功能定位
@linch-kit/auth 是 LinchKit 生态系统的认证和权限管理核心，作为安全基础设施层，为整个系统提供用户认证、会话管理、权限控制和多租户支持。基于 core 和 schema 包构建，为上层业务包提供安全可靠的身份验证和授权服务。

### 在 LinchKit 生态系统中的角色定位
- **安全基础设施**: 为整个系统提供身份验证和授权服务
- **认证中心**: 统一管理多种认证方式和提供商
- **权限控制中心**: 提供灵活的权限检查和访问控制机制
- **会话管理器**: 管理用户会话生命周期和状态
- **多租户支持**: 为 SaaS 应用提供租户隔离和管理
- **安全策略执行器**: 实施各种安全策略和防护措施

### 职责边界
- ✅ **认证系统**: 多种认证提供商支持 (Credentials, OAuth, JWT, API Key)
- ✅ **权限管理**: 模块化权限检查器和 RBAC/ABAC 支持
- ✅ **会话管理**: JWT 会话、刷新令牌和会话生命周期管理
- ✅ **用户管理**: 用户 Schema 定义、角色分配和用户生命周期
- ✅ **安全机制**: 密码加密、令牌验证、安全策略和防护措施
- ✅ **多租户支持**: 租户隔离、权限隔离和数据隔离
- ✅ **插件集成**: 认证流程的插件钩子和扩展点支持
- ❌ **数据存储**: 不直接操作数据库，通过 schema 定义数据结构
- ❌ **UI组件**: 不包含前端组件，由 ui 包提供认证界面

### 技术特色
- **模块化设计**: 可插拔的认证提供商和权限检查器，支持灵活扩展
- **多租户架构**: 内置多租户支持，满足 SaaS 应用需求
- **类型安全**: 完整的 TypeScript 类型定义，确保编译时安全
- **插件友好**: 丰富的插件钩子和扩展点，支持自定义认证流程
- **安全优先**: 遵循 OWASP 安全最佳实践，内置多种安全防护机制
- **高性能**: 优化的权限检查算法和会话管理，支持高并发场景
- **AI 友好**: 结构化的权限定义和用户行为数据，便于 AI 分析和处理

---

## 🔌 API 设计

### 错误处理系统

#### 统一错误类型
```typescript
// 导入统一的错误管理系统
import {
  LinchKitError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ErrorContext,
  ErrorCategory
} from '@linch-kit/core'

// Auth 包特定错误类型
export class InvalidCredentialsError extends AuthenticationError {
  readonly code = 'INVALID_CREDENTIALS'

  constructor(message: string = 'Invalid credentials', context?: ErrorContext) {
    super(message, context)
  }
}

export class SessionExpiredError extends AuthenticationError {
  readonly code = 'SESSION_EXPIRED'

  constructor(message: string = 'Session has expired', context?: ErrorContext) {
    super(message, context)
  }
}

export class TokenValidationError extends AuthenticationError {
  readonly code = 'TOKEN_VALIDATION_ERROR'

  constructor(message: string = 'Token validation failed', context?: ErrorContext) {
    super(message, context)
  }
}

export class PermissionDeniedError extends AuthorizationError {
  readonly code = 'PERMISSION_DENIED'

  constructor(message: string, resource?: string, action?: string, context?: ErrorContext) {
    super(message, {
      ...context,
      metadata: { resource, action, ...context?.metadata }
    })
  }
}

export class AccountDisabledError extends AuthenticationError {
  readonly code = 'ACCOUNT_DISABLED'

  constructor(message: string = 'Account is disabled', context?: ErrorContext) {
    super(message, context)
  }
}
```

### 公共接口

#### 认证管理器 API
```typescript
/**
 * 认证管理器
 * @description 统一的认证服务管理器，支持多种认证提供商
 * @since v1.0.0
 */
export class AuthManager {
  /**
   * 用户认证
   * @param provider - 认证提供商名称
   * @param credentials - 认证凭据
   * @param options - 认证选项
   * @returns Promise<AuthResult> 认证结果
   * @throws {AuthenticationError} 当认证失败时
   * @example
   * ```typescript
   * const result = await authManager.authenticate('credentials', {
   *   email: 'user@example.com',
   *   password: 'password123'
   * })
   *
   * if (result.success) {
   *   console.log('User authenticated:', result.user)
   *   console.log('Access token:', result.tokens.accessToken)
   * }
   * ```
   */
  async authenticate(
    provider: string,
    credentials: any,
    options?: AuthOptions
  ): Promise<AuthResult>

  /**
   * 验证会话
   * @param token - 访问令牌
   * @returns Promise<Session | null> 会话信息或 null
   * @throws {TokenValidationError} 当令牌验证失败时
   */
  async validateSession(token: string): Promise<Session | null>

  /**
   * 刷新会话
   * @param refreshToken - 刷新令牌
   * @returns Promise<AuthResult> 新的认证结果
   * @throws {TokenRefreshError} 当刷新失败时
   */
  async refreshSession(refreshToken: string): Promise<AuthResult>

  /**
   * 用户登出
   * @param sessionId - 会话ID
   * @returns Promise<void>
   */
  async logout(sessionId: string): Promise<void>

  /**
   * 注册认证提供商
   * @param provider - 认证提供商实例
   * @throws {ProviderRegistrationError} 当注册失败时
   */
  registerProvider(provider: AuthProvider): void

  /**
   * 获取认证提供商
   * @param name - 提供商名称
   * @returns AuthProvider | undefined 提供商实例或 undefined
   */
  getProvider(name: string): AuthProvider | undefined

  /**
   * 获取当前用户
   * @param token - 访问令牌
   * @returns Promise<User | null> 用户信息或 null
   */
  async getCurrentUser(token: string): Promise<User | null>
}
```

#### 权限检查器 API
```typescript
/**
 * 模块化权限检查器
 * @description 支持多种权限策略的权限检查系统
 * @since v1.0.0
 */
export class ModularPermissionChecker {
  /**
   * 检查单个权限
   * @param user - 用户信息
   * @param resource - 资源名称
   * @param action - 操作名称
   * @param context - 权限上下文
   * @returns Promise<boolean> 是否有权限
   * @example
   * ```typescript
   * const hasPermission = await permissionChecker.checkPermission(
   *   user,
   *   'posts',
   *   'create',
   *   { tenantId: 'tenant-123' }
   * )
   * ```
   */
  async checkPermission(
    user: User,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean>

  /**
   * 批量检查权限
   * @param user - 用户信息
   * @param permissions - 权限检查列表
   * @returns Promise<PermissionResult[]> 权限检查结果列表
   */
  async checkMultiplePermissions(
    user: User,
    permissions: PermissionCheck[]
  ): Promise<PermissionResult[]>

  /**
   * 检查资源访问权限
   * @param user - 用户信息
   * @param resourceId - 资源ID
   * @param action - 操作名称
   * @param context - 权限上下文
   * @returns Promise<boolean> 是否有权限
   */
  async checkResourceAccess(
    user: User,
    resourceId: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean>

  /**
   * 获取用户权限列表
   * @param user - 用户信息
   * @param context - 权限上下文
   * @returns Promise<Permission[]> 权限列表
   */
  async getUserPermissions(user: User, context?: PermissionContext): Promise<Permission[]>

  /**
   * 注册权限策略
   * @param name - 策略名称
   * @param strategy - 权限策略实例
   */
  registerStrategy(name: string, strategy: PermissionStrategy): void

  /**
   * 注册权限定义
   * @param permission - 权限定义
   */
  registerPermission(permission: Permission): void
}
```

#### 会话管理器 API
```typescript
/**
 * 会话管理器
 * @description 管理用户会话的生命周期和状态
 * @since v1.0.0
 */
export class SessionManager {
  /**
   * 创建会话
   * @param user - 用户信息
   * @param options - 会话选项
   * @returns Promise<Session> 会话信息
   */
  async createSession(user: User, options?: SessionOptions): Promise<Session>

  /**
   * 获取会话
   * @param sessionId - 会话ID
   * @returns Promise<Session | null> 会话信息或 null
   */
  async getSession(sessionId: string): Promise<Session | null>

  /**
   * 更新会话
   * @param sessionId - 会话ID
   * @param updates - 更新数据
   * @returns Promise<Session> 更新后的会话信息
   */
  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session>

  /**
   * 销毁会话
   * @param sessionId - 会话ID
   * @returns Promise<void>
   */
  async destroySession(sessionId: string): Promise<void>

  /**
   * 清理过期会话
   * @returns Promise<number> 清理的会话数量
   */
  async cleanupExpiredSessions(): Promise<number>

  /**
   * 获取用户的所有会话
   * @param userId - 用户ID
   * @returns Promise<Session[]> 会话列表
   */
  async getUserSessions(userId: string): Promise<Session[]>

  /**
   * 销毁用户的所有会话
   * @param userId - 用户ID
   * @returns Promise<void>
   */
  async destroyUserSessions(userId: string): Promise<void>
}
```

### TypeScript 类型定义

#### 核心类型
```typescript
/**
 * 认证结果接口
 * @description 认证操作的返回结果
 */
export interface AuthResult {
  /** 认证是否成功 */
  success: boolean
  /** 用户信息 */
  user?: User
  /** 会话信息 */
  session?: Session
  /** 令牌信息 */
  tokens?: {
    accessToken: string
    refreshToken?: string
    expiresIn: number
    tokenType: 'Bearer' | 'JWT'
  }
  /** 错误信息 - 使用统一的 LinchKit 错误类型 */
  error?: LinchKitError
  /** 额外元数据 */
  metadata?: Record<string, any>
}

/**
 * 用户接口
 * @description 系统用户的基本信息
 */
export interface User {
  /** 用户ID */
  id: string
  /** 邮箱地址 */
  email: string
  /** 用户名 */
  username?: string
  /** 姓名 */
  name?: string
  /** 头像URL */
  avatar?: string
  /** 是否激活 */
  isActive: boolean
  /** 邮箱是否验证 */
  emailVerified: boolean
  /** 最后登录时间 */
  lastLoginAt?: Date
  /** 用户角色 */
  roles: Role[]
  /** 租户ID */
  tenantId?: string
  /** 用户元数据 */
  metadata?: Record<string, any>
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 会话接口
 * @description 用户会话信息
 */
export interface Session {
  /** 会话ID */
  id: string
  /** 用户ID */
  userId: string
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌 */
  refreshToken?: string
  /** 过期时间 */
  expiresAt: Date
  /** 创建时间 */
  createdAt: Date
  /** 最后活跃时间 */
  lastActiveAt: Date
  /** 客户端信息 */
  clientInfo: {
    userAgent: string
    ipAddress: string
    deviceId?: string
  }
  /** 会话元数据 */
  metadata?: Record<string, any>
}

/**
 * 权限接口
 * @description 系统权限定义
 */
export interface Permission {
  /** 权限ID */
  id: string
  /** 权限名称 */
  name: string
  /** 资源名称 */
  resource: string
  /** 操作名称 */
  action: string
  /** 权限描述 */
  description?: string
  /** 权限条件 */
  conditions?: PermissionCondition[]
  /** 权限元数据 */
  metadata?: Record<string, any>
}

/**
 * 角色接口
 * @description 用户角色定义
 */
export interface Role {
  /** 角色ID */
  id: string
  /** 角色名称 */
  name: string
  /** 角色描述 */
  description?: string
  /** 是否系统角色 */
  isSystem: boolean
  /** 角色权限 */
  permissions: Permission[]
  /** 租户ID */
  tenantId?: string
  /** 角色元数据 */
  metadata?: Record<string, any>
}

/**
 * 权限上下文接口
 * @description 权限检查时的上下文信息
 */
export interface PermissionContext {
  /** 租户ID */
  tenantId?: string
  /** 资源ID */
  resourceId?: string
  /** 资源所有者ID */
  ownerId?: string
  /** 请求IP地址 */
  ipAddress?: string
  /** 时间戳 */
  timestamp?: Date
  /** 额外属性 */
  attributes?: Record<string, any>
}
```

### 契约规范

#### 认证流程契约
1. **认证请求**: 必须包含有效的认证提供商和凭据
2. **认证响应**: 成功时返回用户信息和令牌，失败时返回错误信息
3. **令牌格式**: 访问令牌使用 JWT 格式，包含用户ID、角色和过期时间
4. **会话管理**: 会话创建后自动设置过期时间，支持刷新和销毁

#### 权限检查契约
1. **权限格式**: 使用 `resource:action` 格式，如 `posts:create`
2. **上下文传递**: 权限检查时必须传递完整的上下文信息
3. **策略执行**: 按优先级顺序执行权限策略，第一个匹配的策略决定结果
4. **缓存机制**: 权限检查结果可以缓存，缓存时间可配置

#### 安全契约
1. **密码安全**: 密码必须使用 bcrypt 加密，rounds >= 12
2. **令牌安全**: JWT 令牌必须使用强密钥签名，支持令牌撤销
3. **会话安全**: 会话令牌必须随机生成，支持会话劫持检测
4. **传输安全**: 所有敏感数据传输必须使用 HTTPS

### 版本兼容性策略

#### API 兼容性
- **认证接口**: 保持向后兼容，新增功能使用可选参数
- **权限系统**: 权限定义格式保持稳定，支持权限迁移
- **会话管理**: 会话结构向后兼容，支持渐进式升级
- **提供商接口**: 认证提供商接口保持稳定，支持多版本共存

#### 数据兼容性
- **用户数据**: 用户 Schema 向后兼容，支持字段扩展
- **权限数据**: 权限定义支持版本标记，自动迁移
- **会话数据**: 会话格式向后兼容，支持平滑升级
- **配置数据**: 配置格式保持稳定，支持配置迁移

---

## 🏗️ 架构设计

### 目录结构
```
packages/auth/
├── src/
│   ├── core/                           # 认证核心逻辑
│   │   ├── auth-manager.ts             # 认证管理器
│   │   ├── session-manager.ts          # 会话管理器
│   │   ├── permission-checker.ts       # 权限检查器
│   │   ├── permission-registry.ts      # 权限注册表
│   │   ├── multi-tenant.ts             # 多租户支持
│   │   └── security-utils.ts           # 安全工具
│   ├── providers/                      # 认证提供商
│   │   ├── credentials.ts              # 用户名密码认证
│   │   ├── oauth/                      # OAuth认证
│   │   │   ├── google.ts               # Google OAuth
│   │   │   ├── github.ts               # GitHub OAuth
│   │   │   ├── microsoft.ts            # Microsoft OAuth
│   │   │   └── index.ts                # OAuth导出
│   │   ├── shared-token/               # 共享令牌认证
│   │   │   ├── jwt.ts                  # JWT令牌
│   │   │   ├── api-key.ts              # API密钥
│   │   │   └── index.ts                # 令牌导出
│   │   └── index.ts                    # 提供商导出
│   ├── schemas/                        # Schema定义
│   │   ├── user.ts                     # 用户Schema
│   │   ├── role.ts                     # 角色Schema
│   │   ├── permission.ts               # 权限Schema
│   │   ├── session.ts                  # 会话Schema
│   │   ├── tenant.ts                   # 租户Schema
│   │   └── index.ts                    # Schema导出
│   ├── types/                          # 类型定义
│   │   ├── auth.ts                     # 认证类型
│   │   ├── user.ts                     # 用户类型
│   │   ├── permissions.ts              # 权限类型
│   │   ├── session.ts                  # 会话类型
│   │   ├── providers.ts                # 提供商类型
│   │   └── index.ts                    # 类型导出
│   ├── middleware/                     # 中间件
│   │   ├── auth-middleware.ts          # 认证中间件
│   │   ├── permission-middleware.ts    # 权限中间件
│   │   ├── session-middleware.ts       # 会话中间件
│   │   └── index.ts                    # 中间件导出
│   ├── utils/                          # 工具函数
│   │   ├── crypto.ts                   # 加密工具
│   │   ├── token.ts                    # 令牌工具
│   │   ├── validation.ts               # 验证工具
│   │   └── index.ts                    # 工具导出
│   ├── plugins/                        # 插件集成
│   │   ├── auth-hooks.ts               # 认证钩子
│   │   ├── permission-hooks.ts         # 权限钩子
│   │   └── index.ts                    # 插件导出
│   ├── i18n/                           # 国际化
│   │   ├── messages.ts                 # 消息定义
│   │   ├── locales/                    # 语言文件
│   │   │   ├── en.ts                   # 英文
│   │   │   └── zh-CN.ts                # 中文
│   │   └── index.ts                    # i18n导出
│   └── index.ts                        # 包主入口
├── tests/                              # 测试文件
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

### 核心类设计

#### 认证管理器
```typescript
export class AuthManager {
  private providers: Map<string, AuthProvider> = new Map()
  private sessionManager: SessionManager
  private permissionChecker: PermissionChecker
  
  constructor(config: AuthConfig) {
    this.sessionManager = new SessionManager(config.session)
    this.permissionChecker = new PermissionChecker(config.permissions)
    this.registerBuiltinProviders()
  }
  
  async authenticate(
    provider: string, 
    credentials: any, 
    options?: AuthOptions
  ): Promise<AuthResult>
  
  async validateSession(token: string): Promise<Session | null>
  async refreshSession(refreshToken: string): Promise<AuthResult>
  async logout(sessionId: string): Promise<void>
  
  registerProvider(provider: AuthProvider): void
  getProvider(name: string): AuthProvider | undefined
}
```

#### 权限检查器
```typescript
export class ModularPermissionChecker {
  private registry: PermissionRegistry
  private strategies: Map<string, PermissionStrategy> = new Map()
  
  constructor() {
    this.registry = new PermissionRegistry()
    this.registerBuiltinStrategies()
  }
  
  async checkPermission(
    user: User, 
    resource: string, 
    action: string, 
    context?: PermissionContext
  ): Promise<boolean>
  
  async checkMultiplePermissions(
    user: User, 
    permissions: PermissionCheck[]
  ): Promise<PermissionResult[]>
  
  registerStrategy(name: string, strategy: PermissionStrategy): void
  registerPermission(permission: Permission): void
}
```

---

## 🔧 实现细节

### 核心算法

#### 权限检查算法
```typescript
/**
 * 高性能权限检查引擎
 * @description 使用多级缓存和优化算法进行权限检查
 * @complexity O(log n) 其中 n 是权限数量
 */
export class PermissionCheckEngine {
  private permissionCache = new Map<string, boolean>()
  private roleCache = new Map<string, Role[]>()
  private permissionTree = new PermissionTree()

  /**
   * 执行权限检查
   * @param user - 用户信息
   * @param resource - 资源名称
   * @param action - 操作名称
   * @param context - 权限上下文
   * @returns Promise<boolean> 是否有权限
   */
  async checkPermission(
    user: User,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean> {
    // 1. 构建缓存键
    const cacheKey = this.buildCacheKey(user.id, resource, action, context)

    // 2. 检查缓存
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!
    }

    // 3. 执行权限检查
    const hasPermission = await this.executePermissionCheck(user, resource, action, context)

    // 4. 缓存结果
    this.permissionCache.set(cacheKey, hasPermission)

    return hasPermission
  }

  /**
   * 执行实际的权限检查逻辑
   * @param user - 用户信息
   * @param resource - 资源名称
   * @param action - 操作名称
   * @param context - 权限上下文
   * @returns Promise<boolean> 是否有权限
   */
  private async executePermissionCheck(
    user: User,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean> {
    // 1. 检查超级管理员权限
    if (this.isSuperAdmin(user)) {
      return true
    }

    // 2. 检查资源所有者权限
    if (context?.ownerId === user.id) {
      const ownerPermission = await this.checkOwnerPermission(resource, action)
      if (ownerPermission) return true
    }

    // 3. 检查角色权限
    const userRoles = await this.getUserRoles(user.id)
    for (const role of userRoles) {
      if (await this.checkRolePermission(role, resource, action, context)) {
        return true
      }
    }

    // 4. 检查直接权限
    return await this.checkDirectPermission(user, resource, action, context)
  }

  /**
   * 检查角色权限
   * @param role - 角色信息
   * @param resource - 资源名称
   * @param action - 操作名称
   * @param context - 权限上下文
   * @returns Promise<boolean> 是否有权限
   */
  private async checkRolePermission(
    role: Role,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean> {
    // 检查租户隔离
    if (context?.tenantId && role.tenantId !== context.tenantId) {
      return false
    }

    // 检查角色权限
    for (const permission of role.permissions) {
      if (this.matchesPermission(permission, resource, action)) {
        // 检查权限条件
        if (await this.evaluatePermissionConditions(permission, context)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 权限匹配检查 - 支持 AntMatcher 风格
   * @param permission - 权限定义
   * @param resource - 资源名称
   * @param action - 操作名称
   * @returns boolean 是否匹配
   */
  private matchesPermission(permission: Permission, resource: string, action: string): boolean {
    // 使用 AntMatcher 风格匹配
    const antMatcher = new AntPathMatcher()
    const resourceMatch = antMatcher.match(permission.resource, resource)
    const actionMatch = antMatcher.match(permission.action, action)

    return resourceMatch && actionMatch
  }

  /**
   * 模式匹配（支持通配符）
   * @param pattern - 模式字符串
   * @param value - 值字符串
   * @returns boolean 是否匹配
   */
  private matchPattern(pattern: string, value: string): boolean {
    if (pattern === '*') return true
    if (pattern === value) return true

    // 支持前缀匹配 (posts.*)
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      return value.startsWith(prefix)
    }

    return false
  }

  /**
   * 评估权限条件
   * @param permission - 权限定义
   * @param context - 权限上下文
   * @returns Promise<boolean> 条件是否满足
   */
  private async evaluatePermissionConditions(
    permission: Permission,
    context?: PermissionContext
  ): Promise<boolean> {
    if (!permission.conditions || permission.conditions.length === 0) {
      return true
    }

    for (const condition of permission.conditions) {
      if (!await this.evaluateCondition(condition, context)) {
        return false
      }
    }

    return true
  }

  private buildCacheKey(userId: string, resource: string, action: string, context?: PermissionContext): string {
    const contextKey = context ? JSON.stringify(context) : ''
    return `${userId}:${resource}:${action}:${contextKey}`
  }
}

export interface PermissionCondition {
  type: 'time' | 'location' | 'attribute' | 'custom'
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains'
  field: string
  value: any
  evaluator?: (context: PermissionContext) => Promise<boolean>
}

/**
 * AntPathMatcher 实现 - 支持 Spring AntMatcher 风格的路径匹配
 */
export class AntPathMatcher {
  private readonly DEFAULT_PATH_SEPARATOR = '/'
  private readonly CACHE_TURNOFF_THRESHOLD = 65536
  private patternCache = new Map<string, string[]>()

  /**
   * 匹配路径模式
   * 支持的通配符：
   * - ? 匹配一个字符
   * - * 匹配零个或多个字符（不包括路径分隔符）
   * - ** 匹配零个或多个路径段
   */
  match(pattern: string, path: string): boolean {
    return this.doMatch(pattern, path, true, null)
  }

  /**
   * 匹配路径开始部分
   */
  matchStart(pattern: string, path: string): boolean {
    return this.doMatch(pattern, path, false, null)
  }

  /**
   * 提取路径变量
   */
  extractUriTemplateVariables(pattern: string, path: string): Record<string, string> {
    const variables: Record<string, string> = {}
    const result = this.doMatch(pattern, path, true, variables)

    if (!result) {
      throw new Error(`Pattern "${pattern}" does not match path "${path}"`)
    }

    return variables
  }

  private doMatch(
    pattern: string,
    path: string,
    fullMatch: boolean,
    uriTemplateVariables: Record<string, string> | null
  ): boolean {
    if (path.startsWith(this.DEFAULT_PATH_SEPARATOR) !== pattern.startsWith(this.DEFAULT_PATH_SEPARATOR)) {
      return false
    }

    const pattDirs = this.tokenizePattern(pattern)
    const pathDirs = this.tokenizePath(path)

    let pattIdxStart = 0
    let pattIdxEnd = pattDirs.length - 1
    let pathIdxStart = 0
    let pathIdxEnd = pathDirs.length - 1

    // 匹配开始部分
    while (pattIdxStart <= pattIdxEnd && pathIdxStart <= pathIdxEnd) {
      const pattDir = pattDirs[pattIdxStart]
      if (pattDir === '**') {
        break
      }
      if (!this.matchStrings(pattDir, pathDirs[pathIdxStart], uriTemplateVariables)) {
        return false
      }
      pattIdxStart++
      pathIdxStart++
    }

    if (pathIdxStart > pathIdxEnd) {
      // 路径已完全匹配
      if (pattIdxStart > pattIdxEnd) {
        return pattern.endsWith(this.DEFAULT_PATH_SEPARATOR) === path.endsWith(this.DEFAULT_PATH_SEPARATOR)
      }
      if (!fullMatch) {
        return true
      }
      if (pattIdxStart === pattIdxEnd && pattDirs[pattIdxStart] === '*' && path.endsWith(this.DEFAULT_PATH_SEPARATOR)) {
        return true
      }
      for (let i = pattIdxStart; i <= pattIdxEnd; i++) {
        if (pattDirs[i] !== '**') {
          return false
        }
      }
      return true
    } else if (pattIdxStart > pattIdxEnd) {
      // 模式已完全匹配，但路径还有剩余
      return false
    } else if (!fullMatch && pattDirs[pattIdxStart] === '**') {
      // 部分匹配且遇到 **
      return true
    }

    // 匹配结束部分
    while (pattIdxStart <= pattIdxEnd && pathIdxStart <= pathIdxEnd) {
      const pattDir = pattDirs[pattIdxEnd]
      if (pattDir === '**') {
        break
      }
      if (!this.matchStrings(pattDir, pathDirs[pathIdxEnd], uriTemplateVariables)) {
        return false
      }
      pattIdxEnd--
      pathIdxEnd--
    }

    if (pathIdxStart > pathIdxEnd) {
      // 路径已完全匹配
      for (let i = pattIdxStart; i <= pattIdxEnd; i++) {
        if (pattDirs[i] !== '**') {
          return false
        }
      }
      return true
    }

    // 处理中间的 ** 通配符
    while (pattIdxStart !== pattIdxEnd && pathIdxStart <= pathIdxEnd) {
      let patIdxTmp = -1
      for (let i = pattIdxStart + 1; i <= pattIdxEnd; i++) {
        if (pattDirs[i] === '**') {
          patIdxTmp = i
          break
        }
      }
      if (patIdxTmp === pattIdxStart + 1) {
        // '**/**' 情况
        pattIdxStart++
        continue
      }

      // 查找匹配的路径段
      const patLength = patIdxTmp - pattIdxStart - 1
      const strLength = pathIdxEnd - pathIdxStart + 1
      let foundIdx = -1

      strLoop: for (let i = 0; i <= strLength - patLength; i++) {
        for (let j = 0; j < patLength; j++) {
          const subPat = pattDirs[pattIdxStart + j + 1]
          const subStr = pathDirs[pathIdxStart + i + j]
          if (!this.matchStrings(subPat, subStr, uriTemplateVariables)) {
            continue strLoop
          }
        }
        foundIdx = pathIdxStart + i
        break
      }

      if (foundIdx === -1) {
        return false
      }

      pattIdxStart = patIdxTmp
      pathIdxStart = foundIdx + patLength
    }

    for (let i = pattIdxStart; i <= pattIdxEnd; i++) {
      if (pattDirs[i] !== '**') {
        return false
      }
    }

    return true
  }

  private tokenizePattern(pattern: string): string[] {
    let tokenized = this.patternCache.get(pattern)
    if (tokenized == null) {
      tokenized = this.tokenize(pattern)
      if (this.patternCache.size >= this.CACHE_TURNOFF_THRESHOLD) {
        this.patternCache.clear()
      }
      this.patternCache.set(pattern, tokenized)
    }
    return tokenized
  }

  private tokenizePath(path: string): string[] {
    return this.tokenize(path)
  }

  private tokenize(str: string): string[] {
    if (!str) {
      return []
    }
    return str.split(this.DEFAULT_PATH_SEPARATOR).filter(segment => segment.length > 0)
  }

  private matchStrings(
    pattern: string,
    str: string,
    uriTemplateVariables: Record<string, string> | null
  ): boolean {
    return this.getStringMatcher(pattern).matchStrings(str, uriTemplateVariables)
  }

  private getStringMatcher(pattern: string): AntPathStringMatcher {
    return new AntPathStringMatcher(pattern)
  }
}

/**
 * 字符串匹配器
 */
class AntPathStringMatcher {
  private pattern: string
  private variableNames: string[] = []
  private regex?: RegExp

  constructor(pattern: string) {
    this.pattern = pattern
    this.parsePattern()
  }

  private parsePattern(): void {
    let regexPattern = ''
    let variableIndex = 0

    for (let i = 0; i < this.pattern.length; i++) {
      const char = this.pattern[i]

      if (char === '*') {
        regexPattern += '[^/]*'
      } else if (char === '?') {
        regexPattern += '[^/]'
      } else if (char === '{') {
        // 处理路径变量 {name}
        const endIndex = this.pattern.indexOf('}', i)
        if (endIndex !== -1) {
          const variableName = this.pattern.substring(i + 1, endIndex)
          this.variableNames[variableIndex++] = variableName
          regexPattern += '([^/]+)'
          i = endIndex
        } else {
          regexPattern += this.escapeRegex(char)
        }
      } else {
        regexPattern += this.escapeRegex(char)
      }
    }

    this.regex = new RegExp(`^${regexPattern}$`)
  }

  private escapeRegex(char: string): string {
    const specialChars = /[.*+?^${}()|[\]\\]/g
    return char.replace(specialChars, '\\$&')
  }

  matchStrings(str: string, uriTemplateVariables: Record<string, string> | null): boolean {
    if (!this.regex) {
      return false
    }

    const match = str.match(this.regex)
    if (!match) {
      return false
    }

    if (uriTemplateVariables && this.variableNames.length > 0) {
      for (let i = 0; i < this.variableNames.length; i++) {
        const variableName = this.variableNames[i]
        const variableValue = match[i + 1]
        uriTemplateVariables[variableName] = variableValue
      }
    }

    return true
  }
}
```

#### 会话管理算法
```typescript
/**
 * 会话管理引擎
 * @description 高效的会话生命周期管理和安全控制
 */
export class SessionManagementEngine {
  private sessionStore = new Map<string, Session>()
  private userSessions = new Map<string, Set<string>>()
  private cleanupTimer: NodeJS.Timeout | null = null

  /**
   * 创建安全会话
   * @param user - 用户信息
   * @param options - 会话选项
   * @returns Promise<Session> 会话信息
   */
  async createSession(user: User, options?: SessionOptions): Promise<Session> {
    // 1. 生成会话ID和令牌
    const sessionId = this.generateSecureId()
    const accessToken = await this.generateAccessToken(user, sessionId)
    const refreshToken = options?.enableRefresh ? this.generateRefreshToken() : undefined

    // 2. 计算过期时间
    const expiresAt = new Date(Date.now() + (options?.expiresIn || 15 * 60 * 1000)) // 默认15分钟

    // 3. 创建会话对象
    const session: Session = {
      id: sessionId,
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      clientInfo: {
        userAgent: options?.userAgent || '',
        ipAddress: options?.ipAddress || '',
        deviceId: options?.deviceId
      },
      metadata: options?.metadata
    }

    // 4. 存储会话
    this.sessionStore.set(sessionId, session)

    // 5. 更新用户会话索引
    if (!this.userSessions.has(user.id)) {
      this.userSessions.set(user.id, new Set())
    }
    this.userSessions.get(user.id)!.add(sessionId)

    // 6. 检查会话限制
    await this.enforceSessionLimits(user.id, options?.maxSessions)

    return session
  }

  /**
   * 验证会话
   * @param token - 访问令牌
   * @returns Promise<Session | null> 会话信息或 null
   */
  async validateSession(token: string): Promise<Session | null> {
    try {
      // 1. 解析JWT令牌
      const payload = await this.verifyJWT(token)

      // 2. 获取会话
      const session = this.sessionStore.get(payload.sessionId)
      if (!session) {
        return null
      }

      // 3. 检查会话是否过期
      if (session.expiresAt < new Date()) {
        await this.destroySession(session.id)
        return null
      }

      // 4. 更新最后活跃时间
      session.lastActiveAt = new Date()
      this.sessionStore.set(session.id, session)

      return session
    } catch (error) {
      return null
    }
  }

  /**
   * 刷新会话
   * @param refreshToken - 刷新令牌
   * @returns Promise<Session | null> 新的会话信息
   */
  async refreshSession(refreshToken: string): Promise<Session | null> {
    // 1. 验证刷新令牌
    const payload = await this.verifyRefreshToken(refreshToken)
    if (!payload) {
      return null
    }

    // 2. 获取原会话
    const oldSession = this.sessionStore.get(payload.sessionId)
    if (!oldSession || oldSession.refreshToken !== refreshToken) {
      return null
    }

    // 3. 创建新会话
    const user = await this.getUserById(oldSession.userId)
    if (!user) {
      return null
    }

    // 4. 销毁旧会话
    await this.destroySession(oldSession.id)

    // 5. 创建新会话
    return await this.createSession(user, {
      enableRefresh: true,
      userAgent: oldSession.clientInfo.userAgent,
      ipAddress: oldSession.clientInfo.ipAddress,
      deviceId: oldSession.clientInfo.deviceId
    })
  }

  /**
   * 强制执行会话限制
   * @param userId - 用户ID
   * @param maxSessions - 最大会话数
   */
  private async enforceSessionLimits(userId: string, maxSessions?: number): Promise<void> {
    if (!maxSessions) return

    const userSessionIds = this.userSessions.get(userId)
    if (!userSessionIds || userSessionIds.size <= maxSessions) return

    // 获取所有会话并按创建时间排序
    const sessions = Array.from(userSessionIds)
      .map(id => this.sessionStore.get(id))
      .filter(Boolean)
      .sort((a, b) => a!.createdAt.getTime() - b!.createdAt.getTime())

    // 销毁最旧的会话
    const sessionsToDestroy = sessions.slice(0, sessions.length - maxSessions)
    for (const session of sessionsToDestroy) {
      await this.destroySession(session!.id)
    }
  }

  /**
   * 生成安全的访问令牌
   * @param user - 用户信息
   * @param sessionId - 会话ID
   * @returns Promise<string> JWT令牌
   */
  private async generateAccessToken(user: User, sessionId: string): Promise<string> {
    const payload = {
      sub: user.id,
      sessionId,
      roles: user.roles.map(r => r.name),
      tenantId: user.tenantId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15分钟
    }

    return await this.signJWT(payload)
  }

  /**
   * 定期清理过期会话
   */
  private startSessionCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      const now = new Date()
      const expiredSessions: string[] = []

      for (const [sessionId, session] of this.sessionStore) {
        if (session.expiresAt < now) {
          expiredSessions.push(sessionId)
        }
      }

      for (const sessionId of expiredSessions) {
        await this.destroySession(sessionId)
      }
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }
}

export interface SessionOptions {
  expiresIn?: number
  enableRefresh?: boolean
  maxSessions?: number
  userAgent?: string
  ipAddress?: string
  deviceId?: string
  metadata?: Record<string, any>
}
```

### 数据结构

#### 权限树结构
```typescript
/**
 * 权限树数据结构
 * @description 用于快速权限查找和匹配的树形结构
 */
export class PermissionTree {
  private root = new PermissionNode('root')

  /**
   * 添加权限到树中
   * @param permission - 权限定义
   */
  addPermission(permission: Permission): void {
    const path = `${permission.resource}.${permission.action}`.split('.')
    let current = this.root

    for (const segment of path) {
      if (!current.children.has(segment)) {
        current.children.set(segment, new PermissionNode(segment))
      }
      current = current.children.get(segment)!
    }

    current.permissions.push(permission)
  }

  /**
   * 查找匹配的权限
   * @param resource - 资源名称
   * @param action - 操作名称
   * @returns Permission[] 匹配的权限列表
   */
  findPermissions(resource: string, action: string): Permission[] {
    const permissions: Permission[] = []
    const path = `${resource}.${action}`.split('.')

    this.searchNode(this.root, path, 0, permissions)

    return permissions
  }

  /**
   * 递归搜索节点
   * @param node - 当前节点
   * @param path - 搜索路径
   * @param index - 当前索引
   * @param permissions - 结果收集器
   */
  private searchNode(
    node: PermissionNode,
    path: string[],
    index: number,
    permissions: Permission[]
  ): void {
    // 到达叶子节点
    if (index >= path.length) {
      permissions.push(...node.permissions)
      return
    }

    const segment = path[index]

    // 精确匹配
    if (node.children.has(segment)) {
      this.searchNode(node.children.get(segment)!, path, index + 1, permissions)
    }

    // 通配符匹配
    if (node.children.has('*')) {
      permissions.push(...node.children.get('*')!.permissions)
    }
  }
}

export class PermissionNode {
  public children = new Map<string, PermissionNode>()
  public permissions: Permission[] = []

  constructor(public value: string) {}
}

/**
 * 权限模式示例和最佳实践
 */
export const PermissionPatterns = {
  // 基础模式
  EXACT: 'users:read',                    // 精确匹配
  WILDCARD: 'users:*',                    // 通配符匹配

  // AntMatcher 风格模式
  PATH_WILDCARD: 'api/users/*',           // 单级路径通配符
  DEEP_WILDCARD: 'api/users/**',          // 多级路径通配符
  MIXED: 'api/*/admin/**',                // 混合通配符

  // 路径变量模式
  PATH_VARIABLE: 'api/users/{userId}',    // 路径变量
  MULTI_VARIABLE: 'api/{type}/{id}',      // 多个路径变量

  // 复杂模式
  CONDITIONAL: 'api/users/{userId}:read', // 带条件的路径变量
  HIERARCHICAL: 'org/{orgId}/users/**',   // 层级权限

  // 实际使用示例
  USER_PROFILE: 'api/users/{userId}/profile:*',
  ADMIN_PANEL: 'admin/**',
  PUBLIC_API: 'api/public/**',
  TENANT_DATA: 'tenant/{tenantId}/**'
} as const

/**
 * 权限匹配器增强版 - 支持 AntMatcher 风格
 */
export class EnhancedPermissionMatcher {
  private antMatcher: AntPathMatcher
  private cache = new Map<string, boolean>()

  constructor() {
    this.antMatcher = new AntPathMatcher()
  }

  /**
   * 检查用户是否有指定权限
   */
  async hasPermission(
    user: User,
    resource: string,
    action: string,
    context?: PermissionContext
  ): Promise<boolean> {
    const cacheKey = this.buildCacheKey(user.id, resource, action, context)

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const userPermissions = await this.getUserPermissions(user.id)

    const hasPermission = userPermissions.some(permission =>
      this.matchesPermission(permission, resource, action, context)
    )

    this.cache.set(cacheKey, hasPermission)
    return hasPermission
  }

  /**
   * 匹配权限规则 - 支持 AntMatcher 风格
   */
  private matchesPermission(
    permission: Permission,
    resource: string,
    action: string,
    context?: PermissionContext
  ): boolean {
    // 使用 AntMatcher 风格匹配资源路径
    const resourceMatches = this.antMatcher.match(permission.resource, resource)
    const actionMatches = this.antMatcher.match(permission.action, action)

    if (resourceMatches && actionMatches) {
      return this.evaluateConditions(permission.conditions, context)
    }

    return false
  }

  /**
   * 批量权限检查
   */
  async hasAnyPermission(
    user: User,
    permissions: Array<{ resource: string; action: string }>,
    context?: PermissionContext
  ): Promise<boolean> {
    for (const perm of permissions) {
      if (await this.hasPermission(user, perm.resource, perm.action, context)) {
        return true
      }
    }
    return false
  }

  /**
   * 获取用户在指定资源上的所有权限
   */
  async getResourcePermissions(
    user: User,
    resourcePattern: string
  ): Promise<Permission[]> {
    const userPermissions = await this.getUserPermissions(user.id)

    return userPermissions.filter(permission =>
      this.antMatcher.match(permission.resource, resourcePattern)
    )
  }

  /**
   * 提取路径变量
   */
  extractPathVariables(pattern: string, path: string): Record<string, string> {
    try {
      return this.antMatcher.extractUriTemplateVariables(pattern, path)
    } catch (error) {
      return {}
    }
  }

  private buildCacheKey(userId: string, resource: string, action: string, context?: PermissionContext): string {
    const contextKey = context ? JSON.stringify(context) : ''
    return `${userId}:${resource}:${action}:${contextKey}`
  }

  private evaluateConditions(conditions?: PermissionCondition[], context?: PermissionContext): boolean {
    if (!conditions || conditions.length === 0) {
      return true
    }

    return conditions.every(condition => {
      // 简化的条件评估逻辑
      if (!context) return false

      const contextValue = (context as any)[condition.field]

      switch (condition.operator) {
        case 'eq': return contextValue === condition.value
        case 'ne': return contextValue !== condition.value
        case 'gt': return contextValue > condition.value
        case 'lt': return contextValue < condition.value
        case 'in': return Array.isArray(condition.value) && condition.value.includes(contextValue)
        case 'contains': return String(contextValue).includes(condition.value)
        default: return false
      }
    })
  }

  private async getUserPermissions(userId: string): Promise<Permission[]> {
    // 实际实现中应该从数据库获取用户权限
    // 这里返回示例权限
    return []
  }
}
```

### 设计模式

#### 策略模式 - 认证提供商
```typescript
/**
 * 认证策略接口
 * @description 定义认证提供商的统一接口
 */
export abstract class AuthProvider {
  abstract name: string
  abstract type: 'credentials' | 'oauth' | 'shared-token'

  /**
   * 初始化提供商
   * @param config - 配置信息
   */
  abstract initialize(config: any): Promise<void>

  /**
   * 执行认证
   * @param credentials - 认证凭据
   * @returns Promise<AuthResult> 认证结果
   */
  abstract authenticate(credentials: any): Promise<AuthResult>

  /**
   * 验证令牌（可选）
   * @param token - 令牌
   * @returns Promise<User | null> 用户信息或 null
   */
  validateToken?(token: string): Promise<User | null>

  /**
   * 刷新令牌（可选）
   * @param refreshToken - 刷新令牌
   * @returns Promise<AuthResult> 新的认证结果
   */
  refreshToken?(refreshToken: string): Promise<AuthResult>
}

/**
 * 用户名密码认证提供商
 */
export class CredentialsProvider extends AuthProvider {
  name = 'credentials'
  type = 'credentials' as const

  async initialize(config: CredentialsConfig): Promise<void> {
    this.config = config
    this.passwordHasher = new PasswordHasher(config.bcryptRounds || 12)
  }

  async authenticate(credentials: CredentialsInput): Promise<AuthResult> {
    try {
      // 1. 验证输入
      const validatedCredentials = await this.validateCredentials(credentials)

      // 2. 查找用户
      const user = await this.findUserByEmail(validatedCredentials.email)
      if (!user) {
        throw new AuthenticationError('Invalid credentials')
      }

      // 3. 验证密码
      const isValidPassword = await this.passwordHasher.verify(
        validatedCredentials.password,
        user.passwordHash
      )

      if (!isValidPassword) {
        await this.recordFailedAttempt(user.id)
        throw new AuthenticationError('Invalid credentials')
      }

      // 4. 检查账户状态
      if (!user.isActive) {
        throw new AuthenticationError('Account is disabled')
      }

      if (!user.emailVerified && this.config.requireEmailVerification) {
        throw new AuthenticationError('Email not verified')
      }

      // 5. 创建会话
      const session = await this.sessionManager.createSession(user)

      // 6. 记录成功登录
      await this.recordSuccessfulLogin(user.id)

      return {
        success: true,
        user,
        session,
        tokens: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
          tokenType: 'Bearer'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AuthenticationError ? error : new AuthenticationError('Authentication failed')
      }
    }
  }

  private async validateCredentials(credentials: any): Promise<CredentialsInput> {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8)
    })

    return schema.parse(credentials)
  }

  private async recordFailedAttempt(userId: string): Promise<void> {
    // 记录失败尝试，实现暴力破解防护
    const attempts = await this.getFailedAttempts(userId)
    if (attempts >= this.config.maxFailedAttempts) {
      await this.lockAccount(userId)
    }
  }
}

/**
 * OAuth 认证提供商
 */
export class OAuthProvider extends AuthProvider {
  name = 'oauth'
  type = 'oauth' as const

  async initialize(config: OAuthConfig): Promise<void> {
    this.config = config
    this.oauthClient = new OAuthClient(config)
  }

  async authenticate(credentials: OAuthCredentials): Promise<AuthResult> {
    try {
      // 1. 验证授权码
      const tokenResponse = await this.oauthClient.exchangeCodeForToken(credentials.code)

      // 2. 获取用户信息
      const userInfo = await this.oauthClient.getUserInfo(tokenResponse.accessToken)

      // 3. 查找或创建用户
      let user = await this.findUserByOAuthId(userInfo.id, this.config.provider)
      if (!user) {
        user = await this.createUserFromOAuth(userInfo)
      }

      // 4. 创建会话
      const session = await this.sessionManager.createSession(user)

      return {
        success: true,
        user,
        session,
        tokens: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
          tokenType: 'Bearer'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof AuthenticationError ? error : new AuthenticationError('OAuth authentication failed')
      }
    }
  }
}
```

### 架构决策

#### 安全架构设计
- **多层防护**: 实施认证、授权、会话管理的多层安全防护
- **最小权限原则**: 默认拒绝访问，明确授权后才允许操作
- **安全传输**: 所有敏感数据传输使用 HTTPS 和加密存储
- **审计日志**: 记录所有认证和权限操作的详细日志

#### 性能优化策略
- **权限缓存**: 使用多级缓存减少权限检查的数据库查询
- **会话池**: 复用会话对象，减少内存分配和GC压力
- **异步处理**: 非关键操作（如日志记录）使用异步处理
- **批量操作**: 支持批量权限检查，减少网络往返

#### 扩展性设计
- **插件化认证**: 支持自定义认证提供商和权限策略
- **多租户架构**: 内置租户隔离，支持 SaaS 应用场景
- **水平扩展**: 支持分布式部署和负载均衡
- **配置驱动**: 通过配置控制认证和权限行为

---

## 🔧 技术实现

### 认证提供商设计

#### 抽象认证提供商
```typescript
export abstract class AuthProvider {
  abstract name: string
  abstract type: 'credentials' | 'oauth' | 'shared-token'
  
  abstract initialize(config: any): Promise<void>
  abstract authenticate(credentials: any): Promise<AuthResult>
  abstract validateToken?(token: string): Promise<User | null>
  abstract refreshToken?(refreshToken: string): Promise<AuthResult>
}

export interface AuthResult {
  success: boolean
  user?: User
  session?: Session
  tokens?: {
    accessToken: string
    refreshToken?: string
    expiresIn: number
  }
  error?: string
}
```

#### 用户名密码认证
```typescript
export class CredentialsProvider extends AuthProvider {
  name = 'credentials'
  type = 'credentials' as const
  
  async authenticate(credentials: {
    email: string
    password: string
  }): Promise<AuthResult> {
    // 1. 验证用户存在
    // 2. 验证密码
    // 3. 生成会话
    // 4. 返回认证结果
  }
  
  async validatePassword(
    plainPassword: string, 
    hashedPassword: string
  ): Promise<boolean> {
    // 密码验证逻辑
  }
}
```

### 权限系统设计

#### RBAC权限策略
```typescript
export class RBACStrategy implements PermissionStrategy {
  name = 'rbac'
  
  async checkPermission(
    user: User, 
    resource: string, 
    action: string
  ): Promise<boolean> {
    // 1. 获取用户角色
    // 2. 检查角色权限
    // 3. 返回检查结果
  }
  
  async getUserRoles(userId: string): Promise<Role[]> {
    // 获取用户角色逻辑
  }
  
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    // 获取角色权限逻辑
  }
}
```

#### ABAC权限策略
```typescript
export class ABACStrategy implements PermissionStrategy {
  name = 'abac'
  
  async checkPermission(
    user: User, 
    resource: string, 
    action: string, 
    context?: PermissionContext
  ): Promise<boolean> {
    // 1. 构建属性集合
    // 2. 评估策略规则
    // 3. 返回决策结果
  }
  
  private buildAttributes(
    user: User, 
    resource: string, 
    context?: PermissionContext
  ): AttributeSet {
    // 属性构建逻辑
  }
}
```

---

## 🔗 集成接口

### 与其他 LinchKit 包的交互方式

#### Core 包集成
```typescript
/**
 * Core 包集成接口
 * @description 与 @linch-kit/core 的插件系统集成
 */
export interface AuthCoreIntegration {
  /**
   * 注册认证插件到 Core 系统
   * @param core - Core 插件系统
   */
  registerWithCore(core: PluginSystem): void

  /**
   * 获取认证配置
   * @returns 认证配置对象
   */
  getAuthConfig(): AuthConfig

  /**
   * 监听 Core 事件
   * @param eventBus - Core 事件总线
   */
  subscribeToEvents(eventBus: EventBus): void
}

// Core 包集成实现
export class AuthCoreIntegration implements AuthCoreIntegration {
  constructor(
    private authManager: AuthManager,
    private permissionChecker: ModularPermissionChecker
  ) {}

  registerWithCore(core: PluginSystem): void {
    // 注册认证相关钩子
    core.hooks.register('auth:before-validate', async (context) => {
      // 在认证验证前的钩子
      const token = this.extractToken(context.data.request)
      if (token) {
        const session = await this.authManager.validateSession(token)
        context.data.user = session?.userId ? await this.getUserById(session.userId) : null
        context.data.session = session
      }
    })

    core.hooks.register('auth:before-permission-check', async (context) => {
      // 在权限检查前的钩子
      const { user, resource, action } = context.data
      if (user && resource && action) {
        const hasPermission = await this.permissionChecker.checkPermission(user, resource, action)
        if (!hasPermission) {
          throw new PermissionDeniedError(`Access denied for ${resource}:${action}`)
        }
      }
    })

    // 注册认证服务
    core.services.register('auth', {
      manager: this.authManager,
      permissionChecker: this.permissionChecker,
      middleware: {
        authenticate: this.createAuthMiddleware(),
        authorize: this.createAuthorizationMiddleware()
      }
    })
  }

  getAuthConfig(): AuthConfig {
    return {
      providers: this.authManager.getRegisteredProviders(),
      session: {
        expiresIn: 15 * 60 * 1000, // 15分钟
        refreshEnabled: true,
        maxSessions: 5
      },
      security: {
        bcryptRounds: 12,
        jwtSecret: process.env.JWT_SECRET,
        requireEmailVerification: true
      }
    }
  }

  subscribeToEvents(eventBus: EventBus): void {
    // 监听用户相关事件
    eventBus.on('user:created', async (event) => {
      await this.handleUserCreated(event.payload)
    })

    eventBus.on('user:updated', async (event) => {
      await this.handleUserUpdated(event.payload)
    })

    eventBus.on('user:deleted', async (event) => {
      await this.handleUserDeleted(event.payload)
    })

    // 监听权限相关事件
    eventBus.on('permission:granted', async (event) => {
      await this.invalidatePermissionCache(event.payload.userId)
    })

    eventBus.on('permission:revoked', async (event) => {
      await this.invalidatePermissionCache(event.payload.userId)
    })
  }

  private createAuthMiddleware(): AuthMiddleware {
    return async (req, res, next) => {
      try {
        const token = this.extractToken(req)
        if (token) {
          const session = await this.authManager.validateSession(token)
          if (session) {
            req.user = await this.getUserById(session.userId)
            req.session = session
          }
        }
        next()
      } catch (error) {
        next(error)
      }
    }
  }
}
```

#### Schema 包集成
```typescript
/**
 * Schema 包集成接口
 * @description 与 @linch-kit/schema 的实体定义集成
 */
export interface AuthSchemaIntegration {
  /**
   * 定义认证相关实体
   * @returns 认证实体定义集合
   */
  defineAuthEntities(): AuthEntitySet

  /**
   * 生成认证验证器
   * @returns 认证验证器集合
   */
  generateAuthValidators(): AuthValidatorSet

  /**
   * 获取用户权限Schema
   * @returns 权限Schema定义
   */
  getPermissionSchema(): PermissionSchemaSet
}

// Schema 包集成实现
export class AuthSchemaIntegration implements AuthSchemaIntegration {
  defineAuthEntities(): AuthEntitySet {
    const User = defineEntity('User', {
      id: defineField.primary(),
      email: defineField.string().email(),
      username: defineField.string({ min: 3, max: 30 }).optional(),
      passwordHash: defineField.string(),
      firstName: defineField.string({ max: 50 }).optional(),
      lastName: defineField.string({ max: 50 }).optional(),
      avatar: defineField.string().url().optional(),
      isActive: defineField.boolean().default(true),
      emailVerified: defineField.boolean().default(false),
      emailVerificationToken: defineField.string().optional(),
      passwordResetToken: defineField.string().optional(),
      passwordResetExpiresAt: defineField.date().optional(),
      lastLoginAt: defineField.date().optional(),
      failedLoginAttempts: defineField.number().default(0),
      lockedUntil: defineField.date().optional(),
      twoFactorEnabled: defineField.boolean().default(false),
      twoFactorSecret: defineField.string().optional(),
      ...defineField.timestamps(),
      ...defineField.softDelete(),
      // 关系字段
      roles: defineField.relation('Role', { type: 'many-to-many' }),
      sessions: defineField.relation('Session', { type: 'one-to-many' }),
      tenantId: defineField.relation('Tenant', { type: 'many-to-one' }).optional()
    }, {
      tableName: 'users',
      displayName: '用户',
      description: '系统用户实体',
      indexes: [
        { fields: ['email'], unique: true },
        { fields: ['username'], unique: true },
        { fields: ['isActive'] },
        { fields: ['tenantId'] }
      ]
    })

    const Role = defineEntity('Role', {
      id: defineField.primary(),
      name: defineField.string({ min: 2, max: 50 }),
      description: defineField.string({ max: 200 }).optional(),
      isSystem: defineField.boolean().default(false),
      priority: defineField.number().default(0),
      ...defineField.timestamps(),
      // 关系字段
      users: defineField.relation('User', { type: 'many-to-many' }),
      permissions: defineField.relation('Permission', { type: 'many-to-many' }),
      tenantId: defineField.relation('Tenant', { type: 'many-to-one' }).optional()
    }, {
      tableName: 'roles',
      displayName: '角色',
      description: '用户角色实体',
      indexes: [
        { fields: ['name', 'tenantId'], unique: true },
        { fields: ['isSystem'] }
      ]
    })

    const Permission = defineEntity('Permission', {
      id: defineField.primary(),
      name: defineField.string({ min: 2, max: 100 }),
      resource: defineField.string({ max: 50 }),
      action: defineField.string({ max: 50 }),
      description: defineField.string({ max: 200 }).optional(),
      conditions: defineField.json().optional(),
      ...defineField.timestamps(),
      // 关系字段
      roles: defineField.relation('Role', { type: 'many-to-many' })
    }, {
      tableName: 'permissions',
      displayName: '权限',
      description: '系统权限实体',
      indexes: [
        { fields: ['resource', 'action'], unique: true },
        { fields: ['name'] }
      ]
    })

    const Session = defineEntity('Session', {
      id: defineField.primary(),
      accessToken: defineField.string(),
      refreshToken: defineField.string().optional(),
      expiresAt: defineField.date(),
      lastActiveAt: defineField.date(),
      clientInfo: defineField.json(),
      metadata: defineField.json().optional(),
      ...defineField.timestamps(),
      // 关系字段
      userId: defineField.relation('User', { type: 'many-to-one' })
    }, {
      tableName: 'sessions',
      displayName: '会话',
      description: '用户会话实体',
      indexes: [
        { fields: ['accessToken'], unique: true },
        { fields: ['userId'] },
        { fields: ['expiresAt'] }
      ]
    })

    const Tenant = defineEntity('Tenant', {
      id: defineField.primary(),
      name: defineField.string({ min: 2, max: 100 }),
      slug: defineField.string({ min: 2, max: 50 }),
      description: defineField.string({ max: 500 }).optional(),
      isActive: defineField.boolean().default(true),
      settings: defineField.json().optional(),
      ...defineField.timestamps(),
      ...defineField.softDelete(),
      // 关系字段
      users: defineField.relation('User', { type: 'one-to-many' }),
      roles: defineField.relation('Role', { type: 'one-to-many' })
    }, {
      tableName: 'tenants',
      displayName: '租户',
      description: '多租户实体',
      indexes: [
        { fields: ['slug'], unique: true },
        { fields: ['isActive'] }
      ]
    })

    return { User, Role, Permission, Session, Tenant }
  }

  generateAuthValidators(): AuthValidatorSet {
    const entities = this.defineAuthEntities()
    const generator = new ValidatorGenerator()

    return {
      user: generator.generateValidators(entities.User),
      role: generator.generateValidators(entities.Role),
      permission: generator.generateValidators(entities.Permission),
      session: generator.generateValidators(entities.Session),
      tenant: generator.generateValidators(entities.Tenant),
      // 特殊验证器
      login: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        rememberMe: z.boolean().optional()
      }),
      register: z.object({
        email: z.string().email(),
        password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
        firstName: z.string().max(50).optional(),
        lastName: z.string().max(50).optional(),
        username: z.string().min(3).max(30).optional()
      }),
      changePassword: z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
        confirmPassword: z.string()
      }).refine(data => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      }),
      resetPassword: z.object({
        token: z.string(),
        newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
        confirmPassword: z.string()
      }).refine(data => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      })
    }
  }

  getPermissionSchema(): PermissionSchemaSet {
    return {
      permission: z.object({
        resource: z.string().min(1).max(50),
        action: z.string().min(1).max(50),
        conditions: z.array(z.object({
          type: z.enum(['time', 'location', 'attribute', 'custom']),
          operator: z.enum(['eq', 'ne', 'gt', 'lt', 'in', 'contains']),
          field: z.string(),
          value: z.any()
        })).optional()
      }),
      role: z.object({
        name: z.string().min(2).max(50),
        description: z.string().max(200).optional(),
        permissions: z.array(z.string())
      }),
      userRole: z.object({
        userId: z.string(),
        roleId: z.string(),
        tenantId: z.string().optional()
      })
    }
  }
}

export interface AuthEntitySet {
  User: EntityDefinition
  Role: EntityDefinition
  Permission: EntityDefinition
  Session: EntityDefinition
  Tenant: EntityDefinition
}

export interface AuthValidatorSet {
  user: ValidatorSet
  role: ValidatorSet
  permission: ValidatorSet
  session: ValidatorSet
  tenant: ValidatorSet
  login: ZodSchema
  register: ZodSchema
  changePassword: ZodSchema
  resetPassword: ZodSchema
}

export interface PermissionSchemaSet {
  permission: ZodSchema
  role: ZodSchema
  userRole: ZodSchema
}
```

### 依赖关系

#### 依赖链管理
```typescript
/**
 * Auth 依赖链管理器
 * @description 管理 Auth 包在依赖链中的位置和职责
 */
export class AuthDependencyManager {
  /**
   * 向上游包提供的服务
   */
  getUpstreamServices(): AuthUpstreamServices {
    return {
      // 为 Core 提供认证中间件
      authMiddleware: this.createAuthMiddleware(),

      // 为 Core 提供权限检查服务
      permissionChecker: this.permissionChecker,

      // 为 Core 提供用户会话管理
      sessionManager: this.sessionManager,

      // 为 Core 提供安全工具
      securityUtils: {
        hashPassword: this.hashPassword.bind(this),
        verifyPassword: this.verifyPassword.bind(this),
        generateToken: this.generateToken.bind(this),
        verifyToken: this.verifyToken.bind(this)
      }
    }
  }

  /**
   * 注册下游服务集成
   * @description 使用服务注册机制，避免硬编码下游包依赖
   */
  registerDownstreamIntegrations(serviceRegistry: ServiceRegistry): void {
    // 注册权限检查服务，供 CRUD 包使用
    serviceRegistry.register('auth:permissions', {
      service: new AuthCrudIntegration(this.permissionChecker),
      interface: 'PermissionChecker',
      version: '1.0.0',
      metadata: {
        description: 'Authentication and authorization services for CRUD operations',
        supportedOperations: ['checkPermission', 'hasRole', 'getUserPermissions']
      }
    })

    // 注册认证中间件，供 tRPC 包使用
    serviceRegistry.register('auth:middleware', {
      service: new AuthTrpcIntegration(this.authManager),
      interface: 'AuthMiddleware',
      version: '1.0.0',
      metadata: {
        description: 'Authentication middleware for tRPC routes',
        supportedOperations: ['authenticate', 'authorize', 'validateSession']
      }
    })

    // 注册认证状态服务，供 UI 包使用
    serviceRegistry.register('auth:ui-state', {
      service: new AuthUIIntegration(this.authManager, this.permissionChecker),
      interface: 'AuthUIProvider',
      version: '1.0.0',
      metadata: {
        description: 'Authentication state management for UI components',
        supportedOperations: ['getAuthState', 'checkUIPermission', 'subscribeToAuthChanges']
      }
    })
  }

  /**
   * 依赖注入配置
   */
  configureDependencyInjection(container: DependencyContainer): void {
    // 注册认证服务
    container.register('auth:manager', this.authManager, { singleton: true })
    container.register('auth:permission-checker', this.permissionChecker, { singleton: true })
    container.register('auth:session-manager', this.sessionManager, { singleton: true })

    // 注册认证提供商
    container.register('auth:credentials-provider', new CredentialsProvider())
    container.register('auth:oauth-provider', new OAuthProvider())
    container.register('auth:jwt-provider', new JWTProvider())

    // 注册权限策略
    container.register('auth:rbac-strategy', new RBACStrategy())
    container.register('auth:abac-strategy', new ABACStrategy())

    // 注册集成服务
    container.register('auth:core-integration', new AuthCoreIntegration(this.authManager, this.permissionChecker))
    container.register('auth:schema-integration', new AuthSchemaIntegration())
  }
}

export interface AuthUpstreamServices {
  authMiddleware: AuthMiddleware
  permissionChecker: ModularPermissionChecker
  sessionManager: SessionManager
  securityUtils: SecurityUtils
}

/**
 * 服务注册接口
 * @description 用于注册和发现服务的统一接口
 */
export interface ServiceRegistry {
  /** 注册服务 */
  register(name: string, registration: ServiceRegistration): void
  /** 获取服务 */
  get<T>(name: string): T | null
  /** 检查服务是否存在 */
  has(name: string): boolean
  /** 获取服务元数据 */
  getMetadata(name: string): ServiceMetadata | null
  /** 列出所有服务 */
  list(): string[]
  /** 注销服务 */
  unregister(name: string): void
}

/**
 * 服务注册信息
 */
export interface ServiceRegistration {
  /** 服务实例 */
  service: any
  /** 服务接口名称 */
  interface: string
  /** 服务版本 */
  version: string
  /** 服务元数据 */
  metadata: ServiceMetadata
}

/**
 * 服务元数据
 */
export interface ServiceMetadata {
  /** 服务描述 */
  description: string
  /** 支持的操作 */
  supportedOperations: string[]
  /** 依赖的服务 */
  dependencies?: string[]
  /** 配置要求 */
  configRequirements?: string[]
  /** 标签 */
  tags?: string[]
}
```

### 数据流

#### 认证数据流管理
```typescript
/**
 * 认证数据流管理器
 * @description 管理认证相关的数据流和状态同步
 */
export class AuthDataFlowManager {
  private authStreams = new Map<string, AuthDataStream>()

  /**
   * 创建认证数据流
   * @param streamType - 数据流类型
   * @returns 数据流实例
   */
  createAuthStream(streamType: AuthStreamType): AuthDataStream {
    const stream = new AuthDataStream(streamType, {
      bufferSize: 1000,
      transform: this.transformAuthData.bind(this),
      validate: this.validateAuthData.bind(this)
    })

    this.authStreams.set(streamType, stream)
    return stream
  }

  /**
   * 发布认证事件
   * @param streamType - 数据流类型
   * @param eventType - 事件类型
   * @param data - 事件数据
   */
  publishAuthEvent(streamType: AuthStreamType, eventType: AuthEventType, data: any): void {
    const stream = this.authStreams.get(streamType)
    if (stream) {
      stream.publish({
        type: eventType,
        streamType,
        data,
        timestamp: Date.now(),
        traceId: this.generateTraceId()
      })
    }

    // 触发相关的副作用
    this.triggerSideEffects(streamType, eventType, data)
  }

  /**
   * 订阅认证事件
   * @param streamType - 数据流类型
   * @param subscriber - 订阅者
   */
  subscribeToAuthEvents(streamType: AuthStreamType, subscriber: AuthEventSubscriber): void {
    const stream = this.authStreams.get(streamType)
    if (stream) {
      stream.subscribe(subscriber)
    }
  }

  private transformAuthData(data: any): any {
    // 数据转换逻辑
    return {
      ...data,
      processedAt: Date.now(),
      version: '1.0.0'
    }
  }

  private validateAuthData(data: any): boolean {
    // 数据验证逻辑
    return data.type && data.streamType && data.data
  }

  private triggerSideEffects(streamType: AuthStreamType, eventType: AuthEventType, data: any): void {
    switch (eventType) {
      case 'user-login':
        this.handleUserLogin(data)
        break
      case 'user-logout':
        this.handleUserLogout(data)
        break
      case 'permission-changed':
        this.handlePermissionChanged(data)
        break
      case 'session-expired':
        this.handleSessionExpired(data)
        break
    }
  }

  private async handleUserLogin(data: any): Promise<void> {
    // 更新用户最后登录时间
    await this.updateUserLastLogin(data.userId)

    // 清理失败登录记录
    await this.clearFailedLoginAttempts(data.userId)

    // 发送登录通知
    await this.sendLoginNotification(data.userId, data.clientInfo)
  }

  private async handlePermissionChanged(data: any): Promise<void> {
    // 清理权限缓存
    await this.clearPermissionCache(data.userId)

    // 通知相关服务
    await this.notifyPermissionChange(data.userId, data.permissions)
  }
}

export type AuthStreamType = 'authentication' | 'authorization' | 'session' | 'audit'
export type AuthEventType = 'user-login' | 'user-logout' | 'permission-changed' | 'session-expired' | 'security-violation'

export interface AuthEventSubscriber {
  onAuthEvent(event: AuthEvent): void
}

export interface AuthEvent {
  type: AuthEventType
  streamType: AuthStreamType
  data: any
  timestamp: number
  traceId: string
}

export class AuthDataStream {
  private subscribers = new Set<AuthEventSubscriber>()
  private buffer: AuthEvent[] = []

  constructor(
    private streamType: AuthStreamType,
    private config: AuthDataStreamConfig
  ) {}

  publish(event: AuthEvent): void {
    // 验证数据
    if (this.config.validate && !this.config.validate(event)) {
      throw new Error(`Invalid auth event for stream ${this.streamType}`)
    }

    // 转换数据
    const transformedEvent = this.config.transform ? this.config.transform(event) : event

    // 添加到缓冲区
    this.buffer.push(transformedEvent)
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer.shift() // 移除最旧的事件
    }

    // 通知订阅者
    for (const subscriber of this.subscribers) {
      try {
        subscriber.onAuthEvent(transformedEvent)
      } catch (error) {
        console.error('Auth event subscriber error:', error)
      }
    }
  }

  subscribe(subscriber: AuthEventSubscriber): void {
    this.subscribers.add(subscriber)
  }

  unsubscribe(subscriber: AuthEventSubscriber): void {
    this.subscribers.delete(subscriber)
  }
}

export interface AuthDataStreamConfig {
  bufferSize: number
  transform?: (data: any) => any
  validate?: (data: any) => boolean
}
```

---

## 📊 性能考量

### 构建性能
- **DTS 构建时间**: < 15秒
- **包大小**: < 1MB (压缩后)
- **依赖解析**: < 5秒

### 运行时性能
- **认证响应**: < 200ms (标准认证)
- **权限检查**: < 50ms (单次检查)
- **会话验证**: < 10ms (JWT验证)

### 安全性能
- **密码哈希**: bcrypt rounds >= 12
- **JWT过期**: 默认15分钟
- **刷新令牌**: 默认7天

---

## 🎯 最佳实践

### 推荐使用模式

#### 认证提供商最佳实践
```typescript
/**
 * 标准认证提供商实现模板
 * @description 推荐的认证提供商实现模式
 */

// ✅ 推荐：使用工厂模式创建认证提供商
export class AuthProviderFactory {
  static createProvider(type: string, config: any): AuthProvider {
    switch (type) {
      case 'credentials':
        return new CredentialsProvider(config)
      case 'oauth':
        return new OAuthProvider(config)
      case 'jwt':
        return new JWTProvider(config)
      default:
        throw new Error(`Unknown auth provider type: ${type}`)
    }
  }
}

// ✅ 推荐：实现完整的认证流程
export class SecureCredentialsProvider extends AuthProvider {
  name = 'secure-credentials'
  type = 'credentials' as const

  async authenticate(credentials: CredentialsInput): Promise<AuthResult> {
    try {
      // 1. 输入验证
      const validatedCredentials = await this.validateInput(credentials)

      // 2. 速率限制检查
      await this.checkRateLimit(validatedCredentials.email)

      // 3. 用户查找
      const user = await this.findUser(validatedCredentials.email)
      if (!user) {
        // 防止用户枚举攻击
        await this.simulatePasswordCheck()
        throw new AuthenticationError('Invalid credentials')
      }

      // 4. 账户状态检查
      await this.checkAccountStatus(user)

      // 5. 密码验证
      const isValidPassword = await this.verifyPassword(
        validatedCredentials.password,
        user.passwordHash
      )

      if (!isValidPassword) {
        await this.recordFailedAttempt(user.id)
        throw new AuthenticationError('Invalid credentials')
      }

      // 6. 双因素认证检查
      if (user.twoFactorEnabled) {
        await this.verifyTwoFactor(user, validatedCredentials.twoFactorCode)
      }

      // 7. 创建会话
      const session = await this.createSecureSession(user)

      // 8. 记录成功登录
      await this.recordSuccessfulLogin(user.id)

      return {
        success: true,
        user: this.sanitizeUser(user),
        session,
        tokens: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
          tokenType: 'Bearer'
        }
      }
    } catch (error) {
      // 统一错误处理
      await this.handleAuthError(error, credentials.email)
      throw error
    }
  }

  private async checkRateLimit(email: string): Promise<void> {
    const attempts = await this.getRecentAttempts(email)
    if (attempts > this.config.maxAttemptsPerMinute) {
      throw new RateLimitError('Too many login attempts')
    }
  }

  private async checkAccountStatus(user: User): Promise<void> {
    if (!user.isActive) {
      throw new AccountDisabledError('Account is disabled')
    }

    if (!user.emailVerified && this.config.requireEmailVerification) {
      throw new EmailNotVerifiedError('Email not verified')
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError('Account is temporarily locked')
    }
  }

  private sanitizeUser(user: User): Partial<User> {
    // 移除敏感信息
    const { passwordHash, twoFactorSecret, ...sanitized } = user
    return sanitized
  }
}
```

#### 权限检查最佳实践
```typescript
/**
 * 权限检查最佳实践
 * @description 展示如何正确实现权限检查
 */

// ✅ 推荐：使用装饰器进行权限检查
export function RequirePermission(resource: string, action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const user = this.getCurrentUser() // 获取当前用户
      const permissionChecker = this.getPermissionChecker()

      const hasPermission = await permissionChecker.checkPermission(user, resource, action)
      if (!hasPermission) {
        throw new PermissionDeniedError(`Access denied for ${resource}:${action}`)
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

// ✅ 推荐：使用中间件进行权限检查
export class PermissionMiddleware {
  constructor(private permissionChecker: ModularPermissionChecker) {}

  requirePermission(resource: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthenticationError('Authentication required')
        }

        const hasPermission = await this.permissionChecker.checkPermission(
          req.user,
          resource,
          action,
          {
            tenantId: req.user.tenantId,
            ipAddress: req.ip,
            timestamp: new Date()
          }
        )

        if (!hasPermission) {
          throw new PermissionDeniedError(`Access denied for ${resource}:${action}`)
        }

        next()
      } catch (error) {
        next(error)
      }
    }
  }

  requireOwnership(resourceIdParam: string = 'id') {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const resourceId = req.params[resourceIdParam]
        const resource = await this.getResource(resourceId)

        if (!resource) {
          throw new NotFoundError('Resource not found')
        }

        if (resource.ownerId !== req.user.id && !this.isSuperAdmin(req.user)) {
          throw new PermissionDeniedError('Access denied: not resource owner')
        }

        req.resource = resource
        next()
      } catch (error) {
        next(error)
      }
    }
  }
}

// ✅ 推荐：批量权限检查
export class BatchPermissionChecker {
  constructor(private permissionChecker: ModularPermissionChecker) {}

  async checkMultipleResources(
    user: User,
    resources: Array<{ id: string; type: string }>,
    action: string
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()

    // 并行检查权限
    const checks = resources.map(async (resource) => {
      const hasPermission = await this.permissionChecker.checkPermission(
        user,
        resource.type,
        action,
        { resourceId: resource.id }
      )
      return { resourceId: resource.id, hasPermission }
    })

    const checkResults = await Promise.all(checks)

    for (const result of checkResults) {
      results.set(result.resourceId, result.hasPermission)
    }

    return results
  }

  async filterAccessibleResources<T extends { id: string; type: string }>(
    user: User,
    resources: T[],
    action: string
  ): Promise<T[]> {
    const permissionMap = await this.checkMultipleResources(user, resources, action)

    return resources.filter(resource => permissionMap.get(resource.id) === true)
  }
}
```

#### 会话管理最佳实践
```typescript
/**
 * 会话管理最佳实践
 * @description 展示安全的会话管理实现
 */

// ✅ 推荐：安全的会话配置
export class SecureSessionManager extends SessionManager {
  private readonly defaultConfig: SessionConfig = {
    accessTokenExpiry: 15 * 60 * 1000, // 15分钟
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7天
    maxSessionsPerUser: 5,
    enableSessionRotation: true,
    enableDeviceTracking: true,
    enableLocationTracking: false,
    requireSecureTransport: true
  }

  async createSession(user: User, options?: SessionOptions): Promise<Session> {
    // 1. 验证用户状态
    await this.validateUserForSession(user)

    // 2. 检查设备限制
    await this.enforceDeviceLimits(user.id, options?.deviceId)

    // 3. 生成安全令牌
    const tokens = await this.generateSecureTokens(user)

    // 4. 创建会话记录
    const session = await this.createSessionRecord(user, tokens, options)

    // 5. 清理旧会话
    await this.cleanupOldSessions(user.id)

    return session
  }

  private async generateSecureTokens(user: User): Promise<SessionTokens> {
    const jwtPayload = {
      sub: user.id,
      roles: user.roles.map(r => r.name),
      tenantId: user.tenantId,
      sessionId: this.generateSecureId(),
      iat: Math.floor(Date.now() / 1000)
    }

    const accessToken = await this.signJWT(jwtPayload, {
      expiresIn: this.defaultConfig.accessTokenExpiry
    })

    const refreshToken = this.generateRefreshToken()

    return { accessToken, refreshToken }
  }

  private async validateUserForSession(user: User): Promise<void> {
    if (!user.isActive) {
      throw new SessionCreationError('User account is disabled')
    }

    if (!user.emailVerified) {
      throw new SessionCreationError('Email verification required')
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new SessionCreationError('Account is temporarily locked')
    }
  }
}

// ✅ 推荐：会话安全检查
export class SessionSecurityChecker {
  async validateSessionSecurity(session: Session, request: any): Promise<boolean> {
    // 1. 检查会话是否过期
    if (session.expiresAt < new Date()) {
      return false
    }

    // 2. 检查IP地址变化（可选）
    if (this.config.checkIpAddress && session.clientInfo.ipAddress !== request.ip) {
      await this.handleSuspiciousActivity(session, 'ip_change')
      return false
    }

    // 3. 检查User-Agent变化
    if (session.clientInfo.userAgent !== request.headers['user-agent']) {
      await this.handleSuspiciousActivity(session, 'user_agent_change')
      return false
    }

    // 4. 检查会话活跃度
    const inactiveTime = Date.now() - session.lastActiveAt.getTime()
    if (inactiveTime > this.config.maxInactiveTime) {
      return false
    }

    return true
  }

  private async handleSuspiciousActivity(session: Session, reason: string): Promise<void> {
    // 记录安全事件
    await this.logSecurityEvent({
      type: 'suspicious_session_activity',
      sessionId: session.id,
      userId: session.userId,
      reason,
      timestamp: new Date()
    })

    // 可选：通知用户
    await this.notifyUserOfSuspiciousActivity(session.userId, reason)
  }
}
```

### 反模式警告

#### 常见安全错误
```typescript
/**
 * 安全反模式警告
 * @description 列出常见的安全错误和解决方案
 */

// ❌ 反模式 1: 明文存储密码
class BadPasswordStorage {
  async createUser(userData: any) {
    // 错误：明文存储密码
    const user = {
      ...userData,
      password: userData.password // 明文密码
    }
    return await this.saveUser(user)
  }
}

// ✅ 正确模式：加密存储密码
class GoodPasswordStorage {
  async createUser(userData: any) {
    // 正确：加密存储密码
    const passwordHash = await bcrypt.hash(userData.password, 12)
    const user = {
      ...userData,
      passwordHash,
      // 不存储明文密码
    }
    return await this.saveUser(user)
  }
}

// ❌ 反模式 2: 不安全的JWT密钥
class BadJWTConfig {
  private jwtSecret = 'secret123' // 弱密钥

  generateToken(payload: any) {
    return jwt.sign(payload, this.jwtSecret) // 没有过期时间
  }
}

// ✅ 正确模式：安全的JWT配置
class GoodJWTConfig {
  private jwtSecret = process.env.JWT_SECRET! // 强密钥，从环境变量读取

  generateToken(payload: any) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '15m',
      algorithm: 'HS256',
      issuer: 'linch-kit',
      audience: 'linch-kit-users'
    })
  }
}

// ❌ 反模式 3: 权限检查遗漏
class BadPermissionCheck {
  async deletePost(postId: string, userId: string) {
    // 错误：没有权限检查
    return await this.postRepository.delete(postId)
  }
}

// ✅ 正确模式：完整的权限检查
class GoodPermissionCheck {
  async deletePost(postId: string, user: User) {
    // 正确：先检查权限
    const post = await this.postRepository.findById(postId)
    if (!post) {
      throw new NotFoundError('Post not found')
    }

    const hasPermission = await this.permissionChecker.checkPermission(
      user,
      'posts',
      'delete',
      { resourceId: postId, ownerId: post.authorId }
    )

    if (!hasPermission) {
      throw new PermissionDeniedError('Access denied')
    }

    return await this.postRepository.delete(postId)
  }
}

// ❌ 反模式 4: 会话劫持漏洞
class BadSessionManagement {
  async validateSession(token: string) {
    // 错误：只验证令牌，不检查会话安全
    const payload = jwt.verify(token, this.jwtSecret)
    return await this.getUserById(payload.sub)
  }
}

// ✅ 正确模式：安全的会话验证
class GoodSessionManagement {
  async validateSession(token: string, request: any) {
    // 正确：全面的会话安全检查
    const payload = jwt.verify(token, this.jwtSecret)
    const session = await this.getSession(payload.sessionId)

    if (!session) {
      throw new InvalidSessionError('Session not found')
    }

    // 检查会话安全
    const isSecure = await this.sessionSecurityChecker.validateSessionSecurity(session, request)
    if (!isSecure) {
      await this.destroySession(session.id)
      throw new SessionSecurityError('Session security validation failed')
    }

    return await this.getUserById(session.userId)
  }
}
```

### 性能优化建议

#### 认证性能优化
```typescript
/**
 * 认证性能优化建议
 * @description 提供认证系统的性能优化指导
 */

// 1. 权限缓存优化
export class OptimizedPermissionChecker {
  private cache = new Map<string, { result: boolean; expiresAt: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5分钟

  async checkPermission(user: User, resource: string, action: string): Promise<boolean> {
    const cacheKey = `${user.id}:${resource}:${action}`
    const cached = this.cache.get(cacheKey)

    if (cached && cached.expiresAt > Date.now()) {
      return cached.result
    }

    const result = await this.performPermissionCheck(user, resource, action)

    this.cache.set(cacheKey, {
      result,
      expiresAt: Date.now() + this.CACHE_TTL
    })

    return result
  }

  invalidateUserCache(userId: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key)
      }
    }
  }
}

// 2. 批量操作优化
export class BatchAuthOperations {
  async batchCheckPermissions(
    users: User[],
    resource: string,
    action: string
  ): Promise<Map<string, boolean>> {
    // 批量查询用户角色
    const userIds = users.map(u => u.id)
    const userRoles = await this.getUserRolesBatch(userIds)

    // 批量查询角色权限
    const roleIds = Array.from(new Set(userRoles.flatMap(ur => ur.roleIds)))
    const rolePermissions = await this.getRolePermissionsBatch(roleIds)

    // 本地计算权限
    const results = new Map<string, boolean>()
    for (const user of users) {
      const hasPermission = this.calculatePermission(user, resource, action, userRoles, rolePermissions)
      results.set(user.id, hasPermission)
    }

    return results
  }

  private calculatePermission(
    user: User,
    resource: string,
    action: string,
    userRoles: any[],
    rolePermissions: any[]
  ): boolean {
    // 本地权限计算逻辑
    const userRoleIds = userRoles.find(ur => ur.userId === user.id)?.roleIds || []

    for (const roleId of userRoleIds) {
      const permissions = rolePermissions.find(rp => rp.roleId === roleId)?.permissions || []

      for (const permission of permissions) {
        if (permission.resource === resource && permission.action === action) {
          return true
        }
      }
    }

    return false
  }
}

// 3. 连接池优化
export class OptimizedAuthDatabase {
  private connectionPool: Pool

  constructor() {
    this.connectionPool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // 最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  async getUserWithRoles(userId: string): Promise<User | null> {
    const client = await this.connectionPool.connect()

    try {
      // 使用JOIN减少查询次数
      const query = `
        SELECT u.*, r.id as role_id, r.name as role_name, r.permissions
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `

      const result = await client.query(query, [userId])
      return this.mapUserWithRoles(result.rows)
    } finally {
      client.release()
    }
  }
}
```

---

## 🧪 测试策略

### 测试覆盖率
- **总体覆盖率**: > 85%
- **认证核心**: > 90%
- **权限系统**: > 90%
- **安全工具**: > 95%

### 安全测试
```typescript
describe('Security Tests', () => {
  test('should prevent password brute force', async () => {
    // 暴力破解防护测试
  })
  
  test('should validate JWT tokens properly', async () => {
    // JWT验证测试
  })
  
  test('should handle session hijacking', async () => {
    // 会话劫持防护测试
  })
})
```

---

## 🚀 开发指南

### 开发优先级
1. **P0**: 基础认证系统 (用户名密码)
2. **P0**: 基础权限检查 (RBAC)
3. **P1**: 会话管理和JWT
4. **P1**: OAuth提供商
5. **P2**: 多租户支持
6. **P2**: ABAC权限策略

### 验收标准
- [ ] 认证系统功能完整
- [ ] 权限控制正常工作
- [ ] 会话管理安全可靠
- [ ] 多租户支持完整
- [ ] 安全测试全部通过
- [ ] 性能指标达标

---

## 🤖 AI 集成支持

### AI-First 开发方法论的具体应用

#### 智能安全分析
```typescript
/**
 * AI 驱动的安全分析系统
 * @description 使用 AI 技术增强认证和权限系统的安全性
 */
export interface AuthAIIntegration {
  /**
   * 异常行为检测
   * @param user - 用户信息
   * @param activity - 用户活动数据
   * @returns 异常检测结果
   */
  detectAnomalousActivity(user: User, activity: UserActivity): Promise<AnomalyDetectionResult>

  /**
   * 智能风险评估
   * @param authRequest - 认证请求
   * @returns 风险评估结果
   */
  assessAuthenticationRisk(authRequest: AuthRequest): Promise<RiskAssessmentResult>

  /**
   * 自适应权限建议
   * @param user - 用户信息
   * @param context - 权限上下文
   * @returns 权限建议
   */
  suggestPermissions(user: User, context: PermissionContext): Promise<PermissionSuggestion[]>

  /**
   * 安全策略优化
   * @param securityMetrics - 安全指标数据
   * @returns 优化建议
   */
  optimizeSecurityPolicies(securityMetrics: SecurityMetrics): Promise<SecurityOptimization[]>
}

// AI 安全分析实现
export class AISecurityAnalyzer implements AuthAIIntegration {
  constructor(private aiProvider: AIProvider) {}

  async detectAnomalousActivity(user: User, activity: UserActivity): Promise<AnomalyDetectionResult> {
    // 构建用户行为特征
    const behaviorProfile = await this.buildUserBehaviorProfile(user.id)

    // AI 异常检测
    const features = this.extractActivityFeatures(activity, behaviorProfile)
    const anomalyScore = await this.aiProvider.detectAnomaly(features)

    return {
      isAnomalous: anomalyScore > 0.7,
      anomalyScore,
      riskFactors: this.identifyRiskFactors(activity, behaviorProfile),
      recommendedActions: this.generateSecurityActions(anomalyScore),
      confidence: this.calculateConfidence(features)
    }
  }

  async assessAuthenticationRisk(authRequest: AuthRequest): Promise<RiskAssessmentResult> {
    const riskFactors = await this.analyzeRiskFactors(authRequest)
    const riskScore = await this.calculateRiskScore(riskFactors)

    return {
      riskLevel: this.categorizeRiskLevel(riskScore),
      riskScore,
      factors: riskFactors,
      mitigationStrategies: this.suggestMitigationStrategies(riskFactors),
      requiresAdditionalAuth: riskScore > 0.6
    }
  }

  async suggestPermissions(user: User, context: PermissionContext): Promise<PermissionSuggestion[]> {
    // 分析用户角色和历史权限使用
    const userProfile = await this.analyzeUserProfile(user)
    const usagePatterns = await this.analyzePermissionUsage(user.id)

    // AI 权限建议
    const suggestions = await this.aiProvider.generatePermissionSuggestions({
      userProfile,
      usagePatterns,
      context,
      similarUsers: await this.findSimilarUsers(user)
    })

    return suggestions.map(suggestion => ({
      permission: suggestion.permission,
      confidence: suggestion.confidence,
      reasoning: suggestion.reasoning,
      riskLevel: this.assessPermissionRisk(suggestion.permission),
      expirationRecommendation: suggestion.expirationRecommendation
    }))
  }

  private async buildUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    const activities = await this.getUserActivities(userId, { days: 30 })

    return {
      loginPatterns: this.analyzeLoginPatterns(activities),
      locationPatterns: this.analyzeLocationPatterns(activities),
      devicePatterns: this.analyzeDevicePatterns(activities),
      timePatterns: this.analyzeTimePatterns(activities),
      permissionUsage: this.analyzePermissionUsage(activities)
    }
  }

  private extractActivityFeatures(activity: UserActivity, profile: UserBehaviorProfile): ActivityFeatures {
    return {
      // 时间特征
      hourOfDay: new Date(activity.timestamp).getHours(),
      dayOfWeek: new Date(activity.timestamp).getDay(),
      isBusinessHours: this.isBusinessHours(activity.timestamp),

      // 位置特征
      locationDeviation: this.calculateLocationDeviation(activity.location, profile.locationPatterns),
      isNewLocation: !profile.locationPatterns.includes(activity.location),

      // 设备特征
      deviceFingerprint: activity.deviceFingerprint,
      isNewDevice: !profile.devicePatterns.includes(activity.deviceFingerprint),

      // 行为特征
      actionType: activity.actionType,
      resourceAccessed: activity.resourceAccessed,
      sessionDuration: activity.sessionDuration,

      // 网络特征
      ipAddress: activity.ipAddress,
      isVPN: await this.detectVPN(activity.ipAddress),
      isTor: await this.detectTor(activity.ipAddress)
    }
  }
}

export interface AnomalyDetectionResult {
  isAnomalous: boolean
  anomalyScore: number
  riskFactors: string[]
  recommendedActions: SecurityAction[]
  confidence: number
}

export interface RiskAssessmentResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  factors: RiskFactor[]
  mitigationStrategies: MitigationStrategy[]
  requiresAdditionalAuth: boolean
}

export interface PermissionSuggestion {
  permission: Permission
  confidence: number
  reasoning: string
  riskLevel: 'low' | 'medium' | 'high'
  expirationRecommendation?: Date
}
```

#### 智能认证优化
```typescript
/**
 * AI 驱动的认证优化系统
 * @description 使用机器学习优化认证流程和用户体验
 */
export class IntelligentAuthOptimizer {
  /**
   * 自适应认证强度
   * @param user - 用户信息
   * @param context - 认证上下文
   * @returns 推荐的认证强度
   */
  async recommendAuthStrength(user: User, context: AuthContext): Promise<AuthStrengthRecommendation> {
    const riskProfile = await this.assessUserRisk(user, context)
    const behaviorAnalysis = await this.analyzeBehaviorPatterns(user.id)

    return {
      recommendedMethods: this.selectAuthMethods(riskProfile, behaviorAnalysis),
      requiredFactors: this.calculateRequiredFactors(riskProfile.riskScore),
      sessionDuration: this.optimizeSessionDuration(riskProfile, behaviorAnalysis),
      monitoringLevel: this.determineMonitoringLevel(riskProfile.riskScore)
    }
  }

  /**
   * 智能密码策略
   * @param user - 用户信息
   * @returns 个性化密码策略
   */
  async generatePasswordPolicy(user: User): Promise<PasswordPolicy> {
    const userRisk = await this.assessUserRiskProfile(user)
    const industryStandards = await this.getIndustryStandards(user.tenantId)

    return {
      minLength: this.calculateMinLength(userRisk, industryStandards),
      complexity: this.determineComplexityRequirements(userRisk),
      expirationDays: this.optimizeExpirationPeriod(userRisk, user.lastPasswordChange),
      historyCount: this.calculateHistoryRequirement(userRisk),
      customRules: this.generateCustomRules(user, userRisk)
    }
  }

  /**
   * 智能会话管理
   * @param user - 用户信息
   * @param activity - 用户活动
   * @returns 会话管理建议
   */
  async optimizeSessionManagement(user: User, activity: UserActivity[]): Promise<SessionOptimization> {
    const usagePatterns = this.analyzeUsagePatterns(activity)
    const riskProfile = await this.assessSessionRisk(user, activity)

    return {
      optimalSessionDuration: this.calculateOptimalDuration(usagePatterns, riskProfile),
      refreshStrategy: this.determineRefreshStrategy(usagePatterns),
      concurrentSessionLimit: this.optimizeConcurrentSessions(user, usagePatterns),
      inactivityTimeout: this.calculateInactivityTimeout(usagePatterns, riskProfile)
    }
  }

  /**
   * 预测性安全威胁检测
   * @param systemMetrics - 系统指标
   * @returns 威胁预测结果
   */
  async predictSecurityThreats(systemMetrics: SystemSecurityMetrics): Promise<ThreatPrediction[]> {
    const patterns = await this.analyzeSecurityPatterns(systemMetrics)
    const predictions = await this.aiProvider.predictThreats(patterns)

    return predictions.map(prediction => ({
      threatType: prediction.threatType,
      probability: prediction.probability,
      estimatedImpact: prediction.estimatedImpact,
      timeframe: prediction.timeframe,
      preventionMeasures: this.generatePreventionMeasures(prediction),
      monitoringRecommendations: this.generateMonitoringRecommendations(prediction)
    }))
  }

  private selectAuthMethods(riskProfile: RiskProfile, behaviorAnalysis: BehaviorAnalysis): AuthMethod[] {
    const methods: AuthMethod[] = ['password'] // 基础认证

    if (riskProfile.riskScore > 0.3) {
      methods.push('email-verification')
    }

    if (riskProfile.riskScore > 0.5) {
      methods.push('sms-verification')
    }

    if (riskProfile.riskScore > 0.7) {
      methods.push('totp')
    }

    if (riskProfile.riskScore > 0.9) {
      methods.push('hardware-key')
    }

    // 基于用户行为优化
    if (behaviorAnalysis.prefersMobile) {
      methods.push('push-notification')
    }

    return methods
  }
}

export interface AuthStrengthRecommendation {
  recommendedMethods: AuthMethod[]
  requiredFactors: number
  sessionDuration: number
  monitoringLevel: 'low' | 'medium' | 'high'
}

export interface PasswordPolicy {
  minLength: number
  complexity: ComplexityRequirements
  expirationDays: number
  historyCount: number
  customRules: PasswordRule[]
}

export interface SessionOptimization {
  optimalSessionDuration: number
  refreshStrategy: 'automatic' | 'manual' | 'hybrid'
  concurrentSessionLimit: number
  inactivityTimeout: number
}

export interface ThreatPrediction {
  threatType: string
  probability: number
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical'
  timeframe: string
  preventionMeasures: PreventionMeasure[]
  monitoringRecommendations: MonitoringRecommendation[]
}
```

### AI 工具集成点

#### 行为分析和异常检测
- **用户行为建模**: 基于历史数据建立用户行为基线
- **异常活动检测**: 实时检测可疑的登录和操作行为
- **风险评分**: 动态计算用户和操作的风险等级
- **自适应安全**: 根据风险等级自动调整安全策略

#### 智能权限管理
- **权限推荐**: 基于角色和使用模式推荐合适的权限
- **权限优化**: 分析权限使用情况，优化权限分配
- **访问模式分析**: 识别异常的权限访问模式
- **最小权限原则**: 自动实施最小权限原则

#### 安全策略优化
- **策略效果评估**: 分析安全策略的有效性
- **自动策略调整**: 基于威胁情报自动调整安全策略
- **合规性检查**: 自动检查安全策略的合规性
- **威胁预测**: 预测潜在的安全威胁和攻击

### 开发体验优化

#### AI 辅助的安全开发
```typescript
/**
 * AI 辅助的安全开发工具
 * @description 为开发者提供 AI 驱动的安全开发支持
 */
export class AISecurityDevTools {
  /**
   * 安全代码审查
   * @param code - 代码内容
   * @returns 安全审查结果
   */
  static async reviewSecurityCode(code: string): Promise<SecurityCodeReview> {
    const vulnerabilities = await this.detectVulnerabilities(code)
    const bestPractices = await this.checkBestPractices(code)
    const suggestions = await this.generateImprovementSuggestions(code)

    return {
      vulnerabilities,
      bestPractices,
      suggestions,
      securityScore: this.calculateSecurityScore(vulnerabilities, bestPractices),
      complianceStatus: this.checkCompliance(code)
    }
  }

  /**
   * 智能安全配置生成
   * @param requirements - 安全需求
   * @returns 生成的安全配置
   */
  static async generateSecurityConfig(requirements: SecurityRequirements): Promise<SecurityConfig> {
    return {
      authProviders: this.selectOptimalProviders(requirements),
      passwordPolicy: this.generatePasswordPolicy(requirements),
      sessionConfig: this.optimizeSessionConfig(requirements),
      permissionStrategy: this.selectPermissionStrategy(requirements),
      monitoringRules: this.generateMonitoringRules(requirements)
    }
  }

  /**
   * 安全测试用例生成
   * @param authFlow - 认证流程
   * @returns 生成的测试用例
   */
  static async generateSecurityTests(authFlow: AuthFlow): Promise<SecurityTestSuite> {
    return {
      authenticationTests: this.generateAuthTests(authFlow),
      authorizationTests: this.generateAuthzTests(authFlow),
      sessionTests: this.generateSessionTests(authFlow),
      securityTests: this.generateSecurityAttackTests(authFlow),
      performanceTests: this.generatePerformanceTests(authFlow)
    }
  }

  /**
   * 威胁建模
   * @param systemArchitecture - 系统架构
   * @returns 威胁模型
   */
  static async generateThreatModel(systemArchitecture: SystemArchitecture): Promise<ThreatModel> {
    const assets = this.identifyAssets(systemArchitecture)
    const threats = await this.identifyThreats(assets)
    const vulnerabilities = await this.assessVulnerabilities(threats)
    const mitigations = this.generateMitigations(vulnerabilities)

    return {
      assets,
      threats,
      vulnerabilities,
      mitigations,
      riskMatrix: this.generateRiskMatrix(threats, vulnerabilities),
      actionPlan: this.generateActionPlan(mitigations)
    }
  }

  private static async detectVulnerabilities(code: string): Promise<SecurityVulnerability[]> {
    // AI 驱动的漏洞检测
    const commonVulnerabilities = [
      'sql-injection',
      'xss',
      'csrf',
      'insecure-direct-object-reference',
      'security-misconfiguration',
      'sensitive-data-exposure',
      'insufficient-logging',
      'broken-authentication',
      'broken-access-control'
    ]

    const detectedVulnerabilities: SecurityVulnerability[] = []

    for (const vulnType of commonVulnerabilities) {
      const detection = await this.analyzeCodeForVulnerability(code, vulnType)
      if (detection.found) {
        detectedVulnerabilities.push({
          type: vulnType,
          severity: detection.severity,
          location: detection.location,
          description: detection.description,
          recommendation: detection.recommendation
        })
      }
    }

    return detectedVulnerabilities
  }
}

export interface SecurityCodeReview {
  vulnerabilities: SecurityVulnerability[]
  bestPractices: BestPracticeCheck[]
  suggestions: ImprovementSuggestion[]
  securityScore: number
  complianceStatus: ComplianceStatus
}

export interface SecurityVulnerability {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  location: CodeLocation
  description: string
  recommendation: string
}

export interface ThreatModel {
  assets: Asset[]
  threats: Threat[]
  vulnerabilities: Vulnerability[]
  mitigations: Mitigation[]
  riskMatrix: RiskMatrix
  actionPlan: ActionPlan
}
```

---

**重要提醒**: @linch-kit/auth 是系统安全的核心，必须严格遵循安全最佳实践，确保所有认证和权限功能的安全性和可靠性。所有设计都应该遵循 AI-First 原则，利用 AI 技术增强安全防护能力，提供智能化的安全管理和威胁检测功能。
