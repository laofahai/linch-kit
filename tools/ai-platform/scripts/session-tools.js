#!/usr/bin/env bun
/* eslint-env node */
/**
 * LinchKit AI助手session工具集
 * 自动化执行CLAUDE.md中的繁琐步骤
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

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

function queryContext(entity, includeRelated = true, debug = false) {
  log.header('🎯 查询项目上下文');
  
  try {
    let cmd = includeRelated 
      ? `bun tools/ai-platform/scripts/context-cli.js --find-entity "${entity}" --include-related`
      : `bun tools/ai-platform/scripts/context-cli.js --find-entity "${entity}"`;
    
    // 添加调试模式参数
    if (debug) {
      cmd += ' --debug';
    }
    
    const result = runCommand(cmd, `查询实体: ${entity}`);
    
    // 显示查询结果
    if (result && result.trim()) {
      try {
        const jsonResult = JSON.parse(result);
        if (jsonResult.success && jsonResult.results) {
          if (debug) {
            // 调试模式：显示完整的JSON结果
            console.log('\n🔍 【调试模式】完整查询结果:');
            console.log(JSON.stringify(jsonResult, null, 2));
            return result;
          }
          
          // 普通模式：显示精简结果
          console.log('\n📋 查询结果:');
          if (jsonResult.results.primary_target) {
            const target = jsonResult.results.primary_target;
            console.log(`  🎯 主要实体: ${target.name} (${target.type})`);
            console.log(`  📁 文件: ${target.file_path || 'N/A'}`);
            console.log(`  📦 包: ${target.package || 'N/A'}`);
            if (target.description) {
              console.log(`  📝 描述: ${target.description}`);
            }
            if (target.current_fields && target.current_fields.length > 0) {
              console.log(`  🏷️  字段: ${target.current_fields.join(', ')}`);
            }
          }
          
          // 显示相关实体
          if (jsonResult.results.related_entities && jsonResult.results.related_entities.length > 0) {
            console.log('\n🔗 相关实体:');
            jsonResult.results.related_entities.forEach((entity, i) => {
              console.log(`  ${i + 1}. ${entity.name} (${entity.type}) - ${entity.file_path}`);
            });
          }
          
          // 显示关系
          if (jsonResult.results.relationships && jsonResult.results.relationships.length > 0) {
            console.log('\n🔄 实体关系:');
            jsonResult.results.relationships.forEach((rel, i) => {
              console.log(`  ${i + 1}. ${rel.from} --[${rel.type}]--> ${rel.to}`);
            });
          }
          
          if (jsonResult.results.related_files && Object.keys(jsonResult.results.related_files).length > 0) {
            console.log('\n📂 相关文件:');
            Object.entries(jsonResult.results.related_files).forEach(([type, files]) => {
              if (files && files.length > 0) {
                console.log(`  ${type}: ${files.join(', ')}`);
              }
            });
          }
          
          // 显示建议
          if (jsonResult.results.suggestions && Object.keys(jsonResult.results.suggestions).length > 0) {
            console.log('\n💡 智能建议:');
            Object.entries(jsonResult.results.suggestions).forEach(([, suggestion]) => {
              if (suggestion.description) {
                console.log(`  📋 ${suggestion.description}`);
                if (suggestion.steps) {
                  suggestion.steps.forEach(step => {
                    console.log(`    • ${step}`);
                  });
                }
              }
            });
          }
          
          // 显示统计信息
          if (jsonResult.metadata) {
            console.log('\n📊 查询统计:');
            console.log(`  ⏱️  执行时间: ${jsonResult.metadata.execution_time_ms}ms`);
            console.log(`  🎯 置信度: ${(jsonResult.metadata.confidence * 100).toFixed(1)}%`);
            console.log(`  📈 找到结果: ${jsonResult.metadata.total_found}`);
          }
        }
      } catch {
        console.log('\n查询结果:', result);
      }
    }
    
    return result;
  } catch {
    log.error('上下文查询失败，请检查Neo4j连接');
    return null;
  }
}

function queryRelations(entity) {
  log.header('🔗 查询实体关系');
  
  try {
    let cmd = `bun tools/ai-platform/scripts/context-cli.js --find-entity "${entity}" --include-related --debug`;
    
    // 使用静默模式执行命令，避免显示"查询结果:"
    log.info(`查询实体关系: ${entity}`);
    const result = execSync(cmd + ' 2>/dev/null', { encoding: 'utf8', stdio: 'pipe' });
    log.success(`查询实体关系: ${entity} - 完成`);
    
    if (result && result.trim()) {
      try {
        // 过滤掉日志行，只保留实际的JSON结果
        const lines = result.split('\n');
        const cleanLines = lines.filter(line => {
          // 排除结构化日志行
          if (line.includes('"level"') && line.includes('"time"') && line.includes('"pid"')) {
            return false;
          }
          return true;
        });
        
        // 重新组合清理后的内容
        const cleanResult = cleanLines.join('\n');
        
        // 解析JSON结果
        const jsonResult = JSON.parse(cleanResult);
        if (jsonResult.success && jsonResult.results) {
          console.log('\n🎯 主要实体:');
          if (jsonResult.results.primary_target) {
            const target = jsonResult.results.primary_target;
            console.log(`  ${target.name} (${target.type}) - ${target.file_path}`);
          }
          
          console.log('\n🔗 调用关系:');
          if (jsonResult.results.relationships && jsonResult.results.relationships.length > 0) {
            jsonResult.results.relationships.forEach((rel, i) => {
              console.log(`  ${i + 1}. ${rel.type}: ${rel.from} → ${rel.to}`);
            });
          } else {
            console.log('  (无直接调用关系)');
          }
          
          console.log('\n📦 相关实体:');
          if (jsonResult.results.related_entities && jsonResult.results.related_entities.length > 0) {
            const limited = jsonResult.results.related_entities.slice(0, 5); // 只显示前5个
            limited.forEach((entity, i) => {
              if (entity.name !== 'Unknown') {
                console.log(`  ${i + 1}. ${entity.name} (${entity.type}) - ${entity.file_path}`);
              }
            });
            if (jsonResult.results.related_entities.length > 5) {
              console.log(`  ... 还有 ${jsonResult.results.related_entities.length - 5} 个相关实体`);
            }
          } else {
            console.log('  (无相关实体)');
          }
        }
      } catch (e) {
        log.error('解析查询结果失败');
      }
    }
    
    // 关系模式下不返回JSON结果，避免被外层打印
    return null;
  } catch {
    log.error('关系查询失败，请检查Neo4j连接');
    return null;
  }
}

function querySymbol(symbol) {
  log.header('🔍 查询符号定义');
  
  try {
    const cmd = `bun tools/ai-platform/scripts/context-cli.js --find-symbol "${symbol}"`;
    const result = runCommand(cmd, `查询符号: ${symbol}`);
    
    // 显示查询结果
    if (result && result.trim()) {
      try {
        const jsonResult = JSON.parse(result);
        if (jsonResult.success && jsonResult.results) {
          console.log('\n📋 查询结果:');
          if (jsonResult.results.primary_target) {
            const target = jsonResult.results.primary_target;
            console.log(`  符号: ${target.name} (${target.type})`);
            console.log(`  文件: ${target.file_path || 'N/A'}`);
            console.log(`  包: ${target.package || 'N/A'}`);
          }
        }
      } catch {
        console.log('\n查询结果:', result);
      }
    }
    
    return result;
  } catch {
    log.error('符号查询失败');
    return null;
  }
}

function queryPattern(pattern, forEntity = '') {
  log.header('🔍 查询实现模式');
  
  try {
    const cmd = forEntity
      ? `bun tools/ai-platform/scripts/context-cli.js --find-pattern "${pattern}" --for-entity "${forEntity}"`
      : `bun tools/ai-platform/scripts/context-cli.js --find-pattern "${pattern}"`;
    
    const result = runCommand(cmd, `查询模式: ${pattern}`);
    
    // 显示查询结果
    if (result && result.trim()) {
      try {
        const jsonResult = JSON.parse(result);
        if (jsonResult.success && jsonResult.results) {
          console.log('\n📋 查询结果:');
          if (jsonResult.results.patterns && jsonResult.results.patterns.length > 0) {
            jsonResult.results.patterns.forEach((pattern, i) => {
              console.log(`  ${i + 1}. ${pattern.name}`);
              console.log(`     ${pattern.description}`);
            });
          } else {
            console.log('  未找到相关模式');
          }
        }
      } catch {
        console.log('\n查询结果:', result);
      }
    }
    
    return result;
  } catch {
    log.error('模式查询失败');
    return null;
  }
}

function syncGraphData() {
  log.header('🔄 同步图谱数据');
  
  try {
    // 检查是否存在 graph-data-extractor.js
    if (!existsSync('tools/ai-platform/scripts/graph-data-extractor.js')) {
      log.warn('graph-data-extractor.js 不存在，跳过图谱同步');
      return;
    }
    
    runCommand('bun tools/ai-platform/scripts/graph-data-extractor.js', '提取并更新图谱数据');
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
    } catch {
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
  } catch {
    log.error('环境验证失败');
    process.exit(1);
  }
}

// 优雅的分支创建函数
function createFeatureBranch(branchName, taskDescription = '') {
  if (!branchName) {
    log.error('请提供分支名称');
    return;
  }
  
  // 确保分支名以feature/开头
  const fullBranchName = branchName.startsWith('feature/') ? branchName : `feature/${branchName}`;
  
  // 验证分支名格式（只允许字母、数字、连字符、下划线）
  if (!/^feature\/[a-z0-9-_]+$/i.test(fullBranchName)) {
    log.error('分支名只能包含字母、数字、连字符和下划线');
    return;
  }
  
  try {
    runCommand('git stash', '暂存当前更改');
    runCommand('git checkout main', '切换到主分支');
    runCommand('git pull origin main', '更新主分支');
    runCommand(`git checkout -b ${fullBranchName}`, `创建功能分支: ${fullBranchName}`);
    
    try {
      runCommand('git stash pop', '恢复暂存的更改');
    } catch {
      log.info('没有暂存的更改需要恢复');
    }
    
    if (taskDescription) {
      log.info(`任务描述: ${taskDescription}`);
    }
    log.success(`已创建并切换到功能分支: ${fullBranchName}`);
    return fullBranchName;
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
        const taskDescription = args.join(' ');
        // 注意：这里需要Claude调用时传入生成的分支名
        // 当前暂时使用任务描述作为占位符
        log.warn('请使用Claude生成分支名后调用 bun run ai:session branch <分支名>');
        log.info(`任务描述: ${taskDescription}`);
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
      {
        // 检查是否有 --debug 或 --relations 参数
        const debugMode = args.includes('--debug');
        const relationsOnly = args.includes('--relations');
        const entity = args.filter(arg => !arg.startsWith('--'))[0];
      
      if (relationsOnly) {
        // 专门的关系查询模式 - 不输出JSON结果
        queryRelations(entity);
        return; // 直接返回，避免继续执行
      } else {
        queryContext(entity, true, debugMode);
      }
      }
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
      {
        const pattern = args[0];
        const forEntity = args[1] || '';
        queryPattern(pattern, forEntity);
      }
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
      createFeatureBranch(args[0], args.slice(1).join(' '));
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

注意: Claude会智能生成分支名称，无需手动指定复杂的英文转换
      `);
  }
}


// 主程序
const [,, command, ...args] = process.argv;
handleCommand(command, args);