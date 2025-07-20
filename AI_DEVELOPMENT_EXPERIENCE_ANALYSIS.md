# LinchKit Phase 0 工作流引擎评估与改进计划

## 当前实现分析

### 1. 已实现的功能

- **AI工作流命令**: `tools/cli/src/commands/workflow-run.ts`
  - 实现了基于v5.2规范的Phase 0 MVP
  - 包含AI Guardian验证、执行计划生成、人工审批、执行和回执生成
  - 支持自动审批模式（通过`--auto-approve`参数或环境变量）
- **手动回执生成**: `tools/cli/src/commands/manual-receipt.ts`
  - 为人工修改的代码生成工作流回执
  - 跟踪Git状态变更并记录
- **CLI入口**: `tools/cli/src/index.ts`
  - 提供了`ai-workflow`和`manual-receipt`命令
  - 通过`package.json`中的脚本可以快速访问

### 2. 存在的问题

#### A. 自然语言交互支持薄弱
- 当前实现仅接受简单的任务描述字符串
- 没有与Claude Code或Gemini CLI的真实集成
- 缺乏上下文理解和复杂任务解析能力

#### B. AI Provider集成不完整
- `workflow-run.ts`中的AI调用是模拟的（`generateExecutionPlan`函数）
- 虽然存在`CLIBasedAIProvider`，但未与工作流引擎集成
- 缺少与实际AI服务（Gemini API）的连接

#### C. 工作流状态管理简化
- 只实现了三状态FSM（`PENDING_APPROVAL`、`EXECUTION`、`COMPLETED`）
- 缺少持久化状态管理和恢复机制
- 没有实现规划中的七状态机

#### D. 规则引擎缺失
- 未实现"规则即代码"系统
- 缺少JSON Schema验证
- AI Guardian验证只是调用外部脚本

#### E. 缺乏对AI Agent的“可信环境”和“可信要求”的构建
- 未能系统性地为AI Agent提供全面、结构化、可访问的上下文信息。
- 未能精确地定义对AI Agent的指令、约束和期望输出格式。
- 缺乏有效的验证与反馈循环机制来持续优化AI Agent的行为。

## 综合重构方案：结合可信环境与内部工具优化

### 总体评估

经过重新评估，我们完全认同当前的"综合重构方案"。这是一个：
- ✅ 与LinchKit战略定位高度一致的方案
- ✅ 技术架构设计合理的方案
- ✅ 实施时间线现实可行的方案
- ✅ 能够实现深度AI辅助开发愿景的方案

### 建议的实施方案

#### 阶段1：核心功能与可信要求构建（1-2周）

1.  **AI工作流模块架构优化**
    - **创建新的内部包 `packages/ai-workflow`，用于承载核心AI工作流逻辑。**
    - 将`tools/cli`中AI工作流相关代码（如`workflow-run.ts`和`manual-receipt.ts`的核心逻辑）迁移至`packages/ai-workflow`。
    - 明确`packages/ai-workflow`的职责和边界，确保其模块化，便于内部调用和维护。
    - 更新`tools/cli`，使其调用`packages/ai-workflow`中暴露的功能。
2.  **实现精确Prompt工程与初步上下文利用**
    - 集成真实的Gemini API调用。
    - 设计结构化的Prompt模板系统。
    - 定义清晰的输入输出Schema。
    - 利用现有Graph RAG功能（例如通过执行`bun run ai:session query`并解析其结构化输出），构建初版可信环境，为Gemini提供初步上下文。
3.  **Claude Code调度机制**
    - 设计Claude Code -> LinchKit内部AI工作流模块 -> Gemini的调用链。
    - 实现标准化的JSON响应格式。

#### 阶段2：可信环境深化 + 规则引擎（2-3周）

1.  **上下文管理系统深化**
    - 实现项目状态、文档、规范的自动收集。
    - 利用已有的Graph RAG功能，通过内部函数调用或共享模块，获取代码结构、依赖关系等深层图谱信息。
    - 引入并利用Vector Store（向量数据库）作为LinchKit内部组件，建议技术选型为Qdrant（开源、高性能），并使用OpenAI text-embedding-3-small等Embedding模型。通过内部函数调用或共享模块，进行高效的语义检索，智能地提取和精炼相关上下文信息。
    - 设计缓存策略，如使用Redis缓存常用查询结果，以优化性能。
    - 实现渐进式降级策略，当Vector Store不可用时，可回退到Graph RAG或其他基本上下文获取方式。
    - 以JSON/YAML格式向AI呈现结构化上下文。
2.  **规则引擎和验证**
    - 构建"规则即代码"框架。
    - 实现JSON Schema验证。
    - 建立验证反馈循环机制。
3.  **完整状态机**
    - 扩展到七状态工作流。
    - 添加状态持久化。
    - 实现回滚和错误恢复。

#### 阶段3：集成与体验优化（1周）

1.  **LinchKit内部集成优化**
    - 确保AI工作流模块与LinchKit其他核心组件的无缝集成。
    - 完善内部文档和示例。
    - **利用`linch-kit/core`中已有的观测和日志实现，建立完善的监控和告警机制，确保复杂系统的可观测性。**
2.  **IDE集成准备**
    - 设计API接口规范。
    - 实现WebSocket通信。
    - 创建插件开发指南。

### 核心设计原则

1.  **内部模块化：** LinchKit内部AI工作流模块职责清晰，便于维护和迭代。
2.  **清晰的内部接口：** 各组件之间通过清晰的内部接口进行通信，而非紧密耦合。
3.  **可信要求：** 精确的Prompt工程和Schema验证。
4.  **可信环境：** 结构化的上下文管理和工具访问控制。
5.  **人机协作：** 保持PENDING_APPROVAL核心机制。

### 立即行动项

1.  **创建 `packages/ai-workflow` 目录结构，并配置为LinchKit内部包。**
2.  **将 `tools/cli` 中 AI 工作流相关代码的核心逻辑迁移至 `packages/ai-workflow`，并更新 `tools/cli` 以调用新包。**
3.  实现Gemini API真实调用和基本Prompt工程。
4.  利用现有Graph RAG功能，构建初版可信环境。
5.  设计Prompt模板和Schema系统。
6.  规划Vector Store的引入和集成，包括技术选型和内部调用方式。
7.  更新`package.json`（如果需要调整模块依赖）。

这个方案在LinchKit内部实现了可信环境构建和AI工作流优化，是一个全面的解决方案。

## 角色职责澄清

为了进一步明确 LinchKit 中 AI 和人类的角色，我们将在文档中增加以下说明：

- **人类作为高层级指令者与监督者：** 通过自然语言指令（如`/start`命令）向Claude Code发起任务，定义高层级目标，审批AI生成的计划和代码，提供反馈，进行最终决策以及设计整体系统架构和用户体验。
- **Claude Code 作为顶层调度者与编程者：** 接收人类指令，进行初步任务理解和分解。可调用Graph RAG等工具获取初步上下文。将任务的“思考”和“规划”部分委托给LinchKit内部AI工作流模块。接收AI工作流模块返回的结构化结果，并负责最终的代码生成、重构和优化。
- **LinchKit内部AI工作流模块作为核心协调者：** 接收Claude Code的委托，负责构建“可信环境”（通过内部调用Graph RAG、Vector Store等LinchKit内部组件），构建精确Prompt，与Gemini进行交互，接收并验证Gemini的输出，管理工作流状态，并将结构化结果返回给Claude Code。
- **Gemini 作为思考者：** 接收LinchKit内部AI工作流模块构建的精确Prompt和“可信环境”，负责理解复杂任务、进行规划、生成执行策略、评估潜在风险和提供决策支持。