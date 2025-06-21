#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

/**
 * 文档迁移脚本
 * 
 * 功能：
 * 1. 备份现有文档
 * 2. 迁移到新结构
 * 3. 清理重复内容
 * 4. 验证迁移结果
 */

class DocumentationMigrator {
  constructor() {
    this.rootDir = process.cwd()
    this.oldDocsDir = path.join(this.rootDir, 'docs')
    this.oldAiContextDir = path.join(this.rootDir, 'ai-context')
    this.newDocsDir = path.join(this.rootDir, 'docs-new')
    this.newAiContextDir = path.join(this.rootDir, 'ai-context-new')
    this.backupDir = path.join(this.rootDir, 'docs-backup')
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
   * 复制文件
   */
  copyFile(src, dest) {
    this.ensureDir(path.dirname(dest))
    fs.copyFileSync(src, dest)
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
        this.copyFile(srcPath, destPath)
      }
    })
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
   * 备份现有文档
   */
  backupExistingDocs() {
    console.log('📦 备份现有文档...')

    // 创建备份目录
    this.ensureDir(this.backupDir)

    // 备份 docs
    if (this.exists(this.oldDocsDir)) {
      this.copyDir(this.oldDocsDir, path.join(this.backupDir, 'docs'))
      console.log('✅ 已备份 docs/ 目录')
    }

    // 备份 ai-context
    if (this.exists(this.oldAiContextDir)) {
      this.copyDir(this.oldAiContextDir, path.join(this.backupDir, 'ai-context'))
      console.log('✅ 已备份 ai-context/ 目录')
    }

    console.log(`📁 备份保存在: ${this.backupDir}`)
  }

  /**
   * 迁移到新结构
   */
  migrateToNewStructure() {
    console.log('\n🔄 迁移到新文档结构...')

    // 删除旧目录
    this.removeDir(this.oldDocsDir)
    this.removeDir(this.oldAiContextDir)

    // 移动新目录
    if (this.exists(this.newDocsDir)) {
      fs.renameSync(this.newDocsDir, this.oldDocsDir)
      console.log('✅ 已迁移用户文档')
    }

    if (this.exists(this.newAiContextDir)) {
      fs.renameSync(this.newAiContextDir, this.oldAiContextDir)
      console.log('✅ 已迁移 AI 上下文文档')
    }
  }

  /**
   * 创建缺失的文档
   */
  createMissingDocs() {
    console.log('\n📝 创建缺失的文档...')

    const missingDocs = [
      // 用户文档
      'docs/getting-started/installation.md',
      'docs/getting-started/first-project.md',
      'docs/guides/package-development.md',
      'docs/guides/deployment.md',
      'docs/guides/debugging.md',
      'docs/architecture/packages.md',
      'docs/architecture/build-system.md',
      'docs/architecture/plugin-system.md',
      'docs/api/types/README.md',
      'docs/api/auth-core/README.md',
      'docs/api/schema/README.md',
      'docs/api/trpc/README.md',
      'docs/api/crud/README.md',
      'docs/api/ui/README.md',
      'docs/examples/basic-usage/README.md',
      'docs/examples/advanced/README.md',
      'docs/examples/integrations/README.md',
      'docs/contributing/development.md',
      'docs/contributing/testing.md',
      'docs/contributing/release.md',

      // AI 上下文文档
      'ai-context/system/dependencies.md',
      'ai-context/system/deployment.md',
      'ai-context/packages/types.md',
      'ai-context/packages/auth-core.md',
      'ai-context/packages/schema.md',
      'ai-context/packages/trpc.md',
      'ai-context/packages/crud.md',
      'ai-context/packages/ui.md',
      'ai-context/decisions/tech-stack.md',
      'ai-context/decisions/architecture.md',
      'ai-context/decisions/tooling.md',
      'ai-context/decisions/patterns.md',
      'ai-context/workflows/testing.md',
      'ai-context/workflows/release.md',
      'ai-context/workflows/maintenance.md',
      'ai-context/templates/package-template.md',
      'ai-context/templates/api-design.md',
      'ai-context/templates/documentation.md',
      'ai-context/templates/code-style.md',
      'ai-context/progress/current-status.md',
      'ai-context/progress/roadmap.md',
      'ai-context/progress/milestones.md',
      'ai-context/progress/changelog.md'
    ]

    missingDocs.forEach(docPath => {
      const fullPath = path.join(this.rootDir, docPath)
      if (!this.exists(fullPath)) {
        this.ensureDir(path.dirname(fullPath))
        
        // 创建基础模板
        const template = this.createDocTemplate(docPath)
        fs.writeFileSync(fullPath, template)
        
        console.log(`📄 已创建: ${docPath}`)
      }
    })
  }

  /**
   * 创建文档模板
   */
  createDocTemplate(docPath) {
    const fileName = path.basename(docPath, '.md')
    const title = fileName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')

    return `# ${title}

## 概述

TODO: 添加文档内容

## 相关链接

- [项目主页](../README.md)
- [GitHub 仓库](https://github.com/your-org/linch-kit)

## 更新记录

- ${new Date().toISOString().split('T')[0]}: 创建文档
`
  }

  /**
   * 验证迁移结果
   */
  validateMigration() {
    console.log('\n🔍 验证迁移结果...')

    const checks = [
      {
        name: '用户文档目录',
        path: this.oldDocsDir,
        required: true
      },
      {
        name: 'AI 上下文目录',
        path: this.oldAiContextDir,
        required: true
      },
      {
        name: '文档导航文件',
        path: path.join(this.oldDocsDir, 'README.md'),
        required: true
      },
      {
        name: 'AI 上下文说明',
        path: path.join(this.oldAiContextDir, 'README.md'),
        required: true
      },
      {
        name: '快速开始指南',
        path: path.join(this.oldDocsDir, 'getting-started/quick-start.md'),
        required: true
      },
      {
        name: '架构概览',
        path: path.join(this.oldDocsDir, 'architecture/overview.md'),
        required: true
      },
      {
        name: 'Monorepo 管理指南',
        path: path.join(this.oldDocsDir, 'guides/monorepo-management.md'),
        required: true
      }
    ]

    let allPassed = true

    checks.forEach(check => {
      const exists = this.exists(check.path)
      const status = exists ? '✅' : '❌'
      console.log(`${status} ${check.name}: ${check.path}`)
      
      if (check.required && !exists) {
        allPassed = false
      }
    })

    if (allPassed) {
      console.log('\n🎉 迁移验证通过！')
    } else {
      console.log('\n⚠️ 迁移验证失败，请检查缺失的文件')
    }

    return allPassed
  }

  /**
   * 生成迁移报告
   */
  generateMigrationReport() {
    console.log('\n📊 生成迁移报告...')

    const report = {
      timestamp: new Date().toISOString(),
      backup_location: this.backupDir,
      new_structure: {
        docs: this.oldDocsDir,
        ai_context: this.oldAiContextDir
      },
      files_migrated: this.countFiles(this.oldDocsDir) + this.countFiles(this.oldAiContextDir),
      status: 'completed'
    }

    const reportPath = path.join(this.rootDir, 'migration-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`📄 迁移报告已保存: ${reportPath}`)
    return report
  }

  /**
   * 统计文件数量
   */
  countFiles(dirPath) {
    if (!this.exists(dirPath)) return 0

    let count = 0
    const items = fs.readdirSync(dirPath)

    items.forEach(item => {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        count += this.countFiles(itemPath)
      } else {
        count++
      }
    })

    return count
  }

  /**
   * 主迁移流程
   */
  async migrate() {
    try {
      console.log('🚀 开始文档迁移...\n')

      // 1. 备份现有文档
      this.backupExistingDocs()

      // 2. 迁移到新结构
      this.migrateToNewStructure()

      // 3. 创建缺失的文档
      this.createMissingDocs()

      // 4. 验证迁移结果
      const isValid = this.validateMigration()

      // 5. 生成迁移报告
      const report = this.generateMigrationReport()

      if (isValid) {
        console.log('\n🎉 文档迁移完成！')
        console.log('\n下一步:')
        console.log('1. 检查新的文档结构')
        console.log('2. 完善缺失的文档内容')
        console.log('3. 更新相关链接和引用')
        console.log('4. 提交文档变更')
      } else {
        console.log('\n⚠️ 迁移过程中发现问题，请检查并修复')
      }

    } catch (error) {
      console.error('❌ 迁移失败:', error.message)
      console.log('\n🔄 正在恢复备份...')
      
      // 恢复备份
      if (this.exists(this.backupDir)) {
        this.removeDir(this.oldDocsDir)
        this.removeDir(this.oldAiContextDir)
        this.copyDir(path.join(this.backupDir, 'docs'), this.oldDocsDir)
        this.copyDir(path.join(this.backupDir, 'ai-context'), this.oldAiContextDir)
        console.log('✅ 已恢复原始文档')
      }
      
      process.exit(1)
    }
  }
}

// 运行迁移
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrator = new DocumentationMigrator()
  migrator.migrate()
}

export { DocumentationMigrator }
