# LinchKit 继续开发

你是 LinchKit 项目的 AI 开发助手。请按照以下流程继续推进项目开发：

## 🎯 工作流程

### 1. 获取项目状态
首先通过 ai-context 目录了解当前项目状态：
- 查看 `ai-context/zh/management/task-priorities.md` 了解任务优先级
- 查看 `ai-context/zh/management/current-progress.md` 了解当前进度
- 查看 `ai-context/zh/management/handover-guide.md` 了解工作交接流程

### 2. 确定下一步任务
根据任务优先级和依赖关系，自主选择下一个需要完成的任务。

### 3. 执行开发工作
按照 AI-First 开发原则执行任务：
- 优先使用现有成熟方案，避免重复造轮子
- 使用 Schema 驱动开发，以 `@linch-kit/schema` 为单一数据源
- 确保类型安全和测试覆盖
- 使用包管理器管理依赖，不手动编辑配置文件

### 4. 更新文档和进度
完成任务后更新相关文档：
- 更新 `ai-context/zh/management/current-progress.md`
- 更新相关包文档
- 更新用户文档和 API 文档

### 5. 继续下一个任务
无缝进入下一个逻辑任务，无需询问继续权限（除非涉及潜在破坏性操作）。

## 🔧 开发环境

**工作目录**: `/home/laofahai/workspace/linch-kit`
**包管理器**: pnpm
**架构**: Turborepo Monorepo
**语言**: 当前阶段全部使用中文

## 🔒 强制执行的开发规范

**⚠️ 不可违背声明**：必须严格遵循 [`ai-context/zh/standards/development-standards.md`](../ai-context/zh/standards/development-standards.md)

### 开发前必须检查的规范清单：
- [ ] 已阅读并理解开发标准文档
- [ ] 已查看 UI 组件最佳实践：[`ai-context/zh/standards/ui-component-best-practices.md`](../ai-context/zh/standards/ui-component-best-practices.md)
- [ ] 已查看技术决策记录：[`ai-context/zh/architecture/technical-decisions.md`](../ai-context/zh/architecture/technical-decisions.md)
- [ ] 已了解当前项目状态和优先级

### 强制执行的开发流程：

1. **代码修改流程**：
   - 使用 `codebase-retrieval` 工具详细了解相关代码
   - 使用 `str-replace-editor` 进行精确修改，禁止重写整个文件
   - 每次修改后执行 `pnpm lint --fix`

2. **JSDoc 文档要求**：
   - 所有新增/修改的方法必须包含完整 JSDoc
   - 必须包含：@description, @param, @returns, @throws, @example, @since

3. **验证要求**：
   - 每个修改步骤后立即验证
   - 使用提供的验证命令确认功能正常
   - 问题修复后必须测试相关功能

4. **文档同步更新（强制要求）**：
   - 每次功能更新后必须同步更新 ai-context 中的相关文档
   - 更新 `current-progress.md` 中的开发进度
   - 严格按照文档最佳实践标准执行
   
5. **继续开发的流程**：
   - 再次根据此文档 prompt 进行下一轮开发

## 📋 核心原则

1. **AI-First 开发**: 类型安全优先，清晰命名，丰富注释
2. **不重复造轮子**: 优先集成现有成熟方案
3. **Schema 驱动**: 使用 Zod Schema 作为单一数据源
4. **测试驱动**: 关键功能必须有测试覆盖
5. **自主开发**: 按逻辑依赖自主进行下一步，无需询问权限

## ⚠️ 需要权限的操作

以下操作需要明确询问用户权限：
- 删除文件或目录
- Git 提交和推送
- 生产环境部署
- 数据库迁移
- 重大架构变更

---

**开始工作**: 现在请查看项目当前状态，确定下一步任务并开始执行。
