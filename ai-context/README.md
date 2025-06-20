# Linch Kit AI 上下文文档

> **📢 重要更新**: 本目录已完成重构，采用语言分离的组织结构，提升 AI 理解和检索效率。

这个目录包含了 Linch Kit 项目的完整 AI 上下文信息，用于帮助 AI 助手理解项目结构、技术决策和开发流程。

## 🌐 语言版本

### 🇨🇳 中文版本 (主要版本)

- **路径**: [zh/](./zh/)
- **状态**: ✅ 完整可用
- **内容**: 完整的项目文档、架构设计、开发指南
- **维护**: 实时更新

### 🇺🇸 英文版本 (规划中)

- **路径**: [en/](./en/)
- **状态**: 📋 待开发
- **内容**: 英文版本的项目文档
- **维护**: 后续开发

## 🎯 快速开始

### 对于 AI 助手

1. **立即开始**: 阅读 [中文版主导航](./zh/README.md)
2. **项目理解**: 查看 [项目总览](./zh/overview/project-overview.md)
3. **当前任务**: 查看 [工作交接指南](./zh/management/handover-guide.md)
4. **任务优先级**: 查看 [任务优先级](./zh/management/task-priorities.md)

### 对于开发者

1. **快速上手**: 阅读 [快速开始指南](./zh/overview/quick-start.md)
2. **系统架构**: 了解 [系统架构](./zh/architecture/system-architecture.md)
3. **开发流程**: 遵循 [开发流程](./zh/workflows/development.md)
4. **当前进度**: 查看 [当前进度](./zh/management/current-progress.md)

## 📁 重构后的目录结构

```
ai-context/
├── zh/                     # 中文版本 (主要版本)
│   ├── README.md          # 中文版主导航
│   ├── overview/          # 项目概览
│   │   ├── project-overview.md
│   │   ├── quick-start.md
│   │   └── value-proposition.md
│   ├── architecture/      # 系统架构
│   │   ├── system-architecture.md
│   │   ├── tech-stack.md
│   │   └── package-dependencies.md
│   ├── packages/          # 核心包文档
│   │   ├── core.md
│   │   ├── schema.md
│   │   └── ...
│   ├── workflows/         # 工作流程
│   │   ├── development.md
│   │   ├── testing.md
│   │   └── release.md
│   ├── decisions/         # 技术决策
│   │   ├── architecture-decisions.md
│   │   └── technology-choices.md
│   ├── management/        # 项目管理
│   │   ├── roadmap.md
│   │   ├── current-progress.md
│   │   ├── task-priorities.md
│   │   └── handover-guide.md
│   ├── reference/         # 参考资料
│   │   ├── commands.md
│   │   ├── configuration.md
│   │   └── troubleshooting.md
│   └── templates/         # 开发模板
│       ├── ai-first-practices.md
│       └── code-generation.md
├── en/                     # 英文版本 (规划中)
└── README.md              # 主导航 (本文件)
```

## 🔄 重构改进

### ✅ 已完成的改进

1. **语言分离**: 中文和英文版本独立维护
2. **结构优化**: 按功能和用途重新组织文档
3. **时间管理优化**: 移除相对时间表述，采用任务优先级和依赖关系
4. **内容整合**: 合并重复文档，删除过时信息
5. **导航优化**: 创建清晰的导航和索引系统

### 📋 待完成的改进

1. **英文版本**: 创建英文版本的文档
2. **自动化**: 建立文档自动更新机制
3. **索引优化**: 进一步优化搜索和检索

## 📝 文档维护原则

1. **及时更新**: 代码变更后及时更新相关文档
2. **简洁明了**: 重点记录关键信息，避免冗余
3. **结构化**: 使用统一的格式和结构
4. **面向 AI**: 文档应该便于 AI 理解和处理
5. **任务导向**: 使用任务优先级和依赖关系组织内容，避免相对时间表述
6. **语言分离**: 中文和英文版本独立维护，确保内容准确性

## 🔗 相关链接

- **中文版本**: [zh/README.md](./zh/README.md) - 完整的中文文档
- **用户文档**: [../docs/README.md](../docs/README.md) - 面向用户的文档
- **项目主页**: [../README.md](../README.md) - 项目主页
- **包级文档**: [../packages/](../packages/) - 各包详细文档

---

**重构版本**: v2.0
**最后更新**: 2025-06-20
**维护责任**: AI Assistant + 开发团队
