# LinchKit 开发工作流程与约束

**版本**: v2.0.3  
**更新**: 2025-07-07  
**状态**: 单一信息源 - 所有开发约束的统一文档

## 🚨 核心约束

**📋 完整约束**: 详见 [Essential_Rules.md](../00_Getting_Started/03_Essential_Rules.md)

### 架构依赖顺序

```
core → schema → auth → crud → trpc → ui → console
```

- **禁止循环依赖**
- **必须使用 LinchKit 内部包功能**，禁止重复实现

### 构建质量标准

- **测试覆盖率达标**:
  - 核心包 (@linch-kit/core): 98%+
  - 关键包 (auth, schema, crud): 95%+
  - UI组件包: 90%+
  - 应用层: 85%+
- **构建时间** < 10秒
- **🚨 测试同步要求**: 功能更新必须同步更新测试（禁止提交未测试的代码）

### 防御性编程强制要求

- **🔴 所有函数必须验证输入**
- **🔴 所有异步操作必须错误处理**
- **🔴 关键业务逻辑必须断言**

## 🛠️ 开发流程

### 🔴 每次 Session 启动检查清单

**📋 完整检查清单**: 详见 [Essential_Rules.md](../00_Getting_Started/03_Essential_Rules.md)

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

**📋 完整任务管理要求**: 详见 [Essential_Rules.md](../00_Getting_Started/03_Essential_Rules.md)

#### 任务状态管理

- **pending**: 待开始的任务
- **in_progress**: 当前正在进行（限制：同时只能有1个）
- **completed**: 已完成的任务

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
;<img src={user.avatar} alt="avatar" />

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
- **Schema定义**: `tools/schema` defineEntity - 不要直接用 Zod
- **权限检查**: `@linch-kit/auth` PermissionChecker - 不要自己实现权限逻辑
- **CRUD操作**: `@linch-kit/platform` createCRUD - 不要手写增删改查
- **UI组件**: `@linch-kit/ui` 组件库 - 不要重复创建基础组件

### 第三方库使用规范

- **必须通过 LinchKit 包**访问第三方库功能
- **禁止直接依赖**已被 LinchKit 封装的库
- **新依赖需评估**是否应该封装到 LinchKit 包中

## 📦 包架构标准 (Client/Server 分离)

### 🎯 适用范围

- **包含 React 组件的所有 packages**
- **所有 Next.js 应用** (starter, console, website)
- **新开发的组件库和模块**

### 📁 标准目录结构

```
packages/[package-name]/
├── src/
│   ├── client/          # 客户端组件 ('use client')
│   │   ├── interactive/ # 交互组件 (buttons, forms, modals)
│   │   └── stateful/    # 有状态组件 (providers, contexts)
│   ├── server/          # 服务端组件 (默认)
│   │   ├── static/      # 静态展示组件
│   │   └── layout/      # 布局组件
│   ├── shared/          # 共享代码 (types, utils, constants)
│   ├── client.ts        # 客户端导出入口
│   ├── server.ts        # 服务端导出入口
│   └── shared.ts        # 共享代码导出入口
├── package.json         # 多入口点导出配置
```

### 🔀 组件分类原则

#### 🖥️ 客户端组件 (client/) 条件

- 使用 React hooks: `useState`, `useEffect`, `useContext`
- 需要事件监听器: `onClick`, `onSubmit`, `onFocus`
- 使用浏览器 API: `localStorage`, `sessionStorage`, `window`
- 需要交互状态管理: 表单状态、模态框控制
- 使用第三方客户端库: `react-query`, `zustand`

#### 🖥️ 服务端组件 (server/) 条件

- 纯展示组件: 静态内容渲染
- 服务端数据获取: 直接数据库查询
- SEO 友好组件: 需要服务端渲染的内容
- 布局组件: 不需要交互的布局结构
- 可序列化 props: 只接收可序列化的属性

#### 🔄 共享代码 (shared/) 条件

- 类型定义: `interface`, `type`, `enum`
- 纯函数: 不依赖 DOM 或浏览器 API
- 常量: 配置常量、枚举值
- 工具函数: 数据转换、验证等

### 📤 package.json 导出配置

```json
{
  "name": "@linch-kit/package-name",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./client": {
      "import": "./dist/client.mjs",
      "types": "./dist/client.d.ts"
    },
    "./server": {
      "import": "./dist/server.mjs",
      "types": "./dist/server.d.ts"
    },
    "./shared": {
      "import": "./dist/shared.mjs",
      "types": "./dist/shared.d.ts"
    }
  }
}
```

### 🔧 tsup 构建配置

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/client.ts'],
    outDir: 'dist',
    format: ['esm'],
    dts: true,
    external: ['react', 'react-dom'],
    banner: {
      js: '"use client";',
    },
  },
  {
    entry: ['src/server.ts'],
    outDir: 'dist',
    format: ['esm'],
    dts: true,
    external: ['react', 'react-dom'],
  },
  {
    entry: ['src/shared.ts'],
    outDir: 'dist',
    format: ['esm'],
    dts: true,
  },
])
```

### 📝 使用示例

```typescript
// 应用中的导入方式
import { Button } from '@linch-kit/ui/server' // 服务端组件
import { Dialog } from '@linch-kit/ui/client' // 客户端组件
import { ButtonVariants } from '@linch-kit/ui/shared' // 共享类型

// 组件文件中的标识
// src/client/interactive/Dialog.tsx
;('use client')
import { useState } from 'react'

// src/server/static/Button.tsx
// 无需 'use client' 指令，默认为服务端组件
```

### 🚨 强制约束

1. **🔴 必须使用 'use client' 指令**：所有客户端组件文件开头必须有 `'use client'`
2. **🔴 禁止混合导出**：不能在同一个文件中导出客户端和服务端组件
3. **🔴 服务端组件默认**：组件应默认为服务端组件，只有必要时才标识为客户端
4. **🔴 分离构建配置**：必须使用 tsup 或类似工具正确处理客户端指令

### 📋 开发检查清单

开发新包时必须确认：

- [ ] 创建了 `client/`, `server/`, `shared/` 目录
- [ ] 正确分类所有组件
- [ ] 配置了多入口点导出
- [ ] 设置了正确的构建配置
- [ ] 客户端组件都有 `'use client'` 指令
- [ ] 验证了构建输出的正确性

### 🎯 最佳实践参考

**@linch-kit/ui 包**是目前项目中 client/server 分离的最佳实践范例：

- ✅ **清晰的目录结构**：client/server 分离明确
- ✅ **正确的组件分类**：交互组件在 client，静态组件在 server
- ✅ **完整的构建配置**：tsup 正确处理 'use client' 指令
- ✅ **多入口点导出**：支持按需导入客户端/服务端组件

新开发的包应该参考 @linch-kit/ui 的架构设计和实现方式。

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
bun run ai:session query "[实体名]" --debug

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

## 🎯 成功标准

每个任务完成时必须满足：

- ✅ **构建成功**: `bun build` 无错误
- ✅ **代码质量**: `bun run validate:light` 通过
- ✅ **完整验证**: `bun run validate` 全部通过
- ✅ **测试覆盖**: 达到包级别覆盖率要求
- ✅ **测试框架**: 仅使用 `bun:test`，禁止 vitest/jest
- ✅ **CI 流水线**: E2E 测试和部署验证通过
- ✅ **图谱同步**: `bun run ai:session sync` 执行
- ✅ **分支整洁**: 工作分支状态干净
- ✅ **文档更新**: 相关文档已同步更新

## 🚨 紧急情况处理

当遇到以下情况时：

- **构建失败**: 立即停止开发，优先修复构建错误
- **测试覆盖率下降**: 立即补充测试用例
- **Graph RAG 查询失败**: 必须重试或报告问题，不能绕过
- **类型错误**: 禁止使用任何形式的类型逃逸，必须正确修复

---

**版本**: v8.0 - AI Code Quality Assurance Integration  
**更新**: 2025-07-11  
**状态**: 单一信息源 - 已整合v8.0核心约束

**维护者**: Claude AI  
**协商伙伴**: Gemini  
**核心原则**: 遵循约束，查询优先，质量至上。

**单一信息源**: 本文档是所有开发约束的唯一权威来源
