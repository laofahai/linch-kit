# Linch-Kit Monorepo 统一文档化方案

## 1. 核心理念与目标

**目标：** 为 `packages` 和 `modules` 目录下的每一个包（package）创建清晰、一致、易于理解的说明文档，并将其整合到 `ai-context` 中，以解决在开发 `apps` 时因信息不透明而导致的架构问题。

**核心原则：**
1.  **文档即代码：** 文档应与代码一同存放、一同变更、一同审查。
2.  **自动化优先：** 优先考虑从代码（如 JSDoc, TSDoc 注释）自动生成 API 文档。
3.  **AI 友好：** 文档结构应清晰、一致，便于 AI 理解和检索。
4.  **开发者友好：** 文档应包含清晰的用例和指引，降低上手门槛。

---

## 2. 详细执行计划 (初始方案)

#### 第一步：分析与信息收集 (Analysis & Information Gathering)

此阶段的目标是全面了解每个包的用途、API 和依赖关系。

1.  **遍历目标目录：**
    *   扫描 `packages/` 和 `modules/` 目录下的所有子目录。
    *   对于每个子目录，定位其 `package.json` 文件。

2.  **提取基本信息：**
    *   从 `package.json` 中解析出以下关键信息：
        *   `name`: 包名 (例如 `@linch-kit/auth`)
        *   `description`: 包的简短描述。
        *   `dependencies`, `devDependencies`, `peerDependencies`: 依赖关系。

3.  **识别公共 API：**
    *   分析每个包的入口文件（通常在 `package.json` 的 `main`, `module`, 或 `exports` 字段中指定，或者默认为 `src/index.ts` 或 `src/index.js`）。
    *   列出所有从入口文件导出的（`export`）函数、类、常量、类型和组件。这是该包的公共 API 契约。

#### 第二步：创建标准化的文档结构与内容 (Documentation Structure & Content Creation)

为每个包创建两份文档：一份是给开发者看的 `README.md`，另一份是给 AI 看的、更结构化的上下文。

1.  **为每个包创建 `README.md`：**
    *   在每个包的根目录下（例如 `packages/auth/README.md`）创建或更新 `README.md` 文件。
    *   **如果 `README.md` 已存在，请基于以下模板进行补充和完善，而不是完全覆盖。**
    *   使用以下标准模板：

    ```markdown
    # @linch-kit/auth  <!-- 包名 -->

    > [!NOTE]
    > <!-- 一句话核心功能描述，例如：处理用户认证、会话管理和权限控制 -->
    > Core package for handling user authentication, session management, and authorization.

    ## 核心功能 (Core Features)

    *   <!-- 功能点 1，例如：基于 NextAuth.js 的适配器 -->
    *   <!-- 功能点 2，例如：提供了 `useSession` hook 获取会话状态 -->
    *   <!-- 功能点 3，例如：包含用于保护 API 路由和页面的中间件 -->

    ## 安装 (Installation)

    在你的应用或其他包中，使用 pnpm 添加依赖：

    ```bash
    pnpm add @linch-kit/auth --workspace
    ```

    ## 使用方法 (Usage)

    ### 主要 API 概览 (Main API Overview)

    *   `auth(config)`: 初始化函数。
    *   `useSession()`: React Hook，用于在客户端组件中获取会话信息。
    *   `withAuth(handler)`: 用于保护 API 路由的高阶函数。
    *   `AuthMiddleware`: 用于 Next.js 中间件的保护函数。

    ### 示例：保护一个 Next.js 页面

    ```typescript
    // file: apps/your-app/src/app/dashboard/page.tsx
    import { useSession } from '@linch-kit/auth/react'; // 假设有子路径导出

    export default function DashboardPage() {
      const { data: session, status } = useSession();

      if (status === 'loading') {
        return <p>Loading...</p>;
      }

      if (status === 'unauthenticated') {
        return <p>Access Denied</p>;
      }

      return <h1>Welcome, {session.user.name}</h1>;
    }
    ```

    ## 与其他包的关系 (Relation to Other Packages)

    *   **@linch-kit/core:** 依赖此包提供的通用类型和错误处理。
    *   **@linch-kit/trpc:** 可与 tRPC 结合，在 procedure 中获取认证上下文。
    ```

2.  **创建并整合 AI 上下文文档：**
    *   在 `ai-context/` 目录下创建一个新的子目录，例如 `packages-api/`。
    *   为 `packages/` 和 `modules/` 下的每个包，在此新目录中创建一个对应的 Markdown 文件。例如：
        *   `ai-context/packages-api/auth.md`
        *   `ai-context/packages-api/core.md`
        *   `ai-context/packages-api/console.md`
    *   这些文件应更侧重于 API 的精确描述，内容可以从 `README.md` 中提炼，但格式更严格，以便于 AI 解析。

    **`ai-context/packages-api/auth.md` 文件内容示例:**

    ```markdown
    # Package: @linch-kit/auth

    **Purpose:** Handles user authentication, session management, and authorization.

    **Public API:**

    - **Functions:**
      - `auth(config: AuthConfig): NextAuthResult`: Initializes the authentication service.
      - `withAuth(handler: Function): Function`: Higher-order function to protect API routes.
    - **React Hooks:**
      - `useSession(): { data: Session | null, status: 'loading' | 'authenticated' | 'unauthenticated' }`: Hook to get session state in client components.
    - **Types:**
      - `Session`: Represents the user session object.
      - `User`: Represents the user profile.

    **Dependencies:**
    - `@linch-kit/core`
    - `next-auth`

    **Usage Pattern:**
    - Used in `apps/*` to provide authentication.
    - The `AuthMiddleware` is typically used in `apps/starter/middleware.ts`.
    ```

#### 第三步：建立维护机制 (Maintenance Plan)

文档只有在保持最新时才有用。

1.  **更新中央清单：**
    *   检查并更新 `ai-context/reference/packages_api.md` 文件。
    *   让它成为一个索引文件，链接到 `ai-context/packages-api/` 目录下的所有具体文档。这为 AI 提供了一个统一的入口点。

2.  **建立开发流程：**
    *   **推荐团队采纳以下流程：** 每当在一个包中添加或修改 `export` 的 API 时，必须同步更新该包的 `README.md` 和对应的 `ai-context/packages-api/*.md` 文件。
    *   **Code Review 要求：** 将文档更新作为代码审查（Code Review）的一部分，确保变更的逻辑和文档是一致的。

3.  **（可选）自动化 API 文档生成：**
    *   建议未来可以引入 [TSDoc](https://tsdoc.org/) 或 [TypeDoc](https://typedoc.org/)。
    *   通过在源代码中编写规范的注释，可以自动生成大部分 API 参考文档，极大地降低维护成本。可以将生成脚本添加到 `package.json` 的 `scripts` 中。

---

## 3. 方案与现有开发流程及约束的结合

通过对 `git_workflow.md`、`workflow_and_constraints.md` 和 `changelog.md` 的审视，我确认新的文档化方案与现有开发流程和约束高度契合，并能进一步增强它们。

**现有关键约束及新方案的整合方式：**

1.  **“设计文档强制要求”**：
    *   **现有**：开发前必须有 `DESIGN.md`，涵盖架构、接口、用户体验等。
    *   **整合**：新方案要求为每个包/模块创建详细的 `README.md` 和结构化的 AI 友好文档（`ai-context/packages-api/*.md`），这直接支持了设计文档的要求。这些新文档可以被视为每个独立包/模块设计的一部分，为实现和复用提供必要的细节。

2.  **“测试同步强制要求”**：
    *   **现有**：功能代码和测试代码必须同步开发和更新，新功能测试覆盖率需达 90%+。
    *   **整合**：包的公共 API 的清晰文档（在 `README.md` 和 `ai-context/packages-api/*.md` 中）将极大地简化测试编写。开发者（和 AI）将能更精确地理解需要测试什么以及如何测试。

3.  **“强制性包复用检查”**：
    *   **现有**：强制复用 LinchKit 内部包功能，禁止重复实现。存在 `check-reuse.mjs` 脚本。
    *   **整合**：这是新文档化方案的核心价值所在。通过使每个包/模块的功能和 API 透明且易于发现，开发者（和 AI）将更有可能找到并复用现有组件。`check-reuse` 脚本甚至可以利用新的结构化 AI 友好文档进行更智能的建议。

4.  **“文档同步自动化”**：
    *   **现有**：开发完成后，`changelog.md`、`roadmap.md`、`development-status.md` 和 `README.md`（如果需要）必须更新。
    *   **整合**：新方案明确包含“维护机制”，要求在 API 添加或修改时同步更新包的 `README.md` 及其对应的 `ai-context/packages-api/*.md`。这直接将现有“文档同步”约束扩展到新的文档产物。

5.  **“Git 工作流规范”**：
    *   **现有**：严格的分支命名、提交信息格式（Conventional Commits）、PR 审查要求和 CI/CD 集成。
    *   **整合**：创建/更新这些新文档文件的行为将自然地融入现有 Git 工作流。文档的更改将作为功能/修复分支的一部分，在 PR 中进行审查，并使用适当的提交类型（`docs`）进行提交。

6.  **“Worktree 并行开发强制规范”**：
    *   **现有**：所有开发必须在独立的 worktree 中进行，临时 `DESIGN.md` 文件随后整合到主文档中。
    *   **整合**：新的包特定 `README.md` 和 `ai-context/packages-api/*.md` 文件将成为详细设计和 API 文档的**永久存储位置**，这些内容可能最初在 worktree 中的临时 `DESIGN.md` 中起草。`workflow_and_constraints.md` 中的“整合目标映射”应更新，以明确包含 `ai-context/packages-api/*.md` 作为“模块设计”或“API 设计”内容的整合目标。

**总体影响：**

新的文档化方案不会引入新的、冲突的流程。相反，它**加强并规范化**了与设计、复用和文档同步相关的现有最佳实践。它提供了 LinchKit 这样大型模块化项目所需的详细、可访问且 AI 友好的单个包和模块文档。

---

## 4. 全面审视与最佳实践

### 4.1. 现有文档体系审视

**1. 文档化方案 (`TEMP_DOCUMENTATION_PLAN.md`) 的审视：**

*   **优点**：
    *   **结构化和标准化**：明确提出了为每个包创建 `README.md` 和 AI 友好文档（`ai-context/packages-api/*.md`）的必要性，并提供了详细的模板和内容要求。
    *   **AI 友好**：特别强调了为 AI 创建结构化文档，这对于 Claude Code 这样的 AI 助手理解和利用项目功能至关重要。
    *   **维护机制**：提出了文档与代码同步更新、Code Review 纳入文档审查、以及未来自动化生成 API 文档的设想，这对于文档的长期有效性至关重要。
    *   **解决痛点**：直接针对“做 app 时容易出现架构错误”的问题，通过提高信息透明度来解决。
*   **潜在改进点/遗漏**：
    *   **`modules` 目录的 `DESIGN.md` 文件的处理**：方案中主要关注 `packages` 目录下的包，并建议在每个包根目录创建 `README.md`。然而，`modules/console` 已经有一个 `DESIGN.md`。这个 `DESIGN.md` 包含了架构、实体、路由、服务、组件、Hooks 等非常详细的信息，其内容深度远超普通 `README.md`。
        *   **问题**：如果按照方案在 `modules/console` 下也创建一个 `README.md`，可能会导致信息重复或分散。`DESIGN.md` 这种形式更适合描述模块的内部设计和复杂性。
        *   **建议**：方案应明确区分 `packages` 和 `modules` 的文档策略。对于 `modules`，特别是像 `console` 这样复杂的模块，`DESIGN.md` 应该作为其主要的设计文档，而 `README.md` 则可以作为其高层概览和快速入门指南，并链接到 `DESIGN.md` 获取详细信息。AI 友好文档（`ai-context/packages-api/*.md`）则应从 `DESIGN.md` 中提取核心 API 和集成点。
    *   **`ai-context/packages-api/` 目录命名**：方案建议创建 `ai-context/packages-api/`。考虑到 `modules` 目录下的模块也需要类似的 AI 友好文档，这个目录名可能不够通用。
        *   **建议**：更名为 `ai-context/shared-components-api/` 或 `ai-context/library-api/`，以包含 `packages` 和 `modules`。
    *   **现有 `ai-context/reference/packages_api.md` 的作用**：这个文件目前已经是一个包的快速参考，但内容相对简单。新方案中提到的“更新中央清单”应明确如何与这个文件结合，是替换还是增强。
        *   **建议**：`ai-context/reference/packages_api.md` 可以作为所有包/模块的**高层索引和概览**，提供每个包的简短描述和指向其详细 `README.md` 或 `DESIGN.md` 的链接。而 `ai-context/shared-components-api/*.md` 则专注于为 AI 提供结构化的 API 细节。

**2. `CLAUDE.md` (我的指令集) 的审视：**

*   **一致性**：我的指令集与您提出的文档化方案是完全一致的。我的核心原则之一就是“**约定**：严格遵守现有项目约定”，以及“**风格与结构**：模仿现有代码的风格、结构、框架选择、类型和架构模式”。这意味着，一旦您采纳并实施了新的文档化方案，我将自动遵循这些新的文档约定。
*   **AI 友好性**：我的指令集明确要求我利用 `search_file_content`、`glob`、`read_file`、`read_many_files` 等工具来理解项目上下文。您提出的 AI 友好文档（`ai-context/packages-api/*.md`）将极大地提高我理解和利用项目代码的效率和准确性。

**3. `ai-context/*` 目录的审视：**

*   **优点**：
    *   **全面性**：`ai-context` 目录已经包含了非常全面的项目信息，包括架构设计、愿景、工作流、历史变更等。这为 AI 提供了丰富的上下文。
    *   **结构化**：目录结构清晰，按主题划分，便于信息检索。
*   **潜在改进点/遗漏**：
    *   **`ai-context/reference/packages_api.md` 的更新**：如前所述，这个文件需要与新的文档化方案明确整合。
    *   **`ai-context/architecture/complete_architecture_design.md` 和 `ai-context/architecture/overview.md`**：这些文档已经提供了高层架构。新的包/模块文档将是这些高层架构的详细实现细节。需要确保这些高层文档能够链接到或引用到新的详细文档。
    *   **`ai-context/core/workflow_and_constraints.md` 的更新**：如前所述，需要明确将新的文档化要求（如 `README.md` 和 AI 友好文档的维护）纳入到开发流程和约束中。

**4. 各个包下的 `*.md` 文件的审视：**

*   **`packages/auth/README.md`**：
    *   **优点**：内容丰富，包含了特性、安装、快速开始、API 参考、高级功能和集成等部分。结构清晰，易于阅读。
    *   **与新方案的契合度**：这个 `README.md` 已经非常接近新方案中 `README.md` 的要求。只需要确保其内容能够被 AI 友好文档（`ai-context/packages-api/auth.md`）有效地提取和结构化。
*   **`modules/console/DESIGN.md`**：
    *   **优点**：非常详细地描述了 `console` 模块的架构、实体、路由、服务、组件、Hooks、导出结构和集成方式。这对于理解一个复杂模块的内部工作原理至关重要。
    *   **与新方案的契合度**：如前所述，这个文件不应该被简单的 `README.md` 替代。它应该作为 `console` 模块的主要设计文档。新方案应明确如何从这种 `DESIGN.md` 中提取 AI 友好信息。

### 4.2. 最佳实践方案

基于以上审视，我提出以下文档管理和生成最佳实践方案，以确保 LinchKit 项目的文档体系既全面、一致，又对人类和 AI 都友好：

**1. 明确文档类型和职责：**

*   **项目级文档 (`ai-context/*`)**：
    *   **`ai-context/architecture/*.md`**：高层架构设计、系统概览、Git 工作流等。
    *   **`ai-context/core/workflow_and_constraints.md`**：开发流程、编码规范、质量控制等。
    *   **`ai-context/history/changelog.md`**：项目级变更日志。
    *   **`ai-context/reference/packages_api.md` (更新)**：作为所有 `packages` 和 `modules` 的**高层索引**。提供每个包/模块的简短描述、核心功能，并链接到其详细文档（`README.md` 或 `DESIGN.md`）。
    *   **`ai-context/library-api/*.md` (新目录，通用命名)**：为 AI 提供的结构化 API 文档。每个文件对应一个 `package` 或 `module`，包含其目的、公共 API 概览（函数、类、类型、Hooks）、依赖和典型使用模式。内容应简洁、精确，便于 AI 解析。

*   **包/模块级文档 (`packages/*/` 和 `modules/*/`)**：
    *   **`packages/*/README.md`**：每个 `package` 的主要文档。包含：
        *   包名、一句话描述。
        *   核心功能、特性。
        *   安装、快速开始、使用示例。
        *   主要 API 概览（简要说明，详细 API 参考链接到自动生成文档或 `ai-context/library-api/*.md`）。
        *   与其他包的关系。
        *   许可证。
    *   **`modules/*/DESIGN.md` (如 `modules/console/DESIGN.md`)**：复杂 `module` 的主要设计文档。包含：
        *   模块的定位、职责边界。
        *   详细的内部架构（分层、组件、数据流）。
        *   实体定义、服务层、路由层、组件层、Hooks 层等详细说明。
        *   导出结构、集成方式。
        *   开发计划、目录结构。
        *   **`modules/*/README.md` (可选，如果存在则作为概览)**：如果 `DESIGN.md` 过于详细，可以有一个简短的 `README.md` 作为模块的高层概览和快速入门，并明确链接到 `DESIGN.md`。
    *   **`CHANGELOG.md` (包/模块级)**：记录该包/模块自身的版本变更。

**2. 自动化与手动维护的平衡：**

*   **自动化生成 API 文档**：强烈建议引入 [TSDoc](https://tsdoc.org/) 或 [TypeDoc](https://typedoc.org/) 等工具，从源代码中的注释自动生成详细的 API 参考文档。这可以大大减轻手动维护的负担，并确保 API 文档的准确性。
*   **手动维护**：
    *   `README.md` 和 `DESIGN.md`：这些文档包含高层概念、使用示例、设计决策等，需要人工编写和维护。
    *   `ai-context/library-api/*.md`：这些文件可以从 `README.md` 或 `DESIGN.md` 中提取核心 API 信息，但需要人工确保其结构化和 AI 友好性。未来可以考虑编写脚本辅助提取。

**3. 整合到开发流程：**

*   **Code Review**：将文档更新作为 Code Review 的强制项。任何代码变更（特别是涉及公共 API 或模块设计）都必须伴随相应的文档更新。
*   **Git Hooks/CI/CD**：在 `pre-commit` 或 CI/CD 流程中加入文档检查，例如：
    *   检查是否存在新的 `export` 但没有对应的 `ai-context/library-api/*.md` 条目。
    *   检查 `README.md` 或 `DESIGN.md` 是否有明显过时或缺失的信息。
*   **Worktree 整合**：明确 Worktree 中临时文档（如 `DESIGN.md`）的生命周期，以及如何将其核心内容整合到永久性的 `packages/*/README.md`、`modules/*/DESIGN.md` 或 `ai-context/library-api/*.md` 中。

**4. AI 友好性强化：**

*   **结构化 Markdown**：在 `ai-context/library-api/*.md` 中使用清晰的 Markdown 标题、列表、代码块，并保持一致的格式。
*   **关键词和标签**：在文档中适当使用关键词和标签，帮助 AI 更好地理解内容。
*   **用例和示例**：提供清晰、简洁的代码示例，展示如何使用包/模块的核心功能。

**5. 持续改进：**

*   **定期审查**：定期（例如，每个季度）审查文档体系，确保其仍然符合项目需求和开发实践。
*   **收集反馈**：从开发者和 AI 助手的实际使用中收集反馈，不断优化文档内容和结构。

---

## 5. 总结交付物

1.  `packages/*` 和 `modules/*` 下的每个包都包含一个内容丰富且格式统一的 `README.md`（或 `DESIGN.md` 作为主要设计文档，`README.md` 作为概览）。
2.  一个新建的 `ai-context/library-api/` 目录，其中包含每个包/模块的、为 AI 优化的 API 描述 Markdown 文件。
3.  一个更新后的 `ai-context/reference/packages_api.md` 文件，作为所有包文档的入口和索引。

这个方案旨在系统性地解决您提出的问题，一旦完成，无论是 AI 还是新加入的开发者，都能快速掌握整个项目架构，从而更高效、更准确地进行开发。
