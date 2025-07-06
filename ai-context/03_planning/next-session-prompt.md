# 🚀 LinchKit AI Phase 3 数据提取架构增强 - Session Prompt

**日期**: 2025-07-07 (明天)  
**分支**: feature/vibe-coding-engine  
**阶段**: Phase 1 知识图谱MVP - 数据提取器增强  

## 📋 Session 提示语

```
开始开发：LinchKit AI Phase 3 数据提取架构增强 - 解决Graph RAG核心缺陷

【背景】
Phase 2已成功修复查询引擎基础功能，但发现关键问题：知识图谱缺少代码使用关系(CALLS/USES)，导致"谁在使用X"类查询返回空结果。

【核心任务】
1. 【高优先级】增强AST分析：扩展TypeScript代码分析，提取函数调用关系
2. 【高优先级】实现CALLS关系提取：识别函数调用、方法调用、构造函数调用
3. 【高优先级】实现USES关系提取：识别类实例化、接口使用、类型引用
4. 【中优先级】验证关系数据：确保提取的关系数据准确且完整

【当前状态】  
- 分支: feature/vibe-coding-engine
- 数据库: Neo4j AuraDB，5,446节点/7,969关系(主要是EXTENDS/IMPLEMENTS)
- 问题: 缺少CALLS关系(应该有数千个函数调用关系)
- 已有: packages/ai/src/extractors/* 基础提取器架构

【技术要求】
- 使用TypeScript Compiler API进行AST分析
- 扩展现有的function-extractor.ts和base-extractor.ts
- 必须使用bun，严格遵循LinchKit架构约束
- 所有修改需通过bun validate验证

【期望输出】
- 增强的代码提取器，能识别函数调用关系
- 数据库中新增数千个CALLS/USES关系
- "谁在使用Neo4jService"类查询能返回正确结果
- 完整的Graph RAG查询能力恢复

【验证标准】
- 运行`bun dist/cli/index.js extract`后，关系数应显著增加
- 自然语言查询"谁在使用Neo4jService"应返回具体的调用者
- 所有修改通过ESLint和TypeScript检查

请按照CLAUDE.md中的Phase 1初始化检查清单开始，然后专注于数据提取器的AST分析增强。
```

## 🎯 关键技术点

### 1. TypeScript AST 分析增强
**目标文件**: packages/ai/src/extractors/function-extractor.ts

需要识别的模式：
```typescript
// 函数调用
createLogger({ name: 'test' })           // CALLS
service.connect()                        // CALLS  
new Neo4jService(config)                 // CALLS + USES

// 类型使用
const service: Neo4jService = ...        // USES
function process(data: UserSchema) { }   // USES

// 方法调用链
queryEngine.getStats().then(...)        // CALLS (多个)
```

### 2. 关系类型定义
需要在`packages/ai/src/types/index.ts`中确保：
```typescript
export enum RelationType {
  CALLS = 'CALLS',           // 函数/方法调用
  USES = 'USES',             // 类型使用/实例化
  IMPORTS = 'IMPORTS',       // 导入关系 (已有)
  EXTENDS = 'EXTENDS',       // 继承关系 (已有)
  IMPLEMENTS = 'IMPLEMENTS'  // 实现关系 (已有)
}
```

### 3. 预期结果验证
**数据库关系数量预期**:
- 当前: 7,969关系 (主要EXTENDS/IMPLEMENTS)
- 目标: 15,000+ 关系 (包含大量CALLS)

**功能验证查询**:
```cypher
// 查找使用Neo4jService的代码
MATCH (used)<-[r:CALLS]-(user) 
WHERE used.name CONTAINS 'Neo4jService' 
RETURN user.name, r.type, used.name

// 验证函数调用关系
MATCH (caller)-[r:CALLS]->(called)
WHERE called.type = 'Function'
RETURN count(r) as call_count
```

## 📋 Phase 1 初始化检查清单提醒

1. **TodoRead** - 检查待办事项
2. **pwd + git branch** - 确认工作目录和分支  
3. **git status** - 确保工作目录干净
4. **任务明确性** - 确认AST增强的具体需求
5. **上下文获取** - 读取现有extractor代码结构

## 🚀 成功标准

- [ ] 数据库关系数从7,969增加到15,000+
- [ ] "谁在使用Neo4jService"查询返回实际调用者
- [ ] "查找createLogger函数的调用"返回所有使用位置  
- [ ] Graph RAG查询能力全面恢复
- [ ] 所有修改通过质量检查

## 📝 说明

这个Phase 3是LinchKit AI-First开发框架的关键里程碑。完成后，Claude Code CLI工具将获得完整的Graph RAG能力，能够：

- 智能理解代码结构和依赖关系
- 回答复杂的代码查询问题
- 为AI辅助开发提供强大的上下文信息
- 支持架构分析和重构建议

这正是AI协作规划中描述的"为Claude Code CLI工具提供Graph RAG支持"的核心能力。