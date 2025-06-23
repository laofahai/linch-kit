# @linch-kit/auth

🔐 **企业级认证和权限管理系统** - 模块化、类型安全、完全可扩展的认证解决方案。

## ✨ 核心特性

- 🎯 **模块化权限**：支持业务模块独立定义和管理权限
- 🔧 **类型安全**：完整的 TypeScript 支持和 Zod 验证
- 🏗️ **无缝集成**：与 @linch-kit/schema、@linch-kit/trpc 深度集成
- 🔐 **企业级权限**：RBAC、ABAC、层级权限、多租户支持
- 🌐 **国际化支持**：内置多语言消息
- 📦 **最小化实体**：只需要 `id` 和 `name`，完全可定制
- ⚡ **开发工具**：代码生成和配置管理工具
- 🔌 **插件化架构**：通过 @linch-kit/core 的插件系统扩展功能

## 📦 安装

```bash
pnpm add @linch-kit/auth @linch-kit/core
# 或
npm install @linch-kit/auth @linch-kit/core
```

## 🚀 快速开始

### 初始化配置

```bash
# 使用统一的 CLI 系统
npx linch auth:init

# 或指定配置文件类型
npx linch auth:init --type ts --force
```

### 基础使用

```typescript
import { createAuthConfig } from '@linch-kit/auth'
import type { AuthCoreConfig } from '@linch-kit/auth'

// 创建认证配置
const authConfig = createAuthConfig({
  providers: [
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 实现您的认证逻辑
        return { id: '1', email: credentials?.email }
      }
    }
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
})

export default authConfig
```

### With NextAuth

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'
import authConfig from '../../../auth.config'

export default NextAuth(authConfig)
```

## 🏗️ Architecture

### Core Principles

1. **UI Agnostic**: Core logic separated from UI components
2. **Minimal Entity**: User only needs `id` and `name`, everything else customizable
3. **Complete System**: Permissions, multi-tenant, i18n all built-in
4. **Extensible**: Easy to customize and extend

### Package Structure

```
@linch-kit/auth          # Core logic (this package)
@linch-kit/auth-ui-vue   # Vue UI components (separate)
@linch-kit/auth-ui-react # React UI components (separate)
```

## 📊 User Entity Design

### Minimal Approach

```typescript
// Only id and name required, everything else optional
interface AuthUser {
  id: string
  name?: string        // Display name
  email?: string       // Optional (common in China to use phone/username)
  [key: string]: any   // Completely customizable
}
```

### Entity Templates

Choose from pre-built templates or create your own:

```typescript
import { 
  MinimalUserTemplate,    // Just id + name
  BasicUserTemplate,      // + email, phone, username
  EnterpriseUserTemplate, // + roles, department, permissions
  MultiTenantUserTemplate // + tenant support
} from '@linch-kit/auth'

// Or create completely custom
const MyUser = defineEntity('User', {
  id: defineField(z.string().uuid(), { primary: true }),
  name: defineField(z.string()),
  phone: defineField(z.string(), { unique: true }), // China-friendly
  wechatId: defineField(z.string().optional()),
  department: defineField(z.string()),
  // ... any fields you need
})
```

## 🔐 Advanced Permissions

### Hierarchical Permissions (Department Support)

```typescript
const authConfig = createAuthConfig({
  permissions: {
    strategy: 'rbac',
    hierarchical: {
      enabled: true,
      superiorCanViewSubordinate: true,  // 上级看下级
      superiorCanManageSubordinate: true, // 上级管理下级
    }
  }
})
```

### Multi-tenant Support

```typescript
const authConfig = createAuthConfig({
  multiTenant: {
    enabled: true,
    tenantResolver: async (request) => {
      // Extract from subdomain, header, etc.
      return request.headers['x-tenant-id']
    }
  }
})
```

## 🌐 Built-in i18n

```typescript
import { setTranslateFunction, authT } from '@linch-kit/auth'

// Integrate with your i18n library
setTranslateFunction(t) // vue-i18n or react-i18next

// Use built-in messages
const signInText = authT('signIn.title') // "Sign In" or "登录"
```

## 🛠️ CLI Tools

### Generate Auth Entities

```bash
# Basic setup
npx @linch-kit/auth generate:auth --kit=standard

# Enterprise with departments
npx @linch-kit/auth generate:auth --kit=enterprise --departments

# Use presets
npx @linch-kit/auth generate:auth --preset=saas
```

### 权限系统生成

```bash
# RBAC with hierarchical permissions
npx linch auth:generate:permissions --strategy=rbac --hierarchical

# Multi-tenant ABAC
npx linch auth:generate:permissions --strategy=abac --multi-tenant
```

### 配置验证

```bash
npx linch auth:validate
npx linch auth:info
```

## 📚 使用示例

### 完整企业级配置

```typescript
import { createAuthConfig } from '@linch-kit/auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

const authConfig = createAuthConfig({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 实现您的认证逻辑
        const user = await validateUser(credentials)
        return user ? { id: user.id, email: user.email } : null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn(user, account, profile) {
      // 自定义登录逻辑
      return true
    },
    async session(session, user) {
      // 自定义会话逻辑
      return session
    }
  }
})
```

## 🔄 变更日志

### v0.1.0 (2025-06-21)
- ✅ 重构为统一的认证系统
- ✅ 集成@linch-kit/core插件系统
- ✅ 添加模块化权限管理
- ✅ 支持企业级权限控制
- ✅ 完整的TypeScript支持
- ✅ 统一CLI命令系统

## 📚 API 文档

### 核心函数

#### `createAuthConfig(config: AuthCoreConfig): NextAuthOptions`
创建完整的认证配置，返回NextAuth.js兼容的配置对象。

#### `createSimpleAuthConfig(providers: any[]): NextAuthOptions`
创建简单的认证配置，用于快速开始。

#### `createPermissionRegistry(): PermissionRegistry`
创建权限注册表，用于模块化权限管理。

#### `createModularPermissionChecker(registry: PermissionRegistry): ModularPermissionChecker`
创建模块化权限检查器。

### 权限管理

```typescript
import { createPermissionRegistry, createModularPermissionChecker } from '@linch-kit/auth'

// 创建权限注册表
const registry = createPermissionRegistry()

// 注册模块权限
registry.registerModule('user', {
  permissions: ['read', 'write', 'delete'],
  resources: ['profile', 'settings']
})

// 创建权限检查器
const checker = createModularPermissionChecker(registry)

// 检查权限
const hasPermission = await checker.hasModulePermission(
  'user123',
  'user',
  'profile',
  'read'
)
```
```

## 🏢 Enterprise Features

- **Department Hierarchy**: Superior-subordinate permissions
- **Multi-tenant**: Complete tenant isolation
- **Advanced RBAC**: Role inheritance, conditional permissions
- **Audit Logging**: Track all auth operations
- **Session Management**: Advanced session control
- **Custom Providers**: Easy to add new auth methods

## 🎯 Roadmap

- [ ] **auth-ui-vue**: Vue.js UI components
- [ ] **auth-ui-react**: React UI components  
- [ ] **Advanced Analytics**: Auth metrics and insights
- [ ] **SSO Integration**: SAML, OIDC providers
- [ ] **Passwordless**: Magic links, WebAuthn

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
