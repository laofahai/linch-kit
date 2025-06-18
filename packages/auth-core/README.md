# @linch-kit/auth-core

🔐 **Modular authentication and authorization system for Linch Kit** - Enterprise-grade, plugin-based, and fully extensible.

## 🔄 重构说明 (v0.1.0)

**重大架构更新**：
- ✅ **统一 CLI 系统**：CLI 命令现在通过 `@linch-kit/core` 的插件系统提供
- ✅ **统一配置管理**：配置现在通过 `@linch-kit/core` 的配置系统管理
- ✅ **模块化权限系统**：全新的运行时模块化权限管理
- ✅ **插件化架构**：支持通过插件扩展功能
- ✅ **遵循"少重复造轮子"原则**：基于 NextAuth.js、Prisma 等成熟方案

## ✨ 核心特性

- 🎯 **模块化权限**：支持业务模块独立定义和管理权限
- 🔧 **类型安全**：完整的 TypeScript 支持和 Zod 验证
- 🏗️ **无缝集成**：与 @linch-kit/schema、@linch-kit/trpc 深度集成
- 🔐 **企业级权限**：RBAC、ABAC、层级权限、多租户支持
- 🌐 **国际化支持**：内置多语言消息
- 📦 **最小化实体**：只需要 `id` 和 `name`，完全可定制
- 🔄 **向后兼容**：保留现有功能
- ⚡ **开发工具**：代码生成和配置管理工具

## 🚀 快速开始

### 安装

```bash
npm install @linch-kit/auth-core @linch-kit/core
# or
pnpm add @linch-kit/auth-core @linch-kit/core
```

### 初始化配置

```bash
# 使用统一的 CLI 系统
npx linch auth:init

# 或指定配置文件类型
npx linch auth:init --type ts --force
```

这会创建一个 `auth.config.ts` 文件。

### 基础使用

```typescript
// auth.config.ts
import type { AuthConfig } from '@linch-kit/auth-core'

const authConfig: AuthConfig = {
  providers: [
    {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      options: {
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }
    }
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  permissions: {
    strategy: 'rbac',
    hierarchical: false,
  }
}

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
@linch-kit/auth-core     # Core logic (this package)
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
} from '@linch-kit/auth-core'

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
import { setTranslateFunction, authT } from '@linch-kit/auth-core'

// Integrate with your i18n library
setTranslateFunction(t) // vue-i18n or react-i18next

// Use built-in messages
const signInText = authT('signIn.title') // "Sign In" or "登录"
```

## 🛠️ CLI Tools

### Generate Auth Entities

```bash
# Basic setup
npx @linch-kit/auth-core generate:auth --kit=standard

# Enterprise with departments
npx @linch-kit/auth-core generate:auth --kit=enterprise --departments

# Use presets
npx @linch-kit/auth-core generate:auth --preset=saas
```

### Generate Permission System

```bash
# RBAC with hierarchical permissions
npx @linch-kit/auth-core generate:permissions --strategy=rbac --hierarchical

# Multi-tenant ABAC
npx @linch-kit/auth-core generate:permissions --strategy=abac --multi-tenant
```

### Validate Configuration

```bash
npx @linch-kit/auth-core validate
npx @linch-kit/auth-core info
```

## 📚 Examples

- [Complete Setup](./examples/complete-setup.ts) - Full enterprise configuration

## 🔄 Migration from @linch-kit/auth

The package preserves all existing functionality:

```typescript
// ✅ Still works exactly the same
import { sharedTokenProvider } from '@linch-kit/auth-core'

// ✅ Enhanced with new features
const authConfig = createAuthConfig({
  providers: [sharedTokenProvider],
  // + new features: permissions, multi-tenant, etc.
})
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
