#!/usr/bin/env bun
/**
 * LinchKit NPM Package Status Checker
 * 检查 @linch-kit/* 包在 npmjs.com 的发布状态
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';

interface PackageInfo {
  name: string;
  localVersion: string;
  publishedVersion?: string;
  isPublished: boolean;
  needsUpdate?: boolean;
  error?: string;
}

class NPMStatusChecker {
  private projectRoot: string;
  private packages: PackageInfo[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async findLinchKitPackages(): Promise<string[]> {
    const patterns = [
      'packages/*/package.json',
      'extensions/*/package.json',
      'tools/*/package.json'
    ];

    const packageFiles: string[] = [];
    for (const pattern of patterns) {
      const matched = await glob(pattern, { 
        cwd: this.projectRoot,
        absolute: true 
      });
      packageFiles.push(...matched);
    }

    return packageFiles;
  }

  async getLocalPackageInfo(packageJsonPath: string): Promise<PackageInfo | null> {
    try {
      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      // 只检查 @linch-kit 作用域的包
      if (!packageJson.name || !packageJson.name.startsWith('@linch-kit/')) {
        return null;
      }

      return {
        name: packageJson.name,
        localVersion: packageJson.version,
        isPublished: false
      };
    } catch (error) {
      console.warn(`⚠️ 无法读取包文件 ${packageJsonPath}:`, error);
      return null;
    }
  }

  async checkNPMRegistry(packageName: string): Promise<{version?: string, published: boolean, error?: string}> {
    try {
      const url = `https://registry.npmjs.org/${packageName}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LinchKit-NPM-Checker/1.0'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      });

      if (response.status === 404) {
        return { published: false };
      }

      if (!response.ok) {
        return { 
          published: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const data = await response.json();
      const latestVersion = data['dist-tags']?.latest;
      
      return {
        version: latestVersion,
        published: true
      };
    } catch (error) {
      return { 
        published: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }
  }

  compareVersions(local: string, published: string): boolean {
    // 简单的版本比较 (假设都是 semantic versioning)
    const localParts = local.split('.').map(Number);
    const publishedParts = published.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      const localPart = localParts[i] || 0;
      const publishedPart = publishedParts[i] || 0;
      
      if (localPart > publishedPart) return true;
      if (localPart < publishedPart) return false;
    }
    
    return false; // 版本相同
  }

  async run(): Promise<void> {
    console.log('📦 LinchKit NPM 包状态检查开始...\n');

    // 查找所有 LinchKit 包
    const packageFiles = await this.findLinchKitPackages();
    console.log(`📄 找到 ${packageFiles.length} 个包文件\n`);

    // 收集本地包信息
    for (const file of packageFiles) {
      const packageInfo = await this.getLocalPackageInfo(file);
      if (packageInfo) {
        this.packages.push(packageInfo);
      }
    }

    console.log(`🔍 找到 ${this.packages.length} 个 @linch-kit 包:\n`);

    // 检查每个包的NPM状态
    for (const [index, pkg] of this.packages.entries()) {
      console.log(`   (${index + 1}/${this.packages.length}) 检查 ${pkg.name}...`);
      
      const npmInfo = await this.checkNPMRegistry(pkg.name);
      
      pkg.isPublished = npmInfo.published;
      pkg.publishedVersion = npmInfo.version;
      pkg.error = npmInfo.error;
      
      if (pkg.isPublished && pkg.publishedVersion) {
        pkg.needsUpdate = this.compareVersions(pkg.localVersion, pkg.publishedVersion);
      }
    }

    // 显示结果
    console.log('\n📊 检查结果:\n');

    const published = this.packages.filter(p => p.isPublished);
    const unpublished = this.packages.filter(p => !p.isPublished);
    const needsUpdate = this.packages.filter(p => p.needsUpdate);
    const hasErrors = this.packages.filter(p => p.error);

    console.log(`✅ 已发布: ${published.length} 个`);
    console.log(`❌ 未发布: ${unpublished.length} 个`);
    console.log(`🔄 需要更新: ${needsUpdate.length} 个`);
    console.log(`⚠️ 检查错误: ${hasErrors.length} 个\n`);

    // 详细信息
    if (published.length > 0) {
      console.log('✅ 已发布的包:');
      published.forEach(pkg => {
        const status = pkg.needsUpdate ? '🔄 本地版本更新' : '✅ 版本同步';
        console.log(`   ${pkg.name}`);
        console.log(`     └─ 本地: v${pkg.localVersion}, NPM: v${pkg.publishedVersion} ${status}`);
      });
      console.log();
    }

    if (unpublished.length > 0) {
      console.log('❌ 未发布的包:');
      unpublished.forEach(pkg => {
        console.log(`   ${pkg.name} v${pkg.localVersion}`);
        if (pkg.error) {
          console.log(`     └─ 错误: ${pkg.error}`);
        }
      });
      console.log();
    }

    if (needsUpdate.length > 0) {
      console.log('💡 建议操作:');
      needsUpdate.forEach(pkg => {
        console.log(`   发布 ${pkg.name} v${pkg.localVersion} (当前NPM: v${pkg.publishedVersion})`);
      });
      console.log();
    }

    // 生成README更新建议
    this.generateReadmeUpdateSuggestions();
  }

  generateReadmeUpdateSuggestions(): void {
    const publishedPackages = this.packages.filter(p => p.isPublished);
    const unpublishedPackages = this.packages.filter(p => !p.isPublished);

    if (unpublishedPackages.length > 0) {
      console.log('📝 README.md 更新建议:');
      console.log('以下未发布的包可能需要从 README.md 中移除或标记为"开发中":');
      unpublishedPackages.forEach(pkg => {
        console.log(`   - ${pkg.name} (未发布)`);
      });
      console.log();
    }

    if (publishedPackages.length > 0) {
      console.log('🔗 验证通过的 NPM 链接:');
      publishedPackages.forEach(pkg => {
        console.log(`   - https://www.npmjs.com/package/${pkg.name} ✅`);
      });
    }
  }
}

async function main() {
  try {
    const checker = new NPMStatusChecker();
    await checker.run();
  } catch (error) {
    console.error('❌ NPM 状态检查失败:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { NPMStatusChecker };