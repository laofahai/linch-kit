# LinchKit AI 驱动开发工作流规范

**版本**: v1.0  
**创建日期**: 2025-07-06  
**基于**: Phase 4.0 Graph RAG 集成优化 + Gemini 协作建议

## 🎯 工作流概述

LinchKit AI 驱动开发工作流基于 **Graph RAG 知识图谱** 和 **Claude Code 集成**，实现 AI 深度理解项目上下文并自动完成复杂开发任务的智能化开发模式。

### 核心理念
- **AI First**: 所有开发决策基于 AI 对项目架构的深度理解
- **Graph RAG 驱动**: 通过知识图谱获得准确的上下文信息
- **模式一致性**: 确保生成代码符合现有架构约定

## 🚨 适用场景

**必须使用 AI 驱动工作流的场景**:
- 复杂功能开发（3+ 个实现步骤）
- 涉及多个包或模块的集成任务
- 需要理解现有架构模式的开发
- 添加新的 API 端点或数据模型
- 重构涉及多个组件的代码

**可选使用的场景**:
- 简单的 bug 修复
- 文档更新
- 单文件内的小幅修改

## 🔄 强制性执行阶段

### Stage 1: 理解阶段 (Understanding Phase)

**目标**: 获取项目整体架构概览和相关组件信息

**必须执行的操作**:
```bash
# 1. 项目概览 - 了解整体规模和结构
linch ai:query --type stats --format ai-context

# 2. 相关实体查询 - 查找任务相关的组件
linch ai:query --type node --search "<关键实体>" --format ai-context
```

**成功标准**:
- [ ] `confidence` 值 > 0.8
- [ ] `follow_up_suggestions` 不为空
- [ ] 理解了项目的主要组件和模块结构
- [ ] 识别了与任务相关的现有组件

**AI 理解检查点**:
- 能够描述项目的技术栈和架构层次
- 识别出与开发任务相关的现有模式
- 理解主要的依赖关系

### Stage 2: 上下文分析阶段 (Context Analysis Phase)

**目标**: 深度分析相关组件的依赖关系、使用模式和架构约定

**必须执行的操作**:
```bash
# 1. 关系分析 - 理解组件间的依赖网络
linch ai:query --type relations --search "<核心组件>" --depth 2 --format ai-context

# 2. 路径分析 - 理解数据流和调用链（如需要）
linch ai:query --type path --search "<起点> <终点>" --format ai-context
```

**成功标准**:
- [ ] 基于 Stage 1 的 `follow_up_suggestions` 进行查询
- [ ] 理解了相关组件的依赖关系
- [ ] 识别了现有的代码模式和约定
- [ ] 获得了足够的实现上下文

**分析重点**:
- **依赖分析**: 新功能需要哪些现有组件？
- **模式识别**: 类似功能是如何实现的？
- **架构约定**: 需要遵循哪些设计原则？
- **集成点**: 新代码如何与现有系统集成？

### Stage 3: 实现阶段 (Implementation Phase)

**目标**: 基于 Graph RAG 上下文生成符合架构约定的高质量代码

**约束条件**:
- [ ] **模式一致性**: 代码必须遵循 Graph RAG 分析得出的现有模式
- [ ] **架构约定**: 严格遵循 LinchKit 的设计原则和约束
- [ ] **依赖规范**: 使用正确的包导入和依赖关系
- [ ] **类型安全**: 确保 TypeScript 严格模式兼容性

**实施原则**:
1. **复用优先**: 必须使用 LinchKit 内部包的现有功能
2. **渐进实现**: 按 Graph RAG 建议的步骤顺序实现
3. **验证驱动**: 每个步骤完成后立即验证正确性

## 🛠️ AI 工具使用规范

### ai:query 工具规范

**格式要求**:
- **必须使用**: `--format ai-context` 获得 AI 优化的上下文
- **禁止使用**: 原始的 table 或 json 格式进行架构理解

**查询策略**:
```bash
# ✅ 正确的查询顺序
1. linch ai:query --type stats --format ai-context              # 项目概览
2. linch ai:query --type node --search "<entity>" --format ai-context    # 实体查找  
3. linch ai:query --type relations --search "<component>" --format ai-context # 关系分析

# ❌ 错误的使用方式
linch ai:query --type node --search "User" --format table      # 非 AI 友好格式
```

**响应处理**:
- **重视 `summary`**: 用于快速理解查询结果
- **深入 `data`**: 获取结构化的技术信息
- **利用 `metadata`**: 评估结果的可信度
- **执行 `follow_up_suggestions`**: 指导下一步操作

### 上下文数据包解读

**标准结构**:
```json
{
  "summary": "自然语言摘要 - AI 理解的入口",
  "data": {
    "central_node": "核心节点信息",
    "dependencies": "依赖关系列表", 
    "dependents": "被依赖关系列表",
    "siblings": "相关节点信息"
  },
  "metadata": {
    "confidence": "置信度评分 (0-1)",
    "result_count": "结果数量"
  },
  "follow_up_suggestions": [
    "推荐的下一步操作指令"
  ]
}
```

**AI 理解重点**:
- **`dependencies`**: 新功能需要导入哪些模块？
- **`dependents`**: 新功能可能影响哪些组件？
- **`siblings`**: 有哪些类似的实现可以参考？

## ✅ 质量验证标准

### 基于 Graph RAG 上下文的代码质量

**架构一致性验证**:
- [ ] 新代码的导入方式与 Graph RAG 分析的模式一致
- [ ] API 设计遵循现有的路由和命名约定
- [ ] 数据模型变更符合现有的 Schema 模式

**上下文准确性验证**:
- [ ] 实现的功能确实使用了 Graph RAG 识别的相关组件
- [ ] 代码结构反映了依赖关系分析的结果
- [ ] 集成点与路径分析的预期一致

**AI 理解验证**:
- [ ] 能够解释为什么选择特定的实现方案
- [ ] 能够描述新代码与现有架构的关系
- [ ] 能够预测新功能对其他组件的影响

### 传统质量标准（仍需满足）

- [ ] TypeScript 严格模式通过
- [ ] ESLint 检查通过
- [ ] 测试覆盖率达标
- [ ] 构建成功

## 🔍 常见问题与最佳实践

### Graph RAG 查询失败时

**问题处理顺序**:
1. 检查 Neo4j 服务状态
2. 验证 AI 包构建状态
3. 确认 Graph RAG 数据是最新的
4. 降级到传统文件搜索，但必须在文档中说明

### 低置信度结果处理

**当 `confidence < 0.5` 时**:
1. 尝试更具体的搜索词
2. 使用多个查询角度验证结果
3. 结合传统方法进行交叉验证
4. 在实现中添加额外的验证步骤

### AI 理解偏差纠正

**识别偏差的信号**:
- 生成的代码与现有模式显著不符
- 导入的包不在依赖关系中
- API 设计与现有约定冲突

**纠正措施**:
1. 重新执行 Graph RAG 查询
2. 扩大查询范围和深度
3. 手动验证关键架构决策
4. 更新 Graph RAG 数据（如果发现数据过时）

## 📚 相关文档

- [核心工作流和约束](../core/workflow_and_constraints.md) - 基础开发约束
- [AI 工具清单](../../ai-tools-manifest.json) - 工具详细规范
- [Session 模板](../core/session_template.md) - 标准化执行流程

## 🚀 版本历史

- **v1.0** (2025-07-06): 初始版本，基于 Phase 4.0 Graph RAG 集成成果