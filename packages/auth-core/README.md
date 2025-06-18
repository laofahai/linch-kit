# @linch-kit/auth-core

🔐 **Core authentication and authorization logic for Linch Kit** - UI agnostic, complete, and extensible.

## ✨ Features

- 🎯 **Complete & Extensible**: Full-featured auth system with customizable components
- 🌍 **UI Agnostic**: Core logic only, UI packages separate (auth-ui-vue, auth-ui-react)
- 🔧 **Type Safe**: Complete TypeScript support with Zod validation
- 🏗️ **Schema Integration**: Works seamlessly with @linch-kit/schema
- 🔐 **Advanced Permissions**: RBAC, ABAC, hierarchical (department) permissions
- 🏢 **Multi-tenant Ready**: Built-in multi-tenant support
- 🌐 **i18n Built-in**: Internationalization messages included
- 📦 **Minimal User Entity**: Only requires `id` and `name`, fully customizable
- 🔄 **Backward Compatible**: Preserves existing shared-token functionality
- ⚡ **CLI Tools**: Code generation and configuration management

## 🚀 Quick Start

### Installation

```bash
npm install @linch-kit/auth-core
# or
pnpm add @linch-kit/auth-core
```

### Initialize Configuration

```bash
npx @linch-kit/auth-core init
```

This creates an `auth.config.ts` file with basic setup.

### Basic Usage

```typescript
import { createAuthConfig, BasicUserTemplate, sharedTokenProvider } from '@linch-kit/auth-core'

const authConfig = createAuthConfig({
  userEntity: BasicUserTemplate, // Optional: use template or custom
  providers: [
    sharedTokenProvider, // Preserves existing functionality
  ],
  session: { strategy: 'jwt' }
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
