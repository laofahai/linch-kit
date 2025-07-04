#!/usr/bin/env node
/**
 * AI-Context 优化维护工具
 * 用于自动化管理和维护 ai-context 目录结构
 */

import fs from 'fs/promises';
import path from 'path';
import { globby } from 'globby';

class ContextTools {
  constructor() {
    this.manifestPath = path.join(process.cwd(), 'ai-context/manifest.json');
    this.contextDir = path.join(process.cwd(), 'ai-context');
  }

  async loadManifest() {
    try {
      const content = await fs.readFile(this.manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('无法加载 manifest.json:', error.message);
      process.exit(1);
    }
  }

  async saveManifest(manifest) {
    try {
      await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2));
      console.log('✅ manifest.json 已更新');
    } catch (error) {
      console.error('无法保存 manifest.json:', error.message);
      process.exit(1);
    }
  }

  /**
   * 生成包API摘要
   * @param {string} packageName - 包名
   */
  async generateApiSummary(packageName) {
    console.log(`🔍 正在生成 ${packageName} 包的API摘要...`);
    
    const packagePath = path.join(process.cwd(), 'packages', packageName);
    const srcPath = path.join(packagePath, 'src');
    
    try {
      // 检查包是否存在
      await fs.access(srcPath);
      
      // 查找所有TypeScript文件
      const files = await globby(['**/*.ts', '!**/*.test.ts', '!**/*.spec.ts'], {
        cwd: srcPath,
        absolute: true
      });
      
      const apiSummary = {
        package: packageName,
        lastUpdated: new Date().toISOString(),
        files: [],
        exports: []
      };
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(srcPath, file);
        
        // 简单的导出分析
        const exports = this.extractExports(content);
        
        apiSummary.files.push({
          path: relativePath,
          exports: exports.length
        });
        
        apiSummary.exports.push(...exports.map(exp => ({
          name: exp.name,
          type: exp.type,
          file: relativePath
        })));
      }
      
      // 保存API摘要
      const summaryPath = path.join(this.contextDir, 'reference', `${packageName}-api-summary.md`);
      await this.saveApiSummary(apiSummary, summaryPath);
      
      console.log(`✅ ${packageName} API摘要已生成: ${summaryPath}`);
      return apiSummary;
      
    } catch (error) {
      console.error(`❌ 生成 ${packageName} API摘要失败:`, error.message);
      throw error;
    }
  }

  /**
   * 提取文件中的导出内容
   * @param {string} content - 文件内容
   */
  extractExports(content) {
    const exports = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 匹配各种导出模式
      if (trimmed.startsWith('export ')) {
        if (trimmed.includes('function ')) {
          const match = trimmed.match(/export\\s+(?:async\\s+)?function\\s+(\\w+)/);
          if (match) exports.push({ name: match[1], type: 'function' });
        } else if (trimmed.includes('class ')) {
          const match = trimmed.match(/export\\s+class\\s+(\\w+)/);
          if (match) exports.push({ name: match[1], type: 'class' });
        } else if (trimmed.includes('interface ')) {
          const match = trimmed.match(/export\\s+interface\\s+(\\w+)/);
          if (match) exports.push({ name: match[1], type: 'interface' });
        } else if (trimmed.includes('type ')) {
          const match = trimmed.match(/export\\s+type\\s+(\\w+)/);
          if (match) exports.push({ name: match[1], type: 'type' });
        } else if (trimmed.includes('const ')) {
          const match = trimmed.match(/export\\s+const\\s+(\\w+)/);
          if (match) exports.push({ name: match[1], type: 'const' });
        }
      }
    }
    
    return exports;
  }

  /**
   * 保存API摘要到Markdown文件
   * @param {object} summary - API摘要对象
   * @param {string} filePath - 保存路径
   */
  async saveApiSummary(summary, filePath) {
    const markdown = `# ${summary.package} API 摘要

**最后更新**: ${summary.lastUpdated}

## 📊 统计信息
- **文件数量**: ${summary.files.length}
- **导出数量**: ${summary.exports.length}

## 📁 文件列表
${summary.files.map(file => `- \`${file.path}\` (${file.exports} 个导出)`).join('\n')}

## 📋 导出列表
${summary.exports.map(exp => `- **${exp.name}** (${exp.type}) - \`${exp.file}\``).join('\n')}

---
*此文档由 context-tools.js 自动生成*
`;
    
    await fs.writeFile(filePath, markdown);
  }

  /**
   * 列出未文档化的包
   */
  async listUndocumentedPackages() {
    console.log('🔍 正在检查未文档化的包...');
    
    const packagesDir = path.join(process.cwd(), 'packages');
    const packages = await fs.readdir(packagesDir);
    const undocumented = [];
    
    for (const pkg of packages) {
      const pkgPath = path.join(packagesDir, pkg);
      const stat = await fs.stat(pkgPath);
      
      if (stat.isDirectory()) {
        const readmePath = path.join(pkgPath, 'README.md');
        try {
          await fs.access(readmePath);
        } catch {
          undocumented.push(pkg);
        }
      }
    }
    
    if (undocumented.length > 0) {
      console.log('❌ 未文档化的包:');
      undocumented.forEach(pkg => console.log(`   - ${pkg}`));
    } else {
      console.log('✅ 所有包都已文档化');
    }
    
    return undocumented;
  }

  /**
   * 验证 manifest.json 文件
   */
  async validateManifest() {
    console.log('🔍 正在验证 manifest.json...');
    
    const manifest = await this.loadManifest();
    const issues = [];
    
    // 检查必需字段
    if (!manifest.meta) issues.push('缺少 meta 字段');
    if (!manifest.navigation) issues.push('缺少 navigation 字段');
    
    // 检查文件路径是否存在
    const pathsToCheck = [
      ...Object.values(manifest.navigation || {}),
      ...Object.values(manifest.core || {}),
      ...Object.values(manifest.architecture || {}),
      ...Object.values(manifest.reference || {}),
      ...Object.values(manifest.roadmap || {}),
      ...Object.values(manifest.history || {})
    ];
    
    for (const filePath of pathsToCheck) {
      if (typeof filePath === 'string' && filePath.endsWith('.md')) {
        const fullPath = path.join(process.cwd(), filePath);
        try {
          await fs.access(fullPath);
        } catch {
          issues.push(`文件不存在: ${filePath}`);
        }
      }
    }
    
    if (issues.length > 0) {
      console.log('❌ manifest.json 验证失败:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      return false;
    } else {
      console.log('✅ manifest.json 验证通过');
      return true;
    }
  }

  /**
   * 同步架构文档
   */
  async syncArchitectureDocs() {
    console.log('🔄 正在同步架构文档...');
    
    const manifest = await this.loadManifest();
    const archFiles = await globby(['architecture/**/*.md'], {
      cwd: this.contextDir,
      absolute: true
    });
    
    // 更新manifest中的架构文档索引
    for (const file of archFiles) {
      const relativePath = path.relative(process.cwd(), file);
      const fileName = path.basename(file, '.md');
      
      if (!manifest.architecture[fileName]) {
        manifest.architecture[fileName] = relativePath;
        console.log(`📝 添加架构文档: ${fileName}`);
      }
    }
    
    await this.saveManifest(manifest);
    console.log('✅ 架构文档同步完成');
  }
}

// CLI 接口
async function main() {
  const args = process.argv.slice(2);
  const tools = new ContextTools();
  
  if (args.length === 0) {
    console.log(`
AI-Context 优化维护工具

使用方法:
  node context-tools.js --generate-api-summary <package-name>
  node context-tools.js --list-undocumented-packages
  node context-tools.js --validate-manifest
  node context-tools.js --sync-architecture-docs
    `);
    return;
  }
  
  const command = args[0];
  
  try {
    switch (command) {
      case '--generate-api-summary':
        if (args[1]) {
          await tools.generateApiSummary(args[1]);
        } else {
          console.error('请提供包名');
        }
        break;
        
      case '--list-undocumented-packages':
        await tools.listUndocumentedPackages();
        break;
        
      case '--validate-manifest':
        await tools.validateManifest();
        break;
        
      case '--sync-architecture-docs':
        await tools.syncArchitectureDocs();
        break;
        
      default:
        console.error(`未知命令: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('执行失败:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ContextTools;