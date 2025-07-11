# 快速检查清单

**版本**: v8.0  
**用途**: 每次开发任务前的30秒-2分钟快速验证

## 🔴 每次开始前 (30秒检查)

- [ ] **分支检查**: `git branch --show-current` != main/master/develop
- [ ] **AI上下文**: `bun run ai:context-verify` 通过
- [ ] **风险等级**: 了解当前任务的风险等级
  - 🔴 **关键业务**: 支付、认证、核心算法 (99.9%正确率)
  - 🟡 **重要功能**: API接口、数据处理 (95%正确率)
  - 🟢 **一般功能**: UI组件、工具函数 (90%正确率)

## 🔴 代码生成前 (1分钟检查)

- [ ] **Graph RAG 查询**: `bun run ai:session query "[功能关键词]"`
- [ ] **符号查找**: `bun run ai:session symbol "[类名/函数名]"`
- [ ] **包复用检查**: `bun run deps:check "[关键词]"`
- [ ] **现有实现**: 确认没有现有实现可复用
- [ ] **测试策略**: 明确测试策略和覆盖率目标

## 🔴 代码生成后 (2分钟验证)

- [ ] **AI质量门禁**: `bun run ai:quality-gate`
- [ ] **编译检查**: `tsc --noEmit` (无错误)
- [ ] **ESLint检查**: `eslint . --max-warnings=0`
- [ ] **测试运行**: `bun test` (全部通过)
- [ ] **覆盖率检查**: 达到包级别要求
- [ ] **人工审查**: 关键逻辑人工审查
- [ ] **构建验证**: `bun build` (成功无警告)

## 🔴 提交前 (1分钟确认)

- [ ] **功能完整**: 功能+测试一起提交
- [ ] **文档更新**: 相关文档已更新
- [ ] **commit格式**: 符合规范
- [ ] **分支状态**: 工作目录干净
- [ ] **图谱同步**: `bun run ai:session sync`

## 🚨 违规处理

### 发现违规时立即执行：

1. **停止当前任务**
2. **记录违规原因**
3. **执行正确流程**
4. **验证修复结果**

### 常见违规和处理：

```bash
# 在保护分支工作
git checkout -b feature/[task-name]

# 跳过Graph RAG查询
bun run ai:session query "[核心概念]"

# 未检查包复用
bun run deps:check "[关键词]"

# 质量门禁失败
bun run ai:quality-gate
# 根据输出修复问题后重试
```

## 📊 效率提升技巧

### 快速命令组合

```bash
# 开发前快速检查
git branch --show-current && bun run ai:context-verify

# 生成后快速验证
bun run ai:quality-gate && bun test && bun build

# 提交前快速确认
git status && bun run ai:session sync
```

### 任务风险分级处理

- **🔴 关键业务**: 禁止AI生成，仅允许AI辅助分析
- **🟡 重要功能**: 使用高能力AI + 强制人工审查
- **🟢 一般功能**: 标准AI + 自动化验证

## 🎯 时间目标

- **开发前检查**: < 30秒
- **代码生成前**: < 1分钟
- **代码生成后**: < 2分钟
- **提交前确认**: < 1分钟
- **总额外时间**: < 5分钟

**投入回报**: 5分钟检查 → 节省数小时调试时间
