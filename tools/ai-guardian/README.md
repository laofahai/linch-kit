# LinchKit AI Guardian 强制执行系统

**目的**: 确保所有AI Session都100%遵守Essential_Rules.md约束，防止违规行为在不同session间重复发生。

## 🚨 零容忍违规检查

### 强制执行的约束
1. **分支管理** - 禁止在main/master/develop分支工作
2. **Graph RAG查询** - 每次代码任务前必须完整执行
3. **包复用检查** - 防止重复实现现有功能
4. **测试同步** - 功能代码与测试必须同步开发
5. **类型安全** - 禁止any类型、console.log等

## 📋 使用方法

### 在每个/start命令前执行
```bash
# 方法1: 使用TypeScript验证器 (推荐)
bun run ai:guardian:validate "任务描述"

# 方法2: 使用Shell执行钩子
bun run ai:guardian:enforce "任务关键词"
```

### 手动执行单项检查
```bash
# 分支检查
git branch --show-current

# Graph RAG强制查询
bun run ai:session query "[关键词]" --debug
bun run ai:session symbol "[符号名]"

# 包复用检查
bun run deps:check "[关键词]"

# AI质量检查
bun run ai:pre-check "[功能描述]"
bun run ai:quality-gate
```

## 🔧 系统组件

### 1. session-validator.ts
- **功能**: TypeScript实现的完整验证器
- **检查**: 分支状态、Graph RAG、包复用、设计文档、AI Guardian激活
- **输出**: 生成.claude/session-constraints.md约束文件

### 2. enforcement-hooks.sh  
- **功能**: Shell脚本钩子，可快速执行基础检查
- **特点**: 轻量级，适合快速验证

### 3. 生成的约束文件
- `.claude/session-constraints.md` - 当前会话的强制约束
- `.claude/guardians/` - 各个Guardian的激活状态

## ⚡ 集成到/start命令

### 建议的/start流程
1. **前置验证**: `bun run ai:guardian:validate "$ARGUMENTS"`
2. **如果验证失败**: 立即停止，修复违规
3. **如果验证通过**: 继续原有的智能加载流程

### 修改建议
在`/start`命令的开头添加：
```bash
# AI Guardian强制验证
if ! bun run ai:guardian:validate "$ARGUMENTS" 2>/dev/null; then
    echo "🚨 AI Guardian验证失败，会话无法继续"
    echo "📋 请修复违规后重新执行/start"
    exit 1
fi
```

## 🛡️ 防护级别

### Level 1: 基础防护
- 分支检查
- Graph RAG查询
- 基础约束文件生成

### Level 2: 完整防护 (推荐)
- 所有Level 1检查
- 包复用验证
- 设计文档检查
- AI Guardian激活

### Level 3: 企业级防护
- 所有Level 2检查  
- 实时代码质量监控
- 自动测试覆盖检查
- 架构一致性验证

## 🚨 违规处理协议

### 当检测到违规时
1. **立即停止** 当前任务执行
2. **显示错误** 详细的违规信息
3. **提供修复** 具体的修复建议
4. **阻止继续** 直到违规被修复

### 违规修复后
1. **重新验证** 执行完整的Guardian检查
2. **更新约束** 生成新的约束文件
3. **继续任务** 在严格监督下执行

## 📊 监控和报告

### 生成的监控文件
- `.claude/session-constraints.md` - 会话约束
- `.claude/guardians/code-quality.md` - 代码质量监控
- `.claude/guardians/test-coverage.md` - 测试覆盖监控
- `.claude/pre-check-report.md` - AI预检查报告

### 实时状态查看
```bash
# 查看当前约束
cat .claude/session-constraints.md

# 查看Guardian状态
ls -la .claude/guardians/

# 检查违规历史
git log --grep="violation" --oneline
```

## 🔄 持续改进

### 反馈循环
1. **收集违规数据** - 记录所有违规类型和频率
2. **分析根本原因** - 为什么会发生这些违规
3. **改进检查规则** - 添加新的防护机制
4. **更新文档** - 保持约束和流程同步

### 版本历史
- v1.0 - 基础分支和Graph RAG检查
- v1.1 - 添加包复用和设计文档检查  
- v1.2 - 集成AI Guardian系统
- v2.0 - 完整的零容忍违规检查 ⬅️ 当前版本

---

**核心原则**: 宁可停止工作，也不允许违规继续。质量>速度。