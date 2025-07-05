# AI Context 文档导航中心

## 🎯 AI 助手快速启动指南

**LinchKit AI 助手必读**：本目录是 AI 快速开发的知识中心。每个 Session 开始时必须按顺序阅读关键文档。

### 📋 Session 启动检查清单
1. **🤖 AI协作规范** - **必读** [00_ai_collaboration/](./00_ai_collaboration/) AI协作框架和治理规范
2. **📖 导航理解** - 阅读本 README.md 了解文档结构
3. **🔍 上下文索引** - 查阅 [manifest.json](./manifest.json) 快速定位相关文档
4. **🛠️ 工作流程** - **必读** [01_strategy_and_architecture/workflow_and_constraints.md](./01_strategy_and_architecture/workflow_and_constraints.md)
5. **📈 当前状态** - 查看 [03_planning/roadmap.md](./03_planning/roadmap.md) 了解进行中任务
6. **📜 项目愿景** - 参考 [01_strategy_and_architecture/vision_and_scope.md](./01_strategy_and_architecture/vision_and_scope.md)

## 📚 核心文档结构

### 🎯 优化后的分层架构

基于 **AI-Context 优化维护方案 v2.0**，文档结构采用分层管理模式：

```
ai-context/
├── 📋 manifest.json                  # 元数据索引 (AI自动生成)
├── 🤖 00_ai_collaboration/          # AI协作与文档治理 (新增)
│   ├── README.md                    # 协作中心入口
│   ├── AI_COLLABORATION_FRAMEWORK.md # AI行为准则
│   ├── KNOWLEDGE_BASE_GOVERNANCE.md  # 知识库治理
│   ├── UNIFIED_AI_ENHANCEMENT_AND_DOCUMENTATION_ROADMAP.md
│   └── TEMP_DOCUMENTATION_PLAN.md   # 文档化方案
├── 🎯 00_framework/                 # 核心框架 (保留)
├── 🏗️ 01_strategy_and_architecture/ # 战略与架构设计
│   ├── vision_and_scope.md          # 项目愿景和范围
│   ├── workflow_and_constraints.md  # 开发约束规范
│   ├── overview.md                 # 架构总览
│   ├── core_packages.md           # 核心包设计
│   └── git_workflow.md            # Git工作流程
├── 📚 02_knowledge_base/           # 知识库
│   ├── packages_api.md            # 包API索引
│   ├── library_api/               # API文档目录
│   └── [package]-completeness-report.md
├── 📈 03_planning/                 # 项目规划
│   ├── roadmap.md                 # 功能路线图
│   └── development-status.md      # 开发状态
├── 📝 04_archive/                  # 历史归档
└── 🔧 tools/                       # 自动化工具
    ├── scripts/                   # 自动化脚本
    ├── templates/                 # 文档模板
    └── validators/                # 验证工具
```

详见：[AI-Context 优化维护方案](./ai-context-optimization-plan.md)

## 📚 核心文档结构

### 🎯 必读文档 (每个Session必须阅读)

| 文档 | 职责 | AI使用时机 |
|------|------|-----------|
| **[core/vision_and_scope.md](./core/vision_and_scope.md)** | 项目愿景、目标、核心价值 | 理解项目背景和目标 |
| **[core/workflow_and_constraints.md](./core/workflow_and_constraints.md)** | 🔴**开发约束、技术规范、AI协作规则** | **每次编码前必读** |
| **[roadmap/roadmap.md](./roadmap/roadmap.md)** | 当前任务、未来计划、优先级 | 开始新任务前查看 |
| **[history/changelog.md](./history/changelog.md)** | 已完成功能、重要变更记录 | 了解项目进展历史 |

### 🏗️ 架构设计文档

**统一架构设计中心**: [architecture/](./architecture/)

| 文档 | 内容 | 使用场景 |
|------|------|---------|
| **[architecture/overview.md](./architecture/overview.md)** | 架构总览、核心原则 | 理解整体架构设计 |
| **[architecture/core_packages.md](./architecture/core_packages.md)** | 核心包设计、依赖关系 | 包开发和集成时查阅 |
| **[architecture/cli_and_tools.md](./architecture/cli_and_tools.md)** | CLI工具、支撑系统设计 | CLI相关开发 |
| **[architecture/git_workflow.md](./architecture/git_workflow.md)** | Git工作流、分支策略 | 代码提交和分支管理 |

### 📚 参考资料

| 目录/文件 | 内容 | 使用时机 |
|-----------|------|---------|
| **[reference/packages_api.md](./reference/packages_api.md)** | 包API详细参考 | 查询具体API用法 |
| **[history/](./history/)** | 历史文档归档 | 需要查看历史决策时 |

## 🤖 AI 开发工作流程

### 📖 标准开发流程
1. **文档导航** → 阅读本 `README.md` 了解文档结构
2. **理解愿景** → 快速浏览 `core/vision_and_scope.md` 了解项目目标  
3. **掌握架构** → 参考 `architecture/` 理解系统设计
4. **遵循规范** → **必读** `core/workflow_and_constraints.md` 中的约束
5. **了解现状** → 查看 `roadmap/roadmap.md` 了解当前进度
6. **规划任务** → 使用 TodoWrite 工具制定详细任务计划
7. **实施开发** → 严格遵循架构和约束
8. **验证结果** → 运行测试和构建
9. **更新文档** → 记录进度和变更

### ⚠️ 关键提醒

#### 🔴 强制约束检查
- **开发前必读**: [core/workflow_and_constraints.md](./core/workflow_and_constraints.md)
- **架构依赖**: core → schema → auth → crud → trpc → ui → console
- **包功能复用**: 必须使用 LinchKit 内部包功能
- **质量标准**: 测试覆盖率 >80% (core >90%)

#### 📋 任务管理强制要求
- **复杂任务**: 3步以上必须使用 TodoWrite 创建待办清单
- **单一进行**: 同时只能有一个任务标记为 in_progress
- **实时更新**: 开始任务立即标记 in_progress
- **及时完成**: 任务完成立即标记 completed

#### 🔄 文档维护规则
- **单一信息源**: 避免重复信息，使用MD链接引用
- **实时更新**: 完成功能后立即更新 `history/changelog.md`
- **架构变更**: 修改架构时更新 `architecture/`
- **约束变更**: 新约束添加到 `core/workflow_and_constraints.md`


## 🎯 文档管理约束

### 📝 文档更新规则
1. **功能完成** → 更新 `history/changelog.md`
2. **架构变更** → 更新 `architecture/` 相关文档
3. **新约束** → 添加到 `core/workflow_and_constraints.md`
4. **计划调整** → 更新 `roadmap/roadmap.md`
5. **重大决策** → 记录在相关架构文档中

### 🔗 链接使用规范
- **内部引用**: 优先使用 MD 链接 `[文档名](./path/file.md)`
- **避免重复**: 不要复制粘贴内容，使用链接引用
- **保持同步**: 链接目标变更时同步更新引用

### ⚠️ 信息完整性保证
- **不丢失信息**: 所有重要信息都已迁移到新结构
- **历史保留**: 旧文档移至 `history/` 目录
- **持续维护**: AI 助手负责保持文档同步和更新

## 🚀 快速查找指南

### 寻找开发约束和规范
→ [core/workflow_and_constraints.md](./core/workflow_and_constraints.md)

### 寻找架构设计信息  
→ [architecture/](./architecture/)

### 寻找当前任务和计划
→ [roadmap/roadmap.md](./roadmap/roadmap.md)

### 寻找已完成功能
→ [history/changelog.md](./history/changelog.md)

### 寻找包API用法
→ [reference/packages_api.md](./reference/packages_api.md)

### 寻找历史决策
→ [history/](./history/)

---

*本文档结构专为 AI 开发助手优化，确保高效、准确的知识获取和任务执行。*