# AI Workflow 重构计划

**记录时间**: 2025-07-22  
**当前状态**: 系统部分可用，需要修复和优化

## 📊 系统现状评估

### 1. 核心问题
- **Graph RAG 查询失败**: `WorkflowState` 导入错误
- **过度复杂**: 25个脚本，36个命令
- **抽象概念过多**: Evolution Engine、Meta Learner、Decision Council
- **测试覆盖不足**: 关键功能测试失败（9/20）

### 2. 有价值的组件
- ✅ **deps:check** - 包复用检查（实际工作）
- ✅ **ArchWarden** - 架构合规性检查
- ✅ **七状态工作流** - 结构化开发流程
- ✅ **Graph RAG 概念** - 代码关系理解（需要修复）

### 3. 使用数据
- 235次 AI 命令引用（大部分在文档中）
- 实际常用：`ai:session query`、`deps:check`
- Claude Code Hooks 已配置但与 AI Workflow 未集成

## 🎯 调整方案：Hooks + AI Workflow 集成

### Phase 1: 修复核心功能（1-2天）

#### 1.1 修复 Graph RAG
```bash
# 修复导入问题
- 解决 WorkflowState 导入错误
- 使用 Mock Neo4j 进行本地开发
- 提供降级方案（本地文件搜索）
```

#### 1.2 精简脚本
```bash
# 保留核心功能
ai:deps          # 包复用检查
ai:arch          # 架构检查
ai:context       # 上下文分析
ai:test-gen      # 测试生成

# 删除抽象概念
- Evolution Engine
- Meta Learner  
- Decision Council
- QA Synthesizer（除非实现测试生成）
```

### Phase 2: Claude Code Hooks 深度集成（2-3天）

#### 2.1 Hook 触发点设计

**PreToolUse Hooks**：
```javascript
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bun run ai:context analyze --file=\"${tool_params.file_path}\""
          },
          {
            "type": "command", 
            "command": "bun run ai:deps check --file=\"${tool_params.file_path}\""
          }
        ]
      }
    ]
  }
}
```

**功能**：
- 文件编辑前自动分析上下文
- 检查是否有现有实现可复用
- 提供架构模式建议

**PostToolUse Hooks**：
```javascript
{
  "PostToolUse": [
    {
      "matcher": "Edit|MultiEdit|Write", 
      "hooks": [
        {
          "type": "command",
          "command": "bun run ai:arch verify --file=\"${tool_params.file_path}\""
        },
        {
          "type": "command",
          "command": "bun run ai:test-gen suggest --file=\"${tool_params.file_path}\""
        }
      ]
    }
  ]
}
```

**功能**：
- 架构合规性验证
- 自动建议需要的测试
- 质量检查报告

#### 2.2 新增 Hook 类型

**WorkflowStateChange Hook**（新增）：
```javascript
{
  "WorkflowStateChange": [
    {
      "matcher": "IMPLEMENT->TEST",
      "hooks": [
        {
          "type": "command",
          "command": "bun run ai:test-gen create --auto"
        }
      ]
    }
  ]
}
```

### Phase 3: 简化 /start 命令（1天）

#### 3.1 新的 /start 流程

```typescript
// 简化后的 /start 命令处理
async function handleStart(taskDescription: string) {
  // 1. 快速初始化
  await runCommand('ai:init', { task: taskDescription })
  
  // 2. 智能分析（如果 Graph RAG 可用）
  const context = await runCommand('ai:context', { 
    query: taskDescription,
    fallback: 'local' // 降级到本地搜索
  })
  
  // 3. 返回简洁的行动计划
  return {
    task: taskDescription,
    context: context.summary,
    suggestions: context.patterns,
    workflow: 'INIT->ANALYZE->IMPLEMENT->TEST->COMPLETE'
  }
}
```

#### 3.2 /start 命令定义
```markdown
# .claude/commands/start.md

当用户输入 /start "任务描述" 时：

1. 运行 `bun run ai:init --task="任务描述"`
2. 如果可用，运行 `bun run ai:context analyze --query="任务描述"`
3. 显示简化的工作流程（5个状态而不是7个）
4. 激活相关的 Hooks
```

### Phase 4: 重构 CLAUDE.md（1天）

#### 4.1 新的结构

```markdown
# Claude AI 开发助手指令

## 🎯 核心原则（3条）
1. **智能复用** - 使用 AI 工具查找现有实现
2. **架构一致** - 遵循 L0-L3 分层架构
3. **质量保证** - 自动测试和架构验证

## 🪝 自动化工作流
- 文件操作前：自动上下文分析 + 复用检查
- 文件操作后：架构验证 + 测试建议
- 状态转换时：自动触发相应动作

## 🚀 快速开始
```
/start "任务描述"  # 初始化 + 分析 + 建议
```

## 🛠️ 可用工具
- `ai:deps` - 查找可复用的包
- `ai:arch` - 验证架构合规性
- `ai:context` - 分析项目上下文
- `ai:test-gen` - 生成测试建议
```

## 📋 实施优先级

1. **立即执行**：
   - 修复 Graph RAG 导入问题
   - 创建 `.claude/commands/start.md`

2. **本周完成**：
   - 精简脚本到 4-5 个核心功能
   - 更新 Hooks 配置集成 AI 工具

3. **下周完成**：
   - 实现测试生成功能
   - 优化工作流状态机
   - 更新所有文档

## 🔄 迁移策略

### 保留并改进
- Graph RAG（修复后）
- 架构检查
- 包复用检查
- 基础 Guardian 概念

### 删除或合并
- Evolution Engine
- Meta Learner
- Decision Council
- 重复的脚本命令

### 新增功能
- Hook 驱动的自动化
- 降级机制（Graph RAG 失败时）
- 简化的状态管理

## 📊 成功指标

1. **功能可用性**：
   - Graph RAG 查询成功率 > 90%
   - 所有核心命令正常工作

2. **开发体验**：
   - /start 命令响应时间 < 3秒
   - Hooks 触发成功率 100%

3. **代码质量**：
   - 架构违规减少 > 80%
   - 包复用率提升 > 50%

---

**下一步行动**：
1. 修复 WorkflowState 导入问题
2. 创建 /start 命令文件
3. 更新 Hooks 配置