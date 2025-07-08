🧠 强制 Graph RAG 查询 - 零容忍跳过

**必须完成** - 按照 @CLAUDE.md 约束，任何代码开发前必须查询现有实现

查询: $ARGUMENTS

!echo "🔍 执行强制 Graph RAG 查询..."
!bun run ai:session query "$ARGUMENTS"
!echo "⚠️ 请检查查询结果，避免重复实现现有功能"
