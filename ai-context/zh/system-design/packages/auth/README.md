# @linch-kit/auth

> **认证权限包** | **P1优先级** | **依赖**: core, schema

## 🎯 包概览

@linch-kit/auth 提供企业级的认证和权限管理功能，支持多提供商认证、RBAC/ABAC权限控制、会话管理等。

### 核心功能
- **多提供商认证**: 支持credentials、OAuth、SAML等
- **权限控制**: RBAC(角色权限)和ABAC(属性权限)
- **会话管理**: JWT、Session、单点登录
- **安全特性**: 密码策略、多因子认证、审计日志
- **权限继承**: 复杂的权限继承和委托机制

### 技术特色
- 类型安全的权限检查
- 插件化的认证提供商
- 细粒度的权限控制
- 企业级安全特性

## 📁 文档导航

| 文档 | 描述 |
|------|------|
| [API参考](./api-reference.md) | 认证和权限API |
| [实现指南](./implementation-guide.md) | 内部架构设计 |
| [集成示例](./integration-examples.md) | 使用示例和最佳实践 |
| [高级特性](./advanced-features.md) | 企业级安全特性 |

## 🚀 快速开始

```typescript
import { AuthManager, PermissionChecker } from '@linch-kit/auth'

// 认证用户
const result = await AuthManager.authenticate({
  provider: 'credentials',
  email: 'user@example.com',
  password: 'password'
})

// 权限检查
const hasPermission = await PermissionChecker.check(
  user, 
  'user:read', 
  { tenantId: 'tenant-123' }
)
```