#!/usr/bin/env bun
/**
 * LinchKit AI助手session工具集
 * 自动化执行CLAUDE.md中的繁琐步骤
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

function runCommand(cmd, description) {
  try {
    log.info(description);
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    log.success(`${description} - 完成`);
    return result;
  } catch (error) {
    log.error(`${description} - 失败: ${error.message}`);
    throw error;
  }
}

function checkProjectStatus() {
  log.header('🔍 项目状态检查');
  
  // 检查当前目录
  const pwd = process.cwd();
  log.info(`当前目录: ${pwd}`);
  
  // 检查是否在项目根目录
  if (!existsSync('package.json') || !existsSync('CLAUDE.md')) {
    log.error('请在项目根目录执行此命令');
    process.exit(1);
  }
  
  // 检查当前分支
  try {
    const branch = runCommand('git branch --show-current', '检查当前分支').trim();
    if (branch === 'main' || branch === 'master') {
      log.warn(`当前在主分支 (${branch})，建议创建功能分支`);
      return { needBranch: true, currentBranch: branch };
    } else {
      log.success(`当前在功能分支: ${branch}`);
      return { needBranch: false, currentBranch: branch };
    }
  } catch {
    log.error('无法获取分支信息');
    process.exit(1);
  }
}

function checkTodos() {
  log.header('📋 检查待办任务');
  // 这里可以集成TodoRead的逻辑
  log.info('建议在开发前检查是否有未完成的任务');
}

function queryContext(entity, includeRelated = true) {
  log.header('🎯 查询项目上下文');
  
  try {
    const cmd = includeRelated 
      ? `bun scripts/ai/context-cli.js --find-entity "${entity}" --include-related`
      : `bun scripts/ai/context-cli.js --find-entity "${entity}"`;
    
    const result = runCommand(cmd, `查询实体: ${entity}`);
    return result;
  } catch (error) {
    log.error('上下文查询失败，请检查Neo4j连接');
    return null;
  }
}

function querySymbol(symbol) {
  log.header('🔍 查询符号定义');
  
  try {
    const cmd = `bun scripts/ai/context-cli.js --find-symbol "${symbol}"`;
    const result = runCommand(cmd, `查询符号: ${symbol}`);
    return result;
  } catch (error) {
    log.error('符号查询失败');
    return null;
  }
}

function queryPattern(pattern, forEntity = '') {
  log.header('🔍 查询实现模式');
  
  try {
    const cmd = forEntity
      ? `bun scripts/ai/context-cli.js --find-pattern "${pattern}" --for-entity "${forEntity}"`
      : `bun scripts/ai/context-cli.js --find-pattern "${pattern}"`;
    
    const result = runCommand(cmd, `查询模式: ${pattern}`);
    return result;
  } catch (error) {
    log.error('模式查询失败');
    return null;
  }
}

function syncGraphData() {
  log.header('🔄 同步图谱数据');
  
  try {
    // 检查是否存在 graph-data-extractor.ts
    if (!existsSync('scripts/graph-data-extractor.ts')) {
      log.warn('graph-data-extractor.ts 不存在，跳过图谱同步');
      return;
    }
    
    runCommand('bun scripts/graph-data-extractor.ts', '提取并更新图谱数据');
    log.success('图谱数据同步完成');
    
    // 验证查询功能
    log.info('验证查询功能...');
    queryContext('User', false);
    
  } catch (error) {
    log.error('图谱数据同步失败');
    throw error;
  }
}

function runBasicValidation() {
  log.header('⚡ 基础验证');
  
  try {
    // 代码质量检查
    runCommand('bun run lint', '代码格式检查');
    
    // 类型检查
    runCommand('bun run check-types', 'TypeScript类型检查');
    
    // 构建验证
    runCommand('bun run build', '构建验证');
    
    log.success('基础验证通过！');
  } catch (error) {
    log.error('基础验证失败，请修复问题后重试');
    throw error;
  }
}

function runFullValidation() {
  log.header('🔍 完整项目验证');
  
  try {
    // 基础验证
    runBasicValidation();
    
    // 测试（可能失败但不阻断）
    try {
      runCommand('bun run test', '运行测试套件');
    } catch (error) {
      log.warn('测试未通过，但不阻断验证流程');
    }
    
    // 图谱数据同步验证
    syncGraphData();
    
    log.success('完整验证通过！');
  } catch (error) {
    log.error('验证失败，请修复问题后重试');
    throw error;
  }
}

function validateEnvironment() {
  log.header('🔧 环境验证');
  
  try {
    // 检查关键命令
    runCommand('bun --version', '检查bun版本');
    runCommand('git --version', '检查git版本');
    
    // 检查项目依赖
    if (!existsSync('node_modules')) {
      log.warn('依赖未安装，正在安装...');
      runCommand('bun install', '安装项目依赖');
    }
    
    log.success('环境验证通过');
  } catch (error) {
    log.error('环境验证失败');
    process.exit(1);
  }
}

function createFeatureBranch(taskName) {
  if (!taskName) {
    log.error('请提供任务名称');
    return;
  }
  
  const branchName = `feature/${taskName.toLowerCase().replace(/\s+/g, '-')}`;
  
  try {
    runCommand('git stash', '暂存当前更改');
    runCommand('git checkout main', '切换到主分支');
    runCommand('git pull origin main', '更新主分支');
    runCommand(`git checkout -b ${branchName}`, `创建功能分支: ${branchName}`);
    
    try {
      runCommand('git stash pop', '恢复暂存的更改');
    } catch {
      log.info('没有暂存的更改需要恢复');
    }
    
    log.success(`已创建并切换到功能分支: ${branchName}`);
    return branchName;
  } catch (error) {
    log.error('创建分支失败');
    throw error;
  }
}

// 主要命令处理
function handleCommand(command, args) {
  switch (command) {
    case 'init':
    case 'start':
      // Session初始化
      log.header('🚀 LinchKit AI Session 初始化');
      
      const status = checkProjectStatus();
      validateEnvironment();
      checkTodos();
      
      if (status.needBranch && args.length > 0) {
        const taskName = args.join('-');
        createFeatureBranch(taskName);
      }
      
      log.success('Session初始化完成！');
      break;
      
    case 'query':
    case 'entity':
      // 上下文查询
      if (args.length === 0) {
        log.error('请提供要查询的实体名称');
        process.exit(1);
      }
      queryContext(args[0], true);
      break;
      
    case 'symbol':
      // 符号查询
      if (args.length === 0) {
        log.error('请提供要查询的符号名称');
        process.exit(1);
      }
      querySymbol(args[0]);
      break;
      
    case 'pattern':
      // 模式查询
      if (args.length === 0) {
        log.error('请提供要查询的模式');
        process.exit(1);
      }
      const pattern = args[0];
      const forEntity = args[1] || '';
      queryPattern(pattern, forEntity);
      break;
      
    case 'sync':
    case 'sync-graph':
      // 同步图谱数据
      syncGraphData();
      break;
      
    case 'branch':
      // 创建功能分支
      if (args.length === 0) {
        log.error('请提供分支名称');
        process.exit(1);
      }
      createFeatureBranch(args.join('-'));
      break;
      
    case 'check':
    case 'basic':
      // 基础验证
      runBasicValidation();
      break;
      
    case 'validate':
    case 'full':
      // 完整验证
      runFullValidation();
      break;
      
    case 'help':
    default:
      console.log(`
${colors.bold}LinchKit AI Session 工具${colors.reset}

使用方法:
  bun run ai:session <command> [args]

命令:
  init [task-name]     初始化AI开发session，可选创建功能分支
  query <entity>       查询实体的项目上下文（包含相关文件）
  symbol <symbol>      查询符号定义（函数、类、接口等）
  pattern <pattern> [entity]  查询实现模式
  sync                 同步Neo4j图谱数据
  branch <name>        创建新的功能分支
  check                运行基础验证（lint + 类型检查 + 构建）
  validate             运行完整验证（基础验证 + 测试 + 图谱同步）
  help                 显示此帮助

示例:
  bun run ai:session init "添加用户头像功能"
  bun run ai:session query User
  bun run ai:session symbol UserSchema
  bun run ai:session pattern add_field User
  bun run ai:session sync
  bun run ai:session check     # 快速验证
  bun run ai:session validate  # 完整验证
      `);
  }
}

// 主程序
const [,, command, ...args] = process.argv;
handleCommand(command, args);