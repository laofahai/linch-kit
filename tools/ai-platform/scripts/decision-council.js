#!/usr/bin/env bun

/**
 * Decision Council CLI适配器
 * 
 * 为Claude Code提供Decision Council的命令行接口
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
  const values = [];

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
      values.push(arg);
    }
  }

  return { command, options, values };
}

// 显示帮助信息
function showHelp() {
  console.log(`
Decision Council - LinchKit多Agent架构决策辩论系统

用法:
  bun run council:decide <title>             创建新决策分析
  bun run council:analyze <decision-id>      分析特定决策
  bun run council:history                    查看决策历史
  bun run council:report <decision-id>       生成决策报告
  bun run council:stats                      查看统计信息
  bun run council:help                       显示帮助信息

选项:
  --type=<type>                             决策类型 (architecture|technology|performance|security|integration|refactoring)
  --priority=<priority>                     优先级 (critical|high|medium|low)
  --description=<desc>                      决策描述
  --option=<name:desc:complexity:cost>      添加决策选项 (可重复)
  --context=<key:value>                     添加上下文信息 (可重复)
  --format=<format>                         输出格式 (json|markdown|table)
  --debug                                   调试模式

示例:
  bun run council:decide "选择前端框架" --type=technology --priority=high
  bun run council:analyze decision-123 --format=markdown
  bun run council:history --type=architecture
  bun run council:report decision-123 --format=markdown
  bun run council:stats
`);
}

// 动态导入Decision Council
async function loadDecisionCouncil() {
  try {
    const module = await import('../src/guardian/decision-council.ts');
    return module;
  } catch (error) {
    console.error('❌ 无法加载Decision Council:', error.message);
    console.log('💡 请确保已构建ai-platform模块: bun run build');
    process.exit(1);
  }
}

// 解析选项字符串
function parseOption(optionStr) {
  const parts = optionStr.split(':');
  if (parts.length < 4) {
    throw new Error('选项格式错误，应为: name:description:complexity:cost');
  }

  return {
    id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: parts[0],
    description: parts[1],
    complexity: parseInt(parts[2], 10),
    cost: {
      development: parseInt(parts[3], 10),
      maintenance: parseInt(parts[4], 10) || 5,
      learning: parseInt(parts[5], 10) || 3
    },
    pros: parts[6] ? parts[6].split(',') : ['待评估'],
    cons: parts[7] ? parts[7].split(',') : ['待评估'],
    risks: []
  };
}

// 解析上下文信息
function parseContext(options) {
  const context = {};
  
  if (options.context) {
    const contexts = Array.isArray(options.context) ? options.context : [options.context];
    contexts.forEach(ctx => {
      const [key, value] = ctx.split(':');
      if (key && value) {
        context[key] = value.split(',');
      }
    });
  }

  return context;
}

// 创建新决策分析
async function createDecision(title, options) {
  console.log(`🏛️ [${new Date().toLocaleTimeString()}] 创建新决策分析: ${title}`);

  if (!title) {
    console.error('❌ 请提供决策标题');
    return;
  }

  try {
    const { createDecisionCouncil, DecisionType, DecisionPriority } = await loadDecisionCouncil();

    // 解析决策选项
    const decisionOptions = [];
    if (options.option) {
      const optionStrs = Array.isArray(options.option) ? options.option : [options.option];
      optionStrs.forEach(optionStr => {
        try {
          const option = parseOption(optionStr);
          decisionOptions.push(option);
        } catch (error) {
          console.warn(`⚠️ 跳过无效选项: ${optionStr} (${error.message})`);
        }
      });
    }

    // 如果没有提供选项，创建默认选项
    if (decisionOptions.length === 0) {
      console.log('💡 未提供决策选项，创建默认选项');
      decisionOptions.push(
        {
          id: 'option-1',
          name: '方案A',
          description: '第一个可选方案',
          complexity: 5,
          cost: { development: 100, maintenance: 5, learning: 3 },
          pros: ['实现简单', '风险较低'],
          cons: ['功能有限'],
          risks: []
        },
        {
          id: 'option-2',
          name: '方案B',
          description: '第二个可选方案',
          complexity: 7,
          cost: { development: 200, maintenance: 7, learning: 6 },
          pros: ['功能丰富', '扩展性好'],
          cons: ['复杂度高', '成本较大'],
          risks: []
        }
      );
    }

    // 构建决策输入
    const decisionInput = {
      id: `decision-${Date.now()}`,
      title,
      description: options.description || `关于${title}的决策分析`,
      type: options.type ? DecisionType[options.type.toUpperCase()] : DecisionType.TECHNOLOGY,
      priority: options.priority ? DecisionPriority[options.priority.toUpperCase()] : DecisionPriority.MEDIUM,
      context: parseContext(options),
      options: decisionOptions,
      deadline: options.deadline
    };

    const council = createDecisionCouncil();
    const decision = await council.analyzeDecision(decisionInput);

    console.log('✅ 决策分析完成:');
    console.log(`   🎯 决策ID: ${decision.decisionId}`);
    console.log(`   📋 推荐方案: ${decision.recommendedOption}`);
    console.log(`   📊 置信度: ${decision.confidence.toFixed(1)}%`);
    console.log(`   🤝 共识级别: ${decision.consensusLevel}`);
    console.log(`   ⚠️ 风险评分: ${decision.riskSummary.overallRisk}/10`);
    console.log(`   👤 需要人工审核: ${decision.requiresHumanReview ? '是' : '否'}`);

    if (decision.controversies.length > 0) {
      console.log('   🔥 争议点:');
      decision.controversies.forEach(controversy => {
        console.log(`      - ${controversy}`);
      });
    }

    if (options.format === 'json') {
      console.log('\n📄 详细结果 (JSON):');
      console.log(JSON.stringify(decision, null, 2));
    } else if (options.format === 'markdown') {
      console.log('\n📄 决策报告:');
      const report = council.generateDecisionReport(decision);
      console.log(report);
    }

  } catch (error) {
    console.error('❌ 决策分析失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 分析特定决策
async function analyzeDecision(decisionId, options) {
  console.log(`🔍 [${new Date().toLocaleTimeString()}] 分析决策: ${decisionId}`);

  if (!decisionId) {
    console.error('❌ 请提供决策ID');
    return;
  }

  try {
    const { createDecisionCouncil } = await loadDecisionCouncil();
    const council = createDecisionCouncil();
    
    const history = council.getDecisionHistory(decisionId);
    if (history.length === 0) {
      console.error('❌ 未找到决策记录:', decisionId);
      return;
    }

    const record = history[0];
    const decision = record.result;

    console.log('✅ 决策分析结果:');
    console.log(`   📋 标题: ${record.input.title}`);
    console.log(`   📊 类型: ${record.input.type}`);
    console.log(`   🎯 推荐方案: ${decision.recommendedOption}`);
    console.log(`   📈 置信度: ${decision.confidence.toFixed(1)}%`);
    console.log(`   🤝 共识级别: ${decision.consensusLevel}`);
    console.log(`   ⚠️ 风险评分: ${decision.riskSummary.overallRisk}/10`);
    console.log(`   📅 决策时间: ${decision.decidedAt}`);
    console.log(`   🚀 实施状态: ${record.implementationStatus}`);

    console.log('\n🤖 Agent分析:');
    decision.agentAnalyses.forEach(analysis => {
      console.log(`   ${analysis.role}: ${analysis.recommendedOption} (${analysis.confidence.toFixed(1)}%)`);
    });

    if (options.format === 'markdown') {
      console.log('\n📄 完整决策报告:');
      const report = council.generateDecisionReport(decision);
      console.log(report);
    } else if (options.format === 'json') {
      console.log('\n📄 详细数据 (JSON):');
      console.log(JSON.stringify(record, null, 2));
    }

  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 查看决策历史
async function viewHistory(options) {
  console.log(`📚 [${new Date().toLocaleTimeString()}] 查看决策历史`);

  try {
    const { createDecisionCouncil } = await loadDecisionCouncil();
    const council = createDecisionCouncil();
    
    const history = council.getDecisionHistory();
    
    if (history.length === 0) {
      console.log('📭 暂无决策历史记录');
      return;
    }

    // 过滤选项
    let filteredHistory = history;
    if (options.type) {
      filteredHistory = history.filter(h => h.input.type === options.type);
    }
    if (options.priority) {
      filteredHistory = history.filter(h => h.input.priority === options.priority);
    }

    console.log(`📋 找到 ${filteredHistory.length} 条决策记录:`);

    if (options.format === 'table') {
      console.log('\n| 决策ID | 标题 | 类型 | 优先级 | 推荐方案 | 置信度 | 状态 |');
      console.log('|--------|------|------|--------|----------|--------|------|');
      
      filteredHistory.forEach(record => {
        const id = record.input.id.substring(0, 12) + '...';
        const title = record.input.title.length > 20 ? 
          record.input.title.substring(0, 17) + '...' : record.input.title;
        const confidence = record.result.confidence.toFixed(1) + '%';
        
        console.log(`| ${id} | ${title} | ${record.input.type} | ${record.input.priority} | ${record.result.recommendedOption} | ${confidence} | ${record.implementationStatus} |`);
      });
    } else {
      filteredHistory.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.input.title}`);
        console.log(`   📋 ID: ${record.input.id}`);
        console.log(`   📊 类型: ${record.input.type} | 优先级: ${record.input.priority}`);
        console.log(`   🎯 推荐: ${record.result.recommendedOption}`);
        console.log(`   📈 置信度: ${record.result.confidence.toFixed(1)}%`);
        console.log(`   🚀 状态: ${record.implementationStatus}`);
        console.log(`   📅 时间: ${record.result.decidedAt}`);
      });
    }

    if (options.format === 'json') {
      console.log('\n📄 详细数据 (JSON):');
      console.log(JSON.stringify(filteredHistory, null, 2));
    }

  } catch (error) {
    console.error('❌ 查看历史失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 生成决策报告
async function generateReport(decisionId, options) {
  console.log(`📄 [${new Date().toLocaleTimeString()}] 生成决策报告: ${decisionId}`);

  if (!decisionId) {
    console.error('❌ 请提供决策ID');
    return;
  }

  try {
    const { createDecisionCouncil } = await loadDecisionCouncil();
    const council = createDecisionCouncil();
    
    const history = council.getDecisionHistory(decisionId);
    if (history.length === 0) {
      console.error('❌ 未找到决策记录:', decisionId);
      return;
    }

    const decision = history[0].result;
    const report = council.generateDecisionReport(decision);

    if (options.format === 'json') {
      console.log(JSON.stringify({
        decisionId,
        report,
        metadata: {
          generatedAt: new Date().toISOString(),
          format: 'markdown'
        }
      }, null, 2));
    } else {
      console.log(report);
    }

  } catch (error) {
    console.error('❌ 生成报告失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 查看统计信息
async function viewStatistics(options) {
  console.log(`📊 [${new Date().toLocaleTimeString()}] 查看统计信息`);

  try {
    const { createDecisionCouncil } = await loadDecisionCouncil();
    const council = createDecisionCouncil();
    
    const stats = council.getStatistics();

    console.log('📈 Decision Council 统计信息:');
    console.log(`   📋 总决策数量: ${stats.totalDecisions}`);
    console.log(`   📊 平均置信度: ${stats.avgConfidence.toFixed(1)}%`);
    console.log(`   👤 人工审核率: ${stats.humanReviewRate.toFixed(1)}%`);

    console.log('\n📊 按类型分布:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`   ${type}: ${count}`);
      }
    });

    console.log('\n📊 按优先级分布:');
    Object.entries(stats.byPriority).forEach(([priority, count]) => {
      if (count > 0) {
        console.log(`   ${priority}: ${count}`);
      }
    });

    if (options.format === 'json') {
      console.log('\n📄 详细统计 (JSON):');
      console.log(JSON.stringify(stats, null, 2));
    }

  } catch (error) {
    console.error('❌ 查看统计失败:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
}

// 主函数
async function main() {
  const { command, options, values } = parseArgs(process.argv);

  // 设置调试模式
  if (options.debug) {
    process.env.DEBUG = '1';
  }

  console.log(`🏛️ [${new Date().toLocaleTimeString()}] Decision Council v1.0.0 启动`);

  switch (command) {
    case 'decide':
      await createDecision(values[0], options);
      break;

    case 'analyze':
      await analyzeDecision(values[0], options);
      break;

    case 'history':
      await viewHistory(options);
      break;

    case 'report':
      await generateReport(values[0], options);
      break;

    case 'stats':
      await viewStatistics(options);
      break;

    case 'help':
    default:
      showHelp();
      break;
  }

  console.log(`✨ [${new Date().toLocaleTimeString()}] Decision Council 执行完成`);
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