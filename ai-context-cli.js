#!/usr/bin/env bun

/**
 * 独立的AI上下文查询CLI工具
 * 专为Claude Code调用优化
 */

import { ContextQueryTool, EnhancedContextTool } from './packages/ai/dist/index.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

async function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  let query = '';
  let type = 'context';
  let limit = 10;
  let format = 'json';
  let enhanced = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    switch (arg) {
      case '--query':
      case '-q':
        query = next;
        i++;
        break;
      case '--type':
      case '-t':
        type = next;
        i++;
        break;
      case '--limit':
      case '-l':
        limit = parseInt(next) || 10;
        i++;
        break;
      case '--format':
      case '-f':
        format = next;
        i++;
        break;
      case '--enhanced':
      case '-e':
        enhanced = true;
        break;
      case '--help':
      case '-h':
        console.log(`
LinchKit AI上下文查询工具 - Claude Code专用

用法:
  bun ai-context-cli.js --query "查询内容" [选项]

选项:
  --query, -q <text>     查询内容 (必需)
  --type, -t <type>      查询类型: context|patterns|practices (默认: context)
  --limit, -l <number>   结果数量限制 (默认: 10)
  --format, -f <format>  输出格式: json|text (默认: json)
  --enhanced, -e         使用增强模式，提供AI建议和实现步骤
  --help, -h             显示帮助

示例:
  # 基础查询
  bun ai-context-cli.js --query "用户认证系统"
  
  # 增强模式 - 提供开发建议
  bun ai-context-cli.js --query "我要给user加一个生日字段" --enhanced
  
  # 其他类型查询
  bun ai-context-cli.js --query "React组件" --type patterns
  bun ai-context-cli.js --query "错误处理" --type practices --format text
`);
        process.exit(0);
      default:
        // 如果没有指定--query，第一个参数作为查询
        if (!query && !arg.startsWith('-')) {
          query = arg;
        }
    }
  }
  
  if (!query) {
    console.error('错误: 请提供查询内容');
    console.error('使用 --help 查看帮助');
    process.exit(1);
  }
  
  try {
    let tool, result;
    const startTime = Date.now();
    
    if (enhanced) {
      // 使用增强模式
      tool = new EnhancedContextTool();
      await tool.initialize();
      result = await tool.queryEnhancedContext(query, {
        include_suggestions: true,
        include_implementation_steps: true,
        format: format
      });
    } else {
      // 使用基础模式
      tool = new ContextQueryTool();
      await tool.initialize();
      
      switch (type) {
        case 'context':
          result = await tool.queryContext(query);
          break;
        case 'patterns':
          result = await tool.findPatterns(query);
          break;
        case 'practices':
          result = await tool.getBestPractices(query);
          break;
        default:
          throw new Error(`不支持的查询类型: ${type}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    if (format === 'json') {
      // Claude Code友好的JSON输出
      if (enhanced) {
        // 增强模式直接输出完整结果
        console.log(JSON.stringify(result, null, 2));
      } else {
        // 基础模式包装输出
        const output = {
          success: true,
          query: query,
          type: type,
          timestamp: new Date().toISOString(),
          execution_time_ms: duration,
          data: result
        };
        console.log(JSON.stringify(output, null, 2));
      }
    } else {
      // 人类友好的文本输出
      if (enhanced) {
        // 增强模式的文本输出
        console.log(`\n🤖 LinchKit AI 助手分析结果`);
        console.log(`🔍 查询: "${query}"`);
        console.log(`⏱️  耗时: ${result.execution_time_ms}ms\n`);
        
        // 意图分析
        console.log(`🎯 检测到的动作: ${result.query_analysis.detected_action}`);
        if (result.query_analysis.target_entity) {
          console.log(`📋 目标实体: ${result.query_analysis.target_entity}`);
        }
        if (result.query_analysis.field_name) {
          console.log(`🏷️  字段名称: ${result.query_analysis.field_name}`);
        }
        console.log(`🎲 置信度: ${(result.query_analysis.confidence * 100).toFixed(1)}%\n`);
        
        // 上下文信息
        if (result.context.entity_definition) {
          const entity = result.context.entity_definition;
          console.log(`📁 实体定义:`);
          console.log(`   文件: ${entity.file_path}`);
          console.log(`   类型: ${entity.type}`);
          console.log(`   当前字段: ${entity.current_fields.join(', ')}\n`);
        }
        
        // 相关文件
        if (result.context.related_files) {
          const files = result.context.related_files;
          console.log(`📂 相关文件:`);
          if (files.schemas.length > 0) console.log(`   Schema: ${files.schemas.join(', ')}`);
          if (files.apis.length > 0) console.log(`   API: ${files.apis.join(', ')}`);
          if (files.ui_components.length > 0) console.log(`   UI: ${files.ui_components.join(', ')}`);
          console.log('');
        }
        
        // 字段建议
        if (result.suggestions.field_suggestion) {
          const field = result.suggestions.field_suggestion;
          console.log(`💡 字段建议:`);
          console.log(`   名称: ${field.name}`);
          console.log(`   类型: ${field.type}`);
          console.log(`   Zod Schema: ${field.zod_schema}`);
          console.log(`   Prisma 字段: ${field.prisma_field}\n`);
        }
        
        // 实现步骤
        if (result.suggestions.implementation_steps.length > 0) {
          console.log(`🚀 实现步骤:`);
          result.suggestions.implementation_steps.forEach(step => {
            console.log(`   ${step.order}. ${step.description}`);
            console.log(`      文件: ${step.file_path}`);
            if (step.code_suggestion) {
              console.log(`      建议: ${step.code_suggestion}`);
            }
          });
          console.log('');
        }
        
        // 潜在影响
        if (result.suggestions.potential_impacts.length > 0) {
          console.log(`⚠️  潜在影响:`);
          result.suggestions.potential_impacts.forEach(impact => {
            console.log(`   • ${impact}`);
          });
          console.log('');
        }
        
        console.log(`⏳ 预估工作量: ${result.suggestions.estimated_effort_minutes} 分钟`);
        
      } else {
        // 基础模式的文本输出
        console.log(`\n🔍 查询: "${query}" (${type})`);
        console.log(`⏱️  耗时: ${duration}ms\n`);
        
        if (type === 'context') {
          if (result.entities?.length > 0) {
            console.log('📋 相关实体:');
            result.entities.slice(0, limit).forEach((entity, i) => {
              console.log(`  ${i + 1}. ${entity.name} (${entity.type})`);
              if (entity.package) console.log(`     包: ${entity.package}`);
            });
          }
          
          if (result.relationships?.length > 0) {
            console.log('\n🔗 关系:');
            result.relationships.slice(0, 5).forEach(rel => {
              console.log(`  • ${rel.from} → ${rel.to} (${rel.type})`);
            });
          }
          
          if (result.metadata) {
            console.log(`\n📊 统计: ${result.metadata.total_results} 个结果`);
          }
        } else if (type === 'patterns') {
          console.log('🎨 代码模式:');
          result.slice(0, limit).forEach((pattern, i) => {
            console.log(`  ${i + 1}. ${pattern.name}`);
            console.log(`     ${pattern.description}`);
          });
        } else if (type === 'practices') {
          console.log('✨ 最佳实践:');
          result.slice(0, limit).forEach((practice, i) => {
            console.log(`  ${i + 1}. ${practice.name}`);
            console.log(`     ${practice.description}`);
          });
        }
      }
      console.log();
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    
    if (format === 'json') {
      console.log(JSON.stringify({
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString()
      }, null, 2));
    } else {
      console.error(`❌ 错误: ${errorMsg}`);
    }
    
    process.exit(1);
  }
}

main().catch(console.error);