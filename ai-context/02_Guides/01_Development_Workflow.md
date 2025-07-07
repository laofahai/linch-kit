# LinchKit 开发工作流程与约束

**版本**: v7.2  
**更新**: 2025-07-07  
**状态**: 单一信息源 - 所有开发约束的统一文档

## 🚨 核心约束

### 1. TypeScript 严格模式
- **禁止 `any` 类型**，使用 `unknown` 替代
- **严格模式**，所有文件使用 TypeScript
- **端到端类型安全**

### 2. 包管理规范
- **仅使用 bun**，禁止 npm/yarn
- **环境路径**:
  ```bash
  export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
  ```

### 3. 架构依赖顺序
```
core → schema → auth → crud → trpc → ui → console
```
- **禁止循环依赖**
- **必须使用 LinchKit 内部包功能**，禁止重复实现

### 4. 构建质量标准
- **测试覆盖率** > 80% (core > 90%)
- **构建时间** < 10秒
- **无 ESLint 错误**
- **🚨 测试同步要求**: 功能更新必须同步更新测试（禁止提交未测试的代码）

### 5. 分支并行开发规范
- **主分支保护**: 直接在 `main`, `master`, `develop`, `release/*` 分支上工作是禁止的
- **开发工作隔离**: 所有功能开发、Bug修复、实验性工作必须在专门的功能分支中进行
- **分支命名规范**: 
  - 功能开发: `feature/[descriptive-name]`
  - Bug修复: `fix/[issue-description]`
  - 实验性: `experiment/[technology]`
- **分支生命周期**: 从 main 创建 → 开发 → PR → 合并 → 删除
- **强制检查**: AI助手每次开始工作前必须验证当前分支，违规时立即创建合适的功能分支
- **清理责任**: 完成工作后必须及时清理本地和远程分支

## 🛠️ 开发流程

### 🔴 每次 Session 启动检查清单
1. **分支检查**: `git branch --show-current` 确认不在受保护分支
2. **工作目录**: `git status` 检查工作目录状态
3. **待办事项**: 使用 `TodoRead` 检查上次未完成任务
4. **AI Session 工具**: 必要时运行 `bun run ai:session init`

### 🔴 设计文档强制要求

**每次开发前必须完成设计阶段**：

#### 1. 设计文档检查
- **检查是否存在 DESIGN.md** - 在目标模块/应用目录下
- **评估设计完整性** - 是否涵盖架构、接口、用户体验等
- **如无设计文档** - 立即停止开发，先完成设计

#### 2. 设计协商流程
当缺少设计文档时，必须按以下流程执行：

```bash
# 1. 分析现有代码结构和需求
# 2. 与 Gemini 协商最佳实践
# 3. 生成详细设计文档
# 4. 用户确认设计方案
# 5. 更新相关架构文档
```

#### 3. Gemini 协商触发
使用关键词触发协商：
- **"与Gemini协商设计最佳实践"**
- **"请Gemini分析架构方案"**
- **"让Gemini评估技术选型"**

### 📋 任务管理强制要求

#### 1. 强制使用场景
- **3步以上任务**: 涉及多个文件或步骤的任务
- **多文件修改**: 需要修改超过2个文件的任务
- **新功能开发**: 任何新功能的实现
- **重大重构**: 架构或设计的重大调整

#### 2. 任务状态管理
- **pending**: 待开始的任务
- **in_progress**: 当前正在进行（限制：同时只能有1个）
- **completed**: 已完成的任务

#### 3. 实时更新要求
- **开始任务**: 立即标记为 `in_progress`
- **完成任务**: 立即标记为 `completed`
- **阻塞情况**: 创建新任务描述需要解决的问题

## 🔒 质量控制强化机制

### 🚫 ESLint 违规处理策略

**原则**: 零容忍 `eslint-disable` 滥用

#### 1. 禁止情况
- **禁用整个文件**: `/* eslint-disable */`
- **批量禁用规则**: `/* eslint-disable multiple-rules */`
- **无说明的禁用**: 没有 `-- 原因说明` 的禁用注释

#### 2. 允许的例外
仅在以下情况下允许使用 `eslint-disable-next-line`：
```tsx
// 第三方库兼容性问题
// eslint-disable-next-line @next/next/no-img-element -- 用户头像来自第三方API
<img src={user.avatar} alt="avatar" />

// 性能优化的必要违规
// eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在组件挂载时执行
useEffect(() => initializeApp(), [])
```

### 🔍 强制性包复用检查

**原则**: 必须使用LinchKit内部包功能，禁止重复实现

#### 1. 开发前检查
**强制要求**: 每次开发新功能前必须执行包复用检查

```bash
# 开发新功能前必须执行
bun check-reuse [关键词]

# 检查结果示例：
# [发现匹配] packages/ui/src/components/ui/sidebar.tsx
# [发现匹配] packages/ui/src/components/ui/tabs.tsx
```

#### 2. 违规处理
- **发现现有实现**: 必须使用现有包，禁止重新实现
- **需要扩展**: 在现有包基础上扩展，而非创建新实现
- **确实需要新建**: 必须在 `@linch-kit/ui` 中创建后再使用

## 🧪 测试同步强制要求

**原则**: 功能代码与测试代码必须同步开发和更新

### 1. 强制测试场景
- **新功能开发**: 每个新功能必须在完成后立即编写测试
- **功能修改**: 修改现有功能必须同步更新相关测试
- **API 接口变更**: 修改公共 API 必须同步更新测试用例
- **bug 修复**: 修复 bug 后必须添加防止回归的测试

### 2. 开发流程要求
每次功能开发必须按以下顺序执行：

```bash
# 阶段 1: 编写功能代码
bun dev  # 开发模式

# 阶段 2: 立即编写测试（在同一个 commit 中）
touch src/__tests__/[feature].test.ts

# 阶段 3: 验证测试
bun test                    # 运行所有测试
bun test --coverage         # 检查覆盖率

# 阶段 4: 提交代码（功能 + 测试一起提交）
git add .
git commit -m "feat: implement feature X with comprehensive tests"
```

### 3. 覆盖率要求
- **新功能**: 必须达到 90%+ 测试覆盖率
- **修改功能**: 不能降低现有覆盖率
- **核心模块** (@linch-kit/core): 保持 95%+ 覆盖率
- **公共 API**: 必须 100% 覆盖

## 📦 包功能复用

### 强制使用 LinchKit 内部功能
**绝对禁止**重新实现已有功能，必须复用：
- **日志系统**: `@linch-kit/core` logger - 不要用 console.log 或其他日志库
- **配置管理**: `@linch-kit/core` ConfigManager - 不要自己读取配置文件
- **Schema定义**: `@linch-kit/schema` defineEntity - 不要直接用 Zod
- **权限检查**: `@linch-kit/auth` PermissionChecker - 不要自己实现权限逻辑
- **CRUD操作**: `@linch-kit/crud` createCRUD - 不要手写增删改查
- **UI组件**: `@linch-kit/ui` 组件库 - 不要重复创建基础组件

### 第三方库使用规范
- **必须通过 LinchKit 包**访问第三方库功能
- **禁止直接依赖**已被 LinchKit 封装的库
- **新依赖需评估**是否应该封装到 LinchKit 包中

## 🌳 Git 工作流程

### 分支管理
```bash
# 检查当前环境
pwd                           # 确认当前目录
git branch --show-current     # 确认当前分支
git status                   # 查看工作目录状态

# 如不在 main 分支，先切换到 main
git checkout main
git pull origin main          # 获取最新更新

# 创建新的功能分支
git checkout -b feature/your-task-name
```

### 提交规范
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

### 分支清理
- **PR 合并后**：必须立即删除本地和远程分支
- **本地分支清理**：`git branch -d feature/branch-name`
- **远程分支清理**：`git push origin --delete feature/branch-name`

## 🔧 必须命令

### 开发命令
```bash
# 开发
bun dev

# 验证
bun build
bun test

# 完整验证
bun validate
```

### AI Session 工具
```bash
# 快速初始化
bun run ai:session init

# 智能分支创建
bun run ai:session branch [task-description]

# 上下文查询
bun run ai:session query "[实体名]"

# 图谱数据同步
bun run ai:session sync

# 完整验证
bun run ai:session validate
```

## 📝 文档管理约束

### 1. 单一信息源原则
- **避免重复**: 同一信息只在一个文档中维护
- **使用链接**: 需要引用时使用 Markdown 链接
- **禁止复制**: 绝不复制粘贴内容到多个文档

### 2. 文档更新责任
- **功能完成** → 立即更新相关文档
- **架构变更** → 更新架构文档
- **新约束** → 添加到本文档
- **计划调整** → 更新路线图

### 3. AI助手行为约束
- **必读文档**: 每次Session必须读取 ai-context/manifest.json
- **信息更新**: 完成任务后必须更新相关文档
- **链接使用**: 引用信息时优先使用链接而非复制
- **严格遵守**: 严格按照本文档执行所有开发约束

---

**维护者**: Claude AI  
**协商伙伴**: Gemini  
**单一信息源**: 本文档是所有开发约束的唯一权威来源