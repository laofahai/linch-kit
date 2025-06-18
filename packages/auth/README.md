# @linch-kit/auth

🔐 **现代化的认证和权限管理库**，提供统一的配置、类型安全的权限检查和丰富的 React 组件。

## ✨ 特性

- 🎯 **统一配置**：`createAuthConfig()` 函数统一管理所有认证配置
- 🔐 **多提供者支持**：Google、GitHub、凭据认证、共享令牌等
- 🛡️ **权限系统**：基于角色和资源的权限管理
- ⚛️ **React 集成**：完整的 Hooks 和组件套件
- 🔧 **类型安全**：完整的 TypeScript 支持
- 🎨 **声明式组件**：权限守卫、用户信息等组件
- 🔄 **向后兼容**：与现有 NextAuth.js 项目兼容

## 📦 安装

```bash
npm install @linch-kit/auth next-auth
# 或
yarn add @linch-kit/auth next-auth
# 或
pnpm add @linch-kit/auth next-auth
```

## 🚀 快速开始

### 1. 创建认证配置

```typescript
// auth.config.ts
import { 
  createAuthConfig, 
  googleProvider, 
  credentialsProvider,
  roleBasedPermissionCheck 
} from '@linch-kit/auth'

export const authConfig = createAuthConfig({
  providers: [
    googleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    credentialsProvider({
      authorize: async (credentials) => {
        // 自定义认证逻辑
        const user = await authenticateUser(credentials.email, credentials.password)
        return user
      }
    })
  ],
  permissions: {
    defaultRole: 'user',
    checkPermission: roleBasedPermissionCheck,
    roles: [
      {
        id: 'user',
        name: 'User',
        permissions: [
          { resource: 'profile', action: 'read' },
          { resource: 'profile', action: 'update' }
        ]
      },
      {
        id: 'admin',
        name: 'Administrator',
        permissions: [{ resource: '*', action: '*' }]
      }
    ]
  }
})
```

### 2. 在组件中使用

```typescript
import { 
  useAuth, 
  usePermissions, 
  PermissionGuard, 
  UserInfo 
} from '@linch-kit/auth'

function MyComponent() {
  const { user, signIn, signOut } = useAuth()
  const { hasPermission } = usePermissions()

  return (
    <div>
      {user ? (
        <div>
          <UserInfo user={user} showRoles />
          <button onClick={() => signOut()}>Sign Out</button>
          
          <PermissionGuard resource="posts" action="create">
            <button>Create Post</button>
          </PermissionGuard>
          
          {hasPermission('posts', 'delete') && (
            <button>Delete Posts</button>
          )}
        </div>
      ) : (
        <div>
          <button onClick={() => signIn('google')}>Sign in with Google</button>
          <button onClick={() => signIn('credentials')}>Sign in with Email</button>
        </div>
      )}
    </div>
  )
}
```

### 3. 权限检查

```typescript
import { useResourcePermissions, useRole } from '@linch-kit/auth'

function PostActions({ post }) {
  const { canRead, canCreate, canUpdate, canDelete } = useResourcePermissions('posts')
  const { isAdmin, hasRole } = useRole()

  return (
    <div>
      {canRead && <button>View</button>}
      {canCreate && <button>Create</button>}
      {canUpdate && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
      
      {isAdmin && <button>Admin Actions</button>}
      {hasRole('moderator') && <button>Moderate</button>}
    </div>
  )
}
```

## 🔐 认证提供者

### Google OAuth

```typescript
import { googleProvider } from '@linch-kit/auth'

const config = createAuthConfig({
  providers: [
    googleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scope: 'openid email profile'  // 可选
    })
  ]
})
```

### GitHub OAuth

```typescript
import { githubProvider } from '@linch-kit/auth'

const config = createAuthConfig({
  providers: [
    githubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })
  ]
})
```

### 凭据认证

```typescript
import { credentialsProvider } from '@linch-kit/auth'

const config = createAuthConfig({
  providers: [
    credentialsProvider({
      authorize: async (credentials) => {
        const user = await validateCredentials(credentials.email, credentials.password)
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
            permissions: user.permissions
          }
        }
        return null
      },
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      }
    })
  ]
})
```

### 共享令牌

```typescript
import { sharedTokenProvider } from '@linch-kit/auth'

const config = createAuthConfig({
  providers: [
    sharedTokenProvider({
      token: process.env.SHARED_TOKEN!,
      apiUrl: process.env.API_URL!,
      userEndpoint: '/api/user'  // 可选
    })
  ]
})
```

## 🛡️ 权限系统

### 基于角色的权限

```typescript
import { roleBasedPermissionCheck } from '@linch-kit/auth'

const config = createAuthConfig({
  permissions: {
    checkPermission: roleBasedPermissionCheck,
    roles: [
      {
        id: 'user',
        name: 'User',
        permissions: [
          { resource: 'profile', action: 'read' },
          { resource: 'profile', action: 'update' }
        ]
      },
      {
        id: 'moderator',
        name: 'Moderator',
        permissions: [
          { resource: 'posts', action: 'read' },
          { resource: 'posts', action: 'update' },
          { resource: 'comments', action: 'moderate' }
        ]
      },
      {
        id: 'admin',
        name: 'Administrator',
        permissions: [{ resource: '*', action: '*' }]
      }
    ]
  }
})
```

### 自定义权限检查

```typescript
import { PermissionCheck } from '@linch-kit/auth'

const customPermissionCheck: PermissionCheck = (user, resource, action, context) => {
  // 自定义权限逻辑
  if (resource === 'posts' && action === 'delete') {
    // 只有作者或管理员可以删除文章
    return user.id === context?.authorId || user.roles?.includes('admin')
  }
  
  // 其他权限检查...
  return false
}

const config = createAuthConfig({
  permissions: {
    checkPermission: customPermissionCheck
  }
})
```

## ⚛️ React Hooks

### useAuth

```typescript
const { user, session, status, signIn, signOut, update } = useAuth()
```

### usePermissions

```typescript
const { hasPermission, hasRole, permissions, roles } = usePermissions()
```

### useRole

```typescript
const { hasRole, hasAnyRole, hasAllRoles, isAdmin, isModerator } = useRole()
```

### useResourcePermissions

```typescript
const { canRead, canCreate, canUpdate, canDelete, canManage } = useResourcePermissions('posts')
```

### useAuthActions

```typescript
const { 
  signIn, 
  signOut, 
  signInWithGoogle, 
  signInWithGitHub,
  signInWithCredentials 
} = useAuthActions()
```

## 🎨 React 组件

### 权限守卫

```typescript
<PermissionGuard resource="posts" action="create" fallback={<div>No permission</div>}>
  <CreatePostButton />
</PermissionGuard>

<RoleGuard role="admin" fallback={<div>Admin only</div>}>
  <AdminPanel />
</RoleGuard>

<AuthGuard fallback={<LoginForm />}>
  <Dashboard />
</AuthGuard>
```

### 用户信息

```typescript
<UserInfo 
  user={user} 
  showEmail 
  showRoles 
  showProvider 
/>

<UserAvatar 
  user={user} 
  size="lg" 
  fallback={<DefaultAvatar />} 
/>
```

### 登录/登出按钮

```typescript
<SignInButton provider="google">
  Sign in with Google
</SignInButton>

<SignOutButton onSignOut={() => console.log('Signed out')}>
  Sign Out
</SignOutButton>
```

## 🔧 高阶组件

```typescript
import { withPermission, withRole, withAuth } from '@linch-kit/auth'

const AdminPanel = withRole(
  () => <div>Admin Panel</div>,
  'admin'
)

const CreatePostButton = withPermission(
  () => <button>Create Post</button>,
  'posts',
  'create'
)

const ProtectedComponent = withAuth(
  () => <div>Protected Content</div>
)
```

## 🔄 迁移指南

### 从 NextAuth.js 迁移

```typescript
// ❌ 旧写法
import { useSession, signIn, signOut } from 'next-auth/react'

const { data: session } = useSession()
const user = session?.user

// ✅ 新写法
import { useAuth } from '@linch-kit/auth'

const { user, session, signIn, signOut } = useAuth()
```

### 权限检查迁移

```typescript
// ❌ 旧写法
const hasPermission = user?.permissions?.includes('posts:create')

// ✅ 新写法
const { hasPermission } = usePermissions()
const canCreate = hasPermission('posts', 'create')
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
