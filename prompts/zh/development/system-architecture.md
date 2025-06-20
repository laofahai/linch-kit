# Linch Kit 系统架构设计提示词

## 目的

指导 AI 助手进行 Linch Kit 系统的架构设计和优化，确保系统的可扩展性、可维护性和 AI 友好性。

## 上下文

**参考文档**: `ai-context/zh/architecture/system-architecture.md`

Linch Kit 是一个 AI-First 的企业级快速开发框架，采用 Monorepo 架构，包含以下核心组件：

### 核心包层次结构
```
@linch-kit/types (基础类型)
    ↓
@linch-kit/core (CLI + 配置 + 工具)
    ↓
@linch-kit/schema (数据模式系统) ✅ 已发布
    ↓
@linch-kit/auth-core (认证和权限)
    ↓
@linch-kit/crud (CRUD 操作核心)
    ↓
@linch-kit/trpc (API 层集成)
    ↓
@linch-kit/ui (基础 UI 组件)
    ↓
@linch-kit/crud-ui (CRUD UI 组件)
@linch-kit/auth-ui (认证 UI 组件)
```

## 架构原则

### 1. AI-First 设计 ⭐ **核心原则**

**参考**: `ai-context/zh/templates/ai-first-practices.md`

- 所有代码都应该易于 AI 理解和生成
- 使用清晰的命名约定和注释
- 提供丰富的元数据和类型信息
- 支持自动化代码生成和验证
- 完整的 TypeScript 类型定义

### 2. 不重复造轮子 ⭐ **最高优先级**

**参考**: `ai-context/zh/decisions/technology-choices.md`

- 优先使用现有成熟方案，避免重新发明轮子
- 充分调研现有方案，在选择技术栈前充分调研生态系统
- 优先集成而非自研，通过适配器模式集成现有优秀工具
- 谨慎评估自研需求，只有在现有方案无法满足需求时才考虑自研

**示例决策**:
- ✅ 使用 Prisma 事务系统而非自研 TransactionManager
- ✅ 使用 NextAuth.js 而非自研认证系统
- ✅ 使用 shadcn/ui 而非完全自研 UI 组件库
- ✅ 使用 cls-hooked 实现跨模块事务传播

### 3. Schema 驱动开发

**参考**: `ai-context/zh/packages/schema.md`

- 以 Zod Schema 为单一数据源
- 自动生成 Prisma Schema、验证器、Mock 数据
- 支持模块化 Schema 合并
- 类型安全的端到端开发

### 4. 模块化架构

**参考**: `ai-context/zh/architecture/plugin-system-design.md`

- 每个包都有明确的职责边界
- 基于 Odoo 理念的运行时插件系统
- 支持热插拔和动态加载
- 最小化包之间的耦合

## 系统设计模式

### 1. 插件架构

**参考**: `ai-context/zh/architecture/plugin-system-design.md`

```typescript
interface Plugin {
  name: string
  version: string
  type: 'module' | 'plugin'  // 区分应用模块和功能插件
  dependencies?: string[]     // 依赖的其他模块/插件
  extends?: string[]         // 扩展的模块（仅插件使用）
  
  // 生命周期钩子
  install?(context: PluginContext): Promise<void>
  activate?(context: PluginContext): Promise<void>
  deactivate?(context: PluginContext): Promise<void>
  uninstall?(context: PluginContext): Promise<void>
  
  // 提供的功能
  provides?: {
    models?: ModelDefinition[]      // 数据模型
    views?: ViewDefinition[]        // UI 视图
    apis?: APIDefinition[]          // API 接口
    permissions?: PermissionDefinition[] // 权限定义
  }
}
```

### 2. CLI 系统架构

**参考**: `ai-context/zh/packages/core.md`

```typescript
interface CommandMetadata {
  name: string
  description: string
  handler: (context: CLIContext) => Promise<void>
  options?: CommandOption[]
  arguments?: CommandArgument[]
  examples?: string[]
  category?: string
}

// 统一的 CLI 系统
const cli = createCLI({
  name: 'linch-kit',
  version: '1.0.0',
  description: 'Linch Kit CLI'
})
```

### 3. 配置管理

**参考**: `ai-context/zh/reference/configuration.md`

```typescript
// linch-kit.config.ts
export default defineConfig({
  project: {
    name: 'my-app',
    version: '1.0.0'
  },
  database: {
    url: process.env.DATABASE_URL
  },
  schema: {
    schemaDir: './app/_lib/schemas',
    outputDir: './generated'
  },
  auth: {
    providers: ['credentials', 'google']
  }
})
```

## 技术栈决策

**参考**: `ai-context/zh/decisions/technology-choices.md`

### 前端技术栈
- **Next.js 14 (App Router)**: 全栈框架，优秀的开发体验
- **React 18**: 最成熟的前端框架
- **TypeScript**: 类型安全，减少运行时错误
- **Tailwind CSS**: 原子化 CSS，开发效率高
- **shadcn/ui**: 基于 Radix UI，可定制性强

### 后端技术栈
- **Prisma ORM**: 类型安全的数据库访问
- **PostgreSQL**: 功能强大，企业级应用首选
- **NextAuth.js**: Next.js 官方推荐的认证方案
- **tRPC**: 类型安全的 API 层

### 开发工具链
- **Turborepo**: 高性能的 Monorepo 工具
- **pnpm**: 磁盘空间效率高，安装速度快
- **Zod**: TypeScript 原生支持的验证库

## 架构决策记录

**参考**: `ai-context/zh/decisions/architecture-decisions.md`

### ADR-001: Monorepo 架构选择
- **决策**: 采用 Turborepo + pnpm 的 Monorepo 架构
- **理由**: 代码共享、统一构建、依赖管理简化

### ADR-002: 插件系统架构
- **决策**: 基于 Odoo 理念的运行时插件系统
- **理由**: 支持企业级应用的模块化开发和部署

### ADR-003: Schema-First 设计
- **决策**: 以 Zod Schema 为单一数据源
- **理由**: 减少重复定义，提高开发效率，类型安全

## 最佳实践

**参考**: `ai-context/zh/templates/ai-first-practices.md`

1. **AI-First 开发**: 所有代码便于 AI 理解和处理
2. **不重复造轮子**: 优先使用现有成熟方案
3. **类型安全优先**: 完整的 TypeScript 类型定义
4. **Schema 驱动**: 使用 @linch-kit/schema 作为单一数据源
5. **测试驱动**: 关键功能必须编写测试用例
6. **文档同步**: 代码变更必须同步更新文档

## 性能优化策略

**参考**: `ai-context/zh/architecture/system-architecture.md#性能优化架构`

### 构建性能
- Turborepo 智能缓存 + 并行构建
- 增量构建，只构建变更部分
- Tree Shaking，移除未使用代码

### 运行时性能
- 懒加载，按需加载组件和数据
- 虚拟滚动，处理大数据集
- 智能缓存，减少重复请求

## 安全架构

### 认证安全
- JWT 令牌无状态认证
- 多因素认证支持
- 安全会话管理

### 权限安全
- RBAC 基于角色的访问控制
- ABAC 基于属性的访问控制
- 字段级和行级权限控制

### 数据安全
- Zod 模式验证
- Prisma ORM SQL 注入防护
- XSS 和 CSRF 防护

---

**使用说明**: 
1. 设计架构时参考此提示词的原则和模式
2. 严格遵循不重复造轮子的原则
3. 确保所有设计决策都有明确的理由
4. 及时更新架构文档和决策记录

**相关文档**: 
- [系统架构详解](../../ai-context/zh/architecture/system-architecture.md)
- [技术选型决策](../../ai-context/zh/decisions/technology-choices.md)
- [插件系统设计](../../ai-context/zh/architecture/plugin-system-design.md)
