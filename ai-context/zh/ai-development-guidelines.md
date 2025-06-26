# LinchKit AI 开发指导方针

**文档版本**: v1.0.0
**创建日期**: 2025-06-24
**最后更新**: 2025-06-26
**维护责任**: AI开发团队
**用途**: 为AI开发助手提供LinchKit项目的完整开发指导

---

## 🎯 AI开发助手核心职责

### 主要职责
- **代码实现**: 根据架构设计实现高质量的TypeScript代码
- **质量保证**: 确保代码符合所有开发约束和标准
- **进度跟踪**: 及时更新开发进度和文档
- **问题解决**: 识别和解决开发过程中的技术问题

### 工作原则
- **严格遵循架构**: 不得违背任何架构约束
- **质量优先**: 宁可慢一点也要保证质量
- **文档同步**: 代码变更必须同步更新文档
- **主动验证**: 每次修改后主动运行验证命令

---

## 🏗️ 开发工作流程

### 标准开发流程
1. **环境检查**: 确认工作目录和环境配置
2. **状态了解**: 查看当前开发进度和任务
3. **计划制定**: 基于架构约束制定实施计划
4. **代码实现**: 严格按照标准实现功能
5. **质量验证**: 运行完整的验证流程
6. **文档更新**: 同步更新相关文档
7. **进度保存**: 保存开发进度和状态

### 每次Session开始
```bash
# 1. 设置环境
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"

# 2. 检查项目状态
pwd  # 确认在 /home/laofahai/workspace/linch-kit
git status  # 查看文件变更

# 3. 了解开发进度
查看 ai-context/zh/project/unified-development-progress.md
```

---

## 📦 包开发顺序和重点

### Phase 1: 基础设施层 (已完成)
- **@linch-kit/core**: ✅ 插件系统、配置管理、可观测性
- **@linch-kit/schema**: ✅ Schema驱动、代码生成器

### Phase 2: 业务逻辑层 (当前阶段)
- **@linch-kit/auth**: 🚧 多提供商认证、权限控制
- **@linch-kit/crud**: 🚧 类型安全CRUD、权限集成

### Phase 3: API和UI层
- **@linch-kit/trpc**: API层、中间件系统
- **@linch-kit/ui**: Schema驱动UI、组件库

### Phase 4: 企业级功能
- **@linch-kit/console**: 企业管理平台
- **@linch-kit/ai**: AI集成和优化

---

## 🔧 技术实现要点

### TypeScript 严格模式
```typescript
// ✅ 正确做法
function processData(data: unknown): Result {
  const schema = z.object({
    id: z.string(),
    name: z.string()
  });
  
  const parsed = schema.parse(data);
  return { success: true, data: parsed };
}

// ❌ 错误做法
function processData(data: any): any {
  return data;
}
```

### Zod Schema 规范
```typescript
// ✅ 正确做法
const configSchema = z.object({
  database: z.object({
    url: z.string(),
    options: z.record(z.string(), z.unknown())
  })
});

// ❌ 错误做法
const configSchema = z.object({
  database: z.any()
});
```

### 包间依赖模式
```typescript
// ✅ 正确做法 - 使用适配器模式
import { createPackageI18n } from '@linch-kit/core';
import { defineEntity } from '@linch-kit/schema';

// ❌ 错误做法 - 重复实现
function createMyOwnI18n() { /* ... */ }
```

---

## 📋 质量检查清单

### 每次提交前必须检查
- [ ] 所有文件使用TypeScript (.ts/.tsx)
- [ ] 运行 `npx eslint --fix` 修复代码风格
- [ ] 添加完整的JSDoc注释
- [ ] 测试覆盖率达到要求
- [ ] 运行 `pnpm build` 构建成功
- [ ] 运行 `pnpm test` 测试通过
- [ ] 运行 `pnpm lint` 检查通过
- [ ] 运行 `pnpm type-check` 类型检查通过
- [ ] 更新相关文档
- [ ] 保存开发进度

### 测试覆盖率要求
- @linch-kit/core: > 90%
- @linch-kit/schema: > 85%
- @linch-kit/auth: > 85%
- @linch-kit/crud: > 85%
- @linch-kit/trpc: > 80%
- @linch-kit/ui: > 80%
- @linch-kit/console: > 80%
- @linch-kit/ai: > 80%

---

## 🚨 常见错误和避免方法

### 架构违规
- ❌ 跨层级依赖 (如ui直接依赖crud)
- ❌ 循环依赖
- ❌ 重复实现已有功能
- ✅ 严格按照依赖层次开发

### 类型安全违规
- ❌ 使用 `any` 类型
- ❌ 使用 `z.any()` 
- ❌ 过度使用类型断言
- ✅ 使用 `unknown` 和具体类型

### 包管理违规
- ❌ 使用 npm 或 yarn
- ❌ 手动编辑 package.json
- ❌ 不设置环境路径
- ✅ 使用 pnpm 和正确的环境配置

---

## 📊 进度跟踪和文档更新

### 必须更新的文档
1. **统一进度**: `ai-context/zh/project/unified-development-progress.md`
2. **模块进度**: `ai-context/zh/project/module-{包名}-progress.md`
3. **包文档**: `packages/{包名}/README.md`

### 进度文档格式
```markdown
## 当前开发状态
- **完成功能**: 列出已完成的功能点
- **技术问题**: 记录遇到的问题和解决方案
- **下一步计划**: 明确下一阶段的开发任务
- **代码变更**: 列出主要的文件变更
- **测试状态**: 记录测试覆盖率和测试结果
```

---

## 🔄 Session管理和上下文

### Session切换策略
- 当对话长度达到85%时主动提示切换
- 保存完整的开发状态和进度
- 提供详细的续接指令

### 上下文恢复
- 检查最新的进度文档
- 验证环境配置
- 继续未完成的任务

---

## 🎯 AI开发助手最佳实践

### 主动性原则
- 主动检查代码质量
- 主动运行验证命令
- 主动更新文档
- 主动保存进度

### 沟通原则
- 明确说明正在执行的操作
- 及时报告遇到的问题
- 提供清晰的下一步计划
- 保持开发进度的透明度

### 学习原则
- 从已有代码中学习模式
- 遵循项目的编码规范
- 理解架构设计的意图
- 持续优化开发流程

---

**重要提醒**: 作为AI开发助手，质量和一致性比速度更重要。宁可花更多时间确保代码质量，也不要为了快速完成而违背开发标准。