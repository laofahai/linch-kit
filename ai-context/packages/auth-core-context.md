# Auth Core 包 AI 上下文

## 🎯 包定位

`@linch-kit/auth-core` 是 Linch Kit 框架的认证和授权核心包，提供：

1. **模块化认证系统**: 基于 NextAuth.js 的可扩展认证框架
2. **多层权限系统**: RBAC、ABAC、层级权限的统一抽象
3. **多租户支持**: 企业级多租户认证和权限隔离
4. **Schema 集成**: 与 @linch-kit/schema 深度集成的实体模板
5. **插件化架构**: CLI 和配置插件，支持动态扩展

## 🏗️ 核心架构

### 依赖关系
```
@linch-kit/auth-core
├── 依赖: @linch-kit/schema     # 实体定义和验证
├── 依赖: @linch-kit/core       # CLI 和配置基础设施
├── 集成: next-auth             # 认证基础
├── 集成: @trpc/server          # API 中间件
└── 集成: prisma                # 数据库操作
```

### 包结构
```
packages/auth-core/
├── src/
│   ├── core/                   # 核心认证逻辑
│   │   ├── auth.ts            # NextAuth 配置和扩展
│   │   ├── permissions.ts     # 权限检查器
│   │   └── modular-permission-checker.ts # 模块化权限
│   ├── schemas/               # 实体模板定义
│   │   ├── user.ts           # 用户实体模板
│   │   ├── session.ts        # 会话实体模板
│   │   ├── permissions.ts    # 权限实体模板
│   │   └── index.ts          # 预设套件
│   ├── providers/            # 认证提供者
│   │   ├── oauth.ts          # OAuth 提供者
│   │   └── shared-token/     # 共享令牌提供者
│   ├── integrations/         # 第三方集成
│   │   └── trpc-middleware.ts # tRPC 权限中间件
│   ├── plugins/              # 插件系统
│   │   ├── cli-plugin.ts     # CLI 命令插件
│   │   └── config-plugin.ts  # 配置插件
│   ├── generators/           # 代码生成器
│   │   └── auth-entities.ts  # 实体生成器
│   ├── types/                # 类型定义
│   └── i18n/                 # 国际化
└── examples/                 # 使用示例
```

## 🔧 当前状态和问题

### ✅ 已完成功能
1. **实体模板系统**: 4种用户模板 (Minimal/Basic/Enterprise/MultiTenant)
2. **权限检查器**: 基础权限、层级权限、模块化权限
3. **认证提供者**: OAuth、共享令牌提供者
4. **tRPC 集成**: 权限中间件和会话管理
5. **CLI 插件**: 认证相关的命令行工具
6. **配置插件**: 动态配置管理

### 🚨 当前错误 (92个错误)

#### 1. 依赖问题 (16个错误)
- `@linch-kit/core` 包导入失败 (cli-plugin.ts, config-plugin.ts)
- `@linch-kit/schema` 的 `defineField` 导出问题
- `next-auth/providers/microsoft` 导入问题

#### 2. 类型安全问题 (45个错误)
- `userData` 类型为 `unknown` 需要类型断言
- 权限检查器返回类型不匹配
- NextAuth 类型兼容性问题

#### 3. 模板定义问题 (33个错误)
- 实体模板未正确导出/导入
- Schema 套件类型定义缺失

#### 4. 重复导出问题 (4个错误)
- 类型重复导出导致命名冲突

## 🔄 重构计划

### 第一阶段：依赖修复
1. **修复 @linch-kit/core 依赖**
   - 确保 core 包正确构建和导出
   - 修复 CLI 和 Config 插件导入

2. **修复 @linch-kit/schema 集成**
   - 确认 defineField 导出
   - 修复实体模板定义

3. **修复第三方依赖**
   - 更新 next-auth 提供者导入
   - 修复类型兼容性

### 第二阶段：类型安全
1. **强化类型定义**
   - 为 userData 添加正确的类型定义
   - 修复权限检查器类型
   - 解决 NextAuth 类型冲突

2. **消除重复导出**
   - 重构导出结构
   - 避免命名冲突

### 第三阶段：功能完善
1. **完善实体模板**
   - 确保所有模板正确导出
   - 添加缺失的模板定义

2. **优化权限系统**
   - 完善模块化权限检查器
   - 添加更多权限策略

## 🎯 设计原则

### 1. 模块化优先
- 每个功能都可以独立启用/禁用
- 支持渐进式采用
- 最小化强制依赖

### 2. 类型安全
- 完整的 TypeScript 支持
- 编译时类型检查
- 运行时类型验证

### 3. 扩展性
- 插件化架构
- 自定义认证提供者
- 可扩展的权限系统

### 4. AI-First
- 便于 AI 理解的代码结构
- 完整的类型定义和注释
- 标准化的命名约定

## 🔌 插件系统集成

### CLI 插件功能
```typescript
// 注册到 @linch-kit/core 的 CLI 系统
export const authCoreCliPlugin: CLIPlugin = {
  name: '@linch-kit/auth-core',
  commands: [
    'auth:init',      // 初始化认证配置
    'auth:generate',  // 生成认证实体
    'auth:permissions', // 生成权限系统
    'auth:validate',  // 验证配置
    'auth:info'       // 显示配置信息
  ]
}
```

### 配置插件功能
```typescript
// 注册到 @linch-kit/core 的配置系统
export const authCoreConfigPlugin: ConfigPlugin = {
  name: '@linch-kit/auth-core',
  schema: AuthConfigSchema,
  defaults: defaultAuthConfig,
  templates: configTemplates
}
```

## 🔗 与其他包的集成

### 与 @linch-kit/schema 集成
- 使用 defineEntity 和 defineField 定义实体模板
- 自动生成 Prisma schema
- 类型安全的验证器

### 与 @linch-kit/trpc 集成
- 权限中间件
- 会话管理
- 用户上下文注入

### 与插件系统集成
- 模块化权限检查
- 跨模块权限验证
- 事务支持

## 📋 下一步行动

### 立即任务
1. 修复 @linch-kit/core 依赖问题
2. 修复 @linch-kit/schema 集成问题
3. 解决类型安全问题
4. 修复实体模板导出

### 中期目标
1. 完善权限系统
2. 添加更多认证提供者
3. 优化 tRPC 集成
4. 完善文档和示例

### 长期规划
1. 支持更多权限策略
2. 添加审计日志
3. 支持联邦认证
4. 性能优化

## 🔍 关键文件说明

### 核心文件
- `src/core/auth.ts`: NextAuth 配置和扩展
- `src/core/permissions.ts`: 权限检查器实现
- `src/schemas/index.ts`: 实体模板和套件定义

### 插件文件
- `src/plugins/cli-plugin.ts`: CLI 命令定义
- `src/plugins/config-plugin.ts`: 配置管理

### 集成文件
- `src/integrations/trpc-middleware.ts`: tRPC 权限中间件
- `src/providers/`: 认证提供者实现

## 🎯 成功指标

1. **零类型错误**: 所有 TypeScript 错误修复
2. **完整功能**: 所有预设套件正常工作
3. **插件集成**: CLI 和配置插件正常注册
4. **文档完善**: 完整的使用文档和示例
5. **测试覆盖**: 核心功能的单元测试
