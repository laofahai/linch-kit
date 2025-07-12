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
- **超严格配置** (详见: [TSConfig严格配置](../02_Guides/11_TSConfig_Strict.json))

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
- **🔴 强制参数**: 必须使用 `--no-cache` 参数（避免缓存问题）
  - `bun add [包名] --no-cache`
  - `bun install --no-cache`
- **🔴 环境路径**: `export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"`
- **🔴 验证命令**: `bun run validate:light` (快速), `bun run validate` (完整)

### 7. 测试框架 (强制 bun:test)

- **🔴 唯一框架**: 只使用 `bun:test`，禁止 `vitest`/`jest`
- **🔴 导入方式**: `import { describe, it, expect, mock } from 'bun:test'`
- **🔴 测试同步**: 功能代码与测试代码必须同步开发

## 🔄 每次Session启动检查清单

### 🔴 必须100%执行的步骤（按顺序）

```bash
# 步骤1: 环境检查
git branch --show-current  # 必须在功能分支
git status                 # 检查工作目录

# 步骤2: Graph RAG强制查询
bun run ai:session query "[功能关键词]"     # 🔴 绝对必须
bun run ai:session symbol "[类名/函数名]"   # 🔴 绝对必须
bun run ai:session pattern "[设计模式]" "[实体]"  # 🔴 绝对必须

# 步骤3: 包复用检查
bun run deps:check [关键词]    # 🔴 绝对必须

# 步骤4: 任务管理
TodoWrite                  # 跟踪复杂任务
```

### 📋 快速检查清单

- [ ] **分支检查**: 当前分支不是受保护分支
- [ ] **AI上下文**: 已验证清洁 (`bun run ai:context-verify`)
- [ ] **现有功能**: 复用检查已完成 (`bun run deps:check`)
- [ ] **测试策略**: 测试用例已同步编写
- [ ] **质量门禁**: 所有检查已通过

## 🔒 ESLint违规处理策略

### 零容忍原则

- **🔴 禁用整个文件**: `/* eslint-disable */`
- **🔴 批量禁用规则**: `/* eslint-disable multiple-rules */`
- **🔴 无说明的禁用**: 没有说明原因的禁用注释

### 允许的例外（仅限特殊情况）

```typescript
// 第三方库兼容性问题
// eslint-disable-next-line @next/next/no-img-element -- 用户头像来自第三方API
<img src={user.avatar} alt="avatar" />

// 性能优化的必要违规
// eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在组件挂载时执行
useEffect(() => initializeApp(), [])
```

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

## 📝 任务管理强制要求

### 强制使用TodoWrite的场景

- **3步以上任务**: 涉及多个文件或步骤的任务
- **多文件修改**: 需要修改超过2个文件的任务
- **新功能开发**: 任何新功能的实现
- **重大重构**: 架构或设计的重大调整

### 任务状态管理

- **pending**: 待开始的任务
- **in_progress**: 当前正在进行（限制：同时只能有1个）
- **completed**: 已完成的任务

### 实时更新要求

- **开始任务**: 立即标记为 `in_progress`
- **完成任务**: 立即标记为 `completed`
- **阻塞情况**: 创建新任务描述需要解决的问题

## 🛠️ 包功能复用约束

### 强制使用LinchKit内部功能

- **日志系统**: `@linch-kit/core` logger - 🔴 禁止console.log
- **配置管理**: `@linch-kit/core` ConfigManager - 🔴 禁止直接读取配置
- **Schema定义**: `tools/schema` defineEntity - 🔴 禁止直接用Zod
- **权限检查**: `@linch-kit/auth` PermissionChecker - 🔴 禁止自实现权限
- **CRUD操作**: `@linch-kit/platform` createCRUD - 🔴 禁止手写增删改查
- **UI组件**: `@linch-kit/ui` 组件库 - 🔴 禁止重复创建基础组件

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
