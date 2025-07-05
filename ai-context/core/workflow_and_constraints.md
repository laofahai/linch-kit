# LinchKit 工作流程与开发约束

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

### 5. UI 组件规范
- **shadcn/ui 组件** 使用 `bun dlx shadcn@latest add [component]`
- **必须导出** 到 `@linch-kit/ui/components`

### 6. Tailwind CSS 4 规范
- **统一配置源**: 所有样式从 `@linch-kit/ui/src/styles/globals.css` 引用
- **CSS-first 配置**: 使用 `@import "tailwindcss"` 和 `@theme` 指令
- **禁用 tailwind.config.js**: 使用 CSS 文件配置主题
- **动画库**: 使用 `tw-animate-css` 替代 `tailwindcss-animate`
- **主题变量**: 使用 `hsl()` 包装所有颜色变量

### 7. Next.js 15.3.4 规范
- **React版本**: 必须使用 React 19.0.0
- **TypeScript版本**: 使用 TypeScript ^5
- **严格模式**: 确保 tsconfig.json 中 strict: true
- **App Router**: 优先使用 App Router 而非 Pages Router
- **Server Components**: 合理使用服务端组件减少客户端JavaScript

### 8. 审计功能规范
- **基础功能**: 保持在 @linch-kit/core 中，不单独拆分
- **扩展接口**: 为未来高级功能预留扩展点
- **商业化考虑**: 基础版满足中小企业需求，高级版作为商业扩展

## 🛠️ 开发流程

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
# 5. 更新 system_architecture 相关文档
```

#### 3. 设计文档标准
**必须包含的设计要素**：
- **架构设计** - 组件层次、数据流、状态管理
- **接口规范** - API 设计、类型定义、交互协议
- **用户体验** - 交互流程、视觉设计、响应式布局
- **技术选型** - 依赖库选择、性能考量、扩展性设计
- **实现计划** - 开发阶段、里程碑、测试策略

#### 4. Gemini 协商触发
使用关键词触发协商：
- **"与Gemini协商设计最佳实践"**
- **"请Gemini分析架构方案"**
- **"让Gemini评估技术选型"**

#### 5. 设计确认流程
- **生成设计文档** - 基于分析和协商结果
- **用户确认** - 必须获得用户明确同意
- **更新架构文档** - 同步到 system_architecture 目录
- **开始开发** - 严格按照确认的设计执行

### 必须命令
```bash
# 开发
bun dev

# 验证
bun build
bun test

# 完整验证
bun validate
```

### 代码规范
- **JSDoc 注释** 所有公共 API
- **修改后运行** ESLint 自动修复

## 🔒 质量控制强化机制

### 🧪 测试同步强制要求

**原则**: 功能代码与测试代码必须同步开发和更新

#### 1. 强制测试场景
- **新功能开发**: 每个新功能必须在完成后立即编写测试
- **功能修改**: 修改现有功能必须同步更新相关测试
- **API 接口变更**: 修改公共 API 必须同步更新测试用例
- **bug 修复**: 修复 bug 后必须添加防止回归的测试

#### 2. 开发流程要求
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

#### 3. 覆盖率要求
- **新功能**: 必须达到 90%+ 测试覆盖率
- **修改功能**: 不能降低现有覆盖率
- **核心模块** (@linch-kit/core): 保持 95%+ 覆盖率
- **公共 API**: 必须 100% 覆盖

#### 4. 测试类型要求
- **单元测试**: 每个函数/类/组件的核心逻辑
- **集成测试**: API 接口的完整流程
- **错误处理**: 异常情况和边界条件
- **性能测试**: 关键路径的性能指标

#### 5. 禁止行为
- ❌ **禁止无测试提交**: 任何功能代码都不能在没有测试的情况下提交
- ❌ **禁止跳过测试**: 不能以"时间紧迫"为理由跳过测试
- ❌ **禁止降低覆盖率**: 任何修改都不能导致覆盖率下降
- ❌ **禁止虚假测试**: 测试必须有意义，不能为了覆盖率而写测试

#### 6. 测试迁移规范（Vitest → Bun）
基于 @linch-kit/core 成功迁移经验：

```bash
# 1. 更新 package.json
"scripts": {
  "test": "bun test",
  "test:coverage": "bun test --coverage"
}

# 2. 更新测试文件导入
- import { describe, it, expect, beforeEach, vi } from 'vitest'
+ import { describe, it, expect, beforeEach, mock } from 'bun:test'

# 3. 更新 mock 语法
- vi.mock('module', () => ({ ... }))
+ mock.module('module', () => ({ ... }))

- vi.fn()
+ mock()

# 4. 移除 vitest 依赖
bun remove vitest @vitest/coverage-v8
rm vitest.config.ts
```

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

#### 3. 正确处理流程
1. **优先修复**: 总是优先修复ESLint错误而非禁用规则
2. **移除未使用**: 删除未使用的变量、参数、导入
3. **重构代码**: 改进代码结构以符合规范
4. **详细说明**: 必须使用时提供详细的技术说明

### 🔍 强制性包复用检查

**原则**: 必须使用LinchKit内部包功能，禁止重复实现

#### 1. 开发前检查
**强制要求**: 每次开发新功能前必须执行包复用检查

创建检查脚本: `scripts/check-reuse.mjs`
```javascript
// 自动搜索现有 @linch-kit/* 包中的相关实现
import { glob } from 'glob'
import { readFile } from 'fs/promises'

const keywords = process.argv.slice(2)
const searchPattern = 'packages/**/*.{ts,tsx}'
const files = await glob(searchPattern, { ignore: '**/node_modules/**' })

// 搜索关键词匹配
```

添加到 `package.json`:
```json
{
  "scripts": {
    "check-reuse": "node ./scripts/check-reuse.mjs"
  }
}
```

#### 2. 使用流程
```bash
# 开发新功能前必须执行
bun check-reuse sidebar tabs layout

# 检查结果示例：
# [发现匹配] packages/ui/src/components/ui/sidebar.tsx
# [发现匹配] packages/ui/src/components/ui/tabs.tsx
```

#### 3. 违规处理
- **发现现有实现**: 必须使用现有包，禁止重新实现
- **需要扩展**: 在现有包基础上扩展，而非创建新实现
- **确实需要新建**: 必须在 `@linch-kit/ui` 中创建后再使用

### 📋 任务管理强制要求

**原则**: 复杂任务必须使用TodoWrite追踪进度

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

#### 4. 跨 Session 进度管理 🔄
**强制要求**: 使用 TodoWrite/TodoRead 在 Session 间保持开发连续性

##### Session 开始规范
- **第一步**: 执行 `TodoRead` 检查上一个 session 的待办事项
- **评估连续性**: 是否继续之前的任务或开始新任务
- **状态继承**: 将未完成任务的 `in_progress` 状态接续或改为 `pending`

##### Session 结束规范
- **保存进度**: 将当前任务状态更新到 todo 列表
- **进度标记**: 明确标记已完成的部分和待完成的部分
- **阻塞记录**: 记录遇到的问题和下一步的解决方向

##### Session 切换最佳实践
```javascript
// Session N 结束时
TodoWrite([
  {id: "1", content: "修复 @linch-kit/auth 测试", status: "completed", priority: "high"},
  {id: "2", content: "迁移到 Bun 测试框架", status: "in_progress", priority: "high"},
  {id: "3", content: "更新所有包的测试配置", status: "pending", priority: "medium"}
])

// Session N+1 开始时
TodoRead() // 检查上次进度
// 继续 task 2 或根据用户需求调整优先级
```

##### 长期任务管理
- **任务拆分**: 大任务拆分为多个 session 可完成的小任务
- **里程碑记录**: 重要进展及时更新到 ai-context/roadmap.md
- **依赖追踪**: 记录任务间的依赖关系，合理安排开发顺序

### 🔄 文档同步自动化

**原则**: 开发完成后必须更新相关文档

#### 1. 强制更新文档
- **ai-context/changelog.md**: 记录新功能和重要修复
- **ai-context/roadmap.md**: 更新任务状态和里程碑
- **ai-context/development-status.md**: 同步开发进度

#### 2. 文档更新检查清单
- [ ] changelog 记录变更
- [ ] roadmap 更新状态
- [ ] development-status 同步进度
- [ ] README 更新（如需要）

### ⚡ 自动化预检查机制

#### 1. Git Hooks 配置
使用 husky 配置 pre-commit hooks:
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 运行格式化和lint检查
bun lint-staged

# 确保构建成功
bun build
```

#### 2. lint-staged 配置
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": "prettier --write"
  }
}
```

#### 3. CI/CD 质量门禁
在 `.github/workflows/ci.yml` 中强制执行：
- **构建检查**: `bun build`
- **代码质量**: `bun lint`
- **测试验证**: `bun test`
- **类型检查**: `tsc --noEmit`

### 🚨 违规检测与处理

#### 1. 自动检测机制
- **ESLint禁用检测**: 检查不当的eslint-disable使用
- **包重复检测**: 扫描是否有重复实现
- **文档同步检测**: 检查文档是否与代码同步

#### 2. 违规处理流程
1. **立即停止**: 发现违规立即停止开发
2. **问题修复**: 按正确流程修复问题
3. **流程重启**: 从正确的检查流程重新开始
4. **预防更新**: 更新约束文档防止重复

#### 3. 质量标准
- **构建成功**: 所有代码必须能成功构建
- **ESLint通过**: 不允许有ESLint错误
- **测试通过**: 相关测试必须全部通过
- **文档完整**: 相关文档必须及时更新
- **类型安全** 优先于代码简洁

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

### 📅 提交频率约束
- **功能开发**：每完成一个独立功能点立即提交
- **Bug修复**：发现并修复Bug后立即提交
- **重构操作**：重构完成后立即提交
- **文档更新**：文档修改后立即提交
- **最大间隔**：连续开发不得超过2小时未提交

### 🌿 分支清理强制要求
- **PR 合并后**：必须立即删除本地和远程分支
- **本地分支清理**：`git branch -d feature/branch-name`
- **远程分支清理**：`git push origin --delete feature/branch-name`
- **违规后果**：累积未清理分支将导致仓库混乱，影响团队协作
- **强制提交**：Session结束前必须提交所有更改

### 🔄 Worktree 并行开发约束

**详细流程参考**: [architecture/worktree-parallel-development.md](../architecture/worktree-parallel-development.md)

#### 核心约束
- **强制位置**：所有worktree必须在 `worktrees/` 目录下
- **命名规范**：遵循 `feature-[name]` / `hotfix-[issue]` / `experiment-[tech]` 格式
- **生命周期管理**：创建→开发→清理，不允许长期保留已完成的worktree
- **环境隔离**：每个worktree独立依赖安装和构建验证
- **配置继承**：自动共享主仓库的 `.claude/settings.local.json` 配置

#### 强制清理要求
完成开发后必须立即清理：worktree目录 + 远程分支 + 本地分支

### 🎯 提交粒度标准
- **单一职责**：每次提交只做一件事
- **完整功能**：提交的代码必须是可工作的状态
- **明确描述**：提交信息必须清晰说明本次更改的目的和影响
- **相关变更**：相关的测试、文档、配置一起提交

## 🔒 安全要求

- **禁止提交敏感信息** (密钥、Token)
- **使用环境变量** 管理配置
- **定期安全检查** `bun audit`

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

## 📖 Context7 文档查询规范

### 🎯 优先查询的核心库
使用以下技术时建议查询 Context7 文档：
- **Next.js** - 框架配置、路由、API 等
- **React** - 组件、Hooks、状态管理
- **TypeScript** - 类型定义和最佳实践
- **Tailwind CSS** - 样式和主题配置
- **Prisma** - 数据库操作和 Schema
- **tRPC** - API 设计和类型安全
- **Zod** - Schema 验证和转换
- **shadcn/ui** - UI 组件使用
- **NextAuth.js** - 认证配置

### 文档驱动开发流程
```
文档查询 → 理解最佳实践 → 设计架构 → 编写代码 → 验证合规性
```

## 🛠️ 技术选型决策矩阵

### 🎯 核心原则
1. **不重复造轮子** - 优先使用成熟的第三方库
2. **企业级标准** - 选择经过生产验证的解决方案
3. **AI友好** - 选择AI容易理解和处理的技术栈
4. **类型安全** - 100% TypeScript支持

### 🔴 必须依赖第三方库 (禁止自建)
| 功能类别 | 推荐库 | 禁止自建原因 |
|---------|--------|-------------|
| **认证系统** | NextAuth.js | 安全漏洞风险极高 |
| **ORM/数据库** | Prisma | 复杂度极高，维护成本巨大 |
| **日志系统** | Pino | 性能优化复杂 |
| **加密/哈希** | Node.js crypto | 安全实现风险 |
| **JSON Schema** | Zod | 类型系统复杂性 |
| **国际化基础** | i18next | 本地化复杂性 |

### 🟡 混合策略 (基础依赖+企业扩展)
| 功能类别 | 基础库 | 自建扩展 |
|---------|--------|---------|
| **配置管理** | Convict | 多租户、热更新 |
| **可观测性** | OpenTelemetry | 业务指标、告警 |
| **缓存系统** | LRU-cache/Redis | 分布式、策略 |
| **事件系统** | EventEmitter3 | 类型安全、中间件 |

### 🟢 必须自建 (核心差异化功能)
| 功能类别 | 自建原因 |
|---------|---------|
| **插件系统** | LinchKit核心架构 |
| **Schema DSL** | 领域特定语言 |
| **代码生成器** | Schema驱动核心 |
| **权限引擎** | 企业级RBAC/ABAC |

### 🚫 严格禁止的重复造轮子
#### 数据库相关
- ❌ **查询构建器** - 使用Prisma
- ❌ **连接池** - 使用Prisma内置
- ❌ **迁移系统** - 使用Prisma Migrate

#### 安全相关
- ❌ **密码哈希** - 使用bcrypt/argon2
- ❌ **JWT处理** - 使用jose/jsonwebtoken
- ❌ **加密解密** - 使用Node.js crypto

#### 工具相关
- ❌ **时间处理** - 使用date-fns
- ❌ **UUID生成** - 使用uuid库
- ❌ **文件系统操作** - 使用fs-extra

## 🔴 技术约束强制要求

### ⚠️ 开发环境要求
```bash
# Node.js 环境路径（每次 session 需要设置）
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
```

### 📋 技术实现检查清单
- [ ] ✅ 使用正确的包管理工具（bun）？
- [ ] ✅ 遵循架构依赖顺序？  
- [ ] ✅ 使用 LinchKit 内部包功能？
- [ ] ✅ 符合代码质量标准？

## 📚 文档管理约束

### 1. 单一信息源原则
- **避免重复**: 同一信息只在一个文档中维护
- **使用链接**: 需要引用时使用 Markdown 链接 `[文档名](./path/file.md)`
- **禁止复制**: 绝不复制粘贴内容到多个文档

### 2. 文档更新责任
- **功能完成** → 立即更新 `changelog.md`
- **架构变更** → 更新 `system_architecture/` 相关文档
- **新约束** → 添加到本文档 `workflow_and_constraints.md`
- **计划调整** → 更新 `roadmap.md`
- **重大决策** → 记录在相应架构文档中

### 3. AI助手行为约束
- **必读文档**: 每次Session必须按照 CLAUDE.md 中的检查清单执行
- **信息更新**: 完成任务后必须更新相关文档
- **链接使用**: 引用信息时优先使用链接而非复制
- **严格遵守**: 严格按照本文档执行所有开发约束

### 4. 文档质量标准
- **准确性**: 信息必须准确、最新
- **完整性**: 不遗漏重要信息
- **清晰性**: 表达清晰、易于理解
- **一致性**: 术语和格式保持一致

### 5. Worktree 临时文档整合策略

**适用场景**: 在 worktree 中进行的集成任务、实验性开发、特定功能开发

#### 5.1 临时文档生命周期
- **创建阶段**: 在 worktree 根目录创建 `DESIGN.md` 记录当前任务的详细设计
- **开发阶段**: 在临时文档中记录设计决策、技术选型、实现细节
- **完成阶段**: 将核心信息整合到主文档体系，删除临时文档

#### 5.2 整合目标映射
根据文档内容类型，将临时文档整合到对应的主文档：

| 内容类型 | 目标文档 | 整合方式 |
|---------|---------|---------|
| **架构设计** | `ai-context/architecture/` 相关文档 | 更新系统架构设计 |
| **模块设计** | `modules/*/DESIGN.md` | 更新模块内部设计 |
| **集成方式** | `ai-context/architecture/frontend_applications.md` | 记录应用集成架构 |
| **重大决策** | `ai-context/history/changelog.md` | 记录决策历史 |
| **新约束** | `ai-context/core/workflow_and_constraints.md` | 更新开发约束 |
| **计划变更** | `ai-context/roadmap/roadmap.md` | 更新开发计划 |

#### 5.3 AI助手整合流程
**任务完成时必须执行的整合步骤**：

1. **信息分类** - 将临时文档内容按类型分类
2. **目标确定** - 根据上表确定每类信息的目标文档
3. **内容整合** - 将信息整合到目标文档中，保持逻辑一致性
4. **链接更新** - 更新相关文档间的引用链接
5. **临时清理** - 删除 worktree 中的临时文档
6. **验证完整** - 确认所有重要信息都已保存到主文档体系

#### 5.4 整合质量检查
- [ ] 核心设计决策已记录到架构文档
- [ ] 技术实现细节已更新到相关模块文档
- [ ] 重大变更已记录到 changelog
- [ ] 相关约束已更新到 workflow_and_constraints
- [ ] 临时文档已删除，无信息冗余
- [ ] 文档链接关系正确，便于AI助手查阅

#### 5.5 未来AI助手查阅指南
当 AI 助手需要了解历史集成任务或设计决策时，应查阅：
- **系统架构** → `ai-context/architecture/`
- **模块设计** → `modules/*/DESIGN.md`
- **历史决策** → `ai-context/history/changelog.md`
- **当前状态** → `ai-context/roadmap/roadmap.md`

### 6. 强制性文档同步检查
每次任务完成后，AI助手必须验证：
- [ ] 是否存在未整合的临时文档
- [ ] 重要信息是否已记录到主文档体系
- [ ] 文档链接关系是否正确
- [ ] 是否违反单一信息源原则

这些约束确保 LinchKit 框架的一致性、安全性和可维护性。