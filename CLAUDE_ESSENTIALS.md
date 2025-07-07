# LinchKit Claude 核心约束 (必读)

**版本**: v1.0  
**用途**: 每次session开始时的强制检查清单

## 🔴 强制执行检查表 (跳过将导致错误)

### 1. 📋 TodoRead - 检查待办任务
```bash
# 每次对话开始必须执行
TodoRead
```

### 2. 🌳 分支检查 - 避免在main分支工作
```bash
pwd                          # 确认目录
git branch --show-current    # 检查分支
git status                   # 检查状态
```
**如果在main分支**: 立即创建功能分支 `git checkout -b feature/task-name`

### 3. 🔍 上下文查询 - 任何代码操作前必须查询
```bash
# 根据任务选择一个
bun scripts/ai-context/ai-context-cli.js --find-entity "[Entity]" --include-related
bun scripts/ai-context/ai-context-cli.js --find-symbol "[Symbol]"
bun scripts/ai-context/ai-context-cli.js --find-pattern "[Pattern]" --for-entity "[Entity]"
```

## 🔴 强制技术约束

### 包管理
- **只使用bun**: `bun install`, `bun run`, `bun add`
- **禁止**: npm, yarn, pnpm

### 编程规范  
- **TypeScript严格模式**: 禁止`any`，使用`unknown`
- **包依赖顺序**: core → schema → auth → crud → trpc → ui → console
- **环境变量**: 所有敏感配置使用`.env.local`

### AI工作流约束
- **禁止猜测**: 必须通过Neo4j查询获取准确信息
- **功能复用**: 使用LinchKit内部包，禁止重复实现

## 🔴 完成定义 (Definition of Done)

每个任务完成前必须执行：
1. `bun lint` - 代码质量检查
2. `bun test` - 测试通过  
3. `bun build` - 构建验证
4. `bun scripts/graph-data-extractor.ts` - 更新图谱数据
5. 验证AI查询工具正常工作

## 📋 快速参考

**创建分支**: `git checkout -b feature/task-name`  
**查询实体**: `bun scripts/ai-context/ai-context-cli.js --find-entity "User" --include-related`  
**更新图谱**: `bun scripts/graph-data-extractor.ts`  
**完整验证**: `bun validate`

**⚠️ 如遗忘任何检查步骤，请重新阅读此文档**