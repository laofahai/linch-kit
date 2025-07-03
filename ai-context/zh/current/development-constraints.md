# LinchKit 开发约束 - Session 持久化指南

**版本**: v5.0  
**更新**: 2025-07-01  
**状态**: Session 级强制约束  
**重要性**: ⚠️ **必须在每个 session 开始时阅读**

---

## 🔴 SESSION 级强制要求

### ⚠️ 每次新 session 必须执行
```bash
# 1. 环境设置（必须）
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"

# 2. 阅读当前状态（必须）
cat ai-context/zh/current/development-status.md

# 3. 理解开发约束（本文档）
cat ai-context/zh/current/development-constraints.md
```

### 📋 Session 检查清单
- [ ] ✅ 已设置正确的 Node.js 环境路径？
- [ ] ✅ 已阅读最新开发状态文档？  
- [ ] ✅ 理解当前项目阶段和任务？
- [ ] ✅ 确认要使用的技术约束？


---

## 🚨 核心约束

### 1. TypeScript 严格模式
- **禁止 `any` 类型**，使用 `unknown` 替代
- **严格模式**，所有文件使用 TypeScript
- **端到端类型安全**

### 2. 包管理规范
- **仅使用 pnpm**，禁止 npm/yarn
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

### 5. UI 组件规范
- **shadcn/ui 组件** 使用 `pnpm dlx shadcn@latest add [component]`
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

---

## 🌳 分支管理规范

### 分支策略
- **主分支**: `main` - 生产就绪代码，受保护
- **功能分支**: `feature/xxx` - 新功能开发
- **修复分支**: `fix/xxx` - Bug 修复
- **发布分支**: `release/vx.x.x` - 版本发布准备

### 分支命名约定
```bash
# 功能开发
feature/create-cli-tool
feature/add-auth-system

# Bug 修复
fix/login-validation-error
fix/build-failure

# 发布准备
release/v1.0.3
release/v2.0.0
```

### 工作流程约束
1. **禁止直接推送到 main** - 所有变更必须通过 PR
2. **分支同步** - 开发前从 main 拉取最新代码
3. **功能完成** - 合并前必须通过所有测试
4. **清理分支** - 合并后删除功能分支

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

### CI/CD 触发条件
```yaml
# 自动触发构建和测试
push:
  branches: [main, release/*]
pull_request:
  branches: [main]

# 自动发布到 NPM  
push:
  tags: [v*]
```

---

## 🛠️ 开发流程

### 必须命令
```bash
# 开发
pnpm dev

# 验证
pnpm build
pnpm test

# 完整验证
pnpm validate
```

### 代码规范
- **JSDoc 注释** 所有公共 API
- **修改后运行** ESLint 自动修复
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
- **强制提交**：Session结束前必须提交所有更改

### 🎯 提交粒度标准
- **单一职责**：每次提交只做一件事
- **完整功能**：提交的代码必须是可工作的状态
- **明确描述**：提交信息必须清晰说明本次更改的目的和影响
- **相关变更**：相关的测试、文档、配置一起提交

### 完整工作流程
详细的Git工作流程和分支管理规范参见：`ai-context/zh/system-design/git-workflow.md`

---

## 🔒 安全要求

- **禁止提交敏感信息** (密钥、Token)
- **使用环境变量** 管理配置
- **定期安全检查** `pnpm audit`

## 🚀 发布流程强制要求

### ⚠️ 禁止手动发布
- **绝对禁止** 手动运行 `npm publish` 或 `pnpm publish`
- **必须使用** 自动化 CI/CD 流程发布
- **所有发布** 必须通过 GitHub Actions 完成

### 自动化发布流程
1. **创建 changeset**: `pnpm changeset`
2. **版本更新**: `pnpm changeset version` (本地或CI)
3. **推送代码**: `git push origin main`
4. **自动发布**: GitHub Actions 自动检测并发布

### 发布触发条件
- **主分支推送** - 自动运行测试和构建
- **标签推送** - 自动发布到 NPM
- **Changeset 检测** - 自动版本管理

### 发布验证要求
- ✅ 所有测试必须通过
- ✅ 构建必须成功 
- ✅ 代码检查必须通过
- ✅ 类型检查必须通过

### 紧急发布例外
仅在生产环境紧急情况下，经团队负责人批准后可临时手动发布，但必须：
1. 记录发布原因和时间
2. 事后补充正确的 changeset
3. 确保 CI/CD 流程同步

---

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

---

## 📖 文档查询规范

### Context7 使用
开发前必须查询相关技术文档：
1. **框架文档优先** - Next.js、React、Vue 等使用 Context7
2. **调用流程**:
   - 先调用 `resolve-library-id` 获取库ID
   - 再调用 `get-library-docs` 获取文档
3. **最佳实践** - 实现功能前先了解官方推荐做法

### 文档驱动开发
- 查询文档 → 理解最佳实践 → 设计实现 → 编写代码

---

这些约束确保 LinchKit 框架的一致性、安全性和可维护性。