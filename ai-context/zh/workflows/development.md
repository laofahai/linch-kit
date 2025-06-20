# 开发工作流程

## 概述

Linch Kit 采用标准化的开发工作流程，基于 Turborepo monorepo 架构。

## 开发环境设置

### 环境要求
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Git >= 2.30.0

### 初始化流程

```bash
# 1. 克隆项目
git clone <repository-url>
cd linch-kit

# 2. 安装依赖
pnpm install

# 3. 构建包
pnpm build

# 4. 验证环境
pnpm linch --help
```

## 开发原则

### AI-First 开发
- 类型安全优先
- 清晰的命名和注释
- 便于 AI 理解的代码结构

### 不重复造轮子
- 优先使用现有成熟方案
- 通过适配器模式集成现有工具
- 谨慎评估自研需求

### Schema 驱动开发
- 使用 `@linch-kit/schema` 作为单一数据源
- 自动生成相关代码
- 确保类型安全

### 代码质量标准
- **JSDoc 文档要求**: 所有新增或修改的方法必须包含完整的 JSDoc 注释
  - `@description` - 方法功能描述
  - `@param {type} paramName - 参数说明` - 所有参数的类型和说明
  - `@returns {type} 返回值说明` - 返回值类型和说明
  - `@throws {ErrorType} 错误说明` - 可能抛出的错误（如适用）
  - `@example` - 使用示例（对于复杂方法）
  - `@since` - 版本信息（如适用）

### ES 模块兼容性
- 避免使用 `module` 作为变量名（ES 模块保留字）
- 在检查 CommonJS 环境时使用 `typeof module !== 'undefined'`
- 动态导入时提供适当的错误处理和回退机制

## 开发流程

### 基本开发步骤

```bash
# 1. 开发功能
# 编写代码、添加测试、更新文档

# 2. 本地验证
pnpm lint
pnpm test
pnpm build

# 3. 提交代码
git add .
git commit -m "feat(auth): add user management system"
```

### 质量检查
- ESLint 代码检查 (`npx eslint --fix src/`)
- TypeScript 类型检查
- 单元测试覆盖
- 构建验证
- JSDoc 文档完整性检查

### 常见问题解决方案

#### ES 模块兼容性问题
```typescript
// ❌ 错误：在 ES 模块中使用 module 变量
const module = await import(path)

// ✅ 正确：使用其他变量名
const configModule = await import(path)

// ✅ 正确：检查 CommonJS 环境
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  // CommonJS 环境逻辑
}
```

#### 动态导入错误处理
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

## 包管理

### 新包创建
1. 在 `packages/` 目录创建新包
2. 使用统一的 tsup 和 tsconfig 配置
3. 遵循 `@linch-kit/package-name` 命名规范
4. 使用 `workspace:*` 依赖声明

### 包结构
```
packages/my-package/
├── src/           # 源代码
├── dist/          # 构建输出
├── package.json   # 包配置
├── tsconfig.json  # TypeScript 配置
└── tsup.config.ts # 构建配置
```

## 测试策略

### 测试类型
- **单元测试**: 使用 Vitest，覆盖率目标 80%
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
```

## 构建和发布

### 构建命令
```bash
# 构建所有包
pnpm build

# 清理并重新构建
pnpm clean && pnpm build

# 监听模式构建
pnpm build:watch
```

### 发布流程
1. 使用 Changesets 管理版本
2. 自动化 CI/CD 流程
3. 发布到 npm registry

---

**维护**: 根据项目发展持续更新此工作流程
