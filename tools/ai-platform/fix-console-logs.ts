#!/usr/bin/env bun
/**
 * 批量修复tools/ai-platform中的console.log违规
 * 全部替换为@linch-kit/core createLogger()
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join, dirname, basename } from 'path'

const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[WARN] ${msg}`, ...args)
}

// 需要修复的文件列表
const filesToFix = [
  'src/guardian/security-sentinel.ts',
  'src/guardian/decision-council.ts',
  'src/guardian/evolution-engine.ts',
  'src/guardian/pre-check.guardian.ts',
  'src/guardian/qa-synthesizer.ts',
  'src/guardian/quality-gate.guardian.ts',
  'src/guardian/context-verifier.ts',
  'src/guardian/meta-learner.ts',
  'src/generation/vibe-coding-engine.ts',
  'src/cli/claude-context.ts',
  'src/cli/commands/context.ts',
  'src/cli/commands/extract.ts',
  'src/cli/commands/query.ts',
  'src/cli/main.ts',
  'src/context/context-query-tool.ts',
  'cli.ts',
  'scripts/decision-council.js',
  'scripts/deps-check.js',
  'scripts/evolution-engine.js',
  'scripts/guardian-validate.js',
  'scripts/pre-check.js',
  'scripts/qa-synthesizer.js',
  'scripts/quality-gate.js',
  'scripts/security-sentinel.js',
  'scripts/arch-check.js',
  'scripts/context-verifier.js',
  'scripts/meta-learner.js',
  'scripts/graph-data-extractor.js',
  'scripts/session-tools.js',
  'scripts/context-cli.js'
]

// 常见的console.log模式
const consolePatterns = [
  // 简单的临时logger对象
  {
    pattern: /\/\/ 临时使用console\.log[^]*?const logger = \{[^}]*console\.log[^}]*\}/gm,
    replacement: "import { createLogger } from '@linch-kit/core'\n\nconst logger = createLogger({ name: 'PLACEHOLDER_NAME' })"
  },
  // 另一种临时logger模式
  {
    pattern: /\/\/ 临时简单日志实现[^]*?const logger = \{[^}]*console\.[^}]*\};?/gm,
    replacement: "import { createLogger } from '@linch-kit/core'\n\nconst logger = createLogger({ name: 'PLACEHOLDER_NAME' });"
  },
  // 直接的console.log调用
  {
    pattern: /console\.log\(/g,
    replacement: "logger.info("
  },
  // console.error调用
  {
    pattern: /console\.error\(/g,
    replacement: "logger.error("
  },
  // console.warn调用
  {
    pattern: /console\.warn\(/g,
    replacement: "logger.warn("
  },
  // console.debug调用
  {
    pattern: /console\.debug\(/g,
    replacement: "logger.debug("
  }
]

/**
 * 修复单个文件
 */
async function fixFile(filePath: string): Promise<void> {
  try {
    const content = await readFile(filePath, 'utf-8')
    let fixedContent = content
    let hasChanges = false

    // 应用所有修复模式
    for (const { pattern, replacement } of consolePatterns) {
      const newContent = fixedContent.replace(pattern, replacement)
      if (newContent !== fixedContent) {
        fixedContent = newContent
        hasChanges = true
      }
    }

    // 为每个文件设置正确的logger名称
    const fileName = basename(filePath, '.ts').replace(/\./g, '-')
    const loggerName = fileName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    fixedContent = fixedContent.replace(/name: 'PLACEHOLDER_NAME'/g, `name: '${loggerName}'`)

    // 确保导入语句在正确位置
    if (hasChanges && fixedContent.includes("import { createLogger }")) {
      // 移动import到文件顶部
      const lines = fixedContent.split('\n')
      const importLine = lines.find(line => line.includes("import { createLogger }"))
      if (importLine) {
        // 移除原位置的import
        fixedContent = fixedContent.replace(importLine + '\n', '')
        
        // 找到合适的位置插入import（在其他import之后）
        const importIndex = lines.findIndex(line => line.startsWith('import ') && !line.includes('createLogger'))
        if (importIndex !== -1) {
          lines.splice(importIndex + 1, 0, importLine)
          fixedContent = lines.join('\n')
        } else {
          // 如果没有其他import，插入到文件开头
          fixedContent = importLine + '\n\n' + fixedContent
        }
      }
    }

    if (hasChanges) {
      await writeFile(filePath, fixedContent)
      logger.info(`✅ 修复完成: ${filePath}`)
    } else {
      logger.info(`⏭️ 无需修复: ${filePath}`)
    }
  } catch (error) {
    logger.error(`❌ 修复失败: ${filePath}`, error)
    throw error
  }
}

/**
 * 批量修复所有文件
 */
async function fixAllFiles(): Promise<void> {
  const baseDir = dirname(import.meta.url.replace('file://', ''))
  let fixedCount = 0
  let skippedCount = 0
  let errorCount = 0

  logger.info('🔧 开始批量修复console.log违规...')
  logger.info(`📁 基础目录: ${baseDir}`)
  logger.info(`📋 待修复文件: ${filesToFix.length}个`)

  for (const file of filesToFix) {
    const filePath = join(baseDir, file)
    
    try {
      // 检查文件是否存在
      const stats = await stat(filePath)
      if (!stats.isFile()) {
        logger.warn(`⚠️ 跳过非文件: ${filePath}`)
        skippedCount++
        continue
      }

      await fixFile(filePath)
      fixedCount++
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        logger.warn(`⚠️ 文件不存在: ${filePath}`)
        skippedCount++
      } else {
        logger.error(`❌ 处理文件失败: ${filePath}`, error)
        errorCount++
      }
    }
  }

  logger.info('\n📊 修复完成统计:')
  logger.info(`✅ 成功修复: ${fixedCount}个文件`)
  logger.info(`⏭️ 跳过文件: ${skippedCount}个文件`)
  logger.info(`❌ 失败文件: ${errorCount}个文件`)

  if (errorCount > 0) {
    throw new Error(`修复过程中有 ${errorCount} 个文件失败`)
  }
}

// 执行修复
if (import.meta.main) {
  fixAllFiles()
    .then(() => {
      logger.info('🎉 所有console.log违规修复完成!')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('💥 批量修复失败:', error)
      process.exit(1)
    })
}