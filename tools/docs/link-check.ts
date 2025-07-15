#!/usr/bin/env bun
/**
 * LinchKit Documentation Link Integrity Checker
 * 检查文档中的内部和外部链接完整性
 */

import { readFile, access, constants } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { glob } from 'glob';

interface LinkIssue {
  file: string;
  line: number;
  link: string;
  type: 'internal' | 'external';
  issue: string;
  severity: 'error' | 'warning';
}

class DocumentLinkChecker {
  private projectRoot: string;
  private issues: LinkIssue[] = [];
  private checkedUrls = new Map<string, boolean>();

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
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

  async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async checkExternalUrl(url: string): Promise<boolean> {
    // 使用缓存避免重复检查
    if (this.checkedUrls.has(url)) {
      return this.checkedUrls.get(url)!;
    }

    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'LinchKit-Doc-Checker/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      });
      
      const isOk = response.ok;
      this.checkedUrls.set(url, isOk);
      return isOk;
    } catch (error) {
      this.checkedUrls.set(url, false);
      return false;
    }
  }

  extractLinksFromContent(content: string): Array<{link: string, line: number, type: 'internal' | 'external'}> {
    const links: Array<{link: string, line: number, type: 'internal' | 'external'}> = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Markdown链接: [text](url)
      const markdownLinks = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (markdownLinks) {
        markdownLinks.forEach(match => {
          const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            const url = linkMatch[2];
            const type = url.startsWith('http') ? 'external' : 'internal';
            links.push({ link: url, line: index + 1, type });
          }
        });
      }

      // HTML链接: <a href="url">
      const htmlLinks = line.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/g);
      if (htmlLinks) {
        htmlLinks.forEach(match => {
          const hrefMatch = match.match(/href=["']([^"']+)["']/);
          if (hrefMatch) {
            const url = hrefMatch[1];
            const type = url.startsWith('http') ? 'external' : 'internal';
            links.push({ link: url, line: index + 1, type });
          }
        });
      }

      // 相对路径引用 (仅作为内部链接处理)
      const relativeRefs = line.match(/→\s*`([^`]+\.md)`/g);
      if (relativeRefs) {
        relativeRefs.forEach(match => {
          const refMatch = match.match(/→\s*`([^`]+\.md)`/);
          if (refMatch) {
            links.push({ link: refMatch[1], line: index + 1, type: 'internal' });
          }
        });
      }
    });

    return links;
  }

  async checkLinksInFile(filePath: string): Promise<void> {
    try {
      // 跳过node_modules中的文件
      if (filePath.includes('node_modules')) {
        return;
      }

      const content = await readFile(filePath, 'utf-8');
      const links = this.extractLinksFromContent(content);
      const fileDir = dirname(filePath);
      const relativePath = filePath.replace(this.projectRoot + '/', '');

      for (const link of links) {
        if (link.type === 'internal') {
          await this.checkInternalLink(relativePath, fileDir, link);
        } else {
          await this.checkExternalLink(relativePath, link);
        }
      }
    } catch (error) {
      console.warn(`⚠️ 无法读取文件 ${filePath}:`, error);
    }
  }

  async checkInternalLink(filePath: string, fileDir: string, link: {link: string, line: number}): Promise<void> {
    try {
      let targetPath: string;

      // 处理不同类型的内部链接
      if (link.link.startsWith('./') || link.link.startsWith('../')) {
        // 相对路径
        targetPath = resolve(fileDir, link.link);
      } else if (link.link.startsWith('/')) {
        // 绝对路径（从项目根开始）
        targetPath = join(this.projectRoot, link.link.substring(1));
      } else {
        // 相对路径（相对于当前文件）
        targetPath = resolve(fileDir, link.link);
      }

      // 去掉anchor部分 (#section)
      const cleanPath = targetPath.split('#')[0];
      
      const exists = await this.checkFileExists(cleanPath);
      if (!exists) {
        this.issues.push({
          file: filePath,
          line: link.line,
          link: link.link,
          type: 'internal',
          issue: `文件不存在: ${cleanPath.replace(this.projectRoot + '/', '')}`,
          severity: 'error'
        });
      }
    } catch (error) {
      this.issues.push({
        file: filePath,
        line: link.line,
        link: link.link,
        type: 'internal',
        issue: `路径解析错误: ${error}`,
        severity: 'error'
      });
    }
  }

  async checkExternalLink(filePath: string, link: {link: string, line: number}): Promise<void> {
    // 跳过一些明显的占位符或模板URL
    const skipPatterns = [
      'https://example.com',
      'http://localhost',
      'https://your-domain.com'
    ];

    if (skipPatterns.some(pattern => link.link.includes(pattern))) {
      return;
    }

    const isAccessible = await this.checkExternalUrl(link.link);
    if (!isAccessible) {
      this.issues.push({
        file: filePath,
        line: link.line,
        link: link.link,
        type: 'external',
        issue: '外部链接不可访问',
        severity: 'warning'
      });
    }
  }

  async run(skipExternal: boolean = false): Promise<void> {
    console.log('🔗 LinchKit 文档链接完整性检查开始...\n');

    // 查找所有文档文件
    const files = await this.findDocumentationFiles();
    console.log(`📄 找到 ${files.length} 个文档文件\n`);

    // 检查每个文件的链接
    console.log('🔍 检查链接中...');
    for (const [index, file] of files.entries()) {
      const progress = `(${index + 1}/${files.length})`;
      const fileName = file.replace(this.projectRoot + '/', '');
      console.log(`   ${progress} ${fileName}`);
      await this.checkLinksInFile(file);
    }

    // 如果跳过外部链接检查，过滤掉外部链接问题
    let filteredIssues = this.issues;
    if (skipExternal) {
      filteredIssues = this.issues.filter(issue => issue.type !== 'external');
    }

    // 统计结果
    const errors = filteredIssues.filter(issue => issue.severity === 'error');
    const warnings = filteredIssues.filter(issue => issue.severity === 'warning');

    console.log('\n📊 检查结果:');
    console.log(`❌ 错误: ${errors.length} 个`);
    console.log(`⚠️ 警告: ${warnings.length} 个\n`);

    if (filteredIssues.length === 0) {
      console.log('🎉 所有链接检查通过!');
      return;
    }

    // 显示错误
    if (errors.length > 0) {
      console.log('❌ 发现的错误:');
      errors.forEach(issue => {
        console.log(`   ${issue.file}:${issue.line} - ${issue.link}`);
        console.log(`     └─ ${issue.issue}`);
      });
      console.log();
    }

    // 显示警告
    if (warnings.length > 0) {
      console.log('⚠️ 发现的警告:');
      warnings.forEach(issue => {
        console.log(`   ${issue.file}:${issue.line} - ${issue.link}`);
        console.log(`     └─ ${issue.issue}`);
      });
      console.log();
    }

    if (skipExternal) {
      console.log('💡 运行 `bun run docs:link-check --external` 检查外部链接');
    }

    // 如果有错误，退出码为1
    process.exit(errors.length > 0 ? 1 : 0);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipExternal = !args.includes('--external') && !args.includes('-e');
  
  try {
    const checker = new DocumentLinkChecker();
    await checker.run(skipExternal);
  } catch (error) {
    console.error('❌ 链接检查失败:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { DocumentLinkChecker };