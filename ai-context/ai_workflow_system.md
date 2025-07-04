# LinchKit AI 驱动工作流系统 - 完整架构文档

**版本**: Phase 1 MVP (v1.0)  
**状态**: ✅ 生产就绪  
**更新时间**: 2025-07-04

## 🎯 系统概述

LinchKit AI 驱动工作流系统是一个完全自动化的开发工作流引擎，实现了"用户只需自然语言，AI自动完成所有开发工作"的核心目标。

### 核心特性

- **🧠 自然语言理解**: 智能解析用户需求，自动识别任务类型和涉及的包
- **🤖 AI 协商机制**: 集成 Gemini 协商，处理复杂任务的技术决策
- **⚙️ 智能执行引擎**: 支持 Git 和 Shell 任务的自动化执行
- **🛡️ 环境约束集成**: 强制执行所有 LinchKit 开发规范
- **🔄 连续自动化**: 智能文件管理，支持无限次连续工作流执行

## 📁 系统架构

### 目录结构

```
.devcontainer/workflow-mvp/
├── scripts/
│   ├── ai-workflow-generator.sh    # AI 工作流生成器 (核心入口)
│   ├── create-task.sh              # 手动任务创建工具
│   └── run-workflow.sh             # 工作流执行工具
├── engine.sh                       # 核心执行引擎
├── tasks/                          # 工作流配置存储
├── state/                          # 执行状态跟踪
├── ai-templates/                   # AI 模板库
└── worktrees/                      # 并行开发工作树
```

### 核心组件

#### 1. AI 工作流生成器 (`ai-workflow-generator.sh`)

**功能**: 从自然语言生成完整的工作流配置

**核心函数**:
- `enforce_environment_constraints()`: 智能环境约束检查
- `parse_natural_language_task()`: 自然语言解析
- `consult_with_gemini()`: Gemini 协商机制
- `generate_workflow_from_analysis()`: 工作流生成

**支持的任务类型**:
```bash
authentication  # 认证相关 → @linchkit/auth
crud            # 数据操作 → @linchkit/crud + @linchkit/schema  
ui              # UI组件 → @linchkit/ui
api             # API开发 → @linchkit/trpc
testing         # 测试任务 → 全包测试
refactor        # 重构任务 → 触发 Gemini 协商
general         # 通用任务 → 完整构建验证
```

#### 2. 核心执行引擎 (`engine.sh`)

**功能**: 任务执行、依赖管理、状态跟踪

**核心函数**:
- `execute_workflow()`: 工作流执行控制
- `execute_task()`: 单任务执行
- `execute_git_task()` / `execute_shell_task()`: 任务类型处理
- `check_dependencies_satisfied()`: 依赖检查

**自动化级别**:
```bash
safe        # 交互模式，需要用户确认
moderate    # 适度自动化，安全默认响应
dangerous   # 完全自动化，自动接受所有提示
```

#### 3. 智能环境管理系统

**功能**: 解决连续工作流执行的环境约束矛盾

**核心特性**:
- **智能文件识别**: 自动区分工作流生成文件 vs 用户修改文件
- **多种处理策略**: 自动提交、暂存、清理等选项
- **连续执行支持**: 无需手动干预的连续工作流

**文件识别模式**:
```bash
# 工作流生成文件模式
tasks/ai-generated-*
state/*.state.json
worktrees/*
*.log, *.tmp
SESSION_PROGRESS.md
NEXT_SESSION_PROMPT.md
```

## 🚀 使用指南

### 基本使用方式

```bash
# 切换到工作流目录
cd .devcontainer/workflow-mvp

# 使用自然语言描述需求
./scripts/ai-workflow-generator.sh "你的开发需求"
```

### 典型使用场景

#### 1. 认证功能开发
```bash
./scripts/ai-workflow-generator.sh "为用户模块添加 JWT 认证支持"
```

#### 2. CRUD 功能开发
```bash
./scripts/ai-workflow-generator.sh "创建用户管理的数据表格组件，支持增删改查"
```

#### 3. API 重构
```bash
./scripts/ai-workflow-generator.sh "重构用户 API，添加批量操作和搜索功能"
```

#### 4. 测试开发
```bash
./scripts/ai-workflow-generator.sh "为用户模块编写单元测试"
```

### 高级功能

#### Gemini 协商模式
对于复杂任务，系统会自动启用 Gemini 协商机制：
- 重构任务 (complexity: high)
- 通用任务 (requires_gemini: true)
- 用户明确要求协商的任务

#### 自动化级别控制
系统会根据任务类型自动选择合适的自动化级别：
- 测试任务 → moderate
- 高复杂度任务 → safe
- 其他任务 → moderate

## 🛡️ 安全和约束

### 强制性 LinchKit 约束

系统强制执行以下约束：
1. **TypeScript 严格模式**: 禁止使用 `any` 类型
2. **包管理规范**: 仅使用 bun 包管理器
3. **架构依赖顺序**: core → schema → auth → crud → trpc → ui → console
4. **测试覆盖率**: core > 90%, 其他 > 80%
5. **分支安全检查**: 禁止在 main/master/develop 分支工作

### 环境安全检查

- **依赖检查**: 自动验证 bun、jq、git 等必要工具
- **分支保护**: 自动创建功能分支，保护主分支安全
- **工作目录管理**: 智能处理未提交更改，支持多种处理策略

## 📊 监控和故障处理

### 执行状态跟踪

工作流执行状态保存在 `state/` 目录：
```json
{
  "workflow_id": "工作流ID",
  "status": "running|completed|failed",
  "tasks": {
    "task_id": {
      "status": "pending|running|completed|failed",
      "start_time": "开始时间",
      "end_time": "结束时间"
    }
  }
}
```

### AI 故障分析

系统提供智能故障分析功能：
- **测试失败**: 检查测试用例或更新快照
- **构建失败**: 检查 TypeScript 类型错误或依赖问题  
- **代码质量**: 运行 `bun run lint:fix` 自动修复
- **通用错误**: 查看详细错误日志进行诊断

### 进度报告

系统自动生成详细的进度报告：
- 任务完成情况统计
- 失败任务分析和建议
- LinchKit 约束遵守情况
- 性能指标记录

## 🔧 配置和扩展

### 工作流配置格式

```json
{
  "workflow": {
    "id": "工作流唯一标识",
    "description": "工作流描述",
    "ai_generated": true,
    "automation_level": "safe|moderate|dangerous",
    "tasks": [
      {
        "id": "任务ID",
        "type": "git|shell",
        "command": "执行命令",
        "depends_on": ["依赖的任务ID"],
        "linchkit_constraint": "约束描述"
      }
    ]
  }
}
```

### 扩展新任务类型

在 `generate_workflow_from_analysis()` 函数中添加新的任务类型：

```bash
case "$task_type" in
    "new_task_type")
        tasks_json=$(generate_new_task_type_tasks "$scope")
        ;;
esac
```

## 📈 性能和可靠性

### 性能优化

- **并行执行**: 利用 DAG 依赖图实现任务并行执行
- **幂等性**: 支持中断恢复，避免重复执行已完成任务
- **工作树隔离**: 使用 Git worktree 实现真正的并行开发

### 可靠性保障

- **状态持久化**: 所有执行状态持久化存储
- **错误恢复**: 智能错误分析和恢复建议
- **超时保护**: 防止任务无限期执行
- **依赖验证**: 严格的依赖检查和验证

## 🎯 最佳实践

### 任务描述规范

使用清晰、具体的自然语言描述：
- ✅ "为用户模块添加 JWT 认证和权限控制"
- ✅ "创建支持增删改查的用户管理表格组件"
- ❌ "改一下用户功能" (太模糊)
- ❌ "优化系统" (缺乏具体性)

### 监控建议

1. **定期检查状态文件**: 监控 `state/` 目录中的执行状态
2. **关注错误日志**: 及时处理失败的任务
3. **验证约束遵守**: 确保所有 LinchKit 约束得到正确执行
4. **性能监控**: 关注任务执行时间和资源使用

### 故障排除流程

1. **查看状态文件**: 确定失败的具体任务
2. **分析错误信息**: 利用 AI 故障分析功能
3. **手动修复**: 根据建议进行手动修复
4. **重新执行**: 使用 `./scripts/run-workflow.sh` 重新执行

## 🚀 Phase 2 扩展计划

基于当前完善的基础，Phase 2 将focus on：

1. **AI 能力增强**: 更智能的需求理解和技术决策
2. **复杂场景支持**: 支持多模块、跨包的复杂开发任务
3. **实时协作**: 支持多人协作的 AI 工作流
4. **性能优化**: 进一步优化执行效率和资源使用

---

**LinchKit AI 工作流系统代表了 AI-First 开发框架的重大突破，真正实现了自然语言驱动的端到端自动化开发！** 🚀