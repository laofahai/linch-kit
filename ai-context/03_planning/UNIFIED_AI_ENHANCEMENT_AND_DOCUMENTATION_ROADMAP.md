# LinchKit 统一 AI 能力增强与标准化文档路线图 (AI Enhancement & Documentation Roadmap)

**版本**: 1.0
**状态**: 最终规划，待批准
**目标**: 本路线图旨在为 LinchKit 项目引入一套完整的 AI 协作框架和标准化的知识库。其最终目的是提升项目可维护性、降低新成员上手难度、并为 AI 助手提供高质量的、结构化的上下文，以实现高效、可靠的 AI 辅助开发。

---

## 第一阶段：信息架构重构与安全迁移 (Phase 1: Information Architecture Refactoring & Safe Migration)

**目标**: 安全、有序地过渡到新的 `ai-context` 信息架构，确保不丢失任何有价值的历史信息，并为未来的知识沉淀打下坚实基础。

### **任务 1.1: 创建历史备份分支**

*   **背景**: 在进行任何破坏性操作（如移动、删除文件）之前，必须创建一个完整的、不可变的备份。
*   **产出**: 一个名为 `archive/legacy-ai-context-snapshot-20250705` 的新 Git 分支。
*   **执行**: `git checkout -b archive/legacy-ai-context-snapshot-20250705` 然后 `git push origin --set-upstream archive/legacy-ai-context-snapshot-20250705`。
*   **验收标准**: 远程仓库中存在该分支，作为永久的历史快照。

### **任务 1.2: 建立 AI 协作框架**

*   **背景**: 为了解决 AI 行为不可预测、易偏离核心指令的问题，我们必须首先建立一个所有 AI 都需遵守的“宪法”。
*   **产出**: 创建一个新文件 `ai-context/AI_COLLABORATION_FRAMEWORK.md`。
*   **最终内容**: (此处省略 v3 版本的完整内容，以保持本路线图的简洁性，实际执行时应包含完整内容)
*   **验收标准**: `ai-context/AI_COLLABORATION_FRAMEWORK.md` 文件被创建并提交到代码库。

### **任务 1.3: 建立知识库长效治理机制**

*   **背景**: 为防止新的信息架构随时间推移而再次变得混乱，必须建立清晰的维护和贡献规则。
*   **产出**: 在 `ai-context/` 目录下创建一个新的指导性文件 `KNOWLEDGE_BASE_GOVERNANCE.md`。
*   **治理内容**: 包含所有权与职责、贡献指南、审查流程等。
*   **验收标准**: `KNOWLEDGE_BASE_GOVERNANCE.md` 文件被创建并提交。

### **任务 1.4: 制定并执行“策展式”迁移计划**

*   **背景**: 不能盲目地将所有旧文档移动到新结构中。必须逐一审查，决定其最终归属：**迁移**、**归档** 或 **废弃**。
*   **产出**: 一个明确的迁移清单和执行该清单的提交。
*   **最终结构**:
    ```
    ai-context/
    ├── 00_framework/
    │   ├── AI_COLLABORATION_FRAMEWORK.md
    │   └── KNOWLEDGE_BASE_GOVERNANCE.md
    ├── 01_strategy_and_architecture/
    │   └── ... (所有被判定为需迁移的旧 architecture/* 和 core/* 文件)
    ├── 02_knowledge_base/
    │   └── library_api/
    ├── 03_planning/
    │   └── UNIFIED_AI_ENHANCEMENT_AND_DOCUMENTATION_ROADMAP.md (本文件)
    └── 04_archive/
        └── legacy_documents/
            └── ... (所有被判定为需归档的旧文件)
    ```
*   **验收标准**: 所有旧文件都已根据制定的迁移清单被处理，并通过一次独立的 `refactor(ai): curate and migrate ai-context to new IA` 提交完成。

---

## 第二阶段：核心库审查、增强与文档化 (Phase 2: Core Libraries Review, Enhancement & Documentation)

**目标**: 根据既定标准，为所有核心 `packages` 和 `modules` 审查并补充设计、实现缺失功能、并生成高质量的开发者文档和 AI 上下文。

### **任务 2.1: 逐一审查、补充并文档化核心库**

*   **背景**: 考虑到部分包的现有实现可能不完整，直接文档化会固化问题。因此，在为每个包创建文档前，必须先对其设计进行审查和补充。
*   **执行规约**: 对开发计划中的每一个包，Claude Code 必须严格遵循以下**“设计-实现-文档化”**三步流程：

    **步骤 A：设计审查与补充 (Design Review & Supplementation)**
    1.  **分析**: AI 首先分析包的现有代码、`README`、测试覆盖率报告等，以评估其当前设计的完整性。
    2.  **比对**: 将其现状与 `ai-context/01_strategy_and_architecture/` 中的高级架构原则进行比对。
    3.  **提议**: 如果发现设计缺陷或功能缺失，AI 的**第一个草案**不应该是文档，而是一个**“设计补充提议”**。
    4.  **审批**: 项目负责人必须先批准这份设计补充提议。

    **步骤 B：实现补充 (Implementation)**
    1.  在设计获得批准后，Claude Code 将根据新的设计补充，完成缺失功能的代码实现和单元测试。
    2.  这一步的产出是高质量、高测试覆盖率的代码。

    **步骤 C：标准化文档 (Standardized Documentation)**
    1.  在代码和功能完全符合最终设计后，Claude Code 最后才开始为其生成和更新 `README.md` 和 `ai-context/02_knowledge_base/library_api/*.md`。

*   **执行顺序 (开发计划)**:
    1.  `packages/core`
    2.  `packages/schema`
    3.  `packages/auth`
    4.  `packages/trpc`
    5.  `packages/crud`
    6.  `packages/ui`
    7.  `modules/console`
*   **验收标准**: 所有指定库都完成了设计补充、功能实现和标准文档的创建，并已提交。

---

## 第三阶段：知识图谱 MVP (Phase 3: Knowledge Graph MVP)

**目标**: 基于已标准化的文档，构建知识图谱的最小可行产品 (MVP)，使 AI 的上下文理解能力从“文档级”跃升到“图谱级”。

### **任务 3.1: 开发数据提取器 (Data Extractors)**

*   **产出**: 一系列用于解析项目信息的脚本。
*   **具体开发任务**:
    *   `scripts/extractors/package-json-extractor.ts`
    *   `scripts/extractors/library-api-extractor.ts`
    *   `scripts/extractors/typescript-ast-extractor.ts`
*   **验收标准**: 每个提取器脚本都能输出结构化的 JSON。

### **任务 3.2: 部署图数据库并开发导入器**

*   **产出**: 一个可运行的图数据库实例和一个数据导入脚本。
*   **具体开发任务**:
    *   创建 `docker-compose.yml`，配置 `neo4j` 服务。
    *   创建 `scripts/importers/graph-importer.ts` 脚本。
*   **验收标准**: 成功运行 `docker-compose up -d` 和 `bun run scripts/importers/graph-importer.ts` 后，可以在 Neo4j Browser 中看到图数据。

### **任务 3.3: 开发并集成 AI 查询工具**

*   **产出**: 一个 AI 可调用的新工具。
*   **具体开发任务**:
    *   **开发查询服务**: `services/graph-query-service`。
    *   **定义并集成 AI 工具**: `query_knowledge_graph`, `get_package_dependencies`, `get_function_usage`。
*   **验收标准**: AI 助手能够成功调用这些新工具并使用其返回的结果。

---

## 第四阶段：持续集成与未来展望 (Phase 4: Continuous Integration & Future)

**目标**: 将已构建的基础设施融入日常开发，并展望未来的高级 AI 功能。

*   **任务 4.1**: 将数据提取和导入脚本集成到 CI/CD 流程。
*   **未来展望**: AI 辅助调试、自动化重构、与可观测性结合等。