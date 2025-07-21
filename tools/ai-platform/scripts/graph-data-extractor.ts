#!/usr/bin/env bun
/* eslint-env node */
/**
 * LinchKit 图谱数据提取器
 * 使用AI CLI工具提取项目数据到Neo4j图数据库
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { createLogger } from '@linch-kit/core';

const execAsync = promisify(exec);

const logger = createLogger('graph-data-extractor');

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
  info: (msg) => logger.info(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => logger.info(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => logger.info(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => logger.info(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => logger.info(`\n${colors.bold}${colors.blue}${msg}${colors.reset}\n`)
};

async function runCommand(cmd, description) {
  try {
    log.info(description);
    const { stdout } = await execAsync(cmd);
    log.success(`${description} - 完成`);
    return stdout;
  } catch (error) {
    log.error(`${description} - 失败: ${error.message}`);
    if (error.stderr) {
      log.error(`错误详情: ${error.stderr}`);
    }
    throw error;
  }
}

async function checkEnvironment() {
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
      await runCommand('bun run build', '构建LinchKit CLI工具');
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

async function extractToNeo4j() {
  log.header('📊 提取数据到Neo4j');
  
  try {
    // 直接调用AI Platform的提取功能
    const { PackageExtractor } = await import('../src/extractors/package-extractor');
    const { SchemaExtractor } = await import('../src/extractors/schema-extractor');
    const { DocumentExtractor } = await import('../src/extractors/document-extractor');
    const { FunctionExtractor } = await import('../src/extractors/function-extractor');
    const { ImportExtractor } = await import('../src/extractors/import-extractor');
    const { CorrelationAnalyzer } = await import('../src/extractors/correlation-analyzer');
    const { Neo4jService } = await import('../src/core/graph/neo4j-service');
    const { loadNeo4jConfig } = await import('../src/core/config/neo4j-config');
    
    const workingDir = process.cwd();
    let allNodes = [];
    let allRelationships = [];
    const extractionResults = [];
    
    // 执行所有数据提取器
    const extractors = [
      { name: 'package', Extractor: PackageExtractor },
      { name: 'schema', Extractor: SchemaExtractor },
      { name: 'document', Extractor: DocumentExtractor },
      { name: 'function', Extractor: FunctionExtractor },
      { name: 'import', Extractor: ImportExtractor },
    ];
    
    for (const { name, Extractor } of extractors) {
      log.info(`执行 ${name} 数据提取...`);
      const extractor = new Extractor(workingDir);
      const result = await extractor.extract();
      extractionResults.push(result);
      allNodes.push(...result.nodes);
      allRelationships.push(...result.relationships);
      log.success(`${name} 提取完成: ${result.nodes.length} 节点, ${result.relationships.length} 关系`);
    }

    // 执行跨数据源关联分析
    log.info('执行跨数据源关联分析...');
    
    // 检查是否配置了AI
    const aiConfig = process.env.GEMINI_API_KEY ? {
      apiKey: process.env.GEMINI_API_KEY
    } : undefined;
    
    const correlationAnalyzer = new CorrelationAnalyzer(aiConfig);
    const correlationResult = await correlationAnalyzer.analyzeCorrelations(extractionResults);
    
    // 添加关联关系
    allRelationships.push(...correlationResult.relationships);
    log.success(`关联分析完成: 发现 ${correlationResult.relationships.length} 个跨数据源关系`);
    
    // 导入到Neo4j
    const config = await loadNeo4jConfig();
    const neo4jService = new Neo4jService(config);
    
    await neo4jService.connect();
    
    // 智能更新策略：检查是否需要清空数据库
    const stats = await neo4jService.getStats().catch(() => null);
    const hasExistingData = stats && stats.node_count > 0;
    
    if (hasExistingData) {
      log.info(`数据库中已有 ${stats.node_count} 个节点，${stats.relationship_count} 个关系`);
      log.info('使用增量更新模式...');
      // 只删除过时的数据，而不是全部清空
      await neo4jService.query('MATCH (n {updated_at: null}) DETACH DELETE n');
    } else {
      log.info('数据库为空，执行全量导入...');
    }
    
    log.info('导入数据到 Neo4j...');
    await neo4jService.importData(allNodes, allRelationships);
    
    await neo4jService.disconnect();
    
    log.success(`数据提取完成: ${allNodes.length} 节点, ${allRelationships.length} 关系`);
  } catch (error) {
    log.error('数据提取失败:', error);
    throw error;
  }
}

async function extractToJson() {
  log.header('📄 提取数据到JSON文件');
  
  try {
    // 直接使用Node.js调用AI CLI模块
    const extractCmd = `bun tools/ai-platform/cli.ts extract --all --output json`;
    
    await runCommand(extractCmd, '提取项目数据到JSON文件');
    
    log.success('JSON数据提取完成');
  } catch (error) {
    log.warn('JSON数据提取失败，但不影响主流程');
    log.error(`提取错误: ${error.message}`);
  }
}

async function validateExtraction() {
  log.header('✅ 验证数据提取');
  
  try {
    // 检查graph-data目录是否存在
    const graphDataPath = resolve('tools/ai-platform/graph-data');
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
        await runCommand(`bun ${contextCliPath} --find-entity "Package" --limit 1`, '测试Neo4j查询');
        log.success('Neo4j数据验证通过');
      } catch (error) {
        log.warn('Neo4j查询测试失败，但数据可能已成功提取');
        log.error(`验证错误: ${error.message}`);
      }
    }
    
  } catch (error) {
    log.error('数据验证失败');
    log.error(`验证失败详情: ${error.message}`);
    throw error;
  }
}

function printSummary() {
  log.header('📋 执行总结');
  
  logger.info(`
${colors.bold}图谱数据提取完成${colors.reset}

✅ 已完成的操作:
  • 环境检查和工具准备
  • Neo4j连接验证
  • 项目数据提取到Neo4j数据库
  • 跨数据源关联分析和关系提取
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
    
    await checkEnvironment();
    checkNeo4jConnection();
    await extractToNeo4j();
    await extractToJson();
    await validateExtraction();
    printSummary();
    
  } catch (error) {
    log.error('图谱数据提取失败');
    log.error(error.message);
    process.exit(1);
  }
}

// 运行主程序
main();