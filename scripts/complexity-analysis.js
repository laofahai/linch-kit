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

// 分析函数复杂度
function analyzeComplexity(content, filePath) {
  const metrics = {
    functions: 0,
    classes: 0,
    interfaces: 0,
    types: 0,
    exports: 0,
    imports: 0,
    avgFunctionLength: 0,
    maxFunctionLength: 0,
    complexityScore: 0
  };

  // 统计导入导出
  metrics.imports = (content.match(/^import\s+/gm) || []).length;
  metrics.exports = (content.match(/^export\s+/gm) || []).length;
  
  // 统计类型定义
  metrics.interfaces = (content.match(/^(export\s+)?interface\s+\w+/gm) || []).length;
  metrics.types = (content.match(/^(export\s+)?type\s+\w+/gm) || []).length;
  metrics.classes = (content.match(/^(export\s+)?class\s+\w+/gm) || []).length;
  
  // 分析函数
  const functionMatches = content.matchAll(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]+)\s*=>|\w+\s*\([^)]*\)\s*{)/g);
  const functions = Array.from(functionMatches);
  metrics.functions = functions.length;
  
  // 计算函数长度
  let totalLength = 0;
  let maxLength = 0;
  
  functions.forEach(match => {
    const startIndex = match.index;
    let braceCount = 0;
    let inFunction = false;
    let functionLength = 0;
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0 && inFunction) {
          functionLength = content.substring(startIndex, i).split('\n').length;
          totalLength += functionLength;
          maxLength = Math.max(maxLength, functionLength);
          break;
        }
      }
    }
  });
  
  if (metrics.functions > 0) {
    metrics.avgFunctionLength = Math.round(totalLength / metrics.functions);
    metrics.maxFunctionLength = maxLength;
  }
  
  // 计算复杂度分数（简化版）
  const lines = content.split('\n').length;
  const conditions = (content.match(/\b(if|else|switch|case|while|for|do|try|catch)\b/g) || []).length;
  const callbacks = (content.match(/=>\s*{|function\s*\(/g) || []).length;
  
  metrics.complexityScore = Math.round(
    (conditions * 2 + callbacks * 1.5 + metrics.functions * 1) / (lines / 100)
  );
  
  return metrics;
}

// 分析包的复杂度
function analyzePackageComplexity() {
  const packagesDir = path.join(rootDir, 'packages');
  const packages = fs.readdirSync(packagesDir);
  const complexityReport = {
    packages: {},
    summary: {
      totalFunctions: 0,
      totalClasses: 0,
      totalInterfaces: 0,
      totalTypes: 0,
      avgComplexity: 0,
      highComplexityFiles: []
    }
  };
  
  packages.forEach(pkg => {
    const pkgPath = path.join(packagesDir, pkg);
    if (!fs.statSync(pkgPath).isDirectory()) return;
    
    const srcPath = path.join(pkgPath, 'src');
    if (!fs.existsSync(srcPath)) return;
    
    complexityReport.packages[pkg] = {
      files: {},
      summary: {
        totalFunctions: 0,
        totalClasses: 0,
        totalInterfaces: 0,
        totalTypes: 0,
        avgComplexity: 0
      }
    };
    
    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && 
                   !file.includes('.test.') && !file.includes('.spec.')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const relativePath = path.relative(pkgPath, filePath);
          const metrics = analyzeComplexity(content, relativePath);
          
          complexityReport.packages[pkg].files[relativePath] = metrics;
          
          // 更新包统计
          complexityReport.packages[pkg].summary.totalFunctions += metrics.functions;
          complexityReport.packages[pkg].summary.totalClasses += metrics.classes;
          complexityReport.packages[pkg].summary.totalInterfaces += metrics.interfaces;
          complexityReport.packages[pkg].summary.totalTypes += metrics.types;
          
          // 更新总体统计
          complexityReport.summary.totalFunctions += metrics.functions;
          complexityReport.summary.totalClasses += metrics.classes;
          complexityReport.summary.totalInterfaces += metrics.interfaces;
          complexityReport.summary.totalTypes += metrics.types;
          
          // 标记高复杂度文件
          if (metrics.complexityScore > 50 || metrics.maxFunctionLength > 100) {
            complexityReport.summary.highComplexityFiles.push({
              file: `${pkg}/${relativePath}`,
              complexity: metrics.complexityScore,
              maxFunctionLength: metrics.maxFunctionLength
            });
          }
        }
      });
    }
    
    walkDir(srcPath);
    
    // 计算包平均复杂度
    const fileCount = Object.keys(complexityReport.packages[pkg].files).length;
    if (fileCount > 0) {
      const totalComplexity = Object.values(complexityReport.packages[pkg].files)
        .reduce((sum, file) => sum + file.complexityScore, 0);
      complexityReport.packages[pkg].summary.avgComplexity = Math.round(totalComplexity / fileCount);
    }
  });
  
  // 计算总体平均复杂度
  let totalFiles = 0;
  let totalComplexity = 0;
  Object.values(complexityReport.packages).forEach(pkg => {
    const fileCount = Object.keys(pkg.files).length;
    totalFiles += fileCount;
    totalComplexity += pkg.summary.avgComplexity * fileCount;
  });
  
  if (totalFiles > 0) {
    complexityReport.summary.avgComplexity = Math.round(totalComplexity / totalFiles);
  }
  
  // 排序高复杂度文件
  complexityReport.summary.highComplexityFiles.sort((a, b) => b.complexity - a.complexity);
  
  return complexityReport;
}

// 生成复杂度报告
function generateComplexityReport() {
  console.log('🔍 开始代码复杂度分析...\n');
  
  const complexityReport = analyzePackageComplexity();
  
  // 保存 JSON 报告
  fs.writeFileSync(
    path.join(reportsDir, 'complexity-analysis.json'),
    JSON.stringify(complexityReport, null, 2)
  );
  
  // 生成 Markdown 报告
  let markdown = `# LinchKit 代码复杂度分析报告

生成时间: ${new Date().toLocaleString()}

## 📊 总体统计

- **总函数数**: ${complexityReport.summary.totalFunctions}
- **总类数**: ${complexityReport.summary.totalClasses}
- **总接口数**: ${complexityReport.summary.totalInterfaces}
- **总类型定义**: ${complexityReport.summary.totalTypes}
- **平均复杂度**: ${complexityReport.summary.avgComplexity}
- **高复杂度文件数**: ${complexityReport.summary.highComplexityFiles.length}

## 📦 包复杂度分析

| 包名 | 函数数 | 类数 | 接口数 | 类型数 | 平均复杂度 |
|------|--------|------|--------|--------|------------|
`;

  Object.entries(complexityReport.packages).forEach(([pkg, data]) => {
    markdown += `| ${pkg} | ${data.summary.totalFunctions} | ${data.summary.totalClasses} | ${data.summary.totalInterfaces} | ${data.summary.totalTypes} | ${data.summary.avgComplexity} |\n`;
  });

  if (complexityReport.summary.highComplexityFiles.length > 0) {
    markdown += `\n## ⚠️ 高复杂度文件（需要重构）\n\n`;
    markdown += `| 文件路径 | 复杂度分数 | 最大函数长度 |\n`;
    markdown += `|----------|------------|------------|\n`;
    
    complexityReport.summary.highComplexityFiles.slice(0, 20).forEach(file => {
      markdown += `| ${file.file} | ${file.complexity} | ${file.maxFunctionLength} 行 |\n`;
    });
  }

  markdown += `\n## 🔍 详细分析\n\n`;
  
  // 分析各包的特点
  Object.entries(complexityReport.packages).forEach(([pkg, data]) => {
    const fileCount = Object.keys(data.files).length;
    if (fileCount === 0) return;
    
    markdown += `### @linch-kit/${pkg}\n\n`;
    markdown += `- 文件数: ${fileCount}\n`;
    markdown += `- 平均每文件函数数: ${Math.round(data.summary.totalFunctions / fileCount)}\n`;
    markdown += `- 平均复杂度: ${data.summary.avgComplexity}\n`;
    
    // 找出最复杂的文件
    const complexFiles = Object.entries(data.files)
      .map(([file, metrics]) => ({ file, ...metrics }))
      .sort((a, b) => b.complexityScore - a.complexityScore)
      .slice(0, 3);
    
    if (complexFiles.length > 0) {
      markdown += `\n最复杂文件:\n`;
      complexFiles.forEach(file => {
        markdown += `- ${file.file} (复杂度: ${file.complexityScore})\n`;
      });
    }
    
    markdown += '\n';
  });

  markdown += `## 📈 复杂度分布\n\n`;
  
  // 统计复杂度分布
  const distribution = {
    '低 (0-20)': 0,
    '中 (21-50)': 0,
    '高 (51-100)': 0,
    '极高 (>100)': 0
  };
  
  Object.values(complexityReport.packages).forEach(pkg => {
    Object.values(pkg.files).forEach(file => {
      if (file.complexityScore <= 20) distribution['低 (0-20)']++;
      else if (file.complexityScore <= 50) distribution['中 (21-50)']++;
      else if (file.complexityScore <= 100) distribution['高 (51-100)']++;
      else distribution['极高 (>100)']++;
    });
  });
  
  Object.entries(distribution).forEach(([level, count]) => {
    markdown += `- ${level}: ${count} 个文件\n`;
  });

  fs.writeFileSync(
    path.join(reportsDir, 'complexity-analysis.md'),
    markdown
  );
  
  console.log('✅ 复杂度分析完成！');
  console.log(`📁 报告已保存至: ${reportsDir}`);
  
  // 输出摘要
  console.log('\n📊 复杂度摘要:');
  console.log(`- 总函数数: ${complexityReport.summary.totalFunctions}`);
  console.log(`- 平均复杂度: ${complexityReport.summary.avgComplexity}`);
  console.log(`- 高复杂度文件: ${complexityReport.summary.highComplexityFiles.length} 个`);
  
  if (complexityReport.summary.highComplexityFiles.length > 0) {
    console.log('\n⚠️ 需要关注的高复杂度文件:');
    complexityReport.summary.highComplexityFiles.slice(0, 5).forEach(file => {
      console.log(`  - ${file.file} (复杂度: ${file.complexity})`);
    });
  }
}

// 执行分析
generateComplexityReport();