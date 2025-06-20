# 快速开始指南

## 🎯 目标读者

本指南适用于：
- 需要快速了解项目的 AI 助手
- 新加入项目的开发者
- 需要进行项目交接的团队成员

## 🚀 5 分钟快速了解

### 项目本质
Linch Kit 是一个 **AI-First 企业级快速开发框架**，让开发者能够快速构建管理系统。

### 核心特色
- **Schema 驱动**: 定义一次数据模式，自动生成所有相关代码
- **插件化架构**: 模块化设计，支持业务扩展
- **类型安全**: 端到端 TypeScript 支持
- **AI 友好**: 所有代码和文档都便于 AI 理解

### 技术栈
- **前端**: Next.js + React + TypeScript + Tailwind CSS
- **后端**: tRPC + Prisma + PostgreSQL
- **构建**: Turborepo + pnpm
- **UI**: shadcn/ui + 自研组件

## 📁 项目结构一览

```
linch-kit/
├── packages/           # 核心包
│   ├── core/          # CLI + 配置管理
│   ├── schema/        # 数据模式系统 ✅ 已发布
│   ├── auth-core/     # 认证和权限
│   ├── crud/          # CRUD 操作核心
│   ├── trpc/          # tRPC 集成
│   ├── ui/            # UI 组件库
│   └── types/         # 类型定义
├── apps/
│   └── starter/       # 验证应用
└── ai-context/        # AI 上下文文档
    └── zh/            # 中文文档
```

## 🎯 当前状态 (2025-06-20)

### ✅ 已完成
- **@linch-kit/schema**: 数据模式系统，已发布到 npm
- **@linch-kit/core**: CLI 系统和基础设施
- **@linch-kit/auth-core**: 认证和权限管理
- **@linch-kit/crud**: CRUD 操作核心
- **@linch-kit/ui**: 基础 UI 组件

### 🔄 进行中
- **Starter 应用验证**: 通过用户管理功能验证包集成
- **CLI 系统调试**: 修复插件加载和命令注册问题

### 📋 下一步
- **@linch-kit/trpc**: 完善 tRPC 集成
- **@linch-kit/crud-ui**: CRUD UI 组件
- **@linch-kit/auth-ui**: 认证 UI 组件

## 🔧 开发环境设置

### 前置要求
- Node.js 20+
- pnpm
- PostgreSQL (或使用 Supabase)

### 快速启动
```bash
# 1. 克隆项目
git clone git@github.com:laofahai/linch-kit.git
cd linch-kit

# 2. 安装依赖
pnpm install

# 3. 构建所有包
pnpm build

# 4. 进入 starter 应用
cd apps/starter

# 5. 配置数据库 (编辑 .env.local)
cp .env.example .env.local

# 6. 测试 CLI 工具
pnpm linch --help
```

## 📚 核心概念

### 1. Schema 驱动开发
```typescript
// 定义实体
const User = defineEntity('User', {
  id: z.string().primary(),
  email: z.string().email().unique(),
  name: z.string(),
  createdAt: z.date().createdAt(),
  updatedAt: z.date().updatedAt(),
});

// 自动生成：
// - Prisma schema
// - 验证器 (create/update/response/query)
// - Mock 数据
// - OpenAPI 文档
// - tRPC 路由
```

### 2. CLI 系统
```bash
# 查看所有命令
pnpm linch --help

# Schema 相关命令
pnpm linch schema-list
pnpm linch schema-generate-prisma

# 配置管理
pnpm linch config-list
pnpm linch config-set key value

# 插件管理
pnpm linch plugin-list
```

### 3. CRUD 操作
```typescript
// 创建 CRUD 管理器
const userCRUD = createCRUDManager({
  entity: User,
  permissions: {
    create: ['admin', 'user'],
    read: ['admin', 'user', 'guest'],
    update: ['admin', 'owner'],
    delete: ['admin'],
  },
});

// 使用 CRUD 操作
const users = await userCRUD.list({ page: 1, limit: 10 });
const user = await userCRUD.create({ email: 'test@example.com', name: 'Test' });
```

### 4. 权限系统
```typescript
// 定义权限
const permissions = {
  'user.create': ['admin'],
  'user.read': ['admin', 'user'],
  'user.update': ['admin', 'owner'],
  'user.delete': ['admin'],
};

// 权限检查
const canCreate = await checkPermission('user.create', user, context);
```

## 🎯 常见任务

### 添加新实体
1. 在 `app/_lib/schemas/` 下创建实体文件
2. 运行 `pnpm linch schema-generate-prisma`
3. 运行数据库迁移
4. 创建 CRUD 管理器
5. 添加 UI 组件

### 添加新权限
1. 在认证配置中定义权限
2. 在 CRUD 管理器中配置权限
3. 在 UI 组件中添加权限检查

### 调试 CLI 问题
1. 检查插件加载: `packages/core/src/cli/core/plugin-loader.ts`
2. 检查命令注册: `packages/core/src/cli/core/command-registry.ts`
3. 检查配置文件: `apps/starter/linch.config.ts`

## 🔍 故障排除

### CLI 命令不工作
```bash
# 检查插件加载
pnpm linch plugin-list

# 检查配置
pnpm linch config-list

# 重新构建
pnpm build
```

### Schema 生成失败
```bash
# 检查实体定义
pnpm linch schema-list

# 检查配置
cat linch.config.ts

# 手动生成
pnpm linch schema-generate-prisma
```

### 包依赖问题
```bash
# 清理依赖
pnpm clean

# 重新安装
pnpm install

# 重新构建
pnpm build
```

## 📖 深入学习

### 必读文档
1. [项目总览](./project-overview.md) - 了解项目定位和架构
2. [系统架构](../architecture/system-architecture.md) - 深入理解技术架构
3. [当前进度](../management/current-progress.md) - 了解最新状态

### 包级文档
4. [Core 包](../packages/core.md) - CLI 和基础设施
5. [Schema 包](../packages/schema.md) - 数据模式系统
6. [Auth Core 包](../packages/auth-core.md) - 认证和权限

### 工作流程
7. [开发流程](../workflows/development.md) - 开发规范和流程
8. [任务优先级](../management/task-priorities.md) - 当前任务安排

## 🤝 获取帮助

### 文档资源
- **AI 上下文**: `ai-context/zh/` - 完整的项目文档
- **包文档**: `packages/*/README.md` - 各包详细文档
- **示例代码**: `apps/starter/` - 实际使用示例

### 调试资源
- **错误日志**: 查看 CLI 和应用的错误输出
- **配置文件**: 检查 `linch.config.ts` 配置
- **构建日志**: 查看 `pnpm build` 输出

---

**下一步**: 根据你的角色选择相应的深入文档
- **AI 助手**: 阅读 [工作交接指南](../management/handover-guide.md)
- **开发者**: 阅读 [开发流程](../workflows/development.md)
- **项目管理**: 阅读 [任务优先级](../management/task-priorities.md)
