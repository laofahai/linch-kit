# LinchKit 代码位置快速索引

**快速定位关键文件和功能的位置**

## 📦 核心包位置

### @linch-kit/core
```
packages/core/src/
├── cli/                         # CLI 系统
│   ├── commands/               # CLI 命令实现
│   └── core/                   # CLI 核心逻辑
├── config/                     # 配置管理
├── i18n/                       # 统一国际化系统 ⭐
│   ├── types.ts               # i18n 类型定义
│   ├── index.ts               # 全局 i18n 管理
│   └── package-i18n.ts        # 包级别 i18n 工具
└── utils/                      # 工具函数
```

### @linch-kit/schema
```
packages/schema/src/
├── core/                       # Schema 核心
├── generators/                 # 代码生成器
├── decorators/                 # Schema 装饰器
└── i18n/                      # Schema i18n (已重构)
```

### @linch-kit/auth
```
packages/auth/src/              # 认证核心 (原 auth-core)
├── core/                       # 认证核心逻辑
├── permissions/                # 权限系统
├── entities/                   # 认证实体
└── i18n/                      # Auth i18n (已重构)
```

### @linch-kit/ui
```
packages/ui/src/
├── components/
│   ├── ui/                    # shadcn/ui 基础组件
│   ├── crud/                  # CRUD 组件 ⭐
│   │   ├── data-table.tsx     # DataTable 组件 (已优化)
│   │   ├── form-builder.tsx   # FormBuilder 组件
│   │   └── searchable-select.tsx # 搜索选择器
│   └── blocks/                # UI Blocks
│       ├── dashboard-layout.tsx
│       ├── auth-forms.tsx
│       └── data-display.tsx
├── i18n/                      # UI i18n (已重构)
│   ├── index.ts              # UI 翻译函数
│   ├── hooks.ts              # React hooks
│   └── messages.ts           # 默认消息
└── lib/                       # UI 工具函数
```

## 🚀 应用和配置

### linch-starter 应用
```
apps/linch-starter/
├── app/                        # Next.js App Router
├── components/                 # 应用组件
├── lib/                       # 应用工具
├── linch.config.js            # LinchKit 配置 ⭐
├── .env                       # 环境变量 (已安全化)
├── .env.example               # 环境变量模板 ⭐
└── prisma/schema.prisma       # Prisma Schema
```

### 根目录配置
```
linch-kit/
├── turbo.json                 # Turborepo 配置
├── tsconfig.json              # TypeScript 配置
├── package.json               # 根包配置
├── .husky/pre-commit          # Git pre-commit hook ⭐
└── scripts/                   # TypeScript 构建脚本 ⭐
```

## 🔧 关键功能位置

### 统一国际化系统 (2025-06-21 新增)
- **核心实现**: `packages/core/src/i18n/`
- **包级别使用**: 各包的 `src/i18n/index.ts`
- **组件使用**: 通过 `t?: TranslationFunction` 属性传入

### 安全检查机制 (2025-06-21 新增)
- **Pre-commit hook**: `.husky/pre-commit`
- **环境变量模板**: `apps/linch-starter/.env.example`
- **安全配置**: `.gitignore` (环境变量保护)

### DataTable 组件 (2025-06-21 优化)
- **主文件**: `packages/ui/src/components/crud/data-table.tsx`
- **高级用法文档**: `packages/ui/src/components/crud/data-table-advanced.md`
- **特色**: 原生 API 透传 + 受控状态 + 自定义渲染

### CLI 系统
- **命令注册**: `packages/core/src/cli/core/command-registry.ts`
- **插件加载**: `packages/core/src/cli/core/plugin-loader.ts`
- **配置管理**: `packages/core/src/config/`

### Schema 系统
- **实体定义**: `apps/linch-starter/app/_lib/schemas/`
- **生成器**: `packages/schema/src/generators/`
- **CLI 命令**: `packages/core/src/cli/commands/schema.ts`

## 🎯 常用开发位置

### 添加新 UI 组件
1. **基础组件**: `packages/ui/src/components/ui/` (shadcn/ui)
2. **CRUD 组件**: `packages/ui/src/components/crud/`
3. **UI Blocks**: `packages/ui/src/components/blocks/`
4. **导出配置**: `packages/ui/src/index.ts`

### 添加新 CLI 命令
1. **命令实现**: `packages/core/src/cli/commands/`
2. **命令注册**: `packages/core/src/cli/core/command-registry.ts`
3. **配置选项**: `packages/core/src/config/`

### 添加新 Schema 实体
1. **实体定义**: `apps/linch-starter/app/_lib/schemas/`
2. **生成 Prisma**: `pnpm linch schema:generate:prisma`
3. **数据库迁移**: `pnpm prisma migrate dev`

### 添加新权限
1. **权限定义**: `packages/auth/src/permissions/`
2. **实体配置**: `apps/linch-starter/linch.config.js`
3. **UI 集成**: 在相关组件中添加权限检查

## 🔍 调试和故障排除

### CLI 问题
- **插件加载**: `packages/core/src/cli/core/plugin-loader.ts`
- **命令执行**: `packages/core/src/cli/core/command-registry.ts`
- **配置解析**: `packages/core/src/config/`

### 构建问题
- **包构建**: `packages/*/tsup.config.ts`
- **类型检查**: `packages/*/tsconfig.json`
- **依赖管理**: `packages/*/package.json`

### 数据库问题
- **Schema 文件**: `apps/linch-starter/prisma/schema.prisma`
- **连接配置**: `apps/linch-starter/.env.local` (本地创建)
- **迁移文件**: `apps/linch-starter/prisma/migrations/`

### 国际化问题
- **统一架构**: `packages/core/src/i18n/`
- **包级别实现**: 各包的 `src/i18n/index.ts`
- **组件使用**: 检查 `t?: TranslationFunction` 属性传递

## 📚 AI 上下文文档位置

### 核心指南文档
```
ai-context/
├── README.md                    # 总览和导航
├── project-core.md              # 项目核心信息
├── development-rules.md          # 强制开发规范
├── current-tasks.md             # 当前任务和优先级
├── code-locations.md            # 本文件 - 代码位置索引
├── architecture-design.md       # 架构设计和规划文档
├── development-plan.md          # 开发计划和路线图
└── continue-prompt.md           # 继续开发提示词
```

### 使用场景
- **快速开始**: 复制 `continue-prompt.md` 给 AI
- **了解架构**: 阅读 `architecture-design.md`
- **查看计划**: 查看 `development-plan.md`
- **查找代码**: 使用本文件快速定位
- **遵循规范**: 查看 `development-rules.md`

---

**使用原则**:
- 优先使用 `codebase-retrieval` 工具获取具体实现
- 此文档仅提供快速定位，不包含实现细节
- 发现位置变更时及时更新此文档
- 使用 Context7 MCP 查询第三方库最新文档
