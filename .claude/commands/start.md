# 🚨 Claude Code /start 命令强制执行协议

**任务**: $ARGUMENTS

## 🔴 Claude必须立即执行的强制步骤

### 步骤1: 立即执行AI Guardian验证
```bash
bun run ai:guardian:validate "$ARGUMENTS"
```
**如果验证失败，Claude必须停止所有工作并报告违规**

### 步骤2: 声明遵守约束
Claude必须明确声明：
> "我已阅读Essential_Rules.md，已执行AI Guardian验证，将严格遵守所有约束"

### 步骤3: 加载核心约束文档
Claude必须读取以下文档：
- `ai-context/00_Getting_Started/03_Essential_Rules.md`
- `ai-context/manifest.json` 
- `CLAUDE.md`

### 步骤4: 检查分支状态
```bash
git branch --show-current
```
**禁止在main/master/develop/release分支工作**

### 步骤5: 执行Graph RAG查询
```bash
bun run ai:session query "$ARGUMENTS" --debug
```
**必须基于项目上下文进行开发**

### 步骤6: 检查包复用
```bash
bun run deps:check "$ARGUMENTS" 
```
**避免重复实现现有功能**

## 🚨 零容忍违规项目

1. ❌ **分支违规** - 在保护分支工作
2. ❌ **跳过验证** - 未执行AI Guardian验证
3. ❌ **重复实现** - 不查询现有功能就开发
4. ❌ **类型违规** - 使用any类型、console.log等
5. ❌ **测试违规** - 不同步更新测试

## 📋 用户监督协议

**如果Claude没有执行以上步骤，用户应立即拒绝继续**

## 🛡️ AI Guardian保护

AI Guardian验证包括：
- 分支状态检查
- Graph RAG强制查询
- 包复用检查
- 约束文件生成
- Guardian激活

---

**状态**: 🔴 强制执行中
**要求**: Claude必须100%遵守上述协议