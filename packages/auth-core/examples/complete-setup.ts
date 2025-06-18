/**
 * 完整的 Auth Core 设置示例
 * 
 * 展示如何配置一个完整的企业级认证系统
 */

import { z } from 'zod'
import {
  createAuthConfig,
  defineEntity,
  defineField,
  sharedTokenProvider,
  oauthProviders,
  createCredentialsProvider,
  createPermissionChecker,
  createHierarchicalPermissionChecker,
  type AuthCoreConfig,
  type AuthUser
} from '@linch-kit/auth-core'

// === 1. 自定义用户实体 ===

const CustomUser = defineEntity('User', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  // 基础信息
  email: defineField(z.string().email().optional(), {
    unique: true,
    label: 'Email'
  }),
  
  phone: defineField(z.string().optional(), {
    unique: true,
    label: 'Phone'
  }),
  
  username: defineField(z.string().optional(), {
    unique: true,
    label: 'Username'
  }),
  
  name: defineField(z.string(), {
    label: 'Display Name'
  }),
  
  avatar: defineField(z.string().url().optional(), {
    label: 'Avatar'
  }),
  
  // 企业信息
  employeeId: defineField(z.string().optional(), {
    unique: true,
    label: 'Employee ID'
  }),
  
  department: defineField(z.string().optional(), {
    label: 'Department'
  }),
  
  position: defineField(z.string().optional(), {
    label: 'Position'
  }),
  
  manager: defineField(z.string().optional(), {
    label: 'Manager ID'
  }),
  
  // 权限和角色
  roles: defineField(z.array(z.string()).optional(), {
    label: 'Roles',
    db: { type: 'JSON' }
  }),
  
  permissions: defineField(z.array(z.string()).optional(), {
    label: 'Permissions',
    db: { type: 'JSON' }
  }),
  
  // 状态
  status: defineField(z.enum(['active', 'inactive', 'suspended']), {
    default: 'active',
    label: 'Status'
  }),
  
  // 多租户
  tenantId: defineField(z.string().optional(), {
    label: 'Tenant ID'
  }),
  
  // 扩展数据
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'Metadata',
    db: { type: 'JSON' }
  }),
  
  // 时间戳
  lastLoginAt: defineField(z.date().optional(), {
    label: 'Last Login'
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'Created At'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'Updated At'
  })
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['phone'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['employeeId'], unique: true },
    { fields: ['department'] },
    { fields: ['manager'] },
    { fields: ['tenantId'] },
    { fields: ['status'] }
  ]
})

// === 2. 自定义权限检查器 ===

const customPermissionChecker = createPermissionChecker({
  async hasPermission(userId, resource, action, context) {
    // 实现自定义权限检查逻辑
    const user = await getUserById(userId)
    
    if (!user || user.status !== 'active') {
      return false
    }
    
    // 检查用户角色
    if (user.roles?.includes('admin')) {
      return true
    }
    
    // 检查具体权限
    const permission = `${resource}:${action}`
    return user.permissions?.includes(permission) || false
  },
  
  async hasRole(userId, role, context) {
    const user = await getUserById(userId)
    
    if (!user || user.status !== 'active') {
      return false
    }
    
    if (Array.isArray(role)) {
      return role.some(r => user.roles?.includes(r))
    }
    
    return user.roles?.includes(role) || false
  },
  
  async getUserPermissions(userId, tenantId) {
    const user = await getUserById(userId)
    
    if (!user) {
      return {}
    }
    
    // 根据角色和权限构建权限映射
    const permissions: Record<string, Record<string, boolean>> = {}
    
    user.permissions?.forEach(permission => {
      const [resource, action] = permission.split(':')
      if (!permissions[resource]) {
        permissions[resource] = {}
      }
      permissions[resource][action] = true
    })
    
    return permissions
  },
  
  async getUserRoles(userId, tenantId) {
    const user = await getUserById(userId)
    return user?.roles || []
  }
})

// === 3. 层级权限检查器 ===

const hierarchicalPermissionChecker = createHierarchicalPermissionChecker({
  enabled: true,
  superiorCanViewSubordinate: true,
  superiorCanManageSubordinate: true,
  departmentManagerPermissions: ['department:manage', 'users:view', 'users:update']
}, {
  async isSuperior(userId, targetUserId) {
    const user = await getUserById(userId)
    const targetUser = await getUserById(targetUserId)
    
    if (!user || !targetUser) {
      return false
    }
    
    // 检查是否为直接上级
    if (targetUser.manager === userId) {
      return true
    }
    
    // 检查是否为部门负责人
    if (user.department === targetUser.department && 
        user.roles?.includes('department-manager')) {
      return true
    }
    
    return false
  },
  
  async getAccessibleSubordinates(userId) {
    const user = await getUserById(userId)
    
    if (!user) {
      return []
    }
    
    // 获取直接下属
    const directReports = await getUsersByManager(userId)
    
    // 如果是部门负责人，获取部门所有成员
    if (user.roles?.includes('department-manager') && user.department) {
      const departmentUsers = await getUsersByDepartment(user.department)
      return [...new Set([...directReports, ...departmentUsers])]
    }
    
    return directReports
  }
})

// === 4. 完整的认证配置 ===

const authConfig: AuthCoreConfig = {
  // 使用自定义用户实体
  userEntity: CustomUser,
  
  // 认证提供者
  providers: [
    // 共享令牌认证（保留现有功能）
    sharedTokenProvider,
    
    // OAuth 认证
    oauthProviders.google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    
    oauthProviders.github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    }),
    
    // 邮箱密码认证
    createCredentialsProvider({
      id: 'email-password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        const { email, password } = credentials
        
        // 验证用户凭据
        const user = await validateUserCredentials(email, password)
        
        if (!user) {
          throw new Error('Invalid credentials')
        }
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar
        }
      }
    })
  ],
  
  // 会话配置
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60     // 24 hours
  },
  
  // 权限配置
  permissions: {
    strategy: 'rbac',
    checkPermission: customPermissionChecker.hasPermission,
    checkRole: customPermissionChecker.hasRole
  },
  
  // 多租户配置
  multiTenant: {
    enabled: true,
    tenantResolver: async (request) => {
      // 从子域名提取租户信息
      const host = request.headers?.host || ''
      const subdomain = host.split('.')[0]
      
      if (subdomain && subdomain !== 'www') {
        return subdomain
      }
      
      // 从请求头提取
      return request.headers?.['x-tenant-id'] || 'default'
    },
    tenantField: 'tenantId'
  },
  
  // 回调函数
  callbacks: {
    async signIn(user, account, profile) {
      // 登录时的自定义逻辑
      console.log(`User ${user.id} signed in with ${account?.provider}`)
      
      // 更新最后登录时间
      await updateUserLastLogin(user.id)
      
      return true
    },
    
    async session(session, user) {
      // 会话回调，添加自定义数据
      const fullUser = await getUserById(user.id)
      
      if (fullUser) {
        session.user = {
          ...session.user,
          roles: fullUser.roles,
          permissions: fullUser.permissions,
          department: fullUser.department,
          tenantId: fullUser.tenantId
        }
      }
      
      return session
    },
    
    async jwt(token, user) {
      // JWT 回调
      if (user) {
        token.userId = user.id
        token.roles = (user as any).roles
        token.tenantId = (user as any).tenantId
      }
      
      return token
    }
  },
  
  // 页面配置
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  },
  
  // 调试模式
  debug: process.env.NODE_ENV === 'development'
}

// === 5. 辅助函数（需要用户实现） ===

async function getUserById(id: string): Promise<AuthUser | null> {
  // 实现从数据库获取用户的逻辑
  return null
}

async function validateUserCredentials(email: string, password: string): Promise<AuthUser | null> {
  // 实现验证用户凭据的逻辑
  return null
}

async function updateUserLastLogin(userId: string): Promise<void> {
  // 实现更新用户最后登录时间的逻辑
}

async function getUsersByManager(managerId: string): Promise<string[]> {
  // 实现获取下属用户的逻辑
  return []
}

async function getUsersByDepartment(department: string): Promise<string[]> {
  // 实现获取部门用户的逻辑
  return []
}

// === 6. 导出配置 ===

export default authConfig

// 也可以导出 NextAuth 配置
export const nextAuthConfig = createAuthConfig(authConfig)
