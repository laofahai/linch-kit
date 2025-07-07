# LinchKit Graph RAG 策略

## 1. 愿景与目标

将 Graph RAG（Retrieval-Augmented Generation with Graph）集成到 LinchKit 的开发过程中，旨在通过构建和利用项目知识图谱，显著提升 AI 助手的代码理解与生成能力，并为人类开发者提供更智能、更高效的开发体验。

**核心目标：**
*   **增强 AI 助手能力**：使 AI 能够进行深度上下文检索、精确依赖追踪和影响分析，生成更符合项目架构和惯例的代码。
*   **提升开发者体验 (DX)**：提供智能代码导航、快速上手引导、架构一致性保障和自动化重构辅助。
*   **赋能自动化**：为智能代码生成、自动化测试、性能优化和安全审计提供数据基础。

## 2. 核心概念

**知识图谱 (Knowledge Graph)**：一个由节点（实体）和边（关系）组成的网络，用于表示 LinchKit 项目中的各种信息及其相互联系。

**Graph RAG**：利用知识图谱进行信息检索，并将检索到的结构化信息注入到大型语言模型 (LLM) 的提示中，以增强其生成能力。

## 3. 集成方案

Graph RAG 的集成将是一个多阶段、迭代式的过程，涵盖数据提取、图谱构建、查询层开发以及与现有工具和工作流的深度融合。

### 3.1. 数据源识别与提取

这是构建知识图谱的基础。我们将从 LinchKit 的各个角落提取结构化和半结构化的信息，并将其转化为图谱中的节点和边。

**初始阶段数据源：**
*   **代码库 (Codebase)**：
    *   **`package.json` 解析**：提取包名、版本、依赖关系 (`DEPENDS_ON`)。
    *   **TypeScript AST 解析**：解析 `packages/*/src/index.ts` 等入口文件，识别公共导出 API（函数、类、接口、类型），并记录它们所属的文件和包（`DEFINES`, `EXPORTS`）。
    *   **文件与目录结构**：文件和目录作为节点，`CONTAINS` 关系。
*   **Schema 定义 (`@linch-kit/schema`)**：
    *   **解析 `defineEntity`, `defineField` 调用**：提取实体、字段、类型、验证规则作为节点。定义实体与字段间的 `HAS_FIELD` 关系，字段与类型间的 `IS_TYPE_OF` 关系，以及实体间的 `HAS_RELATION` 关系。
*   **文档 (`ai-context/library-api/*.md`)**：
    *   **Markdown 解析**：提取包名、目的、公共 API 列表等信息。建立文档与代码实体间的 `DOCUMENTS` 关系。

**未来扩展数据源：**
*   更详细的 AST 解析（函数调用、变量使用、类型引用）。
*   `DESIGN.md` 和 `README.md` 中的非结构化信息（通过 NLP 提取概念和关系）。
*   Git 历史（提交、作者、变更文件、提交类型）。
*   配置文件（`tsconfig.json`, `eslint.config.js` 等）。

### 3.2. 图数据库实现

选择并部署一个适合的图数据库，用于存储和管理提取到的知识图谱数据。

*   **推荐选择**：**Neo4j** (本地开发使用 Neo4j Desktop，生产环境考虑 Docker 部署)。其成熟的 Cypher 查询语言和生态系统将简化开发。
*   **图谱 Schema 定义 (初始)**：
    *   **节点类型 (Labels)**：`Package`, `File`, `Function`, `Class`, `Interface`, `Type`, `SchemaEntity`, `SchemaField`, `Doc`。
    *   **边类型 (Relationships)**：`DEPENDS_ON`, `DEFINES`, `EXPORTS`, `IMPORTS`, `HAS_FIELD`, `IS_TYPE_OF`, `HAS_RELATION`, `DOCUMENTS`, `CONTAINS`。

### 3.3. Graph RAG 层开发

构建一个中间层，负责接收查询、与图数据库交互、增强提示并传递给 LLM。

*   **图谱查询服务**：开发一个 RESTful API 服务（例如，使用 Python FastAPI 或 Node.js Express），接收结构化查询或初步的自然语言查询。
*   **检索 (Retrieval)**：根据查询，从图数据库中检索相关的节点和边。支持多跳查询以获取更丰富的上下文。
*   **增强 (Augmentation)**：将检索到的图谱信息（节点属性、边类型、路径等）以结构化或半结构化的文本形式注入到原始用户查询中，作为 LLM 的额外上下文。
*   **生成 (Generation)**：将增强后的提示发送给大型语言模型 (LLM)，由 LLM 生成最终的响应、代码或建议。

### 3.4. 与 AI 助手集成

将 Graph RAG 能力作为新的工具暴露给 AI 助手（如 Gemini 和 Claude Code）。

*   **新增工具**：
    *   `query_linchkit_graph(query: str)`：允许 AI 助手向知识图谱发起查询，获取结构化信息。
    *   `analyze_code_impact(entity_type: str, entity_name: str)`：查询某个实体（函数、类、Schema）的影响范围或依赖关系。
*   **提示工程**：训练 AI 助手识别何时调用这些工具，并指导它们如何解析工具返回的结果，将其融入到响应和代码生成中。

### 3.5. 与开发者工具集成 (未来扩展)

将 Graph RAG 的能力扩展到 IDE 和 CLI，直接赋能人类开发者。

*   **IDE 插件**：提供智能代码导航、实时上下文、重构辅助和架构可视化。
*   **CLI 工具**：提供命令行查询、影响分析、用法查找和架构验证功能。

### 3.6. 工作流集成与维护

确保知识图谱能够持续更新并融入日常开发流程。

*   **自动化更新**：在 CI/CD 管道中集成数据提取和图谱更新任务，确保图谱与代码库同步。
*   **人工反馈与校正**：提供机制允许开发者报告图谱中的不准确信息，并进行手动校正。
*   **图谱 Schema 版本控制**：将图谱的 Schema 定义与代码库一起进行版本控制。

## 4. 分工与实施路径

我们将采取**迭代式开发**的方法，从小范围开始，逐步扩展功能和数据源。

*   **Gemini (规划者/架构师)**：
    *   定义“做什么”和“为什么做”。
    *   设计图谱的逻辑 Schema。
    *   规划数据流和系统架构。
    *   定义 AI 助手的工具接口和使用策略。
    *   监督和验证 Claude Code 的实现是否符合设计意图。
*   **Claude Code (执行者/编码者)**：
    *   实现“怎么做”。
    *   编写所有的数据提取、导入、服务和集成脚本。
    *   处理具体的编程语言和框架细节。
    *   解决编码过程中的技术挑战。
    *   根据 Gemini 的设计和规范，将想法转化为可执行的代码。

**迭代步骤示例：**
1.  **MVP (最小可行产品)**：
    *   **数据源**：仅 `package.json` 和 `ai-context/library-api/*.md`。
    *   **图谱**：只包含 `Package` 和 `Doc` 节点，以及 `DEPENDS_ON` 和 `DOCUMENTS` 关系。
    *   **查询**：实现简单的包依赖查询和包文档查询。
    *   **集成**：作为 Gemini 的一个工具，能够回答“某个包依赖了什么”和“某个包的文档是什么”。
2.  **Schema 增强**：
    *   **数据源**：增加 `@linch-kit/schema` 定义的实体和字段。
    *   **图谱**：增加 `SchemaEntity` 和 `SchemaField` 节点，以及 `HAS_FIELD`, `HAS_RELATION` 等关系。
    *   **查询**：能够回答“某个 Schema 有哪些字段”、“某个实体与哪些其他实体相关”。
3.  **代码结构增强**：
    *   **数据源**：增加 TypeScript AST 解析，识别函数、类、接口的定义和导入。
    *   **图谱**：增加 `Function`, `Class`, `Interface` 节点，以及 `DEFINES`, `IMPORTS`, `CALLS` 等关系。
    *   **查询**：能够回答“某个函数在哪里被定义”、“某个类在哪里被使用”。

通过这种迭代和分工，我们可以逐步构建一个强大而实用的 LinchKit 知识图谱，并将其深度融入开发流程。
