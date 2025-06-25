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

## 🔐 认证提供商实现

### 抽象基类
```typescript
abstract class AuthProvider {
  abstract readonly id: string
  abstract readonly name: string
  
  abstract authenticate(credentials: any): Promise<AuthResult>
  abstract validateToken(token: string): Promise<User | null>
  abstract refreshToken(refreshToken: string): Promise<TokenPair | null>
  
  // 可选的钩子方法
  async beforeAuthenticate?(credentials: any): Promise<void>
  async afterAuthenticate?(result: AuthResult): Promise<void>
}
```

### Credentials提供商
```typescript
class CredentialsProvider extends AuthProvider {
  readonly id = 'credentials'
  readonly name = 'Email/Password'
  
  async authenticate(credentials: EmailPasswordCredentials): Promise<AuthResult> {
    // 1. 验证输入
    await this.validateCredentials(credentials)
    
    // 2. 查找用户
    const user = await this.findUserByEmail(credentials.email)
    if (!user) {
      throw new AuthenticationError('User not found')
    }
    
    // 3. 验证密码
    const isValid = await this.verifyPassword(credentials.password, user.passwordHash)
    if (!isValid) {
      await this.handleFailedLogin(user.id)
      throw new AuthenticationError('Invalid password')
    }
    
    // 4. 生成令牌
    const tokens = await this.generateTokens(user)
    
    return {
      success: true,
      user,
      tokens
    }
  }
}
```

### OAuth提供商
```typescript
class OAuthProvider extends AuthProvider {
  readonly id = 'oauth'
  readonly name = 'OAuth2/OIDC'
  
  private oauthClients = new Map<string, OAuthClient>()
  
  registerClient(provider: string, config: OAuthConfig): void {
    this.oauthClients.set(provider, new OAuthClient(config))
  }
  
  getAuthorizationUrl(provider: string, redirectUri: string): string {
    const client = this.getClient(provider)
    return client.getAuthorizationUrl({
      redirect_uri: redirectUri,
      scope: ['openid', 'profile', 'email'],
      state: this.generateState()
    })
  }
  
  async handleCallback(provider: string, code: string, state: string): Promise<AuthResult> {
    const client = this.getClient(provider)
    
    // 1. 验证state参数
    await this.validateState(state)
    
    // 2. 交换访问令牌
    const tokenResponse = await client.exchangeCodeForTokens(code)
    
    // 3. 获取用户信息
    const userInfo = await client.getUserInfo(tokenResponse.access_token)
    
    // 4. 创建或更新用户
    const user = await this.createOrUpdateUser(userInfo, provider)
    
    // 5. 生成内部令牌
    const tokens = await this.generateTokens(user)
    
    return { success: true, user, tokens }
  }
}
```

## 🛡️ 权限系统实现

### RBAC权限检查器
```typescript
class RBACChecker {
  async checkPermission(
    user: User, 
    permission: string, 
    context?: PermissionContext
  ): Promise<boolean> {
    // 1. 获取用户角色
    const userRoles = await this.getUserRoles(user.id)
    
    // 2. 获取角色权限
    const rolePermissions = await this.getRolePermissions(userRoles)
    
    // 3. 检查权限匹配
    return this.matchPermission(permission, rolePermissions, context)
  }
  
  private matchPermission(
    required: string, 
    available: Permission[], 
    context?: PermissionContext
  ): boolean {
    for (const permission of available) {
      if (this.permissionMatches(required, permission.name)) {
        if (permission.conditions) {
          return this.evaluateConditions(permission.conditions, context)
        }
        return true
      }
    }
    return false
  }
}
```

### ABAC权限检查器
```typescript
class ABACChecker {
  async checkPermission(
    user: User, 
    permission: string, 
    context: PermissionContext
  ): Promise<boolean> {
    // 1. 构建属性集合
    const attributes = await this.buildAttributeSet(user, context)
    
    // 2. 获取适用的策略
    const policies = await this.getApplicablePolicies(permission)
    
    // 3. 评估策略
    for (const policy of policies) {
      const result = await this.evaluatePolicy(policy, attributes)
      if (result.effect === 'permit') {
        return true
      } else if (result.effect === 'deny') {
        return false
      }
    }
    
    // 4. 默认拒绝
    return false
  }
  
  private async buildAttributeSet(
    user: User, 
    context: PermissionContext
  ): Promise<AttributeSet> {
    return {
      subject: {
        id: user.id,
        roles: user.roles.map(r => r.name),
        department: user.department,
        level: user.level
      },
      resource: {
        type: context.resourceType,
        id: context.resourceId,
        owner: context.resourceOwner,
        sensitivity: context.resourceSensitivity
      },
      environment: {
        time: new Date(),
        ip: context.ipAddress,
        location: context.location
      }
    }
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