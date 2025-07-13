# 贡献指南

欢迎贡献 LinchKit 项目！本文档将指导您如何参与开发。

## 🛠️ 开发环境要求

- **Node.js** >= 18
- **bun** >= 1.0 (主要包管理器)
- **TypeScript** >= 5.0

## 📋 开发流程

### 1. 设置开发环境

```bash
# 克隆仓库
git clone https://github.com/laofahai/linch-kit.git
cd linch-kit

# 安装依赖
bun install

# 启动开发服务器
bun dev
```

### 2. 开发规范

在开始开发前，请务必阅读：

- **[核心开发约束](./ai-context/00_Getting_Started/03_Essential_Rules.md)** - 必须遵守的开发约束
- **[详细开发流程](./ai-context/02_Guides/01_Development_Workflow.md)** - 完整的开发工作流

### 3. 分支管理

```bash
# 从 main 分支创建功能分支
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 开发完成后提交
git add .
git commit -m "feat: 简洁的提交描述"
git push origin feature/your-feature-name
```

**📝 注意**: 
- **功能分支**: 提交时跳过代码校验，专注快速开发
- **主要分支** (main/master/develop): 自动执行完整代码校验
- 合并到主分支时将强制执行所有质量检查

### 4. 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式调整
refactor: 重构代码
test: 测试相关
chore: 构建工具或辅助工具
```

## 🔧 常用开发命令

```bash
# 开发
bun dev

# 构建所有包
bun build:packages

# 运行测试
bun test

# 代码检查
bun lint

# 类型检查
bun type-check

# 完整验证
bun validate
```

## 📝 代码规范

### TypeScript 要求

- 🔴 **禁止使用 `any` 类型**，使用 `unknown` 替代
- 🔴 **禁止使用 `as` 类型断言**，使用类型守卫
- 🔴 **禁止使用 `@ts-ignore`**，必须修复类型错误

### 测试要求

- 使用 **bun:test** 框架，禁止使用 vitest/jest
- 新功能必须编写测试用例
- 测试覆盖率要求：
  - 核心包 (@linch-kit/core): 98%+
  - 关键包 (auth, platform, ui): 95%+
  - 应用层: 85%+

### 包复用要求

开发新功能前，必须检查是否存在可复用的现有实现：

```bash
# 检查现有功能
bun run deps:check [关键词]
```

## 🚀 发布流程

1. 确保所有测试通过：`bun validate`
2. 提交 PR 到 main 分支
3. 等待 CI/CD 流水线通过
4. 维护者审核并合并

## 🏗️ 架构指南

LinchKit 采用分层架构：

```
L0: @linch-kit/core      # 基础设施
L1: @linch-kit/auth      # 认证权限
L2: @linch-kit/platform  # 业务平台
L3: @linch-kit/ui        # UI 组件

Extensions:
- extensions/console     # 管理平台
- extensions/admin       # 管理功能
- extensions/blog        # 博客系统
```

## 📚 学习资源

- [项目架构文档](./ai-context/01_Architecture/)
- [开发指南](./ai-context/02_Guides/)
- [API 参考](./ai-context/03_Reference/)

## 💡 寻求帮助

- 🐛 **Bug 报告**: [GitHub Issues](https://github.com/laofahai/linch-kit/issues)
- 💬 **讨论**: [GitHub Discussions](https://github.com/laofahai/linch-kit/discussions)
- 📧 **邮件**: [project@linch.tech](mailto:project@linch.tech)

## 🎯 贡献类型

我们欢迎以下类型的贡献：

- 🐛 **Bug 修复**
- ✨ **新功能开发**
- 📚 **文档改进**
- 🧪 **测试增强**
- 🔧 **工具优化**
- 📦 **包管理**

---

感谢您对 LinchKit 项目的贡献！🙏
