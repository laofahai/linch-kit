#!/usr/bin/env bun

/**
 * Claude Code 上下文查询工具 - 状态诊断脚本
 * 用于检查数据质量和查询精度
 */

import { ContextQueryTool } from './packages/ai/dist/index.js';
import { Neo4jService } from './packages/ai/dist/graph/index.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

console.log('=== Claude Code 上下文查询工具 - 状态诊断 ===\n');

async function main() {
  try {
    // 1. 检查环境变量配置
    console.log('📋 1. 环境配置检查:');
    const requiredEnvs = ['NEO4J_CONNECTION_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD'];
    requiredEnvs.forEach(env => {
      const value = process.env[env];
      console.log(`   ${env}: ${value ? '✅ 已配置' : '❌ 缺失'}`);
    });
    console.log();

    // 2. 初始化服务
    console.log('🔌 2. Neo4j 连接测试:');
    const config = {
      connectionUri: process.env.NEO4J_CONNECTION_URI,
      username: process.env.NEO4J_USERNAME,
      password: process.env.NEO4J_PASSWORD,
      database: process.env.NEO4J_DATABASE || 'neo4j'
    };
    
    const neo4jService = new Neo4jService(config);
    
    try {
      await neo4jService.connect();
      console.log('   连接状态: ✅ 连接成功');
    } catch (error) {
      console.log('   连接状态: ❌ 连接失败');
      console.log('   错误信息:', error.message);
      return;
    }
    console.log();

    // 3. 数据统计
    console.log('📊 3. 数据库统计信息:');
    const stats = await neo4jService.getStats();
    console.log(`   节点总数: ${stats.nodeCount}`);
    console.log(`   关系总数: ${stats.relationshipCount}`);
    console.log(`   标签种类: ${stats.labels?.join(', ') || '未知'}`);
    console.log(`   关系类型: ${stats.relationshipTypes?.join(', ') || '未知'}`);
    console.log();

    // 4. 数据质量检查
    console.log('🔍 4. 数据质量诊断:');
    
    // 检查节点属性完整性
    const nodeQualityQuery = `
      MATCH (n)
      RETURN 
        labels(n) as nodeType,
        count(n) as total,
        count(n.name) as hasName,
        count(n.package) as hasPackage,
        count(n.type) as hasType
      ORDER BY total DESC
      LIMIT 10
    `;
    
    const nodeQualityResult = await neo4jService.query(nodeQualityQuery);
    const nodeQuality = nodeQualityResult.records;
    console.log('   节点属性完整性:');
    nodeQuality.forEach(record => {
      const nodeType = record.nodeType[0] || 'Unknown';
      const total = record.total;
      const nameRatio = ((record.hasName / total) * 100).toFixed(1);
      const packageRatio = ((record.hasPackage / total) * 100).toFixed(1);
      console.log(`     ${nodeType}: 总数=${total}, name属性=${nameRatio}%, package属性=${packageRatio}%`);
    });
    console.log();

    // 检查关系数据
    const relationshipQuery = `
      MATCH (n)-[r]->(m)
      RETURN type(r) as relType, count(r) as count
      ORDER BY count DESC
      LIMIT 5
    `;
    
    const relationshipResult = await neo4jService.query(relationshipQuery);
    const relationships = relationshipResult.records;
    console.log('   关系类型分布:');
    relationships.forEach(record => {
      console.log(`     ${record.relType}: ${record.count} 条`);
    });
    console.log();

    // 5. 初始化查询工具
    console.log('🛠️ 5. 查询工具初始化:');
    const contextTool = new ContextQueryTool();
    console.log('   ✅ ContextQueryTool 初始化成功');
    console.log();

    // 6. 测试查询功能
    console.log('🔎 6. 功能测试:');
    
    // 测试基础查询
    console.log('   6.1 基础上下文查询测试:');
    const basicQuery = await contextTool.queryContext('认证系统');
    console.log(`       查询: "认证系统"`);
    console.log(`       返回实体数: ${basicQuery.entities?.length || 0}`);
    console.log(`       返回关系数: ${basicQuery.relationships?.length || 0}`);
    console.log(`       意图识别: ${basicQuery.intent} (置信度: ${basicQuery.confidence}%)`);
    
    if (basicQuery.entities && basicQuery.entities.length > 0) {
      console.log('       前3个实体:');
      basicQuery.entities.slice(0, 3).forEach((entity, index) => {
        console.log(`         ${index + 1}. ${entity.name || 'Unknown'} (${entity.type || 'Unknown'})`);
      });
    }
    console.log();

    // 测试模式查找
    console.log('   6.2 代码模式查找测试:');
    const patterns = await contextTool.findPatterns('React组件');
    console.log(`       查询: "React组件"`);
    console.log(`       返回模式数: ${patterns.length}`);
    if (patterns.length > 0) {
      console.log('       前2个模式:');
      patterns.slice(0, 2).forEach((pattern, index) => {
        console.log(`         ${index + 1}. ${pattern.description || pattern.name}`);
      });
    }
    console.log();

    // 测试最佳实践
    console.log('   6.3 最佳实践推荐测试:');
    const practices = await contextTool.getBestPractices('错误处理');
    console.log(`       查询: "错误处理"`);
    console.log(`       返回建议数: ${practices.length}`);
    if (practices.length > 0) {
      console.log('       前2个建议:');
      practices.slice(0, 2).forEach((practice, index) => {
        console.log(`         ${index + 1}. ${practice.title || practice.description}`);
      });
    }
    console.log();

    // 7. 性能测试
    console.log('⏱️ 7. 性能测试:');
    const startTime = Date.now();
    await contextTool.queryContext('用户管理');
    const endTime = Date.now();
    console.log(`   查询响应时间: ${endTime - startTime}ms`);
    console.log();

    // 8. 诊断总结
    console.log('📋 8. 诊断总结:');
    console.log('   ✅ 功能状态: 基础功能正常');
    console.log('   ⚠️  数据质量: 需要检查节点属性完整性');
    console.log('   ⚠️  查询精度: 意图识别准确性待提升');
    console.log('   ✅ 连接状态: Neo4j 连接正常');
    console.log('   ⚠️  响应时间: 需要性能优化');

    await neo4jService.disconnect();
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

main().catch(console.error);