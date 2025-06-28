# LinchKit "自建vs依赖" 决策矩阵

**更新**: 2025-06-28  
**类型**: 核心开发约束

---

## 🎯 核心原则

1. **不重复造轮子** - 优先使用成熟的第三方库
2. **企业级标准** - 选择经过生产验证的解决方案
3. **AI友好** - 选择AI容易理解和处理的技术栈
4. **类型安全** - 100% TypeScript支持

---

## 🔴 必须依赖第三方库 (禁止自建)

| 功能类别 | 推荐库 | 禁止自建原因 |
|---------|--------|-------------|
| **认证系统** | NextAuth.js | 安全漏洞风险极高 |
| **ORM/数据库** | Prisma | 复杂度极高，维护成本巨大 |
| **日志系统** | Pino | 性能优化复杂 |
| **加密/哈希** | Node.js crypto | 安全实现风险 |
| **JSON Schema** | Zod | 类型系统复杂性 |
| **国际化基础** | i18next | 本地化复杂性 |

## 🟡 混合策略 (基础依赖+企业扩展)

| 功能类别 | 基础库 | 自建扩展 |
|---------|--------|---------|
| **配置管理** | Convict | 多租户、热更新 |
| **可观测性** | OpenTelemetry | 业务指标、告警 |
| **缓存系统** | LRU-cache/Redis | 分布式、策略 |
| **事件系统** | EventEmitter3 | 类型安全、中间件 |

## 🟢 必须自建 (核心差异化功能)

| 功能类别 | 自建原因 |
|---------|---------|
| **插件系统** | LinchKit核心架构 |
| **Schema DSL** | 领域特定语言 |
| **代码生成器** | Schema驱动核心 |
| **权限引擎** | 企业级RBAC/ABAC |

## 🚫 严格禁止的重复造轮子

### 数据库相关
- ❌ **查询构建器** - 使用Prisma
- ❌ **连接池** - 使用Prisma内置
- ❌ **迁移系统** - 使用Prisma Migrate

### 安全相关
- ❌ **密码哈希** - 使用bcrypt/argon2
- ❌ **JWT处理** - 使用jose/jsonwebtoken
- ❌ **加密解密** - 使用Node.js crypto

### 工具相关
- ❌ **时间处理** - 使用date-fns
- ❌ **UUID生成** - 使用uuid库
- ❌ **文件系统操作** - 使用fs-extra

---

## ✅ LinchKit 内部包强制使用规则

**所有 LinchKit 包开发必须优先使用内部包功能，禁止重复实现：**

- **日志**: 必须使用 `@linch-kit/core` 的 logger
- **国际化**: 必须使用 `@linch-kit/core` 的 i18n  
- **配置**: 必须使用 `@linch-kit/core` 的 config
- **插件**: 必须使用 `@linch-kit/core` 的 plugin
- **Schema**: 必须使用 `@linch-kit/schema` 的 defineEntity/defineField
- **权限**: 必须使用 `@linch-kit/auth` 的权限系统
- **CRUD**: 必须使用 `@linch-kit/crud` 的数据操作