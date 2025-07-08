# LinchKit AI 协作主指南 (AI Collaboration Master Guide)

**版本**: 2.0  
**状态**: 生效中  
**目标**: 为所有 AI 助手提供统一、清晰、无歧义的协作指导

---

## 🎯 核心原则 (Core Principles)

### 1. 人类主导 (Human-Led)

- 最终决策权始终属于人类开发者
- AI 提供建议和执行，不做独立决策

### 2. 透明可预测 (Transparent & Predictable)

- 所有 AI 行为必须可解释和可追溯
- 提前告知将要执行的操作

### 3. 安全第一 (Safety First)

- 绝不执行破坏性操作without确认
- 遵循最小权限原则

### 4. 遵守约定 (Convention Adherence)

- 严格遵循项目既定规范
- 一致性优于个人偏好

---

## 📋 AI 助手行为检查清单 (AI Behavior Checklist)

### 🔴 每个Session开始时 (Session Start)

- [ ] 阅读本主指南
- [ ] 检查 [项目约束](../01_strategy_and_architecture/workflow_and_constraints.md)
- [ ] 了解 [当前状态](../03_planning/roadmap.md)
- [ ] 确认任务范围和目标

### 🟡 任务执行前 (Pre-Task)

- [ ] 分析任务复杂度，判断是否需要 TodoWrite
- [ ] 搜索相关文档和代码上下文
- [ ] 确认功能复用，避免重复实现
- [ ] 制定具体执行计划

### 🟢 任务执行中 (During Task)

- [ ] 遵循 [文档标准](./governance/documentation_standards.md)
- [ ] 遵循 [工作流程](./governance/workflow_procedures.md)
- [ ] 实时更新 Todo 状态
- [ ] 记录重要决策和变更

### 🔵 任务完成后 (Post-Task)

- [ ] 运行质量检查：`bun lint && bun test && bun build`
- [ ] 更新相关文档
- [ ] 标记 Todo 为完成
- [ ] 总结工作成果

---

## 🏗️ 项目架构理解 (Project Architecture Understanding)

### 核心包依赖顺序

```
core → schema → auth → crud → trpc → ui → console
```

### 技术栈核心

- **运行时**: Bun.js (替代 Node.js)
- **语言**: TypeScript 5.8+ (严格模式)
- **框架**: Next.js 15 + React 19
- **数据**: Prisma + PostgreSQL
- **API**: tRPC + Zod Schema
- **样式**: Tailwind CSS v4

### 关键约束

- 禁止使用 `any` 类型，使用 `unknown` 替代
- 测试覆盖率要求：core > 90%, 其他 > 80%
- 构建时间要求：< 10秒
- 强制功能复用，禁止重复实现

---

## 📚 文档体系导航 (Documentation Navigation)

### 🤖 AI协作专区 (此目录)

- **本文档** - 主指南和核心原则
- **[DOCUMENTATION_STANDARDS.md](./governance/DOCUMENTATION_STANDARDS.md)** - 文档标准和格式
- **[WORKFLOW_PROCEDURES.md](./governance/WORKFLOW_PROCEDURES.md)** - 详细工作流程
- **[QUALITY_CONTROL.md](./governance/QUALITY_CONTROL.md)** - 质量控制标准

### 🏗️ 架构与约束

- **[workflow_and_constraints.md](../01_strategy_and_architecture/workflow_and_constraints.md)** - 开发约束规范
- **[vision_and_scope.md](../01_strategy_and_architecture/vision_and_scope.md)** - 项目愿景
- **[complete_architecture_design.md](../01_strategy_and_architecture/complete_architecture_design.md)** - 完整架构设计

### 📚 知识库

- **[packages_api.md](../02_knowledge_base/packages_api.md)** - 包API索引
- **[library_api/](../02_knowledge_base/library_api/)** - 详细API文档

### 📈 项目规划

- **[roadmap.md](../03_planning/roadmap.md)** - 功能路线图
- **[development-status.md](../03_planning/development-status.md)** - 开发状态

---

## ⚡ 快速决策树 (Quick Decision Tree)

### 遇到代码问题时

```
1. 是否已有解决方案？ → 搜索 library_api/ 和现有代码
2. 是否需要新功能？ → 检查是否可复用现有包功能
3. 是否需要测试？ → 所有新功能都需要测试
4. 是否需要文档？ → 公共API变更都需要文档更新
```

### 遇到文档问题时

```
1. 确定文档类型 → API文档/设计文档/用户文档
2. 选择正确位置 → 参考文档标准
3. 遵循模板格式 → 使用标准化模板
4. 标记AI辅助 → 按治理规范标记
```

### 遇到冲突时

```
1. 人类指令 > AI判断
2. 明确约束 > 隐含推测
3. 项目规范 > 通用最佳实践
4. 安全保守 > 激进优化
```

---

## 🚨 禁止行为 (Prohibited Actions)

### 🔴 绝对禁止

- 直接推送到主分支without PR
- 使用 `any` 类型代替 `unknown`
- 忽略 ESLint 错误而不是修复
- 重复实现已有包功能
- 省略测试for新功能

### 🟡 需要确认

- 创建新的包或模块
- 修改核心架构设计
- 删除现有功能或文件
- 更改外部依赖版本

### 🟢 鼓励行为

- 主动搜索和复用现有功能
- 提供详细的变更说明
- 编写高质量测试
- 更新相关文档
- 使用 TodoWrite 规划复杂任务

---

## 📊 成功指标 (Success Metrics)

### 定量指标

- [ ] 测试覆盖率达标 (core>90%, 其他>80%)
- [ ] 构建时间 < 10秒
- [ ] ESLint 零错误
- [ ] TypeScript 严格模式零错误

### 定性指标

- [ ] 代码符合项目风格和约定
- [ ] 功能正确实现用户需求
- [ ] 文档清晰且及时更新
- [ ] 变更不破坏现有功能

---

## 🔗 相关资源 (Related Resources)

### 内部链接

- [主文档目录](../README.md)
- [项目根README](../../README.md)
- [包开发指南](../../CLAUDE.md)

### 外部参考

- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Next.js 文档](https://nextjs.org/docs)
- [Bun 文档](https://bun.sh/docs)

---

## 📝 变更日志 (Change Log)

| 版本 | 日期       | 变更说明                 |
| ---- | ---------- | ------------------------ |
| 2.0  | 2025-07-05 | 重构整合，消除冲突和重复 |
| 1.0  | 2025-01-05 | 初始版本                 |

---

## 🆘 问题解决 (Problem Resolution)

当遇到本指南未覆盖的问题时：

1. **参考具体规范** - 查阅 governance/ 子目录下的专项规范
2. **搜索项目历史** - 查看 git history 和 issue 记录
3. **保守处理** - 选择最安全的方案
4. **寻求确认** - 向人类开发者寻求指导

---

**AI-Assisted**: true  
**整合来源**: AI_COLLABORATION_FRAMEWORK.md, KNOWLEDGE_BASE_GOVERNANCE.md, UNIFIED_AI_ENHANCEMENT_AND_DOCUMENTATION_ROADMAP.md, TEMP_DOCUMENTATION_PLAN.md
