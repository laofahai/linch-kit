# LinchKit Claude AI 指导 (精简版)

**版本**: v8.0 | **更新**: 2025-07-07

## 🚨 强制执行检查表 (每次对话开始)

### 1. 📋 `TodoRead` - 检查任务状态
### 2. 🌳 分支检查 - 确保不在main分支工作
### 3. 🔍 上下文查询 - 代码操作前必须查询Neo4j图谱

## 🔴 技术约束

- **包管理**: 只用bun，禁止npm/yarn/pnpm
- **TypeScript**: 严格模式，禁止`any`
- **环境变量**: 敏感信息用`.env.local`
- **架构顺序**: core → schema → auth → crud → trpc → ui → console

## 🎯 AI工作流程

```bash
# 强制查询命令 (选择一个)
bun scripts/ai-context/ai-context-cli.js --find-entity "[Entity]" --include-related
bun scripts/ai-context/ai-context-cli.js --find-symbol "[Symbol]" 
bun scripts/ai-context/ai-context-cli.js --find-pattern "[Pattern]" --for-entity "[Entity]"
```

## 📋 完成检查 (每次任务结束)

1. `bun lint` - 代码质量
2. `bun test` - 测试通过
3. `bun build` - 构建验证  
4. `bun scripts/graph-data-extractor.ts` - 更新图谱
5. 验证AI查询工具正常

## 🔗 详细文档

- **核心约束**: [CLAUDE_ESSENTIALS.md](./CLAUDE_ESSENTIALS.md)
- **完整指导**: [CLAUDE.md](./CLAUDE.md)
- **AI协作**: [ai-context/00_ai_collaboration/](./ai-context/00_ai_collaboration/)
- **架构设计**: [ai-context/01_strategy_and_architecture/](./ai-context/01_strategy_and_architecture/)

---
**记住**: 违反约束会导致代码不一致。如有疑问，查阅详细文档。