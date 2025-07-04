#!/usr/bin/env node
/**
 * 文档验证工具
 * 验证 ai-context 目录中文档的完整性和一致性
 */

import fs from 'fs/promises';
import path from 'path';
import { globby } from 'globby';

class DocValidator {
  constructor() {
    this.contextDir = path.join(process.cwd(), 'ai-context');
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 运行所有验证检查
   */
  async validateAll() {
    console.log('🔍 开始文档验证...\n');
    
    await this.validateManifest();
    await this.validateLinks();
    await this.validateStructure();
    await this.validateContent();
    
    this.printReport();
    
    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * 验证 manifest.json
   */
  async validateManifest() {
    console.log('📋 验证 manifest.json...');
    
    try {
      const manifestPath = path.join(this.contextDir, 'manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);
      
      // 检查必需字段
      this.checkRequired(manifest, 'meta', 'manifest.json');
      this.checkRequired(manifest, 'navigation', 'manifest.json');
      
      if (manifest.meta) {
        this.checkRequired(manifest.meta, 'version', 'manifest.json.meta');
        this.checkRequired(manifest.meta, 'last_updated', 'manifest.json.meta');
      }
      
      // 验证引用的文件是否存在
      const allPaths = this.extractPaths(manifest);
      for (const filePath of allPaths) {
        if (filePath.endsWith('.md')) {
          const fullPath = path.join(process.cwd(), filePath);
          try {
            await fs.access(fullPath);
          } catch {
            this.errors.push(`manifest.json 引用的文件不存在: ${filePath}`);
          }
        }
      }
      
    } catch (error) {
      this.errors.push(`manifest.json 验证失败: ${error.message}`);
    }
  }

  /**
   * 验证文档链接
   */
  async validateLinks() {
    console.log('🔗 验证文档链接...');
    
    const markdownFiles = await globby(['**/*.md'], {
      cwd: this.contextDir,
      absolute: true
    });
    
    for (const file of markdownFiles) {
      await this.validateFileLinks(file);
    }
  }

  /**
   * 验证单个文件的链接
   */
  async validateFileLinks(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      // 匹配 Markdown 链接
      const linkRegex = /\\[([^\\]]+)\\]\\(([^)]+)\\)/g;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const linkText = match[1];
        const linkUrl = match[2];
        
        // 跳过外部链接
        if (linkUrl.startsWith('http') || linkUrl.startsWith('mailto:')) {
          continue;
        }
        
        // 验证内部链接
        const targetPath = this.resolveLinkPath(filePath, linkUrl);
        if (targetPath) {
          try {
            await fs.access(targetPath);
          } catch {
            this.errors.push(`${relativePath}: 链接指向不存在的文件 - ${linkUrl}`);
          }
        }
      }
      
    } catch (error) {
      this.errors.push(`无法读取文件 ${filePath}: ${error.message}`);
    }
  }

  /**
   * 验证目录结构
   */
  async validateStructure() {
    console.log('📁 验证目录结构...');
    
    const expectedDirs = ['core', 'architecture', 'reference', 'roadmap', 'history', 'tools'];
    
    for (const dir of expectedDirs) {
      const dirPath = path.join(this.contextDir, dir);
      try {
        const stat = await fs.stat(dirPath);
        if (!stat.isDirectory()) {
          this.errors.push(`${dir} 应该是一个目录`);
        }
      } catch {
        this.errors.push(`缺少必需的目录: ${dir}`);
      }
    }
    
    // 检查工具目录的子目录
    const toolsSubDirs = ['scripts', 'templates', 'validators'];
    for (const subDir of toolsSubDirs) {
      const subDirPath = path.join(this.contextDir, 'tools', subDir);
      try {
        const stat = await fs.stat(subDirPath);
        if (!stat.isDirectory()) {
          this.warnings.push(`tools/${subDir} 应该是一个目录`);
        }
      } catch {
        this.warnings.push(`缺少工具子目录: tools/${subDir}`);
      }
    }
  }

  /**
   * 验证文档内容
   */
  async validateContent() {
    console.log('📄 验证文档内容...');
    
    const markdownFiles = await globby(['**/*.md'], {
      cwd: this.contextDir,
      absolute: true
    });
    
    for (const file of markdownFiles) {
      await this.validateFileContent(file);
    }
  }

  /**
   * 验证单个文件的内容
   */
  async validateFileContent(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      // 检查是否有标题
      if (!content.includes('# ')) {
        this.warnings.push(`${relativePath}: 缺少主标题`);
      }
      
      // 检查是否有空文件
      if (content.trim().length === 0) {
        this.warnings.push(`${relativePath}: 文件为空`);
      }
      
      // 检查是否有 TODO 标记
      if (content.includes('TODO') || content.includes('FIXME')) {
        this.warnings.push(`${relativePath}: 包含 TODO 或 FIXME 标记`);
      }
      
    } catch (error) {
      this.errors.push(`无法读取文件 ${filePath}: ${error.message}`);
    }
  }

  /**
   * 解析链接路径
   */
  resolveLinkPath(fromFile, linkUrl) {
    // 移除锚点
    const cleanUrl = linkUrl.split('#')[0];
    
    if (cleanUrl.startsWith('/')) {
      // 绝对路径
      return path.join(process.cwd(), cleanUrl);
    } else if (cleanUrl.startsWith('./') || cleanUrl.startsWith('../')) {
      // 相对路径
      const fromDir = path.dirname(fromFile);
      return path.resolve(fromDir, cleanUrl);
    } else if (cleanUrl.length > 0) {
      // 相对于当前目录的路径
      const fromDir = path.dirname(fromFile);
      return path.resolve(fromDir, cleanUrl);
    }
    
    return null;
  }

  /**
   * 从 manifest 对象中提取所有路径
   */
  extractPaths(obj, paths = []) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        paths.push(value);
      } else if (typeof value === 'object' && value !== null) {
        this.extractPaths(value, paths);
      }
    }
    return paths;
  }

  /**
   * 检查必需字段
   */
  checkRequired(obj, field, context) {
    if (!obj || !obj.hasOwnProperty(field)) {
      this.errors.push(`${context}: 缺少必需字段 '${field}'`);
    }
  }

  /**
   * 打印验证报告
   */
  printReport() {
    console.log('\n📊 验证报告:');
    console.log(`✅ 错误数量: ${this.errors.length}`);
    console.log(`⚠️  警告数量: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ 错误:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n🎉 所有验证都通过了！');
    }
  }
}

// CLI 接口
async function main() {
  const validator = new DocValidator();
  const result = await validator.validateAll();
  
  // 如果有错误，返回非零退出码
  if (!result.success) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DocValidator;