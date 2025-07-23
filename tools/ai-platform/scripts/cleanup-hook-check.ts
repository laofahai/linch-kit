#!/usr/bin/env bun
/**
 * LinchKit Hook 清理检查器
 * 
 * 判断逻辑：
 * 1. 检测到过多临时文件时，返回失败并提醒用户
 * 2. 不自动删除，让用户自主决定
 * 3. 避免在开发过程中创建更多临时文件
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { createLogger } from '@linch-kit/core';

const logger = createLogger('cleanup-hook');

class CleanupHookChecker {
  private projectRoot = process.cwd();
  private thresholds = {
    maxTestFiles: 15,        // 超过15个test-*文件就提醒
    maxDebugFiles: 5,        // 超过5个debug-*文件就提醒  
    maxVersionFiles: 8,      // 超过8个版本文件就提醒
    maxEmptyFiles: 5,        // 超过5个空文件就提醒
    maxWorkflowStates: 20    // 超过20个工作流状态文件就提醒
  };

  async check(): Promise<{ needsCleanup: boolean; issues: string[]; counts: any }> {
    const issues: string[] = [];
    const counts = {
      testFiles: 0,
      debugFiles: 0, 
      versionFiles: 0,
      emptyFiles: 0,
      workflowStates: 0,
      logFiles: 0
    };

    await this.scanDirectory('.', counts, issues);
    
    const needsCleanup = this.evaluateCleanupNeed(counts, issues);
    
    return { needsCleanup, issues, counts };
  }

  private async scanDirectory(dir: string, counts: any, issues: string[]): Promise<void> {
    try {
      const fullDir = join(this.projectRoot, dir);
      const items = readdirSync(fullDir);
      
      for (const item of items) {
        const fullPath = join(fullDir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!this.shouldSkipDirectory(item)) {
            await this.scanDirectory(join(dir, item), counts, issues);
          }
        } else {
          this.analyzeFile(fullPath, dir, item, counts, issues);
        }
      }
    } catch (error) {
      // 静默跳过无法访问的目录
    }
  }

  private shouldSkipDirectory(dirname: string): boolean {
    return ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.turbo'].includes(dirname);
  }

  private analyzeFile(fullPath: string, dir: string, filename: string, counts: any, issues: string[]): void {
    const relativePath = join(dir, filename).replace(/^\.\//, '');
    
    // 1. 测试文件检查
    if (/^test-.*\.(ts|js|md)$/.test(filename)) {
      counts.testFiles++;
    }

    // 2. 调试文件检查  
    if (/^debug-.*\.(ts|js)$/.test(filename)) {
      counts.debugFiles++;
    }

    // 3. 版本文件检查
    if (/-v\d+\.(ts|js|md)$/.test(filename)) {
      counts.versionFiles++;
    }

    // 4. 工作流状态文件检查
    if (relativePath.includes('workflow-states') || relativePath.includes('test-workflow')) {
      counts.workflowStates++;
    }

    // 5. 日志文件检查
    if (/\.(log|cache)$/.test(filename)) {
      counts.logFiles++;
    }

    // 6. 空文件检查
    if (/\.(md|txt)$/.test(filename)) {
      try {
        const content = readFileSync(fullPath, 'utf-8').trim();
        if (content.length === 0 || content === '# TODO' || content.includes('占位符')) {
          counts.emptyFiles++;
        }
      } catch {
        // 跳过无法读取的文件
      }
    }
  }

  private evaluateCleanupNeed(counts: any, issues: string[]): boolean {
    let needsCleanup = false;

    // 判断逻辑1: 测试文件过多
    if (counts.testFiles > this.thresholds.maxTestFiles) {
      issues.push(`🧪 发现 ${counts.testFiles} 个测试文件 (建议<${this.thresholds.maxTestFiles})`);
      needsCleanup = true;
    }

    // 判断逻辑2: 调试文件积累
    if (counts.debugFiles > this.thresholds.maxDebugFiles) {
      issues.push(`🔧 发现 ${counts.debugFiles} 个调试文件 (建议<${this.thresholds.maxDebugFiles})`);
      needsCleanup = true;
    }

    // 判断逻辑3: 版本文件堆积  
    if (counts.versionFiles > this.thresholds.maxVersionFiles) {
      issues.push(`📦 发现 ${counts.versionFiles} 个版本文件 (建议<${this.thresholds.maxVersionFiles})`);
      needsCleanup = true;
    }

    // 判断逻辑4: 空文件过多
    if (counts.emptyFiles > this.thresholds.maxEmptyFiles) {
      issues.push(`🗑️ 发现 ${counts.emptyFiles} 个空/占位符文件 (建议<${this.thresholds.maxEmptyFiles})`);
      needsCleanup = true;
    }

    // 判断逻辑5: 工作流状态文件过多  
    if (counts.workflowStates > this.thresholds.maxWorkflowStates) {
      issues.push(`⚙️ 发现 ${counts.workflowStates} 个工作流状态文件 (建议<${this.thresholds.maxWorkflowStates})`);
      needsCleanup = true;
    }

    // 判断逻辑6: 综合评估 - 文件总数过多
    const totalIssueFiles = counts.testFiles + counts.debugFiles + counts.versionFiles + counts.emptyFiles;
    if (totalIssueFiles > 30) {
      issues.push(`📊 临时文件总数过多: ${totalIssueFiles} 个`);
      needsCleanup = true;
    }

    return needsCleanup;
  }
}

// 主执行逻辑
async function main() {
  const checker = new CleanupHookChecker();
  const result = await checker.check();
  
  if (result.needsCleanup) {
    // 返回失败状态，阻止操作继续
    logger.error('🚨 项目需要清理！');
    logger.error('');
    logger.error('发现的问题:');
    result.issues.forEach(issue => logger.error(`  • ${issue}`));
    logger.error('');
    logger.error('建议操作:');
    logger.error('  1. 运行 `bun run cleanup:preview` 查看详细清理列表');
    logger.error('  2. 运行 `bun run cleanup` 执行自动清理');
    logger.error('  3. 或使用 `/cleanup` 命令进行交互式清理');
    logger.error('');
    logger.error('💡 提示: 清理后可减少token消耗并提高开发效率');
    
    process.exit(2); // exit(2) = 阻塞错误，真正中断Claude操作
  } else {
    // 静默通过，不打印任何内容
    process.exit(0);
  }
}

if (import.meta.main) {
  main().catch(() => process.exit(1));
}