# LinchKit 核心开发约束 v8.0

**版本**: v8.0 - AI Code Quality Assurance  
**更新**: 2025-07-11  
**状态**: 单一信息源 - 完全错误消除的强制开发约束

## 🚨 不可违背的核心约束 (每次必须遵守)

### 1. TypeScript 严格模式

- **🔴 禁止 `any` 类型**，使用 `unknown` 替代
- **🔴 禁止 `as` 类型断言**，使用类型守卫
- **🔴 禁止 `@ts-ignore`**，必须修复类型错误
- **🔴 强制 `unknown` 类型**用于外部数据
- **超严格配置** (详见: [01_Quality/typescript-config.md](../01_Quality/typescript-config.md))

### 2. 质量门禁 (每次必须通过)

- **🔴 编译无错误**: `tsc --noEmit`
- **🔴 ESLint 零违规**: `eslint . --max-warnings=0`
- **🔴 测试覆盖率达标**:
  - 核心包 (@linch-kit/core): 98%+
  - 关键包 (auth, schema, crud): 95%+
  - UI组件包: 90%+
  - 应用层: 85%+

### 3. AI代码生成约束

- **🔴 生成前**: `bun run ai:pre-check [功能描述]`
- **🔴 生成后**: `bun run ai:quality-gate`
- **🔴 人工审查**: 关键业务逻辑必须人工审查
- **🔴 上下文验证**: `bun run ai:context-verify`

### 4. 包复用强制检查

- **🔴 生成前必须检查现有实现**: `bun run deps:check [关键词]`
- **🔴 禁止重复实现已有功能**
- **🔴 新功能优先扩展现有包**

### 5. 分支管理 (零容忍违规)

- **🔴 禁止**: 在 `main`、`master`、`develop`、`release/*` 分支直接工作
- **🔴 必须**: 所有开发工作在功能分支进行
- **🔴 检查**: 每次开始工作前运行 `git branch --show-current` 验证
- **🔴 违规处理**: 立即创建功能分支 `git checkout -b feature/[task-name]`

### 6. 包管理 (强制 bun)

- **🔴 唯一工具**: 只使用 `bun`，禁止 `npm`/`yarn`
- **🔴 环境路径**: `export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"`
- **🔴 验证命令**: `bun run validate:light` (快速), `bun run validate` (完整)

### 7. 测试框架 (强制 bun:test)

- **🔴 唯一框架**: 只使用 `bun:test`，禁止 `vitest`/`jest`
- **🔴 导入方式**: `import { describe, it, expect, mock } from 'bun:test'`
- **🔴 测试同步**: 功能代码与测试代码必须同步开发

## 📋 快速检查清单

- [ ] **分支检查**: 当前分支不是受保护分支
- [ ] **AI上下文**: 已验证清洁 (`bun run ai:context-verify`)
- [ ] **现有功能**: 复用检查已完成 (`bun run deps:check`)
- [ ] **测试策略**: 测试用例已同步编写
- [ ] **质量门禁**: 所有检查已通过

## 🔄 Graph RAG 强制查询流程

### 任何代码相关任务前必须执行：

```bash
# 1. 查询现有实现
bun run ai:session query "[核心概念]"

# 2. 查找函数/类定义
bun run ai:session symbol "[符号名]"

# 3. 查找实现模式
bun run ai:session pattern "[模式]" "[实体]"

# 4. 检查包复用
bun run deps:check "[关键词]"
```

### 🚨 绝对禁止

- ❌ **跳过Graph RAG查询**: 任何代码相关任务前不查询项目上下文
- ❌ **忽略现有实现**: 不查询现有功能就开发新功能
- ❌ **违反分支管理**: 在保护分支直接工作
- ❌ **包管理违规**: 使用npm/yarn而非bun
- ❌ **类型安全违规**: 使用any、as、@ts-ignore

## 📊 AI代码生成零错误约束

### 三层验证体系

1. **🔴 编译时验证**: 超严格TypeScript配置
2. **🔴 运行时验证**: 强制Zod Schema验证
3. **🔴 测试时验证**: 完整的测试覆盖率和质量

### 强制预验证机制

```bash
# 每次AI代码生成前必须执行
bun run ai:pre-check [功能描述]
```

### AI代码生成质量门禁

```bash
# 生成代码后立即执行
bun run ai:quality-gate
```

### 防御性编程强制要求

- **🔴 所有函数必须验证输入**
- **🔴 所有异步操作必须错误处理**
- **🔴 关键业务逻辑必须断言**

## 🎯 成功标准

每个任务完成时必须满足：

- ✅ **构建成功**: `bun build` 无错误
- ✅ **代码质量**: `bun run validate:light` 通过
- ✅ **完整验证**: `bun run validate` 全部通过
- ✅ **测试覆盖**: 达到包级别覆盖率要求
- ✅ **图谱同步**: `bun run ai:session sync` 执行
- ✅ **分支整洁**: 工作分支状态干净

---

**详细规范见分层文档，按任务类型加载对应模块。**

**核心原则**: 遵循约束，查询优先，质量至上。
