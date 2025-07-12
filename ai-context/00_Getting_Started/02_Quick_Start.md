# LinchKit 快速启动指南

**版本**: v8.0  
**目标**: 5分钟内上手 LinchKit 开发

## 🚀 前置要求

### 环境准备

- **Node.js**: v20.19.2+
- **包管理器**: bun (强制要求，禁止使用 npm/yarn)
- **Git**: 用于版本控制
- **IDE**: 推荐 VS Code

### 环境路径设置

```bash
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
```

## ⚡ 5分钟快速启动

### 1. 项目克隆

```bash
git clone <repository-url>
cd linch-kit
```

### 2. 依赖安装

```bash
bun install
```

### 3. 开发环境启动

```bash
# 启动开发服务器
bun dev

# 或者启动特定应用
bun dev --filter @linch-kit/starter
```

### 4. 验证安装

```bash
# 运行完整验证
bun validate

# 包含：构建、测试、lint 检查
```

## 🎯 开发者快速指南

### AI Session 工具快速上手

```bash
# 初始化开发环境
bun run ai:session init

# 创建功能分支
bun run ai:session branch "your-feature-description"

# 查询项目上下文
bun run ai:session query "User"

# 同步知识图谱
bun run ai:session sync
```

### 常用开发命令

```bash
# 开发相关
bun dev                    # 启动开发服务器
bun build                  # 构建项目
bun test                   # 运行测试
bun lint                   # 代码检查

# 包管理
bun add <package>          # 添加依赖
bun remove <package>       # 移除依赖

# AI 工具
bun run ai:session help    # 查看所有 AI 工具命令
```

## 📋 开发工作流

### 1. 开始新任务

```bash
# 检查当前状态
git status
git branch --show-current

# 如果在 main 分支，创建功能分支
git checkout -b feature/your-task-name

# 使用 AI Session 工具初始化
bun run ai:session init "your task description"
```

### 2. 开发过程

```bash
# 查询相关代码上下文
bun run ai:session query "EntityName"

# 开发代码...

# 定期运行验证
bun lint
bun test
```

### 3. 完成任务

```bash
# 最终验证
bun validate

# 提交代码
git add .
git commit -m "feat: implement your feature

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 推送分支
git push -u origin feature/your-task-name
```

## 🏗️ 架构快速了解

### 核心包依赖顺序

```
@linch-kit/core → tools/schema → @linch-kit/auth → @linch-kit/platform → @linch-kit/platform → @linch-kit/ui → modules/console
```

### 主要应用

- **apps/starter**: 生产级基础应用
- **apps/website**: 文档和展示网站
- **modules/console**: 管理控制台

### 开发约束要点

- ✅ 使用 bun 包管理器
- ✅ TypeScript 严格模式
- ✅ 必须在功能分支开发
- ✅ 复用 LinchKit 内部包功能
- ❌ 禁止 eslint-disable 滥用

## 🧠 AI 功能快速体验

### Neo4j 知识图谱查询

```bash
# 启动智能查询引擎
bun dist/cli/index.js

# 尝试自然语言查询
> 找到所有认证相关的类
> 查找所有React组件
> 显示Schema相关的接口
```

### Graph RAG 上下文查询

```bash
# 查找实体定义
bun run ai:session query "User"

# 查找函数定义
bun run ai:session symbol "createUser"

# 查找实现模式
bun run ai:session pattern "add_field" "Product"
```

## 📚 文档导航

### 必读文档

1. **[开发工作流程](../02_Guides/01_Development_Workflow.md)** - 开发约束和规范
2. **[AI 工具使用指南](../02_Guides/02_AI_Tools_Usage.md)** - AI Session 工具详细指南
3. **[系统架构](../01_Architecture/02_System_Architecture.md)** - 架构设计和原则

### 参考文档

- **[包 API 文档](../03_Reference/01_Packages_API/)** - 详细 API 参考
- **[开发路线图](../98_Project_Management/01_Roadmap.md)** - 项目计划和状态

## 🎯 常见任务示例

### 添加新字段到实体

```bash
# 1. 查询实体上下文
bun run ai:session query "User"

# 2. 根据建议编辑 schema 文件
# packages/schema/src/user.ts

# 3. 创建数据库迁移
bunx prisma migrate dev

# 4. 更新相关 API 和 UI
# 根据 AI 工具建议的文件列表

# 5. 同步图谱数据
bun run ai:session sync
```

### 创建新的 UI 组件

```bash
# 1. 检查是否已有类似组件
bun check-reuse "button" "form"

# 2. 如果需要创建新组件
# 在 packages/ui/src/components/ 中创建

# 3. 导出组件
# 更新 packages/ui/src/index.ts

# 4. 编写测试
# 在 packages/ui/src/__tests__/ 中
```

## ⚠️ 重要提醒

### 必须遵循的约束

- **分支管理**: 永远在功能分支开发，不在 main 分支工作
- **包复用**: 开发前检查现有包功能，避免重复实现
- **AI 工具**: 代码相关任务必须先查询项目上下文
- **测试同步**: 功能代码和测试代码必须同步更新

### 获取帮助

- **AI Session 帮助**: `bun run ai:session help`
- **文档清单**: 查看 `ai-context/manifest.json`
- **开发约束**: 参考 [开发工作流程](../02_Guides/01_Development_Workflow.md)

## 🎉 开始开发

现在你已经准备好开始使用 LinchKit 进行开发了！

建议第一个任务：

1. 运行 `bun run ai:session init` 熟悉 AI 工具
2. 创建一个简单的功能分支体验工作流
3. 查询一个实体了解 Graph RAG 功能

---

**快速支持**: 查看 [AI 工具使用指南](../02_Guides/02_AI_Tools_Usage.md) 获取详细帮助
