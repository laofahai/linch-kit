# @linch-kit/auth API 参考

## 🔐 认证管理

### AuthManager
```typescript
export class AuthManager {
  // 用户认证
  static async authenticate(credentials: AuthCredentials): Promise<AuthResult>
  
  // 注册用户
  static async register(userData: RegisterData): Promise<User>
  
  // 刷新令牌
  static async refreshToken(refreshToken: string): Promise<TokenPair>
  
  // 登出
  static async logout(userId: string): Promise<void>
}

export interface AuthCredentials {
  provider: 'credentials' | 'oauth' | 'saml'
  email?: string
  password?: string
  token?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  tokens?: TokenPair
  error?: string
}
```

## 🛡️ 权限控制

### PermissionChecker
```typescript
export class PermissionChecker {
  // 检查权限
  static async check(
    user: User, 
    permission: string, 
    context?: PermissionContext
  ): Promise<boolean>
  
  // 批量检查权限
  static async checkMultiple(
    user: User, 
    permissions: string[], 
    context?: PermissionContext
  ): Promise<Record<string, boolean>>
  
  // 获取用户权限列表
  static async getUserPermissions(userId: string): Promise<string[]>
}

export interface PermissionContext {
  tenantId?: string
  resourceId?: string
  [key: string]: any
}
```

## 👥 角色管理

### RoleManager
```typescript
export class RoleManager {
  // 创建角色
  static async createRole(role: CreateRoleData): Promise<Role>
  
  // 分配角色
  static async assignRole(userId: string, roleId: string): Promise<void>
  
  // 移除角色
  static async removeRole(userId: string, roleId: string): Promise<void>
  
  // 获取角色权限
  static async getRolePermissions(roleId: string): Promise<Permission[]>
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  isSystemRole: boolean
}
```

## 🔑 会话管理

### SessionManager
```typescript
export class SessionManager {
  // 创建会话
  static async createSession(userId: string, metadata?: any): Promise<Session>
  
  // 验证会话
  static async validateSession(sessionId: string): Promise<Session | null>
  
  // 刷新会话
  static async refreshSession(sessionId: string): Promise<Session>
  
  // 销毁会话
  static async destroySession(sessionId: string): Promise<void>
}

export interface Session {
  id: string
  userId: string
  createdAt: Date
  expiresAt: Date
  metadata?: any
}
```

## 🔌 认证提供商

### OAuth提供商
```typescript
export class OAuthProvider {
  // 获取授权URL
  static getAuthorizationUrl(provider: string, redirectUri: string): string
  
  // 处理回调
  static async handleCallback(code: string, state: string): Promise<AuthResult>
  
  // 获取用户信息
  static async getUserInfo(accessToken: string): Promise<UserProfile>
}
```

### SAML提供商
```typescript
export class SAMLProvider {
  // 生成SAML请求
  static generateSAMLRequest(relayState?: string): string
  
  // 验证SAML响应
  static async validateSAMLResponse(response: string): Promise<AuthResult>
}
```

## 🏗️ 基础类型

```typescript
export interface User {
  id: string
  email: string
  name: string
  roles: Role[]
  permissions: Permission[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  conditions?: PermissionCondition[]
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}
```