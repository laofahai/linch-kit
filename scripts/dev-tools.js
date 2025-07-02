#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevTools {
  constructor() {
    this.rootDir = process.cwd();
  }

  async dev() {
    console.log('🚀 启动 LinchKit 开发环境...');
    
    try {
      // 启动并行开发服务
      execSync('turbo run dev --parallel', { 
        stdio: 'inherit',
        cwd: this.rootDir 
      });
    } catch (error) {
      console.error('❌ 开发环境启动失败:', error.message);
      process.exit(1);
    }
  }

  async check() {
    console.log('🔍 检查项目依赖和配置...');
    
    const issues = [];
    
    // 检查 Node.js 版本
    const nodeVersion = process.version;
    console.log(`Node.js 版本: ${nodeVersion}`);
    
    // 检查 pnpm
    try {
      const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
      console.log(`pnpm 版本: ${pnpmVersion}`);
    } catch (error) {
      issues.push('❌ pnpm 未安装或不在 PATH 中');
    }
    
    // 检查 turbo
    try {
      const turboVersion = execSync('turbo --version', { encoding: 'utf8' }).trim();
      console.log(`Turbo 版本: ${turboVersion}`);
    } catch (error) {
      issues.push('❌ Turbo 未安装');
    }
    
    // 检查工作区包
    const workspacePackages = await this.getWorkspacePackages();
    console.log(`工作区包数量: ${workspacePackages.length}`);
    
    for (const pkg of workspacePackages) {
      // 检查 package.json 格式
      try {
        JSON.parse(fs.readFileSync(path.join(pkg.path, 'package.json'), 'utf8'));
      } catch (error) {
        issues.push(`❌ ${pkg.name}: package.json 格式错误`);
      }
      
      // 检查构建脚本
      if (!pkg.packageJson.scripts?.build) {
        issues.push(`⚠️  ${pkg.name}: 缺少 build 脚本`);
      }
    }
    
    // 输出结果
    if (issues.length === 0) {
      console.log('✅ 所有检查都通过！');
    } else {
      console.log('⚠️  发现以下问题:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    return issues.length === 0;
  }

  async getWorkspacePackages() {
    const packages = [];
    
    // 扫描 packages 目录
    const packagesDir = path.join(this.rootDir, 'packages');
    if (fs.existsSync(packagesDir)) {
      const packageNames = fs.readdirSync(packagesDir);
      for (const name of packageNames) {
        const packagePath = path.join(packagesDir, name);
        const packageJsonPath = path.join(packagePath, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          packages.push({
            name: packageJson.name,
            path: packagePath,
            packageJson
          });
        }
      }
    }

    // 扫描 modules 目录
    const modulesDir = path.join(this.rootDir, 'modules');
    if (fs.existsSync(modulesDir)) {
      const moduleNames = fs.readdirSync(modulesDir);
      for (const name of moduleNames) {
        const modulePath = path.join(modulesDir, name);
        const packageJsonPath = path.join(modulePath, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          packages.push({
            name: packageJson.name,
            path: modulePath,
            packageJson
          });
        }
      }
    }

    return packages;
  }
}

// 命令行接口
async function main() {
  const command = process.argv[2];
  const devTools = new DevTools();
  
  switch (command) {
    case 'dev':
      await devTools.dev();
      break;
    case 'check':
      const isHealthy = await devTools.check();
      process.exit(isHealthy ? 0 : 1);
      break;
    default:
      console.log('用法: node scripts/dev-tools.js <command>');
      console.log('命令:');
      console.log('  dev   - 启动开发环境');
      console.log('  check - 检查项目健康状态');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = DevTools;