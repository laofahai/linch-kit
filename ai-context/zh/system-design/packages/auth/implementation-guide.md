# @linch-kit/auth 实现指南

> **文档类型**: 实现细节  
> **适用场景**: 深度定制和扩展

## 🏗️ 架构设计

### 模块组织
```
src/
├── providers/        # 认证提供商
│   ├── credentials.ts  # 用户名密码认证
│   ├── oauth.ts       # OAuth2/OIDC集成
│   ├── saml.ts        # SAML认证
│   └── base.ts        # 认证提供商基类
├── permissions/      # 权限系统
│   ├── rbac.ts       # 基于角色的权限控制
│   ├── abac.ts       # 基于属性的权限控制
│   ├── checker.ts    # 权限检查引擎
│   └── inheritance.ts # 权限继承机制
├── session/          # 会话管理
│   ├── jwt.ts        # JWT会话处理
│   ├── database.ts   # 数据库会话存储
│   ├── redis.ts      # Redis会话存储
│   └── manager.ts    # 会话管理器
├── security/         # 安全特性
│   ├── password.ts   # 密码策略和哈希
│   ├── mfa.ts        # 多因子认证
│   ├── audit.ts      # 审计日志
│   └── rate-limit.ts # 登录限流
└── types/           # 类型定义
```

## 🔐 认证提供商实现 (基于 Passport.js)

### Passport.js 策略管理器
```typescript
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as GitHubStrategy } from 'passport-github2'

/**
 * 认证提供商管理器 - 基于 Passport.js 生态
 * 
 * 设计原则：
 * - 使用 Passport.js 的 300+ 策略生态，而不是重复实现
 * - 标准化的认证流程和错误处理
 * - 支持热插拔的认证策略
 */
class PassportAuthManager {
  private strategies = new Map<string, passport.Strategy>()
  
  constructor() {
    this.initializeCore()
  }
  
  private initializeCore() {
    // 用户名密码认证 - 使用 passport-local
    passport.use('credentials', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    }, async (req, email, password, done) => {
      try {
        const user = await this.verifyCredentials(email, password, req.ip)
        return done(null, user)
      } catch (error) {
        await this.logFailedLogin(email, req.ip, error.message)
        return done(error, false)
      }
    }))
    
    // JWT 认证 - 使用 passport-jwt
    passport.use('jwt', new JwtStrategy({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ['HS256'],
      passReqToCallback: true
    }, async (req, payload, done) => {
      try {
        const user = await this.findUserById(payload.sub)
        if (!user || user.status === 'disabled') {
          return done(null, false)
        }
        
        // 检查会话是否仍然有效
        const sessionValid = await this.validateSession(payload.jti)
        if (!sessionValid) {
          return done(null, false)
        }
        
        return done(null, user)
      } catch (error) {
        return done(error, false)
      }
    }))
    
    // Google OAuth - 使用 passport-google-oauth20
    if (process.env.GOOGLE_CLIENT_ID) {
      passport.use('google', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        scope: ['profile', 'email']
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await this.handleOAuthUser(profile, 'google', {
            accessToken,
            refreshToken
          })
          return done(null, user)
        } catch (error) {
          return done(error, false)
        }
      }))
    }
    
    // GitHub OAuth - 使用 passport-github2  
    if (process.env.GITHUB_CLIENT_ID) {
      passport.use('github', new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '/auth/github/callback'
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await this.handleOAuthUser(profile, 'github', {
            accessToken,
            refreshToken
          })
          return done(null, user)
        } catch (error) {
          return done(error, false)
        }
      }))
    }
  }
  
  async authenticate(strategy: string, req: any): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      passport.authenticate(strategy, (err, user, info) => {
        if (err) {
          reject(err)
        } else if (!user) {
          resolve({ 
            success: false, 
            error: info?.message || 'Authentication failed' 
          })
        } else {
          resolve({ 
            success: true, 
            user, 
            tokens: this.generateTokens(user) 
          })
        }
      })(req)
    })
  }
  
  // 动态注册新的认证策略
  registerStrategy(name: string, strategy: passport.Strategy) {
    passport.use(name, strategy)
    this.strategies.set(name, strategy)
  }
  
  // 获取所有可用的认证方式
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys())
  }
}
```

### SAML 提供商 (基于 passport-saml)
```typescript
import { Strategy as SamlStrategy } from 'passport-saml'

/**
 * SAML 认证提供商 - 基于 passport-saml
 * 
 * 设计原则：
 * - 使用 passport-saml 而不是自己实现 SAML 协议
 * - 支持多个 SAML Identity Provider
 * - 标准化的 SAML 断言处理
 */
class SAMLAuthProvider {
  registerSAMLProvider(name: string, config: SAMLConfig) {
    const strategy = new SamlStrategy({
      entryPoint: config.entryPoint,
      issuer: config.issuer,
      cert: config.cert,
      callbackUrl: `/auth/saml/${name}/callback`,
      signatureAlgorithm: 'sha256'
    }, async (profile, done) => {
      try {
        const user = await this.handleSAMLUser(profile, name)
        return done(null, user)
      } catch (error) {
        return done(error, false)
      }
    })
    
    passport.use(`saml-${name}`, strategy)
  }
  
  private async handleSAMLUser(profile: any, provider: string): Promise<User> {
    const email = this.extractEmail(profile)
    const attributes = this.extractAttributes(profile)
    
    // 查找或创建用户
    let user = await this.findUserByEmail(email)
    if (!user) {
      user = await this.createUserFromSAML(email, attributes, provider)
    } else {
      // 更新用户属性
      await this.updateUserAttributes(user.id, attributes)
    }
    
    return user
  }
}
```

## 🛡️ 权限系统实现 (基于 CASL)

### CASL 权限引擎
```typescript
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import { createSubjectType } from '@casl/ability/extra'

/**
 * 权限引擎 - 基于 CASL
 * 
 * 设计原则：
 * - 使用 CASL 实现复杂权限逻辑，而不是自己实现
 * - 支持字段级和条件权限控制
 * - 与前端权限系统保持一致
 * - 支持 RBAC 和 ABAC 混合模式
 */

type Subjects = 'User' | 'Post' | 'Comment' | 'Project' | 'File' | 'all'
type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'execute'
type AppAbility = MongoAbility<[Actions, Subjects]>

class CASLPermissionEngine {
  // 为用户创建能力对象
  createAbilityForUser(user: User, context?: PermissionContext): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)
    
    // 基于角色的基础权限 (RBAC)
    this.applyRoleBasedPermissions(user, can, cannot)
    
    // 基于属性的动态权限 (ABAC)
    this.applyAttributeBasedPermissions(user, context, can, cannot)
    
    // 字段级权限控制
    this.applyFieldLevelPermissions(user, can, cannot)
    
    return build()
  }
  
  private applyRoleBasedPermissions(
    user: User, 
    can: any, 
    cannot: any
  ) {
    // 超级管理员权限
    if (user.roles.includes('super_admin')) {
      can('manage', 'all')
      return
    }
    
    // 管理员权限
    if (user.roles.includes('admin')) {
      can('manage', ['User', 'Post', 'Comment'])
      can('read', 'all')
    }
    
    // 项目经理权限
    if (user.roles.includes('project_manager')) {
      can('manage', 'Project', { managerId: user.id })
      can('read', 'Project', { teamMembers: { $in: [user.id] } })
      can('update', 'User', { projectId: { $in: user.managedProjects } })
    }
    
    // 普通用户权限
    if (user.roles.includes('user')) {
      can('read', ['Post', 'Comment'])
      can('create', 'Comment')
      can('update', 'Comment', { authorId: user.id })
      can('delete', 'Comment', { authorId: user.id })
      can('update', 'User', { id: user.id }) // 只能编辑自己的信息
    }
    
    // 访客权限
    if (user.roles.includes('guest')) {
      can('read', 'Post', { published: true })
      cannot('read', 'Post', { draft: true })
    }
  }
  
  private applyAttributeBasedPermissions(
    user: User,
    context: PermissionContext | undefined,
    can: any,
    cannot: any
  ) {
    if (!context) return
    
    // 基于部门的权限
    if (user.department) {
      can('read', 'User', { department: user.department })
      
      if (user.department === 'hr') {
        can('read', 'User', ['salary', 'performance'])
        can('update', 'User', ['department', 'position'])
      }
      
      if (user.department === 'finance') {
        can('read', 'Project', ['budget', 'expenses'])
        can('update', 'Project', { department: 'finance' })
      }
    }
    
    // 基于时间的权限
    const currentHour = new Date().getHours()
    if (currentHour < 9 || currentHour > 18) {
      // 非工作时间限制某些操作
      cannot('delete', ['Project', 'User'])
      cannot('update', 'User', ['role', 'permissions'])
    }
    
    // 基于地理位置的权限
    if (context.location && user.allowedRegions) {
      if (!user.allowedRegions.includes(context.location)) {
        cannot('access', 'all')
      }
    }
    
    // 基于设备的权限
    if (context.deviceType === 'mobile') {
      cannot('manage', ['User', 'Project']) // 移动设备不允许管理操作
    }
  }
  
  private applyFieldLevelPermissions(
    user: User,
    can: any,
    cannot: any
  ) {
    // 所有用户都能读取基本字段
    can('read', 'User', ['id', 'name', 'email', 'avatar'])
    
    // 敏感字段默认禁止
    cannot('read', 'User', ['password', 'salt', 'resetToken'])
    
    // 根据角色开放不同字段
    if (user.roles.includes('hr')) {
      can('read', 'User', ['salary', 'department', 'hireDate'])
    }
    
    if (user.roles.includes('admin')) {
      can('read', 'User', ['lastLogin', 'loginCount', 'permissions'])
    }
    
    // 用户只能看到自己的私人信息
    can('read', 'User', ['phone', 'address'], { id: user.id })
  }
  
  // 主要的权限检查方法
  async checkPermission(
    user: User,
    action: Actions,
    subject: Subjects | any,
    context?: PermissionContext
  ): Promise<boolean> {
    const ability = this.createAbilityForUser(user, context)
    return ability.can(action, subject)
  }
  
  // 批量权限检查
  async checkMultiplePermissions(
    user: User,
    checks: Array<{ action: Actions; subject: Subjects | any }>,
    context?: PermissionContext
  ): Promise<Record<string, boolean>> {
    const ability = this.createAbilityForUser(user, context)
    const results: Record<string, boolean> = {}
    
    checks.forEach((check, index) => {
      const key = `${check.action}_${typeof check.subject === 'string' ? check.subject : check.subject.constructor.name}_${index}`
      results[key] = ability.can(check.action, check.subject)
    })
    
    return results
  }
  
  // 字段级权限过滤
  filterFields<T>(
    user: User,
    resource: T,
    requestedFields: string[],
    context?: PermissionContext
  ): Partial<T> {
    const ability = this.createAbilityForUser(user, context)
    const filteredFields: Partial<T> = {}
    
    requestedFields.forEach(field => {
      if (ability.can('read', createSubjectType(resource), field)) {
        (filteredFields as any)[field] = (resource as any)[field]
      }
    })
    
    return filteredFields
  }
  
  // 获取用户可访问的资源查询条件
  getAccessibleResourcesQuery<T>(
    user: User,
    resourceType: Subjects,
    action: Actions = 'read'
  ): any {
    const ability = this.createAbilityForUser(user)
    
    // 使用 CASL 的查询构建功能
    const query = ability.query(action, resourceType)
    return query
  }
}
```

### 权限缓存优化
```typescript
import { LRUCache } from 'lru-cache'

/**
 * 权限缓存管理器 - 优化权限检查性能
 */
class PermissionCacheManager {
  private permissionCache = new LRUCache<string, boolean>({
    max: 10000,
    ttl: 1000 * 60 * 5 // 5分钟缓存
  })
  
  private abilityCache = new LRUCache<string, AppAbility>({
    max: 1000,
    ttl: 1000 * 60 * 10 // 10分钟缓存
  })
  
  async checkPermissionWithCache(
    user: User,
    action: Actions,
    subject: Subjects | any,
    context?: PermissionContext
  ): Promise<boolean> {
    const cacheKey = this.generatePermissionCacheKey(user.id, action, subject, context)
    
    // 检查缓存
    const cached = this.permissionCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }
    
    // 执行权限检查
    const engine = new CASLPermissionEngine()
    const result = await engine.checkPermission(user, action, subject, context)
    
    // 缓存结果
    this.permissionCache.set(cacheKey, result)
    
    return result
  }
  
  getAbilityWithCache(user: User, context?: PermissionContext): AppAbility {
    const cacheKey = this.generateAbilityCacheKey(user.id, context)
    
    const cached = this.abilityCache.get(cacheKey)
    if (cached) return cached
    
    const engine = new CASLPermissionEngine()
    const ability = engine.createAbilityForUser(user, context)
    
    this.abilityCache.set(cacheKey, ability)
    return ability
  }
  
  // 用户权限变更时清除缓存
  clearUserCache(userId: string) {
    // 清除用户相关的所有缓存
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key)
      }
    }
    
    for (const key of this.abilityCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.abilityCache.delete(key)
      }
    }
  }
  
  private generatePermissionCacheKey(
    userId: string,
    action: Actions,
    subject: Subjects | any,
    context?: PermissionContext
  ): string {
    const subjectKey = typeof subject === 'string' ? subject : JSON.stringify(subject)
    const contextKey = context ? JSON.stringify(context) : ''
    return `${userId}:${action}:${subjectKey}:${contextKey}`
  }
  
  private generateAbilityCacheKey(userId: string, context?: PermissionContext): string {
    const contextKey = context ? JSON.stringify(context) : ''
    return `${userId}:ability:${contextKey}`
  }
}
```

## 🔑 会话管理实现

### JWT会话管理
```typescript
class JWTSessionManager {
  private jwtSecret: string
  private refreshTokenStore: Map<string, RefreshToken>
  
  async createSession(user: User, metadata?: any): Promise<Session> {
    // 1. 生成JWT访问令牌
    const accessToken = jwt.sign(
      {
        sub: user.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15分钟
        roles: user.roles.map(r => r.name)
      },
      this.jwtSecret
    )
    
    // 2. 生成刷新令牌
    const refreshToken = this.generateRefreshToken()
    await this.storeRefreshToken(refreshToken, user.id)
    
    // 3. 创建会话记录
    const session = {
      id: generateId(),
      userId: user.id,
      accessToken,
      refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7天
      metadata
    }
    
    return session
  }
  
  async validateSession(accessToken: string): Promise<Session | null> {
    try {
      const payload = jwt.verify(accessToken, this.jwtSecret) as JWTPayload
      
      // 检查令牌是否过期
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null
      }
      
      // 返回会话信息
      return {
        id: payload.jti,
        userId: payload.sub,
        accessToken,
        createdAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000)
      }
    } catch (error) {
      return null
    }
  }
}
```

## 🔒 安全特性实现

### 密码策略
```typescript
class PasswordPolicy {
  private config: PasswordPolicyConfig
  
  async validatePassword(password: string, user?: User): Promise<ValidationResult> {
    const errors: string[] = []
    
    // 长度检查
    if (password.length < this.config.minLength) {
      errors.push(`Password must be at least ${this.config.minLength} characters`)
    }
    
    // 复杂度检查
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters')
    }
    
    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters')
    }
    
    if (this.config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain numbers')
    }
    
    if (this.config.requireSymbols && !/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain symbols')
    }
    
    // 历史密码检查
    if (user && this.config.preventReuse) {
      const isReused = await this.checkPasswordHistory(user.id, password)
      if (isReused) {
        errors.push('Password cannot be reused')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.config.saltRounds || 12
    return await bcrypt.hash(password, saltRounds)
  }
}
```

### 多因子认证
```typescript
class MFAManager {
  async enableTOTP(userId: string): Promise<TOTPSetup> {
    // 1. 生成密钥
    const secret = speakeasy.generateSecret({
      name: `LinchKit (${userId})`,
      issuer: 'LinchKit'
    })
    
    // 2. 存储临时密钥
    await this.storeTempSecret(userId, secret.base32)
    
    // 3. 生成QR码
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url)
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: await this.generateBackupCodes(userId)
    }
  }
  
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secret = await this.getUserTOTPSecret(userId)
    if (!secret) return false
    
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // 允许时间偏移
    })
  }
}
```

## 📊 审计日志

### 审计事件记录
```typescript
class AuditLogger {
  async logAuthEvent(event: AuthAuditEvent): Promise<void> {
    const sanitizedEvent = this.sanitizeEvent(event)
    
    // 1. 写入数据库
    await this.writeToDatabase(sanitizedEvent)
    
    // 2. 发送到外部系统 (可选)
    if (this.config.externalLogging) {
      await this.sendToExternalSystem(sanitizedEvent)
    }
    
    // 3. 检查安全告警
    await this.checkSecurityAlerts(sanitizedEvent)
  }
  
  private sanitizeEvent(event: AuthAuditEvent): AuthAuditEvent {
    // 移除敏感信息
    return {
      ...event,
      details: this.removeSensitiveData(event.details)
    }
  }
  
  private async checkSecurityAlerts(event: AuthAuditEvent): Promise<void> {
    // 检查异常登录模式
    if (event.type === 'login_failed') {
      await this.checkFailedLoginPattern(event.userId, event.ipAddress)
    }
    
    // 检查权限提升
    if (event.type === 'permission_granted') {
      await this.checkPermissionEscalation(event.userId, event.details)
    }
  }
}
```