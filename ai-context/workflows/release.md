# 发布工作流程

## 概述

Linch Kit 采用自动化发布流程，基于 Changesets 进行版本管理和包发布。

## 发布策略

### 1. 语义化版本

```typescript
interface SemanticVersioning {
  major: 'BREAKING CHANGES'     // 不兼容的 API 变更
  minor: 'Features'             // 向后兼容的新功能
  patch: 'Bug Fixes'            // 向后兼容的问题修复
}

// 版本示例
const versionExamples = {
  '1.0.0': '首个稳定版本',
  '1.1.0': '新增功能',
  '1.1.1': '修复问题',
  '2.0.0': '破坏性变更'
}
```

### 2. 发布类型

```typescript
interface ReleaseTypes {
  stable: {
    description: '稳定版本'
    schedule: '每月一次'
    branch: 'main'
    tag: 'latest'
  }
  
  beta: {
    description: '测试版本'
    schedule: '每周一次'
    branch: 'develop'
    tag: 'beta'
  }
  
  alpha: {
    description: '开发版本'
    schedule: '每日构建'
    branch: 'feature/*'
    tag: 'alpha'
  }
  
  hotfix: {
    description: '紧急修复'
    schedule: '按需发布'
    branch: 'hotfix/*'
    tag: 'latest'
  }
}
```

## 发布流程

### 1. 准备阶段

```bash
# 1. 确保代码最新
git checkout main
git pull origin main

# 2. 检查工作区状态
git status

# 3. 运行完整测试
pnpm ci

# 4. 检查依赖安全
pnpm audit
```

### 2. 变更集管理

```bash
# 添加变更集
pnpm changeset

# 查看变更集状态
pnpm changeset status

# 预览版本变更
pnpm changeset version --dry-run
```

### 3. 版本更新

```bash
# 更新版本号
pnpm changeset version

# 安装更新后的依赖
pnpm install

# 提交版本变更
git add .
git commit -m "chore: version packages"
```

### 4. 发布执行

```bash
# 构建所有包
pnpm build:packages

# 发布到 npm
pnpm changeset publish

# 推送标签
git push --follow-tags
```

## 自动化发布

### 1. GitHub Actions 工作流

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - name: Build packages
        run: pnpm build:packages
        
      - name: Run tests
        run: pnpm test
        
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
          title: 'chore: version packages'
          commit: 'chore: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 2. 发布脚本

```typescript
// scripts/release.js
interface ReleaseScript {
  preRelease: PreReleaseChecks
  build: BuildProcess
  test: TestExecution
  publish: PublishProcess
  postRelease: PostReleaseActions
}

interface PreReleaseChecks {
  workspaceClean: 'Check git status'
  dependenciesUpdated: 'Check package-lock.json'
  testsPass: 'Run full test suite'
  lintPass: 'Run linting checks'
  typeCheck: 'Run type checking'
}
```

## 发布检查清单

### 1. 发布前检查

```typescript
interface PreReleaseChecklist {
  code: {
    allTestsPass: boolean
    noLintErrors: boolean
    noTypeErrors: boolean
    buildSuccessful: boolean
  }
  
  documentation: {
    changelogUpdated: boolean
    readmeUpdated: boolean
    apiDocsUpdated: boolean
    migrationGuideReady: boolean
  }
  
  dependencies: {
    securityAuditPassed: boolean
    dependenciesUpdated: boolean
    peerDepsCompatible: boolean
  }
  
  compatibility: {
    backwardCompatible: boolean
    breakingChangesDocumented: boolean
    migrationPathProvided: boolean
  }
}
```

### 2. 发布后验证

```typescript
interface PostReleaseValidation {
  npm: {
    packagesPublished: boolean
    versionsCorrect: boolean
    installationWorks: boolean
  }
  
  github: {
    tagsCreated: boolean
    releaseNotesPublished: boolean
    issuesClosed: boolean
  }
  
  documentation: {
    docsDeployed: boolean
    examplesUpdated: boolean
    tutorialsUpdated: boolean
  }
}
```

## 版本管理策略

### 1. 分支策略

```mermaid
gitgraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature 1"
    commit id: "Feature 2"
    checkout main
    merge develop tag: "v1.1.0"
    checkout develop
    commit id: "Feature 3"
    branch hotfix
    checkout hotfix
    commit id: "Critical fix"
    checkout main
    merge hotfix tag: "v1.1.1"
    checkout develop
    merge hotfix
```

### 2. 标签策略

```typescript
interface TagStrategy {
  stable: 'v1.0.0'           // 稳定版本
  prerelease: 'v1.1.0-beta.1' // 预发布版本
  snapshot: 'v1.1.0-alpha.20240101' // 快照版本
}
```

## 回滚策略

### 1. 快速回滚

```bash
# 回滚到上一个版本
npm deprecate @linch-kit/package@1.1.0 "Critical bug, use 1.0.9 instead"

# 发布修复版本
pnpm changeset version patch
pnpm changeset publish
```

### 2. 紧急修复

```bash
# 创建热修复分支
git checkout -b hotfix/critical-fix main

# 修复问题
# ... 代码修改 ...

# 快速发布
pnpm changeset add --type patch
pnpm changeset version
pnpm build:packages
pnpm changeset publish

# 合并回主分支
git checkout main
git merge hotfix/critical-fix
git push origin main
```

## 发布通知

### 1. 自动通知

```typescript
interface ReleaseNotifications {
  slack: {
    channel: '#releases'
    message: 'New version released: v1.1.0'
    changelog: 'Link to changelog'
  }
  
  email: {
    subscribers: 'Release mailing list'
    template: 'Release announcement template'
  }
  
  github: {
    release: 'GitHub release with notes'
    discussions: 'Community discussion thread'
  }
}
```

### 2. 发布说明模板

```markdown
## 🚀 v1.1.0 Release

### ✨ New Features
- Feature 1 description
- Feature 2 description

### 🐛 Bug Fixes
- Fix 1 description
- Fix 2 description

### 💥 Breaking Changes
- Breaking change description
- Migration guide link

### 📚 Documentation
- Updated API documentation
- New tutorial added

### 🔧 Internal
- Dependency updates
- Build improvements
```

这个发布工作流程确保了 Linch Kit 的稳定、可靠和可追溯的版本发布。
