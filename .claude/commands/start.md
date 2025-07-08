开始开发 session：

1. 检查分支状态，如需要创建功能分支
2. 查询 Graph RAG 相关实现
3. 检查包复用可能性
4. 制定开发计划

请输入任务描述：$ARGUMENTS

!git branch --show-current
!bun run ai:session query "$ARGUMENTS" | head -10
