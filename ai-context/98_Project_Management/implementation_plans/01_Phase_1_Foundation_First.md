# 第一阶段实施计划：奠定坚实基础 (v1.4)

**关联主计划**: `../05_Master_Plan_for_Framework_Stabilization.md`
**AI 执行指南**: `./00_AI_Execution_Guide.md`
**状态**: 待命
**预计周期**: 2-3 周
**质量目标**: 所有核心包达到 95%+ 测试覆盖率

## 阶段目标

本阶段的目标是建立稳定、可靠的核心包基础，为后续阶段提供坚实的平台支持。

### 核心成果：
- 所有 `@linch-kit/*` 核心包功能完善、API 稳定
- 全面的 TypeScript 类型安全保障
- 完整的国际化 (i18n) 功能集成
- 高质量的测试覆盖和文档
- 明确的包依赖关系和架构边界

---

## 任务清单：`@linch-kit/shared-types`

### 任务ID: P1-01-类型定义
**任务名称**: 完善共享类型定义和类型安全
**预计工时**: 1-2 天
**依赖任务**: 无
**任务类型**: 开发

#### 前置条件
- [ ] 当前在功能分支上工作
- [ ] 已完成 Graph RAG 查询现有类型定义
- [ ] 已验证 `tsconfig.base.json` 配置

#### 执行步骤

1. **审计现有类型结构**
   ```bash
   bun run ai:session query "shared-types"
   find packages/shared-types/src -name "*.ts" | head -10
   ```
   预期结果：获得现有类型文件列表和依赖关系

2. **实现用户相关类型**
   - 创建/完善 `src/user.ts`
   - 定义 `User`, `Session`, `AuthState` 接口
   - 确保与 `@linch-kit/auth` 的兼容性
   
3. **实现框架核心类型**
   - 创建/完善 `src/framework.ts`
   - 定义 `LinchKitConfig`, `ExtensionManifest` 等接口
   - 添加详细的 JSDoc 注释
   
4. **实现国际化类型**
   - 创建/完善 `src/i18n.ts`
   - 定义 `TranslationResources`, `I18nConfig` 等类型
   - 与 `react-i18next` 类型保持兼容
   
5. **类型安全强化**
   ```bash
   # 检查并移除所有 any 类型
   grep -r "any" packages/shared-types/src/ || echo "No any types found"
   
   # 验证 TypeScript 编译
   cd packages/shared-types && bun run build
   ```
   成功标志：无 TypeScript 编译错误，无 any 类型

#### 验收标准
- [ ] 所有导出的类型都有完整的 JSDoc 注释
- [ ] TypeScript 编译通过，无 any 类型使用
- [ ] 所有接口都有单元测试覆盖
- [ ] 与依赖包的类型兼容性验证通过

#### 失败处理
- **回滚步骤**：
  1. `git stash` 保存当前更改
  2. `git checkout -- packages/shared-types/src/`
- **补救措施**：
  - 如果类型定义冲突，优先保持向后兼容性
  - 如果编译失败，优先修复类型错误而非使用 any

#### 输出物
- [ ] `packages/shared-types/src/user.ts`
- [ ] `packages/shared-types/src/framework.ts`
- [ ] `packages/shared-types/src/i18n.ts`
- [ ] `packages/shared-types/src/__tests__/` 下的测试文件
- [ ] 更新的 `packages/shared-types/README.md`

---

## 任务清单：`@linch-kit/core`

### 任务ID: P1-02-核心服务
**任务名称**: 完善核心服务和基础设施
**预计工时**: 3-5 天
**依赖任务**: P1-01-类型定义
**任务类型**: 开发

#### 前置条件
- [ ] `@linch-kit/shared-types` 任务已完成
- [ ] 已完成 Graph RAG 查询现有 core 服务
- [ ] 已验证所需依赖包的可用性

#### 执行步骤

1. **审计现有服务架构**
   ```bash
   bun run ai:session query "core services"
   bun run ai:session symbol "ConfigService"
   tree packages/core/src/services/
   ```
   预期结果：获得现有服务文件列表和依赖关系

2. **实现配置服务**
   - 创建/完善 `src/services/ConfigService.ts`
   - 支持多源配置合并（文件 + 环境变量）
   - 实现类型安全的配置访问
   - 添加配置验证和默认值处理

3. **实现日志服务**
   ```bash
   bun add pino pino-pretty
   ```
   - 创建/完善 `src/services/LoggerService.ts`
   - 支持结构化日志输出
   - 实现日志级别配置和过滤
   - 添加上下文信息和错误堆栈跟踪

4. **实现事件总线服务**
   ```bash
   bun add mitt
   ```
   - 创建/完善 `src/services/EventBusService.ts`
   - 实现类型安全的事件处理
   - 添加事件中间件和拦截器支持
   - 实现事件持久化和回放机制

5. **实现扩展加载器**
   - 创建/完善 `src/extension/ExtensionLoader.ts`
   - 实现扩展生命周期管理
   - 添加扩展依赖解析和冲突检测
   - 实现扩展沙箱化和安全检查

6. **实现国际化服务**
   - 创建/完善 `src/i18n/I18nService.ts`
   - 支持动态语言包加载
   - 实现复数形式和数字格式化
   - 添加翻译缓存和懒加载机制

7. **服务集成和导出**
   ```bash
   # 验证所有服务集成
   cd packages/core && bun run build
   bun run test
   ```
   成功标志：所有服务正常初始化和运行

#### 验收标准
- [ ] 所有服务都有完整的单元测试覆盖 (95%+)
- [ ] 服务间的依赖关系清晰且可测试
- [ ] 所有公共 API 都有详细的 JSDoc 注释
- [ ] 错误处理和日志记录完善
- [ ] 性能测试通过（初始化 < 100ms）

#### 失败处理
- **回滚步骤**：
  1. `git stash` 保存当前更改
  2. `git checkout -- packages/core/src/`
- **补救措施**：
  - 如果服务初始化失败，优先使用默认配置
  - 如果依赖包不可用，使用内置实现或关闭相关功能

#### 输出物
- [ ] `packages/core/src/services/ConfigService.ts`
- [ ] `packages/core/src/services/LoggerService.ts`
- [ ] `packages/core/src/services/EventBusService.ts`
- [ ] `packages/core/src/extension/ExtensionLoader.ts`
- [ ] `packages/core/src/i18n/I18nService.ts`
- [ ] 对应的测试文件和文档
- [ ] 更新的 `packages/core/README.md`

---

## 任务清单：`@linch-kit/ui`

### 任务ID: P1-03-UI组件
**任务名称**: 构建统一的 UI 组件库和设计系统
**预计工时**: 2-3 天
**依赖任务**: P1-01-类型定义
**任务类型**: 开发

#### 前置条件
- [ ] `@linch-kit/shared-types` 任务已完成
- [ ] 已完成 Graph RAG 查询现有 UI 组件
- [ ] 已确认 Server/Client 组件分离策略

#### 执行步骤

1. **审计现有组件架构**
   ```bash
   bun run ai:session query "ui components"
   bun run ai:session pattern "client server separation" "ui"
   tree packages/ui/src/
   ```
   预期结果：获得现有组件列表和分离状态

2. **设置依赖和项目配置**
   ```bash
   cd packages/ui
   bun add radix-ui-themes @radix-ui/react-icons
   bun add -d @storybook/react @storybook/addon-essentials
   ```
   预期结果：依赖包安装成功

3. **实现主题系统**
   - 创建/完善 `src/themes/` 目录结构
   - 实现基于 CSS 变量的亮/暗主题
   - 支持主题动态切换和持久化
   - 实现主题上下文提供器

4. **实现核心组件 (Server 组件)**
   - 创建/完善 `src/server/components/`
   - 实现 `Button`, `Input`, `Card`, `Layout` 等静态组件
   - 确保所有组件都是服务端可渲染的
   - 遵循 Radix 设计系统和无障碍标准

5. **实现交互组件 (Client 组件)**
   - 创建/完善 `src/client/components/`
   - 实现 `Modal`, `Dropdown`, `Tooltip`, `Toast` 等交互组件
   - 所有组件文件以 `'use client'` 开头
   - 实现交互状态管理和事件处理

6. **配置 Storybook**
   ```bash
   # 初始化 Storybook
   bunx storybook@latest init
   ```
   - 为每个组件编写 `.stories.tsx` 文件
   - 实现主题切换和响应式预览
   - 添加组件文档和使用示例

7. **构建配置和导出**
   ```bash
   # 验证构建和导出
   bun run build
   bun run storybook:build
   ```
   成功标志：生成正确的多入口点构建产物

#### 验收标准
- [ ] 所有组件都有完整的 TypeScript 类型定义
- [ ] Server/Client 组件分离符合架构要求
- [ ] 所有组件都有对应的 Storybook 故事
- [ ] 主题系统功能完整且可测试
- [ ] 无障碍性检查通过
- [ ] 组件库按需导入正常工作

#### 失败处理
- **回滚步骤**：
  1. `git stash` 保存当前更改
  2. `git checkout -- packages/ui/src/`
- **补救措施**：
  - 如果 Radix 依赖问题，优先使用稳定版本
  - 如果 Storybook 配置失败，先完成组件开发

#### 输出物
- [ ] `packages/ui/src/themes/` 主题文件
- [ ] `packages/ui/src/server/components/` 服务端组件
- [ ] `packages/ui/src/client/components/` 客户端组件
- [ ] Storybook 配置和故事文件
- [ ] 组件库文档和使用指南

---

## 任务清单：`@linch-kit/auth`

### 任务ID: P1-04-认证系统
**任务名称**: 构建安全可靠的认证授权系统
**预计工时**: 2-3 天
**依赖任务**: P1-01-类型定义
**任务类型**: 开发

#### 前置条件
- [ ] `@linch-kit/shared-types` 任务已完成
- [ ] 已完成 Graph RAG 查询现有认证配置
- [ ] 已确认 Next.js 14 和 next-auth v5 兼容性

#### 执行步骤

1. **审计现有认证架构**
   ```bash
   bun run ai:session query "next-auth configuration"
   bun run ai:session symbol "authOptions"
   tree packages/auth/src/
   ```
   预期结果：获得现有认证配置和依赖关系

2. **设置依赖和环境**
   ```bash
   cd packages/auth
   bun add next-auth@beta
   bun add @auth/prisma-adapter  # 如果使用数据库
   ```
   预期结果：依赖包安装成功

3. **实现认证配置**
   - 创建/完善 `src/config.ts`
   - 实现 `authOptions: NextAuthOptions`
   - 设置 `session.strategy = 'jwt'`
   - 配置安全的 JWT 签名和加密
   - 添加环境变量验证和默认值

4. **实现认证提供器**
   - 创建/完善 `src/providers/credentials.ts`
   - 实现 `CredentialsProvider` 的 `authorize` 函数
   - 添加用户输入验证和安全检查
   - 实现密码哈希和验证逻辑
   - 支持多种认证方式（邮箱/用户名）

5. **实现会话回调**
   - 在 `authOptions` 中配置 `jwt` 回调
   - 在 `authOptions` 中配置 `session` 回调
   - 将用户 ID 和角色信息写入 token
   - 实现会话数据加密和验证

6. **实现中间件**
   - 创建/完善 `src/middleware.ts`
   - 配置路由保护规则
   - 实现角色权限检查
   - 添加认证失败处理和重定向

7. **实现客户端 hooks**
   - 创建/完善 `src/hooks/useAuth.ts`
   - 封装 `useSession` 和认证状态
   - 实现用户管理操作（登录、登出、注册）

8. **测试和验证**
   ```bash
   # 验证认证流程
   bun run test
   bun run build
   ```
   成功标志：认证流程完整且安全

#### 验收标准
- [ ] 所有认证配置都有完整的类型定义
- [ ] JWT 配置安全且符合最佳实践
- [ ] 中间件路由保护功能正常
- [ ] 认证流程有完整的单元测试覆盖
- [ ] 安全性测试通过
- [ ] 与 Next.js 14 完全兼容

#### 失败处理
- **回滚步骤**：
  1. `git stash` 保存当前更改
  2. `git checkout -- packages/auth/src/`
- **补救措施**：
  - 如果 next-auth v5 不稳定，降级到 v4 版本
  - 如果 JWT 配置问题，使用简化配置

#### 输出物
- [ ] `packages/auth/src/config.ts`
- [ ] `packages/auth/src/providers/credentials.ts`
- [ ] `packages/auth/src/middleware.ts`
- [ ] `packages/auth/src/hooks/useAuth.ts`
- [ ] 认证流程测试和文档
- [ ] 安全性测试报告

---

## 任务清单：`@linch-kit/platform`

### 任务ID: P1-05-平台集成
**任务名称**: 构建统一的平台集成层和状态管理
**预计工时**: 2-3 天
**依赖任务**: P1-02-核心服务, P1-04-认证系统
**任务类型**: 开发

#### 前置条件
- [ ] `@linch-kit/core` 和 `@linch-kit/auth` 任务已完成
- [ ] 已完成 Graph RAG 查询现有 hooks 和 providers
- [ ] 已确认 React 18 和 Next.js 14 兼容性

#### 执行步骤

1. **审计现有平台架构**
   ```bash
   bun run ai:session query "platform hooks providers"
   bun run ai:session symbol "LinchKitProvider"
   tree packages/platform/src/
   ```
   预期结果：获得现有平台集成组件列表

2. **设置依赖和环境**
   ```bash
   cd packages/platform
   bun add zustand i18next react-i18next
   bun add @types/react @types/react-dom
   ```
   预期结果：依赖包安装成功

3. **实现国际化客户端**
   - 创建/完善 `src/i18n/client.ts`
   - 配置 i18next 实例和资源加载
   - 实现语言切换和持久化
   - 支持命名空间和懒加载

4. **实现统一提供器**
   - 创建/完善 `src/providers/LinchKitProvider.tsx`
   - 组合 `SessionProvider` 和 `I18nextProvider`
   - 添加主题提供器和状态管理
   - 实现提供器的错误边界和恢复机制

5. **实现核心 hooks**
   - 创建/完善 `src/hooks/useLinchKit.ts`
   - 封装 `@linch-kit/core` 服务访问
   - 实现服务实例的单例管理
   - 添加服务初始化和错误处理

6. **实现国际化 hooks**
   - 创建/完善 `src/hooks/useTranslation.ts`
   - 封装 `react-i18next` 的 `useTranslation`
   - 添加类型安全和错误处理
   - 实现翻译缓存和性能优化

7. **实现全局状态管理**
   - 创建/完善 `src/store/app.ts`
   - 使用 `zustand` 创建 `useAppStore`
   - 实现全局状态的持久化
   - 添加中间件支持（日志、调试等）

8. **集成测试和优化**
   ```bash
   # 验证平台集成
   bun run test
   bun run build
   ```
   成功标志：所有组件和 hooks 正常工作

#### 验收标准
- [ ] 所有 hooks 和 providers 都有完整的 TypeScript 类型
- [ ] 国际化功能完整且性能优化
- [ ] 全局状态管理稳定并支持持久化
- [ ] 提供器错误边界和恢复机制完善
- [ ] 集成测试覆盖率达到 90%+
- [ ] 与其他核心包的集成测试通过

#### 失败处理
- **回滚步骤**：
  1. `git stash` 保存当前更改
  2. `git checkout -- packages/platform/src/`
- **补救措施**：
  - 如果 zustand 状态问题，使用简化的状态管理
  - 如果 i18next 配置失败，优先使用静态翻译

#### 输出物
- [ ] `packages/platform/src/i18n/client.ts`
- [ ] `packages/platform/src/providers/LinchKitProvider.tsx`
- [ ] `packages/platform/src/hooks/useLinchKit.ts`
- [ ] `packages/platform/src/hooks/useTranslation.ts`
- [ ] `packages/platform/src/store/app.ts`
- [ ] 平台集成测试和文档

---

## 阶段总结和验证

### 阶段验收标准

在第一阶段完成后，必须通过以下综合验证：

#### 功能验证
- [ ] 所有核心包都可以正常构建和导出
- [ ] 包之间的依赖关系清晰且稳定
- [ ] 国际化功能在所有相关包中正常工作
- [ ] 认证流程完整且安全

#### 质量验证
- [ ] 所有包的测试覆盖率达到目标要求
- [ ] TypeScript 类型安全无遗漏，无 any 类型
- [ ] ESLint 检查全部通过
- [ ] 性能测试符合预期指标

#### 文档验证
- [ ] 所有公共 API 都有完整的 JSDoc 注释
- [ ] 各包的 README.md 文档完整且准确
- [ ] 使用示例和最佳实践指南已更新

### 阶段交付物

1. **技术交付物**
   - 完整的 `@linch-kit/shared-types` 包
   - 完整的 `@linch-kit/core` 包
   - 完整的 `@linch-kit/ui` 包
   - 完整的 `@linch-kit/auth` 包
   - 完整的 `@linch-kit/platform` 包

2. **质量交付物**
   - 所有包的单元测试和集成测试
   - 测试覆盖率报告
   - 性能测试报告
   - 安全性评估报告

3. **文档交付物**
   - 所有包的 API 文档
   - 架构设计文档更新
   - 开发者指南更新
   - 第一阶段完成总结报告

### 下一阶段准备

在第一阶段完成后，必须为第二阶段做好以下准备：

- [ ] 所有核心包的稳定版本发布
- [ ] 第二阶段任务依赖关系验证
- [ ] `apps/starter` 项目的现状评估
- [ ] 第二阶段开发环境准备

---

**版本更新日志**:
- v1.4 (2025-07-17): 完善任务模板和执行标准，增加阶段验证和总结
- v1.3: 初始任务清单版本
- v1.2: 增加任务依赖关系
- v1.1: 基础任务定义
- v1.0: 初始版本