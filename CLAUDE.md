# LinchKit 开发指南

**版本**: v2.0.0  
**项目**: LinchKit - AI-First 全栈开发框架  
**更新**: 2025-07-03

## ⚠️ 开发前必读

**每个新的开发 session 强制要求：**
1. **设置环境**: `export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"`
2. **阅读开发约束**: `ai-context/zh/current/development-constraints.md` - **必须遵守**
3. **查看当前状态**: `ai-context/zh/current/development-status.md` - 了解项目进度

## 🚀 快速开始

LinchKit 是生产就绪的企业级 AI-First 全栈开发框架，采用 Schema 驱动架构。

### 开发命令
```bash
# 环境设置（每次必须）
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"

# 开发流程
pnpm dev        # 开发模式
pnpm build      # 构建验证
pnpm validate   # 完整验证
```

### 架构层次
```
L0: @linch-kit/core      ✅ 基础设施 (100%)
L1: @linch-kit/schema    ✅ Schema引擎 (100%)
L2: @linch-kit/auth      ✅ 认证权限 (100%)
L2: @linch-kit/crud      ✅ CRUD操作 (100%)
L3: @linch-kit/trpc      ✅ API层 (100%)
L3: @linch-kit/ui        ✅ UI组件 (100%)
L4: modules/console      ✅ 管理平台 (100%)
```

## 📚 核心文档

### 🔴 强制性文档
- **🔒 开发约束**: `ai-context/zh/current/development-constraints.md` - **必须遵守的核心规范**
- **🔄 开发进度**: `ai-context/zh/current/development-status.md` - 项目最新状态和待办事项

### 📖 参考文档
- **🌳 Git工作流**: `ai-context/zh/system-design/git-workflow.md` - 分支管理、提交规范、PR流程
- **🚀 发布流程**: `ai-context/zh/system-design/release-process.md` - 完整发布流程和CI/CD
- **🏗️ 模块架构**: `ai-context/zh/system-design/module-architecture-design.md` - 系统架构设计
- **📖 API参考**: `ai-context/zh/current/packages-api-reference.md` - 包功能速查
- **🏛️ 系统架构**: `ai-context/zh/system-design/architecture.md` - 详细架构设计
- **🤖 AI包设计**: `ai-context/zh/system-design/ai-package-design.md` - AI功能规划

## 🔒 核心约束（必须遵守）

**⚠️ 开发前必须阅读完整约束文档**: `ai-context/zh/current/development-constraints.md`

### 关键约束摘要
1. **TypeScript 严格模式** - 禁止使用 `any`，使用 `unknown` 替代
2. **包管理规范** - 仅使用 pnpm，禁止 npm/yarn
3. **架构依赖顺序** - core → schema → auth → crud → trpc → ui → console
4. **功能复用原则** - 必须使用 LinchKit 内部包功能，禁止重复实现
5. **发布流程** - 禁止手动发布，必须使用 CI/CD 自动化
6. **质量标准** - 测试覆盖率 core>90%, 其他>80%，构建时间<10秒

## 💡 AI 开发模式

### 继续开发流程
当用户说"继续开发"或开始新任务时：
1. **必须先阅读** `ai-context/zh/current/development-status.md` - 了解当前进度
2. **理解约束** 参考 `ai-context/zh/current/development-constraints.md`
3. **确定任务** 从开发状态文档中选择下一个任务
4. **实施开发** 严格遵循架构和约束
5. **验证结果** 运行测试和构建
6. **更新文档** 在 development-status.md 中记录进度

### 开发检查清单
- [ ] 已读取最新开发状态？
- [ ] 理解所有开发约束？
- [ ] 使用正确的包功能？
- [ ] 遵循依赖顺序？
- [ ] 通过所有验证？
- [ ] **代码修改后必须按Git流程处理**：changeset → 提交 → PR → 合并 → 自动发布 → 清理分支

### 🔄 Session 切换管理
**重要**: 当对话接近 token 限制时，必须主动管理session切换：

1. **保存进度**：
   - 使用 TodoWrite 工具更新任务状态
   - 更新 development-status.md 记录完成的工作
   - 记录当前工作的关键文件路径和代码位置

2. **提供 session 切换 prompt**：
   ```
   建议保存进度开启 new session
   
   下一个 session 请使用以下 prompt：
   [具体的继续开发指令，包含：]
   - 当前完成状态 (✅❌⏳)  
   - 下一步具体任务
   - 相关文件路径
   - 需要注意的约束
   ```

3. **session 切换触发条件**：
   - 对话长度超过 100 轮
   - 感觉接近 token 限制
   - 任务阶段性完成需要总结

## 🚀 发布流程强制要求

### ⚠️ 禁止手动发布
- **绝对禁止** 手动运行 `npm publish` 或 `pnpm publish`
- **必须使用** 自动化 CI/CD 流程发布
- **所有发布** 必须通过 GitHub Actions 完成

### 🤖 完全自动化发布流程
**⚠️ 禁止手动执行任何版本管理命令**：
- ❌ **禁止** 手动运行 `pnpm changeset version`
- ❌ **禁止** 手动运行 `pnpm changeset publish`  
- ❌ **禁止** 手动编辑package.json版本号

**✅ 正确的自动化流程**：
1. **创建 changeset**: `pnpm changeset` (仅此命令允许手动执行)
2. **提交changeset**: `git add . && git commit -m "changeset: 描述修改"`
3. **推送到main**: 通过PR合并changeset到main分支
4. **GitHub Actions自动处理**:
   - 检测changeset文件
   - 自动创建Release PR (包含版本更新)
   - 当Release PR合并时自动发布到NPM

### 🔄 标准开发流程
1. **创建分支**: `git checkout -b feature/xxx` 从main创建功能分支
2. **功能开发**: 在feature分支完成开发和修复
3. **创建changeset**: `pnpm changeset` 
4. **提交代码**: 提交功能代码和changeset文件
5. **创建PR**: `gh pr create` 合并到main
6. **等待合并**: PR通过检查后合并到main分支
7. **自动发布**: GitHub Actions处理版本和发布
8. **清理分支**: PR合并后自动或手动删除开发分支

### 发布触发条件
- **主分支推送** - 自动运行测试和构建
- **标签推送** - 自动发布到 NPM
- **Changeset 检测** - 自动版本管理

### 发布验证要求
- ✅ 所有测试必须通过
- ✅ 构建必须成功 
- ✅ 代码检查必须通过
- ✅ 类型检查必须通过

## 🌳 分支管理规范

### 分支策略
- **主分支**: `main` - 生产就绪代码，受保护
- **功能分支**: `feature/xxx` - 新功能开发
- **修复分支**: `fix/xxx` - Bug 修复
- **发布分支**: `release/vx.x.x` - 版本发布准备

### 🗂️ 分支生命周期管理

#### 分支创建
```bash
# 从最新main分支创建功能分支
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

#### 分支开发
```bash
# 在功能分支上开发
git add .
git commit -m "feat: 功能描述"
git push origin feature/your-feature-name
```

#### PR创建和合并
```bash
# 创建PR
gh pr create --title "feat: 功能描述" --body "详细说明"

# PR合并后自动删除分支 (推荐在GitHub设置中启用)
# 或手动删除本地和远程分支
git checkout main
git pull origin main
git branch -d feature/your-feature-name          # 删除本地分支
git push origin --delete feature/your-feature-name  # 删除远程分支
```

#### 🤖 分支自动清理 (推荐)
在GitHub仓库设置中启用：
- **Settings** → **General** → **Pull Requests**
- ✅ **Automatically delete head branches** - PR合并后自动删除分支

#### 手动分支清理命令
```bash
# 查看所有分支
git branch -a

# 删除已合并的本地分支
git branch --merged main | grep -v "main" | xargs -n 1 git branch -d

# 清理远程分支引用
git remote prune origin

# 使用gh命令批量清理
gh pr list --state merged --json headRefName --jq '.[].headRefName' | xargs -I {} git push origin --delete {}
```

### PR (Pull Request) 规范
- **标题格式**: `feat|fix|docs|refactor: 简短描述`
- **必须包含**:
  - 变更说明
  - 测试验证 
  - 相关 issue 链接
- **合并要求**:
  - 通过 CI/CD 检查
  - 代码审查通过
  - 无冲突

### Git 提交规范
```bash
# 提交格式
git commit -m "type(scope): description

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 类型说明
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式
refactor: 重构
test:     测试相关
chore:    构建/工具
```

## ⚠️ 重要开发原则

### 禁止重复实现
**绝对禁止**重新实现 LinchKit 包中已有的功能：
- ❌ 不要自己写日志系统 → 使用 `@linch-kit/core` 的 logger
- ❌ 不要自己写配置管理 → 使用 `@linch-kit/core` 的 ConfigManager
- ❌ 不要自己写Schema验证 → 使用 `@linch-kit/schema`
- ❌ 不要自己写权限检查 → 使用 `@linch-kit/auth`
- ❌ 不要自己写CRUD逻辑 → 使用 `@linch-kit/crud`
- ❌ 不要自己写UI组件 → 使用 `@linch-kit/ui`

### 包功能速查
- **@linch-kit/core** - 日志、配置、插件系统
- **@linch-kit/schema** - Schema定义、验证、转换
- **@linch-kit/auth** - 认证、授权、会话管理
- **@linch-kit/crud** - 通用CRUD操作
- **@linch-kit/trpc** - 类型安全API
- **@linch-kit/ui** - UI组件库

### 技术栈
- **框架**: Next.js 15.3.4 + React 19.0.0  
- **语言**: TypeScript 5.8.3（严格模式）
- **样式**: Tailwind CSS 4.x + shadcn/ui
- **API**: tRPC + Zod 3.25.67
- **数据**: Prisma 6.10.1 + PostgreSQL
- **认证**: NextAuth 5.0.0-beta.25 + @linch-kit/auth

### 文件操作原则
- **永远不要**主动创建文档文件（*.md）或 README
- **总是优先**编辑现有文件而不是创建新文件
- **只创建**实现功能绝对必要的文件

## 📖 Context7 文档集成（AI必须使用）

使用 Context7 查询第三方库文档时：
1. **优先使用 Context7** - 查询 React、Vue、Next.js 等框架的最新文档
2. **调用顺序** - 先用 `resolve-library-id` 获取库ID，再用 `get-library-docs`
3. **文档优先** - 在实现功能前，先查询相关库的官方文档

## 🤝 Gemini 协作模式（复杂决策必须协商）

### 复杂决策协商机制
对于架构设计、重大技术选择、用户体验设计等复杂决策，建议与 Gemini CLI 协商：

**触发条件**：
- 架构重构或重大变更
- 新技术栈选择
- 用户体验设计决策
- 性能优化方案
- 复杂算法设计

**协商流程**：
```bash
# 设置问题描述
export PROMPT="架构设计问题：如何实现LinchKit CLI极简化架构？
- 当前问题：20+命令过于复杂
- 目标：精简到10个以内核心命令
- 约束：保持完整功能，提升开发体验
- 需要：设计建议和实施方案"

# 调用Gemini协商
gemini <<EOF
$PROMPT
EOF
```

**协商原则**：
- 融合双重AI智慧：Claude的实施经验 + Gemini的创新思维
- 决策透明化：展示Gemini的建议和Claude的解读
- 最优方案：结合两个AI代理的优势制定方案