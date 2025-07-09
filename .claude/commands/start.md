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

!echo "🔍 [$(date '+%H:%M:%S')] 执行强制 Graph RAG 查询..."
!bun run ai:session query "$ARGUMENTS" || {
echo "❌ Graph RAG 查询失败，请检查网络连接和AI服务状态"
exit 1
}

!echo "📚 [$(date '+%H:%M:%S')] 执行 Context7 查询..."
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
!if [[-f "scripts/check-reuse.mjs"]]; then
bun run scripts/check-reuse.mjs "$ARGUMENTS" || echo "⚠️ 包复用检查失败"
else
echo "⚠️ 包复用检查脚本不存在"
fi

!echo "✅ [$(date '+%H:%M:%S')] 开发环境就绪，可以开始工作！"
