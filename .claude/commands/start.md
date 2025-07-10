🚨 开始开发 session - 必须严格遵循所有约束

**强制要求:**

- 阅读并遵守 @CLAUDE.md 中的所有约束
- 遵守 @ai-context/02_Guides/01_Development_Workflow.md 中的开发流程
- 完成 Graph RAG 强制查询（零容忍违规）

任务: $ARGUMENTS

!echo "🔍 [$(date '+%H:%M:%S')] 输入验证和安全检查..."
!if [[-z "$ARGUMENTS"]]; then
echo "❌ 错误：请提供任务描述"
exit 1
fi

!echo "🔍 [$(date '+%H:%M:%S')] 检查当前分支状态..."
!CURRENT_BRANCH=$(git branch --show-current)
!if [[ "$CURRENT_BRANCH" == "main" ]] || [["$CURRENT_BRANCH" == "master"]] || [["$CURRENT_BRANCH" == "develop"]]; then
echo "❌ 错误：不能在保护分支 $CURRENT_BRANCH 上工作"
echo "💡 建议：运行 /new-branch [功能名] 创建功能分支"
exit 1
fi

!echo "🧠 [$(date '+%H:%M:%S')] 任务复杂度分析..."
!if [[${#ARGUMENTS} -gt 100]] || [[$ARGUMENTS =~ (架构|重构|性能|复杂|设计|算法)]]; then
echo "🚨 检测到复杂任务，建议："
echo " • 使用 TodoWrite 拆分任务"
echo " • 每30分钟检查一次进度"
echo " • 适时使用 /end-session 保存状态"
echo "🧠 启用 thinking 模式进行深度分析"
fi

!echo "🏗️ [$(date '+%H:%M:%S')] 开始 Claude 综合架构分析..."

!echo "📋 步骤1: 执行 Graph RAG 现有实现查询..."
!GRAPH_RAG_RESULT=$(bun run ai:session query "$ARGUMENTS" 2>&1)
!if [[$? -ne 0]]; then
echo "🚨 FATAL: Graph RAG 查询失败 - 这是零容忍违规"
echo "📋 错误详情: $GRAPH_RAG_RESULT"
echo "🛑 Claude 必须基于项目上下文进行开发，查询失败则停止"
exit 1
fi
!echo "✅ Graph RAG 查询完成，找到相关实现"

!echo "📋 步骤2: 查询项目架构文档..."
!if [[-d "ai-context"]]; then
echo "✅ ai-context 文档可用，Claude 将分析架构约束"
echo "📄 重要文档: ai-context/02_Guides/01_Development_Workflow.md"
else
echo "⚠️ ai-context 目录不存在，架构分析受限"
fi

!echo "📋 步骤3: 检查现有代码模式..."
!echo "🔍 检查相关包和模块..."
!if echo "$ARGUMENTS" | grep -i -E "(registry|注册)" > /dev/null; then
echo "⚠️ 检测到Registry相关功能 - 必须使用 @linch-kit/core AppRegistry"
fi
!if echo "$ARGUMENTS" | grep -i -E "(logger|日志)" > /dev/null; then
echo "⚠️ 检测到日志相关功能 - 必须使用 @linch-kit/core logger"
fi
!if echo "$ARGUMENTS" | grep -i -E "(extension|扩展)" > /dev/null; then
echo "⚠️ 检测到扩展相关功能 - 必须使用 @linch-kit/core ExtensionManager"
fi

!echo "📋 步骤4: Claude 架构分析承诺激活..."
!cat > .claude/current-session-analysis.md << EOF

# Claude 架构分析报告 - $(date '+%Y-%m-%d %H:%M:%S')

## 任务: $ARGUMENTS

## Graph RAG 查询结果

已完成项目上下文查询，发现相关现有实现

## 架构文档分析

- ai-context 文档可用
- 将遵循 LinchKit 当前架构原则
- 避免重复实现现有功能

## Claude 强制承诺

我承诺在本次开发中：

1. ✅ 基于 Graph RAG 查询结果复用现有实现
2. ✅ 遵循 ai-context 中的架构约束
3. ✅ 分析现有代码模式后再编码
4. ✅ 优先使用 LinchKit 核心包功能
5. ✅ 发现违规时立即停止并纠正

## 分析状态: 已完成 ✓

现在可以基于完整项目上下文开始智能开发
EOF

!echo "📚 [$(date '+%H:%M:%S')] 执行补充 Context7 查询..."
!if command -v context7 &> /dev/null; then
context7 "$ARGUMENTS" || echo "⚠️ Context7 查询失败，继续使用 Graph RAG 结果"
else
echo "⚠️ Context7 未安装，跳过查询"
fi

!echo "🤝 [$(date '+%H:%M:%S')] 检查是否需要 Gemini 协商..."
!if [[$ARGUMENTS =~ (设计|架构|技术选型|方案|复杂)]]; then
echo "💡 建议与Gemini协商设计最佳实践"
echo " 使用命令：与Gemini协商 $ARGUMENTS"
fi

!echo "📋 [$(date '+%H:%M:%S')] 检查包复用情况..."
!if [[-f "tools/dev/check-reuse.mjs"]]; then
bun run deps:check "$ARGUMENTS" || echo "⚠️ 包复用检查失败"
else
echo "⚠️ 包复用检查脚本不存在"
fi

!echo "✅ [$(date '+%H:%M:%S')] 开发环境就绪，可以开始工作！"
