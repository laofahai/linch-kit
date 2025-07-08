结束开发 session：

1. 运行完整验证
2. 提交代码
3. 推送并创建 PR

!bun run validate
!git add . && git commit -m "feat: complete development task

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
!git push -u origin $(git branch --show-current)
!gh pr create --title "Development task completion" --body "## Summary
Development task completed with full validation.

🤖 Generated with [Claude Code](https://claude.ai/code)" --base main || echo "PR creation failed - please create manually"
