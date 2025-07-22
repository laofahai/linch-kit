# Start Command - AI 工作流初始化

当用户使用 `/start "任务描述"` 时，执行以下操作：

## 🚀 执行流程

```bash
# 1. 快速环境检查和初始化
bun run ai:init --task="{{task_description}}"

# 2. 智能上下文分析（带降级机制）  
bun run ai:context analyze --query="{{task_description}}" --fallback=local

# 3. 包复用检查
bun run ai:deps check --keywords="{{task_description}}"

# 4. 架构建议
bun run ai:arch suggest --context="{{task_description}}"
```

## 📋 输出格式

```
🎯 任务分析: {{task_description}}

📦 发现可复用组件:
- @linch-kit/auth (认证相关)
- @linch-kit/ui (UI组件)

🏗️ 架构建议:
- 遵循 L2 UI 层开发模式
- 使用现有的 React 组件库

🪝 Hooks 已激活:
- PreToolUse: 文件操作前上下文注入
- PostToolUse: 质量检查和测试建议

🔄 工作流状态: INIT → 准备开始开发
```

## ⚙️ 配置参数

- `--fast`: 跳过详细分析，快速启动
- `--no-hooks`: 禁用自动 Hooks（调试用）
- `--workflow=simple`: 使用简化的 3 状态工作流

## 🔗 与 Hooks 的集成

此命令执行后，以下 Hooks 将自动激活：

1. **PreToolUse Hooks**: 每次编辑文件前提供上下文
2. **PostToolUse Hooks**: 每次编辑后验证质量
3. **WorkflowState Hooks**: 状态转换时的自动动作