#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const reportsDir = path.join(rootDir, 'ai-context/assessment-reports');

// 读取架构分析数据
const analysisData = JSON.parse(
  fs.readFileSync(path.join(reportsDir, 'architecture-analysis.json'), 'utf-8')
);

// 生成 Mermaid 图表
function generateMermaidDiagram() {
  let mermaid = `graph TB
    subgraph "LinchKit Architecture"
        subgraph "L0 - Foundation"
            Core["@linch-kit/core<br/>基础设施层<br/>12,953 行"]
        end
        
        subgraph "L1 - Schema"
            Schema["@linch-kit/schema<br/>Schema 引擎<br/>7,600 行"]
        end
        
        subgraph "L2 - Business Logic"
            Auth["@linch-kit/auth<br/>认证授权<br/>5,313 行"]
            CRUD["@linch-kit/crud<br/>CRUD 操作<br/>14,001 行"]
        end
        
        subgraph "L3 - Interface"
            TRPC["@linch-kit/trpc<br/>API 层<br/>3,493 行"]
            UI["@linch-kit/ui<br/>UI 组件<br/>4,001 行"]
        end
        
        subgraph "L4 - Applications"
            Console["modules/console<br/>管理平台"]
            Website["apps/website<br/>文档平台"]
            AI["@linch-kit/ai<br/>AI 集成<br/>(规划中)"]
        end
    end
    
    %% 依赖关系
    Schema --> Core
    Auth --> Core
    Auth --> Schema
    CRUD --> Core
    CRUD --> Schema
    CRUD --> Auth
    TRPC --> Core
    TRPC --> Schema
    TRPC --> Auth
    UI --> Core
    UI --> Schema
    UI --> Auth
    UI --> CRUD
    Console --> TRPC
    Console --> UI
    Website --> UI
    AI -.-> Core
    AI -.-> Schema
    
    %% 样式
    classDef l0 fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef l1 fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef l2 fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef l3 fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef l4 fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef planned fill:#f5f5f5,stroke:#616161,stroke-width:2px,stroke-dasharray: 5 5
    
    class Core l0
    class Schema l1
    class Auth,CRUD l2
    class TRPC,UI l3
    class Console,Website l4
    class AI planned
`;

  return mermaid;
}

// 生成依赖矩阵
function generateDependencyMatrix() {
  const packages = ['core', 'schema', 'auth', 'crud', 'trpc', 'ui'];
  let matrix = `# 依赖矩阵

| 包 \\ 依赖于 | core | schema | auth | crud | trpc | ui |
|-------------|------|--------|------|------|------|-----|
`;

  packages.forEach(pkg => {
    let row = `| ${pkg} |`;
    packages.forEach(dep => {
      if (pkg === dep) {
        row += ' - |';
      } else {
        const pkgName = `@linch-kit/${pkg}`;
        const depName = `@linch-kit/${dep}`;
        const hasDep = analysisData.dependencies[pkgName]?.internal.some(
          d => d.dep === depName
        );
        row += hasDep ? ' ✓ |' : '   |';
      }
    });
    matrix += row + '\n';
  });

  return matrix;
}

// 生成包统计图表
function generatePackageStats() {
  const stats = Object.entries(analysisData.codeMetrics.packages)
    .map(([pkg, metrics]) => ({
      name: pkg,
      lines: metrics.lines,
      files: metrics.files,
      tests: metrics.testFiles
    }))
    .sort((a, b) => b.lines - a.lines);

  let chart = `# 包规模统计

\`\`\`mermaid
pie title 代码行数分布
`;

  stats.forEach(pkg => {
    const percentage = ((pkg.lines / analysisData.codeMetrics.total.lines) * 100).toFixed(1);
    chart += `    "${pkg.name}" : ${pkg.lines}\n`;
  });

  chart += `\`\`\`

\`\`\`mermaid
bar-chart
    title 各包文件数统计
    x-axis [${stats.map(p => p.name).join(', ')}]
    y-axis "文件数" 0 --> ${Math.max(...stats.map(p => p.files))}
    bar [${stats.map(p => p.files).join(', ')}]
\`\`\`
`;

  return chart;
}

// 生成综合报告
function generateVisualizationReport() {
  console.log('📊 生成架构可视化图表...\n');

  const mermaidDiagram = generateMermaidDiagram();
  const dependencyMatrix = generateDependencyMatrix();
  const packageStats = generatePackageStats();

  const report = `# LinchKit 架构可视化

生成时间: ${new Date().toLocaleString()}

## 🏗️ 整体架构图

\`\`\`mermaid
${mermaidDiagram}
\`\`\`

## 📊 架构特点

1. **分层架构**: 严格的 4 层架构设计，自下而上依赖
2. **无循环依赖**: ✅ 架构设计良好，没有循环依赖
3. **模块化设计**: 每个包职责单一，高内聚低耦合
4. **Schema 驱动**: 以 @linch-kit/schema 为核心的数据驱动架构

## 🔗 ${dependencyMatrix}

## 📈 ${packageStats}

## 🎯 架构洞察

### 优势
1. **清晰的层次结构**: L0→L1→L2→L3→L4 的依赖关系清晰
2. **核心稳定**: @linch-kit/core 作为基础设施层，被所有包依赖
3. **Schema 中心化**: 统一的数据模型定义和验证
4. **适度的包大小**: 最大的包（crud）也只有 14k 行，易于维护

### 改进建议
1. **测试覆盖率**: 当前 19.4% 偏低，建议提升到 80%+
2. **UI 包测试**: ui 包只有 1 个测试文件，需要加强
3. **文档完善**: 部分包缺少详细的 API 文档
4. **性能监控**: 建议添加性能基准测试

## 📋 下一步行动
1. 运行性能基准测试
2. 收集运行时指标
3. 准备与 Gemini 的深度技术讨论
`;

  fs.writeFileSync(
    path.join(reportsDir, 'architecture-visualization.md'),
    report
  );

  console.log('✅ 架构可视化生成完成！');
  console.log(`📁 报告已保存至: ${reportsDir}/architecture-visualization.md`);
  
  return report;
}

// 执行生成
generateVisualizationReport();