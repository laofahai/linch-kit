# LinchKit 发布流程文档

## 📋 发布策略

LinchKit 采用**双轨发布策略**：

### 🔄 持续集成（CI）- 每次推送
- **触发条件**: 每次 `git push` 到 `main` 分支
- **流程**: 构建 → 测试 → 代码质量检查
- **结果**: 验证代码质量，**不发布新版本**

### 🚀 版本发布（Release）- 手动触发
- **触发条件**: 版本更新或手动触发
- **流程**: 构建 → 测试 → 发布到 NPM → 创建 GitHub Release
- **结果**: 发布新版本到 NPM Registry

## 🔄 发布流程详解

### 1. 开发阶段
```bash
# 日常开发 - 频繁推送，不发布版本
git add .
git commit -m "feat: 添加新功能"
git push origin main  # 触发 CI，不发布版本
```

### 2. 版本准备
```bash
# 创建 changeset（描述变更）
pnpm changeset

# 更新版本号
pnpm changeset version

# 提交版本更新
git add .
git commit -m "chore: release v0.x.x"
git push origin main
```

### 3. 发布版本
- **自动发布**: changeset 检测到版本更新时自动触发发布
- **手动发布**: 在 GitHub Actions 页面手动触发 Release workflow

## 📦 版本管理策略

### 版本号规范
```
0.x.y - 开发阶段版本
├── 0.4.2 - 当前版本
├── 0.5.0 - 下个小版本
└── 1.0.0 - 正式发布版本
```

### 统一版本策略
- **所有包使用相同版本号**
- **即使某些包没有变更，也一起升级版本**
- **确保包之间的兼容性**

## 🔧 自动化流程

### CI Workflow (`.github/workflows/ci.yml`)
```yaml
# 每次推送到 main 分支触发
on:
  push:
    branches: [main]

jobs:
  - analyze          # 依赖分析
  - quality          # 代码质量检查
  - build-and-test   # 构建和测试
  - build-apps       # 应用构建
  - security         # 安全审计
```

### Release Workflow (`.github/workflows/release.yml`)
```yaml
# 版本发布或手动触发
on:
  push:
    branches: [main]  # changeset 版本更新时
  workflow_dispatch:  # 手动触发

jobs:
  - release          # 发布到 NPM
  - publish-github   # 发布到 GitHub Packages
  - update-docs      # 更新文档
  - deploy-demo      # 部署演示应用
```

## 📝 发布检查清单

### 发布前检查
- [ ] 所有测试通过
- [ ] 代码质量检查通过
- [ ] 构建无错误
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 依赖关系无冲突

### 发布后验证
- [ ] NPM 包已发布
- [ ] GitHub Release 已创建
- [ ] Git 标签已推送
- [ ] 文档已更新
- [ ] 演示应用已部署

## 🛠️ 手动发布命令

### 本地测试发布
```bash
# 模拟发布（不实际发布）
node scripts/release.js --dry-run

# 本地构建测试
pnpm build
pnpm test
pnpm lint
```

### 紧急发布
```bash
# 手动发布单个包
cd packages/core
npm publish --access public

# 手动创建标签
git tag -a v0.4.3 -m "Release 0.4.3"
git push origin v0.4.3
```

## 🔒 权限和密钥

### 必需的 GitHub Secrets
```bash
NPM_TOKEN          # NPM 发布令牌
GITHUB_TOKEN       # GitHub API 令牌（自动提供）
TURBO_TOKEN        # Turborepo 缓存令牌（可选）
VERCEL_TOKEN       # Vercel 部署令牌（可选）
```

### NPM 访问权限
- 所有包设置为 `"access": "public"`
- 发布账号需要 `@linch-kit` 组织权限

## 🚨 故障排除

### 常见发布问题

#### 1. pnpm 未找到
```bash
# 检查 workflow 中 pnpm 安装顺序
- name: Install pnpm      # 必须在第一步
- name: Setup Node.js     # pnpm 安装后执行
```

#### 2. 版本冲突
```bash
# 检查是否版本已存在
npm view @linch-kit/core versions --json

# 强制更新版本
pnpm changeset version
```

#### 3. 构建失败
```bash
# 本地调试
pnpm clean
pnpm install
pnpm build

# 检查依赖关系
node scripts/deps-graph.js
```

#### 4. 权限错误
```bash
# 检查 NPM 登录状态
npm whoami

# 检查包权限
npm access list packages @linch-kit
```

## 📊 发布统计

### 当前发布状态
```
版本: v0.4.2
包数量: 7 个核心包
发布平台: NPM Registry, GitHub Packages
部署状态: GitHub Pages (文档), Vercel (演示)
```

### 发布历史
- `v0.4.2` - 企业级 AI-First 全栈开发框架
- `v0.4.1` - 修复和优化
- `v0.4.0` - 核心功能完成

## 📚 相关文档

- [Changeset 文档](https://github.com/changesets/changesets)
- [NPM Publishing 指南](https://docs.npmjs.com/publishing)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Turborepo 发布指南](https://turbo.build/repo/docs/handbook/publishing)

---

**注意**: 发布是不可逆操作，请确保在发布前进行充分测试。