# AI Session 强制约束 (2025-07-14T05:30:24.826Z)

## 任务: build session

## 🚨 零容忍违规项
1. ❌ 在保护分支工作
2. ❌ 跳过Graph RAG查询  
3. ❌ 使用any类型
4. ❌ 使用console.log
5. ❌ 不同步更新测试
6. ❌ 重复实现现有功能

## ✅ 已完成强制检查
- [x] 分支状态验证
- [x] Graph RAG查询执行
- [x] AI Guardian激活
- [x] 约束文件生成

## 🔴 违规处理协议
发现任何违规行为必须：
1. 立即停止当前任务
2. 公开承认违规行为
3. 解释违规原因
4. 修复违规后重新验证

## 📋 强制命令清单
每次编码前必须执行：
```bash
# 质量检查
bun run type-check
bun run lint --max-warnings=0

# 测试同步
bun test
bun test --coverage
```

---
生成时间: 2025-07-14T05:30:24.826Z
会话ID: 1752471024826
