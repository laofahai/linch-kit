# LinchKit AI开发工作流 - Claude Code 使用指南

**项目版本**: v2.0.3 AI原生工作流  
**状态**: ✅ 完全可用 - 8个Guardian工具集群已集成到/start命令  
**最后更新**: 2025-07-14 11:06 - Guardian集成完成

## 🚀 快速开始

### `/start` 命令使用方法

LinchKit的`/start`命令已经**完全可用**，提供了完整的AI原生开发工作流支持和8个Guardian智能体集群实时保护：

```bash
# 基础语法
/start [任务描述]

# 实际使用示例
/start 开发用户认证功能
/start 重构UI组件库架构  
/start 实现博客扩展功能
/start 修复安全漏洞
/start 添加数据库迁移工具
```

## 🛡️ AI Guardian智能体集群

`/start`命令会自动激活8个Guardian智能体进行全方位监控：

### 🏗️ 已部署的Guardian工具

| Guardian | 功能 | CLI命令 | 状态 |
|----------|------|---------|------|
| **Arch-Warden** | 架构合规检查 | `bun run arch:check` | ✅ 100/100分 - 已集成 |
| **Meta-Learner** | AI行为学习 | `bun run meta:monitor` | ✅ 运行中 - 已集成 |
| **Context Verifier** | 上下文一致性 | `bun run context:verify` | ✅ 0%漂移 - 已集成 |
| **Security Sentinel** | 安全威胁检测 | `bun run security:scan` | ✅ 威胁扫描 - 已集成 |
| **QA Synthesizer** | 测试生成 | `bun run qa:generate` | ✅ Schema驱动 - 已集成 |
| **Decision Council** | 多Agent决策 | `bun run council:decide` | ✅ 决策支持 - 已集成 |
| **Evolution Engine** | 系统进化 | `bun run evolution:assess` | ✅ 进化检测 - 已集成 |

### 🔧 Guardian CLI命令速查

```bash
# 架构检查
bun run arch:check          # 检查架构合规性
bun run arch:enforce        # 强制架构约束

# AI学习监控  
bun run meta:monitor        # 启动行为监控
bun run meta:analyze        # 分析学习模式
bun run meta:report         # 生成学习报告

# 上下文验证
bun run context:verify      # 验证理解一致性
bun run context:drift       # 检查语义漂移

# 安全防护
bun run security:scan       # 扫描安全威胁
bun run security:audit      # 完整安全审计

# 质量合成
bun run qa:generate         # 生成测试用例
bun run qa:batch           # 批量测试生成

# 决策支持
bun run council:decide      # 复杂决策分析
bun run council:analyze     # 决策风险评估

# 系统进化
bun run evolution:assess    # 评估演进需求
bun run evolution:evolve    # 执行自我进化
```

## 🔄 `/start` 执行流程

当您运行`/start [任务]`时，系统会自动执行以下流程：

### 📋 第1步：强制约束加载
- ✅ 读取 `Essential_Rules.md` 核心约束
- ✅ 读取 `CLAUDE.md` AI行为规范  
- ✅ 读取 `manifest.json` 知识库索引
- ✅ Claude AI强制声明遵守约束

### 📋 第2步：智能任务分析
- 🧠 AI智能提取任务关键词
- 📊 任务复杂度评估 (T1/T2/T3)
- 📚 基于复杂度智能加载相关文档

### 📋 第3步：项目上下文同步
- 🔍 Graph RAG知识图谱查询
- 📦 现有包功能复用检查
- 🏗️ 架构依赖关系验证

### 📋 第4步：Guardian自动监控
- 🛡️ 8个Guardian工具自动激活
- 📊 实时质量监控启动
- 🔒 安全威胁防护开启

### 📋 第5步：任务追踪创建
- 📝 TodoWrite自动创建任务
- 📈 进度监控机制激活
- 📋 Session日志记录

## 🎯 实际使用场景

### 🔧 功能开发场景
```bash
/start 实现OAuth2认证功能

# 系统会自动：
# 1. 查询现有@linch-kit/auth包功能
# 2. 检查是否有类似实现
# 3. 验证架构层级dependencies
# 4. 生成安全性检查报告
# 5. 创建测试用例建议
```

### 🏗️ 架构重构场景
```bash
/start 重构扩展系统架构

# 系统会自动：
# 1. Decision Council多Agent协商
# 2. Arch-Warden架构影响分析
# 3. Evolution Engine进化路径规划
# 4. Security Sentinel安全评估
# 5. 生成详细重构计划
```

### 🐛 问题修复场景
```bash
/start 修复性能瓶颈问题

# 系统会自动：
# 1. Meta-Learner分析历史修复模式
# 2. QA Synthesizer生成性能测试
# 3. Context Verifier验证问题理解
# 4. 提供优化建议和方案
```

## 📊 质量保证机制

### 🔴 零容忍约束 (自动强制)
- ❌ 禁止在保护分支工作 → 自动检查并阻止
- ❌ 禁止重复实现现有功能 → Graph RAG自动检测
- ❌ 禁止TypeScript类型逃逸 → 编译时强制检查
- ❌ 禁止跳过架构约束 → Arch-Warden实时监控

### ✅ 自动验证机制
- 🏗️ **架构合规性**: 100/100分自动评分
- 🧠 **AI理解一致性**: 0%漂移实时监控  
- 🔒 **代码安全性**: 9种威胁类型覆盖
- 📊 **测试覆盖率**: Schema驱动自动生成

## 🎪 高级功能

### 🤝 AI协作触发
当任务复杂度高时，系统会自动建议多AI协作：

```bash
# 自动触发条件
/start 设计新的微服务架构   # → 建议Gemini协商
/start 选择数据库技术方案   # → 建议多模型分析
/start 制定安全策略       # → 建议Decision Council
```

### 🔄 智能包复用
系统会智能分析任务并提供复用建议：

```bash
# 示例：开发认证功能
/start 添加JWT认证

# AI会自动：
# 1. 检测到@linch-kit/auth包已有JWT实现
# 2. 建议扩展现有功能而非重新实现  
# 3. 提供具体的集成方案
# 4. 生成兼容性测试
```

### 📈 进化学习
Meta-Learner会持续学习项目模式：

```bash
# 每周自动分析
bun run meta:report

# 输出示例：
# ✅ 成功模式：组件先写接口再实现
# ⚠️ 风险模式：跳过测试直接部署  
# 💡 优化建议：增加E2E测试覆盖
```

## 🚨 故障处理

### Graph RAG查询失败
```bash
# 如果看到错误：
# "🚨 FATAL: Graph RAG查询失败"

# 解决方案：
1. 检查Neo4j服务状态
2. 重新初始化AI Session: bun run ai:session init
3. 手动同步知识图谱: bun run ai:session sync
```

### 分支保护错误
```bash
# 如果看到错误：
# "❌ 错误：不能在保护分支 main 上工作"

# 解决方案：
/new-branch feature/your-task-name
# 然后重新运行 /start
```

## 📋 命令速查表

### 核心开发命令
```bash
/start [任务]              # 启动AI原生开发流程
/new-branch [功能名]       # 创建功能分支
/end-session              # 结束开发会话
/status                   # 查看项目状态
```

### Guardian监控命令
```bash
/arch-check              # 快速架构检查
/security-check          # 快速安全检查  
/context-verify          # 验证AI理解
/qa-synthesize           # 生成测试用例
```

### AI工具命令
```bash
/query [关键词]          # Graph RAG查询
/smart-load [任务]       # 智能文档加载
/decision-council [问题] # 多Agent决策支持
```

## 🔗 相关文档

- 📋 [Essential_Rules.md](../ai-context/00_Getting_Started/03_Essential_Rules.md) - 核心开发约束
- 🧠 [CLAUDE.md](../CLAUDE.md) - AI助手指令
- 🏗️ [Development_Workflow.md](../ai-context/02_Guides/01_Development_Workflow.md) - 详细开发流程
- 🛡️ [AI_Guardian_Implementation_Phases.md](../ai-context/02_Guides/13_AI_Guardian_Implementation_Phases.md) - Guardian实施指南

---

**核心原则**: 遵循约束，Graph RAG查询优先，Guardian监控保护，质量至上。

**使用建议**: 每次开发新功能前运行`/start [任务描述]`，让AI Guardian智能体集群为您的开发保驾护航！