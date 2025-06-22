# Linch Kit 工作流程标准

**最后更新**: 2025-06-21
**文档版本**: v3.1 (包文档维护要求补充)
**原始来源**: `workflows/development.md`, `workflows/testing.md`, `workflows/release.md`, `standards/development-workflow.md`
**维护责任**: 开发团队
**更新内容**: 包文档同步维护流程、技术栈版本验证

---

## 🔄 开发工作流程

### 环境要求
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Git >= 2.30.0

### 初始化流程
```bash
# 1. 克隆项目
git clone <repository-url>
cd linch-kit

# 2. 安装依赖 (设置 Node.js 环境)
# 如果使用 nvm: export PATH="[nvm node 路径]:$PATH"
pnpm install

# 3. 构建包
pnpm build

# 4. 验证环境
pnpm linch --help
```

### 开发原则

#### AI-First 开发
- **类型安全优先**: 端到端 TypeScript 支持
- **清晰的命名和注释**: 便于 AI 理解的代码结构
- **Schema 驱动开发**: 使用 `@linch-kit/schema` 作为单一数据源

#### 不重复造轮子 ⭐ 最高优先级
- **优先使用现有成熟方案**: 充分调研生态系统
- **通过适配器模式集成现有工具**: 而非重新发明轮子
- **谨慎评估自研需求**: 只有在现有方案无法满足需求时才考虑自研

### 基本开发步骤

#### 1. 功能开发
```bash
# 创建功能分支
git checkout -b feature/user-management

# 开发功能
# - 编写代码
# - 添加测试
# - 更新文档
```

#### 2. 本地验证
```bash
# 代码质量检查
# 设置 Node.js 环境 (如果需要)
# export PATH="[nvm node 路径]:$PATH"
pnpm lint                    # ESLint 检查
npx eslint --fix src/        # 自动修复 lint 问题

# 类型检查和构建
pnpm build                   # 构建验证
pnpm test                    # 运行测试

# Schema 相关验证
pnpm linch schema:generate:prisma  # 重新生成 Prisma schema
```

#### 3. 提交代码
```bash
git add .
git commit -m "feat(auth): add user management system"
git push origin feature/user-management
```

### 代码质量标准

#### JSDoc 文档要求 (强制)
**完整的JSDoc注释标准请查看**: **[文档标准](./documentation-standards.md#jsdoc-注释标准)**

**核心要求**：所有新增或修改的方法必须包含完整的JSDoc注释，包括@description、@param、@returns、@throws、@example、@since等标签。

#### ES 模块兼容性
```typescript
// ❌ 错误：在 ES 模块中使用 module 变量
const module = await import(path)

// ✅ 正确：使用其他变量名
const configModule = await import(path)

// ✅ 正确：检查 CommonJS 环境
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS 环境逻辑
}
```

## 🧪 测试策略

### 测试类型和覆盖率要求
- **单元测试**: 使用 Vitest，覆盖率目标 85%+
- **集成测试**: 验证包之间的集成
- **端到端测试**: 验证完整功能流程

### 测试命令
```bash
# 运行所有测试
pnpm test

# 运行特定包测试
pnpm turbo test --filter=@linch-kit/core

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage
```

### 测试文件组织
```
packages/my-package/
├── src/
│   ├── __tests__/          # 单元测试
│   │   ├── *.test.ts       # 测试文件
│   │   └── fixtures/       # 测试数据
│   └── components/
└── tests/
    ├── integration/        # 集成测试
    └── e2e/               # 端到端测试
```

## 📦 包管理工作流

### 新包创建流程
1. **在 `packages/` 目录创建新包**
2. **使用统一的配置模板**:
   - `tsconfig.json` - TypeScript 配置
   - `tsup.config.ts` - 构建配置
   - `package.json` - 包配置
3. **遵循命名规范**: `@linch-kit/package-name`
4. **使用 `workspace:*` 依赖声明**

### 包结构标准
```
packages/my-package/
├── src/                   # 源代码
│   ├── index.ts          # 包入口
│   ├── types.ts          # 类型定义
│   └── __tests__/        # 测试文件
├── dist/                 # 构建输出 (自动生成)
├── package.json          # 包配置
├── tsconfig.json         # TypeScript 配置
├── tsup.config.ts        # 构建配置
└── README.md             # 包文档
```

### 包文档维护流程
#### 文档同步更新要求
- **代码更新后立即更新包 README.md**
- **确保文档与实际实现一致**
- **遵循统一的文档结构和格式**

#### 包 README.md 标准结构
```markdown
# @linch-kit/package-name

## 📦 安装
\`\`\`bash
pnpm add @linch-kit/package-name
\`\`\`

## 🚀 快速开始
[基本使用示例]

## 📚 API 文档
[主要接口和方法说明]

## 🔧 配置
[配置选项和参数]

## 📝 变更日志
[版本更新记录]

## 🤝 贡献
[开发和贡献指南]
```

### 依赖管理
```bash
# 添加依赖到特定包
pnpm add lodash --filter=@linch-kit/core

# 添加开发依赖
pnpm add -D @types/lodash --filter=@linch-kit/core

# 添加 workspace 依赖
pnpm add @linch-kit/types --filter=@linch-kit/core
```

## 🚀 构建和发布流程

### 构建命令
```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm turbo build --filter=@linch-kit/core

# 清理并重新构建
pnpm clean && pnpm build

# 监听模式构建
pnpm build:watch
```

### 发布流程 (使用 Changesets)

#### 1. 添加变更集
```bash
# 添加变更描述
pnpm changeset

# 选择变更类型
# - patch: 修复 bug
# - minor: 新功能
# - major: 破坏性变更
```

#### 2. 版本更新
```bash
# 更新版本号
pnpm changeset:version

# 检查变更
git diff package.json packages/*/package.json
```

#### 3. 发布到 npm
```bash
# 构建所有包
pnpm build

# 发布到 npm
pnpm changeset:publish

# 或使用自动化发布脚本
pnpm release
```

## 🔍 Git 工作流程

### 分支策略
- **main**: 主分支，稳定版本
- **feature/***: 功能分支
- **fix/***: 修复分支
- **release/***: 发布分支

### 提交信息规范
```bash
# 功能添加
git commit -m "feat(auth): add user registration"

# 问题修复
git commit -m "fix(schema): resolve prisma generation issue"

# 文档更新
git commit -m "docs(readme): update installation guide"

# 重构代码
git commit -m "refactor(core): improve plugin loading mechanism"

# 性能优化
git commit -m "perf(crud): optimize query performance"

# 测试相关
git commit -m "test(auth): add unit tests for user service"
```

### Pull Request 流程
1. **创建功能分支**
2. **完成开发和测试**
3. **提交 Pull Request**
4. **代码审查**
5. **合并到主分支**

## 📋 开发检查清单

### 开发前检查
- [ ] 确认任务需求和验收标准
- [ ] 检查是否有现有解决方案可以复用
- [ ] 创建功能分支

### 开发中检查
- [ ] 遵循 TypeScript 严格模式
- [ ] 添加完整的 JSDoc 注释
- [ ] 编写单元测试
- [ ] 使用 ESLint 自动修复代码格式

### 开发后检查
- [ ] 运行所有验证命令通过
- [ ] 测试覆盖率达到要求
- [ ] 更新相关文档
- [ ] 提交规范的 commit 信息

### 发布前检查
- [ ] 所有测试通过
- [ ] 构建成功无错误
- [ ] 版本号更新正确
- [ ] 变更日志完整

## ⚠️ 常见问题和解决方案

### ES 模块兼容性问题
```typescript
// ✅ 推荐的动态导入模式
try {
  const packageModule = await import(packageName)
  const provider = packageModule.default || packageModule

  if (typeof provider !== 'function') {
    // 提供回退或 mock 实现
    provider = createMockProvider
  }
} catch (error) {
  // 提供适当的错误处理和回退
  console.warn(`Could not load ${packageName}:`, error.message)
}
```

### 包依赖问题
```bash
# 清理 node_modules 和重新安装
pnpm clean:deps
pnpm install

# 检查依赖一致性
pnpm deps:check

# 重新构建所有包
pnpm build:packages
```

### 类型错误处理
```bash
# 重新生成类型声明
pnpm build:packages

# 检查类型错误
pnpm check-types

# 清理 TypeScript 缓存
rm -rf packages/*/dist packages/*/.turbo
```

---

**重要提醒**: 所有开发工作都必须严格遵循本工作流程标准。违反标准的代码不得合并到主分支。
