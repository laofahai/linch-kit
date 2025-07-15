#!/usr/bin/env bun
/**
 * LinchKit Documentation Comprehensive Validator
 * 综合文档验证工具 - 整合版本检查、链接检查和NPM状态检查
 */

import { DocumentVersionChecker } from './version-check';
import { DocumentLinkChecker } from './link-check';
import { NPMStatusChecker } from './npm-status-check';

interface ValidationOptions {
  fixVersions?: boolean;
  skipExternal?: boolean;
  skipNpm?: boolean;
  verbose?: boolean;
}

class DocumentationValidator {
  private options: ValidationOptions;
  
  constructor(options: ValidationOptions = {}) {
    this.options = {
      fixVersions: false,
      skipExternal: true,
      skipNpm: false,
      verbose: false,
      ...options
    };
  }

  async runVersionCheck(): Promise<boolean> {
    console.log('🔍 步骤 1/3: 版本一致性检查');
    console.log('─'.repeat(50));
    
    try {
      const checker = new DocumentVersionChecker();
      await checker.run(this.options.fixVersions);
      
      // 检查是否有未修复的问题
      if (!this.options.fixVersions) {
        const issues = (checker as any).issues.filter((i: any) => i.needsUpdate);
        return issues.length === 0;
      }
      
      return true;
    } catch (error) {
      console.error('❌ 版本检查失败:', error);
      return false;
    }
  }

  async runLinkCheck(): Promise<boolean> {
    console.log('\n🔗 步骤 2/3: 链接完整性检查');
    console.log('─'.repeat(50));
    
    try {
      const checker = new DocumentLinkChecker();
      await checker.run(this.options.skipExternal);
      return true; // 如果没有抛出异常则认为成功
    } catch (error) {
      if (this.options.verbose) {
        console.error('❌ 链接检查详细错误:', error);
      }
      return false;
    }
  }

  async runNpmCheck(): Promise<boolean> {
    if (this.options.skipNpm) {
      console.log('\n📦 步骤 3/3: NPM状态检查 (跳过)');
      console.log('─'.repeat(50));
      console.log('💡 NPM状态检查已跳过，使用 --npm 启用');
      return true;
    }

    console.log('\n📦 步骤 3/3: NPM状态检查');
    console.log('─'.repeat(50));
    
    try {
      const checker = new NPMStatusChecker();
      await checker.run();
      return true;
    } catch (error) {
      console.error('❌ NPM状态检查失败:', error);
      return false;
    }
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    
    console.log('🚀 LinchKit 文档综合验证开始...\n');
    console.log('⚙️ 验证选项:');
    console.log(`   - 自动修复版本: ${this.options.fixVersions ? '✅' : '❌'}`);
    console.log(`   - 检查外部链接: ${!this.options.skipExternal ? '✅' : '❌'}`);
    console.log(`   - 检查NPM状态: ${!this.options.skipNpm ? '✅' : '❌'}`);
    console.log(`   - 详细输出: ${this.options.verbose ? '✅' : '❌'}\n`);

    const results = {
      version: false,
      links: false,
      npm: false
    };

    // 执行各项检查
    results.version = await this.runVersionCheck();
    results.links = await this.runLinkCheck();
    results.npm = await this.runNpmCheck();

    // 总结报告
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 文档验证总结报告');
    console.log('='.repeat(60));
    
    console.log(`🔍 版本一致性: ${results.version ? '✅ 通过' : '❌ 失败'}`);
    console.log(`🔗 链接完整性: ${results.links ? '✅ 通过' : '❌ 失败'}`);
    console.log(`📦 NPM状态: ${results.npm ? '✅ 通过' : '❌ 失败'}`);
    
    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.values(results).length;
    
    console.log(`\n📈 总体状态: ${passedCount}/${totalCount} 项通过`);
    console.log(`⏱️ 耗时: ${duration} 秒`);
    
    if (passedCount === totalCount) {
      console.log('\n🎉 所有文档验证项目都已通过！');
    } else {
      console.log('\n💡 建议操作:');
      
      if (!results.version) {
        console.log('   - 运行 `bun run docs:version-check --fix` 修复版本问题');
      }
      
      if (!results.links) {
        console.log('   - 检查并修复损坏的链接');
        if (this.options.skipExternal) {
          console.log('   - 运行 `bun run docs:link-check --external` 检查外部链接');
        }
      }
      
      if (!results.npm) {
        console.log('   - 检查网络连接或NPM包发布状态');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    // 如果有失败项，以非零状态退出
    const hasFailures = !Object.values(results).every(Boolean);
    process.exit(hasFailures ? 1 : 0);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  const options: ValidationOptions = {
    fixVersions: args.includes('--fix') || args.includes('-f'),
    skipExternal: !args.includes('--external') && !args.includes('-e'),
    skipNpm: !args.includes('--npm') && !args.includes('-n'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
LinchKit 文档验证工具

用法: bun run docs:validate [选项]

选项:
  --fix, -f         自动修复版本不一致问题
  --external, -e    检查外部链接 (默认跳过)
  --npm, -n         检查NPM包状态 (默认跳过)
  --verbose, -v     显示详细输出
  --help, -h        显示帮助信息

示例:
  bun run docs:validate                    # 基本验证
  bun run docs:validate --fix             # 验证并修复版本问题
  bun run docs:validate --external --npm  # 完整验证(包括外部链接和NPM)
  bun run docs:validate -f -e -n -v       # 全功能验证
`);
    return;
  }
  
  try {
    const validator = new DocumentationValidator(options);
    await validator.run();
  } catch (error) {
    console.error('❌ 文档验证失败:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { DocumentationValidator };