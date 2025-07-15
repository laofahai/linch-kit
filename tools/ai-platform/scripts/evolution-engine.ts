#!/usr/bin/env node

/**
 * Evolution Engine CLI Adapter (进化引擎CLI适配器)
 * 
 * @description LinchKit AI Guardian Phase 4 CLI接口
 * @version 1.0.0
 * @author Claude AI Guardian
 * @created 2025-07-14
 */

import { readFileSync } from 'fs';
import { EvolutionEngine } from '../src/guardian/evolution-engine.js';

const logger = {
  info: (msg, meta) => logger.info(`[Evolution-Engine] ${msg}`, meta || ''),
  warn: (msg, meta) => logger.warn(`[Evolution-Engine] ${msg}`, meta || ''),
  error: (msg, meta) => logger.error(`[Evolution-Engine] ${msg}`, meta || ''),
  debug: (msg, meta) => process.env.DEBUG && logger.info(`[DEBUG] ${msg}`, meta || '')
};

/**
 * 显示帮助信息
 */
function showHelp() {
  logger.info(`
🧬 LinchKit Evolution Engine (进化引擎) - AI Guardian Phase 4

📋 Usage:
  bun run evolution:detect           检测架构变化
  bun run evolution:patterns         学习新功能模式
  bun run evolution:assess           执行系统健康评估
  bun run evolution:plan [type]      创建进化计划
  bun run evolution:evolve <plan>    执行进化计划
  bun run evolution:status           查看系统状态
  bun run evolution:history          查看进化历史
  bun run evolution:stats            显示统计信息

🎯 Plan Types:
  weekly       周度评估和优化
  monthly      月度策略调整  
  quarterly    季度架构升级
  yearly       年度架构升级

📊 Options:
  --cycle, -c    指定进化周期 (weekly|monthly|quarterly|yearly)
  --type, -t     指定进化类型 (architecture|feature|tooling|performance|security)
  --format, -f   输出格式 (json|table|markdown)
  --output, -o   输出文件路径
  --verbose, -v  详细输出
  --debug        调试模式

📋 Examples:
  bun run evolution:detect --verbose
  bun run evolution:plan monthly --type=performance
  bun run evolution:assess --format=json --output=health-report.json
  bun run evolution:history --format=table
  
🔗 Integration:
  进化引擎已集成到LinchKit AI Guardian系统，与其他Guardian组件协同工作
  `);
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const command = args[2];
  const options = {};
  const params = [];
  
  for (let i = 3; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    } else if (arg.startsWith('-')) {
      const flag = arg.slice(1);
      // 处理短参数
      switch (flag) {
        case 'c': options.cycle = args[++i]; break;
        case 't': options.type = args[++i]; break;
        case 'f': options.format = args[++i]; break;
        case 'o': options.output = args[++i]; break;
        case 'v': options.verbose = true; break;
        default: options[flag] = true;
      }
    } else {
      params.push(arg);
    }
  }
  
  return { command, options, params };
}

/**
 * 格式化输出
 */
function formatOutput(data, format = 'json') {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'table':
      if (Array.isArray(data)) {
        return data.map(item => 
          Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(' | ')
        ).join('\n');
      }
      return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
    case 'markdown':
      if (Array.isArray(data)) {
        const headers = Object.keys(data[0] || {});
        const headerRow = `| ${headers.join(' | ')} |`;
        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
        const dataRows = data.map(item => 
          `| ${headers.map(h => item[h] || '').join(' | ')} |`
        );
        return [headerRow, separatorRow, ...dataRows].join('\n');
      }
      return Object.entries(data).map(([k, v]) => `**${k}**: ${v}`).join('\n\n');
    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * 主函数
 */
async function main() {
  const { command, options, params } = parseArgs(process.argv);
  
  if (options.debug) {
    process.env.DEBUG = '1';
  }
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  const engine = new EvolutionEngine();
  let result;
  
  try {
    switch (command) {
      case 'detect':
        logger.info('🔍 检测架构变化...');
        result = await engine.detectArchitectureChanges();
        logger.info(`✅ 检测完成，发现 ${result.length} 个变化`);
        break;
        
      case 'patterns':
        logger.info('🧠 学习新功能模式...');
        result = await engine.learnNewFeaturePatterns();
        logger.info(`✅ 模式学习完成，识别 ${result.length} 个模式`);
        break;
        
      case 'assess':
        logger.info('🏥 执行系统健康评估...');
        result = await engine.performHealthAssessment();
        logger.info(`✅ 健康评估完成，总体评分: ${result.overallScore}`);
        break;
        
      case 'plan':
        const cycle = params[0] || options.cycle || 'weekly';
        const type = options.type || 'architecture';
        logger.info(`📋 创建 ${cycle} 进化计划 (类型: ${type})...`);
        
        // 获取必要数据
        const [changes, patterns, health] = await Promise.all([
          engine.detectArchitectureChanges(),
          engine.learnNewFeaturePatterns(),
          engine.performHealthAssessment()
        ]);
        
        result = await engine.createEvolutionPlan(changes, patterns, health, {
          cycle,
          type,
          priority: options.priority || 'medium'
        });
        logger.info(`✅ 进化计划创建完成，包含 ${result.tasks?.length || 0} 个任务`);
        break;
        
      case 'evolve':
        const planFile = params[0];
        if (!planFile) {
          logger.error('❌ 请指定进化计划文件');
          process.exit(1);
        }
        
        logger.info(`🚀 执行进化计划: ${planFile}`);
        const planData = JSON.parse(readFileSync(planFile, 'utf8'));
        result = await engine.executeEvolutionPlan(planData);
        logger.info(`✅ 进化计划执行完成，成功率: ${result.successRate}%`);
        break;
        
      case 'status':
        logger.info('📊 获取系统状态...');
        const status = await engine.getSystemStatus();
        result = {
          healthScore: status.healthScore,
          activeEvolutions: status.activeEvolutions,
          lastAssessment: status.lastAssessment,
          pendingTasks: status.pendingTasks
        };
        logger.info('✅ 系统状态获取完成');
        break;
        
      case 'history':
        logger.info('📚 获取进化历史...');
        result = await engine.getEvolutionHistory();
        logger.info(`✅ 历史记录获取完成，共 ${result.length} 条记录`);
        break;
        
      case 'stats':
        logger.info('📈 生成统计信息...');
        result = engine.getSystemStatistics();
        logger.info('✅ 统计信息生成完成');
        break;
        
      default:
        logger.error(`❌ 未知命令: ${command}`);
        showHelp();
        process.exit(1);
    }
    
    // 输出结果
    if (result) {
      const output = formatOutput(result, options.format);
      
      if (options.output) {
        const { writeFileSync } = await import('fs');
        writeFileSync(options.output, output);
        logger.info(`📁 结果已保存到: ${options.output}`);
      } else {
        logger.info('\n📊 结果:');
        logger.info(output);
      }
    }
    
  } catch (error) {
    logger.error('❌ 执行失败:', error.message);
    if (options.verbose || options.debug) {
      logger.error(error);
    }
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  logger.error('💥 严重错误:', error);
  process.exit(1);
});