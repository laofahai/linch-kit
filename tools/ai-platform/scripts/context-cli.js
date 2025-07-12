#!/usr/bin/env bun
/* eslint-env node */

/**
 * 快速版AI上下文查询CLI工具
 * 专为Claude Code调用设计 - 优化版本
 * 
 * 主要优化：
 * 1. 简化Neo4j查询逻辑
 * 2. 跳过复杂的增强分析
 * 3. 直接返回匹配结果
 * 4. 添加超时控制
 */

import { Neo4jService, loadNeo4jConfig } from '../dist/src/index.js';
import dotenv from 'dotenv';

// 加载环境变量 - 自适应加载
import fs from 'fs';
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config({ path: '.env' });
}

async function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  let findEntity = '';
  let findSymbol = '';
  let findPattern = '';
  let forEntity = '';
  let includeRelated = false;
  let format = 'json';
  let debug = false;
  
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
      case '--debug':
        debug = true;
        break;
      case '--help':
        console.log(`
LinchKit AI上下文查询工具 - 快速版

用法:
  bun ai-context-cli-fast.js [选项]

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
  bun ai-context-cli-fast.js --find-entity "User" --include-related

  # 查找UserSchema符号
  bun ai-context-cli-fast.js --find-symbol "UserSchema"
  
  # 查找为User添加字段的模式
  bun ai-context-cli-fast.js --find-pattern "add_field" --for-entity "User"
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
    const startTime = Date.now();
    
    // 直接使用Neo4j服务，跳过复杂的查询引擎
    const config = await loadNeo4jConfig();
    const neo4jService = new Neo4jService(config);
    
    // 简化的Cypher查询 - 移到外层避免作用域问题
    let cypherQuery = '';
    const params = {};
    
    // 设置10秒超时（调试模式需要更多时间）
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('查询超时')), debug ? 10000 : 5000)
    );
    
    const queryPromise = (async () => {
      await neo4jService.connect();
      
      if (queryType === 'find_entity') {
        // 智能查询预处理
        const queryTerms = queryTarget.toLowerCase().split(/\s+/).filter(term => term.length > 2);
        const primaryTerm = queryTerms[0] || queryTarget.toLowerCase();
        
        if (debug) {
          // 调试模式：查询实体及其直接关系（增强版）
          if (queryTerms.length > 1) {
            // 多词查询：使用更智能的匹配
            cypherQuery = `
              MATCH (n)
              WHERE ANY(term IN $terms WHERE toLower(n.name) CONTAINS term)
                 OR ANY(term IN $terms WHERE toLower(n.type) CONTAINS term)
                 OR ANY(term IN $terms WHERE toLower(n.prop_description) CONTAINS term)
                 OR ANY(term IN $terms WHERE toLower(n.prop_file_path) CONTAINS term)
              OPTIONAL MATCH (n)-[r]-(related)
              RETURN n, r, related
              ORDER BY 
                CASE 
                  WHEN toLower(n.name) CONTAINS $primaryTerm THEN 0
                  ELSE 1
                END,
                n.name
              LIMIT 20
            `;
            params.terms = queryTerms;
            params.primaryTerm = primaryTerm;
          } else {
            // 单词查询：原有逻辑
            cypherQuery = `
              MATCH (n)
              WHERE toLower(n.name) CONTAINS toLower($target)
                 OR toLower(n.type) CONTAINS toLower($target)
              OPTIONAL MATCH (n)-[r]-(related)
              RETURN n, r, related
              ORDER BY n.name
              LIMIT 15
            `;
            params.target = queryTarget;
          }
        } else {
          // 普通模式
          if (queryTerms.length > 1) {
            // 多词查询
            cypherQuery = `
              MATCH (n)
              WHERE ANY(term IN $terms WHERE toLower(n.name) CONTAINS term)
                 OR ANY(term IN $terms WHERE toLower(n.type) CONTAINS term)
              RETURN n
              ORDER BY 
                CASE 
                  WHEN toLower(n.name) CONTAINS $primaryTerm THEN 0
                  ELSE 1
                END,
                n.name
              LIMIT 10
            `;
            params.terms = queryTerms;
            params.primaryTerm = primaryTerm;
          } else {
            // 单词查询
            cypherQuery = `
              MATCH (n)
              WHERE toLower(n.name) CONTAINS toLower($target)
                 OR toLower(n.type) CONTAINS toLower($target)
              RETURN n
              ORDER BY n.name
              LIMIT 10
            `;
            params.target = queryTarget;
          }
        }
      } else if (queryType === 'find_symbol') {
        cypherQuery = `
          MATCH (n)
          WHERE n.name = $target
             OR toLower(n.name) CONTAINS toLower($target)
          RETURN n
          ORDER BY n.name
          LIMIT 5
        `;
        params.target = queryTarget;
      } else if (queryType === 'find_pattern') {
        cypherQuery = `
          MATCH (n)
          WHERE toLower(n.description) CONTAINS toLower($pattern)
             OR toLower(n.name) CONTAINS toLower($pattern)
          RETURN n
          ORDER BY n.name
          LIMIT 8
        `;
        params.pattern = queryTarget;
      }
      
      // 执行查询
      const result = await neo4jService.query(cypherQuery, params);
      await neo4jService.disconnect();
      
      return result;
    })();
    
    // 等待查询完成或超时
    const graphResult = await Promise.race([queryPromise, timeout]);
    
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
      results: await processResultsFast(queryType, graphResult, includeRelated, forEntity, queryTarget, debug),
      metadata: {
        execution_time_ms: executionTime,
        confidence: 0.8, // 固定高置信度
        total_found: graphResult?.records?.length || 0,
        fast_mode: true
      }
    };
    
    // 在调试模式下添加额外的调试信息
    if (debug) {
      result._debug_info = {
        query_type: queryType,
        query_target: queryTarget,
        cypher_query: cypherQuery,
        params: params,
        raw_graph_result: graphResult,
        debug_mode: true
      };
    }
    
    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printTextOutput(result);
    }
    
  } catch (error) {
    const errorResult = {
      success: false,
      error: error.message,
      query: { type: queryType, target: queryTarget },
      fast_mode: true
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
 * 快速处理查询结果
 */
async function processResultsFast(queryType, graphResult, includeRelated, forEntity, queryTarget, debug = false) {
  const results = {
    primary_target: null,
    related_entities: [],
    relationships: [],
    related_files: [],
    suggestions: {},
    patterns: []
  };
  
  if (!graphResult || 
      (!graphResult.records || graphResult.records.length === 0) &&
      (!graphResult.nodes || graphResult.nodes.length === 0)) {
    return results;
  }
  
  // 转换Neo4j记录为简化实体格式
  const entities = [];
  const relationships = [];
  const relatedEntities = [];
  
  // 处理nodes格式的结果
  if (graphResult.nodes && graphResult.nodes.length > 0) {
    entities.push(...graphResult.nodes.map(node => ({
      name: node.name || 'Unknown',
      type: node.type || 'Unknown', 
      path: (node.properties && node.properties.prop_file_path) || node.file_path || node.path || '',
      description: (node.properties && node.properties.prop_description) || node.description || '',
      package: (node.properties && node.properties.metadata_package) || node.package || 'unknown'
    })));
  }
  
  // 处理原始records格式的结果 - 完整版本支持关系提取
  if (graphResult.records && graphResult.records.length > 0) {
    const entityMap = new Map(); // 去重用
    
    graphResult.records.forEach(record => {
      let mainEntity = null;
      let relatedEntity = null;
      let relationship = null;
      
      // 第一轮：提取所有节点和关系
      for (const [key, value] of Object.entries(record)) {
        if (value && typeof value === 'object' && value.properties) {
          const entity = {
            name: value.properties.name || 'Unknown',
            type: value.properties.type || 'Unknown',
            file_path: value.properties.prop_file_path || value.properties.file_path || value.properties.path || '',
            description: value.properties.prop_description || value.properties.description || '',
            package: value.properties.metadata_package || value.properties.prop_package || value.properties.package || 'unknown'
          };
          
          if (key === 'n') {
            mainEntity = entity;
            entityMap.set(entity.name, entity);
          } else if (key === 'related') {
            relatedEntity = entity;
            entityMap.set(entity.name, entity);
          }
        } else if (value && typeof value === 'object' && value.type) {
          // 关系信息
          if (key === 'r') {
            relationship = {
              type: value.type,
              properties: value.properties || {}
            };
          }
        }
      }
      
      // 第二轮：建立完整的关系映射
      if (debug && mainEntity && relatedEntity && relationship) {
        relationships.push({
          type: relationship.type,
          from: mainEntity.name,
          to: relatedEntity.name,
          from_type: mainEntity.type,
          to_type: relatedEntity.type,
          properties: relationship.properties
        });
      }
    });
    
    // 将去重后的实体添加到结果中
    entities.push(...Array.from(entityMap.values()));
    
    // 分离主实体和相关实体
    const mainTargetEntities = Array.from(entityMap.values()).filter(entity => 
      entity.name.toLowerCase().includes(queryTarget.toLowerCase()) ||
      entity.type.toLowerCase().includes(queryTarget.toLowerCase())
    );
    
    relatedEntities.push(...Array.from(entityMap.values()).filter(entity => 
      !mainTargetEntities.some(main => main.name === entity.name)
    ));
  }
  
  // 在debug模式下添加额外的相关实体和关系信息
  if (debug) {
    results.related_entities = relatedEntities;
    results.relationships = relationships;
  }
  
  if (queryType === 'find_entity') {
    // 查找实体定义 - 简化版
    const entityResult = findEntityDefinitionFast(entities, queryTarget);
    results.primary_target = entityResult;
    
    if (includeRelated && entityResult) {
      results.related_files = findRelatedFilesFast(entities, entityResult.name);
      results.suggestions = generateEntitySuggestionsFast(entityResult);
    }
    
  } else if (queryType === 'find_symbol') {
    // 查找符号定义
    const symbolResult = findSymbolDefinitionFast(entities, queryTarget);
    results.primary_target = symbolResult;
    
    if (includeRelated && symbolResult) {
      results.related_files = findRelatedFilesFast(entities, symbolResult.name);
    }
    
  } else if (queryType === 'find_pattern') {
    // 查找模式
    results.patterns = generatePatternSuggestionsFast(queryTarget, forEntity, entities);
  }
  
  return results;
}

/**
 * 快速查找实体定义
 */
function findEntityDefinitionFast(entities, entityName) {
  if (!entityName || !entities || entities.length === 0) return null;
  
  // 精确匹配优先
  let bestMatch = entities.find(entity => 
    entity.name?.toLowerCase() === entityName.toLowerCase()
  );
  
  // 如果没有精确匹配，使用包含匹配
  if (!bestMatch) {
    bestMatch = entities.find(entity => 
      entity.name?.toLowerCase().includes(entityName.toLowerCase()) &&
      (entity.type === 'Class' || entity.type === 'Interface' || entity.type === 'Schema' || entity.type === 'Model')
    );
  }
  
  // 如果还是没有，使用第一个结果
  if (!bestMatch && entities.length > 0) {
    bestMatch = entities[0];
  }
  
  if (!bestMatch) return null;
  
  return {
    name: bestMatch.name,
    type: bestMatch.type,
    file_path: bestMatch.path || '',
    description: bestMatch.description || '',
    package: bestMatch.package || '',
    current_fields: extractFieldsFromDescriptionFast(bestMatch.description)
  };
}

/**
 * 快速查找符号定义
 */
function findSymbolDefinitionFast(entities, symbolName) {
  if (!symbolName || !entities || entities.length === 0) return null;
  
  const symbol = entities.find(entity => 
    entity.name?.toLowerCase() === symbolName.toLowerCase()
  ) || entities[0]; // 如果没找到精确匹配，使用第一个
  
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
 * 快速查找相关文件
 */
function findRelatedFilesFast(entities, entityName) {
  if (!entities || !entityName) return {};
  
  const relatedFiles = {
    schemas: [],
    apis: [],
    ui_components: [],
    tests: [],
    migrations: []
  };
  
  entities.forEach(entity => {
    if (!entity.path) return;
    
    const isRelated = entity.name?.toLowerCase().includes(entityName.toLowerCase()) ||
                     entity.path?.toLowerCase().includes(entityName.toLowerCase());
    
    if (!isRelated) return;
    
    if (entity.path.includes('schema') || entity.path.includes('types') || entity.path.includes('prisma')) {
      relatedFiles.schemas.push(entity.path);
    } else if (entity.path.includes('trpc') || entity.path.includes('api')) {
      relatedFiles.apis.push(entity.path);
    } else if (entity.path.includes('ui') || entity.path.includes('components') || entity.path.includes('form')) {
      relatedFiles.ui_components.push(entity.path);
    } else if (entity.path.includes('test')) {
      relatedFiles.tests.push(entity.path);
    }
  });
  
  // 推断可能的迁移文件
  if (relatedFiles.schemas.length > 0) {
    relatedFiles.migrations.push('prisma/schema.prisma');
  }
  
  // 去重
  Object.keys(relatedFiles).forEach(key => {
    relatedFiles[key] = [...new Set(relatedFiles[key])];
  });
  
  return relatedFiles;
}

/**
 * 快速生成实体相关建议
 */
function generateEntitySuggestionsFast(entityResult) {
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
 * 快速生成模式建议
 */
function generatePatternSuggestionsFast(pattern, entityName, entities) {
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
      example_files: entityName ? findRelatedFilesFast(entities, entityName) : null
    });
  }
  
  return patterns;
}

/**
 * 快速从描述中提取字段信息
 */
function extractFieldsFromDescriptionFast(description) {
  if (!description) return [];
  
  // 简单的字段提取逻辑
  const fieldMatches = description.match(/(\\w+):\\s*z\\./g);
  if (fieldMatches) {
    return fieldMatches.map(match => match.split(':')[0]);
  }
  
  return [];
}

/**
 * 打印文本格式输出
 */
function printTextOutput(result) {
  console.log(`\\n🔍 查询类型: ${result.query.type}`);
  console.log(`🎯 目标: ${result.query.target}`);
  console.log(`⏱️  耗时: ${result.metadata.execution_time_ms}ms`);
  console.log(`🎲 置信度: ${(result.metadata.confidence * 100).toFixed(1)}%`);
  console.log(`⚡ 快速模式: ${result.metadata.fast_mode ? '启用' : '禁用'}\\n`);
  
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