# 开发工作流程

## 概述

Linch Kit 采用标准化的开发工作流程，支持多人协作、自动化质量检查、增量构建和持续集成。

## 开发环境设置

### 1. 环境要求

```typescript
interface DevelopmentEnvironment {
  node: '>=18.0.0'
  pnpm: '>=8.0.0'
  git: '>=2.30.0'
  editor: 'VSCode' | 'WebStorm' | 'Vim'
  os: 'macOS' | 'Linux' | 'Windows'
}
```

### 2. 初始化流程

```bash
# 1. 克隆项目
git clone <repository-url>
cd linch-kit

# 2. 安装依赖
pnpm install

# 3. 初始化配置
pnpm setup

# 4. 验证环境
pnpm validate

# 5. 启动开发模式
pnpm dev
```

### 3. 开发工具配置

```typescript
interface DevelopmentTools {
  vscode: VSCodeConfig
  git: GitConfig
  pnpm: PnpmConfig
  turborepo: TurborepoConfig
}

interface VSCodeConfig {
  extensions: [
    'ms-vscode.vscode-typescript-next',
    'esbenp.prettier-vscode',
    'ms-vscode.vscode-eslint',
    'bradlc.vscode-tailwindcss',
  ]
  settings: {
    'typescript.preferences.includePackageJsonAutoImports': 'on'
    'editor.formatOnSave': true
    'editor.codeActionsOnSave': {
      'source.fixAll.eslint': true
    }
  }
}
```

## 分支策略

### 1. Git Flow 模型

```mermaid
gitgraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Setup"
    branch feature/auth
    checkout feature/auth
    commit id: "Auth work"
    commit id: "Auth tests"
    checkout develop
    merge feature/auth
    checkout main
    merge develop tag: "v1.0.0"
```

### 2. 分支命名规范

```typescript
interface BranchNaming {
  main: 'main' // 主分支
  develop: 'develop' // 开发分支
  feature: 'feature/feature-name' // 功能分支
  bugfix: 'bugfix/issue-number' // 修复分支
  hotfix: 'hotfix/critical-fix' // 热修复分支
  release: 'release/v1.0.0' // 发布分支
}
```

### 3. 提交信息规范

```typescript
interface CommitConvention {
  format: '<type>(<scope>): <description>'
  types: [
    'feat', // 新功能
    'fix', // 修复
    'docs', // 文档
    'style', // 格式
    'refactor', // 重构
    'test', // 测试
    'chore', // 构建/工具
  ]
  scopes: [
    'core', // 核心包
    'auth', // 认证包
    'schema', // 模式包
    'ui', // UI 包
    'docs', // 文档
    'ci', // CI/CD
  ]
}

// 示例
const commitExamples = [
  'feat(auth): add OAuth2 provider support',
  'fix(schema): resolve validation error handling',
  'docs(core): update API documentation',
  'test(trpc): add integration tests',
]
```

## 功能开发流程

### 1. 功能开发生命周期

```typescript
interface FeatureDevelopmentLifecycle {
  planning: PlanningPhase
  development: DevelopmentPhase
  testing: TestingPhase
  review: ReviewPhase
  integration: IntegrationPhase
  deployment: DeploymentPhase
}

interface PlanningPhase {
  requirements: RequirementAnalysis
  design: TechnicalDesign
  estimation: EffortEstimation
  approval: StakeholderApproval
}
```

### 2. 开发步骤

```bash
# 1. 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-management

# 2. 开发功能
# 编写代码
# 添加测试
# 更新文档

# 3. 本地验证
pnpm lint
pnpm test
pnpm build:packages
pnpm check-types

# 4. 提交代码
git add .
git commit -m "feat(auth): add user management system"

# 5. 推送分支
git push origin feature/user-management

# 6. 创建 Pull Request
# 通过 GitHub/GitLab 界面创建 PR
```

### 3. 代码质量检查

```typescript
interface QualityChecks {
  preCommit: PreCommitHooks
  prePush: PrePushHooks
  ci: ContinuousIntegration
}

interface PreCommitHooks {
  linting: 'eslint --fix'
  formatting: 'prettier --write'
  typeChecking: 'tsc --noEmit'
  testing: 'vitest run --changed'
}
```

## 包开发流程

### 1. 新包创建

```bash
# 1. 创建包目录
mkdir packages/my-package
cd packages/my-package

# 2. 初始化包
pnpm init

# 3. 设置配置文件
# 复制模板配置
cp ../core/tsconfig.json ./
cp ../core/tsup.config.ts ./

# 4. 创建源码结构
mkdir src
touch src/index.ts

# 5. 更新 workspace 配置
# 包会自动被 pnpm workspace 识别
```

### 2. 包配置模板

```typescript
// package.json 模板
interface PackageTemplate {
  name: '@linch-kit/my-package'
  version: '0.1.0'
  description: 'Package description'
  type: 'module'
  main: './dist/index.js'
  module: './dist/index.mjs'
  types: './dist/index.d.ts'
  exports: {
    '.': {
      import: './dist/index.mjs'
      require: './dist/index.js'
      types: './dist/index.d.ts'
    }
  }
  files: ['dist', 'README.md']
  scripts: {
    build: 'tsup'
    dev: 'tsup --watch'
    test: 'vitest'
    lint: 'eslint src'
    'check-types': 'tsc --noEmit'
  }
  dependencies: {
    '@linch-kit/core': 'workspace:*'
  }
}
```

### 3. 包开发最佳实践

```typescript
interface PackageBestPractices {
  structure: PackageStructure
  api: APIDesign
  testing: TestingStrategy
  documentation: DocumentationStandards
}

interface PackageStructure {
  src: 'Source code directory'
  dist: 'Build output directory'
  tests: 'Test files (co-located or separate)'
  docs: 'Package-specific documentation'
  examples: 'Usage examples'
}
```

## 测试工作流程

### 1. 测试策略

```typescript
interface TestingStrategy {
  unit: UnitTesting
  integration: IntegrationTesting
  e2e: EndToEndTesting
  performance: PerformanceTesting
}

interface UnitTesting {
  framework: 'vitest'
  coverage: {
    threshold: 80
    reports: ['text', 'html', 'lcov']
  }
  patterns: ['**/*.test.ts', '**/*.spec.ts']
}
```

### 2. 测试命令

```bash
# 运行所有测试
pnpm test

# 运行特定包测试
pnpm turbo test --filter=@linch-kit/core

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage

# 性能测试
pnpm test:performance
```

### 3. 测试文件组织

```typescript
interface TestOrganization {
  unit: 'src/**/*.test.ts'
  integration: 'tests/integration/**/*.test.ts'
  e2e: 'tests/e2e/**/*.test.ts'
  fixtures: 'tests/fixtures/**/*'
  utils: 'tests/utils/**/*.ts'
}
```

## 构建和部署流程

### 1. 构建流程

```bash
# 增量构建
pnpm build:packages

# 完整构建
pnpm clean && pnpm build:packages

# 监听构建
pnpm build:watch

# 生产构建
NODE_ENV=production pnpm build:packages
```

### 2. 部署检查清单

```typescript
interface DeploymentChecklist {
  preDeployment: PreDeploymentChecks
  deployment: DeploymentSteps
  postDeployment: PostDeploymentChecks
}

interface PreDeploymentChecks {
  tests: 'All tests passing'
  build: 'Clean build successful'
  linting: 'No linting errors'
  types: 'No type errors'
  security: 'Security audit passed'
  dependencies: 'Dependencies up to date'
}
```

## 协作流程

### 1. Code Review 流程

```typescript
interface CodeReviewProcess {
  preparation: ReviewPreparation
  review: ReviewExecution
  feedback: FeedbackHandling
  approval: ApprovalProcess
}

interface ReviewPreparation {
  selfReview: 'Author self-review'
  testing: 'Comprehensive testing'
  documentation: 'Updated documentation'
  description: 'Clear PR description'
}
```

### 2. PR 模板

```markdown
## 变更描述

简要描述这个 PR 的变更内容

## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 重构
- [ ] 性能优化

## 测试

- [ ] 单元测试已添加/更新
- [ ] 集成测试已添加/更新
- [ ] 手动测试已完成

## 检查清单

- [ ] 代码遵循项目规范
- [ ] 自我审查已完成
- [ ] 文档已更新
- [ ] 无破坏性变更
```

## 发布流程

### 1. 版本发布

```bash
# 1. 添加变更集
pnpm changeset

# 2. 版本更新
pnpm changeset version

# 3. 构建和测试
pnpm ci

# 4. 提交版本变更
git add .
git commit -m "chore: version packages"

# 5. 推送触发发布
git push origin main
```

### 2. 发布自动化

```typescript
interface ReleaseAutomation {
  trigger: 'Push to main branch'
  steps: [
    'Run CI checks',
    'Build packages',
    'Run tests',
    'Publish to npm',
    'Create GitHub release',
    'Update documentation',
  ]
  notifications: ['Slack notification', 'Email notification', 'GitHub notification']
}
```

## 监控和维护

### 1. 项目健康监控

```bash
# 依赖检查
pnpm audit
pnpm outdated

# 构建性能
pnpm test:workflow

# 代码质量
pnpm lint
pnpm check-types
```

### 2. 维护任务

```typescript
interface MaintenanceTasks {
  daily: DailyTasks
  weekly: WeeklyTasks
  monthly: MonthlyTasks
}

interface DailyTasks {
  ciStatus: 'Check CI status'
  issues: 'Review new issues'
  prs: 'Review pending PRs'
}
```

这个开发工作流程确保了 Linch Kit 项目的高质量和可维护性。
