# LinchKit 并行开发工作流 - Phase 1 MVP

**版本**: v1.0  
**阶段**: Phase 1 - 脚本化 MVP  
**状态**: ✅ 已完成

## 🎯 项目概述

这是 LinchKit 并行开发工作流的第一阶段实现，提供配置驱动的任务执行引擎，支持多个 AI 代理和开发者并行工作在不同功能上。

### 核心特性

- ✅ **配置文件驱动**: 任务定义完全基于 JSON 配置
- ✅ **幂等性执行**: 支持任务失败后的断点续传
- ✅ **状态跟踪**: 实时跟踪工作流和任务状态
- ✅ **Git Worktree 集成**: 自动创建和管理工作树
- ✅ **依赖管理**: 基于依赖关系的任务执行顺序
- ✅ **错误处理**: 完善的错误检测和恢复机制

## 📁 项目结构

```
.devcontainer/workflow-mvp/
├── engine.sh              # 核心执行引擎
├── tasks/                  # 任务定义目录
│   ├── auth-oidc.json     # 认证 OIDC 支持示例
│   ├── crud-batch.json    # CRUD 批量操作示例
│   └── simple-test.json   # 简单测试示例
├── state/                  # 状态存储目录
│   ├── *.state.json       # 工作流状态文件
├── scripts/               # 管理脚本
│   ├── run-workflow.sh    # 工作流执行脚本
│   ├── status.sh          # 状态查看脚本
│   └── create-task.sh     # 任务创建脚本
└── README.md              # 本文档
```

## 🚀 快速开始

### 1. 环境要求

确保系统已安装以下依赖：

```bash
# 必需依赖
bun       # JavaScript 运行时和包管理器
git       # 版本控制
jq        # JSON 处理工具

# 检查依赖
which bun && which git && which jq
```

### 2. 运行现有工作流

```bash
# 进入工作流目录
cd .devcontainer/workflow-mvp

# 查看可用的工作流配置
ls tasks/*.json

# 执行工作流
./scripts/run-workflow.sh simple-test.json

# 查看执行状态
./scripts/status.sh
```

### 3. 创建新的工作流

#### 方式一：交互式创建

```bash
./scripts/create-task.sh
```

#### 方式二：从模板创建

```bash
# 创建认证相关任务
./scripts/create-task.sh --template auth my-auth-task

# 创建 CRUD 相关任务
./scripts/create-task.sh --template crud my-crud-task
```

#### 方式三：手动创建 JSON 配置

在 `tasks/` 目录下创建 JSON 文件：

```json
{
  "workflow": {
    "id": "my-workflow",
    "description": "工作流描述",
    "tasks": [
      {
        "id": "setup-branch",
        "type": "git",
        "command": "worktree add -b feature/my-feature ./worktrees/my-work main",
        "depends_on": []
      },
      {
        "id": "install-deps",
        "type": "shell",
        "command": "cd ./worktrees/my-work && bun install",
        "depends_on": ["setup-branch"]
      }
    ]
  }
}
```

## 📝 配置格式参考

### 工作流配置结构

```json
{
  "workflow": {
    "id": "string",           // 工作流唯一标识符
    "description": "string",  // 工作流描述
    "tasks": [               // 任务数组
      {
        "id": "string",           // 任务唯一标识符
        "type": "git|shell",      // 任务类型
        "command": "string",      // 执行命令
        "depends_on": ["string"]  // 依赖的任务 ID 列表
      }
    ]
  }
}
```

### 支持的任务类型

#### Git 任务 (`"type": "git"`)

用于执行 Git 操作，命令会在项目根目录执行：

```json
{
  "id": "create-worktree",
  "type": "git",
  "command": "worktree add -b feature/my-branch ./worktrees/my-work main",
  "depends_on": []
}
```

#### Shell 任务 (`"type": "shell"`)

用于执行任意 Shell 命令：

```json
{
  "id": "install-deps",
  "type": "shell", 
  "command": "cd ./worktrees/my-work && bun install",
  "depends_on": ["create-worktree"]
}
```

### 常用命令示例

```json
{
  "tasks": [
    // 创建工作树
    {
      "id": "setup-branch",
      "type": "git", 
      "command": "worktree add -b feature/auth/oidc ./worktrees/auth-oidc main"
    },
    
    // 安装依赖
    {
      "id": "install-deps",
      "type": "shell",
      "command": "cd ./worktrees/auth-oidc && bun install"
    },
    
    // 构建依赖包
    {
      "id": "build-deps", 
      "type": "shell",
      "command": "cd ./worktrees/auth-oidc && bun run build --filter=@linchkit/core --filter=@linchkit/schema"
    },
    
    // 运行测试
    {
      "id": "run-tests",
      "type": "shell",
      "command": "cd ./worktrees/auth-oidc && bun test --filter=@linchkit/auth"
    },
    
    // 类型检查
    {
      "id": "type-check",
      "type": "shell", 
      "command": "cd ./worktrees/auth-oidc && bun run check-types"
    },
    
    // 代码检查
    {
      "id": "lint",
      "type": "shell",
      "command": "cd ./worktrees/auth-oidc && bun run lint"
    }
  ]
}
```

## 🛠️ 使用指南

### 基本工作流程

1. **创建任务配置**
   ```bash
   ./scripts/create-task.sh
   ```

2. **执行工作流**
   ```bash
   ./scripts/run-workflow.sh my-task.json
   ```

3. **监控进度**
   ```bash
   ./scripts/status.sh
   ```

4. **处理失败** (如果有任务失败)
   ```bash
   # 修复问题后重新执行，已完成的任务会被跳过
   ./scripts/run-workflow.sh my-task.json
   ```

### 高级功能

#### 断点续传

工作流支持断点续传。如果任务失败，修复问题后重新执行同一个配置文件，已完成的任务会被自动跳过：

```bash
# 第一次执行失败
./scripts/run-workflow.sh my-task.json  # 某个任务失败

# 修复问题后重新执行
./scripts/run-workflow.sh my-task.json  # 自动跳过已完成的任务
```

#### 状态查询

```bash
# 查看所有工作流状态
./scripts/status.sh

# 查看特定工作流状态  
./scripts/status.sh my-workflow-id

# 查看工作树状态
./scripts/status.sh  # 自动显示所有工作树
```

#### 依赖管理

任务之间可以通过 `depends_on` 字段指定依赖关系：

```json
{
  "tasks": [
    {
      "id": "task-a",
      "depends_on": []  // 无依赖，首先执行
    },
    {
      "id": "task-b", 
      "depends_on": ["task-a"]  // 等待 task-a 完成
    },
    {
      "id": "task-c",
      "depends_on": ["task-a", "task-b"]  // 等待多个任务完成
    }
  ]
}
```

## 🔧 故障排除

### 常见问题

#### 1. 依赖检查失败

```bash
[ERROR] 缺少必要依赖: jq
```

**解决方案**：
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# 检查 bun 安装
curl -fsSL https://bun.sh/install | bash
```

#### 2. Git Worktree 已存在

```bash
fatal: 'worktrees/my-work' already exists
```

**解决方案**：
```bash
# 删除现有工作树
git worktree remove ./worktrees/my-work

# 或者使用不同的工作树名称
```

#### 3. JSON 配置格式错误

```bash
[ERROR] 配置文件 JSON 格式错误: tasks/my-task.json
```

**解决方案**：
```bash
# 使用 jq 验证 JSON 格式
jq empty tasks/my-task.json

# 或使用在线 JSON 验证器检查语法
```

#### 4. 循环依赖

```bash
[ERROR] 检测到循环依赖或无法满足的依赖
```

**解决方案**：检查任务配置中的 `depends_on` 字段，确保没有循环依赖。

### 调试技巧

#### 启用详细日志

```bash
# 查看执行过程的详细输出
bash -x ./scripts/run-workflow.sh my-task.json
```

#### 手动检查状态

```bash
# 查看状态文件内容
cat state/my-workflow.state.json | jq '.'

# 检查工作树状态
cd ../worktrees/my-work
git status
git log --oneline
```

## 📊 性能优化

### 并行执行

当前版本按照依赖顺序串行执行任务。Phase 2 将支持无依赖关系的任务并行执行。

### 缓存优化

- **Bun 安装缓存**: 工作树之间共享 node_modules 缓存
- **Git 优化**: 使用 worktree 避免重复克隆

## 🔗 集成指南

### AI 代理集成

AI 代理可以通过以下方式使用工作流：

```bash
# 1. 创建任务配置
echo '{...}' > tasks/ai-task-123.json

# 2. 执行工作流
./scripts/run-workflow.sh ai-task-123.json

# 3. 监控状态
./scripts/status.sh ai-task-123
```

### CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Run LinchKit Workflow
  run: |
    cd .devcontainer/workflow-mvp
    ./scripts/run-workflow.sh ${{ matrix.task }}.json
```

## 🚀 Phase 2 预览

当前 Phase 1 为后续阶段奠定了基础：

- **Phase 2**: TypeScript API 包 (`@linchkit/ai`)
- **Phase 3**: Web 管理界面

### 迁移路径

Phase 1 的配置格式将在 Phase 2 中保持兼容，确保平滑迁移。

## 📄 许可证

本项目是 LinchKit 框架的一部分，遵循项目主许可证。

---

**LinchKit 并行开发工作流 - 让 AI 和人类开发者高效协作** 🤖🚀