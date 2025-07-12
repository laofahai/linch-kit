🚨 智能开发 Session - AI 驱动的上下文优化启动

**强制要求:**

- 阅读并遵守 @CLAUDE.md 中的所有约束
- 遵守 @ai-context/02_Guides/01_Development_Workflow.md 中的开发流程
- 完成 Graph RAG 强制查询（零容忍违规）
- 使用 AI 智能加载系统优化上下文

任务: $ARGUMENTS

!echo "🔍 [$(date '+%H:%M:%S')] 输入验证和安全检查..."
!if [[ -z "$ARGUMENTS" ]]; then
echo "❌ 错误：请提供任务描述"
exit 1
fi

!echo "🔍 [$(date '+%H:%M:%S')] 检查当前分支状态..."
!CURRENT_BRANCH=$(git branch --show-current)
!if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]] || [[ "$CURRENT_BRANCH" == "develop" ]]; then
echo "❌ 错误：不能在保护分支 $CURRENT_BRANCH 上工作"
echo "💡 建议：运行 /new-branch [功能名] 创建功能分支"
exit 1
fi

!echo "🧠 [$(date '+%H:%M:%S')] 开始 AI 智能任务复杂度评估..."
!echo "📋 使用 AI Provider 抽象层进行智能分析"

!TASK_LEVEL=""
!ASSESSMENT_ERROR=""

!echo "🎯 执行智能任务评估..."
!if command -v bun &> /dev/null && [[ -f "tools/ai/task-assessor.ts" ]]; then
  !TASK_ASSESSMENT_RESULT=$(bun run tools/ai/task-assessor.ts "$ARGUMENTS" 2>&1)
  !if [[ $? -eq 0 ]]; then
    !TASK_LEVEL=$(echo "$TASK_ASSESSMENT_RESULT" | grep "📤 评估结果:" | sed 's/📤 评估结果: //')
    !echo "✅ AI评估完成: 任务级别 $TASK_LEVEL"
  else
    !ASSESSMENT_ERROR="$TASK_ASSESSMENT_RESULT"
    !echo "⚠️ AI评估失败，使用备用方案"
  fi
else
  !echo "⚠️ AI评估工具不可用，使用备用方案"
fi

!if [[ -z "$TASK_LEVEL" ]]; then
  !echo "🔄 使用基于关键词的备用评估..."
  !if echo "$ARGUMENTS" | grep -qi -E "(修复|fix|调整|配置|bug|typo)"; then
    !TASK_LEVEL="T1"
    !echo "📊 备用评估: T1 (基础任务)"
  elif echo "$ARGUMENTS" | grep -qi -E "(架构|设计|系统|集成|数据库|重构|新功能)"; then
    !TASK_LEVEL="T3"
    !echo "📊 备用评估: T3 (复杂任务)"
  else
    !TASK_LEVEL="T2"
    !echo "📊 备用评估: T2 (中等任务)"
  fi
fi

!echo "🏗️ [$(date '+%H:%M:%S')] 开始智能文档加载..."
!echo "📋 基于任务级别 $TASK_LEVEL 进行上下文优化"

!OPTIMIZED_CONTEXT=""
!CONTEXT_ERROR=""

!echo "📚 执行智能文档选择和加载..."
!if command -v bun &> /dev/null && [[ -f "tools/ai/document-loader.ts" ]]; then
  !DOCUMENT_RESULT=$(bun run tools/ai/document-loader.ts --level="$TASK_LEVEL" "$ARGUMENTS" 2>&1)
  !if [[ $? -eq 0 ]]; then
    !echo "✅ 智能文档加载完成"
    !LOADED_DOCS="$DOCUMENT_RESULT"
  else
    !CONTEXT_ERROR="$DOCUMENT_RESULT"
    !echo "⚠️ 智能文档加载失败，使用基础文档"
  fi
else
  !echo "⚠️ 智能文档加载器不可用，使用基础文档"
fi

!echo "🔍 [$(date '+%H:%M:%S')] 执行 Graph RAG 强制查询..."
!echo "🧠 智能分析任务关键概念..."

# 智能提取查询关键词而非直接传递用户输入 (遵循CLAUDE.md要求)
!QUERY_KEYWORDS=""
!if echo "$ARGUMENTS" | grep -qi "console"; then
  !QUERY_KEYWORDS="console"
elif echo "$ARGUMENTS" | grep -qi -E "(auth|认证|用户|登录)"; then
  !QUERY_KEYWORDS="auth"
elif echo "$ARGUMENTS" | grep -qi -E "(dashboard|仪表板|面板)"; then
  !QUERY_KEYWORDS="dashboard"  
elif echo "$ARGUMENTS" | grep -qi -E "(ui|组件|界面)"; then
  !QUERY_KEYWORDS="ui"
elif echo "$ARGUMENTS" | grep -qi -E "(crud|增删改查)"; then
  !QUERY_KEYWORDS="crud"
elif echo "$ARGUMENTS" | grep -qi -E "(schema|模式|数据结构)"; then
  !QUERY_KEYWORDS="schema"
else
  # 提取第一个有意义的关键词
  !QUERY_KEYWORDS=$(echo "$ARGUMENTS" | sed 's/[^a-zA-Z0-9\u4e00-\u9fa5]/ /g' | awk '{for(i=1;i<=NF;i++) if(length($i)>2) {print $i; break}}')
fi

!echo "🎯 使用智能查询词: $QUERY_KEYWORDS"
!GRAPH_RAG_RESULT=$(bun run ai:session query "$QUERY_KEYWORDS" 2>&1)
!if [[ $? -ne 0 ]]; then
  echo "🚨 FATAL: Graph RAG 查询失败 - 这是零容忍违规"
  echo "📋 错误详情: $GRAPH_RAG_RESULT"
  echo "🛑 Claude 必须基于项目上下文进行开发，查询失败则停止"
  exit 1
fi
!echo "✅ Graph RAG 查询完成，找到相关实现"

!echo "🎯 [$(date '+%H:%M:%S')] 执行 AI 上下文智能优化..."
!if command -v bun &> /dev/null && [[ -f "tools/ai/smart-context.ts" ]] && [[ -n "$LOADED_DOCS" ]]; then
  !echo "🧠 使用 AI 优化上下文内容..."
  !CONTEXT_OPTIMIZATION_RESULT=$(bun run tools/ai/smart-context.ts "$LOADED_DOCS" "$ARGUMENTS" "$GRAPH_RAG_RESULT" 2>&1)
  !if [[ $? -eq 0 ]]; then
    !OPTIMIZED_CONTEXT=$(echo "$CONTEXT_OPTIMIZATION_RESULT" | sed -n '/OPTIMIZED_CONTENT_START/,/OPTIMIZED_CONTENT_END/p' | sed '1d;$d')
    !echo "✅ AI上下文优化完成"
  else
    !echo "⚠️ AI上下文优化失败: $CONTEXT_OPTIMIZATION_RESULT"
  fi
fi

!echo "📋 [$(date '+%H:%M:%S')] 检查包复用情况..."
!if [[ -f "tools/dev/check-reuse.mjs" ]] && [[ -n "$QUERY_KEYWORDS" ]]; then
  !bun run deps:check "$QUERY_KEYWORDS" || echo "⚠️ 包复用检查完成"
elif [[ -n "$QUERY_KEYWORDS" ]]; then
  !echo "🔍 检查关键词: $QUERY_KEYWORDS (工具脚本不存在，跳过检查)"
else
  !echo "⚠️ 无法提取查询关键词，跳过包复用检查"
fi

!echo "🤝 [$(date '+%H:%M:%S')] 检查是否需要 Gemini 协商..."
!if echo "$ARGUMENTS" | grep -qi -E "(设计|架构|技术选型|方案|复杂)"; then
  !echo "💡 建议与Gemini协商设计最佳实践"
  !echo "   使用命令：与Gemini协商 $ARGUMENTS"
fi

!echo "🤖 [$(date '+%H:%M:%S')] 激活 Claude AI 智能监督机制..."
!cat > .claude/smart-session-monitor.md << EOF

# Claude AI 智能监督 - 当前会话约束 ($(date '+%Y-%m-%d %H:%M:%S'))

## 任务信息
- **任务描述**: $ARGUMENTS
- **智能评估级别**: $TASK_LEVEL
- **查询关键词**: $QUERY_KEYWORDS
- **Graph RAG状态**: 已完成 ✓
- **智能上下文**: $(if [[ -n "$OPTIMIZED_CONTEXT" ]]; then echo "已优化 ✓"; else echo "使用基础文档"; fi)

## 零容忍约束 (违反即终止)

1. 🚫 任何编码前必须先基于 Graph RAG 查询结果分析现有实现
2. 🚫 禁止重复实现已存在的 LinchKit 功能
3. 🚫 禁止使用 console.log/console.error，必须用 @linch-kit/core logger
4. 🚫 禁止跳过 ai-context 架构文档分析
5. 🚫 禁止在保护分支直接工作

## AI 智能监督特性

- **任务复杂度感知**: 基于 $TASK_LEVEL 级别进行开发决策
- **上下文优化**: 已加载最相关的文档和约束
- **智能提示**: 根据任务特点提供针对性建议
- **自动回退**: AI工具失败时自动使用备用方案

## 自我检查机制

编码前自问：
- "我是否已查询并分析了现有相关实现？" ✓
- "我是否确认没有重复实现现有功能？"
- "我是否遵循了当前 LinchKit 架构原则？"
- "我是否使用了正确的 LinchKit 核心包？"
- "我是否基于正确的任务复杂度级别进行设计？"

## 违规处理

发现违规时必须：
1. 立即停止当前任务
2. 公开承认违规行为
3. 解释违规原因
4. 重新执行正确的智能分析流程

## 会话状态: 智能分析已完成 ✓

EOF

!echo "📊 [$(date '+%H:%M:%S')] 生成智能开发摘要..."
!cat > .claude/smart-session-summary.md << EOF

# LinchKit 智能开发会话摘要

## 会话信息
- **开始时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **任务**: $ARGUMENTS
- **分支**: $CURRENT_BRANCH

## AI智能分析结果

### 任务复杂度评估
- **级别**: $TASK_LEVEL
- **评估方式**: $(if [[ -z "$ASSESSMENT_ERROR" ]]; then echo "AI智能评估"; else echo "关键词备用评估"; fi)
$(if [[ -n "$ASSESSMENT_ERROR" ]]; then echo "- **评估错误**: $ASSESSMENT_ERROR"; fi)

### 文档加载优化
- **加载方式**: $(if [[ -n "$LOADED_DOCS" ]]; then echo "AI智能选择"; else echo "基础文档集合"; fi)
- **目标上下文大小**: $(case $TASK_LEVEL in T1) echo "5KB";; T2) echo "15KB";; T3) echo "25KB";; esac)
$(if [[ -n "$CONTEXT_ERROR" ]]; then echo "- **加载错误**: $CONTEXT_ERROR"; fi)

### 上下文优化
- **优化状态**: $(if [[ -n "$OPTIMIZED_CONTEXT" ]]; then echo "AI优化完成"; else echo "使用原始文档"; fi)
- **Graph RAG**: 已完成 ✓

## 开发建议

基于 $TASK_LEVEL 级别任务的建议：

$(case $TASK_LEVEL in
T1) echo "- 重点关注核心约束和快速实现
- 避免过度设计，保持简单
- 确保基础质量检查通过";;
T2) echo "- 进行适当的设计规划
- 考虑代码复用和架构一致性  
- 完善测试覆盖
- 更新相关文档";;
T3) echo "- 必须进行详细设计方案
- 考虑架构影响和向后兼容
- 全面的测试策略
- 完整的文档更新
- 考虑与团队协商设计";;
esac)

## 质量保证清单

- [ ] Graph RAG 查询已完成
- [ ] 现有实现已分析
- [ ] 包复用已检查
- [ ] 架构约束已遵循
- [ ] 适当的测试策略
- [ ] 代码质量标准
- [ ] 文档同步更新

EOF

!echo ""
!echo "✅ [$(date '+%H:%M:%S')] LinchKit 智能开发系统启动完成！"
!echo ""
!echo "🎯 **任务级别**: $TASK_LEVEL"
!echo "🧠 **AI分析**: $(if [[ -z "$ASSESSMENT_ERROR" ]]; then echo "智能评估完成"; else echo "基础评估完成"; fi)"
!echo "📚 **上下文**: $(if [[ -n "$OPTIMIZED_CONTEXT" ]]; then echo "AI优化完成"; else echo "基础文档加载"; fi)"
!echo "🔍 **Graph RAG**: 项目上下文已同步 ($QUERY_KEYWORDS)"
!echo ""
!echo "🚨 **提醒**: Claude AI 已激活智能监督，将严格遵循所有约束"
!echo "📋 **下一步**: 请基于智能分析结果和 $TASK_LEVEL 级别要求开始开发"
!echo ""
!echo "📊 查看详细分析: cat .claude/smart-session-summary.md"

$(if [[ -n "$OPTIMIZED_CONTEXT" ]]; then
echo ""
echo "🎯 **智能优化的上下文内容**:"
echo "=================================="
echo "$OPTIMIZED_CONTEXT"
echo "=================================="
fi)