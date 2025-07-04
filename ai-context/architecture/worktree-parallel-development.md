# LinchKit Worktree 并行开发最佳实践

**版本**: v1.0  
**创建**: 2025-07-04  
**维护**: AI Assistant  
**状态**: ✅ 发布

## 🎯 概述

Worktree并行开发是LinchKit项目支持多feature同时开发的核心策略。通过Git Worktree技术，我们实现了真正的并行开发环境，避免了频繁分支切换的开销和上下文丢失。

## 🏗️ 当前架构分析

### 现有Worktree结构
```
/home/laofahai/workspace/linch-kit/              # 主仓库 (main)
├── .claude/settings.local.json                  # 项目级Claude配置
└── worktrees/                                    # Worktree集中管理目录
    ├── ai-context-optimization/                  # AI上下文优化 (feature/ai-context-optimization)
    └── test-coverage-packages-modules/           # 测试覆盖率 (feature/test-coverage-packages-modules)
```

### 项目技术栈
- **Monorepo**: Turbo + bun 管理
- **包结构**: packages/ + apps/ + modules/
- **开发工具**: Claude Code + AI辅助开发
- **版本控制**: Git + GitHub

## 📋 Worktree管理策略

### 1. 目录结构规范

```
linch-kit/                                       # 主仓库
├── .claude/                                     # 📁 项目级Claude配置 (共享)
│   └── settings.local.json                     # Claude权限和工具配置
├── .git/                                        # Git主仓库
├── worktrees/                                   # 🎯 Worktree集中管理目录
│   ├── feature-name/                           # 功能开发worktree
│   ├── hotfix-issue-123/                       # 紧急修复worktree
│   ├── experiment-new-tech/                    # 实验性开发worktree
│   └── docs-update/                            # 文档更新worktree
├── packages/                                    # 核心包代码
├── apps/                                        # 应用代码
└── modules/                                     # 模块代码
```

### 2. 命名规范

#### Worktree目录命名
```bash
# 功能开发
feature-<功能名称>/                    # feature-user-auth
feature-<模块>-<功能>/                 # feature-console-dashboard

# Bug修复
fix-<问题描述>/                        # fix-memory-leak
hotfix-<紧急问题>/                     # hotfix-security-patch

# 实验性开发
experiment-<技术名称>/                 # experiment-react19
poc-<概念验证>/                        # poc-ai-integration

# 文档和维护
docs-<文档类型>/                       # docs-api-reference
chore-<维护任务>/                      # chore-dependency-update

# AI相关
ai-<AI任务类型>/                       # ai-context-optimization
```

#### 分支命名
```bash
# 与worktree目录保持一致
feature/user-auth
feature/console-dashboard
fix/memory-leak
hotfix/security-patch
experiment/react19
docs/api-reference
ai/context-optimization
```

### 3. Worktree生命周期管理

#### 创建Worktree
```bash
# 1. 创建并切换到新分支
cd /home/laofahai/workspace/linch-kit
git checkout -b feature/new-feature

# 2. 创建worktree
git worktree add worktrees/feature-new-feature

# 3. 进入worktree开始开发
cd worktrees/feature-new-feature
```

#### 开发阶段
```bash
# 定期同步主分支更新
git fetch origin
git rebase origin/main

# 提交变更
git add .
git commit -m "feat: implement new feature"
git push origin feature/new-feature
```

#### 清理Worktree
```bash
# 1. 删除worktree目录
git worktree remove worktrees/feature-new-feature

# 2. 删除远程分支（如果已合并）
git push origin --delete feature/new-feature

# 3. 删除本地分支
git branch -d feature/new-feature
```

## 🔧 .claude目录配置策略

### 配置共享模式

基于分析，LinchKit采用**项目级配置共享**模式：

```
主仓库/.claude/settings.local.json     ← 所有worktree共享此配置
├── worktree1/                          ← 继承主仓库配置
├── worktree2/                          ← 继承主仓库配置  
└── worktree3/                          ← 继承主仓库配置
```

### 配置共享的优势
- ✅ **一致性保证** - 所有worktree使用相同的Claude权限配置
- ✅ **维护简便** - 只需维护一份配置文件
- ✅ **工具统一** - 确保所有开发环境使用相同的工具链
- ✅ **权限同步** - 新增权限自动应用到所有worktree

### 关键配置内容分析

根据现有`settings.local.json`，核心配置包括：

```json
{
  "permissions": {
    "allow": [
      "Bash(bun install:*)",           // bun包管理
      "Bash(git worktree:*)",          // worktree管理
      "Bash(pnpm:*)",                  // 包管理备用
      "WebFetch(domain:*)",            // 文档查询
      "mcp__context7__*"               // Context7 AI工具集成
    ]
  }
}
```

### .claude目录最佳实践

#### 1. 项目级配置（推荐）
```bash
# 主仓库配置 - 所有worktree共享
linch-kit/.claude/settings.local.json
```

#### 2. Worktree特定配置（特殊场景）
```bash
# 仅在需要特殊权限时使用
worktrees/experiment-dangerous/.claude/settings.local.json
```

#### 3. 全局配置继承
```bash
# 用户级全局配置
~/.claude/CLAUDE.md                    # 全局Claude指令
```

## 🤖 AI协作最佳实践

### 1. 上下文同步策略

#### AI-Context目录共享
```bash
# 所有worktree共享相同的ai-context
主仓库/ai-context/                      ← 单一真实来源
├── manifest.json                       # 项目元数据索引
├── core/                              # 核心约束和工作流
├── architecture/                      # 系统架构设计
└── reference/                         # 技术参考文档
```

#### Session连续性保障
- **TodoRead/TodoWrite** - 跨worktree任务状态同步
- **CLAUDE.md** - 统一的AI协作指令
- **manifest.json** - 一致的文档索引

### 2. 并行开发协调

#### 冲突预防机制
```bash
# 定期同步主分支
cd worktrees/feature-a
git fetch origin
git rebase origin/main

# 检查依赖包变更
bun install
bun build
```

#### 跨worktree通信
```bash
# 使用共享的changelog记录影响
echo "feat(auth): add JWT support - affects packages/auth" >> ai-context/history/changelog.md

# 更新架构文档
vi ai-context/architecture/core_packages.md
```

### 3. AI助手切换流程

#### 标准切换步骤
```bash
# 1. 当前worktree收尾
git add . && git commit -m "wip: save progress"

# 2. 切换到目标worktree
cd ../worktrees/other-feature

# 3. 启动Claude并恢复上下文
claude --resume
# 或手动提供上下文
```

#### 上下文传递模板
```
切换到 [worktree名称] 继续 [任务描述]。

当前状态：
- 上个worktree: [上个任务状态]
- 当前分支: [分支名称]
- 主要任务: [具体任务内容]

请继续从 [具体步骤] 开始。
```

## 🔄 并行开发工作流

### 1. 多功能并行开发

```bash
# 同时开发3个功能
worktrees/
├── feature-auth-system/        # 开发者A - 认证系统
├── feature-dashboard-ui/       # 开发者B - 仪表盘UI  
└── feature-api-optimization/   # 开发者C - API优化
```

### 2. 实验性开发隔离

```bash
# 实验新技术而不影响主开发
worktrees/
├── experiment-react19/         # React 19 迁移测试
├── experiment-bun-runtime/     # Bun运行时测试
└── poc-ai-code-generation/     # AI代码生成概念验证
```

### 3. 紧急修复响应

```bash
# 生产问题快速响应
git worktree add worktrees/hotfix-critical-bug
cd worktrees/hotfix-critical-bug
# 快速修复，独立验证，快速部署
```

## 📊 依赖管理策略

### 1. 包依赖同步

```bash
# 每个worktree定期同步依赖
bun install                     # 同步package.json
bun run build                   # 验证构建
bun run test                    # 运行测试
```

### 2. Monorepo内部依赖

```bash
# 架构依赖顺序检查
core → schema → auth → crud → trpc → ui → console

# 使用turbo进行依赖构建
bunx turbo build --filter=@linch-kit/core
```

### 3. 冲突解决机制

```bash
# 依赖冲突检测
bun run validate               # 全项目验证
bun run lint                   # 代码质量检查
bun run type-check             # 类型检查
```

## 🛠️ 自动化工具集成

### 1. Claude Code集成

```bash
# 在任意worktree中启动Claude
cd worktrees/any-feature
claude                         # 自动读取项目配置
```

### 2. AI工具链配置

```json
{
  "tools": {
    "context7": "实时文档查询",
    "web-search": "技术资料搜索", 
    "ai-context": "项目上下文管理"
  }
}
```

### 3. 开发环境验证

```bash
# Worktree环境检查脚本
#!/bin/bash
echo "🔍 检查worktree开发环境..."
bun --version
git status
echo "📋 AI-Context状态: $(ls -la ai-context/)"
echo "🎯 Claude配置: $(ls -la .claude/)"
```

## 📋 最佳实践清单

### ✅ Worktree创建
- [ ] 使用标准命名规范
- [ ] 创建对应的远程分支
- [ ] 验证.claude配置继承
- [ ] 确认ai-context可访问

### ✅ 并行开发
- [ ] 定期同步主分支更新  
- [ ] 遵循包依赖顺序
- [ ] 更新共享文档
- [ ] 运行完整测试套件

### ✅ AI协作
- [ ] 使用统一的Session模板
- [ ] 维护TodoWrite任务状态
- [ ] 更新ai-context文档
- [ ] 跨worktree上下文同步

### ✅ 分支合并
- [ ] 代码审查通过
- [ ] CI/CD流水线成功
- [ ] 文档同步更新
- [ ] 清理worktree环境

## 🔍 故障排除

### 常见问题

#### 1. .claude配置不生效
```bash
# 检查配置文件路径
ls -la .claude/settings.local.json

# 重启Claude Code
claude --reset
```

#### 2. AI上下文丢失
```bash
# 验证ai-context目录
ls -la ai-context/manifest.json

# 手动重建索引
cd ai-context/tools
node scripts/context-tools.js --validate-manifest
```

#### 3. 依赖冲突
```bash
# 清理并重新安装
rm -rf node_modules bun.lock
bun install
bun run build
```

#### 4. Worktree同步问题
```bash
# 强制同步
git fetch --all
git reset --hard origin/main
```

## 🚀 高级配置

### 1. 自动化Worktree管理

```bash
#!/bin/bash
# 创建worktree助手脚本
create_worktree() {
    local branch_name=$1
    local worktree_name=$2
    
    git checkout -b $branch_name
    git worktree add worktrees/$worktree_name
    cd worktrees/$worktree_name
    
    echo "🎉 Worktree $worktree_name 创建成功!"
    echo "📂 位置: $(pwd)"
    echo "🌿 分支: $branch_name"
}
```

### 2. AI协作自动化

```bash
# 自动上下文切换脚本
switch_ai_context() {
    local target_worktree=$1
    
    echo "🔄 切换到 $target_worktree"
    cd worktrees/$target_worktree
    
    echo "📖 加载AI上下文..."
    claude --resume --context="继续 $target_worktree 的开发工作"
}
```

### 3. 监控和报告

```bash
# Worktree状态报告
git worktree list
echo "📊 活跃worktree统计: $(git worktree list | wc -l)"
echo "🔍 待合并分支: $(git branch --no-merged main | wc -l)"
```

## 📚 相关资源

### 文档链接
- [Git Worktree官方文档](https://git-scm.com/docs/git-worktree)
- [AI-Context优化方案](./ai-context-optimization-plan.md)
- [Claude Code文档](https://docs.anthropic.com/claude/docs/claude-code)

### 内部工具
- [context-tools.js](../tools/scripts/context-tools.js)
- [doc-validator.js](../tools/validators/doc-validator.js)

---

*本文档提供了LinchKit项目的Worktree并行开发完整指南，确保团队能够高效、安全地进行并行开发，同时最大化AI辅助开发的效率。*