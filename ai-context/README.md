# LinchKit AI 上下文文档

**LinchKit 项目的完整 AI 上下文信息，便于 AI 助手理解项目结构、技术决策和开发流程。**

## 📍 文档位置

**主要文档位于 `zh/` 目录下**，请直接访问：

👉 **[ai-context/zh/README.md](./zh/README.md)** - 完整的 AI 上下文文档

## 🎯 快速导航

### 核心文档 (必读)
- [项目核心信息](./zh/project-core.md) - 项目定位、技术栈、包状态
- [架构设计](./zh/architecture-design.md) - 完整的系统架构和技术决策
- [当前任务](./zh/current-tasks.md) - 当前最高优先级任务
- [开发计划](./zh/development-plan.md) - 完整的开发路线图

### 开发规范 (强制)
- [开发规范](./zh/development-rules.md) - **强制执行的开发标准**
- [国际化规范](./zh/standards/i18n-requirements.md) - 统一 i18n 架构要求
- [UI 组件规范](./zh/standards/ui-component-best-practices.md) - UI 开发最佳实践
- [开发工作流程](./zh/standards/development-workflow.md) - AI-First 开发流程

### 实用工具
- [代码位置索引](./zh/code-locations.md) - 快速定位关键文件和功能
- [继续开发提示词](./zh/continue-prompt.md) - 可复制的 AI 继续开发指令

## 📝 文档结构说明

### 合并完成
- ✅ 根目录和 `zh/` 目录的重复内容已合并
- ✅ 过时和冗余的文件已清理
- ✅ 统一到 `ai-context/zh/` 目录下
- ✅ 信息密度优化，便于 AI 快速检索

### 目录组织
```
ai-context/
├── README.md                    # 本文件 - 导航入口
└── zh/                          # 主要文档目录
    ├── README.md                # 完整的 AI 上下文文档
    ├── project-core.md          # 项目核心信息
    ├── architecture-design.md   # 架构设计
    ├── current-tasks.md         # 当前任务
    ├── development-plan.md      # 开发计划
    ├── development-rules.md     # 开发规范
    ├── code-locations.md        # 代码位置索引
    ├── continue-prompt.md       # 继续开发提示词
    ├── standards/               # 开发标准
    │   ├── i18n-requirements.md
    │   ├── ui-component-best-practices.md
    │   ├── development-workflow.md
    │   ├── schema-data-standards.md
    │   └── security-requirements.md
    ├── architecture/            # 架构文档
    │   ├── ai-integration-architecture.md
    │   ├── plugin-system-design.md
    │   ├── ui-components-architecture.md
    │   └── technical-decisions.md
    └── packages/                # 包文档
        ├── core.md
        └── schema.md
```

## 🎯 使用指南

### 对于 AI 助手
1. **开始阅读**: [zh/README.md](./zh/README.md)
2. **了解项目**: [zh/project-core.md](./zh/project-core.md)
3. **查看任务**: [zh/current-tasks.md](./zh/current-tasks.md)
4. **遵循规范**: [zh/development-rules.md](./zh/development-rules.md)

### 对于开发者
1. **快速上手**: [zh/continue-prompt.md](./zh/continue-prompt.md)
2. **开发规范**: [zh/standards/](./zh/standards/)
3. **架构理解**: [zh/architecture-design.md](./zh/architecture-design.md)

---

**最后更新**: 2025-06-21  
**文档版本**: v3.0 (统一合并版本)  
**重要更新**: 完成根目录和 zh 目录内容合并，统一到 ai-context/zh 目录
