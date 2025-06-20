# Linch Kit 系统架构设计提示词

## 目的

指导 AI 助手进行 Linch Kit 系统的架构设计和优化，确保系统的可扩展性、可维护性和 AI 友好性。

## 上下文

Linch Kit 是一个 AI-First 的全栈开发框架，采用 monorepo 架构，包含以下核心组件：

- `@linch-kit/core`: 核心功能和 CLI 系统
- `@linch-kit/schema`: 实体定义和 schema 生成
- `@linch-kit/auth-core`: 认证和授权系统
- `@linch-kit/crud`: CRUD 操作生成
- `@linch-kit/trpc`: tRPC 集成
- `@linch-kit/ui`: UI 组件库

## 架构原则

### 1. AI-First 设计

- 所有代码都应该易于 AI 理解和生成
- 使用清晰的命名约定和注释
- 提供丰富的元数据和类型信息
- 支持自动化代码生成和验证

### 2. 模块化架构

- 每个包都有明确的职责边界
- 使用依赖注入和插件系统
- 支持热插拔和动态加载
- 最小化包之间的耦合

### 3. 类型安全

- 全面使用 TypeScript
- 严格的类型检查
- 运行时类型验证
- 自动生成类型定义

## 系统设计模式

### 1. 插件架构

```typescript
interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  register(registry: Registry): Promise<void>;
  init?(context: PluginContext): Promise<void>;
  cleanup?(): Promise<void>;
}
```

### 2. 命令注册系统

```typescript
interface CommandMetadata {
  description: string;
  handler: (context: CLIContext) => Promise<void>;
  options?: CommandOption[];
  arguments?: CommandArgument[];
  examples?: string[];
  category?: string;
  aiTags?: string[];
}
```

### 3. 配置管理

```typescript
interface LinchConfig {
  project: ProjectConfig;
  database: DatabaseConfig;
  schema: SchemaConfig;
  auth?: AuthConfig;
  trpc?: TrpcConfig;
  plugins: string[];
}
```

## 设计决策

### 1. 数据库抽象层

- 使用 Prisma 作为 ORM
- 支持多种数据库提供商
- 自动生成 schema 和迁移
- 内置软删除和审计字段

### 2. 认证系统

- 基于 RBAC 的权限模型
- 支持多种认证提供商
- JWT 会话管理
- 细粒度权限控制

### 3. API 层设计

- 使用 tRPC 进行类型安全的 API
- 自动生成客户端代码
- 内置验证和错误处理
- 支持实时订阅

## 扩展点

### 1. 自定义实体

- 使用装饰器定义实体
- 自动生成数据库 schema
- 支持关系映射
- 内置验证规则

### 2. 自定义命令

- 插件化的 CLI 命令系统
- 统一的错误处理
- 丰富的帮助信息
- AI 友好的命令描述

### 3. 自定义 UI 组件

- 基于现代 UI 框架
- 响应式设计
- 主题系统
- 无障碍支持

## 性能考虑

### 1. 构建优化

- 使用 tsup 进行快速构建
- 支持增量构建
- 代码分割和懒加载
- 优化的依赖管理

### 2. 运行时优化

- 延迟加载插件
- 缓存机制
- 连接池管理
- 内存使用优化

## 安全考虑

### 1. 输入验证

- 严格的类型检查
- 运行时验证
- SQL 注入防护
- XSS 防护

### 2. 权限控制

- 基于角色的访问控制
- 资源级别权限
- 审计日志
- 安全会话管理

## 监控和调试

### 1. 日志系统

- 结构化日志
- 不同级别的日志
- 性能监控
- 错误追踪

### 2. 开发工具

- 丰富的 CLI 命令
- 调试模式
- 性能分析
- 自动化测试

## 最佳实践

1. **保持简单**: 优先选择简单的解决方案
2. **文档优先**: 所有 API 都应该有清晰的文档
3. **测试驱动**: 编写全面的测试用例
4. **渐进式增强**: 支持逐步采用新功能
5. **向后兼容**: 保持 API 的稳定性
6. **社区友好**: 易于贡献和扩展

## 技术栈

### 核心技术

- **语言**: TypeScript (严格模式)
- **构建工具**: tsup, turbo
- **包管理**: pnpm
- **数据库**: PostgreSQL (主要), MySQL, SQLite
- **ORM**: Prisma

### 开发工具

- **CLI 框架**: Commander.js
- **配置管理**: cosmiconfig
- **验证**: Zod
- **测试**: Jest, Vitest
- **代码质量**: ESLint, Prettier

### 部署和运维

- **容器化**: Docker
- **CI/CD**: GitHub Actions
- **监控**: 结构化日志
- **文档**: Markdown + 自动生成
