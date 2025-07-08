🚨 开始开发 session - 必须严格遵循所有约束

**强制要求:**

- 阅读并遵守 @CLAUDE.md 中的所有约束
- 遵守 @ai-context/02_Guides/01_Development_Workflow.md 中的开发流程
- 完成 Graph RAG 强制查询（零容忍违规）

任务: $ARGUMENTS

!echo "🔍 执行强制 Graph RAG 查询..."
!bun run ai:session query "$ARGUMENTS"
