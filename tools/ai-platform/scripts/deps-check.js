#!/usr/bin/env bun
/**
 * LinchKit 包复用检查工具
 * 检查给定关键词是否已在现有包中实现，避免重复开发
 */

import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

class DepsChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.packagesDir = path.join(this.projectRoot, 'packages');
    this.extensionsDir = path.join(this.projectRoot, 'extensions');
  }

  /**
   * 执行包复用检查
   */
  async check(keywords) {
    console.log('🔍 LinchKit 包复用检查...');
    console.log(`查询关键词: ${keywords.join(', ')}`);
    
    const results = {
      packages: [],
      extensions: [],
      recommendations: []
    };

    // 检查核心包
    await this.checkPackages(keywords, results);
    
    // 检查扩展包
    await this.checkExtensions(keywords, results);
    
    // 生成建议
    this.generateRecommendations(keywords, results);
    
    this.printResults(results);
    
    return results;
  }

  /**
   * 检查核心包
   */
  async checkPackages(keywords, results) {
    const packageDirs = await glob('*/package.json', { 
      cwd: this.packagesDir 
    });

    for (const packageFile of packageDirs) {
      const packagePath = path.join(this.packagesDir, packageFile);
      const packageDir = path.dirname(packagePath);
      
      if (existsSync(packagePath)) {
        const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
        const matches = await this.searchInPackage(packageDir, keywords, pkg);
        
        if (matches.length > 0) {
          results.packages.push({
            name: pkg.name,
            path: packageDir,
            matches: matches
          });
        }
      }
    }
  }

  /**
   * 检查扩展包
   */
  async checkExtensions(keywords, results) {
    if (!existsSync(this.extensionsDir)) return;

    const extensionDirs = await glob('*/package.json', { 
      cwd: this.extensionsDir 
    });

    for (const extensionFile of extensionDirs) {
      const extensionPath = path.join(this.extensionsDir, extensionFile);
      const extensionDir = path.dirname(extensionPath);
      
      if (existsSync(extensionPath)) {
        const pkg = JSON.parse(readFileSync(extensionPath, 'utf8'));
        const matches = await this.searchInExtension(extensionDir, keywords, pkg);
        
        if (matches.length > 0) {
          results.extensions.push({
            name: pkg.name,
            path: extensionDir,
            matches: matches
          });
        }
      }
    }
  }

  /**
   * 在包中搜索关键词
   */
  async searchInPackage(packageDir, keywords, pkg) {
    const matches = [];
    
    // 检查包名和描述
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      
      if (pkg.name?.toLowerCase().includes(lowerKeyword)) {
        matches.push({
          type: 'package_name',
          content: pkg.name,
          file: 'package.json'
        });
      }
      
      if (pkg.description?.toLowerCase().includes(lowerKeyword)) {
        matches.push({
          type: 'description',
          content: pkg.description,
          file: 'package.json'
        });
      }
    }
    
    // 检查源代码文件
    const sourceFiles = await glob('src/**/*.{ts,tsx,js,jsx}', { 
      cwd: packageDir 
    });
    
    for (const file of sourceFiles) {
      const filePath = path.join(packageDir, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        
        for (const keyword of keywords) {
          if (content.toLowerCase().includes(keyword.toLowerCase())) {
            // 提取包含关键词的行
            const lines = content.split('\n');
            const matchedLines = lines.filter(line => 
              line.toLowerCase().includes(keyword.toLowerCase())
            ).slice(0, 3); // 只取前3行
            
            matches.push({
              type: 'source_code',
              content: matchedLines.join('\n'),
              file: file,
              keyword: keyword
            });
            break; // 每个文件只记录一次匹配
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * 在扩展中搜索关键词
   */
  async searchInExtension(extensionDir, keywords, pkg) {
    // 扩展的搜索逻辑与包类似，但可能有不同的文件结构
    return this.searchInPackage(extensionDir, keywords, pkg);
  }

  /**
   * 生成建议
   */
  generateRecommendations(keywords, results) {
    if (results.packages.length > 0) {
      results.recommendations.push({
        type: 'reuse_existing',
        message: `发现现有包实现了相关功能，建议复用：${results.packages.map(p => p.name).join(', ')}`
      });
    }
    
    if (results.extensions.length > 0) {
      results.recommendations.push({
        type: 'extend_existing',
        message: `发现现有扩展包含相关功能，建议扩展：${results.extensions.map(e => e.name).join(', ')}`
      });
    }
    
    if (results.packages.length === 0 && results.extensions.length === 0) {
      results.recommendations.push({
        type: 'create_new',
        message: '未发现现有实现，可以创建新功能'
      });
      
      // 建议最佳实践
      const coreKeywords = ['auth', 'user', 'permission', 'role'];
      const uiKeywords = ['component', 'ui', 'button', 'form', 'table'];
      const platformKeywords = ['crud', 'api', 'service', 'middleware'];
      
      if (keywords.some(k => coreKeywords.includes(k.toLowerCase()))) {
        results.recommendations.push({
          type: 'package_suggestion',
          message: '建议添加到 @linch-kit/auth 或 @linch-kit/core 包'
        });
      } else if (keywords.some(k => uiKeywords.includes(k.toLowerCase()))) {
        results.recommendations.push({
          type: 'package_suggestion',
          message: '建议添加到 @linch-kit/ui 包'
        });
      } else if (keywords.some(k => platformKeywords.includes(k.toLowerCase()))) {
        results.recommendations.push({
          type: 'package_suggestion',
          message: '建议添加到 @linch-kit/platform 包'
        });
      }
    }
  }

  /**
   * 打印结果
   */
  printResults(results) {
    console.log('\n📊 检查结果:');
    
    if (results.packages.length > 0) {
      console.log('\n🔍 发现相关核心包:');
      results.packages.forEach(pkg => {
        console.log(`  📦 ${pkg.name}`);
        pkg.matches.forEach(match => {
          console.log(`    ${match.type}: ${match.content.substring(0, 100)}...`);
        });
      });
    }
    
    if (results.extensions.length > 0) {
      console.log('\n🔧 发现相关扩展:');
      results.extensions.forEach(ext => {
        console.log(`  🧩 ${ext.name}`);
        ext.matches.forEach(match => {
          console.log(`    ${match.type}: ${match.content.substring(0, 100)}...`);
        });
      });
    }
    
    console.log('\n💡 建议:');
    results.recommendations.forEach(rec => {
      console.log(`  ${rec.message}`);
    });
    
    console.log('\n✅ 包复用检查完成\n');
  }
}

// CLI 入口
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法: bun run deps:check <关键词1> [关键词2] ...');
    console.log('示例: bun run deps:check auth user login');
    process.exit(1);
  }
  
  const checker = new DepsChecker();
  await checker.check(args);
}

// 支持直接调用和模块导入
if (import.meta.main) {
  main().catch(console.error);
}

export { DepsChecker };