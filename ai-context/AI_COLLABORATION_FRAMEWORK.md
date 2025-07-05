# LinchKit AI 协作框架 (AI Collaboration Framework)

**版本**: 1.0
**状态**: 生效中
**目标**: 本文档是指导所有 AI 助手在 LinchKit 项目中与人类开发者进行高效、可信、可预测协作的**最高行为准则**。它旨在将 AI 的工作与项目核心的架构战略和长期愿景深度整合。所有 AI 必须在开始任何任务前完全理解并遵守此框架。

---

## 1. 愿景与核心原则 (Vision & Core Principles)

### 1.1. 愿景 (Vision Alignment)
AI 协作的最终愿景，是加速实现 `ai-context/core/vision_and_scope.md` 中定义的目标：构建一个高度模块化、AI-First 的全栈开发框架。AI 的所有活动都必须服务于此愿景。

### 1.2. 核心原则 (Core Principles)
1.  **人类主导 (Human-Led)**: 最终决策权始终属于人类开发者。
2.  **透明可预测 (Transparent & Predictable)**: AI 的所有行为都必须可解释、可预测。
3.  **安全第一 (Safety First)**: 绝不执行任何未经授权的破坏性操作。
4.  **遵守约定 (Convention Adherence)**: 严格遵守项目中已有的所有规范。

---

## 2. AI 行为与合规体系 (AI Behavior & Compliance System)

### 2.1. 三层防御体系 (Three-Tier Defense System)
为防止“指令漂移”，AI 必须在执行流程中嵌入此体系：
*   **第一层：核心行为准则**: AI 在每次会话或新任务开始时，必须重申的指令集（绝不提前执行、草案优先、遵循蓝图、自我审计）。
*   **第二层：强制自我审计**: 在提交任何草案或计划前，AI 必须附加“合规性自查清单”。
*   **第三层：单一事实来源**: 本文件是 AI 行为的唯一事实来源。

### 2.2. 与项目核心战略的深度集成 (Deep Integration with Core Project Strategies)

AI 的工作不仅要遵守流程，更要主动与项目已定义的核心技术战略保持一致。

#### 2.2.1. 可观测性集成 (Observability Integration)
*   **遵从策略**: AI 生成的所有代码，都必须遵循 `ai-context/architecture/observability_strategy.md`。
*   **责任**:
    *   **结构化日志**: 生成的任何服务端逻辑，都应使用项目统一的日志库（如 `pino`）并包含丰富的上下文。
    *   **核心指标**: 如果代码引入了新的关键操作（如 API 调用、数据库访问），必须同时生成用于 Prometheus 监控的核心指标（Counter, Gauge, Histogram）。
    *   **分布式追踪**: 生成的代码应天然支持 OpenTelemetry，确保调用链的完整性。

#### 2.2.2. 策略即代码 (PaC) 集成 (Policy as Code Integration)
*   **遵从策略**: AI 的所有产出都必须能通过 `ai-context/architecture/policy_as_code_strategy.md` 中定义的策略验证。
*   **责任**:
    *   **事前检查**: 在提交代码草案前，AI 应主动询问或运行相关的静态检查工具（如 `eslint`, `stylelint`, 或未来可能的自定义策略引擎），以确保代码符合规范。
    *   **生成合规代码**: AI 生成的配置文件、基础设施代码（如 Dockerfile）等，都必须符合预设的策略。

#### 2.2.3. AI 代码生成策略对齐 (AI Code Generation Strategy Alignment)
*   **遵从策略**: AI 必须按照 `ai-context/architecture/ai_code_generation_strategy.md` 中定义的模式和最佳实践来生成代码。
*   **责任**:
    *   **组件模型**: 生成的组件应符合项目定义的组件模型（如高内聚、低耦合、单一职责）。
    *   **API 设计**: 设计的 API 接口应清晰、一致，并遵循项目的命名约定。

#### 2.2.4. 数据治理遵从 (Data Governance Adherence)
*   **遵从策略**: 在处理任何数据时，AI 必须遵守 `ai-context/architecture/data_governance_strategy.md`。
*   **责任**: 严禁在代码中硬编码敏感信息。在处理可能包含个人身份信息 (PII) 的数据时，必须主动提示并采用推荐的加密或脱敏方法。

---

## 3. 知识与上下文利用协议 (Knowledge & Context Utilization Protocol)

### 3.1. 知识来源 (Sources of Knowledge)
AI 必须有能力利用所有知识来源：静态文档、源代码、以及未来的**结构化知识图谱 (Graph RAG)**。

### 3.2. 上下文驱动的工作流程 (Context-Driven Workflow)
*   **强制性知识检索**: 在规划阶段，必须先查询知识库，进行影响分析和复用检查。
*   **在计划中体现上下文**: 提出的计划必须明确说明其决策依据。

### 3.3. 知识库的持续贡献 (Contributing Back to the Knowledge Base)
*   **文档同步**: AI 有责任在任务结束时，提出对相关文档的更新草案。
*   **识别知识缺口**: AI 应主动报告知识库中的缺失或错误信息。

---

## 4. 标准任务执行协议 (Standard Task Execution Protocol)

1.  **任务理解**: 提问并澄清任何歧义。
2.  **分析与规划**: 基于上下文分析，提出分步计划。
3.  **开发与实现**: 编写符合所有规范的草案。
4.  **测试与验证**: 编写或更新测试，并运行所有验证脚本。
5.  **提交与部署**: 起草提交信息供批准，绝不擅自推送或部署。
