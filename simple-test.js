#!/usr/bin/env bun

/**
 * 简化的上下文查询工具测试
 */

import { Neo4jService } from './packages/ai/dist/graph/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  console.log('=== 简化诊断测试 ===\n');

  try {
    // 1. 配置检查
    console.log('📋 配置检查:');
    const config = {
      connectionUri: process.env.NEO4J_CONNECTION_URI,
      username: process.env.NEO4J_USERNAME,
      password: process.env.NEO4J_PASSWORD,
      database: process.env.NEO4J_DATABASE || 'neo4j'
    };
    
    console.log(`   URI: ${config.connectionUri ? '✅' : '❌'}`);
    console.log(`   用户名: ${config.username ? '✅' : '❌'}`);
    console.log(`   密码: ${config.password ? '✅' : '❌'}`);
    console.log();

    // 2. 连接测试
    console.log('🔌 连接测试:');
    const neo4jService = new Neo4jService(config);
    await neo4jService.connect();
    console.log('   ✅ 连接成功');
    console.log();

    // 3. 简单查询测试
    console.log('📊 数据查询测试:');
    
    // 节点总数
    const nodeCountResult = await neo4jService.query('MATCH (n) RETURN count(n) as count');
    console.log('   查询结果结构:', JSON.stringify(nodeCountResult, null, 2).slice(0, 200) + '...');
    
    if (nodeCountResult && nodeCountResult.records && nodeCountResult.records.length > 0) {
      const nodeCount = nodeCountResult.records[0].count;
      console.log(`   节点总数: ${nodeCount}`);
    } else {
      console.log('   ❌ 无法获取节点数量');
      console.log('   原始结果:', JSON.stringify(nodeCountResult, null, 2));
    }

    // 关系总数
    const relCountResult = await neo4jService.query('MATCH ()-[r]->() RETURN count(r) as count');
    if (relCountResult && relCountResult.records && relCountResult.records.length > 0) {
      const relCount = relCountResult.records[0].count;
      console.log(`   关系总数: ${relCount}`);
    }

    // 标签统计
    const labelsResult = await neo4jService.query('CALL db.labels()');
    if (labelsResult && labelsResult.records) {
      console.log(`   标签数量: ${labelsResult.records.length}`);
      console.log(`   标签列表: ${labelsResult.records.map(r => r.label).slice(0, 5).join(', ')}`);
    }

    console.log();

    // 4. 基础上下文查询测试
    console.log('🔎 上下文查询测试:');
    try {
      const { ContextQueryTool } = await import('./packages/ai/dist/index.js');
      const contextTool = new ContextQueryTool();
      
      const result = await contextTool.queryContext('用户');
      console.log(`   查询: "用户"`);
      console.log(`   返回实体数: ${result.entities?.length || 0}`);
      console.log(`   返回关系数: ${result.relationships?.length || 0}`);
      console.log('   ✅ 上下文查询功能正常');
    } catch (error) {
      console.log('   ❌ 上下文查询功能异常:', error.message);
    }

    await neo4jService.disconnect();
    console.log('\n✅ 测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

main();