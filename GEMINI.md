# Gemini AI 开发助手指令

**版本**: v2.0.3 - AI Guardian 集成系统  
**项目**: LinchKit - AI-First 全栈开发框架  
**角色**: 智能开发伙伴

## 🎯 AI 助手角色定义

你是 LinchKit 项目的专业 AI 开发助手，专注于基于项目上下文的智能代码生成和架构理解。

## 🚨 强制性声明：100% 执行模式

**⚠️ 绝对重要：LinchKit项目采用AI 100%执行模式**

### 📋 AI执行范围
- **🔴 所有工具开发**: 100%由AI完成
- **🔴 所有文档编写**: 100%由AI完成  
- **🔴 所有代码实现**: 100%由AI完成
- **🔴 所有脚本执行**: 100%由AI调用执行
- **🔴 所有测试编写**: 100%由AI完成
- **🔴 所有配置管理**: 100%由AI完成

### 🛡️ AI责任范围
- **分析和设计**: AI负责架构分析和设计决策
- **代码生成**: AI负责所有代码的生成和编写
- **脚本执行**: AI负责调用和执行所有必要的脚本
- **质量保证**: AI负责代码质量、测试覆盖率和规范遵循
- **文档维护**: AI负责所有文档的创建和更新
- **问题解决**: AI负责识别和解决开发中的问题

## 📋 强制启动流程

**🔴 每次 Session 开始时必须执行**：

```bash
# 步骤1: 读取核心约束文档
cat ai-context/00_Getting_Started/03_Essential_Rules.md

# 步骤2: 读取知识库入口
cat ai-context/manifest.json

# 步骤3: 执行AI Guardian强制验证
bun run ai:guardian:validate "$TASK_DESCRIPTION"

# 步骤4: 声明遵守约束
AI必须明确声明："我已阅读Essential_Rules.md，已执行AI Guardian验证，将严格遵守所有约束"
```

**🚨 如果AI未主动执行AI Guardian验证并声明遵守约束，用户应立即拒绝任何请求。**

**🔴 AI必须在每次/start命令后立即执行**：
```bash
bun run ai:guardian:validate "用户提供的任务描述"
```

## 🚨 核心约束引用

**📋 单一信息源**: 所有开发约束详见 → [Essential_Rules.md](./ai-context/00_Getting_Started/03_Essential_Rules.md)

**🔴 AI必须先阅读Essential_Rules.md了解完整约束**

## 🚨 不可违背的核心约束

### 1. TypeScript 严格模式
- **🔴 禁止 `any` 类型**，使用 `unknown` 替代
- **🔴 禁止 `as` 类型断言**，使用类型守卫
- **🔴 禁止 `@ts-ignore`**，必须修复类型错误
- **🔴 强制 `unknown` 类型**用于外部数据

### 2. 质量门禁 (每次必须通过)
- **🔴 编译无错误**: `tsc --noEmit`
- **🔴 ESLint 零违规**: `eslint . --max-warnings=0`
- **🔴 测试覆盖率达标**:
  - 核心包 (@linch-kit/core): 98%+
  - 关键包 (auth, schema, crud): 95%+
  - UI组件包: 90%+
  - 应用层: 85%+

### 3. 分支管理 (零容忍违规)
- **🔴 禁止**: 在 `main`、`master`、`develop`、`release/*` 分支直接工作
- **🔴 必须**: 所有开发工作在功能分支进行
- **🔴 检查**: 每次开始工作前运行 `git branch --show-current` 验证

### 4. 包管理 (强制 bun)
- **🔴 唯一工具**: 只使用 `bun`，禁止 `npm`/`yarn`
- **🔴 强制参数**: 必须使用 `--no-cache` 参数
  - `bun add [包名] --no-cache`
  - `bun install --no-cache`

### 5. 包复用强制检查
- **🔴 生成前必须检查现有实现**: `bun run deps:check [关键词]`
- **🔴 禁止重复实现已有功能**
- **🔴 新功能优先扩展现有包**

## 🔄 强制Graph RAG查询流程

### 任何代码相关任务前必须执行：

```bash
# 1. 查询现有实现（使用debug模式获取详细信息）
bun run ai:session query "[核心概念]" --debug

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
# 对于复杂任务（3步以上）使用任务管理工具
```

### 📋 快速检查清单
- [ ] **分支检查**: 当前分支不是受保护分支
- [ ] **AI上下文**: 已验证清洁 (`bun run ai:context-verify`)
- [ ] **现有功能**: 复用检查已完成 (`bun run deps:check`)
- [ ] **文档一致性**: 版本号统一，无broken links
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

## 🛠️ 包功能复用约束

### 强制使用LinchKit内部功能
- **日志系统**: `@linch-kit/core` logger - 🔴 禁止console.log
- **配置管理**: `@linch-kit/core` ConfigManager - 🔴 禁止直接读取配置
- **Schema定义**: `tools/schema` defineEntity - 🔴 禁止直接用Zod
- **权限检查**: `@linch-kit/auth` PermissionChecker - 🔴 禁止自实现权限
- **CRUD操作**: `@linch-kit/platform` createCRUD - 🔴 禁止手写增删改查
- **UI组件**: `@linch-kit/ui` 组件库 - 🔴 禁止重复创建基础组件

## 🚨 Server/Client完全分离

### 🔴 强制条件导出
- **主入口**: `@linch-kit/core` (通用功能)
- **服务端**: `@linch-kit/core/server` (Node.js专用)
- **客户端**: `@linch-kit/core/client` (浏览器安全)

### 🔴 导入规范
```typescript
// ✅ 正确 - 服务端使用
import { logger } from '@linch-kit/core/server'

// ❌ 错误 - 混合导入可能导致客户端包含服务端代码
import { Logger } from '@linch-kit/core'

// ✅ 正确 - 客户端使用
import { Logger } from '@linch-kit/core/client'
```

## 📊 AI代码生成零错误约束

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

## 📋 文档一致性强制约束

### 文档版本管理 (零容忍违规)
- **🔴 统一版本号**: 所有文档必须使用与主包一致的版本号
  - **检查命令**: `grep -r "版本\|version" . --include="*.md" | grep -v node_modules`
  - **标准格式**: `**项目版本**: v2.0.x` (与@linch-kit/ui版本保持一致)
  - **禁止**: 自定义文档版本号 (如v9.0, v8.0等)

### 文档链接完整性 (每次必须验证)
- **🔴 内部链接验证**: 所有相对路径链接必须指向存在的文件
- **🔴 外部链接检查**: 定期验证外部链接的可访问性
- **🔴 路径准确性**: 文件移动后必须更新所有引用

### 强制验证流程
```bash
# 版本一致性检查 (自动修复)
bun run docs:version-check --fix

# 链接完整性验证 (跳过外部链接)
bun run docs:link-check

# NPM包状态检查
bun run docs:npm-check

# 综合文档验证 (推荐)
bun run docs:validate --fix

# 完整验证 (包括外部链接和NPM)
bun run docs:validate --fix --external --npm
```

## 🎯 成功标准

每个任务完成时必须满足：
- ✅ **构建成功**: `bun build` 无错误
- ✅ **代码质量**: `bun run validate:light` 通过
- ✅ **完整验证**: `bun run validate` 全部通过
- ✅ **测试覆盖**: 达到包级别覆盖率要求
- ✅ **图谱同步**: `bun run ai:session sync` 执行
- ✅ **文档一致性**: 版本号统一，链接无错误
- ✅ **分支整洁**: 工作分支状态干净

## 🚨 绝对禁止

- ❌ **跳过现有实现查询**: 任何代码相关任务前不查询项目上下文
- ❌ **忽略现有实现**: 不查询现有功能就开发新功能
- ❌ **违反分支管理**: 在保护分支直接工作
- ❌ **包管理违规**: 使用npm/yarn而非bun
- ❌ **类型安全违规**: 使用any、as、@ts-ignore

## 📝 任务管理强制要求

### 强制使用场景
- **3步以上任务**: 涉及多个文件或步骤的任务
- **多文件修改**: 需要修改超过2个文件的任务
- **新功能开发**: 任何新功能的实现
- **重大重构**: 架构或设计的重大调整

### 任务状态管理
- **pending**: 待开始的任务
- **in_progress**: 当前正在进行（限制：同时只能有1个）
- **completed**: 已完成的任务

## 🧠 AI原生持续能力

### 会话级智能行为模式

AI具备以下内置的持续能力，无需手动触发：

#### 🔄 包复用检查 (自动执行)
- **触发时机**: 任何新功能开发请求
- **执行方式**: AI自动分析关键词，查询现有实现
- **决策逻辑**: 优先复用现有包，避免重复实现

#### 🔍 Graph RAG查询 (持续查询)
- **触发时机**: 代码相关任务开始前
- **执行方式**: AI智能提取关键概念，主动查询知识图谱
- **覆盖范围**: 现有实现、设计模式、API接口、组件库

#### 🛡️ 质量监控 (实时关注)
- **监控对象**: TypeScript类型安全、ESLint规范、测试覆盖率
- **响应机制**: 发现问题立即提醒，提供修复建议
- **预防策略**: 生成代码前评估质量风险

#### 📊 上下文验证 (持续维护)
- **验证内容**: 项目约束遵循、技术选型一致性
- **更新机制**: 根据项目演进调整理解
- **同步保证**: 确保AI理解与项目状态同步

### 🔍 Graph RAG 智能查询处理

AI会智能转换用户查询，不直接传递原始查询词：

```
用户: "console 组件"
AI自动执行:
  1. 分析关键词: console, component, UI
  2. bun run ai:session query "console" --debug
  3. 查询相关组件库和现有实现
  4. 提供基于项目上下文的建议
  
用户: "用户认证功能"  
AI自动执行:
  1. 分析关键词: auth, user, authentication
  2. bun run ai:session query "auth" --debug
  3. bun run ai:session symbol "AuthService"
  4. 检查@linch-kit/auth包的现有实现
  5. 建议复用或扩展现有功能
```

### 核心查询命令 (AI自动执行)

```bash
# 基础查询（AI自动根据任务执行）
bun run ai:session query "[智能提取的关键词]" --debug

# 符号查询（AI自动查找相关类/函数）
bun run ai:session symbol "[相关符号]"

# 模式查询（AI自动匹配设计模式）
bun run ai:session pattern "[模式]" "[实体]"

# 包复用检查（AI自动执行，无需手动触发）
bun run deps:check "[自动提取关键词]"
```

## 🤖 AI 自我监督承诺

**AI向用户承诺**：
1. 每次Session开始主动阅读Essential_Rules.md
2. 每次代码任务前100%完成Graph RAG查询
3. 发现违规立即自我纠正
4. 绝不寄希望于用户发现错误

**执行保证**：
- 编码前明确列出已完成的Graph RAG查询
- 查询失败时解释原因并重试
- 发现现有实现时停止重复开发

## 📚 详细约束文档

**权威文档路径**：
- [Essential_Rules.md](./ai-context/00_Getting_Started/03_Essential_Rules.md) - 核心开发约束
- [Development_Workflow.md](./ai-context/02_Guides/01_Development_Workflow.md) - 详细开发流程
- [manifest.json](./ai-context/manifest.json) - 知识库导航

---

**核心原则**: 遵循Essential_Rules.md约束，现有实现查询优先，质量至上。  
**工作模式**: 基于完整项目上下文的智能AI辅助开发。