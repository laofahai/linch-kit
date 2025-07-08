🏁 结束 session - 执行标准工作流

**强制遵循流程:**

- @CLAUDE.md 第197-208行：成功标准
- @ai-context/02_Guides/01_Development_Workflow.md 第235-259行：提交规范与分支清理

完成内容: $ARGUMENTS

!echo "🔍 执行强制质量验证 (CLAUDE.md 第203行要求)..."
!bun run validate

!echo "📦 按照标准提交规范提交 (Development_Workflow.md 第238行)..."
!git add .
!git commit -m "feat: $ARGUMENTS

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

!echo "📤 推送并创建 PR..."
!git push -u origin $(git branch --show-current)
!gh pr create --title "$ARGUMENTS" --body "按照 @ai-context/02_Guides/01_Development_Workflow.md 完成开发

🤖 Generated with [Claude Code](https://claude.ai/code)" --base main

!echo "🎯 图谱同步 (CLAUDE.md 第206行要求)..."
!bun run ai:session sync

!echo "✅ 完成！CI/CD 将自动触发 (CLAUDE.md 第84行 L4层验证)"
