# AI Context 查询工具

## 📋 工具列表

### 主要工具

- **ai-context-cli-fast.js** - 快速版AI上下文查询工具（推荐使用）
  - 针对Claude Code优化的高性能版本
  - 查询时间从30s优化到1.4s（22x性能提升）
  - 支持实体、符号、模式查询

- **ai-context-cli.js** - 通用AI上下文查询工具
  - 支持基础和增强模式
  - 提供详细的开发建议和实现步骤

- **ai-context-cli-v2.js** - 简化版AI上下文查询工具
  - 结构化查询接口
  - 专为Claude Code调用设计

## 🚀 使用方法

### 快速查询（推荐）
```bash
# 查找实体定义和相关文件
bun scripts/ai-context/ai-context-cli-fast.js --find-entity "User" --include-related

# 查找符号定义
bun scripts/ai-context/ai-context-cli-fast.js --find-symbol "UserSchema"

# 查找实现模式
bun scripts/ai-context/ai-context-cli-fast.js --find-pattern "add_field" --for-entity "User"
```

### 增强模式查询
```bash
# 使用增强模式获取AI开发建议
bun scripts/ai-context/ai-context-cli.js --query "我要给user加一个生日字段" --enhanced
```

## 🎯 工具特性

- **高性能**: 基于优化的Neo4j查询，平均响应时间1.4-2.3s
- **高精度**: 基于实时代码分析，置信度80%+
- **结构化输出**: Claude Code友好的JSON格式
- **智能建议**: 自动提供实现步骤和代码建议

## 📈 性能优化

从原始版本的以下改进：
- 查询时间：30s+ → 1.4s（22x提升）
- 实体匹配：40%置信度 → 80%置信度
- 超时控制：添加5秒超时机制
- 查询简化：直接Cypher查询替代复杂抽象层

## 🔄 数据更新与维护

### Neo4j 知识图谱更新

由于AI上下文查询工具依赖Neo4j知识图谱数据，需要定期更新以保持代码分析的准确性：

#### 自动更新触发时机
- **代码变更后**: 当有新的代码提交时，应重新提取图谱数据
- **包结构变化**: 添加新包或重构包结构时
- **Schema更新**: 实体定义或API接口变更时
- **定期维护**: 建议每周或重大版本发布前更新

#### 手动更新命令
```bash
# 重新提取项目代码图谱数据
bun scripts/graph-data-extractor.ts

# 验证关键实体是否正确索引
bun scripts/ai-context/ai-context-cli.js --find-entity "User" --include-related
```

#### 数据质量监控
- **节点数量**: 当前约5,446个代码节点
- **关系数量**: 包含依赖、继承、使用等关系
- **查询性能**: 平均响应时间应在1.4-2.3s范围内
- **置信度**: 实体匹配置信度应保持在80%以上

#### 故障排查
如果查询出现异常（超时、返回空结果、置信度低）：

1. **检查Neo4j连接**: 确认数据库服务正常
2. **验证环境变量**: 检查`.env.local`中的数据库配置
3. **重新提取数据**: 运行数据提取脚本
4. **查看日志**: 检查工具输出中的错误信息

## 🔗 相关文档

- [AI协作框架](../../ai-context/00_ai_collaboration/)
- [开发约束规范](../../ai-context/01_strategy_and_architecture/workflow_and_constraints.md)
- [Claude Code使用指南](../../CLAUDE.md)
- [Graph RAG架构设计](../../packages/ai/README.md)