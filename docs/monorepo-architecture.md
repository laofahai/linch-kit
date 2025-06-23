# Turborepo Monorepo 架构设计

## 项目结构

```
linch-kit/
├── packages/                    # 核心包
│   ├── core/                   # 核心工具包
│   ├── auth-core/              # 认证核心
│   ├── schema/                 # 数据模式
│   ├── trpc/                   # tRPC 集成
│   ├── ui/                     # UI 组件库
│   └── types/                  # 类型定义
├── apps/                       # 应用
│   ├── starter/                # 启动模板
│   └── docs/                   # 文档站点
├── configs/                    # 共享配置
│   ├── tsconfig.base.json      # TypeScript 基础配置
│   ├── tsconfig.build.json     # 构建配置
│   ├── tsup.base.ts           # tsup 基础配置
│   ├── eslint.config.js       # ESLint 配置
│   └── jest.config.js         # Jest 配置
├── scripts/                    # 构建脚本
│   ├── build.js               # 构建脚本
│   ├── release.js             # 发布脚本
│   ├── version.js             # 版本管理
│   └── deps-graph.js          # 依赖图分析
├── tools/                      # 开发工具
│   ├── workspace-tools/       # workspace 工具
│   └── ci-tools/              # CI/CD 工具
├── .github/                    # GitHub Actions
│   └── workflows/
├── turbo.json                  # Turborepo 配置
├── package.json               # 根 package.json
├── pnpm-workspace.yaml        # pnpm workspace 配置
└── pnpm-lock.yaml             # 锁文件
```

## 技术栈选择

### 核心工具
- **Turborepo**: 构建系统和缓存
- **pnpm**: 包管理器和 workspace
- **tsup**: 打包工具
- **TypeScript**: 类型系统
- **Changesets**: 版本管理和发布

### 质量工具
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Jest/Vitest**: 测试框架
- **Husky**: Git hooks

### CI/CD
- **GitHub Actions**: 持续集成
- **Semantic Release**: 自动发布
- **Codecov**: 代码覆盖率

## 设计原则

1. **统一配置**: 所有配置文件集中管理
2. **增量构建**: 只构建变更的包
3. **并行执行**: 最大化利用并行能力
4. **缓存优化**: 本地和远程缓存
5. **类型安全**: 完整的 TypeScript 支持
6. **自动化**: 最小化手动操作

## 核心功能

### 1. 多包打包与构建

#### tsup 配置最佳实践

```typescript
// packages/example/tsup.config.ts
import { createLibraryConfig } from '../../configs/tsup.base'

export default createLibraryConfig({
  entry: ['src/index.ts'],
  external: ['specific-external-deps']
})
```

#### 构建命令

```bash
# 构建所有包（按依赖顺序）
pnpm build:packages

# 构建特定包
pnpm turbo build:packages --filter=@linch-kit/core

# 监听模式构建
pnpm build:watch
```

### 2. 版本管理与发布

#### 使用 Changesets

```bash
# 添加变更集
pnpm changeset

# 版本更新
pnpm changeset:version

# 发布
pnpm release
```

#### 自动版本替换

发布时自动将 `workspace:*` 替换为具体版本号：

```json
{
  "dependencies": {
    "@linch-kit/core": "workspace:*"  // 开发时
  }
}
```

替换为：

```json
{
  "dependencies": {
    "@linch-kit/core": "^1.2.3"  // 发布时
  }
}
```

### 3. 依赖关系管理

#### 依赖图分析

```bash
# 分析依赖关系
pnpm deps:graph

# 检查依赖一致性
pnpm deps:check
```

#### 构建顺序

系统自动分析依赖关系，确保按正确顺序构建：

```
Level 0: @linch-kit/core
Level 1: @linch-kit/schema
Level 2: @linch-kit/auth, @linch-kit/crud
Level 3: @linch-kit/trpc
Level 4: @linch-kit/ui
```

### 4. 本地开发支持

#### 启动开发模式

```bash
# 完整开发模式（文件监听 + 自动构建）
pnpm dev

# 只启动应用开发服务器
pnpm dev:apps

# 只监听包变化
pnpm dev:packages
```

#### 多包联调

- 自动创建软链接
- 实时文件监听
- 增量构建
- 依赖同步

### 5. 代码质量与测试

#### 质量检查

```bash
# 代码检查
pnpm lint

# 格式化
pnpm format

# 类型检查
pnpm check-types

# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage
```

#### 持续集成

- 并行执行测试
- 依赖图优化构建顺序
- 缓存优化
- 安全审计

### 6. CI/CD 流水线

#### GitHub Actions 工作流

1. **CI 流水线** (`.github/workflows/ci.yml`)
   - 依赖图分析
   - 代码质量检查
   - 并行构建和测试
   - 安全审计

2. **发布流水线** (`.github/workflows/release.yml`)
   - 自动版本管理
   - 构建和测试
   - 发布到 npm
   - 更新文档

#### 缓存策略

- Turborepo 远程缓存
- GitHub Actions 缓存
- pnpm 依赖缓存

## 使用指南

### 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 构建所有包
pnpm build:packages

# 3. 启动开发模式
pnpm dev

# 4. 运行测试
pnpm test
```

### 添加新包

1. 在 `packages/` 下创建新目录
2. 复制标准的 `package.json` 模板
3. 使用共享的 TypeScript 和 tsup 配置
4. 添加到 workspace 依赖图

### 发布流程

1. 开发完成后运行 `pnpm changeset`
2. 选择变更类型（major/minor/patch）
3. 提交代码到 main 分支
4. GitHub Actions 自动处理发布

### 故障排除

#### 构建失败

```bash
# 清理并重新构建
pnpm clean
pnpm build:packages
```

#### 依赖问题

```bash
# 检查依赖一致性
pnpm deps:check

# 重新安装依赖
pnpm reset
```

#### 类型错误

```bash
# 重新生成类型声明
pnpm build:packages
pnpm check-types
```

## 最佳实践

### 包设计

1. **单一职责**: 每个包专注一个功能领域
2. **最小依赖**: 减少外部依赖，优先使用 peerDependencies
3. **类型优先**: 完整的 TypeScript 支持
4. **向后兼容**: 遵循语义化版本

### 开发流程

1. **功能分支**: 使用 feature 分支开发
2. **变更集**: 每个 PR 包含相应的 changeset
3. **测试覆盖**: 保持高测试覆盖率
4. **文档更新**: 及时更新 README 和 API 文档

### 性能优化

1. **增量构建**: 只构建变更的包
2. **并行执行**: 最大化利用 CPU 核心
3. **缓存利用**: 本地和远程缓存
4. **依赖优化**: 合理的依赖图设计
