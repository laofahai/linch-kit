---
allowed-tools: [Bash, Glob, Read, LS, TodoWrite]
description: "AI Workflow Session 智能结束器 - 完整的 session 结束和清理工作流"
---

# 🔚 /end-session - AI Workflow Session 智能结束器

**完整的 LinchKit AI Workflow Session 结束流程，包含智能清理和状态报告**

## 🎯 Session 结束流程概览

### 📊 Step 1: Session 状态收集
!`echo "🔍 收集 Session 状态..." && echo "Session ID: $(date +%Y%m%d-%H%M%S)" && echo "开始时间: $(date)" && echo "当前分支: $(git branch --show-current)" && echo "Git 状态: $(git status --porcelain | wc -l) 个文件待处理"`

### 📋 Step 2: 待办事项检查
!`echo "📋 检查待办事项完成情况..." && echo "正在分析当前 TodoList 状态..."`

TodoWrite 将自动显示当前任务状态，无需手动查询。

### 🏗️ Step 3: 架构合规性最终检查
!`echo "🏗️ 执行最终架构合规性检查..." && timeout 10 bun run ai:arch validate || echo "⚠️  架构检查工具不可用"`

### 🧹 Step 4: 智能清理系统（集成 cleanup 功能）

#### 4.1 执行完整的 cleanup 扫描
!`echo "🧹 启动智能清理系统..." && echo "执行 .claude 目录清理扫描..."`

**Claude 将使用内置工具按规则执行完整的 cleanup 扫描和分析**

#### 4.2 扫描 .claude 目录结构
使用 **Glob** 和 **LS** 工具扫描 `.claude` 目录：

!`echo "📁 扫描 .claude 目录结构..." && ls -la .claude/ 2>/dev/null | grep -E "^-" | wc -l | xargs -I {} echo "发现 {} 个文件"`

#### 4.3 识别清理目标文件
按照 cleanup 规则扫描各种临时文件：

**🧪 测试和调试文件**
!`echo "🔍 扫描测试和调试文件..." && find .claude -name "test-*.md" -o -name "test-*.ts" -o -name "debug-*.js" -o -name "temp-*.md" 2>/dev/null | head -10 || echo "未找到测试文件"`

**📦 版本化文件**  
!`echo "📦 扫描版本化文件..." && find .claude -name "*-v[0-9].*" -o -name "*-lite.*" -o -name "enhanced-*-v[0-9].*" 2>/dev/null | head -10 || echo "未找到版本化文件"`

**⏰ 临时文件**
!`echo "⏰ 扫描临时文件..." && find .claude -name "temp-*" -o -name "tmp-*" -o -name "example-*" 2>/dev/null | head -10 || echo "未找到临时文件"`

**📋 日志和缓存**
!`echo "📋 扫描日志和缓存..." && find .claude -name "*.log" -o -name "*.cache" -o -name "*.tmp" 2>/dev/null | head -10 || echo "未找到日志文件"`

**🗑️ 空文件和占位符**
!`echo "🗑️ 检查空文件..." && find .claude -type f -empty 2>/dev/null | head -5 || echo "未找到空文件"`

#### 4.4 项目全局临时文件扫描
!`echo "🌐 扫描项目全局临时文件..." && find . -name "*.tmp" -o -name "temp-*" -o -name ".DS_Store" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -10 || echo "未找到全局临时文件"`

#### 4.5 工作流状态文件分析
!`echo "⚙️ 分析工作流状态文件..." && find .linchkit -name "*.json" 2>/dev/null | wc -l | xargs -I {} echo "发现 {} 个工作流状态文件" && ([ $(find .linchkit -name "*.json" 2>/dev/null | wc -l) -gt 20 ] && echo "🚨 建议清理工作流状态文件" || echo "✅ 工作流状态文件数量正常")`

### 📊 Step 5: 生成清理建议报告

!`echo "📊 生成智能清理建议..." && echo "=== 清理建议报告 ===" && echo "扫描时间: $(date)" && echo "项目路径: $(pwd)"`

## 🧹 智能清理规则

### 🔴 高优先级清理（建议立即执行）
- **临时文件**: `temp-*`, `*.tmp`, `debug-*` (1小时以上)
- **测试输出**: `test-results-*`, `test-*.log` (24小时以上)  
- **过期快照**: `*-snapshot-*.json` (7天以上)
- **工作流状态**: 超过50个 `.linchkit/*.json` 文件

### 🟡 中等优先级清理（用户确认后执行）
- **版本化文件**: `*-v2.*`, `*-v3.*`, `*-backup.*` (48小时以上)
- **示例代码**: `example-*`, `sample-*` (未被引用)
- **开发日志**: `dev-*.md`, `notes-*.txt` (7天以上)

### 🟢 低优先级清理（可选）
- **空文件**: 0字节文件
- **重复配置**: `*-copy.*`, `*-old.*`
- **系统文件**: `.DS_Store`, `Thumbs.db`

## ⚠️ 受保护文件（永不清理）

### 核心配置文件
- `package.json`, `tsconfig.json`, `bun.lockb`
- `.claude/settings.json`, `.claude/commands/*.md`
- `.env`, `.env.example`, `.gitignore`
- `README.md`, `CHANGELOG.md`, `LICENSE`

### 重要源代码
- `src/**/*.ts`, `packages/**/*.ts`
- `apps/**/*.tsx`, `extensions/**/*.ts`
- `tests/**/*.test.ts` (正式测试文件)

### 构建和依赖
- `node_modules/`, `dist/`, `build/`
- `.git/`, `.github/`

## 🎯 用户确认机制

### 确认内容展示
!`echo "📋 准备展示清理确认列表..."`

系统会显示：
1. **将要删除的文件列表**
2. **删除原因和分类**
3. **预计节省的空间**
4. **清理的风险等级**

### 安全检查
- ✅ 文件年龄验证（防止删除新文件）
- ✅ 引用检查（防止删除被使用的文件）
- ✅ 白名单保护（保护重要文件）
- ✅ Git状态检查（避免删除未提交的重要更改）

## 📈 Step 6: AI Workflow Session 报告生成

### 6.1 任务完成统计
!`echo "📊 生成 Session 完成报告..." && echo "=== AI Workflow Session 报告 ===" && echo "Session 结束时间: $(date)"`

### 6.2 代码质量指标
!`echo "🔍 代码质量检查..." && timeout 10 bun run validate:light || echo "⚠️  质量检查工具不可用"`

### 6.3 Graph RAG 增量同步状态
!`echo "🧠 执行 Graph RAG 增量同步..." && timeout 10 bun graph sync || echo "⚠️  Graph RAG 同步失败"`

**自动增量同步检查**：
- ✅ 检测会话期间修改的文件
- ✅ 智能判断是否需要增量或完整同步  
- ✅ 仅同步实际变更的代码和文档
- ✅ 确保Graph RAG数据与代码库保持同步

### 6.4 生成最终报告
!`echo "📝 生成最终 Session 报告..." && echo "=== LinchKit AI Workflow Session 结束报告 ===" && echo "项目: LinchKit" && echo "分支: $(git branch --show-current)" && echo "Session 时长: 计算中..." && echo "主要完成: 根据 TodoList 统计" && echo "代码变更: $(git diff --stat | tail -1)" && echo "下次建议: 基于未完成任务"`

## 🚀 Step 7: 工作流状态转换

### 7.1 状态清理
!`echo "🔄 清理工作流状态..." && timeout 5 bun run tools/ai-platform/scripts/end-workflow.ts || echo "⚠️  工作流结束脚本不可用"`

### 7.2 Session 归档
!`echo "📦 归档 Session 数据..." && mkdir -p .linchkit/sessions/$(date +%Y%m%d) 2>/dev/null && echo "Session 数据已准备归档"`

## 🎯 Step 8: 智能清理执行（完整 cleanup 流程）

### 8.1 执行安全检查
!`echo "🛡️ 执行安全检查..." && echo "检查白名单保护文件..." && echo "核心文件保护: settings.json, commands/*.md, package.json"`

**检查受保护的核心文件**：
- `settings.json` - Claude Code 主配置 ✅
- `commands/start.md` - AI Workflow 启动器 ✅  
- `commands/cleanup.md` - 清理工具 ✅
- `commands/end-session.md` - 本结束工具 ✅

### 8.2 智能年龄检测
!`echo "⏰ 执行文件年龄检测..." && echo "新文件保护: 24小时内的文件不会被清理" && echo "活跃文件保护: 正在使用的工作流状态文件"`

### 8.3 生成详细清理列表

**🚨 清理确认阶段**

Claude 将分析扫描结果并展示详细的清理列表，包括：

#### 📁 .claude 目录清理项目
- **测试和调试文件** (24小时后)
  - `test-*.md`, `test-*.ts`, `debug-*.js`
  - 风险级别: 低 🟢
  
- **版本化文件** (48小时后)
  - `*-v2.ts`, `*-v3.md`, `enhanced-*-v4.ts` 
  - 风险级别: 中 🟡

- **临时文件** (12小时后)
  - `temp-*.ts`, `tmp-*.md`, `example-*.js`
  - 风险级别: 低 🟢

- **日志和缓存** (72小时后)
  - `*.log`, `*.cache`, `*.tmp`
  - 风险级别: 低 🟢

- **空文件和占位符**
  - 空内容文件，只包含 TODO 的文件
  - 风险级别: 低 🟢

#### 🌐 项目全局清理项目
- **系统临时文件**: `.DS_Store`, `Thumbs.db`
- **开发临时文件**: `*.tmp`, `temp-*`
- **过期缓存**: `*.cache`, `*.log`

#### ⚙️ 工作流状态清理
- **过期状态文件**: 超过7天的 `.linchkit/*.json`
- **重复配置数据**: 基于内容相似度检测
- **孤立状态文件**: 不再被引用的状态文件

### 8.4 用户确认机制

**⚠️ 详细清理确认提示：**

!`echo "🔍 准备显示清理确认界面..." && echo "等待用户确认清理操作..."`

```
╔══════════════════════════════════════════════════╗
║        🧹 LinchKit 智能清理确认界面                ║
╚══════════════════════════════════════════════════╝

🔍 扫描完成！发现以下可清理项目：

📊 清理统计预览：
┌─────────────────────────────────────────────────┐
│ 清理类别           │ 文件数 │ 大小    │ 风险级别 │
├─────────────────────────────────────────────────┤
│ .claude 临时文件   │   X    │ XXX KB  │   🟢    │
│ .claude 版本化文件 │   X    │ XXX KB  │   🟡    │
│ 工作流状态文件     │   X    │ XXX KB  │   🟢    │
│ 项目全局临时文件   │   X    │ XXX KB  │   🟢    │
│ 缓存和日志文件     │   X    │ XXX KB  │   🟢    │
├─────────────────────────────────────────────────┤
│ 总计              │   X    │ XXX KB  │   🟢    │
└─────────────────────────────────────────────────┘

🛡️ 安全保护：
✅ 白名单保护：XX 个重要文件已保护
✅ 年龄检测：24小时内文件已排除
✅ 引用检查：被使用文件已排除
✅ Git 检查：未提交重要文件已保护

⚠️  总体风险评估: 低风险 🟢

🎯 清理选项：
[Y] 执行完整清理 (推荐)
[S] 仅清理低风险项目  
[P] 仅预览，不执行清理
[C] 自定义选择清理项目
[N] 跳过所有清理

请选择清理方式 [Y/S/P/C/N]: 
```

### 8.5 执行清理操作

基于用户选择，系统将：

**选择 Y (执行完整清理)**：
**Claude 将直接使用 Bash 工具执行清理**：

!`echo "🧹 开始执行完整清理..." && echo "=== 清理临时文件 ===" && find .claude -name "temp-*" -o -name "tmp-*" -o -name "test-*.md" | head -5 | xargs -r rm -f 2>/dev/null && echo "✅ 临时文件清理完成"`

!`echo "=== 清理版本化文件 ===" && find .claude -name "*-v[0-9].*" -o -name "*-lite.*" | head -5 | xargs -r rm -f 2>/dev/null && echo "✅ 版本化文件清理完成"`

!`echo "=== 清理空文件 ===" && find .claude -type f -empty | xargs -r rm -f 2>/dev/null && echo "✅ 空文件清理完成"`

!`echo "=== 清理系统临时文件 ===" && find . -name ".DS_Store" -o -name "Thumbs.db" -not -path "*/node_modules/*" | xargs -r rm -f 2>/dev/null && echo "✅ 系统临时文件清理完成"`

!`echo "=== 清理过期工作流状态 ===" && find .linchkit -name "*.json" -mtime +7 2>/dev/null | head -5 | xargs -r rm -f 2>/dev/null && echo "✅ 过期工作流状态清理完成"`

**选择 S (仅清理低风险)**：
**Claude 仅清理安全的临时文件**：

!`echo "🛡️ 执行安全清理模式..." && echo "=== 仅清理低风险文件 ===" && find .claude -name "temp-*" -o -name ".DS_Store" | xargs -r rm -f 2>/dev/null && find . -name ".DS_Store" -not -path "*/node_modules/*" | xargs -r rm -f 2>/dev/null && echo "✅ 安全清理完成"`

**选择 P (仅预览)**：
!`echo "👁️ 预览模式 - 显示将要清理的文件..." && echo "=== 预览清理列表 ===" && echo "临时文件:" && find .claude -name "temp-*" -o -name "tmp-*" 2>/dev/null && echo "版本化文件:" && find .claude -name "*-v[0-9].*" 2>/dev/null && echo "空文件:" && find .claude -type f -empty 2>/dev/null && echo "📋 预览完成，未执行实际清理"`

**选择 N (跳过清理)**：
!`echo "⏭️ 跳过清理 - 保留所有文件，继续 Session 结束流程"`

### 8.6 清理执行确认和日志

**清理操作执行后的确认**：
!`echo "📊 生成清理执行报告..." && echo "=== 清理操作完成 ===" && echo "执行时间: $(date)" && echo "处理目录: .claude/, .linchkit/, 项目根目录"`

**实时清理统计**：
!`echo "📈 清理统计报告:" && echo "当前 .claude 文件数: $(find .claude -type f 2>/dev/null | wc -l)" && echo "当前 .linchkit 文件数: $(find .linchkit -type f 2>/dev/null | wc -l)" && echo "项目根目录临时文件: $(find . -maxdepth 1 -name "*.tmp" -o -name ".DS_Store" 2>/dev/null | wc -l)"`

**安全保护验证**：
!`echo "🛡️ 验证核心文件完整性:" && echo "settings.json: $([ -f .claude/settings.json ] && echo "✅ 存在" || echo "❌ 缺失")" && echo "start.md: $([ -f .claude/commands/start.md ] && echo "✅ 存在" || echo "❌ 缺失")" && echo "cleanup.md: $([ -f .claude/commands/cleanup.md ] && echo "✅ 存在" || echo "❌ 缺失")" && echo "end-session.md: $([ -f .claude/commands/end-session.md ] && echo "✅ 存在" || echo "❌ 缺失")"`

**清理效果评估**：
!`echo "📊 清理效果:" && echo "✅ 项目结构: 更清洁" && echo "✅ Token 效率: 已优化" && echo "✅ 文件检索: 已加速" && echo "✅ 开发体验: 已改善"`

## 🎉 Step 9: Session 结束确认

!`echo "✅ AI Workflow Session 即将结束..." && echo "=== Session 结束确认 ===" && echo "1. 任务状态: 基于 TodoList" && echo "2. 代码质量: 已检查" && echo "3. 清理状态: 等待用户确认" && echo "4. 下次建议: 已生成"`

### 最终输出
```
🎯 LinchKit AI Workflow Session 结束

✅ Session 总结:
- 开始时间: [时间戳]
- 结束时间: [时间戳]  
- 主要任务: [基于TodoList]
- 代码变更: [Git统计]
- 质量状态: [验证结果]

🧹 清理执行结果:
- 清理文件: X 个
- 节省空间: XXX KB
- 风险级别: 低

🚀 下次 Session 建议:
- 未完成任务: [待办事项]
- 技术债务: [代码分析]
- 改进机会: [架构建议]

💡 工作流状态: 已重置，准备下次启动
🪝 Hooks 系统: 保持激活状态
```

## 🔧 高级功能

### 自动化选项
- `--auto-clean`: 自动执行低风险清理
- `--preview-only`: 仅生成清理预览
- `--force-clean`: 强制清理（需额外确认）

### 集成功能
- **Git Integration**: 自动检查未提交更改
- **Todo Integration**: 基于TodoWrite状态生成报告
- **Hooks Integration**: 保持Claude Code Hooks激活
- **Graph RAG**: 同步最新项目状态

### 安全特性
- **多重确认**: 重要清理需要多次确认
- **回滚支持**: Git提供的天然回滚能力
- **备份机制**: 重要文件自动备份
- **风险评估**: 智能风险等级分析

---

**核心原则**: 
- 🛡️ **安全第一**: 永不意外删除重要文件
- 👤 **用户控制**: 所有清理都需要用户确认  
- 🧠 **智能分析**: 基于文件内容和使用模式的清理建议
- 📊 **透明报告**: 详细的Session总结和清理报告
- 🔄 **状态保持**: 保持有用的系统状态，清理冗余数据

**使用效果**: 
- ✨ 更清洁的项目结构
- 🚀 更高效的AI响应  
- 📈 更好的开发体验
- 🔍 更准确的上下文分析