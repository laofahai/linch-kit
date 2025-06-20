# Linch Kit 核心开发提示词

## 目的

指导 AI 助手按照 Linch Kit 项目的标准流程和最佳实践进行开发工作，确保代码质量、文档同步和项目进度管理。

## 上下文

Linch Kit 是一个 AI-First 的企业级快速开发框架，采用 Monorepo 架构，包含多个核心包和一个 starter 应用。项目遵循严格的开发规范和质量标准。

### 项目状态参考

- **任务优先级**: `ai-context/zh/management/task-priorities.md`
- **当前进度**: `ai-context/zh/management/current-progress.md`
- **工作交接**: `ai-context/zh/management/handover-guide.md`
- **项目概览**: `ai-context/zh/overview/project-overview.md`

## 开发流程指导

### 1. 任务来源和优先级

**严格按照以下顺序执行任务**：

1. **查看任务优先级**: 首先阅读 `ai-context/zh/management/task-priorities.md`
2. **了解当前状态**: 查看 `ai-context/zh/management/current-progress.md`
3. **遵循交接流程**: 按照 `ai-context/zh/management/handover-guide.md` 进行工作

**当前最高优先级任务**：

- 🔥 Starter 应用功能验证 (修复 CLI 问题，实现用户管理)
- 🔴 tRPC 包完善
- 🟡 CRUD UI 包开发

### 2. 开发前准备

```bash
# 1. 确认工作目录
cd /home/laofahai/workspace/linch-kit

# 2. 检查项目状态
pnpm linch --help        # 检查 CLI 基础功能
pnpm linch plugin-list   # 检查插件加载 (当前有问题)

# 3. 查看当前任务
# 阅读 ai-context/zh/management/task-priorities.md
```

### 3. 开发执行流程

#### 步骤 1: 问题分析

- 仔细阅读相关的 ai-context 文档
- 理解问题的根本原因
- 确定解决方案的范围和影响

#### 步骤 2: 代码实现

- 遵循 AI-First 开发原则
- 使用现有的包和工具
- 确保类型安全和测试覆盖

#### 步骤 3: 验证测试

- 运行相关测试用例
- 手动验证功能正确性
- 检查集成是否正常

#### 步骤 4: 文档更新

- 更新相关的用户文档
- 同步 ai-context 文档
- 更新 API 文档

## 开发最佳实践要求

### 1. AI-First 原则

**参考文档**: `ai-context/zh/templates/ai-first-practices.md`

- **类型安全优先**: 所有代码必须有完整的 TypeScript 类型定义
- **清晰的命名**: 使用描述性的变量名和函数名
- **丰富的注释**: 添加 JSDoc 注释和行内注释
- **标准化结构**: 遵循项目的代码组织规范

### 2. 不重复造轮子 ⭐ **最高优先级**

**核心原则**:

- 优先使用现有成熟方案，避免重新发明轮子
- 充分调研现有方案，在选择技术栈前充分调研生态系统
- 优先集成而非自研，通过适配器模式集成现有优秀工具
- 谨慎评估自研需求，只有在现有方案无法满足需求时才考虑自研

**示例决策**:

- ✅ 使用 Prisma 事务系统而非自研 TransactionManager
- ✅ 使用 NextAuth.js 而非自研认证系统
- ✅ 使用 shadcn/ui 而非完全自研 UI 组件库
- ✅ 使用 cls-hooked 实现跨模块事务传播

### 3. Schema 驱动开发

**参考文档**: `ai-context/zh/packages/schema.md`

- 使用 `@linch-kit/schema` 作为单一数据源
- 所有数据模型都基于 Zod Schema 定义
- 自动生成 Prisma Schema、验证器、Mock 数据
- 确保类型安全的端到端开发

### 4. 测试驱动开发

**参考文档**: `ai-context/zh/workflows/testing.md`

- 关键功能必须编写测试用例
- 优先编写单元测试
- 重要功能需要集成测试
- 确保测试覆盖率达到标准

### 5. 包管理原则

**重要**: 始终使用包管理器而非手动编辑配置文件

- JavaScript/Node.js: 使用 `pnpm install/uninstall`
- 不要手动修改 package.json 的依赖部分
- 让包管理器自动解决版本冲突和依赖关系

## 任务完成标准

每个开发任务完成后必须包含以下步骤：

### 1. 代码实现 ✅

- [ ] 功能开发完成
- [ ] 代码通过类型检查
- [ ] 单元测试编写并通过
- [ ] 集成测试验证通过
- [ ] 代码符合项目规范

### 2. 文档更新 📚

- [ ] 更新相关的用户文档
- [ ] 更新 API 文档
- [ ] 添加使用示例
- [ ] 更新 CHANGELOG

### 3. AI 上下文更新 🤖

- [ ] 更新 `ai-context/zh/management/current-progress.md`
- [ ] 更新相关的包文档 (`ai-context/zh/packages/`)
- [ ] 更新架构文档 (如有架构变更)
- [ ] 更新故障排除指南 (如有新问题解决)

### 4. 提示词维护 💡

- [ ] 根据新功能更新相应的提示词
- [ ] 新增必要的提示词文件
- [ ] 确保提示词与实际功能同步

### 5. 进度同步 📊

- [ ] 更新任务状态
- [ ] 记录完成时间
- [ ] 标记下一个优先任务
- [ ] 更新项目里程碑

## 常见问题处理

### CLI 问题

**参考**: `ai-context/zh/reference/troubleshooting.md#cli-问题`

1. 检查插件加载流程
2. 验证配置文件正确性
3. 查看错误日志
4. 重新构建相关包

### 构建问题

**参考**: `ai-context/zh/reference/troubleshooting.md#构建问题`

1. 清理构建缓存: `pnpm clean`
2. 重新安装依赖: `pnpm install`
3. 检查 TypeScript 错误
4. 逐个包构建验证

### 包依赖问题

**参考**: `ai-context/zh/reference/troubleshooting.md#依赖问题`

1. 检查依赖树: `pnpm list`
2. 清理并重新安装
3. 检查版本兼容性
4. 使用 `pnpm update` 更新

## 质量检查清单

### 代码质量

- [ ] TypeScript 严格模式通过
- [ ] ESLint 检查通过
- [ ] Prettier 格式化完成
- [ ] 测试覆盖率达标

### 文档质量

- [ ] 文档内容准确完整
- [ ] 示例代码可运行
- [ ] 链接引用正确
- [ ] 格式规范统一

### 集成质量

- [ ] 包之间集成正常
- [ ] CLI 命令工作正常
- [ ] 配置系统正确
- [ ] 数据库操作正常

---

**使用说明**:

1. 每次开始开发前，先阅读此提示词
2. 严格按照流程和标准执行
3. 完成后逐项检查完成标准
4. 及时更新相关文档和进度

**最后更新**: 2025-06-20  
**适用版本**: Linch Kit v0.x  
**相关文档**: [任务优先级](../../ai-context/zh/management/task-priorities.md) | [开发流程](../../ai-context/zh/workflows/development.md)
