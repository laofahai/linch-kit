#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// 创建报告目录
const reportsDir = path.join(rootDir, 'ai-context/assessment-reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// 1. 分析包结构
function analyzePackageStructure() {
  const packagesDir = path.join(rootDir, 'packages');
  const packages = fs.readdirSync(packagesDir).filter(dir => {
    const pkgPath = path.join(packagesDir, dir, 'package.json');
    return fs.existsSync(pkgPath);
  });

  const packageInfo = {};
  packages.forEach(pkg => {
    const pkgJsonPath = path.join(packagesDir, pkg, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    
    packageInfo[pkg] = {
      name: pkgJson.name,
      version: pkgJson.version,
      dependencies: pkgJson.dependencies || {},
      devDependencies: pkgJson.devDependencies || {},
      peerDependencies: pkgJson.peerDependencies || {},
      exports: pkgJson.exports,
      main: pkgJson.main,
      types: pkgJson.types
    };
  });

  return packageInfo;
}

// 2. 分析依赖关系
function analyzeDependencies(packageInfo) {
  const dependencies = {};
  const internalDeps = {};
  
  Object.entries(packageInfo).forEach(([pkgName, info]) => {
    dependencies[info.name] = {
      external: [],
      internal: [],
      peer: []
    };
    
    // 分析依赖
    Object.entries(info.dependencies).forEach(([dep, version]) => {
      if (dep.startsWith('@linch-kit/')) {
        dependencies[info.name].internal.push({ dep, version });
      } else {
        dependencies[info.name].external.push({ dep, version });
      }
    });
    
    // 分析 peer dependencies
    Object.entries(info.peerDependencies).forEach(([dep, version]) => {
      dependencies[info.name].peer.push({ dep, version });
    });
  });
  
  return dependencies;
}

// 3. 检测循环依赖
function detectCircularDependencies(dependencies) {
  const circular = [];
  const visited = new Set();
  const stack = new Set();
  
  function dfs(pkg, path = []) {
    if (stack.has(pkg)) {
      const cycleStart = path.indexOf(pkg);
      circular.push(path.slice(cycleStart).concat(pkg));
      return;
    }
    
    if (visited.has(pkg)) return;
    
    visited.add(pkg);
    stack.add(pkg);
    
    const deps = dependencies[pkg]?.internal || [];
    deps.forEach(({ dep }) => {
      dfs(dep, [...path, pkg]);
    });
    
    stack.delete(pkg);
  }
  
  Object.keys(dependencies).forEach(pkg => {
    if (!visited.has(pkg)) {
      dfs(pkg);
    }
  });
  
  return circular;
}

// 4. 分析文件结构和代码规模
function analyzeCodeMetrics() {
  const metrics = {
    packages: {},
    total: {
      files: 0,
      lines: 0,
      tsFiles: 0,
      testFiles: 0
    }
  };
  
  const packagesDir = path.join(rootDir, 'packages');
  const packages = fs.readdirSync(packagesDir);
  
  packages.forEach(pkg => {
    const pkgPath = path.join(packagesDir, pkg);
    if (!fs.statSync(pkgPath).isDirectory()) return;
    
    const srcPath = path.join(pkgPath, 'src');
    if (!fs.existsSync(srcPath)) return;
    
    metrics.packages[pkg] = {
      files: 0,
      lines: 0,
      tsFiles: 0,
      testFiles: 0
    };
    
    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          metrics.packages[pkg].files++;
          metrics.total.files++;
          
          if (file.includes('.test.') || file.includes('.spec.')) {
            metrics.packages[pkg].testFiles++;
            metrics.total.testFiles++;
          } else {
            metrics.packages[pkg].tsFiles++;
            metrics.total.tsFiles++;
          }
          
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n').length;
          metrics.packages[pkg].lines += lines;
          metrics.total.lines += lines;
        }
      });
    }
    
    walkDir(srcPath);
  });
  
  return metrics;
}

// 生成报告
function generateReport() {
  console.log('🔍 开始 LinchKit 架构分析...\n');
  
  const packageInfo = analyzePackageStructure();
  const dependencies = analyzeDependencies(packageInfo);
  const circular = detectCircularDependencies(dependencies);
  const codeMetrics = analyzeCodeMetrics();
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPackages: Object.keys(packageInfo).length,
      hasCircularDeps: circular.length > 0,
      totalFiles: codeMetrics.total.files,
      totalLines: codeMetrics.total.lines,
      testCoverage: `${((codeMetrics.total.testFiles / codeMetrics.total.files) * 100).toFixed(1)}%`
    },
    packages: packageInfo,
    dependencies,
    circularDependencies: circular,
    codeMetrics
  };
  
  // 保存 JSON 报告
  fs.writeFileSync(
    path.join(reportsDir, 'architecture-analysis.json'),
    JSON.stringify(report, null, 2)
  );
  
  // 生成 Markdown 报告
  let markdown = `# LinchKit 架构分析报告

生成时间: ${new Date().toLocaleString()}

## 📊 总体概览

- **包总数**: ${report.summary.totalPackages}
- **总文件数**: ${report.summary.totalFiles}
- **总代码行数**: ${report.summary.totalLines.toLocaleString()}
- **测试文件比例**: ${report.summary.testCoverage}
- **循环依赖**: ${report.summary.hasCircularDeps ? '⚠️ 存在' : '✅ 无'}

## 📦 包依赖分析

### 内部依赖关系
`;

  Object.entries(dependencies).forEach(([pkg, deps]) => {
    if (deps.internal.length > 0) {
      markdown += `\n#### ${pkg}\n`;
      deps.internal.forEach(({ dep, version }) => {
        markdown += `- ${dep} (${version})\n`;
      });
    }
  });

  if (circular.length > 0) {
    markdown += `\n### ⚠️ 循环依赖检测\n\n`;
    circular.forEach((cycle, i) => {
      markdown += `${i + 1}. ${cycle.join(' → ')}\n`;
    });
  }

  markdown += `\n## 📈 代码规模分析\n\n`;
  markdown += `| 包名 | 文件数 | 代码行数 | 测试文件数 |\n`;
  markdown += `|------|--------|----------|------------|\n`;
  
  Object.entries(codeMetrics.packages).forEach(([pkg, metrics]) => {
    markdown += `| ${pkg} | ${metrics.files} | ${metrics.lines.toLocaleString()} | ${metrics.testFiles} |\n`;
  });

  markdown += `\n## 🔍 架构层级分析\n\n`;
  
  // 分析架构层级
  const layers = {
    L0: ['core'],
    L1: ['schema'],
    L2: ['auth', 'crud'],
    L3: ['trpc', 'ui'],
    L4: ['ai']
  };
  
  Object.entries(layers).forEach(([layer, packages]) => {
    markdown += `### ${layer} 层\n`;
    packages.forEach(pkg => {
      if (packageInfo[pkg]) {
        const deps = dependencies[`@linch-kit/${pkg}`];
        markdown += `- **@linch-kit/${pkg}**\n`;
        if (deps?.internal.length > 0) {
          markdown += `  - 依赖: ${deps.internal.map(d => d.dep).join(', ')}\n`;
        }
      }
    });
    markdown += '\n';
  });

  fs.writeFileSync(
    path.join(reportsDir, 'architecture-analysis.md'),
    markdown
  );
  
  console.log('✅ 架构分析完成！');
  console.log(`📁 报告已保存至: ${reportsDir}`);
  
  // 输出摘要
  console.log('\n📊 分析摘要:');
  console.log(`- 包总数: ${report.summary.totalPackages}`);
  console.log(`- 总文件数: ${report.summary.totalFiles}`);
  console.log(`- 总代码行数: ${report.summary.totalLines.toLocaleString()}`);
  console.log(`- 测试覆盖率: ${report.summary.testCoverage}`);
  console.log(`- 循环依赖: ${report.summary.hasCircularDeps ? '⚠️ 发现循环依赖!' : '✅ 无'}`);
  
  return report;
}

// 执行分析
generateReport();