# Claude Code /start 命令重写指令

**重要**: 此文件确保Claude在使用Claude Code的/start命令时强制执行AI Guardian验证。

## 🚨 强制执行协议

当用户在Claude Code中执行`/start [任务描述]`时，Claude必须：

### 1. 立即执行AI Guardian验证
```bash
bun run ai:guardian:validate "任务描述"
```

### 2. 检查验证结果
- ✅ **如果验证通过** → 继续执行任务
- ❌ **如果验证失败** → 立即停止，要求用户修复违规

### 3. 声明遵守约束
必须明确声明：
> "我已阅读Essential_Rules.md，已执行AI Guardian验证，将严格遵守所有约束"

## 🔴 零容忍违规检查

AI Guardian验证包括：
- [x] 分支状态检查（禁止在main/develop/master分支工作）
- [x] Graph RAG强制查询执行
- [x] 包复用检查
- [x] AI Guardian激活
- [x] 约束文件生成

## 📋 实际执行流程

```
用户: /start 修复某个功能
↓
Claude执行: bun run ai:guardian:validate "修复某个功能"
↓ 
如果失败: 显示错误，要求修复违规
如果成功: 声明遵守约束，继续任务
↓
开始执行任务，全程遵守所有约束
```

## 🚨 用户监督职责

如果Claude没有：
1. 立即执行AI Guardian验证
2. 明确声明遵守约束
3. 在验证失败时停止任务

**用户应立即拒绝继续，并要求Claude重新开始**

## 🛡️ 系统保证

- 此机制确保每个Claude Code session都100%遵守约束
- 违规行为将被自动检测和阻断
- 持续监控整个开发过程

---

**状态**: 🔴 ACTIVE - 强制执行中
**版本**: v2.0 - 零容忍违规检查
**更新时间**: 2025-07-14