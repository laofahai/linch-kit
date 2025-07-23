#!/usr/bin/env bun
/**
 * LinchKit AI 自动清理系统
 * 清理开发过程中产生的临时文件、测试文件和过程性脚本
 */

import { existsSync, readFileSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { createLogger } from '@linch-kit/core';

const logger = createLogger('auto-cleanup');

interface CleanupRule {
  pattern: RegExp;
  description: string;
  maxAge?: number; // 文件最大存活时间（小时）
  whitelist?: string[]; // 白名单文件
  condition?: (filePath: string) => boolean; // 额外条件
}

class AutoCleanupSystem {
  private projectRoot: string;
  private dryRun: boolean;
  private cleanupRules: CleanupRule[];

  constructor(dryRun = false) {
    this.projectRoot = process.cwd();
    this.dryRun = dryRun;
    this.cleanupRules = this.defineCleanupRules();
  }

  private defineCleanupRules(): CleanupRule[] {
    return [
      // 1. 测试文件和临时文件
      {
        pattern: /^test-.*\.(md|ts|js|json)$/,
        description: '测试和调试文件',
        maxAge: 24, // 24小时后清理
        whitelist: ['test-hooks.md'] // 保留重要的测试文件
      },
      
      // 2. 版本化文件（v2, v3等）
      {
        pattern: /.*-v\d+\.(ts|js|md)$/,
        description: '版本化的过程性文件',
        maxAge: 48,
        condition: (filePath) => {
          // 只清理非生产版本
          return !filePath.includes('/dist/') && !filePath.includes('package.json');
        }
      },
      
      // 3. 临时脚本和工具
      {
        pattern: /^(temp|tmp|debug|example)-.*\.(ts|js|md)$/,
        description: '临时脚本和示例文件',
        maxAge: 12
      },
      
      // 4. 日志和缓存文件
      {
        pattern: /\.(log|cache|tmp)$/,
        description: '日志和缓存文件',
        maxAge: 72
      },
      
      // 5. Claude 会话相关的临时文件
      {
        pattern: /^claude-.*\.(md|json|txt)$/,
        description: 'Claude会话临时文件',
        maxAge: 168, // 一周
        whitelist: ['.claude/settings.json', '.claude/commands/']
      },
      
      // 6. 空的或无用的文件
      {
        pattern: /.*\.(md|txt)$/,
        description: '空文件或占位符文件',
        condition: (filePath) => {
          try {
            const content = readFileSync(filePath, 'utf-8').trim();
            return content.length === 0 || 
                   content === '# TODO' || 
                   content === '// TODO' ||
                   content.includes('占位符') ||
                   content.includes('placeholder');
          } catch {
            return false;
          }
        }
      }
    ];
  }

  async cleanup(): Promise<void> {
    logger.info(`🧹 开始智能清理系统 ${this.dryRun ? '(预览模式)' : ''}`);
    
    const stats = {
      scanned: 0,
      matched: 0,
      cleaned: 0,
      skipped: 0,
      errors: 0
    };

    // 扫描目录
    const dirsToScan = [
      '.',
      'tools/ai-platform',
      'packages',
      'apps',
      '.claude'
    ];

    for (const dir of dirsToScan) {
      const fullDir = join(this.projectRoot, dir);
      if (existsSync(fullDir)) {
        await this.scanDirectory(fullDir, stats);
      }
    }

    this.printStats(stats);
  }

  private async scanDirectory(dir: string, stats: any): Promise<void> {
    try {
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 跳过某些目录
          if (!this.shouldSkipDirectory(item)) {
            await this.scanDirectory(fullPath, stats);
          }
        } else {
          stats.scanned++;
          await this.checkFile(fullPath, stats);
        }
      }
    } catch (error) {
      logger.error(`扫描目录失败 ${dir}: ${error.message}`);
      stats.errors++;
    }
  }

  private shouldSkipDirectory(dirname: string): boolean {
    const skipDirs = [
      'node_modules', '.git', 'dist', 'build', 'coverage',
      '.next', '.turbo', '.cache', 'tmp'
    ];
    return skipDirs.includes(dirname);
  }

  private async checkFile(filePath: string, stats: any): Promise<void> {
    const fileName = basename(filePath);
    const relativePath = filePath.replace(this.projectRoot + '/', '');
    
    for (const rule of this.cleanupRules) {
      if (rule.pattern.test(fileName)) {
        stats.matched++;
        
        // 检查白名单
        if (rule.whitelist && rule.whitelist.some(w => filePath.includes(w))) {
          logger.info(`📋 跳过白名单文件: ${relativePath}`);
          stats.skipped++;
          continue;
        }
        
        // 检查文件年龄
        if (rule.maxAge && !this.isFileOld(filePath, rule.maxAge)) {
          logger.info(`⏰ 文件太新，跳过: ${relativePath}`);
          stats.skipped++;
          continue;
        }
        
        // 检查额外条件
        if (rule.condition && !rule.condition(filePath)) {
          logger.info(`❌ 不满足条件，跳过: ${relativePath}`);
          stats.skipped++;
          continue;
        }
        
        // 执行清理
        if (this.dryRun) {
          logger.info(`🔍 [预览] 将清理: ${relativePath} (${rule.description})`);
        } else {
          try {
            unlinkSync(filePath);
            logger.info(`🗑️  已清理: ${relativePath} (${rule.description})`);
            stats.cleaned++;
          } catch (error) {
            logger.error(`清理失败 ${relativePath}: ${error.message}`);
            stats.errors++;
          }
        }
        break; // 只应用第一个匹配的规则
      }
    }
  }

  private isFileOld(filePath: string, maxAgeHours: number): boolean {
    try {
      const stat = statSync(filePath);
      const ageMs = Date.now() - stat.mtime.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      return ageHours > maxAgeHours;
    } catch {
      return false;
    }
  }

  private printStats(stats: any): void {
    logger.info('\n📊 清理统计:');
    logger.info(`   扫描文件: ${stats.scanned}`);
    logger.info(`   匹配规则: ${stats.matched}`);
    logger.info(`   已清理: ${stats.cleaned}`);
    logger.info(`   跳过: ${stats.skipped}`);
    logger.info(`   错误: ${stats.errors}`);
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('--preview');
  const help = args.includes('--help') || args.includes('-h');
  
  if (help) {
    console.log(`
LinchKit AI 自动清理系统

用法:
  bun run auto-cleanup                # 执行清理
  bun run auto-cleanup --dry-run      # 预览模式（不实际删除）
  bun run auto-cleanup --preview      # 同 --dry-run
  bun run auto-cleanup --help         # 显示帮助

清理规则:
  • 测试文件 (test-*.*)：24小时后清理
  • 版本文件 (*-v*.*)：48小时后清理
  • 临时文件 (temp-*, tmp-*, debug-*)：12小时后清理
  • 日志缓存 (*.log, *.cache)：72小时后清理
  • 空文件和占位符文件：立即清理
    `);
    return;
  }
  
  const cleaner = new AutoCleanupSystem(dryRun);
  await cleaner.cleanup();
}

if (require.main === module) {
  main().catch(console.error);
}

export { AutoCleanupSystem };