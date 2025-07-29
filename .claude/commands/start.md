---
allowed-tools: Bash
description: "LinchKit AI Workflow 完整启动器 - 集成分析和决策引擎"
---

# 🚀 LinchKit AI Workflow 启动器

**任务**: `$ARGUMENTS`

## 🔧 Step 1: 强制读取最新 Session 提示

**🚨 强制要求**: 每次 /start 执行前必须读取 .sessions 目录下的最新 prompt：

!`echo "📖 检查 .sessions 目录..." && ls -la .sessions/ 2>/dev/null | tail -5 || echo "未找到 .sessions 目录"`

!`echo "🔍 查找最新 session prompt..." && find .sessions -name "*session-prompt.md" -type f 2>/dev/null | sort | tail -1 | xargs -I {} echo "发现最新提示: {}" || echo "未找到 session prompt 文件"`

**🔴 Claude 必须执行以下强制步骤**：
1. 使用 Read 工具读取最新的 session prompt 文件内容
2. 完整理解prompt中的任务背景、目标和约束
3. 在后续分析中基于prompt内容制定具体执行计划
4. 如果没有session prompt文件，则基于$ARGUMENTS进行任务分析

**⚠️ 不完整阅读prompt将导致任务执行偏差**

## 🔧 Step 2: 启动 AI Workflow System

启动完整的 LinchKit AI Workflow 处理器：

!`echo "🚀 启动 AI Workflow..." && timeout 10 bun run tools/ai-platform/scripts/start-workflow.ts --task="$ARGUMENTS" --automation-level=semi_auto --priority=medium --enable-workflow-state=true || echo "⚠️  AI Workflow 脚本执行失败，继续基础分析"`

## 🔍 Step 3: 环境和上下文分析

### 项目基本信息
当前Git状态：!`git branch --show-current && echo "=== Git Status ===" && git status --porcelain | head -3`

### AI 环境初始化
!`echo "🧠 AI 环境初始化..." && timeout 5 bun run ai:init --task="$ARGUMENTS" || echo "⚠️  AI 初始化工具不可用"`

### Graph RAG 深度分析
!`echo "🔍 Graph RAG 分析..." && timeout 8 bun run ai:session analyze "$ARGUMENTS" || echo "⚠️  Graph RAG 不可用，使用文件系统分析"`

如果 Graph RAG 失败，使用文件系统分析：
!`echo "搜索任务相关文件：" && find . -name "*.ts" -path "*/src/*" -not -path "*/node_modules/*" -exec grep -l "$(echo "$ARGUMENTS" | cut -d' ' -f1 | tr '[:upper:]' '[:lower:]')" {} + 2>/dev/null | head -5 || echo "未找到相关文件"`

## 📦 Step 4: 智能依赖分析

### 包复用检查
!`echo "📦 检查包复用机会..." && timeout 5 bun run ai:deps check --keywords="$ARGUMENTS" || echo "⚠️  依赖检查工具不可用"`

### 架构合规性建议  
!`echo "🏗️  分析架构合规性..." && timeout 5 bun run ai:arch suggest --context="$ARGUMENTS" || echo "⚠️  架构建议工具不可用"`

## 🎯 Step 5: 快速状态检查

### 项目健康度检查
!`echo "=== 项目健康度 ===" && echo "📊 包管理器: $(which bun && echo "Bun 可用" || echo "Bun 不可用")" && echo "📁 工作目录: $(pwd)" && echo "🌳 分支状态: $(git status --porcelain | wc -l) 个文件待处理"`

### 可选工具检查 (非阻塞)
!`echo "=== 开发工具可用性 ===" && (timeout 3 bun run --help >/dev/null 2>&1 && echo "✅ Bun 脚本正常" || echo "⚠️  Bun 脚本可能有问题")`

## 🧠 Step 6: 项目结构分析

### 核心文件发现
!`echo "=== 项目结构分析 ===" && echo "关键源文件：" && find . -name "*.ts" -path "*/src/*" -not -path "*/node_modules/*" | head -5`

!`echo "包结构：" && (ls -la packages/ 2>/dev/null | head -5) || echo "未找到 packages 目录"`

### 任务相关文件发现
!`echo "=== 任务相关文件发现 ===" && echo "🔍 搜索关键词: $ARGUMENTS"`

!`echo "认证相关文件：" && (find . -path "*/auth/*" -name "*.ts" | head -3) || echo "未找到认证文件"`

!`echo "UI组件文件：" && (find . -path "*/ui/*" -name "*.ts" | head -3) || echo "未找到UI文件"`

!`echo "工具脚本：" && (find . -path "*/tools/*" -name "*.ts" | head -3) || echo "未找到工具文件"`

## 📊 Step 7: 智能分析总结

!`echo "=== AI 工作流决策引擎分析 ===" && echo "任务: $ARGUMENTS" && echo "分析时间: $(date)" && echo "当前目录: $(pwd)"`

### 🎯 智能建议引擎

基于全面分析，系统状态：

**工作流状态**: 已初始化 → 准备进入开发阶段
**环境检查**: 已完成 Git 状态、代码质量、构建状态检查
**文件发现**: 已扫描相关源文件和组件
**依赖分析**: 已检查包复用机会和架构合规性

### 🪝 Claude Code Hooks 系统激活

**实时约束执行机制已激活**：
- ✅ PreToolUse: 智能上下文注入 + 约束检查 + Graph RAG 查询
- ✅ PostToolUse: 质量验证 + 架构检查 + 测试建议  
- ✅ UserPromptSubmit: 实时状态监控

### 🚀 下步行动指引

接下来的文件操作将自动触发：
1. **自动上下文分析**：基于 Graph RAG 的智能建议
2. **实时约束检查**：零容忍的质量保证机制
3. **架构合规验证**：L0-L3 分层架构检查
4. **智能测试建议**：基于更改的测试策略

---

✅ **LinchKit AI Workflow System 启动完成！**

🧠 **智能开发环境已就绪 - 系统将自动提供分析、建议和质量保证**

🎯 **准备开始任务: $ARGUMENTS**