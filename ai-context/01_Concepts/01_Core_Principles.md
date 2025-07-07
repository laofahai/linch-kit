# LinchKit 核心设计原则

**版本**: v7.2  
**更新**: 2025-07-07  
**状态**: LinchKit 设计理念的核心文档

## 🎯 设计哲学

LinchKit 的设计哲学围绕着让 AI 和人类开发者能够高效协作构建企业级应用。每个设计决策都优先考虑 AI 的理解能力和开发者的生产力。

## 🌟 五大核心原则

### 1. AI-First 设计原则

**理念**: 所有设计都优先考虑 AI 理解和处理能力

#### 实现方式
- **结构化数据**: 使用 Zod Schema 定义所有数据结构，AI 可以轻松理解
- **声明式配置**: 通过配置驱动功能，而非复杂的编程逻辑
- **知识图谱**: 维护完整的代码关系图谱，支持 Graph RAG 查询
- **自文档化**: 代码即文档，AI 可以直接理解代码意图

#### AI 友好特性
```typescript
// AI 可以轻松理解的 Schema 定义
export const UserSchema = defineEntity('User', {
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
  createdAt: z.date(),
  updatedAt: z.date()
})
```

### 2. Schema 驱动架构

**理念**: 以 Zod Schema 为单一数据源，驱动整个系统

#### 单一数据源流程
```
Schema 定义 → 类型生成 → 数据库 Schema → API 接口 → UI 表单 → 验证逻辑
```

#### 自动生成能力
- **TypeScript 类型**: 从 Schema 自动生成类型定义
- **数据库迁移**: 自动生成 Prisma 模型和迁移
- **API 路由**: 自动生成 tRPC 路由和验证
- **UI 组件**: 自动生成表单组件和验证规则

#### 示例工作流
```typescript
// 1. 定义 Schema
const ProductSchema = defineEntity('Product', {
  name: z.string(),
  price: z.number().positive(),
  category: z.string()
})

// 2. 自动生成类型
type Product = z.infer<typeof ProductSchema>

// 3. 自动生成 CRUD API
const productRouter = createCRUD(ProductSchema)

// 4. 自动生成 UI 表单
const ProductForm = createForm(ProductSchema)
```

### 3. 端到端类型安全

**理念**: 从数据库到 UI 的完整类型安全保障

#### 类型安全链路
- **数据层**: Prisma + Zod Schema 确保数据类型安全
- **API 层**: tRPC 提供端到端类型安全的 API
- **状态层**: Zustand/React Query 的类型安全状态管理
- **UI 层**: TypeScript 严格模式确保组件类型安全

#### 编译时验证
```typescript
// 编译时即可发现类型错误
const user: User = {
  id: "123",
  name: "John",
  email: "invalid-email", // ❌ TypeScript 错误
  role: "INVALID_ROLE"    // ❌ TypeScript 错误
}
```

### 4. 模块化设计

**理念**: 高内聚、低耦合的包设计

#### 清晰的依赖层次
```
L0: @linch-kit/core      (基础设施)
  ↓
L1: @linch-kit/schema    (Schema 引擎)
  ↓
L2: @linch-kit/auth, @linch-kit/crud (业务功能)
  ↓
L3: @linch-kit/trpc, @linch-kit/ui (API 和 UI)
  ↓
L4: modules/console (应用模块)
```

#### 包设计原则
- **单一职责**: 每个包只负责一个明确的功能域
- **最小接口**: 只暴露必要的公共 API
- **可组合性**: 包之间可以灵活组合使用
- **向后兼容**: API 变更遵循语义化版本控制

### 5. 生产就绪标准

**理念**: 企业级质量和性能标准

#### 质量标准
- **测试覆盖率**: 核心包 >95%，其他包 >80%
- **构建时间**: 全量构建 <10秒
- **代码质量**: 100% TypeScript 严格模式，零 ESLint 错误
- **文档完整性**: 100% 公共 API 文档覆盖

#### 性能标准
- **首屏加载**: <3秒
- **API 响应**: 平均 <200ms
- **打包体积**: 核心包 <50KB gzipped
- **内存使用**: 稳定状态 <100MB

#### 企业级特性
- **多租户支持**: 完整的租户隔离机制
- **权限管理**: 基于 RBAC/ABAC 的细粒度权限控制
- **审计日志**: 完整的操作审计和追踪
- **监控告警**: 基于 OpenTelemetry 的可观测性

## 🏗️ 架构设计模式

### 洋葱架构 (Onion Architecture)

```
┌─────────────────────────────────────┐
│         Presentation Layer          │  ← UI Components (@linch-kit/ui)
├─────────────────────────────────────┤
│         Application Layer           │  ← API Routes (@linch-kit/trpc)
├─────────────────────────────────────┤
│           Domain Layer              │  ← Business Logic (@linch-kit/crud)
├─────────────────────────────────────┤
│        Infrastructure Layer         │  ← Data Access (@linch-kit/core)
└─────────────────────────────────────┘
```

### 依赖注入模式

```typescript
// 服务注册
container.register('userService', UserService)
container.register('authService', AuthService)

// 自动注入依赖
class UserController {
  constructor(
    @inject('userService') private userService: UserService,
    @inject('authService') private authService: AuthService
  ) {}
}
```

### 事件驱动架构

```typescript
// 领域事件
export const UserCreatedEvent = defineEvent('user.created', {
  userId: z.string(),
  email: z.string(),
  timestamp: z.date()
})

// 事件处理
eventBus.on(UserCreatedEvent, async (event) => {
  await emailService.sendWelcomeEmail(event.email)
  await analyticsService.trackUserSignup(event.userId)
})
```

## 🎯 设计决策原则

### 1. 约定优于配置
- 默认配置覆盖 80% 的使用场景
- 提供明确的配置覆盖机制
- 配置验证和错误提示

### 2. 渐进式增强
- 基础功能开箱即用
- 高级功能按需启用
- 平滑的学习曲线

### 3. 最小惊讶原则
- API 设计符合直觉
- 错误信息清晰明确
- 行为可预测

### 4. 关注点分离
- 业务逻辑与基础设施分离
- 数据模型与视图逻辑分离
- 配置与代码分离

## 🚀 实践指导

### 开发新功能时
1. **Schema 优先**: 先定义数据模型
2. **类型安全**: 确保端到端类型安全
3. **模块化**: 考虑功能在哪个包中最合适
4. **AI 友好**: 代码结构要便于 AI 理解
5. **测试同步**: 功能与测试同步开发

### 架构决策时
1. **遵循依赖方向**: 严格按照架构层次
2. **最小化依赖**: 减少不必要的外部依赖
3. **性能考虑**: 评估对性能的影响
4. **扩展性设计**: 考虑未来的扩展需求

### 代码审查时
1. **原则一致性**: 是否符合核心原则
2. **类型安全**: 是否保持类型安全
3. **模块边界**: 是否违反模块边界
4. **性能影响**: 是否影响系统性能

---

**这些原则是 LinchKit 设计的基石，所有开发决策都应该以这些原则为指导。**