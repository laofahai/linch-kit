# 🧠 AI原生渐进式Context加载 - Claude Code Commands

**目标**: 基于任务复杂度智能加载相关文档，优化Token使用效率

**参数**: $ARGUMENTS (任务描述，将自动分析复杂度级别)

!echo "🧠 [$(date '+%H:%M:%S')] 开始AI原生渐进式Context加载..."
!echo "📝 任务描述: $ARGUMENTS"
!echo ""

# 步骤1: AI智能任务评估
!echo "📊 步骤1: AI智能分析任务复杂度..."

Read ai-context/loading-config.json

!echo "🤖 AI任务分析提示："
!echo "基于任务描述'$ARGUMENTS'和loading-config.json中的关键词，请AI判断："
!echo "- T1 (基础任务, 5KB): 修复、配置、简单更新"
!echo "- T2 (中等任务, 15KB): 功能实现、组件开发、API创建"  
!echo "- T3 (复杂任务, 25KB): 架构设计、系统重构、复杂集成"
!echo ""

# 步骤2: 补充文档智能加载（核心约束已在/start中强制加载）
!echo "📚 步骤2: 智能加载补充文档（核心约束已预加载）..."

!echo ""
!echo "📋 步骤3: 根据任务级别加载补充文档..."

!echo "🤖 AI智能加载提示："
!echo "基于刚才的任务复杂度分析，请AI选择性加载："
!echo ""
!echo "如果是T1任务，只需核心约束文档(已加载)"
!echo ""
!echo "如果是T2任务，额外加载："
Read ai-context/02_Guides/05_AI_Code_Quality.md
Read ai-context/02_Guides/06_Quick_Checklist.md

!echo ""
!echo "如果是T3任务，额外加载架构文档："
Read ai-context/02_Guides/01_Development_Workflow.md
Read ai-context/01_Architecture/03_Package_Architecture.md

!echo ""
!echo "📊 步骤4: Graph RAG上下文查询..."

# 智能提取关键词并查询
Bash
command: bun run ai:session query "$ARGUMENTS" --debug
description: 基于任务描述查询相关项目知识

!echo ""
!echo "🎯 步骤5: 包复用智能检查..."

# 检查是否有现有功能可复用
!echo "🔍 检查现有包功能..."
LS path: /home/laofahai/workspace/linch-kit/packages

Glob pattern: "packages/**/*.ts" | head -10

!echo ""
!echo "✅ AI原生渐进式Context加载完成"
!echo "📊 已智能加载相关文档和项目上下文"
!echo "🎯 任务: $ARGUMENTS"
!echo ""
!echo "🤖 请AI基于加载的上下文开始任务执行"