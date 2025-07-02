#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ReleaseManager {
  constructor() {
    this.isDryRun = process.argv.includes('--dry-run');
    this.rootDir = process.cwd();
  }

  async release() {
    console.log('🚀 LinchKit 发布流程开始...');
    
    if (this.isDryRun) {
      console.log('🔍 [DRY RUN] 模拟运行模式，不会实际发布');
    }

    try {
      // 1. 检查环境
      await this.checkEnvironment();
      
      // 2. 运行测试
      await this.runTests();
      
      // 3. 构建包
      await this.buildPackages();
      
      // 4. 发布到 NPM
      await this.publishToNpm();
      
      // 5. 创建 Git 标签
      await this.createGitTag();
      
      console.log('✅ 发布流程完成！');
      
    } catch (error) {
      console.error('❌ 发布流程失败:', error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log('🔍 检查发布环境...');
    
    // 检查是否在 main 分支
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main') {
      throw new Error(`当前分支是 ${currentBranch}，请切换到 main 分支`);
    }
    
    // 检查工作目录是否干净
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    if (gitStatus && !this.isDryRun) {
      throw new Error('工作目录有未提交的更改，请先提交或清理');
    }
    
    // 检查 NPM 认证
    if (!process.env.NPM_TOKEN && !this.isDryRun) {
      throw new Error('NPM_TOKEN 环境变量未设置');
    }
    
    console.log('✅ 环境检查通过');
  }

  async runTests() {
    console.log('🧪 运行测试...');
    
    try {
      if (!this.isDryRun) {
        execSync('pnpm turbo test', { stdio: 'inherit' });
      } else {
        console.log('🔍 [DRY RUN] 跳过测试执行');
      }
      console.log('✅ 测试通过');
    } catch (error) {
      throw new Error('测试失败，停止发布');
    }
  }

  async buildPackages() {
    console.log('📦 构建所有包...');
    
    try {
      if (!this.isDryRun) {
        execSync('pnpm turbo build:packages', { stdio: 'inherit' });
      } else {
        console.log('🔍 [DRY RUN] 跳过构建');
      }
      console.log('✅ 构建完成');
    } catch (error) {
      throw new Error('构建失败，停止发布');
    }
  }

  async publishToNpm() {
    console.log('📤 发布到 NPM...');
    
    // 获取要发布的包
    const packages = await this.getWorkspacePackages();
    
    for (const pkg of packages) {
      console.log(`📦 发布 ${pkg.name}@${pkg.packageJson.version}...`);
      
      if (!this.isDryRun) {
        try {
          // 检查版本是否已经发布
          const publishedVersion = await this.getPublishedVersion(pkg.name);
          if (publishedVersion === pkg.packageJson.version) {
            console.log(`⏭️  ${pkg.name}@${pkg.packageJson.version} 已发布，跳过`);
            continue;
          }
          
          // 发布包
          execSync(`npm publish --access public`, {
            cwd: pkg.path,
            stdio: 'inherit',
            env: {
              ...process.env,
              NODE_AUTH_TOKEN: process.env.NPM_TOKEN
            }
          });
          
          console.log(`✅ ${pkg.name}@${pkg.packageJson.version} 发布成功`);
        } catch (error) {
          console.error(`❌ ${pkg.name} 发布失败:`, error.message);
          throw error;
        }
      } else {
        console.log(`🔍 [DRY RUN] 模拟发布 ${pkg.name}@${pkg.packageJson.version}`);
      }
    }
    
    console.log('✅ NPM 发布完成');
  }

  async createGitTag() {
    console.log('🏷️  创建 Git 标签...');
    
    // 获取版本号（使用第一个包的版本）
    const packages = await this.getWorkspacePackages();
    if (packages.length === 0) {
      throw new Error('没有找到任何包');
    }
    
    const version = packages[0].packageJson.version;
    const tagName = `v${version}`;
    
    if (!this.isDryRun) {
      try {
        // 检查标签是否已存在
        try {
          execSync(`git rev-parse ${tagName}`, { stdio: 'pipe' });
          console.log(`⏭️  标签 ${tagName} 已存在，跳过创建`);
          return;
        } catch {
          // 标签不存在，继续创建
        }
        
        // 创建标签
        execSync(`git tag -a ${tagName} -m "Release ${version}"`, { stdio: 'inherit' });
        
        // 推送标签
        execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
        
        console.log(`✅ 标签 ${tagName} 创建并推送成功`);
      } catch (error) {
        console.error(`❌ 标签创建失败:`, error.message);
        throw error;
      }
    } else {
      console.log(`🔍 [DRY RUN] 模拟创建标签 ${tagName}`);
    }
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
          // 只发布公开包
          if (!packageJson.private) {
            packages.push({
              name: packageJson.name,
              path: packagePath,
              packageJson
            });
          }
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
          // 只发布公开包
          if (!packageJson.private) {
            packages.push({
              name: packageJson.name,
              path: modulePath,
              packageJson
            });
          }
        }
      }
    }

    return packages;
  }

  async getPublishedVersion(packageName) {
    try {
      const result = execSync(`npm view ${packageName} version`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      return result;
    } catch {
      // 包不存在或获取失败
      return null;
    }
  }
}

// 命令行接口
async function main() {
  const releaseManager = new ReleaseManager();
  await releaseManager.release();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ 发布失败:', error.message);
    process.exit(1);
  });
}

module.exports = ReleaseManager;