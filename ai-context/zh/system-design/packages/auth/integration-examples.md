# @linch-kit/auth 集成示例

> **文档类型**: 集成示例  
> **适用场景**: 快速上手认证权限系统，了解最佳实践

## 🎯 概览

本文档提供 @linch-kit/auth 与其他包的集成示例，展示如何在实际项目中实现企业级的认证和权限管理。

## 🔐 基础认证集成

### 多提供商认证设置

```typescript
// auth/providers.ts
import { AuthManager, AuthProvider } from '@linch-kit/auth'
import { Logger } from '@linch-kit/core'

// 配置认证提供商
export async function setupAuthProviders() {
  // 1. 用户名密码认证
  await AuthManager.registerProvider('credentials', {
    type: 'credentials',
    config: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000 // 15分钟
    },
    
    async authenticate(credentials) {
      const { email, password } = credentials
      
      try {
        // 查找用户
        const user = await this.findUserByEmail(email)
        if (!user) {
          throw new Error('Invalid credentials')
        }
        
        // 检查账户状态
        if (user.status === 'locked') {
          throw new Error('Account is locked')
        }
        
        // 验证密码
        const isValidPassword = await this.verifyPassword(password, user.passwordHash)
        if (!isValidPassword) {
          await this.recordFailedLogin(user.id)
          throw new Error('Invalid credentials')
        }
        
        // 重置失败计数
        await this.resetFailedLogins(user.id)
        
        Logger.info(`User authenticated: ${user.email}`)
        return user
        
      } catch (error) {
        Logger.warn(`Authentication failed for ${email}`, error)
        throw error
      }
    }
  })
  
  // 2. OAuth提供商 (Google)
  await AuthManager.registerProvider('google', {
    type: 'oauth',
    config: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: '/auth/google/callback',
      scope: ['profile', 'email']
    },
    
    async authenticate(oauthData) {
      const { code, state } = oauthData
      
      // 交换授权码获取访问令牌
      const tokenResponse = await this.exchangeCodeForToken(code)
      const userInfo = await this.fetchUserInfo(tokenResponse.access_token)
      
      // 查找或创建用户
      let user = await this.findUserByEmail(userInfo.email)
      if (!user) {
        user = await this.createUserFromOAuth(userInfo, 'google')
      }
      
      Logger.info(`OAuth user authenticated: ${user.email}`)
      return user
    }
  })
  
  // 3. SAML提供商 (企业SSO)
  await AuthManager.registerProvider('saml', {
    type: 'saml',
    config: {
      entryPoint: process.env.SAML_ENTRY_POINT,
      issuer: process.env.SAML_ISSUER,
      cert: process.env.SAML_CERT,
      callbackUrl: '/auth/saml/callback'
    },
    
    async authenticate(samlResponse) {
      const userData = await this.parseSAMLResponse(samlResponse)
      
      let user = await this.findUserByEmail(userData.email)
      if (!user) {
        user = await this.createUserFromSAML(userData)
      }
      
      // 同步用户属性
      await this.syncUserAttributes(user, userData)
      
      Logger.info(`SAML user authenticated: ${user.email}`)
      return user
    }
  })
}
```

### 会话管理集成

```typescript
// auth/session.ts
import { SessionManager, JWTManager } from '@linch-kit/auth'
import { ConfigManager, Logger } from '@linch-kit/core'

export class AuthSessionManager {
  static async setupSessions() {
    // JWT配置
    const jwtConfig = ConfigManager.getConfig('auth.jwt', {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      algorithm: 'HS256'
    })
    
    await JWTManager.configure(jwtConfig)
    
    // Session存储配置
    await SessionManager.configure({
      store: 'redis', // 'memory' | 'redis' | 'database'
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      cookie: {
        name: 'linchkit-session',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24小时
      }
    })
  }
  
  static async createSession(user: User, request: Request) {
    try {
      // 创建JWT令牌
      const tokens = await JWTManager.generateTokens({
        userId: user.id,
        email: user.email,
        roles: user.roles,
        tenantId: user.tenantId
      })
      
      // 创建会话
      const session = await SessionManager.create({
        userId: user.id,
        userAgent: request.headers['user-agent'],
        ipAddress: this.getClientIP(request),
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      
      Logger.info(`Session created for user: ${user.email}`, {
        sessionId: session.id,
        userId: user.id
      })
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionId: session.id,
        expiresIn: jwtConfig.expiresIn
      }
      
    } catch (error) {
      Logger.error('Failed to create session', error)
      throw error
    }
  }
  
  static async refreshSession(refreshToken: string) {
    try {
      // 验证刷新令牌
      const payload = await JWTManager.verifyRefreshToken(refreshToken)
      
      // 检查会话状态
      const session = await SessionManager.findByRefreshToken(refreshToken)
      if (!session || session.revoked || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired session')
      }
      
      // 生成新的访问令牌
      const accessToken = await JWTManager.generateAccessToken(payload)
      
      Logger.info(`Session refreshed for user: ${payload.userId}`)
      
      return { accessToken }
      
    } catch (error) {
      Logger.warn('Failed to refresh session', error)
      throw error
    }
  }
  
  static async revokeSession(sessionId: string) {
    await SessionManager.revoke(sessionId)
    Logger.info(`Session revoked: ${sessionId}`)
  }
}
```

## 🛡️ 权限控制集成

### RBAC权限系统

```typescript
// auth/rbac.ts
import { RoleManager, PermissionChecker } from '@linch-kit/auth'
import { Logger } from '@linch-kit/core'

export class RBACManager {
  static async setupRoles() {
    // 定义基础权限
    const permissions = [
      // 用户管理
      'user:create', 'user:read', 'user:update', 'user:delete',
      'user:list', 'user:search', 'user:export',
      
      // 内容管理
      'content:create', 'content:read', 'content:update', 'content:delete',
      'content:publish', 'content:moderate',
      
      // 系统管理
      'system:config', 'system:monitor', 'system:backup',
      'system:logs', 'system:metrics'
    ]
    
    // 定义角色
    await RoleManager.defineRoles({
      // 超级管理员
      'super-admin': {
        name: 'Super Administrator',
        description: 'Full system access',
        permissions: ['*'], // 所有权限
        inherits: []
      },
      
      // 管理员
      'admin': {
        name: 'Administrator',
        description: 'System administrator',
        permissions: [
          'user:*', 'content:*', 'system:config', 'system:monitor'
        ],
        inherits: []
      },
      
      // 内容管理员
      'content-manager': {
        name: 'Content Manager',
        description: 'Content management access',
        permissions: [
          'content:*', 'user:read', 'user:list'
        ],
        inherits: []
      },
      
      // 编辑
      'editor': {
        name: 'Editor',
        description: 'Content editing access',
        permissions: [
          'content:create', 'content:read', 'content:update'
        ],
        inherits: []
      },
      
      // 普通用户
      'user': {
        name: 'User',
        description: 'Basic user access',
        permissions: [
          'user:read', 'content:read'
        ],
        inherits: []
      }
    })
  }
  
  static async assignRole(userId: string, roleName: string, context?: any) {
    try {
      await RoleManager.assignRole(userId, roleName, context)
      Logger.info(`Role assigned: ${roleName} to user ${userId}`, { context })
    } catch (error) {
      Logger.error(`Failed to assign role: ${roleName} to user ${userId}`, error)
      throw error
    }
  }
  
  static async checkPermission(
    user: User, 
    permission: string, 
    resource?: any,
    context?: any
  ): Promise<boolean> {
    try {
      const hasPermission = await PermissionChecker.check(user, permission, {
        resource,
        context,
        tenantId: user.tenantId
      })
      
      Logger.debug(`Permission check: ${permission}`, {
        userId: user.id,
        result: hasPermission,
        resource: resource?.id,
        context
      })
      
      return hasPermission
      
    } catch (error) {
      Logger.error(`Permission check failed: ${permission}`, error)
      return false
    }
  }
}
```

### ABAC属性权限

```typescript
// auth/abac.ts
import { AttributeBasedAccessControl, PolicyEngine } from '@linch-kit/auth'

export class ABACManager {
  static async setupPolicies() {
    // 定义属性权限策略
    await PolicyEngine.definePolicies({
      // 资源所有者策略
      'resource-owner': {
        description: 'User can access their own resources',
        condition: {
          subject: { role: ['user', 'admin'] },
          resource: { ownerId: '${subject.userId}' },
          action: ['read', 'update']
        }
      },
      
      // 部门管理策略
      'department-manager': {
        description: 'Department managers can manage their team',
        condition: {
          subject: { role: 'manager', department: '${resource.department}' },
          resource: { type: 'user' },
          action: ['read', 'update', 'assign-tasks']
        }
      },
      
      // 时间限制策略
      'business-hours': {
        description: 'Some actions only allowed during business hours',
        condition: {
          subject: { role: ['user'] },
          environment: { 
            time: { 
              range: ['09:00', '17:00'],
              timezone: 'UTC+8'
            }
          },
          action: ['create', 'update', 'delete']
        }
      },
      
      // 地理位置策略
      'location-restricted': {
        description: 'Sensitive operations require office location',
        condition: {
          subject: { role: ['admin'] },
          environment: {
            location: {
              country: 'China',
              city: ['Beijing', 'Shanghai'],
              office: true
            }
          },
          resource: { classification: 'sensitive' },
          action: ['read', 'export']
        }
      },
      
      // 数据分类策略
      'data-classification': {
        description: 'Access based on data classification',
        condition: {
          subject: { 
            clearanceLevel: { min: '${resource.classificationLevel}' }
          },
          resource: { 
            classification: ['public', 'internal', 'confidential', 'secret']
          },
          action: ['read']
        }
      }
    })
  }
  
  static async evaluateAccess(
    subject: User,
    resource: any,
    action: string,
    environment?: any
  ): Promise<boolean> {
    const decision = await AttributeBasedAccessControl.evaluate({
      subject: {
        userId: subject.id,
        role: subject.roles,
        department: subject.department,
        clearanceLevel: subject.clearanceLevel,
        attributes: subject.attributes
      },
      resource: {
        id: resource.id,
        type: resource.type,
        ownerId: resource.ownerId,
        department: resource.department,
        classification: resource.classification,
        classificationLevel: resource.classificationLevel
      },
      action,
      environment: {
        time: new Date().toISOString(),
        location: environment?.location,
        ipAddress: environment?.ipAddress,
        userAgent: environment?.userAgent
      }
    })
    
    Logger.info('ABAC decision', {
      subject: subject.id,
      resource: resource.id,
      action,
      decision: decision.permit,
      policies: decision.applicablePolicies
    })
    
    return decision.permit
  }
}
```

## 🔗 与其他包的集成

### 与 @linch-kit/core 集成

```typescript
// integration/auth-core.ts
import { Plugin, PluginSystem, MetricsCollector, Logger } from '@linch-kit/core'
import { AuthManager, SessionManager } from '@linch-kit/auth'

export const authPlugin: Plugin = {
  id: 'auth-plugin',
  name: 'Authentication Plugin',
  version: '1.0.0',
  dependencies: ['@linch-kit/core'],
  
  async setup(config: any) {
    // 注册认证相关指标
    this.setupMetrics()
    
    // 监听用户认证事件
    PluginSystem.on('user:login', async (event) => {
      await this.handleUserLogin(event)
    })
    
    PluginSystem.on('user:logout', async (event) => {
      await this.handleUserLogout(event)
    })
    
    PluginSystem.on('user:session:expired', async (event) => {
      await this.handleSessionExpired(event)
    })
    
    // 监听安全事件
    PluginSystem.on('security:suspicious-activity', async (event) => {
      await this.handleSuspiciousActivity(event)
    })
    
    Logger.info('Auth plugin initialized')
  },
  
  setupMetrics() {
    MetricsCollector.registerMetric('auth_login_attempts_total', 'counter')
    MetricsCollector.registerMetric('auth_login_success_total', 'counter')
    MetricsCollector.registerMetric('auth_login_failure_total', 'counter')
    MetricsCollector.registerMetric('auth_active_sessions', 'gauge')
    MetricsCollector.registerMetric('auth_permission_checks_total', 'counter')
  },
  
  async handleUserLogin(event: any) {
    const { user, provider, ipAddress } = event
    
    // 记录登录指标
    MetricsCollector.recordMetric('auth_login_success_total', 1, {
      provider,
      user_role: user.roles.join(',')
    })
    
    // 更新活跃会话数
    const activeSessions = await SessionManager.getActiveSessionCount()
    MetricsCollector.recordMetric('auth_active_sessions', activeSessions)
    
    // 记录登录日志
    Logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      provider,
      ipAddress,
      userAgent: event.userAgent
    })
    
    // 发布登录成功事件
    PluginSystem.emit('audit:user-login', {
      userId: user.id,
      action: 'login',
      provider,
      ipAddress,
      timestamp: new Date()
    })
  },
  
  async handleUserLogout(event: any) {
    const { userId, sessionId } = event
    
    Logger.info('User logged out', { userId, sessionId })
    
    // 发布登出事件
    PluginSystem.emit('audit:user-logout', {
      userId,
      action: 'logout',
      sessionId,
      timestamp: new Date()
    })
  },
  
  async handleSuspiciousActivity(event: any) {
    const { userId, activity, risk, ipAddress } = event
    
    Logger.warn('Suspicious activity detected', {
      userId,
      activity,
      risk,
      ipAddress
    })
    
    // 高风险活动自动处理
    if (risk === 'high') {
      // 锁定用户账户
      await AuthManager.lockUser(userId)
      
      // 撤销所有会话
      await SessionManager.revokeAllUserSessions(userId)
      
      // 发送安全警报
      PluginSystem.emit('security:alert', {
        type: 'account-locked',
        userId,
        reason: 'suspicious-activity',
        details: event
      })
    }
  }
}
```

### 与 @linch-kit/schema 集成

```typescript
// integration/auth-schema.ts
import { defineEntity, defineField } from '@linch-kit/schema'
import { AuthManager } from '@linch-kit/auth'

// 用户实体（集成认证）
export const UserSchema = defineEntity('User', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  email: defineField({ type: 'email', required: true, unique: true }),
  passwordHash: defineField({ 
    type: 'string', 
    required: true,
    sensitive: true,
    exclude: ['api', 'ui'] // 不在API和UI中暴露
  }),
  
  // 认证相关字段
  emailVerified: defineField({ type: 'boolean', default: false }),
  emailVerificationToken: defineField({ type: 'string', optional: true, sensitive: true }),
  passwordResetToken: defineField({ type: 'string', optional: true, sensitive: true }),
  passwordResetExpires: defineField({ type: 'datetime', optional: true }),
  
  // 安全字段
  loginAttempts: defineField({ type: 'number', default: 0 }),
  lockedAt: defineField({ type: 'datetime', optional: true }),
  lastLoginAt: defineField({ type: 'datetime', optional: true }),
  lastLoginIP: defineField({ type: 'string', optional: true }),
  
  // MFA字段
  mfaEnabled: defineField({ type: 'boolean', default: false }),
  mfaSecret: defineField({ type: 'string', optional: true, sensitive: true }),
  mfaBackupCodes: defineField({ type: 'json', optional: true, sensitive: true }),
  
  // 角色和权限
  roles: defineField({
    type: 'relation',
    target: 'Role',
    relation: 'many-to-many',
    through: 'UserRole'
  }),
  
  permissions: defineField({
    type: 'relation',
    target: 'Permission',
    relation: 'many-to-many',
    through: 'UserPermission'
  })
}, {
  // 认证配置
  auth: {
    loginField: 'email',
    passwordField: 'passwordHash',
    lockoutThreshold: 5,
    lockoutDuration: 15 * 60 * 1000,
    sessionTimeout: 24 * 60 * 60 * 1000
  },
  
  // 字段级权限
  fieldPermissions: {
    passwordHash: { read: [], write: ['system'] },
    emailVerificationToken: { read: ['system'], write: ['system'] },
    mfaSecret: { read: ['system'], write: ['system'] },
    loginAttempts: { read: ['admin'], write: ['system'] }
  }
})

// 会话实体
export const SessionSchema = defineEntity('Session', {
  id: defineField({ type: 'string', primary: true, generated: 'uuid' }),
  userId: defineField({ type: 'string', required: true }),
  refreshToken: defineField({ type: 'string', required: true, sensitive: true }),
  userAgent: defineField({ type: 'string', optional: true }),
  ipAddress: defineField({ type: 'string', optional: true }),
  expiresAt: defineField({ type: 'datetime', required: true }),
  revokedAt: defineField({ type: 'datetime', optional: true }),
  
  user: defineField({
    type: 'relation',
    target: 'User',
    relation: 'many-to-one',
    foreignKey: 'userId'
  })
}, {
  permissions: {
    read: ['owner', 'admin'],
    write: ['system'],
    delete: ['owner', 'admin']
  }
})
```

### 与 @linch-kit/trpc 集成

```typescript
// integration/auth-trpc.ts
import { authMiddleware, permissionMiddleware } from '@linch-kit/auth'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@linch-kit/trpc'

// 认证中间件
export const authRouter = createTRPCRouter({
  // 用户注册
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2)
    }))
    .mutation(async ({ input }) => {
      const user = await AuthManager.register(input)
      return { success: true, userId: user.id }
    }),
  
  // 用户登录
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
      rememberMe: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await AuthManager.authenticate({
        provider: 'credentials',
        ...input
      })
      
      if (result.success) {
        const session = await AuthSessionManager.createSession(result.user, ctx.req)
        return {
          success: true,
          user: result.user,
          ...session
        }
      }
      
      throw new Error('Authentication failed')
    }),
  
  // 刷新令牌
  refresh: publicProcedure
    .input(z.object({
      refreshToken: z.string()
    }))
    .mutation(async ({ input }) => {
      const result = await AuthSessionManager.refreshSession(input.refreshToken)
      return { success: true, ...result }
    }),
  
  // 获取当前用户信息
  me: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.user
    }),
  
  // 用户管理（需要权限）
  users: createTRPCRouter({
    list: protectedProcedure
      .use(permissionMiddleware('user:list'))
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional()
      }))
      .query(async ({ input }) => {
        return await UserService.findMany(input)
      }),
    
    create: protectedProcedure
      .use(permissionMiddleware('user:create'))
      .input(z.object({
        email: z.string().email(),
        name: z.string(),
        roles: z.array(z.string())
      }))
      .mutation(async ({ input }) => {
        return await UserService.create(input)
      }),
    
    update: protectedProcedure
      .use(permissionMiddleware('user:update'))
      .input(z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          roles: z.array(z.string()).optional()
        })
      }))
      .mutation(async ({ input, ctx }) => {
        // 检查是否有权限更新特定用户
        const canUpdate = await RBACManager.checkPermission(
          ctx.user,
          'user:update',
          { targetUserId: input.id }
        )
        
        if (!canUpdate) {
          throw new Error('Insufficient permissions')
        }
        
        return await UserService.update(input.id, input.data)
      }),
    
    delete: protectedProcedure
      .use(permissionMiddleware('user:delete'))
      .input(z.object({
        id: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        // 检查ABAC权限
        const canDelete = await ABACManager.evaluateAccess(
          ctx.user,
          { id: input.id, type: 'user' },
          'delete',
          { ipAddress: ctx.req.ip }
        )
        
        if (!canDelete) {
          throw new Error('Access denied by policy')
        }
        
        return await UserService.delete(input.id)
      })
  })
})
```

## 🚀 完整认证流程示例

### 企业级登录流程

```typescript
// flows/enterprise-login.ts
import { AuthManager, MFAManager, AuditLogger } from '@linch-kit/auth'
import { Logger, MetricsCollector } from '@linch-kit/core'

export class EnterpriseLoginFlow {
  static async authenticate(loginData: any, context: any) {
    const { email, password, mfaToken, device } = loginData
    const { ipAddress, userAgent, location } = context
    
    try {
      // 1. 基础认证
      Logger.info('Starting authentication flow', { email, ipAddress })
      
      const authResult = await AuthManager.authenticate({
        provider: 'credentials',
        email,
        password
      })
      
      if (!authResult.success) {
        await this.handleFailedLogin(email, ipAddress, 'invalid-credentials')
        throw new Error('Authentication failed')
      }
      
      const user = authResult.user
      
      // 2. 账户状态检查
      await this.validateAccountStatus(user)
      
      // 3. 设备识别
      const deviceInfo = await this.identifyDevice(device, user.id)
      
      // 4. 风险评估
      const riskAssessment = await this.assessLoginRisk(user, {
        ipAddress,
        location,
        device: deviceInfo,
        userAgent
      })
      
      // 5. MFA检查
      if (user.mfaEnabled || riskAssessment.requireMFA) {
        await this.validateMFA(user, mfaToken, riskAssessment)
      }
      
      // 6. 创建会话
      const session = await AuthSessionManager.createSession(user, {
        ipAddress,
        userAgent,
        device: deviceInfo
      })
      
      // 7. 审计日志
      await AuditLogger.logSuccessfulLogin({
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
        device: deviceInfo,
        riskScore: riskAssessment.score,
        mfaUsed: user.mfaEnabled || riskAssessment.requireMFA
      })
      
      // 8. 记录指标
      MetricsCollector.recordMetric('auth_login_success_total', 1, {
        provider: 'credentials',
        mfa_used: (user.mfaEnabled || riskAssessment.requireMFA).toString(),
        risk_level: riskAssessment.level
      })
      
      Logger.info('Authentication successful', {
        userId: user.id,
        email: user.email,
        sessionId: session.sessionId
      })
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        session: session,
        riskAssessment: {
          level: riskAssessment.level,
          recommendations: riskAssessment.recommendations
        }
      }
      
    } catch (error) {
      Logger.error('Authentication failed', error, { email, ipAddress })
      
      MetricsCollector.recordMetric('auth_login_failure_total', 1, {
        reason: error.message,
        provider: 'credentials'
      })
      
      throw error
    }
  }
  
  private static async validateAccountStatus(user: User) {
    if (user.status === 'suspended') {
      throw new Error('Account suspended')
    }
    
    if (user.status === 'locked') {
      throw new Error('Account locked')
    }
    
    if (!user.emailVerified) {
      throw new Error('Email not verified')
    }
  }
  
  private static async assessLoginRisk(user: User, context: any): Promise<RiskAssessment> {
    const riskFactors = []
    let score = 0
    
    // 检查IP地址
    const knownIPs = await this.getUserKnownIPs(user.id)
    if (!knownIPs.includes(context.ipAddress)) {
      riskFactors.push('unknown-ip')
      score += 30
    }
    
    // 检查地理位置
    if (context.location) {
      const knownLocations = await this.getUserKnownLocations(user.id)
      const isKnownLocation = knownLocations.some(loc => 
        this.calculateDistance(loc, context.location) < 100 // 100km内
      )
      
      if (!isKnownLocation) {
        riskFactors.push('unknown-location')
        score += 40
      }
    }
    
    // 检查设备
    if (!context.device.isKnown) {
      riskFactors.push('unknown-device')
      score += 25
    }
    
    // 检查登录时间
    const isBusinessHours = this.isBusinessHours(new Date())
    if (!isBusinessHours) {
      riskFactors.push('off-hours')
      score += 15
    }
    
    // 确定风险等级
    let level: 'low' | 'medium' | 'high'
    if (score < 30) level = 'low'
    else if (score < 60) level = 'medium'
    else level = 'high'
    
    const requireMFA = level === 'high' || (level === 'medium' && !user.mfaEnabled)
    
    return {
      score,
      level,
      factors: riskFactors,
      requireMFA,
      recommendations: this.generateRecommendations(riskFactors)
    }
  }
  
  private static async validateMFA(user: User, mfaToken?: string, riskAssessment?: any) {
    if (!mfaToken) {
      throw new Error('MFA token required')
    }
    
    const isValid = await MFAManager.verifyToken(user.id, mfaToken)
    if (!isValid) {
      throw new Error('Invalid MFA token')
    }
    
    Logger.info('MFA validation successful', {
      userId: user.id,
      riskLevel: riskAssessment?.level
    })
  }
}
```

## 📝 最佳实践

### 1. 安全配置

```typescript
// ✅ 推荐的安全配置
export const securityConfig = {
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventUserInfo: true
  },
  
  session: {
    maxAge: 8 * 60 * 60 * 1000, // 8小时
    renewThreshold: 30 * 60 * 1000, // 30分钟前续期
    maxConcurrentSessions: 3,
    enforceIPBinding: true
  },
  
  mfa: {
    enforceForAdmins: true,
    enforceForHighRisk: true,
    backupCodesCount: 10,
    windowSize: 1 // TOTP窗口
  },
  
  audit: {
    logAllEvents: true,
    retentionDays: 90,
    alertOnSuspicious: true
  }
}
```

### 2. 权限设计

```typescript
// ✅ 层次化权限设计
export const permissionHierarchy = {
  'system': {
    'admin': ['user:*', 'content:*', 'system:*'],
    'manager': ['user:read', 'user:update', 'content:*'],
    'editor': ['content:create', 'content:update', 'content:read'],
    'user': ['content:read', 'profile:update']
  },
  
  // 资源级权限
  resources: {
    'user': ['create', 'read', 'update', 'delete', 'list', 'search'],
    'content': ['create', 'read', 'update', 'delete', 'publish', 'moderate'],
    'system': ['config', 'monitor', 'backup', 'logs']
  }
}
```

## 🔗 相关链接

- [API参考](./api-reference.md) - 完整API文档
- [实现指南](./implementation-guide.md) - 内部架构设计
- [高级特性](./advanced-features.md) - 企业级安全特性
- [集成模式](../../../shared/integration-patterns.md) - 通用集成模式