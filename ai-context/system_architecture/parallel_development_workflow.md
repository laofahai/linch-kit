# LinchKit 并行开发工作流 - Claude Code + Git Worktree 最佳实践

**版本**: v1.0  
**创建时间**: 2025-07-04  
**协作**: Claude + Gemini 联合制定

## 🎯 架构目标

为 LinchKit 项目建立一个高效、无冲突的并行开发模式，支持多个 AI 代理（Claude Code）和人类开发者同时工作在不同功能上。

## 🏗️ 核心架构

### 任务驱动的工作树模式 (Task-Driven Worktrees)

**核心理念**: 放弃"一个包一个工作树"，采用"**一个独立任务一个工作树**"模式。

#### 优势分析
- ✅ **避免依赖同步开销** - 每个工作树是完整的项目副本
- ✅ **支持跨包功能开发** - 一个任务可能涉及多个包
- ✅ **简化管理复杂度** - 减少工作树数量和维护成本
- ✅ **自然解决构建顺序** - turbo 自动处理依赖构建

## 🏛️ 项目结构设计

### 1. 工作树目录结构
```
linch-kit/                          # 主工作树
├── packages/                       # 核心包层
│   ├── core/                      # L0: 基础设施
│   ├── schema/                    # L1: Schema 引擎
│   ├── auth/                      # L2: 认证权限
│   ├── crud/                      # L2: CRUD 操作
│   ├── trpc/                      # L3: API 层
│   └── ui/                        # L3: UI 组件
├── modules/                        # 业务模块层
│   └── console/                   # L4: 管理控制台
├── apps/                          # 应用程序层
│   ├── demo-app/                  # L4: 演示应用
│   ├── starter/                   # L4: 启动模板
│   └── website/                   # L4: 文档网站
├── ai-context/                    # 文档系统
├── worktrees/                     # 工作树存储 (git ignored)
│   ├── auth-oidc-support/         # AI-1: 认证 OIDC 支持
│   ├── crud-batch-operations/     # AI-2: CRUD 批量操作
│   ├── ui-theme-system/           # AI-3: UI 主题系统
│   └── docs-api-reference/        # AI-4: API 文档更新
└── .gitignore                     # 包含 /worktrees
```

### 2. 分支策略设计
```
main                               # 稳定主干 (受保护)
├── integration                    # 集成测试分支
├── feature/auth/oidc-support      # 功能分支 (AI-1)
├── feature/crud/batch-ops         # 功能分支 (AI-2)
├── feature/ui/theme-system        # 功能分支 (AI-3)
└── docs/ai-context-updates        # 文档更新分支 (串行化)
```

## 🛠️ 技术实现方案

### 1. Git Worktree 设置策略

#### 项目初始化
```bash
# 1. 在根目录创建 .gitignore 条目
echo "/worktrees" >> .gitignore

# 2. 创建工作树目录
mkdir -p worktrees

# 3. 提交配置
git add .gitignore
git commit -m "feat: add worktrees support for parallel development"
```

#### AI 代理工作流程
```bash
# 1. 接收任务: 为 auth 包添加 OIDC 支持
TASK_NAME="auth-oidc-support"
BRANCH_NAME="feature/auth/oidc-support"

# 2. 创建工作树
git fetch origin
git worktree add -b $BRANCH_NAME ./worktrees/$TASK_NAME main

# 3. 进入工作树
cd ./worktrees/$TASK_NAME

# 4. 安装依赖
bun install

# 5. 开发循环
# - 编码
# - 测试: turbo test --filter=@linchkit/auth
# - 构建: turbo build --filter=@linchkit/auth
# - 同步: git fetch origin && git rebase origin/main

# 6. 完成任务
bun changeset add
git add .
git commit -m "feat(auth): add OIDC support"
git push --set-upstream origin $BRANCH_NAME

# 7. 清理 (任务完成后)
cd ../../
git worktree remove ./worktrees/$TASK_NAME
```

### 2. 依赖管理与构建协调

#### bun Workspace 自动协调
```bash
# 在每个工作树中，bun install 会：
# 1. 创建独立的 node_modules
# 2. 自动建立符号链接指向同一工作树下的其他包
# 3. 确保依赖版本一致性
# 4. 利用 bun 的高性能并行安装

# 示例: 在 worktrees/auth-oidc-support 中
bun install
# → node_modules/@linchkit/core -> ../../packages/core
# → node_modules/@linchkit/schema -> ../../packages/schema
```

#### Turbo 构建顺序管理
```bash
# Turbo 会分析 package.json 中的依赖关系
# 自动确保构建顺序: L0 → L1 → L2 → L3 → L4

# 构建单个包及其依赖
turbo build --filter=@linchkit/auth

# 测试包及其影响范围
turbo test --filter=...@linchkit/auth
```

### 3. 文档同步策略

#### ai-context 串行化更新
```bash
# 创建专用文档分支
git checkout -b docs/ai-context-updates main
git push -u origin docs/ai-context-updates

# AI 更新文档流程
# 1. 暂停当前任务
# 2. 切换到文档分支
git checkout docs/ai-context-updates
git pull origin docs/ai-context-updates

# 3. 更新文档
# 编辑 ai-context 文件...

# 4. 提交更新
git add ai-context/
git commit -m "docs(ai-context): update based on auth OIDC feature"
git push origin docs/ai-context-updates

# 5. 切换回任务分支
git checkout feature/auth/oidc-support
```

## 🚦 冲突避免与协调机制

### 1. 任务正交化原则
- **项目经理职责**: 确保分配给不同 AI 的任务在逻辑上解耦
- **范围声明**: AI 开始任务前必须声明工作范围
- **例外处理**: 发现冲突时立即暂停，等待人工介入

### 2. 频繁同步策略
```bash
# AI 代理定期同步主分支
git fetch origin
git rebase origin/main

# 如果遇到冲突，立即报告
if [ $? -ne 0 ]; then
    echo "CONFLICT DETECTED: 需要人工解决冲突"
    git rebase --abort
    exit 1
fi
```

### 3. 冲突解决流程
1. **自动检测**: Git 操作失败时自动报告
2. **人工介入**: 复杂冲突由人类开发者解决
3. **策略调整**: 根据冲突模式优化任务分配

## 🧪 测试与质量保证

### 1. 分层测试策略
```bash
# 包级测试
turbo test --filter=@linchkit/auth

# 依赖链测试
turbo test --filter=...@linchkit/auth

# 完整回归测试 (集成分支)
turbo test
```

### 2. 质量检查流程
```bash
# 代码质量检查
turbo lint --filter=@linchkit/auth

# 类型检查
turbo type-check --filter=@linchkit/auth

# 构建验证
turbo build
```

## 🚀 发布与部署

### 1. Changeset 管理
```bash
# AI 在功能分支中添加 changeset
bun changeset add

# 选择变更类型和包
# 生成 .changeset/*.md 文件
```

### 2. 发布流程
```bash
# 在 main 分支上执行 (仅限人工操作)
bun changeset version  # 更新版本号
bun install           # 更新 lockfile
git commit -m "chore: version packages"
bun changeset publish # 发布到 npm
git push --follow-tags
```

## 📋 操作检查清单

### AI 代理 - 任务开始
- [ ] 接收具体任务描述
- [ ] 确认任务范围和影响的包
- [ ] 创建工作树: `git worktree add -b feature/<scope>/<desc> ./worktrees/<task> main`
- [ ] 进入工作树: `cd ./worktrees/<task>`
- [ ] 安装依赖: `bun install`

### AI 代理 - 开发循环
- [ ] 编码实现功能
- [ ] 运行测试: `turbo test --filter=<package>`
- [ ] 运行构建: `turbo build --filter=<package>`
- [ ] 定期同步: `git fetch origin && git rebase origin/main`
- [ ] 处理冲突 (如有)

### AI 代理 - 任务完成
- [ ] 添加 changeset: `bun changeset add`
- [ ] 提交代码: `git commit -m "feat(<scope>): <description>"`
- [ ] 推送分支: `git push --set-upstream origin <branch>`
- [ ] 创建 Pull Request
- [ ] 等待代码审查和合并

### 项目管理 - 清理
- [ ] 审查并合并 PR
- [ ] 删除工作树: `git worktree remove ./worktrees/<task>`
- [ ] 删除分支: `git branch -d <branch>`

## 🔧 工具集成

### 1. IDE 支持
- **VS Code**: 每个工作树可以独立打开
- **WebStorm**: 支持多项目窗口
- **Claude Code**: 每个实例工作在独立的工作树中

### 2. 多设备工作流 + 多人协作支持

#### 工作状态同步策略

**核心理念**: 通过 Git 远程分支实现工作状态的无缝切换，让你可以在公司和家里的电脑之间自由切换开发环境。

#### 同步架构设计
```
个人工作流同步模式:
├── 远程 Git 仓库 (GitHub/GitLab)
│   ├── main                    # 主分支
│   ├── feature/task-x          # 工作分支 (自动推送)
│   └── personal/workspace      # 个人工作状态分支
├── 公司电脑
│   ├── linch-kit/              # 主工作树
│   └── worktrees/
│       └── task-x/             # 当前工作树
└── 家里电脑
    ├── linch-kit/              # 主工作树
    └── worktrees/
        └── task-x/             # 同步的工作树
```

#### 配置文件统一管理
```
.devcontainer/personal-config/   # 个人配置目录
├── environments/
│   ├── company.env             # 公司环境变量
│   ├── home.env                # 家庭环境变量
│   └── shared.env              # 通用环境变量
├── git-config/
│   ├── .gitconfig              # Git 个人配置
│   └── hooks/                  # 自动同步 hooks
├── bun-config/
│   └── .bunrc                  # Bun 配置
├── workspace-state/
│   ├── current-task.json       # 当前任务状态
│   ├── active-worktrees.json   # 活跃工作树列表
│   └── session-history.json    # 会话历史
└── scripts/
    ├── switch-device.sh        # 设备切换脚本
    ├── sync-workspace.sh       # 工作空间同步
    ├── pause-work.sh           # 暂停工作
    └── resume-work.sh          # 恢复工作
```

#### 个人工作流脚本 (Gemini 优化版本)

**🚨 关键改进**: 使用 **WIP 提交** 替代 git stash，确保跨设备同步的可靠性。

```bash
# .devcontainer/personal-config/scripts/pause-work.sh
#!/bin/bash
set -e

echo "⏸️  暂停当前工作..."

# 检查当前工作树状态
CURRENT_WORKTREE=$(pwd)
if [[ "$CURRENT_WORKTREE" == */worktrees/* ]]; then
    TASK_NAME=$(basename "$CURRENT_WORKTREE")
    echo "📍 当前工作树: $TASK_NAME"
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        echo "💾 发现未提交的更改，创建 WIP 提交..."
        
        # 创建 WIP 提交 (Gemini 推荐的方法)
        git add .
        WIP_MESSAGE="WIP: [$(hostname)] Pausing work on $TASK_NAME at $(date '+%Y-%m-%d %H:%M:%S')"
        git commit -m "$WIP_MESSAGE"
        
        echo "✅ WIP 提交已创建"
    else
        echo "📋 工作目录干净，无需 WIP 提交"
    fi
    
    # 推送到远程
    BRANCH_NAME=$(git branch --show-current)
    if git push origin "$BRANCH_NAME" 2>/dev/null; then
        echo "✅ 工作状态已推送到远程"
    else
        echo "⚠️  推送失败，可能是网络问题。WIP 提交已保存到本地。"
        echo "下次连接网络时请手动执行: git push origin $BRANCH_NAME"
    fi
    
    # 保存状态信息到主分支
    cd "$(git rev-parse --show-toplevel)"
    cat > .devcontainer/personal-config/workspace-state/current-task.json << EOF
{
    "taskName": "$TASK_NAME",
    "branchName": "$BRANCH_NAME",
    "worktreePath": "$CURRENT_WORKTREE",
    "pausedAt": "$(date -Iseconds)",
    "device": "$(hostname)",
    "hasWipCommit": true
}
EOF
    
    # 提交状态文件到 personal/workspace 分支
    if git show-ref --verify --quiet refs/heads/personal/workspace; then
        git checkout personal/workspace
    else
        git checkout -b personal/workspace
    fi
    
    git add .devcontainer/personal-config/workspace-state/current-task.json
    git commit -m "chore: save workspace state for $TASK_NAME" || echo "状态无变化"
    git push origin personal/workspace 2>/dev/null || echo "⚠️  状态推送失败，已保存到本地"
    
    echo "🎉 工作暂停完成"
else
    echo "⚠️  当前不在工作树目录中"
fi
```

```bash
# .devcontainer/personal-config/scripts/resume-work.sh
#!/bin/bash
set -e

echo "▶️  恢复工作..."

# 拉取最新的工作状态
git fetch origin 2>/dev/null || echo "⚠️  网络获取失败，使用本地状态"

# 切换到 personal/workspace 分支获取状态
if git show-ref --verify --quiet refs/remotes/origin/personal/workspace; then
    git checkout personal/workspace
    git pull origin personal/workspace 2>/dev/null || echo "使用本地状态"
fi

# 读取工作状态
if [ -f ".devcontainer/personal-config/workspace-state/current-task.json" ]; then
    TASK_NAME=$(jq -r '.taskName' .devcontainer/personal-config/workspace-state/current-task.json)
    BRANCH_NAME=$(jq -r '.branchName' .devcontainer/personal-config/workspace-state/current-task.json)
    PAUSED_AT=$(jq -r '.pausedAt' .devcontainer/personal-config/workspace-state/current-task.json)
    HAS_WIP=$(jq -r '.hasWipCommit // false' .devcontainer/personal-config/workspace-state/current-task.json)
    
    echo "📍 恢复任务: $TASK_NAME (暂停于: $PAUSED_AT)"
    
    # 检查工作树是否已存在
    if [ -d "worktrees/$TASK_NAME" ]; then
        echo "🔄 工作树已存在，同步最新代码..."
        cd "worktrees/$TASK_NAME"
        git fetch origin 2>/dev/null || echo "⚠️  无法获取远程更新"
        git checkout "$BRANCH_NAME"
        git pull origin "$BRANCH_NAME" 2>/dev/null || echo "使用本地版本"
    else
        echo "🆕 创建新工作树..."
        if git show-ref --verify --quiet refs/remotes/origin/"$BRANCH_NAME"; then
            git worktree add "./worktrees/$TASK_NAME" "origin/$BRANCH_NAME"
        else
            git worktree add -b "$BRANCH_NAME" "./worktrees/$TASK_NAME" main
        fi
        cd "worktrees/$TASK_NAME"
    fi
    
    # 处理 WIP 提交 (Gemini 推荐的恢复方法)
    if [ "$HAS_WIP" = "true" ]; then
        LAST_COMMIT_MSG=$(git log -1 --pretty=%B)
        if [[ "$LAST_COMMIT_MSG" == WIP:* ]]; then
            echo "🔄 检测到 WIP 提交，正在恢复工作状态..."
            
            # 撤销 WIP 提交但保留更改
            git reset HEAD~1 --soft  # 撤销提交，保留暂存区
            git reset                # 取消暂存，将更改放回工作目录
            
            echo "✅ WIP 提交已撤销，工作状态已恢复"
        fi
    fi
    
    # 安装/更新依赖
    echo "📦 检查依赖..."
    bun install
    
    echo "✅ 工作已恢复，当前目录: $(pwd)"
    echo "💡 使用 'git status' 查看工作状态"
    echo "💡 使用 'git log --oneline -5' 查看最近的提交"
else
    echo "❌ 未找到工作状态文件"
    echo "💡 请先运行 pause-work.sh 或手动创建任务"
fi
```

```bash
# .devcontainer/personal-config/scripts/switch-device.sh
#!/bin/bash
set -e

DEVICE_TYPE="$1"  # company 或 home

if [ -z "$DEVICE_TYPE" ]; then
    echo "用法: $0 [company|home]"
    exit 1
fi

echo "🔄 切换到 $DEVICE_TYPE 设备配置..."

# 加载对应环境变量
if [ -f ".devcontainer/personal-config/environments/$DEVICE_TYPE.env" ]; then
    source ".devcontainer/personal-config/environments/$DEVICE_TYPE.env"
    echo "✅ 已加载 $DEVICE_TYPE 环境配置"
fi

# 设置 Git 配置
if [ -f ".devcontainer/personal-config/git-config/.gitconfig" ]; then
    cp .devcontainer/personal-config/git-config/.gitconfig ~/.gitconfig
    
    # 根据设备调整 Git 配置
    case $DEVICE_TYPE in
        "company")
            git config --global user.email "${COMPANY_EMAIL:-developer@company.com}"
            git config --global core.sshCommand "ssh -i ~/.ssh/id_rsa_company"
            ;;
        "home")
            git config --global user.email "${HOME_EMAIL:-developer@personal.com}"
            git config --global core.sshCommand "ssh -i ~/.ssh/id_rsa_personal"
            ;;
    esac
    
    echo "✅ Git 配置已更新"
fi

# 同步 Bun 配置
if [ -f ".devcontainer/personal-config/bun-config/.bunrc" ]; then
    cp .devcontainer/personal-config/bun-config/.bunrc ~/.bunrc
    echo "✅ Bun 配置已同步"
fi

echo "🎉 设备切换完成"
```

#### 多人协作集成
```bash
# .devcontainer/personal-config/scripts/sync-workspace.sh
#!/bin/bash
set -e

echo "🌐 同步工作空间 (多人协作模式)..."

# 1. 同步主分支
git fetch origin main
echo "✅ 主分支已同步"

# 2. 检查其他团队成员的活跃分支
echo "📋 检查团队活跃分支..."
git fetch origin
ACTIVE_BRANCHES=$(git branch -r | grep -E "feature/|fix/" | head -10)
echo "当前活跃的功能分支:"
echo "$ACTIVE_BRANCHES"

# 3. 检查冲突风险
echo "⚠️  检查潜在冲突..."
CURRENT_BRANCH=$(git branch --show-current)
if [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    # 检查是否可以干净地合并
    git fetch origin main
    MERGE_BASE=$(git merge-base HEAD origin/main)
    CONFLICTS=$(git merge-tree $MERGE_BASE HEAD origin/main | grep "<<<<<<< " || true)
    
    if [ -n "$CONFLICTS" ]; then
        echo "🚨 检测到潜在合并冲突！"
        echo "建议在继续之前解决冲突或协调任务分配"
    else
        echo "✅ 当前分支可以干净地合并到主分支"
    fi
fi

# 4. 更新团队配置（如果有）
if [ -f ".devcontainer/team-config/sync-rules.json" ]; then
    echo "📄 应用团队同步规则..."
    # 这里可以添加团队特定的同步逻辑
fi

echo "🎯 工作空间同步完成"
```

#### 自动化同步脚本
```bash
# .devcontainer/personal-config/scripts/setup-workspace.sh
#!/bin/bash
set -e

echo "🚀 设置 LinchKit 工作空间..."

# 1. 同步 Git 配置
if [ -f ".devcontainer/workspace-config/git-config/.gitconfig" ]; then
    cp .devcontainer/workspace-config/git-config/.gitconfig ~/.gitconfig
    echo "✅ Git 配置已同步"
fi

# 2. 设置 Git hooks
if [ -d ".devcontainer/workspace-config/git-config/hooks" ]; then
    cp -r .devcontainer/workspace-config/git-config/hooks/* .git/hooks/
    chmod +x .git/hooks/*
    echo "✅ Git hooks 已安装"
fi

# 3. 同步 Bun 配置
if [ -f ".devcontainer/workspace-config/bun-config/.bunrc" ]; then
    cp .devcontainer/workspace-config/bun-config/.bunrc ~/.bunrc
    echo "✅ Bun 配置已同步"
fi

# 4. 创建工作树目录
mkdir -p worktrees
echo "✅ 工作树目录已创建"

# 5. 安装依赖
bun install
echo "✅ 依赖安装完成"

echo "🎉 工作空间设置完成！"
```

#### 配置同步钩子
```bash
# .devcontainer/workspace-config/scripts/sync-config.sh
#!/bin/bash
set -e

echo "🔄 同步工作空间配置..."

# 检查是否有配置更新
if git diff --quiet HEAD~1 HEAD -- .devcontainer/workspace-config/; then
    echo "📋 配置无变化，跳过同步"
    exit 0
fi

echo "📦 发现配置更新，开始同步..."

# 重新运行工作空间设置
./.devcontainer/workspace-config/scripts/setup-workspace.sh

echo "✅ 配置同步完成"
```

#### Git Hook 集成
```bash
# .devcontainer/workspace-config/git-config/hooks/post-merge
#!/bin/bash
# 在 git pull 后自动同步配置
./.devcontainer/workspace-config/scripts/sync-config.sh
```

### 3. 跨平台环境统一

#### 开发容器配置
```json
// .devcontainer/devcontainer.json
{
    "name": "LinchKit Development",
    "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye",
    "features": {
        "ghcr.io/devcontainers/features/git:1": {},
        "ghcr.io/devcontainers/features/github-cli:1": {}
    },
    "customizations": {
        "vscode": {
            "settings": {
                "typescript.preferences.importModuleSpecifier": "relative",
                "editor.formatOnSave": true,
                "files.autoSave": "afterDelay"
            },
            "extensions": [
                "ms-vscode.vscode-typescript-next",
                "bradlc.vscode-tailwindcss",
                "ms-vscode.vscode-json"
            ]
        }
    },
    "postCreateCommand": "./.devcontainer/workspace-config/scripts/setup-workspace.sh",
    "remoteUser": "node"
}
```

#### 环境变量配置
```bash
# .devcontainer/workspace-config/.env.development
# 开发环境配置
NODE_ENV=development
TURBO_TEAM=linchkit
TURBO_TOKEN=${TURBO_TOKEN}

# Bun 配置
BUN_INSTALL_GLOBAL_DIR=~/.bun
BUN_INSTALL_BIN_DIR=~/.bun/bin
```

### 4. CI/CD 集成
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: turbo test
      - run: turbo build
```

## 📊 监控与度量

### 1. 开发效率指标
- **并行任务数**: 同时进行的工作树数量
- **冲突频率**: 每周发生的合并冲突次数
- **任务完成时间**: 从创建工作树到合并 PR 的时间
- **代码质量**: 测试覆盖率、lint 通过率

### 2. 协作效果评估
- **资源利用率**: AI 代理的并行工作效率
- **交付质量**: 缺陷率、回归测试通过率
- **文档同步**: ai-context 更新频率和准确性

## 🌐 多台电脑配置同步实施

### 1. 配置文件创建
```bash
# 初始化配置同步目录
mkdir -p .devcontainer/workspace-config/{git-config,bun-config,vscode-config,scripts}

# 创建 Git 配置模板
cat > .devcontainer/workspace-config/git-config/.gitconfig << 'EOF'
[user]
    name = LinchKit Developer
    email = developer@linchkit.com
[core]
    editor = code --wait
    autocrlf = false
    ignorecase = false
[push]
    default = current
[pull]
    rebase = true
[branch]
    autosetupmerge = always
    autosetuprebase = always
EOF

# 创建 Bun 配置
cat > .devcontainer/workspace-config/bun-config/.bunrc << 'EOF'
[install]
cache = "~/.bun/cache"
registry = "https://registry.npmjs.org/"
lockfile = true
exact = false
EOF
```

### 2. 自动化脚本部署
```bash
# 创建工作空间设置脚本
cat > .devcontainer/workspace-config/scripts/setup-workspace.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 设置 LinchKit 工作空间..."

# 检查系统环境
if ! command -v bun &> /dev/null; then
    echo "❌ 未找到 bun，请先安装 bun"
    exit 1
fi

# 同步配置文件
if [ -f ".devcontainer/workspace-config/git-config/.gitconfig" ]; then
    cp .devcontainer/workspace-config/git-config/.gitconfig ~/.gitconfig
    echo "✅ Git 配置已同步"
fi

if [ -f ".devcontainer/workspace-config/bun-config/.bunrc" ]; then
    cp .devcontainer/workspace-config/bun-config/.bunrc ~/.bunrc
    echo "✅ Bun 配置已同步"
fi

# 设置 Git hooks
if [ -d ".devcontainer/workspace-config/git-config/hooks" ]; then
    cp -r .devcontainer/workspace-config/git-config/hooks/* .git/hooks/
    chmod +x .git/hooks/*
    echo "✅ Git hooks 已安装"
fi

# 创建工作树目录
mkdir -p worktrees
echo "/worktrees" >> .gitignore
echo "✅ 工作树目录已创建"

# 安装依赖
bun install
echo "✅ 依赖安装完成"

echo "🎉 工作空间设置完成！"
EOF

chmod +x .devcontainer/workspace-config/scripts/setup-workspace.sh
```

### 3. 跨平台兼容性
```bash
# 创建跨平台检测脚本
cat > .devcontainer/workspace-config/scripts/detect-platform.sh << 'EOF'
#!/bin/bash

# 检测操作系统
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

# 检测架构
ARCH="unknown"
if [[ "$(uname -m)" == "x86_64" ]]; then
    ARCH="x64"
elif [[ "$(uname -m)" == "arm64" ]]; then
    ARCH="arm64"
fi

echo "Platform: $OS-$ARCH"

# 根据平台设置不同的配置
case $OS in
    "linux")
        export BUN_INSTALL_GLOBAL_DIR="$HOME/.bun"
        ;;
    "macos")
        export BUN_INSTALL_GLOBAL_DIR="$HOME/.bun"
        ;;
    "windows")
        export BUN_INSTALL_GLOBAL_DIR="$USERPROFILE/.bun"
        ;;
esac

echo "Bun install directory: $BUN_INSTALL_GLOBAL_DIR"
EOF

chmod +x .devcontainer/workspace-config/scripts/detect-platform.sh
```

### 4. 配置同步验证
```bash
# 创建配置验证脚本
cat > .devcontainer/workspace-config/scripts/validate-config.sh << 'EOF'
#!/bin/bash
set -e

echo "🔍 验证工作空间配置..."

# 检查必要工具
REQUIRED_TOOLS=("git" "bun" "turbo")
for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v "$tool" &> /dev/null; then
        echo "❌ 缺少必要工具: $tool"
        exit 1
    else
        echo "✅ $tool 已安装"
    fi
done

# 检查配置文件
if [ -f "$HOME/.gitconfig" ]; then
    echo "✅ Git 配置文件存在"
else
    echo "⚠️  Git 配置文件不存在"
fi

if [ -f "$HOME/.bunrc" ]; then
    echo "✅ Bun 配置文件存在"
else
    echo "⚠️  Bun 配置文件不存在"
fi

# 检查项目结构
if [ -d "worktrees" ]; then
    echo "✅ 工作树目录存在"
else
    echo "⚠️  工作树目录不存在"
fi

# 检查依赖
if [ -f "bun.lockb" ]; then
    echo "✅ Bun lockfile 存在"
else
    echo "⚠️  Bun lockfile 不存在，请运行 bun install"
fi

echo "🎯 配置验证完成"
EOF

chmod +x .devcontainer/workspace-config/scripts/validate-config.sh
```

## 🤖 AI 并行开发工作流管理

### 1. AI 任务调度系统

#### 任务分配模板
当你需要多个 AI 并行工作时，使用以下标准化指令模板：

```markdown
## AI 任务分配 - [日期]

### 🎯 整体目标
[描述这批任务的整体目标和业务价值]

### 📋 任务列表

#### AI-1: [任务名称]
- **范围**: packages/auth + apps/starter
- **描述**: 实现 OIDC 认证支持
- **工作树**: auth-oidc-support
- **预计时间**: 2-3 hours
- **依赖**: 无
- **输出**: 
  - [ ] OIDC 认证服务
  - [ ] Starter 应用集成
  - [ ] 测试用例
  - [ ] 文档更新

#### AI-2: [任务名称]  
- **范围**: packages/crud + packages/ui
- **描述**: 批量操作功能
- **工作树**: crud-batch-ops
- **预计时间**: 1-2 hours
- **依赖**: 等待 AI-1 完成认证部分
- **输出**:
  - [ ] 批量删除 API
  - [ ] UI 批量选择组件
  - [ ] 权限检查集成

#### AI-3: [任务名称]
- **范围**: ai-context/ + apps/website
- **描述**: 文档更新和网站改进
- **工作树**: docs-improvements
- **预计时间**: 1 hour
- **依赖**: 无
- **输出**:
  - [ ] API 文档更新
  - [ ] 工作流文档
  - [ ] 网站导航优化

### ⚠️ 冲突预防
- AI-1 和 AI-2 都涉及认证，AI-2 需要等待 AI-1 完成基础认证
- AI-3 独立进行，无冲突风险

### 🔄 协调机制
- 每完成一个主要步骤，在此留言汇报进度
- 发现冲突立即停止，等待协调
- 使用统一的分支命名: feature/<scope>/<task-name>
```

#### AI 实例管理
```bash
# 创建 AI 任务管理脚本
cat > .devcontainer/ai-workflow/ai-task-manager.sh << 'EOF'
#!/bin/bash

COMMAND="$1"
AI_ID="$2"
TASK_NAME="$3"

case $COMMAND in
    "assign")
        echo "📋 分配任务给 AI-$AI_ID: $TASK_NAME"
        
        # 创建任务配置
        mkdir -p .devcontainer/ai-workflow/tasks
        cat > ".devcontainer/ai-workflow/tasks/ai-$AI_ID-$TASK_NAME.json" << TASK_EOF
{
    "aiId": "$AI_ID",
    "taskName": "$TASK_NAME",
    "status": "assigned",
    "assignedAt": "$(date -Iseconds)",
    "worktreePath": "./worktrees/$TASK_NAME",
    "branchName": "feature/${TASK_NAME//[^a-zA-Z0-9]/-}"
}
TASK_EOF
        
        echo "✅ 任务已分配"
        ;;
        
    "start")
        echo "🚀 AI-$AI_ID 开始任务: $TASK_NAME"
        
        # 更新任务状态
        jq '.status = "in_progress" | .startedAt = now | .startedAt |= strftime("%Y-%m-%dT%H:%M:%SZ")' \
           ".devcontainer/ai-workflow/tasks/ai-$AI_ID-$TASK_NAME.json" > tmp.json
        mv tmp.json ".devcontainer/ai-workflow/tasks/ai-$AI_ID-$TASK_NAME.json"
        
        echo "✅ 任务状态已更新为进行中"
        ;;
        
    "complete")
        echo "✅ AI-$AI_ID 完成任务: $TASK_NAME"
        
        # 更新任务状态
        jq '.status = "completed" | .completedAt = now | .completedAt |= strftime("%Y-%m-%dT%H:%M:%SZ")' \
           ".devcontainer/ai-workflow/tasks/ai-$AI_ID-$TASK_NAME.json" > tmp.json
        mv tmp.json ".devcontainer/ai-workflow/tasks/ai-$AI_ID-$TASK_NAME.json"
        
        echo "✅ 任务已标记为完成"
        ;;
        
    "status")
        echo "📊 当前任务状态:"
        for task_file in .devcontainer/ai-workflow/tasks/*.json; do
            if [ -f "$task_file" ]; then
                AI_ID=$(jq -r '.aiId' "$task_file")
                TASK=$(jq -r '.taskName' "$task_file")
                STATUS=$(jq -r '.status' "$task_file")
                echo "  AI-$AI_ID: $TASK [$STATUS]"
            fi
        done
        ;;
esac
EOF

chmod +x .devcontainer/ai-workflow/ai-task-manager.sh
```

### 2. AI 工作流标准指令

#### 开始任务指令模板
```markdown
请按照 LinchKit 并行开发工作流开始以下任务：

**任务 ID**: AI-[X]-[task-name]
**工作范围**: [packages/modules/apps]
**任务描述**: [具体要实现的功能]

**执行步骤**:
1. 运行预检查: `.devcontainer/ai-workflow/ai-task-manager.sh start [X] [task-name]`
2. 创建工作树: `git worktree add -b feature/[scope]/[task] ./worktrees/[task] main`
3. 进入工作环境: `cd ./worktrees/[task] && bun install`
4. 开始开发，遵循 LinchKit 开发规范
5. 定期推送进度: `git push origin feature/[scope]/[task]`
6. 完成后汇报: `.devcontainer/ai-workflow/ai-task-manager.sh complete [X] [task-name]`

**注意事项**:
- 如果涉及跨包修改，确保依赖顺序正确
- 发现冲突立即停止，等待协调
- 遵循 bun + turbo 构建流程
- 使用 `bun changeset add` 记录变更
```

#### 进度汇报模板
```markdown
## AI-[X] 进度汇报 - [task-name]

### ✅ 已完成
- [具体完成的功能点]
- [文件修改清单]
- [测试结果]

### ⏳ 进行中
- [当前正在处理的部分]
- [预计完成时间]

### ⚠️ 阻塞问题
- [遇到的问题或依赖]
- [需要协调的事项]

### 📁 文件变更
- packages/[package]/src/[file].ts (新增/修改)
- apps/[app]/[path]/[file].tsx (修改)

### 🧪 测试状态
- 单元测试: ✅/❌
- 构建验证: ✅/❌
- ESLint 检查: ✅/❌

### 📋 下一步计划
- [接下来要处理的任务]
```

### 3. 多 AI 协调机制

#### 冲突检测脚本
```bash
# .devcontainer/ai-workflow/check-conflicts.sh
#!/bin/bash
set -e

echo "🔍 检查 AI 任务冲突..."

# 获取所有活跃任务
ACTIVE_TASKS=()
for task_file in .devcontainer/ai-workflow/tasks/*.json; do
    if [ -f "$task_file" ]; then
        STATUS=$(jq -r '.status' "$task_file")
        if [ "$STATUS" = "in_progress" ] || [ "$STATUS" = "assigned" ]; then
            ACTIVE_TASKS+=("$task_file")
        fi
    fi
done

echo "📋 发现 ${#ACTIVE_TASKS[@]} 个活跃任务"

# 检查文件修改冲突
declare -A file_conflicts
for task_file in "${ACTIVE_TASKS[@]}"; do
    AI_ID=$(jq -r '.aiId' "$task_file")
    TASK_NAME=$(jq -r '.taskName' "$task_file")
    WORKTREE=$(jq -r '.worktreePath' "$task_file")
    
    if [ -d "$WORKTREE" ]; then
        # 获取修改的文件列表
        cd "$WORKTREE"
        CHANGED_FILES=$(git diff --name-only HEAD~5..HEAD 2>/dev/null || echo "")
        
        for file in $CHANGED_FILES; do
            if [[ -n "${file_conflicts[$file]}" ]]; then
                echo "🚨 文件冲突检测: $file"
                echo "   涉及任务: ${file_conflicts[$file]} 和 AI-$AI_ID-$TASK_NAME"
            else
                file_conflicts[$file]="AI-$AI_ID-$TASK_NAME"
            fi
        done
        
        cd - > /dev/null
    fi
done

echo "✅ 冲突检查完成"
```

#### AI 间通信协议
```markdown
## AI 间协调指令

### 依赖等待
当 AI-2 需要等待 AI-1 完成某个功能：

```bash
# AI-2 执行
echo "⏳ 等待 AI-1 完成认证功能..."
while ! .devcontainer/ai-workflow/check-dependency.sh "auth-feature"; do
    echo "等待中... $(date)"
    sleep 30
done
echo "✅ 依赖已满足，继续执行"
```

### 接口协调
当需要协调跨包接口：

```markdown
@AI-[依赖方] 我正在修改 `packages/auth/src/types.ts` 中的 `User` 接口，
新增了 `roles: string[]` 字段。请确认这个变更是否会影响你的任务。

如果需要调整，请在 `packages/crud/src/permissions.ts` 中相应更新权限检查逻辑。
```
```

### 4. 动态任务管理

#### AI 动态新增任务功能
```bash
# .devcontainer/ai-workflow/create-task.sh
#!/bin/bash
set -e

TASK_ID="$1"
AI_ID="$2"
SCOPE="$3"
DESCRIPTION="$4"

if [ -z "$TASK_ID" ] || [ -z "$AI_ID" ] || [ -z "$SCOPE" ] || [ -z "$DESCRIPTION" ]; then
    echo "用法: $0 <task-id> <ai-id> <scope> <description>"
    echo "示例: $0 TASK-123 1 'packages/auth' 'Add OIDC support'"
    exit 1
fi

echo "🆕 创建新任务: $TASK_ID"

# 1. 生成任务配置
mkdir -p .devcontainer/ai-workflow/tasks
cat > ".devcontainer/ai-workflow/tasks/ai-$AI_ID-$TASK_ID.json" << EOF
{
    "taskId": "$TASK_ID",
    "aiId": "$AI_ID",
    "scope": "$SCOPE",
    "description": "$DESCRIPTION",
    "status": "assigned",
    "createdAt": "$(date -Iseconds)",
    "assignedAt": "$(date -Iseconds)",
    "worktreePath": "./worktrees/$TASK_ID",
    "branchName": "feature/${SCOPE//\//-}/$TASK_ID",
    "estimatedHours": null,
    "dependencies": [],
    "conflicts": []
}
EOF

# 2. 冲突预检查
echo "🔍 检查潜在冲突..."
CONFLICT_FOUND=false

for existing_task in .devcontainer/ai-workflow/tasks/*.json; do
    if [ -f "$existing_task" ] && [ "$existing_task" != ".devcontainer/ai-workflow/tasks/ai-$AI_ID-$TASK_ID.json" ]; then
        EXISTING_STATUS=$(jq -r '.status' "$existing_task")
        EXISTING_SCOPE=$(jq -r '.scope' "$existing_task")
        
        if [ "$EXISTING_STATUS" = "assigned" ] || [ "$EXISTING_STATUS" = "in_progress" ]; then
            # 检查范围重叠
            if [[ "$SCOPE" == *"$EXISTING_SCOPE"* ]] || [[ "$EXISTING_SCOPE" == *"$SCOPE"* ]]; then
                EXISTING_TASK_ID=$(jq -r '.taskId' "$existing_task")
                EXISTING_AI_ID=$(jq -r '.aiId' "$existing_task")
                echo "⚠️  检测到范围重叠: $EXISTING_TASK_ID (AI-$EXISTING_AI_ID) - $EXISTING_SCOPE"
                CONFLICT_FOUND=true
            fi
        fi
    fi
done

# 3. 生成任务启动指令
cat > ".devcontainer/ai-workflow/instructions/ai-$AI_ID-$TASK_ID.md" << EOF
# AI-$AI_ID 任务指令: $TASK_ID

## 📋 任务信息
- **任务ID**: $TASK_ID
- **工作范围**: $SCOPE
- **描述**: $DESCRIPTION
- **创建时间**: $(date '+%Y-%m-%d %H:%M:%S')

## 🚀 执行步骤

### 1. 初始化任务环境
\`\`\`bash
# 标记任务开始
.devcontainer/ai-workflow/ai-task-manager.sh start $AI_ID $TASK_ID

# 创建工作树
git worktree add -b feature/${SCOPE//\//-}/$TASK_ID ./worktrees/$TASK_ID main

# 进入工作环境
cd ./worktrees/$TASK_ID

# 安装依赖
bun install
\`\`\`

### 2. 开发规范要求
- 遵循 LinchKit 开发规范
- 使用 bun + turbo 构建流程
- 定期推送进度: \`git push origin feature/${SCOPE//\//-}/$TASK_ID\`
- 使用 \`bun changeset add\` 记录变更

### 3. 完成标准
- [ ] 功能实现完成
- [ ] 单元测试通过: \`turbo test --filter=<package>\`
- [ ] 构建验证: \`turbo build --filter=<package>\`
- [ ] ESLint 检查通过: \`turbo lint --filter=<package>\`
- [ ] 添加 changeset
- [ ] 创建 Pull Request

### 4. 完成任务
\`\`\`bash
# 标记任务完成
.devcontainer/ai-workflow/ai-task-manager.sh complete $AI_ID $TASK_ID
\`\`\`

## ⚠️ 注意事项
$(if [ "$CONFLICT_FOUND" = "true" ]; then
    echo "- 🚨 检测到潜在冲突，请协调后再开始"
else
    echo "- ✅ 未检测到冲突，可以直接开始"
fi)
- 如遇到阻塞问题，立即更新任务状态为 blocked
- 定期运行冲突检查: \`.devcontainer/ai-workflow/check-conflicts.sh\`
EOF

mkdir -p .devcontainer/ai-workflow/instructions

echo "✅ 任务 $TASK_ID 已创建"
echo "📄 指令文件: .devcontainer/ai-workflow/instructions/ai-$AI_ID-$TASK_ID.md"

if [ "$CONFLICT_FOUND" = "true" ]; then
    echo "🚨 请注意潜在冲突，建议协调后再分配给 AI"
else
    echo "🎯 任务可以立即分配给 AI-$AI_ID"
fi
```

#### 智能任务分解功能
```bash
# .devcontainer/ai-workflow/split-task.sh
#!/bin/bash
set -e

PARENT_TASK="$1"
SPLIT_COUNT="$2"

if [ -z "$PARENT_TASK" ] || [ -z "$SPLIT_COUNT" ]; then
    echo "用法: $0 <parent-task-id> <split-count>"
    echo "示例: $0 AUTH-SYSTEM 3"
    exit 1
fi

echo "🔀 将任务 $PARENT_TASK 分解为 $SPLIT_COUNT 个子任务"

# 生成子任务模板
for i in $(seq 1 $SPLIT_COUNT); do
    SUB_TASK_ID="${PARENT_TASK}-SUB-$i"
    
    cat > ".devcontainer/ai-workflow/task-templates/$SUB_TASK_ID.json" << EOF
{
    "taskId": "$SUB_TASK_ID",
    "parentTask": "$PARENT_TASK",
    "aiId": null,
    "scope": "",
    "description": "请填写具体描述",
    "status": "template",
    "dependencies": [],
    "estimatedHours": 1
}
EOF
    
    echo "📋 创建子任务模板: $SUB_TASK_ID"
done

echo "✅ 任务分解完成"
echo "💡 请编辑 .devcontainer/ai-workflow/task-templates/ 中的文件，然后使用 assign-subtask.sh 分配"
```

#### 交互式任务创建
```bash
# .devcontainer/ai-workflow/interactive-create.sh
#!/bin/bash

echo "🤖 LinchKit AI 任务创建助手"
echo "============================"

# 读取任务信息
read -p "📝 任务ID (例: AUTH-OIDC): " TASK_ID
read -p "🤖 分配给AI编号 (1-10): " AI_ID
read -p "📦 工作范围 (例: packages/auth): " SCOPE
read -p "📋 任务描述: " DESCRIPTION
read -p "⏱️  预估时间 (小时): " ESTIMATED_HOURS

echo ""
echo "🔍 任务信息确认:"
echo "  任务ID: $TASK_ID"
echo "  AI编号: AI-$AI_ID"
echo "  范围: $SCOPE"
echo "  描述: $DESCRIPTION"
echo "  预估: ${ESTIMATED_HOURS}小时"
echo ""

read -p "确认创建任务? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    # 创建任务
    .devcontainer/ai-workflow/create-task.sh "$TASK_ID" "$AI_ID" "$SCOPE" "$DESCRIPTION"
    
    # 更新预估时间
    TASK_FILE=".devcontainer/ai-workflow/tasks/ai-$AI_ID-$TASK_ID.json"
    jq ".estimatedHours = $ESTIMATED_HOURS" "$TASK_FILE" > tmp.json && mv tmp.json "$TASK_FILE"
    
    echo ""
    echo "🎉 任务创建成功！"
    echo "📄 可以将以下指令发送给 AI-$AI_ID:"
    echo ""
    echo "请开始执行任务 $TASK_ID。任务指令文件："
    echo ".devcontainer/ai-workflow/instructions/ai-$AI_ID-$TASK_ID.md"
else
    echo "❌ 任务创建已取消"
fi
```

### 5. 任务监控面板

#### 增强状态监控
```bash
# .devcontainer/ai-workflow/dashboard.sh
#!/bin/bash

clear
echo "🤖 LinchKit AI 开发面板"
echo "========================"
echo ""

# 显示活跃任务
echo "📋 活跃任务:"
for task_file in .devcontainer/ai-workflow/tasks/*.json; do
    if [ -f "$task_file" ]; then
        AI_ID=$(jq -r '.aiId' "$task_file")
        TASK=$(jq -r '.taskName' "$task_file")
        STATUS=$(jq -r '.status' "$task_file")
        STARTED=$(jq -r '.startedAt // "未开始"' "$task_file")
        
        case $STATUS in
            "assigned") STATUS_ICON="📋" ;;
            "in_progress") STATUS_ICON="🚀" ;;
            "completed") STATUS_ICON="✅" ;;
            *) STATUS_ICON="❓" ;;
        esac
        
        echo "  $STATUS_ICON AI-$AI_ID: $TASK [$STATUS] - $STARTED"
    fi
done

echo ""

# 显示工作树状态
echo "🌳 工作树状态:"
for worktree in worktrees/*/; do
    if [ -d "$worktree" ]; then
        TREE_NAME=$(basename "$worktree")
        cd "$worktree"
        BRANCH=$(git branch --show-current)
        COMMITS=$(git rev-list --count HEAD ^main 2>/dev/null || echo "0")
        echo "  📁 $TREE_NAME ($BRANCH) - $COMMITS commits"
        cd - > /dev/null
    fi
done

echo ""
echo "💡 使用方法:"
echo "  查看详细状态: .devcontainer/ai-workflow/ai-task-manager.sh status"
echo "  检查冲突: .devcontainer/ai-workflow/check-conflicts.sh"
```

## 🎯 最佳实践建议

### 1. AI 任务分配策略
- **任务粒度**: 每个任务 1-3 小时完成，避免过大或过小
- **依赖明确**: 清楚标明任务间的依赖关系
- **范围限定**: 每个 AI 的工作范围要明确，避免重叠
- **进度可见**: 要求 AI 定期汇报进度和文件变更

### 2. 配置同步策略
- **统一配置**: 所有开发环境使用相同的配置文件
- **自动同步**: 通过 Git hooks 自动同步配置变更
- **版本控制**: 配置文件纳入版本控制，确保一致性
- **平台适配**: 根据不同操作系统调整配置参数

### 2. 任务分配策略
- **功能独立**: 优先分配逻辑独立的功能
- **包内聚**: 同一个包内的相关功能可以并行
- **接口稳定**: 跨包接口变更需要协调

### 3. 开发节奏控制
- **小步快走**: 每个任务控制在 1-2 天内完成
- **频繁集成**: 每日至少同步一次主分支
- **早期反馈**: 及时创建 PR 获得代码审查

### 4. 质量保证
- **自动化测试**: 依赖 CI/CD 确保代码质量
- **人工审查**: 重要变更必须经过人工 code review
- **渐进式集成**: 通过 integration 分支进行集成测试

### 5. 环境一致性
- **容器化开发**: 使用 DevContainer 确保环境一致
- **配置模板**: 提供标准的配置模板
- **验证机制**: 定期验证配置的正确性

---

## 🔗 相关文档

- [系统架构概览](./overview.md)
- [Git 工作流规范](./git_workflow.md)
- [开发规范与约束](../workflow_and_constraints.md)
- [项目路线图](../roadmap.md)

## 🚀 渐进式实施策略

基于与 Gemini 的深入协商，我们制定了务实的三阶段实施计划，确保每个阶段都能独立产生价值。

### Phase 1: 脚本化 MVP (1-2 周 + 25% 缓冲)

#### 🎯 目标
证明核心工作流概念在本地环境的可行性

#### 📋 核心功能 (严格控制范围)
```bash
# 必须实现的功能
1. 任务定义 (JSON 配置驱动)
2. 任务执行 (Git 操作 + 文件系统)
3. 状态跟踪 (state.json)
4. 幂等性执行 (可重复运行)

# 推迟的功能
- AI 协调 (Phase 2+)
- 多设备同步 (Phase 2+)
- 复杂冲突解决 (手动解决)
- Web UI (Phase 3)
```

#### 🏗️ 技术架构 (配置文件驱动)
```json
// workflow.json - 任务配置
{
  "workflow": {
    "id": "auth-oidc-task",
    "description": "实现 OIDC 认证支持",
    "tasks": [
      {
        "id": "setup-branch",
        "type": "git",
        "command": "worktree add -b feature/auth/oidc-support ./worktrees/auth-oidc main",
        "depends_on": []
      },
      {
        "id": "install-deps",
        "type": "shell",
        "command": "cd ./worktrees/auth-oidc && bun install",
        "depends_on": ["setup-branch"]
      },
      {
        "id": "run-tests",
        "type": "shell", 
        "command": "cd ./worktrees/auth-oidc && turbo test --filter=@linchkit/auth",
        "depends_on": ["install-deps"]
      }
    ]
  }
}

// state.json - 状态跟踪
{
  "workflow_id": "auth-oidc-task",
  "status": "running",
  "tasks": {
    "setup-branch": { "status": "completed", "completed_at": "2025-07-04T10:00:00Z" },
    "install-deps": { "status": "running", "started_at": "2025-07-04T10:01:00Z" },
    "run-tests": { "status": "pending" }
  }
}
```

#### 📁 文件结构
```
.devcontainer/workflow-mvp/
├── engine.sh              # 核心执行引擎
├── tasks/                  # 任务定义目录
│   ├── auth-oidc.json
│   └── crud-batch.json
├── state/                  # 状态存储
│   ├── auth-oidc.state.json
│   └── crud-batch.state.json
├── scripts/
│   ├── create-task.sh      # 任务创建
│   ├── run-workflow.sh     # 工作流执行  
│   └── status.sh          # 状态查看
└── README.md              # 使用文档
```

#### ✅ 成功标准
- [ ] 能够通过 JSON 配置定义一个完整的开发任务
- [ ] 脚本能自动执行 git worktree 创建、依赖安装、测试运行
- [ ] 支持任务失败后的断点续传
- [ ] 本地验证一个完整的并行开发周期

### Phase 2: @linchkit/ai 包 (2-4 周 + 50% 缓冲)

#### 🎯 目标
将 MVP 工作流产品化，集成到 LinchKit 生态系统

#### 📦 包架构设计
```typescript
// packages/ai/src/index.ts
export interface WorkflowEngine {
  // 核心引擎
  engine: {
    execute(workflow: WorkflowConfig): Promise<WorkflowResult>
    pause(workflowId: string): Promise<void>
    resume(workflowId: string): Promise<void>
  }
  
  // 任务系统  
  tasks: {
    register(taskType: string, handler: TaskHandler): void
    execute(task: TaskConfig): Promise<TaskResult>
  }
  
  // 状态管理
  state: {
    save(workflowId: string, state: WorkflowState): Promise<void>
    load(workflowId: string): Promise<WorkflowState>
    migrate(from: StateFormat, to: StateFormat): Promise<void>
  }
  
  // API 接口
  api: {
    createTask(config: TaskConfig): Promise<string>
    getStatus(workflowId: string): Promise<WorkflowStatus>
    listTasks(): Promise<TaskSummary[]>
  }
}
```

#### 🔌 插件系统设计
```typescript
// 可扩展的任务类型
interface TaskHandler {
  type: string
  execute(config: TaskConfig, context: ExecutionContext): Promise<TaskResult>
  validate(config: TaskConfig): ValidationResult
}

// 内置任务类型
export const builtinTasks = {
  git: new GitTaskHandler(),
  shell: new ShellTaskHandler(), 
  file: new FileTaskHandler(),
  http: new HttpTaskHandler()
}

// 事件驱动架构 (AI-First 核心)
export class WorkflowEngine extends EventEmitter {
  // 关键事件
  // - workflow_started
  // - task_started  
  // - task_completed
  // - task_failed
  // - workflow_completed
  // - conflict_detected
}
```

#### 💾 数据存储演进 (SQLite 过渡)
```sql
-- 使用 SQLite 作为"训练轮"
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  config JSON NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  workflow_id TEXT REFERENCES workflows(id),
  config JSON NOT NULL,
  status TEXT NOT NULL,
  result JSON,
  started_at DATETIME,
  completed_at DATETIME
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id TEXT,
  task_id TEXT,
  event_type TEXT NOT NULL,
  payload JSON,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 🔗 LinchKit 集成点
```typescript
// 与现有包的集成
import { createLogger } from '@linchkit/core'
import { defineSchema } from '@linchkit/schema'
import { withAuth } from '@linchkit/auth'
import { createCRUD } from '@linchkit/crud'

// 共享类型定义 (packages/schema 扩展)
export const WorkflowSchema = defineSchema({
  workflow: z.object({
    id: z.string(),
    tasks: z.array(TaskSchema),
    metadata: z.object({...})
  })
})
```

#### ✅ 成功标准
- [ ] 完整的 TypeScript API 包
- [ ] 事件驱动的架构
- [ ] SQLite 数据持久化
- [ ] 从 Phase 1 脚本的平滑迁移
- [ ] 完整的单元测试覆盖

### Phase 3: Web 管理界面 (2-4 周 + 25% 缓冲)

#### 🎯 目标
提供可视化任务管理和监控面板

#### 🖥️ 界面设计 (基于 modules/console 扩展)
```tsx
// modules/console/src/pages/ai-workflow/
├── Dashboard.tsx           # 任务总览面板
├── TaskManager.tsx         # 任务管理界面
├── WorkflowEditor.tsx      # 工作流编辑器
├── ConflictMonitor.tsx     # 冲突监控面板
└── AgentStatus.tsx         # AI 代理状态

// 核心功能组件
export const WorkflowDashboard = () => {
  return (
    <div className="workflow-dashboard">
      <StatCard title="活跃任务" value={activeTasksCount} />
      <StatCard title="完成任务" value={completedTasksCount} />
      <StatCard title="冲突预警" value={conflictsCount} status="warning" />
      
      <TaskTimeline tasks={recentTasks} />
      <AgentGrid agents={aiAgents} />
      <ConflictAlert conflicts={detectedConflicts} />
    </div>
  )
}
```

#### 📊 可视化功能
```typescript
// 实时状态监控
interface DashboardState {
  // 任务流水线视图
  pipeline: {
    pending: Task[]
    running: Task[]
    completed: Task[]
    failed: Task[]
  }
  
  // AI 代理状态
  agents: {
    [agentId: string]: {
      status: 'idle' | 'working' | 'blocked'
      currentTask?: TaskInfo
      performance: AgentMetrics
    }
  }
  
  // 冲突预警
  conflicts: ConflictAlert[]
  
  // 性能指标
  metrics: {
    throughput: number
    averageTaskTime: number
    successRate: number
  }
}
```

#### 🔄 API 集成
```typescript
// 使用 @linchkit/trpc 暴露 API
export const aiWorkflowRouter = router({
  // 任务管理
  createTask: procedure
    .input(CreateTaskSchema)
    .mutation(async ({ input }) => {
      return await workflowEngine.api.createTask(input)
    }),
    
  // 状态查询
  getWorkflowStatus: procedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input }) => {
      return await workflowEngine.api.getStatus(input.workflowId)
    }),
    
  // 实时订阅
  subscribeEvents: procedure
    .subscription(() => {
      return observable<WorkflowEvent>((emit) => {
        workflowEngine.on('*', emit.next)
        return () => workflowEngine.off('*', emit.next)
      })
    })
})
```

#### ✅ 成功标准
- [ ] 完整的任务可视化界面
- [ ] 实时状态更新 (WebSocket/SSE)
- [ ] 任务创建和管理功能
- [ ] 冲突预警和解决界面
- [ ] 移动端响应式设计

### 🛡️ 风险管控与回退机制

#### 阶段风险与对策
```markdown
**Phase 1 风险**: "脚本陷阱" - 实现过多逻辑
**对策**: 严格遵守"配置文件驱动"原则，脚本只做执行

**Phase 2 风险**: "过度工程化" - API 设计过于复杂  
**对策**: MVP 优先，与 Phase 3 团队保持沟通

**Phase 3 风险**: "需求蔓延" - UI 功能不断增加
**对策**: 围绕"可视化"和"核心操作"两个目标
```

#### 回退与兼容性策略
```bash
# Phase 1 -> 2 并行存在
# 如果 Phase 2 有问题，可以继续使用 Phase 1 脚本

# API 版本化
/api/v1/workflows  # 保持向后兼容
/api/v2/workflows  # 新功能

# 数据迁移脚本
migrate-state-v1-to-v2.sh  # JSON -> SQLite
migrate-state-v2-to-v3.sh  # SQLite -> PostgreSQL
```

### 📋 实施时间表

| 阶段 | 核心功能 | 时间估算 | 里程碑 |
|------|----------|----------|--------|
| Phase 1 | 脚本化 MVP | 2-3 周 | 本地工作流验证 |
| Phase 2 | @linchkit/ai 包 | 3-4 周 | API 化任务管理 |  
| Phase 3 | Web 管理界面 | 3-4 周 | 生产级管理平台 |

**总计**: 8-11 周 (约 2.5-3 个月)

### 🎯 成功指标

- **Phase 1**: 能够自动化一个完整的并行开发任务
- **Phase 2**: AI 可以通过 API 创建和管理任务
- **Phase 3**: 非技术用户可以通过界面监控开发进度

---

**这个渐进式策略将确保我们能够平稳、安全地将复杂的并行开发工作流落地到生产环境中。**