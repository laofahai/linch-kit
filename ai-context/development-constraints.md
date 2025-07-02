# LinchKit 开发约束 - Session 持久化指南

**版本**: v5.0  
**更新**: 2025-07-01  
**状态**: Session 级强制约束  
**重要性**: ⚠️ **必须在每个 session 开始时阅读**

---

## 🔴 技术约束强制要求

### ⚠️ 开发环境要求
```bash
# Node.js 环境路径（每次 session 需要设置）
export PATH="/home/laofahai/.nvm/versions/node/v20.19.2/bin:$PATH"
```

### 📋 技术实现检查清单
- [ ] ✅ 使用正确的包管理工具（pnpm）？
- [ ] ✅ 遵循架构依赖顺序？  
- [ ] ✅ 使用 LinchKit 内部包功能？
- [ ] ✅ 符合代码质量标准？

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

---

## 🔒 安全要求

- **禁止提交敏感信息** (密钥、Token)
- **使用环境变量** 管理配置
- **定期安全检查** `pnpm audit`


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

## 📖 Context7 文档查询规范

### 🎯 优先查询的核心库
使用以下技术时建议查询 Context7 文档：
- **Next.js** - 框架配置、路由、API 等
- **React** - 组件、Hooks、状态管理
- **TypeScript** - 类型定义和最佳实践
- **Tailwind CSS** - 样式和主题配置
- **Prisma** - 数据库操作和 Schema
- **tRPC** - API 设计和类型安全
- **Zod** - Schema 验证和转换
- **shadcn/ui** - UI 组件使用
- **NextAuth.js** - 认证配置

### 文档驱动开发流程
```
文档查询 → 理解最佳实践 → 设计架构 → 编写代码 → 验证合规性
```

---

## 🛠️ 技术选型决策矩阵

### 🎯 核心原则
1. **不重复造轮子** - 优先使用成熟的第三方库
2. **企业级标准** - 选择经过生产验证的解决方案
3. **AI友好** - 选择AI容易理解和处理的技术栈
4. **类型安全** - 100% TypeScript支持

### 🔴 必须依赖第三方库 (禁止自建)
| 功能类别 | 推荐库 | 禁止自建原因 |
|---------|--------|-------------|
| **认证系统** | NextAuth.js | 安全漏洞风险极高 |
| **ORM/数据库** | Prisma | 复杂度极高，维护成本巨大 |
| **日志系统** | Pino | 性能优化复杂 |
| **加密/哈希** | Node.js crypto | 安全实现风险 |
| **JSON Schema** | Zod | 类型系统复杂性 |
| **国际化基础** | i18next | 本地化复杂性 |

### 🟡 混合策略 (基础依赖+企业扩展)
| 功能类别 | 基础库 | 自建扩展 |
|---------|--------|---------|
| **配置管理** | Convict | 多租户、热更新 |
| **可观测性** | OpenTelemetry | 业务指标、告警 |
| **缓存系统** | LRU-cache/Redis | 分布式、策略 |
| **事件系统** | EventEmitter3 | 类型安全、中间件 |

### 🟢 必须自建 (核心差异化功能)
| 功能类别 | 自建原因 |
|---------|---------|
| **插件系统** | LinchKit核心架构 |
| **Schema DSL** | 领域特定语言 |
| **代码生成器** | Schema驱动核心 |
| **权限引擎** | 企业级RBAC/ABAC |

### 🚫 严格禁止的重复造轮子
#### 数据库相关
- ❌ **查询构建器** - 使用Prisma
- ❌ **连接池** - 使用Prisma内置
- ❌ **迁移系统** - 使用Prisma Migrate

#### 安全相关
- ❌ **密码哈希** - 使用bcrypt/argon2
- ❌ **JWT处理** - 使用jose/jsonwebtoken
- ❌ **加密解密** - 使用Node.js crypto

#### 工具相关
- ❌ **时间处理** - 使用date-fns
- ❌ **UUID生成** - 使用uuid库
- ❌ **文件系统操作** - 使用fs-extra

---

这些约束确保 LinchKit 框架的一致性、安全性和可维护性。