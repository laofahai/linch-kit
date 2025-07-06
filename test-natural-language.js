#!/usr/bin/env bun

/**
 * LinchKit AI 自然语言接口测试
 * 演示如何通过自然语言指令与AI交互
 */

import { IntelligentQueryEngine } from './packages/ai/dist/index.js';

async function testNaturalLanguageInterface() {
  console.log('🤖 LinchKit AI 自然语言接口测试');
  console.log('=' .repeat(50));
  
  try {
    // 初始化智能查询引擎
    const queryEngine = new IntelligentQueryEngine();
    await queryEngine.connect();
    
    console.log('✅ 已连接到知识图谱数据库');
    
    // 获取实际的数据库统计信息
    const stats = await queryEngine.getStats();
    console.log(`📊 当前知识图谱包含 ${stats.node_count} 个节点和 ${stats.relationship_count} 个关系\n`);
    
    // 测试各种自然语言查询
    const naturalLanguageQueries = [
      "查找createLogger函数",
      "找到所有认证相关的类",
      "显示数据库连接的相关代码",
      "分析tRPC相关的依赖关系",
      "谁在使用Neo4jService",
      "查找所有React组件",
      "显示Schema相关的接口",
      "找到配置管理相关的函数"
    ];
    
    console.log('🔍 开始测试自然语言查询...\n');
    
    for (let i = 0; i < naturalLanguageQueries.length; i++) {
      const query = naturalLanguageQueries[i];
      console.log(`${i + 1}. 用户指令: "${query}"`);
      
      try {
        const result = await queryEngine.query(query);
        
        console.log(`   🎯 意图识别: ${result.intent} (置信度: ${(result.confidence * 100).toFixed(1)}%)`);
        console.log(`   ⚡ 执行时间: ${result.execution_time_ms}ms`);
        console.log(`   📈 找到结果: ${result.results.nodes.length} 个节点, ${result.results.relationships.length} 个关系`);
        
        if (result.results.nodes.length > 0) {
          console.log(`   💡 解释: ${result.results.explanation}`);
          
          // 显示前3个结果
          const topResults = result.results.nodes.slice(0, 3);
          console.log(`   🔹 主要结果:`);
          topResults.forEach((node, idx) => {
            console.log(`      ${idx + 1}. ${node.type}: ${node.name} (${node.id})`);
          });
          
          if (result.results.suggestions.length > 0) {
            console.log(`   💭 建议: ${result.results.suggestions[0]}`);
          }
        } else {
          console.log(`   ⚠️  未找到匹配结果`);
        }
        
        if (result.cypher_query) {
          console.log(`   🔗 生成的查询: ${result.cypher_query.slice(0, 80)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ 查询失败: ${error.message}`);
      }
      
      console.log(''); // 空行分隔
    }
    
    await queryEngine.disconnect();
    
    console.log('🎉 自然语言接口测试完成！');
    console.log('\n💡 使用方式:');
    console.log('   - 用中文或英文描述您想要找的代码');
    console.log('   - AI会自动理解意图并搜索知识图谱');
    console.log('   - 获得智能解释和相关建议');
    console.log('\n🚀 支持的查询类型:');
    console.log('   • 查找函数/类/接口');
    console.log('   • 分析依赖关系');
    console.log('   • 寻找代码使用情况');
    console.log('   • 探索相关代码');
    console.log('   • 解释代码概念');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testNaturalLanguageInterface();