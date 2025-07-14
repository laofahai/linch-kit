# AI Session 强制约束 (2025-07-14T09:12:59.037Z)

## 任务: 继续修复starter问题 Next.js 15.3.4 Console Error Cannot read properties of undefined reading status extension-communication.ts

## 🚨 零容忍违规项
1. ❌ 在保护分支工作
2. ❌ 跳过Graph RAG查询  
3. ❌ 使用any类型
4. ❌ 使用console.log
5. ❌ 不同步更新测试
6. ❌ 重复实现现有功能

## 📋 质量门禁命令
```bash
# 类型检查
bunx tsc --noEmit --strict

# 代码规范
bun run lint --max-warnings=0

# 测试同步
bun test
bun test --coverage
```

---
生成时间: 2025-07-14T09:12:59.037Z
会话ID: 1752484379037