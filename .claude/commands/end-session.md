🏁 结束 session - 强制执行质量门禁

**必须100%通过:**

- @CLAUDE.md 中定义的所有质量标准
- @ai-context/02_Guides/01_Development_Workflow.md 中的验证流程
- 零错误构建、零 ESLint 错误、完整测试覆盖

完成内容: $ARGUMENTS

!echo "🔍 执行强制质量验证..."
!bun run validate
!echo "✅ 验证通过，准备提交..."
