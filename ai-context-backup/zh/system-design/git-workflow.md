# Git 工作流规范

**版本**: v1.0  
**更新**: 2025-07-02  
**适用**: LinchKit 项目

---

## 🌳 分支策略

### 主要分支
- **`main`** - 生产环境代码，始终保持稳定
- **`develop`** - 开发集成分支（可选，简单项目直接用 main）

### 辅助分支
- **`feature/*`** - 功能开发分支
- **`fix/*`** - Bug 修复分支  
- **`release/*`** - 发布准备分支
- **`hotfix/*`** - 紧急修复分支

---

## 📋 分支命名规范

### 功能分支
```bash
feature/user-authentication     # 用户认证功能
feature/create-cli-tool        # CLI 工具创建
feature/dashboard-ui           # 仪表板界面
feature/api-optimization       # API 优化
```

### 修复分支
```bash
fix/login-validation-error     # 登录验证错误
fix/build-failure-issue       # 构建失败问题
fix/memory-leak-in-core       # 核心模块内存泄露
fix/type-definition-missing   # 类型定义缺失
```

### 发布分支
```bash
release/v1.0.3                # 版本 1.0.3 发布
release/v2.0.0                # 版本 2.0.0 发布
```

### 热修复分支
```bash
hotfix/critical-security-patch # 关键安全补丁
hotfix/production-crash-fix    # 生产环境崩溃修复
```

---

## 🔄 工作流程

### 1. 功能开发流程
```bash
# 1. 同步主分支
git checkout main
git pull origin main

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 开发功能
# ... 编写代码 ...

# 4. 提交代码
git add .
git commit -m "feat: add user authentication system

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. 推送分支
git push origin feature/your-feature-name

# 6. 创建 Pull Request
# 在 GitHub 界面创建 PR

# 7. 合并后清理
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

### 2. Bug 修复流程
```bash
# 1. 从主分支创建修复分支
git checkout main
git pull origin main
git checkout -b fix/bug-description

# 2. 修复 Bug
# ... 修复代码 ...

# 3. 测试验证
pnpm test
pnpm build

# 4. 提交修复
git commit -m "fix: resolve login validation error

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 5. 推送并创建 PR
git push origin fix/bug-description
```

### 3. 发布流程
```bash
# 1. 创建发布分支
git checkout main
git pull origin main
git checkout -b release/v1.0.3

# 2. 版本准备
# 更新版本号、CHANGELOG 等

# 3. 测试发布候选
pnpm validate
pnpm build:packages

# 4. 合并到主分支
git checkout main
git merge release/v1.0.3

# 5. 创建标签
git tag v1.0.3
git push origin v1.0.3

# 6. 清理发布分支
git branch -d release/v1.0.3
```

---

## 📝 提交信息规范

### 提交格式
```
<type>(<scope>): <description>

[optional body]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 类型说明
- **feat**: 新功能
- **fix**: Bug 修复
- **docs**: 文档更新
- **style**: 代码格式（不影响功能）
- **refactor**: 重构（不改变功能）
- **test**: 测试相关
- **chore**: 构建工具、依赖更新

### 范围说明
- **core**: @linch-kit/core 包
- **auth**: @linch-kit/auth 包
- **ui**: @linch-kit/ui 包
- **cli**: CLI 工具
- **docs**: 文档
- **config**: 配置文件

### 示例
```bash
feat(auth): add multi-factor authentication support
fix(core): resolve memory leak in logger
docs(api): update tRPC router documentation
chore(deps): update typescript to v5.8.3
```

---

## 🔒 分支保护规则

### main 分支保护
- ✅ 要求 PR 审查
- ✅ 要求状态检查通过
- ✅ 要求分支为最新
- ✅ 禁止强制推送
- ✅ 禁止删除分支

### 必需状态检查
- ✅ 构建成功 (`build`)
- ✅ 测试通过 (`test`)
- ✅ 代码检查 (`lint`)
- ✅ 类型检查 (`type-check`)

---

## 🚀 CI/CD 集成

### GitHub Actions 触发
```yaml
# 构建和测试
on:
  push:
    branches: [main, develop, release/*]
  pull_request:
    branches: [main, develop]

# 自动发布
on:
  push:
    tags: ['v*']
```

### 自动化发布流程 ⚠️
**严格禁止手动发布！所有发布必须通过 CI/CD 完成**

1. **推送标签** → 触发发布 Action
2. **构建包** → 生成 dist 文件
3. **运行测试** → 确保质量
4. **发布 NPM** → 自动发布到 NPM
5. **GitHub Release** → 创建 Release 页面

### Changeset 发布流程
```bash
# 1. 创建 changeset
pnpm changeset

# 2. 版本更新 (可选，CI 也可以做)
pnpm changeset version

# 3. 提交并推送
git add .
git commit -m "chore: release packages"
git push origin main

# 4. GitHub Actions 自动发布到 NPM
```

---

## 🛠️ 常用命令

### 日常开发
```bash
# 查看分支状态
git status
git branch -a

# 同步远程分支
git fetch origin
git pull origin main

# 合并主分支到当前分支
git merge main

# 查看提交历史
git log --oneline -10
git log --graph --oneline --all
```

### 分支管理
```bash
# 删除本地分支
git branch -d feature/branch-name
git branch -D feature/branch-name  # 强制删除

# 删除远程分支
git push origin --delete feature/branch-name

# 重命名分支
git branch -m old-name new-name

# 查看远程分支
git branch -r
```

### 故障排除
```bash
# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃更改）
git reset --hard HEAD~1

# 强制推送（谨慎使用）
git push --force-with-lease origin branch-name

# 解决合并冲突
git status          # 查看冲突文件
# 编辑冲突文件...
git add .
git commit -m "resolve merge conflicts"
```

---

## ⚠️ 注意事项

### 禁止操作
- ❌ 直接推送到 `main` 分支
- ❌ 使用 `git push --force` 到共享分支
- ❌ 在公共分支上进行 `git rebase`
- ❌ 提交大型二进制文件
- ❌ 提交敏感信息（密钥、密码）

### 最佳实践
- ✅ 频繁提交，保持提交粒度适中
- ✅ 写清晰的提交信息
- ✅ 定期同步主分支
- ✅ 合并前进行充分测试
- ✅ 及时删除已合并的分支

---

这个工作流确保代码质量、团队协作效率和项目的长期维护性。