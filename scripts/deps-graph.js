#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DependencyGraph {
  constructor() {
    this.packages = new Map();
    this.dependencies = new Map();
  }

  async analyze() {
    try {
      // 读取 workspace 包信息
      const workspacePackages = await this.getWorkspacePackages();
      
      // 分析依赖关系
      for (const pkg of workspacePackages) {
        await this.analyzeDependencies(pkg);
      }

      // 计算构建顺序
      const buildOrder = this.calculateBuildOrder();

      return {
        packages: Array.from(this.packages.values()),
        buildOrder,
        dependencies: Array.from(this.dependencies.entries())
      };
    } catch (error) {
      console.error('依赖分析失败:', error.message);
      return {
        packages: [],
        buildOrder: [],
        dependencies: []
      };
    }
  }

  async getWorkspacePackages() {
    const packages = [];
    
    // 扫描 packages 目录
    const packagesDir = path.join(process.cwd(), 'packages');
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
    const modulesDir = path.join(process.cwd(), 'modules');
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

  async analyzeDependencies(pkg) {
    this.packages.set(pkg.name, pkg);
    
    const deps = new Set();
    
    // 收集所有依赖
    const dependencies = pkg.packageJson.dependencies || {};
    const devDependencies = pkg.packageJson.devDependencies || {};
    const peerDependencies = pkg.packageJson.peerDependencies || {};
    
    // 只关心内部包依赖
    for (const dep of Object.keys({...dependencies, ...devDependencies, ...peerDependencies})) {
      if (dep.startsWith('@linch-kit/')) {
        deps.add(dep);
      }
    }
    
    this.dependencies.set(pkg.name, deps);
  }

  calculateBuildOrder() {
    const visited = new Set();
    const visiting = new Set();
    const buildOrder = [];
    
    const visit = (packageName) => {
      if (visited.has(packageName)) return;
      if (visiting.has(packageName)) {
        throw new Error(`循环依赖检测到: ${packageName}`);
      }
      
      visiting.add(packageName);
      
      const deps = this.dependencies.get(packageName) || new Set();
      for (const dep of deps) {
        if (this.packages.has(dep)) {
          visit(dep);
        }
      }
      
      visiting.delete(packageName);
      visited.add(packageName);
      buildOrder.push(packageName);
    };
    
    // 访问所有包
    for (const packageName of this.packages.keys()) {
      visit(packageName);
    }
    
    return buildOrder;
  }
}

// 如果作为脚本直接运行
if (require.main === module) {
  const graph = new DependencyGraph();
  graph.analyze().then(result => {
    console.log('=== LinchKit 依赖分析报告 ===');
    console.log(`包总数: ${result.packages.length}`);
    console.log('构建顺序:', result.buildOrder.join(' → '));
    
    console.log('\n=== 依赖关系详情 ===');
    for (const [pkg, deps] of result.dependencies) {
      if (deps.size > 0) {
        console.log(`${pkg}:`);
        for (const dep of deps) {
          console.log(`  → ${dep}`);
        }
      }
    }
  }).catch(error => {
    console.error('分析失败:', error.message);
    process.exit(1);
  });
}

module.exports = { DependencyGraph };