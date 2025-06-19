#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * 文档清理和整理脚本
 * 
 * 功能：
 * 1. 清理重复的文档目录
 * 2. 合并和整理内容
 * 3. 统一文档结构
 * 4. 更新所有 README 文件
 */

class DocumentationCleaner {
  constructor() {
    this.rootDir = process.cwd()
    this.backupDir = path.join(this.rootDir, 'docs-cleanup-backup')
  }

  /**
   * 检查目录是否存在
   */
  exists(dirPath) {
    return fs.existsSync(dirPath)
  }

  /**
   * 创建目录
   */
  ensureDir(dirPath) {
    if (!this.exists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  /**
   * 删除目录
   */
  removeDir(dirPath) {
    if (this.exists(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true })
    }
  }

  /**
   * 复制目录
   */
  copyDir(src, dest) {
    if (!this.exists(src)) return

    this.ensureDir(dest)
    const items = fs.readdirSync(src)

    items.forEach(item => {
      const srcPath = path.join(src, item)
      const destPath = path.join(dest, item)
      const stat = fs.statSync(srcPath)

      if (stat.isDirectory()) {
        this.copyDir(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    })
  }

  /**
   * 备份现有文档
   */
  backupExistingDocs() {
    console.log('📦 备份现有文档...')
    
    this.ensureDir(this.backupDir)
    
    const dirsToBackup = ['docs', 'docs-new', 'ai-context', 'ai-context-new']
    
    dirsToBackup.forEach(dir => {
      const srcPath = path.join(this.rootDir, dir)
      if (this.exists(srcPath)) {
        this.copyDir(srcPath, path.join(this.backupDir, dir))
        console.log(`✅ 已备份 ${dir}/`)
      }
    })
  }

  /**
   * 清理重复目录
   */
  cleanupDuplicates() {
    console.log('\n🧹 清理重复目录...')
    
    // 删除临时目录
    this.removeDir(path.join(this.rootDir, 'docs-new'))
    this.removeDir(path.join(this.rootDir, 'ai-context-new'))
    
    console.log('✅ 已清理临时目录')
  }

  /**
   * 重新组织文档结构
   */
  reorganizeDocs() {
    console.log('\n📁 重新组织文档结构...')
    
    const docsDir = path.join(this.rootDir, 'docs')
    const aiContextDir = path.join(this.rootDir, 'ai-context')
    
    // 确保目录存在
    this.ensureDir(docsDir)
    this.ensureDir(aiContextDir)
    
    // 创建标准目录结构
    const docsDirs = [
      'getting-started',
      'guides', 
      'architecture',
      'api',
      'examples',
      'contributing'
    ]
    
    const aiContextDirs = [
      'system',
      'packages', 
      'decisions',
      'workflows',
      'templates',
      'progress'
    ]
    
    docsDirs.forEach(dir => {
      this.ensureDir(path.join(docsDir, dir))
    })
    
    aiContextDirs.forEach(dir => {
      this.ensureDir(path.join(aiContextDir, dir))
    })
    
    console.log('✅ 已创建标准目录结构')
  }

  /**
   * 更新根目录 README
   */
  updateRootReadme() {
    console.log('\n📝 更新根目录 README...')
    
    const readmePath = path.join(this.rootDir, 'README.md')
    const content = `# Linch Kit

现代化的全栈开发工具包，基于 TypeScript + Turborepo + pnpm 构建。

## 🚀 快速开始

\`\`\`bash
# 安装依赖
pnpm install

# 初始化配置
pnpm setup

# 启动开发模式
pnpm dev

# 验证环境
pnpm validate
\`\`\`

## 📦 核心包

- [\`@linch-kit/core\`](./packages/core/) - 核心工具和配置系统
- [\`@linch-kit/types\`](./packages/types/) - TypeScript 类型定义
- [\`@linch-kit/auth-core\`](./packages/auth-core/) - 认证和授权
- [\`@linch-kit/schema\`](./packages/schema/) - 数据模式和验证
- [\`@linch-kit/trpc\`](./packages/trpc/) - 类型安全的 API
- [\`@linch-kit/crud\`](./packages/crud/) - CRUD 操作抽象
- [\`@linch-kit/ui\`](./packages/ui/) - UI 组件库

## 🏗️ 应用

- [\`starter\`](./apps/starter/) - Next.js 启动模板
- [\`linch.tech\`](./apps/linch.tech/) - 官方网站

## 📚 文档

- [快速开始](./docs/getting-started/quick-start.md)
- [架构概览](./docs/architecture/overview.md)
- [Monorepo 管理](./docs/guides/monorepo-management.md)
- [API 文档](./docs/api/)
- [贡献指南](./docs/contributing/)

## 🛠️ 开发

\`\`\`bash
# 构建所有包
pnpm build:packages

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm check-types
\`\`\`

## 📋 脚本命令

\`\`\`bash
# 开发相关
pnpm dev                    # 启动开发模式
pnpm build:packages         # 构建所有包
pnpm test                   # 运行测试
pnpm lint                   # 代码检查

# 工具相关
pnpm setup                  # 初始化配置
pnpm validate               # 验证环境
pnpm deps:graph             # 依赖图分析
pnpm clean                  # 清理构建产物

# 发布相关
pnpm changeset              # 添加变更集
pnpm release                # 发布包
\`\`\`

## 🏛️ 架构

Linch Kit 采用 monorepo 架构，基于以下技术栈：

- **构建系统**: Turborepo + tsup
- **包管理**: pnpm workspace
- **类型系统**: TypeScript
- **版本管理**: Changesets
- **质量保证**: ESLint + Prettier + Vitest

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](./docs/contributing/development.md)。

## 📄 许可证

[MIT License](./LICENSE)

## 🔗 链接

- [GitHub](https://github.com/your-org/linch-kit)
- [npm](https://www.npmjs.com/org/linch-kit)
- [文档](https://linch-kit.dev)
- [讨论](https://github.com/your-org/linch-kit/discussions)
`
    
    fs.writeFileSync(readmePath, content)
    console.log('✅ 已更新根目录 README.md')
  }

  /**
   * 更新包的 README
   */
  updatePackageReadmes() {
    console.log('\n📝 更新包的 README...')
    
    const packagesDir = path.join(this.rootDir, 'packages')
    const packages = fs.readdirSync(packagesDir).filter(dir => {
      return fs.statSync(path.join(packagesDir, dir)).isDirectory()
    })
    
    packages.forEach(pkg => {
      this.updateSinglePackageReadme(pkg)
    })
  }

  /**
   * 更新单个包的 README
   */
  updateSinglePackageReadme(packageName) {
    const packageDir = path.join(this.rootDir, 'packages', packageName)
    const packageJsonPath = path.join(packageDir, 'package.json')
    const readmePath = path.join(packageDir, 'README.md')
    
    if (!this.exists(packageJsonPath)) return
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const name = packageJson.name || `@linch-kit/${packageName}`
    const description = packageJson.description || `${packageName} package for Linch Kit`
    
    const content = `# ${name}

${description}

## 安装

\`\`\`bash
pnpm add ${name}
\`\`\`

## 使用

\`\`\`typescript
import { } from '${name}'

// TODO: 添加使用示例
\`\`\`

## API

TODO: 添加 API 文档

## 开发

\`\`\`bash
# 构建
pnpm build

# 开发模式
pnpm dev

# 测试
pnpm test

# 类型检查
pnpm check-types
\`\`\`

## 许可证

MIT License
`
    
    fs.writeFileSync(readmePath, content)
    console.log(`✅ 已更新 ${name} README.md`)
  }

  /**
   * 更新应用的 README
   */
  updateAppReadmes() {
    console.log('\n📝 更新应用的 README...')
    
    const appsDir = path.join(this.rootDir, 'apps')
    if (!this.exists(appsDir)) return
    
    const apps = fs.readdirSync(appsDir).filter(dir => {
      return fs.statSync(path.join(appsDir, dir)).isDirectory()
    })
    
    apps.forEach(app => {
      this.updateSingleAppReadme(app)
    })
  }

  /**
   * 更新单个应用的 README
   */
  updateSingleAppReadme(appName) {
    const appDir = path.join(this.rootDir, 'apps', appName)
    const packageJsonPath = path.join(appDir, 'package.json')
    const readmePath = path.join(appDir, 'README.md')
    
    if (!this.exists(packageJsonPath)) return
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const name = packageJson.name || appName
    const description = packageJson.description || `${appName} application`
    
    const content = `# ${name}

${description}

## 开发

\`\`\`bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 启动生产服务器
pnpm start
\`\`\`

## 环境变量

复制 \`.env.example\` 到 \`.env.local\` 并配置必要的环境变量。

## 部署

TODO: 添加部署说明

## 许可证

MIT License
`
    
    fs.writeFileSync(readmePath, content)
    console.log(`✅ 已更新 ${name} README.md`)
  }

  /**
   * 更新 AI 上下文
   */
  updateAiContext() {
    console.log('\n🤖 更新 AI 上下文...')
    
    const aiContextDir = path.join(this.rootDir, 'ai-context')
    const readmePath = path.join(aiContextDir, 'README.md')
    
    const content = `# AI 上下文文档

这个目录包含了 Linch Kit 项目的 AI 上下文信息，用于帮助 AI 助手理解项目结构、技术决策和开发流程。

## 📁 目录结构

\`\`\`
ai-context/
├── README.md                   # 本文件
├── system/                     # 系统级上下文
│   ├── architecture.md        # 系统架构详解
│   ├── dependencies.md        # 依赖关系图谱
│   ├── build-pipeline.md      # 构建流水线
│   └── deployment.md          # 部署流程
├── packages/                   # 包级上下文
│   ├── core.md               # 核心包上下文
│   ├── types.md              # 类型包上下文
│   ├── auth-core.md          # 认证包上下文
│   ├── schema.md             # Schema 包上下文
│   ├── trpc.md               # tRPC 包上下文
│   ├── crud.md               # CRUD 包上下文
│   └── ui.md                 # UI 包上下文
├── decisions/                  # 技术决策记录
│   ├── tech-stack.md         # 技术栈选择
│   ├── architecture.md       # 架构决策
│   ├── tooling.md            # 工具选择
│   └── patterns.md           # 设计模式
├── workflows/                  # 工作流程
│   ├── development.md        # 开发流程
│   ├── testing.md            # 测试流程
│   ├── release.md            # 发布流程
│   └── maintenance.md        # 维护流程
├── templates/                  # 模板和规范
│   ├── package-template.md   # 包模板
│   ├── api-design.md         # API 设计规范
│   ├── documentation.md      # 文档规范
│   └── code-style.md         # 代码风格
└── progress/                   # 进度跟踪
    ├── current-status.md     # 当前状态
    ├── roadmap.md            # 路线图
    ├── milestones.md         # 里程碑
    └── changelog.md          # 变更日志
\`\`\`

## 🎯 使用指南

### 对于 AI 助手

这些文档提供了项目的完整上下文，包括：

1. **系统理解**: 通过 \`system/\` 目录了解整体架构
2. **包详情**: 通过 \`packages/\` 目录了解各包的职责和 API
3. **决策背景**: 通过 \`decisions/\` 目录了解技术选择的原因
4. **工作流程**: 通过 \`workflows/\` 目录了解开发和发布流程
5. **模板规范**: 通过 \`templates/\` 目录了解代码和文档规范

### 对于开发者

虽然这些文档主要为 AI 设计，但开发者也可以：

1. 了解项目的技术决策背景
2. 学习项目的设计模式和最佳实践
3. 查看详细的 API 和架构信息
4. 理解项目的发展历程和未来规划

## 📝 文档维护

### 更新原则

1. **及时性**: 代码变更后及时更新相关文档
2. **准确性**: 确保文档与实际代码保持一致
3. **完整性**: 覆盖所有重要的技术决策和流程
4. **结构化**: 使用统一的格式和结构

### 更新流程

1. **代码变更**: 当代码发生重要变更时
2. **架构调整**: 当系统架构发生变化时
3. **流程优化**: 当开发流程发生改进时
4. **决策记录**: 当做出重要技术决策时

## 🔗 关键概念

### 1. 系统架构

Linch Kit 采用分层架构：
- **应用层**: Next.js/React 应用
- **功能层**: 各种功能包
- **基础层**: 核心工具和类型

### 2. 包管理

使用 pnpm workspace + Turborepo：
- **依赖管理**: workspace:* 格式
- **构建系统**: 增量构建和缓存
- **发布流程**: Changesets 版本管理

### 3. 开发流程

标准化的开发工作流：
- **功能开发**: 分支开发 + PR 流程
- **质量保证**: 自动化测试和检查
- **版本发布**: 自动化发布流程

### 4. 技术栈

现代化的技术选择：
- **语言**: TypeScript
- **构建**: tsup + Turborepo
- **测试**: Vitest + Jest
- **文档**: Markdown + AI 上下文

这个 AI 上下文系统确保了项目信息的完整性和一致性，为 AI 辅助开发提供了强大的支持。
`
    
    fs.writeFileSync(readmePath, content)
    console.log('✅ 已更新 AI 上下文 README.md')
  }

  /**
   * 主清理流程
   */
  async cleanup() {
    try {
      console.log('🚀 开始文档清理和整理...\n')

      // 1. 备份现有文档
      this.backupExistingDocs()

      // 2. 清理重复目录
      this.cleanupDuplicates()

      // 3. 重新组织文档结构
      this.reorganizeDocs()

      // 4. 更新根目录 README
      this.updateRootReadme()

      // 5. 更新包的 README
      this.updatePackageReadmes()

      // 6. 更新应用的 README
      this.updateAppReadmes()

      // 7. 更新 AI 上下文
      this.updateAiContext()

      console.log('\n🎉 文档清理和整理完成！')
      console.log('\n📁 备份位置:', this.backupDir)
      console.log('\n下一步:')
      console.log('1. 检查更新后的文档')
      console.log('2. 完善具体的文档内容')
      console.log('3. 提交文档变更')

    } catch (error) {
      console.error('❌ 清理失败:', error.message)
      process.exit(1)
    }
  }
}

// 运行清理
if (require.main === module) {
  const cleaner = new DocumentationCleaner()
  cleaner.cleanup()
}

module.exports = { DocumentationCleaner }
