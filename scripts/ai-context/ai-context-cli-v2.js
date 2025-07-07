#!/usr/bin/env bun

/**
 * 简化版AI上下文查询CLI工具
 * 专为Claude Code调用设计 - 结构化查询接口
 */

import { ContextQueryTool } from './packages/ai/dist/index.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  let findEntity = '';
  let findSymbol = '';
  let findPattern = '';
  let forEntity = '';
  let includeRelated = false;
  let format = 'json';
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    switch (arg) {
      case '--find-entity':
        findEntity = next;
        i++;
        break;
      case '--find-symbol':
        findSymbol = next;
        i++;
        break;
      case '--find-pattern':
        findPattern = next;
        i++;
        break;
      case '--for-entity':
        forEntity = next;
        i++;
        break;
      case '--include-related':
        includeRelated = true;
        break;
      case '--format':
        format = next;
        i++;
        break;
      case '--help':
        console.log(`
LinchKit AI上下文查询工具 - Claude Code专用

用法:
  bun ai-context-cli-simple.js [选项]

查询类型:
  --find-entity <name>       查找实体定义 (User, Product等)
  --find-symbol <name>       查找符号定义 (函数、类、接口)
  --find-pattern <action>    查找实现模式 (add_field, create_api等)

修饰符:
  --for-entity <name>        针对特定实体
  --include-related          包含相关文件信息
  --format <type>            输出格式: json|text (默认: json)

示例:
  # 查找User实体定义和相关文件
  bun ai-context-cli-simple.js --find-entity "User" --include-related

  # 查找UserSchema符号
  bun ai-context-cli-simple.js --find-symbol "UserSchema"
  
  # 查找为User添加字段的模式
  bun ai-context-cli-simple.js --find-pattern "add_field" --for-entity "User"
`);
        process.exit(0);
    }
  }
  
  // 确定查询类型
  let queryType = '';
  let queryTarget = '';
  
  if (findEntity) {
    queryType = 'find_entity';
    queryTarget = findEntity;
  } else if (findSymbol) {
    queryType = 'find_symbol';
    queryTarget = findSymbol;
  } else if (findPattern) {
    queryType = 'find_pattern';
    queryTarget = findPattern;
  } else {
    console.error('错误: 请指定查询类型 (--find-entity, --find-symbol, 或 --find-pattern)');
    console.error('使用 --help 查看帮助');
    process.exit(1);
  }
  
  try {
    const tool = new ContextQueryTool();
    await tool.initialize();
    
    const startTime = Date.now();
    let baseQuery = queryTarget;
    
    // 构建查询字符串
    if (forEntity) {
      baseQuery += ` ${forEntity}`;
    }
    
    // 执行查询
    const contextResult = await tool.queryContext(baseQuery);
    const executionTime = Date.now() - startTime;
    
    // 处理结果
    const result = {
      success: true,
      query: {
        type: queryType,
        target: queryTarget,
        for_entity: forEntity || null,
        include_related: includeRelated
      },
      results: await processResults(queryType, contextResult, includeRelated, forEntity),
      metadata: {
        execution_time_ms: executionTime,
        confidence: contextResult.metadata?.relevance_score || 0.8,
        total_found: contextResult.entities?.length || 0
      }
    };
    
    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printTextOutput(result);
    }
    
  } catch (error) {
    const errorResult = {
      success: false,
      error: error.message,
      query: { type: queryType, target: queryTarget }
    };
    
    if (format === 'json') {
      console.log(JSON.stringify(errorResult, null, 2));
    } else {
      console.error(`❌ 查询失败: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * 处理查询结果
 */
async function processResults(queryType, contextResult, includeRelated, forEntity) {
  const results = {
    primary_target: null,
    related_files: [],
    suggestions: {},
    patterns: []
  };
  
  if (queryType === 'find_entity') {
    // 查找实体定义
    const entityResult = findEntityDefinition(contextResult.entities, contextResult.target || forEntity);
    results.primary_target = entityResult;
    
    if (includeRelated && entityResult) {
      results.related_files = findRelatedFiles(contextResult.entities, entityResult.name);
      results.suggestions = generateEntitySuggestions(entityResult);
    }
    
  } else if (queryType === 'find_symbol') {
    // 查找符号定义
    const symbolResult = findSymbolDefinition(contextResult.entities, contextResult.target);
    results.primary_target = symbolResult;
    
    if (includeRelated && symbolResult) {
      results.related_files = findRelatedFiles(contextResult.entities, symbolResult.name);
    }
    
  } else if (queryType === 'find_pattern') {
    // 查找模式
    results.patterns = await generatePatternSuggestions(contextResult.target, forEntity, contextResult.entities);
  }
  
  return results;
}

/**
 * 查找实体定义
 */
function findEntityDefinition(entities, entityName) {
  if (!entityName || !entities) return null;
  
  // 查找最相关的实体
  const candidates = entities.filter(entity => 
    entity.name?.toLowerCase().includes(entityName.toLowerCase()) &&
    (entity.type === 'Class' || entity.type === 'Interface' || entity.type === 'Schema')
  );
  
  if (candidates.length === 0) return null;
  
  // 选择最匹配的
  const bestMatch = candidates.find(entity => 
    entity.name?.toLowerCase() === entityName.toLowerCase()
  ) || candidates[0];
  
  return {
    name: bestMatch.name,
    type: bestMatch.type,
    file_path: bestMatch.path || '',
    description: bestMatch.description || '',
    package: bestMatch.package || '',
    current_fields: extractFieldsFromDescription(bestMatch.description)
  };
}

/**
 * 查找符号定义
 */
function findSymbolDefinition(entities, symbolName) {
  if (!symbolName || !entities) return null;
  
  const symbol = entities.find(entity => 
    entity.name?.toLowerCase() === symbolName.toLowerCase()
  );
  
  if (!symbol) return null;
  
  return {
    name: symbol.name,
    type: symbol.type,
    file_path: symbol.path || '',
    description: symbol.description || '',
    package: symbol.package || ''
  };
}

/**
 * 查找相关文件
 */
function findRelatedFiles(entities, entityName) {
  if (!entities || !entityName) return [];
  
  const relatedFiles = {
    schemas: [],
    apis: [],
    ui_components: [],
    tests: [],
    migrations: ['prisma/schema.prisma'] // 默认包含Prisma schema
  };
  
  entities.forEach(entity => {
    if (!entity.path) return;
    
    const isRelated = entity.name?.toLowerCase().includes(entityName.toLowerCase()) ||
                     entity.path?.toLowerCase().includes(entityName.toLowerCase());
    
    if (!isRelated) return;
    
    if (entity.path.includes('schema') || entity.path.includes('types')) {
      relatedFiles.schemas.push(entity.path);
    } else if (entity.path.includes('trpc') || entity.path.includes('api')) {
      relatedFiles.apis.push(entity.path);
    } else if (entity.path.includes('ui') || entity.path.includes('components') || entity.path.includes('form')) {
      relatedFiles.ui_components.push(entity.path);
    } else if (entity.path.includes('test')) {
      relatedFiles.tests.push(entity.path);
    }
  });
  
  // 去重
  Object.keys(relatedFiles).forEach(key => {
    relatedFiles[key] = [...new Set(relatedFiles[key])];
  });
  
  return relatedFiles;
}

/**
 * 生成实体相关建议
 */
function generateEntitySuggestions(entityResult) {
  return {
    add_field: {
      description: `为${entityResult.name}添加新字段的步骤`,
      steps: [
        `1. 编辑 ${entityResult.file_path} 更新Schema定义`,
        '2. 运行 bunx prisma migrate dev 创建数据库迁移',
        '3. 更新相关的tRPC API procedures',
        '4. 更新相关的UI表单组件',
        '5. 添加或更新测试用例'
      ]
    },
    common_field_types: {
      string: 'z.string().optional()',
      number: 'z.number().optional()',
      date: 'z.date().optional()',
      boolean: 'z.boolean().optional()',
      email: 'z.string().email().optional()',
      url: 'z.string().url().optional()'
    }
  };
}

/**
 * 生成模式建议
 */
async function generatePatternSuggestions(pattern, entityName, entities) {
  const patterns = [];
  
  if (pattern === 'add_field') {
    patterns.push({
      name: '添加字段模式',
      description: `为${entityName || '实体'}添加新字段的标准流程`,
      steps: [
        '在Schema中定义字段',
        '创建数据库迁移',
        '更新API层',
        '更新UI层',
        '添加测试'
      ],
      example_files: entityName ? findRelatedFiles(entities, entityName) : null
    });
  }
  
  return patterns;
}

/**
 * 从描述中提取字段信息
 */
function extractFieldsFromDescription(description) {
  if (!description) return [];
  
  // 简单的字段提取逻辑
  const fieldMatches = description.match(/(\w+):\s*z\./g);
  if (fieldMatches) {
    return fieldMatches.map(match => match.split(':')[0]);
  }
  
  return [];
}

/**
 * 打印文本格式输出
 */
function printTextOutput(result) {
  console.log(`\n🔍 查询类型: ${result.query.type}`);
  console.log(`🎯 目标: ${result.query.target}`);
  console.log(`⏱️  耗时: ${result.metadata.execution_time_ms}ms`);
  console.log(`🎲 置信度: ${(result.metadata.confidence * 100).toFixed(1)}%\n`);
  
  if (result.results.primary_target) {
    const target = result.results.primary_target;
    console.log(`📋 找到目标:`);
    console.log(`   名称: ${target.name}`);
    console.log(`   类型: ${target.type}`);
    console.log(`   文件: ${target.file_path}`);
    console.log(`   包: ${target.package}`);
    if (target.current_fields?.length > 0) {
      console.log(`   当前字段: ${target.current_fields.join(', ')}`);
    }
    console.log('');
  }
  
  if (result.results.related_files && Object.keys(result.results.related_files).length > 0) {
    console.log(`📂 相关文件:`);
    Object.entries(result.results.related_files).forEach(([type, files]) => {
      if (files.length > 0) {
        console.log(`   ${type}: ${files.join(', ')}`);
      }
    });
    console.log('');
  }
  
  if (result.results.patterns?.length > 0) {
    console.log(`🎨 相关模式:`);
    result.results.patterns.forEach((pattern, i) => {
      console.log(`   ${i + 1}. ${pattern.name}`);
      console.log(`      ${pattern.description}`);
    });
  }
}

// 运行主程序
main().catch(console.error);