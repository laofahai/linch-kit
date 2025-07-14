#!/usr/bin/env bun

/**
 * QA Synthesizer CLI适配器
 * 
 * 为Claude Code提供QA Synthesizer的命令行接口
 * 
 * @version 1.0.0
 * @author Claude AI Guardian
 * @created 2025-07-14
 */

const { existsSync } = require('fs');
const { join } = require('path');

// 简单的CLI参数解析
function parseArgs(args) {
  const command = args[2] || 'help';
  const options = {};
  const files = [];

  for (let i = 3; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value || true;
    } else if (arg.startsWith('-')) {
      const key = arg.substring(1);
      options[key] = args[i + 1] || true;
      i++;
    } else {
      files.push(arg);
    }
  }

  return { command, options, files };
}

// 显示帮助信息
function showHelp() {
  console.log(`
QA Synthesizer - LinchKit AI驱动测试生成系统

用法:
  bun run qa:analyze <file>              分析单个文件
  bun run qa:generate <file>             生成单个文件的测试
  bun run qa:batch <dir>                 批量处理目录下的文件
  bun run qa:report                      生成质量报告
  bun run qa:help                        显示帮助信息

选项:
  --quality=<level>                      测试质量级别 (basic|enhanced|comprehensive)
  --performance                          包含性能测试
  --security                             包含安全测试
  --output=<dir>                         输出目录
  --include=<pattern>                    包含文件模式 (glob)
  --exclude=<pattern>                    排除文件模式 (glob)
  --debug                                调试模式

示例:
  bun run qa:analyze src/services/user.service.ts
  bun run qa:generate src/components/Button.tsx --quality=comprehensive
  bun run qa:batch src/ --include="**/*.ts" --exclude="**/*.test.ts"
  bun run qa:report
`);
}

// 动态导入QA Synthesizer
async function loadQASynthesizer() {
  try {
    const module = await import('../src/guardian/qa-synthesizer.ts');
    return module;
  } catch (error) {
    console.error('❌ 无法加载QA Synthesizer:', error.message);
    console.log('💡 请确保已构建ai-platform模块: bun run build');
    process.exit(1);
  }
}

// 分析文件
async function analyzeFile(filePath, options) {
  console.log(`🔍 [${new Date().toLocaleTimeString()}] 开始分析文件: ${filePath}`);

  if (!existsSync(filePath)) {
    console.error('❌ 文件不存在:', filePath);
    return;
  }

  try {
    const { createQASynthesizer, TestQualityLevel } = await loadQASynthesizer();
    
    const config = {
      targetFile: filePath,
      qualityLevel: options.quality || TestQualityLevel.ENHANCED,
      includePerformance: options.performance || false,
      includeSecurity: options.security || false,
      outputDir: options.output
    };

    const synthesizer = createQASynthesizer(config);
    const analysis = await synthesizer.analyzeFile(filePath);

    console.log('✅ 分析完成:');
    console.log(`   📊 复杂度: ${analysis.complexity}`);
    console.log(`   🔧 函数数量: ${analysis.functions.length}`);
    console.log(`   📦 类数量: ${analysis.classes.length}`);
    console.log(`   ⚠️  边界条件: ${analysis.edgeCases.length}`);
    console.log(`   🎯 目标覆盖率: ${analysis.testStrategy.unitTestCoverage}%`);

    if (options.debug) {
      console.log('🐛 详细分析结果:');
      console.log(JSON.stringify(analysis, null, 2));
    }

  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 生成测试
async function generateTests(filePath, options) {
  console.log(`🧪 [${new Date().toLocaleTimeString()}] 开始生成测试: ${filePath}`);

  if (!existsSync(filePath)) {
    console.error('❌ 文件不存在:', filePath);
    return;
  }

  try {
    const { synthesizeTests, TestQualityLevel } = await loadQASynthesizer();
    
    const config = {
      qualityLevel: options.quality ? TestQualityLevel[options.quality.toUpperCase()] : TestQualityLevel.ENHANCED,
      includePerformance: options.performance || false,
      includeSecurity: options.security || false,
      outputDir: options.output
    };

    const testSuite = await synthesizeTests(filePath, config);

    console.log('✅ 测试生成完成:');
    console.log(`   📁 测试文件: ${testSuite.testFilePath}`);
    console.log(`   📊 测试数量: ${testSuite.testCount}`);
    console.log(`   🎯 预期覆盖率: ${testSuite.expectedCoverage}%`);
    console.log(`   ⭐ 质量评分: ${testSuite.qualityScore}/100`);

    if (options.debug) {
      console.log('🐛 生成的测试内容预览:');
      console.log(testSuite.content.substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('❌ 测试生成失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 批量处理
async function batchProcess(directory, options) {
  console.log(`📦 [${new Date().toLocaleTimeString()}] 开始批量处理: ${directory}`);

  try {
    const { glob } = await import('glob');
    const { batchSynthesizeTests, TestQualityLevel } = await loadQASynthesizer();

    // 构建glob模式
    const includePattern = options.include || '**/*.{ts,tsx}';
    const excludePattern = options.exclude || '**/*.{test,spec}.{ts,tsx}';

    // 查找文件
    const basePattern = join(directory, includePattern);
    const allFiles = await glob(basePattern);
    
    // 排除文件
    let files = allFiles;
    if (excludePattern) {
      const excludeFiles = await glob(join(directory, excludePattern));
      files = allFiles.filter(file => !excludeFiles.includes(file));
    }

    console.log(`🔍 找到 ${files.length} 个文件待处理`);

    if (files.length === 0) {
      console.log('💡 提示: 没有找到匹配的文件');
      return;
    }

    const config = {
      qualityLevel: options.quality ? TestQualityLevel[options.quality.toUpperCase()] : TestQualityLevel.ENHANCED,
      includePerformance: options.performance || false,
      includeSecurity: options.security || false,
      outputDir: options.output
    };

    const testSuites = await batchSynthesizeTests(files, config);

    console.log('✅ 批量处理完成:');
    console.log(`   📁 处理文件: ${testSuites.length}/${files.length}`);
    console.log(`   📊 总测试数量: ${testSuites.reduce((sum, suite) => sum + suite.testCount, 0)}`);
    console.log(`   ⭐ 平均质量评分: ${Math.round(testSuites.reduce((sum, suite) => sum + suite.qualityScore, 0) / testSuites.length)}/100`);

    // 列出生成的测试文件
    console.log('📝 生成的测试文件:');
    testSuites.forEach(suite => {
      console.log(`   - ${suite.testFilePath} (${suite.testCount}个测试, ${suite.qualityScore}/100分)`);
    });

  } catch (error) {
    console.error('❌ 批量处理失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 生成质量报告
async function generateReport(options) {
  console.log(`📊 [${new Date().toLocaleTimeString()}] 生成质量报告`);

  try {
    const { QASynthesizer } = await loadQASynthesizer();
    const dataDir = join(process.cwd(), '.claude', 'qa-synthesizer');

    if (!existsSync(dataDir)) {
      console.log('💡 没有找到QA Synthesizer数据，请先运行测试生成');
      return;
    }

    // 这里可以实现从历史数据生成报告的逻辑
    console.log('📁 QA Synthesizer数据目录:', dataDir);
    console.log('💡 报告功能将在有历史数据后实现');

  } catch (error) {
    console.error('❌ 生成报告失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 主函数
async function main() {
  const { command, options, files } = parseArgs(process.argv);

  // 设置调试模式
  if (options.debug) {
    process.env.DEBUG = '1';
  }

  console.log(`🤖 [${new Date().toLocaleTimeString()}] QA Synthesizer v1.0.0 启动`);

  switch (command) {
    case 'analyze':
      if (files.length === 0) {
        console.error('❌ 请指定要分析的文件');
        process.exit(1);
      }
      await analyzeFile(files[0], options);
      break;

    case 'generate':
      if (files.length === 0) {
        console.error('❌ 请指定要生成测试的文件');
        process.exit(1);
      }
      await generateTests(files[0], options);
      break;

    case 'batch':
      const directory = files[0] || './src';
      await batchProcess(directory, options);
      break;

    case 'report':
      await generateReport(options);
      break;

    case 'help':
    default:
      showHelp();
      break;
  }

  console.log(`✨ [${new Date().toLocaleTimeString()}] QA Synthesizer 执行完成`);
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  if (process.env.DEBUG) {
    console.error('Promise:', promise);
  }
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 执行失败:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { main, parseArgs };