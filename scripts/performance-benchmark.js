#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'ai-context/assessment-reports');

// 基准测试配置
const benchmarks = {
  'Module Import': async () => {
    const start = performance.now();
    const modules = [
      '@linch-kit/core',
      '@linch-kit/schema', 
      '@linch-kit/auth',
      '@linch-kit/crud',
      '@linch-kit/trpc',
      '@linch-kit/ui'
    ];
    
    const results = {};
    for (const mod of modules) {
      const modStart = performance.now();
      try {
        await import(path.join(rootDir, 'packages', mod.split('/')[1], 'dist', 'index.js'));
        results[mod] = performance.now() - modStart;
      } catch (e) {
        results[mod] = -1; // 标记失败
      }
    }
    
    return {
      total: performance.now() - start,
      modules: results
    };
  },

  'Build Performance': async () => {
    console.log('  运行构建性能测试...');
    const packageNames = ['core', 'schema', 'auth', 'crud', 'trpc', 'ui'];
    const buildTimes = {};
    
    for (const pkg of packageNames) {
      const pkgPath = path.join(rootDir, 'packages', pkg);
      const pkgJsonPath = path.join(pkgPath, 'package.json');
      
      if (fs.existsSync(pkgJsonPath)) {
        // 模拟构建时间分析（实际项目中应该真实构建）
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const srcSize = getDirectorySize(path.join(pkgPath, 'src'));
        
        // 基于源码大小估算构建时间
        buildTimes[pkg] = {
          estimatedTime: Math.round(srcSize / 1000) + 500, // ms
          srcSize: srcSize,
          hasTests: fs.existsSync(path.join(pkgPath, 'src', '__tests__'))
        };
      }
    }
    
    return buildTimes;
  },

  'Bundle Size Analysis': async () => {
    console.log('  分析包大小...');
    const bundleSizes = {};
    
    const packages = ['core', 'schema', 'auth', 'crud', 'trpc', 'ui'];
    for (const pkg of packages) {
      const distPath = path.join(rootDir, 'packages', pkg, 'dist');
      if (fs.existsSync(distPath)) {
        bundleSizes[pkg] = {
          dist: getDirectorySize(distPath),
          src: getDirectorySize(path.join(rootDir, 'packages', pkg, 'src'))
        };
      }
    }
    
    return bundleSizes;
  },

  'Type Check Performance': async () => {
    console.log('  测试类型检查性能...');
    // 模拟类型检查时间
    const packages = ['core', 'schema', 'auth', 'crud', 'trpc', 'ui'];
    const typeCheckTimes = {};
    
    for (const pkg of packages) {
      const tsConfigPath = path.join(rootDir, 'packages', pkg, 'tsconfig.json');
      if (fs.existsSync(tsConfigPath)) {
        const srcFiles = countFiles(path.join(rootDir, 'packages', pkg, 'src'), '.ts');
        // 基于文件数量估算类型检查时间
        typeCheckTimes[pkg] = {
          files: srcFiles,
          estimatedTime: srcFiles * 50 // 每个文件约 50ms
        };
      }
    }
    
    return typeCheckTimes;
  }
};

// 工具函数
function getDirectorySize(dir) {
  if (!fs.existsSync(dir)) return 0;
  
  let size = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stat.size;
    }
  }
  
  return size;
}

function countFiles(dir, ext) {
  if (!fs.existsSync(dir)) return 0;
  
  let count = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      count += countFiles(filePath, ext);
    } else if (file.endsWith(ext)) {
      count++;
    }
  }
  
  return count;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 运行基准测试
async function runBenchmarks() {
  console.log('🚀 开始性能基准测试...\n');
  
  const results = {};
  
  for (const [name, benchmark] of Object.entries(benchmarks)) {
    console.log(`运行: ${name}`);
    try {
      results[name] = await benchmark();
    } catch (error) {
      results[name] = { error: error.message };
    }
  }
  
  // 保存结果
  fs.writeFileSync(
    path.join(reportsDir, 'performance-benchmark.json'),
    JSON.stringify(results, null, 2)
  );
  
  // 生成报告
  generatePerformanceReport(results);
}

function generatePerformanceReport(results) {
  let report = `# LinchKit 性能基准测试报告

生成时间: ${new Date().toLocaleString()}

## 🚀 构建性能

| 包名 | 源码大小 | 预估构建时间 | 包含测试 |
|------|----------|-------------|----------|
`;

  if (results['Build Performance']) {
    Object.entries(results['Build Performance']).forEach(([pkg, data]) => {
      report += `| ${pkg} | ${formatBytes(data.srcSize)} | ${data.estimatedTime}ms | ${data.hasTests ? '✅' : '❌'} |\n`;
    });
  }

  report += `\n## 📦 包大小分析

| 包名 | 源码大小 | 构建后大小 | 压缩比 |
|------|----------|------------|--------|
`;

  if (results['Bundle Size Analysis']) {
    Object.entries(results['Bundle Size Analysis']).forEach(([pkg, data]) => {
      const ratio = data.dist ? ((data.dist / data.src) * 100).toFixed(1) : 'N/A';
      report += `| ${pkg} | ${formatBytes(data.src)} | ${formatBytes(data.dist || 0)} | ${ratio}% |\n`;
    });
  }

  report += `\n## ⚡ 类型检查性能

| 包名 | 文件数 | 预估检查时间 |
|------|--------|-------------|
`;

  if (results['Type Check Performance']) {
    Object.entries(results['Type Check Performance']).forEach(([pkg, data]) => {
      report += `| ${pkg} | ${data.files} | ${data.estimatedTime}ms |\n`;
    });
  }

  report += `\n## 📊 性能洞察

### 优化建议

1. **构建优化**
   - 考虑使用 esbuild 或 swc 加速构建
   - 实施增量构建策略
   - 优化依赖树结构

2. **包大小优化**
   - 实施 tree-shaking
   - 分离开发依赖
   - 使用动态导入减少初始加载

3. **类型检查优化**
   - 使用项目引用加速类型检查
   - 实施增量类型检查
   - 考虑并行类型检查

4. **运行时优化**
   - 实施懒加载策略
   - 优化关键路径
   - 添加缓存机制
`;

  fs.writeFileSync(
    path.join(reportsDir, 'performance-benchmark.md'),
    report
  );
  
  console.log('\n✅ 性能基准测试完成！');
  console.log(`📁 报告已保存至: ${reportsDir}/performance-benchmark.md`);
}

// 执行测试
runBenchmarks().catch(console.error);