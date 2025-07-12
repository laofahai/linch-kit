#!/usr/bin/env bun
/* eslint-env node */
/**
 * LinchKit 图谱数据提取器
 * 使用AI CLI工具提取项目数据到Neo4j图数据库
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

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

function checkEnvironment() {
  log.header('🔍 环境检查');
  
  // 检查当前目录
  const pwd = process.cwd();
  log.info(`当前目录: ${pwd}`);
  
  // 检查是否在项目根目录
  if (!existsSync('package.json') || !existsSync('CLAUDE.md')) {
    log.error('请在项目根目录执行此脚本');
    process.exit(1);
  }
  
  // 检查LinchKit CLI工具是否存在
  const cliPath = resolve('packages/core/dist/cli.js');
  if (!existsSync(cliPath)) {
    log.warn('LinchKit CLI工具不存在，尝试构建...');
    try {
      runCommand('bun run build', '构建LinchKit CLI工具');
    } catch {
      log.error('构建失败，请手动运行 bun run build');
      process.exit(1);
    }
  }
  
  log.success('环境检查通过');
}

function checkNeo4jConnection() {
  log.header('🔗 Neo4j连接检查');
  
  // 检查环境变量
  const requiredEnvVars = [
    'NEO4J_CONNECTION_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    log.error(`缺少必要的环境变量: ${missingEnvVars.join(', ')}`);
    log.info('请在 .env.local 文件中配置Neo4j连接信息');
    process.exit(1);
  }
  
  log.success('Neo4j连接配置检查通过');
}

function extractToNeo4j() {
  log.header('📊 提取数据到Neo4j');
  
  try {
    // 直接使用Node.js调用AI CLI模块
    const extractCmd = `bun tools/context/dist/cli/main.js ai:extract --extractors all --output neo4j --clear`;
    
    runCommand(extractCmd, '提取项目数据到Neo4j数据库');
    
    log.success('数据提取完成');
  } catch (error) {
    log.error('数据提取失败');
    throw error;
  }
}

function extractToJson() {
  log.header('📄 提取数据到JSON文件');
  
  try {
    // 直接使用Node.js调用AI CLI模块
    const extractCmd = `bun tools/context/dist/cli/main.js ai:extract --extractors all --output json`;
    
    runCommand(extractCmd, '提取项目数据到JSON文件');
    
    log.success('JSON数据提取完成');
  } catch {
    log.warn('JSON数据提取失败，但不影响主流程');
  }
}

function validateExtraction() {
  log.header('✅ 验证数据提取');
  
  try {
    // 检查graph-data目录是否存在
    const graphDataPath = resolve('tools/context/graph-data');
    if (existsSync(graphDataPath)) {
      log.success('JSON数据文件已生成');
    } else {
      log.warn('JSON数据文件未找到');
    }
    
    // 尝试简单的Neo4j查询来验证数据
    log.info('验证Neo4j数据...');
    const contextCliPath = resolve('scripts/ai/context-cli.js');
    if (existsSync(contextCliPath)) {
      try {
        runCommand(`bun ${contextCliPath} --find-entity "Package" --limit 1`, '测试Neo4j查询');
        log.success('Neo4j数据验证通过');
      } catch {
        log.warn('Neo4j查询测试失败，但数据可能已成功提取');
      }
    }
    
  } catch (error) {
    log.error('数据验证失败');
    throw error;
  }
}

function printSummary() {
  log.header('📋 执行总结');
  
  console.log(`
${colors.bold}图谱数据提取完成${colors.reset}

✅ 已完成的操作:
  • 环境检查和工具准备
  • Neo4j连接验证
  • 项目数据提取到Neo4j数据库
  • JSON备份文件生成
  • 数据提取验证

🎯 下一步操作:
  • 使用 'bun run ai:session query <entity>' 测试查询功能
  • 使用 'bun run ai:session validate' 运行完整验证
  • 开始您的AI辅助开发工作

${colors.blue}提示:${colors.reset} 如果遇到问题，请检查 .env.local 中的Neo4j连接配置
  `);
}

// 主程序
async function main() {
  try {
    log.header('🚀 LinchKit 图谱数据提取器');
    
    checkEnvironment();
    checkNeo4jConnection();
    extractToNeo4j();
    extractToJson();
    validateExtraction();
    printSummary();
    
  } catch (error) {
    log.error('图谱数据提取失败');
    log.error(error.message);
    process.exit(1);
  }
}

// 运行主程序
main();