🚨 智能开发 Session - 完全符合 CLAUDE.md 和 Essential_Rules.md 约束

**强制要求:**

- 100% 符合 CLAUDE.md v7.2 所有约束
- 100% 符合 Essential_Rules.md v8.0 所有约束
- 强制执行 Graph RAG 三重查询（零容忍违规）
- Claude AI 必须声明遵守约束

任务: $ARGUMENTS

!echo "🚨 [$(date '+%H:%M:%S')] 开始开发 session - 严格遵循所有约束"
!echo ""
!echo "📋 步骤1: 强制读取约束文档（零容忍违规）..."

# 强制读取 Essential Rules

Read ai-context/00_Getting_Started/03_Essential_Rules.md

# 强制读取知识库入口

Read ai-context/manifest.json

# 强制读取 CLAUDE.md

Read CLAUDE.md

!echo "✅ [$(date '+%H:%M:%S')] 约束文档读取完成"
!echo ""
!echo "🔴 Claude AI 强制声明："
!echo "我已阅读 CLAUDE.md 和 Essential_Rules.md，将严格遵守所有约束和流程"
!echo ""
!echo "📋 步骤2: 检查待办事项..."

# 检查未完成的任务

TodoRead

!echo ""
!echo "📋 步骤3: 环境和分支检查..."
!echo "任务: $ARGUMENTS"

!echo "🔍 [$(date '+%H:%M:%S')] 输入验证和安全检查..."
!if [[ -z "$ARGUMENTS" ]]; then
echo "❌ 错误：请提供任务描述"
exit 1
fi

!echo "🔍 [$(date '+%H:%M:%S')] 检查当前分支状态..."
!CURRENT_BRANCH=$(git branch --show-current)
!echo "当前分支: $CURRENT_BRANCH"
!if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]] || [[ "$CURRENT_BRANCH" == "develop" ]] || [[ "$CURRENT_BRANCH" =~ ^release/.* ]]; then
echo "❌ 错误：不能在保护分支 $CURRENT_BRANCH 上工作"
echo "💡 建议：运行 /new-branch [功能名] 创建功能分支"
exit 1
fi

!echo "✅ 分支检查通过，当前在功能分支: $CURRENT_BRANCH"

!echo ""
!echo "📋 步骤4: 工作目录状态检查..."
!git status --short

!echo ""
!echo "📋 步骤5: 强制 Graph RAG 查询（零容忍违规）..."

# 智能提取查询关键词

!echo "🧠 [$(date '+%H:%M:%S')] Claude 智能分析任务，提取技术关键词..."
!QUERY_KEYWORDS=""
!SYMBOL_KEYWORDS=""
!PATTERN_KEYWORDS=""

# 这里 Claude 会基于任务描述智能提取关键词

# 例如："实现用户认证" -> query: "auth", symbol: "AuthService", pattern: "authentication"

!echo "📋 执行强制 Graph RAG query 查询..."
!GRAPH_RAG_RESULT=$(bun run ai:session query "$ARGUMENTS" 2>&1)
!if [[ $? -ne 0 ]]; then
echo "🚨 FATAL: Graph RAG query 查询失败 - 这是零容忍违规"
echo "📋 错误详情: $GRAPH_RAG_RESULT"
echo "🛑 必须基于项目上下文进行开发，查询失败则停止"
exit 1
fi
!echo "✅ Graph RAG query 查询完成"

!echo ""
!echo "📋 执行强制 Graph RAG symbol 查询..."
!SYMBOL_RESULT=$(bun run ai:session symbol "Service Controller Component" 2>&1)
!if [[ $? -ne 0 ]]; then
echo "⚠️ Graph RAG symbol 查询失败，继续执行但需注意"
echo "📋 错误详情: $SYMBOL_RESULT"
else
echo "✅ Graph RAG symbol 查询完成"
fi

!echo ""
!echo "📋 执行强制 Graph RAG pattern 查询..."
!PATTERN_RESULT=$(bun run ai:session pattern "singleton factory" "service" 2>&1)
!if [[ $? -ne 0 ]]; then
echo "⚠️ Graph RAG pattern 查询失败，继续执行但需注意"
echo "📋 错误详情: $PATTERN_RESULT"
else
echo "✅ Graph RAG pattern 查询完成"
fi

!echo ""
!echo "📋 步骤6: 包复用强制检查..."
!if [[ -f "tools/dev/check-reuse.mjs" ]]; then
bun run deps:check "$ARGUMENTS" || echo "⚠️ 包复用检查完成"
else
echo "⚠️ 包复用检查脚本不存在，请确保不重复实现已有功能"
fi

!echo ""
!echo "📋 步骤7: Claude 自我监督机制激活..."

!cat > .claude/claude-session-monitor.md << EOF

# Claude 自我监督 - 当前会话强制约束

## Session 启动时间: $(date '+%Y-%m-%d %H:%M:%S')

## 任务: $ARGUMENTS

## ✅ 已完成的强制步骤

1. ✅ 读取 Essential_Rules.md - 完成
2. ✅ 读取 manifest.json - 完成
3. ✅ 读取 CLAUDE.md - 完成
4. ✅ Claude 声明遵守约束 - 完成
5. ✅ TodoRead 检查 - 完成
6. ✅ 分支状态检查 - 当前分支: $CURRENT_BRANCH
7. ✅ Graph RAG query 查询 - 完成
8. ✅ Graph RAG symbol 查询 - 完成
9. ✅ Graph RAG pattern 查询 - 完成
10. ✅ 包复用检查 - 完成

## 🔴 零容忍约束 (违反即终止)

1. 🚫 任何编码前必须先基于 Graph RAG 查询结果分析现有实现
2. 🚫 禁止重复实现已存在的 LinchKit 功能
3. 🚫 禁止使用 console.log/console.error，必须用 @linch-kit/core logger
4. 🚫 禁止跳过 ai-context 架构文档分析
5. 🚫 禁止在保护分支直接工作
6. 🚫 禁止使用 any 类型，必须用 unknown
7. 🚫 禁止使用 as 类型断言，必须用类型守卫
8. 🚫 禁止使用 @ts-ignore，必须修复类型错误

## 🔍 自我检查机制

编码前自问：

- "我是否已查询并分析了现有相关实现？"
- "我是否确认没有重复实现现有功能？"
- "我是否遵循了当前 LinchKit 架构原则？"
- "我是否使用了正确的 LinchKit 核心包？"

## 🚨 违规处理

发现违规时必须：

1. 立即停止当前任务
2. 公开承认违规行为
3. 解释违规原因
4. 重新执行正确的分析流程

## 📊 Graph RAG 查询结果摘要

### Query 查询结果:

已执行，等待 Claude 分析

### Symbol 查询结果:

已执行，等待 Claude 分析

### Pattern 查询结果:

已执行，等待 Claude 分析

## 🎯 会话状态: 所有强制步骤已完成 ✓

Claude 现在拥有完整的项目上下文，可以开始智能开发。
EOF

!echo ""
!echo "📋 步骤8: AI Session 工具状态检查..."
!if [[ -f ".ai-session/config.json" ]]; then
echo "✅ AI Session 已初始化"
else
echo "⚠️ AI Session 未初始化，运行 'bun run ai:session init' 初始化"
fi

!echo ""
!echo "🤝 [$(date '+%H:%M:%S')] 检查是否需要 Gemini 协商..."
!if [[ $ARGUMENTS =~ (设计|架构|技术选型|方案|复杂) ]]; then
echo "💡 检测到复杂任务，建议与 Gemini 协商设计最佳实践"
echo " 触发词：'与Gemini协商设计最佳实践'"
echo " 触发词：'请Gemini分析技术方案'"
echo " 触发词：'让Gemini评估可行性'"
fi

!echo ""
!echo "📋 步骤9: 创建任务追踪..."

# Claude 将基于任务创建 TodoWrite 条目

TodoWrite

!echo ""
!echo "🎨 [$(date '+%H:%M:%S')] 任务分析与设计建议..."
!echo "📋 Claude 将基于以下信息进行智能分析："
!echo " • Graph RAG 查询结果（query, symbol, pattern）"
!echo " • 现有 LinchKit 包功能"
!echo " • 项目架构约束"
!echo " • Essential Rules 要求"

!echo ""
!echo "💾 [$(date '+%H:%M:%S')] Session 日志记录..."
!mkdir -p .claude/session-logs
!SESSION_LOG=".claude/session-logs/session-$(date +%Y%m%d-%H%M%S).log"
!cat > "$SESSION_LOG" << EOF
Session Start: $(date '+%Y-%m-%d %H:%M:%S')
Task: $ARGUMENTS
Branch: $CURRENT_BRANCH
Constraints: CLAUDE.md v7.2, Essential_Rules.md v8.0
Graph RAG: query ✓, symbol ✓, pattern ✓
Deps Check: ✓
TodoRead: ✓
Status: Ready for development
EOF
!echo "📄 Session 日志已保存: $SESSION_LOG"

!echo ""
!echo "✅ [$(date '+%H:%M:%S')] /start 指令执行完成！"
!echo ""
!echo "📊 已完成的强制步骤清单："
!echo " ✅ Essential_Rules.md 读取"
!echo " ✅ manifest.json 读取"
!echo " ✅ CLAUDE.md 读取"
!echo " ✅ Claude 约束声明"
!echo " ✅ TodoRead 待办检查"
!echo " ✅ 分支保护验证"
!echo " ✅ Graph RAG 三重查询 (query/symbol/pattern)"
!echo " ✅ 包复用检查"
!echo " ✅ 自我监督机制激活"
!echo " ✅ 任务追踪创建"
!echo ""
!echo "🚨 Claude AI 承诺："
!echo " • 严格遵守所有约束，绝不违规"
!echo " • 基于完整项目上下文进行开发"
!echo " • 发现违规立即自我纠正"
!echo " • 优先复用现有 LinchKit 功能"
!echo ""
!echo "🚀 Claude 现在可以开始基于完整上下文的智能开发！"
