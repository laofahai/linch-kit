#!/usr/bin/env bun
/**
 * LinchKit Documentation Version Consistency Checker
 * 检查所有文档版本号与主包版本的一致性
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

interface VersionInfo {
  file: string;
  line: number;
  current: string;
  expected: string;
  needsUpdate: boolean;
}

class DocumentVersionChecker {
  private projectRoot: string;
  private targetVersion: string;
  private issues: VersionInfo[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.targetVersion = '';
  }

  async getTargetVersion(): Promise<string> {
    try {
      // 从 @linch-kit/ui 包获取目标版本 (最高版本)
      const uiPackageJson = await readFile(
        join(this.projectRoot, 'packages/ui/package.json'),
        'utf-8'
      );
      const uiPackage = JSON.parse(uiPackageJson);
      this.targetVersion = uiPackage.version;
      return this.targetVersion;
    } catch (error) {
      console.error('❌ 无法读取UI包版本:', error);
      throw error;
    }
  }

  async findDocumentationFiles(): Promise<string[]> {
    const patterns = [
      'README.md',
      'DESIGN.md',
      'CLAUDE.md',
      'CONTRIBUTING.md',
      'ai-context/**/*.md',
      'packages/**/*.md',
      'apps/**/*.md',
      'extensions/**/*.md',
      'tools/**/*.md',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/.git/**'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matched = await glob(pattern, { 
        cwd: this.projectRoot,
        absolute: true 
      });
      files.push(...matched);
    }

    return files;
  }

  async checkVersionInFile(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const fileName = filePath.split('/').pop() || '';

      // 跳过CHANGELOG文件和node_modules中的文件
      if (fileName.includes('CHANGELOG') || filePath.includes('node_modules')) {
        return;
      }

      lines.forEach((line, index) => {
        // 只检查文档标题中的版本号，前10行内
        if (index >= 10) return;
        
        // 匹配文档标题版本号模式
        const versionMatches = [
          /\*\*版本\*\*:\s*v?(\d+\.\d+(?:\.\d+)?)/,
          /\*\*项目版本\*\*:\s*v?(\d+\.\d+(?:\.\d+)?)/,
          /\*\*Project Version\*\*:\s*v?(\d+\.\d+(?:\.\d+)?)/,
          /#.*v(\d+\.\d+(?:\.\d+)?)$/  // 标题中的版本号，行末
        ];

        for (const regex of versionMatches) {
          const match = line.match(regex);
          if (match) {
            const currentVersion = match[1];
            const needsUpdate = currentVersion !== this.targetVersion;
            
            this.issues.push({
              file: filePath.replace(this.projectRoot + '/', ''),
              line: index + 1,
              current: currentVersion,
              expected: this.targetVersion,
              needsUpdate
            });
            break; // 只记录每行第一个匹配
          }
        }
      });
    } catch (error) {
      console.warn(`⚠️ 无法读取文件 ${filePath}:`, error);
    }
  }

  async fixVersionInFile(filePath: string, issue: VersionInfo): Promise<boolean> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const targetLine = lines[issue.line - 1];

      // 替换版本号，保持格式
      const updatedLine = targetLine.replace(
        new RegExp(`v?${issue.current.replace('.', '\\.')}`),
        `v${this.targetVersion}`
      );

      if (updatedLine !== targetLine) {
        lines[issue.line - 1] = updatedLine;
        await writeFile(filePath, lines.join('\n'), 'utf-8');
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ 修复文件失败 ${filePath}:`, error);
      return false;
    }
  }

  async run(fix: boolean = false): Promise<void> {
    console.log('🔍 LinchKit 文档版本一致性检查开始...\n');

    // 获取目标版本
    await this.getTargetVersion();
    console.log(`📋 目标版本: v${this.targetVersion}\n`);

    // 查找所有文档文件
    const files = await this.findDocumentationFiles();
    console.log(`📄 找到 ${files.length} 个文档文件\n`);

    // 检查每个文件
    for (const file of files) {
      await this.checkVersionInFile(file);
    }

    // 统计结果
    const inconsistent = this.issues.filter(issue => issue.needsUpdate);
    const consistent = this.issues.filter(issue => !issue.needsUpdate);

    console.log('📊 检查结果:');
    console.log(`✅ 版本一致: ${consistent.length} 个`);
    console.log(`❌ 版本不一致: ${inconsistent.length} 个\n`);

    if (inconsistent.length === 0) {
      console.log('🎉 所有文档版本号已保持一致!');
      return;
    }

    // 显示不一致的文件
    console.log('❌ 版本不一致的文件:');
    inconsistent.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - 当前: v${issue.current}, 应为: v${issue.expected}`);
    });
    console.log();

    // 如果指定修复
    if (fix) {
      console.log('🔧 开始修复版本不一致问题...\n');
      let fixedCount = 0;

      for (const issue of inconsistent) {
        const filePath = join(this.projectRoot, issue.file);
        const success = await this.fixVersionInFile(filePath, issue);
        if (success) {
          fixedCount++;
          console.log(`✅ 已修复: ${issue.file}:${issue.line}`);
        } else {
          console.log(`❌ 修复失败: ${issue.file}:${issue.line}`);
        }
      }

      console.log(`\n🎉 修复完成! 共修复 ${fixedCount}/${inconsistent.length} 个问题`);
    } else {
      console.log('💡 运行 `bun run docs:version-check --fix` 自动修复版本不一致问题');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix') || args.includes('-f');
  
  try {
    const checker = new DocumentVersionChecker();
    await checker.run(fix);
    
    // 如果有不一致且未修复，则退出码为1
    if (!fix) {
      const inconsistentCount = checker['issues'].filter(i => i.needsUpdate).length;
      process.exit(inconsistentCount > 0 ? 1 : 0);
    }
  } catch (error) {
    console.error('❌ 版本检查失败:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { DocumentVersionChecker };