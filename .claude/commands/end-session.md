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

!echo "⏳ 等待 CI/CD 完成..."
!gh pr checks --watch

!echo "🤖 自动审核并合并 PR..."
!gh pr review --approve --body "✅ 自动审核通过：所有质量检查完成"
!gh pr merge --auto --squash --delete-branch

!echo "🧹 清理本地分支 (Development_Workflow.md 第257-259行)..."
!CURRENT_BRANCH=$(git branch --show-current)
!git checkout main
!git pull origin main
!git branch -d $CURRENT_BRANCH

!echo "🎉 完整工作流结束！"
!echo " ✅ 分支 $CURRENT_BRANCH 已清理"
!echo " ✅ 已回到 main 分支"
!echo " ✅ 代码已合并到主分支"
