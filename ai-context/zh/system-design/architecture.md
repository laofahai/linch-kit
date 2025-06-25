# LinchKit 系统架构设计

**文档版本**: v1.0.0
**创建日期**: 2025-06-23
**最后更新**: 2025-06-24
**维护责任**: 架构团队
**状态**: 🔒 设计冻结 - 禁止修改

---

## 🎯 架构设计理念

### 核心原则
- **AI-First**: 所有设计都优先考虑 AI 理解和处理能力
- **Schema 驱动**: 以 Zod Schema 为单一数据源，驱动整个系统
- **类型安全**: 端到端 TypeScript 类型安全保障
- **模块化**: 高内聚、低耦合的包设计
- **可扩展**: 插件化架构支持功能扩展
- **渐进式**: 支持从简单到复杂的渐进式开发

### 设计哲学
- **不重复造轮子**: 优先使用成熟的现有解决方案
- **约定优于配置**: 提供合理的默认配置
- **开发体验优先**: 优化开发者的使用体验
- **生产就绪**: 企业级的性能和可靠性

---

## 🏗️ 系统分层架构

### 整体架构图
```mermaid
graph TB
    subgraph "应用层"
        STARTER[Starter 应用 apps/starter]
        WEB[其他 Web 应用 Next.js Apps]
    end

    subgraph "表现层"
        UI[UI 组件库 @linch-kit/ui]
    end

    subgraph "API 层"
        TRPC[tRPC 集成 @linch-kit/trpc]
        MW[中间件 Auth/Validation/Permissions]
    end

    subgraph "业务逻辑层"
        CRUD[CRUD 操作 @linch-kit/crud]
        AUTH[认证权限 @linch-kit/auth]
    end

    subgraph "插件层"
        AI[AI 集成 @linch-kit/ai]
        WORKFLOW[工作流插件 @linch-kit/workflow]
    end

    subgraph "数据访问层"
        SCHEMA[Schema 系统 @linch-kit/schema]
        ORM[Prisma ORM]
        DB[(PostgreSQL)]
    end

    subgraph "基础设施层"
        CORE[核心系统 @linch-kit/core]
        PLUGINS[插件系统]
        CLI[CLI 工具]
    end

    STARTER --> UI
    WEB --> UI
    UI --> TRPC
    TRPC --> MW
    MW --> CRUD
    MW --> AUTH
    CRUD --> SCHEMA
    AUTH --> SCHEMA
    SCHEMA --> ORM
    ORM --> DB
    
    AI --> CORE
    WORKFLOW --> CORE
    PLUGINS --> CORE
    CLI --> CORE
    
    CORE --> SCHEMA
```

---

## 📦 包依赖关系

### 主依赖链
```mermaid
graph TD
    A[core 插件系统+可观测性+性能监控+安全基础] --> B[schema 数据模式系统]
    A --> G[ai AI服务集成]
    B --> C[auth 认证权限]
    B --> D[crud CRUD操作]
    C --> D
    D --> E[trpc API层]
    E --> F[ui UI组件库]
    F --> H[console 企业级管理平台]

    classDef level0 fill:#e1f5fe
    classDef level1 fill:#f3e5f5
    classDef level2 fill:#e8f5e8
    classDef level3 fill:#fff3e0
    classDef level4 fill:#fce4ec
    classDef level5 fill:#f1f8e9
    classDef level6 fill:#e8eaf6
    classDef ai fill:#fff8e1

    class A level0
    class B level1
    class G ai
    class C level2
    class D level3
    class E level4
    class F level5
    class H level6
```

### 构建顺序层级
| 层级 | 包名 | 依赖数量 | 构建时间 | 并行构建 |
|------|------|----------|----------|----------|
| Level 0 | core | 0 | ~45s | ✅ |
| Level 1 | schema, ai | 1 | ~45s | ✅ |
| Level 2 | auth | 2 | ~60s | ✅ |
| Level 3 | crud | 3 | ~60s | ✅ |
| Level 4 | trpc | 4 | ~40s | ✅ |
| Level 5 | ui | 1* | ~50s | ✅ |
| Level 6 | console | 5** | ~60s | ✅ |

*ui 包直接依赖 core，通过 core 获得所有通用类型和插件支持
*ai 包与其他业务包并行，独立提供 AI 服务能力
**console 包依赖 core、auth、crud、trpc、ui，提供企业级管理功能

---

## 🛠️ 技术栈架构

### 核心技术选型
| 层级 | 技术 | 版本 | 选择理由 |
|------|------|------|----------|
| **前端** | React | 19.1.0 | 最新稳定版，并发特性 |
| | Next.js | 15.3.4 | 全栈框架，App Router |
| | shadcn/ui | latest | 高质量组件库 |
| | Tailwind CSS | 4.1.10 | 原子化CSS，开发效率 |
| **API** | tRPC | 11.3.1 | 端到端类型安全 |
| | Zod | 3.25.67 | Schema验证，单一数据源 |
| **数据** | Prisma | 5.22.0 | 现代化TypeScript ORM |
| | PostgreSQL | ^14.0 | 功能丰富的关系型数据库 |
| **工具** | TypeScript | 5.8.3 | 静态类型检查 |
| | Turborepo | 2.5.4 | 高性能monorepo构建 |
| | pnpm | 10.12.1 | 高效包管理器 |
| | Vitest | ^2.0.0 | 快速单元测试 |

### 技术栈集成架构
```mermaid
graph TD
    A[React + shadcn/ui] --> B[tRPC Client + React Query]
    B --> C[tRPC Server + Zod]
    C --> D[CRUD + Auth + Schema]
    D --> E[Prisma ORM]
    E --> F[PostgreSQL]

    G[Zod Schema] --> H[TypeScript Types]
    G --> I[Prisma Schema]
    G --> J[tRPC Routes]
    G --> K[React Components]
```

---

## 📊 包功能概览

### 核心包设计
| 包名 | 功能定位 | 核心特性 | 开发优先级 |
|------|----------|----------|------------|
| **@linch-kit/core** | 基础设施 | 插件系统、可观测性、性能监控、安全基础、配置系统 | P0 - 最高 |
| **@linch-kit/schema** | 数据模式 | Schema定义、代码生成、类型推导、验证引擎 | P0 - 最高 |
| **@linch-kit/auth** | 认证权限 | 多提供者认证、RBAC/ABAC、多租户、MFA | P1 - 高 |
| **@linch-kit/crud** | 数据操作 | 类型安全CRUD、查询构建、事务管理、缓存 | P1 - 高 |
| **@linch-kit/trpc** | API层 | 类型安全API、中间件、错误处理、文档生成 | P1 - 高 |
| **@linch-kit/ui** | UI组件 | 组件库、主题系统、国际化、响应式设计 | P1 - 高 |

### 插件包设计
| 包名 | 功能定位 | 核心特性 | 开发优先级 |
|------|----------|----------|------------|
| **@linch-kit/ai** | AI集成 | 多提供商支持、智能缓存、成本控制、安全检查 | P2 - 中 |
| **@linch-kit/workflow** | 工作流 | 流程定义、状态管理、事件驱动、可视化编辑 | P2 - 中 |

### 企业级包设计
| 包名 | 功能定位 | 核心特性 | 开发优先级 |
|------|----------|----------|------------|
| **@linch-kit/console** | 企业管理 | 多租户管理、插件市场、高级监控、企业安全 | P1 - 高 |

### 应用示例
| 应用 | 功能定位 | 核心特性 | 开发优先级 |
|------|----------|----------|------------|
| **apps/starter** | 示例应用 | 完整功能演示、最佳实践、快速启动模板 | P2 - 中 |

---

## 🔄 数据流架构

### 请求处理流程
```mermaid
sequenceDiagram
    participant C as 客户端
    participant UI as UI组件
    participant API as tRPC API
    participant MW as 中间件
    participant BL as 业务逻辑
    participant DA as 数据访问
    participant DB as 数据库
    
    C->>UI: 用户操作
    UI->>API: API 调用
    API->>MW: 请求验证
    MW->>MW: 认证检查
    MW->>MW: 权限验证
    MW->>BL: 业务处理
    BL->>DA: 数据操作
    DA->>DB: SQL 查询
    DB-->>DA: 查询结果
    DA-->>BL: 数据返回
    BL-->>MW: 业务结果
    MW-->>API: 响应数据
    API-->>UI: 类型安全响应
    UI-->>C: 界面更新
```

### Schema 驱动的代码生成流程
```mermaid
graph LR
    A[Zod Schema 定义] --> B[类型生成]
    A --> C[Prisma Schema]
    A --> D[验证器生成]
    A --> E[Mock 数据]
    A --> F[OpenAPI 规范]
    
    B --> G[TypeScript 类型]
    C --> H[数据库迁移]
    D --> I[API 验证]
    E --> J[测试数据]
    F --> K[API 文档]
    
    G --> L[端到端类型安全]
    H --> L
    I --> L
    J --> L
    K --> L
```

---

## 🔌 插件系统架构

### 双层插件架构
```mermaid
graph TD
    subgraph "CLI 插件系统 (开发时)"
        CP[CLI 插件]
        CR[命令注册器]
        CM[配置合并器]
        PL[插件加载器]
    end
    
    subgraph "运行时插件系统 (规划中)"
        RP[运行时插件]
        MR[模块注册器]
        DI[依赖注入]
        EB[事件总线]
    end
    
    CP --> CR
    CP --> CM
    CR --> PL
    CM --> PL
    
    RP --> MR
    RP --> DI
    MR --> EB
    DI --> EB
    
    style RP fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style MR fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style DI fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style EB fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
```

### 插件通信机制
- **CLI 插件**: 命令注册、配置合并、插件发现
- **运行时插件**: 模块注册、服务注入、事件总线

---

## 🛡️ 安全架构

### 多层安全防护
```mermaid
graph TD
    A[客户端请求] --> B[API 网关]
    B --> C[认证中间件]
    C --> D[权限中间件]
    D --> E[验证中间件]
    E --> F[业务逻辑]
    F --> G[数据访问控制]
    G --> H[数据库]
    
    C --> I[JWT 验证]
    C --> J[会话管理]
    
    D --> K[RBAC 检查]
    D --> L[ABAC 检查]
    D --> M[资源权限]
    
    E --> N[Schema 验证]
    E --> O[输入清理]
    
    G --> P[行级安全]
    G --> Q[字段级过滤]
```

### 权限控制模型
- **操作级权限**: 控制用户可以执行的操作
- **字段级权限**: 控制用户可以访问的字段
- **行级权限**: 控制用户可以访问的数据行
- **多租户隔离**: 确保租户间数据隔离

---

## ⚠️ 循环依赖检查

### 当前状态: ✅ 无循环依赖

**检查结果**:
- ✅ 所有包依赖关系形成有向无环图 (DAG)
- ✅ 构建顺序明确，支持并行构建
- ✅ 类型推导链路清晰

### 潜在风险点
1. **core 包与 schema 包**
   - 风险: core 包包含基础类型定义，可能与 schema 包形成循环依赖
   - 解决方案: 严格限制 core 包只包含基础类型，复杂 schema 定义移至 schema 包

2. **console 包的企业级特性**
   - 风险: console 包可能重复实现 core 包的基础设施功能
   - 解决方案: console 包依赖 core 包的基础设施，专注于企业级管理功能

3. **ui 包与 trpc 包**
   - 风险: ui 可能需要直接使用 trpc 类型
   - 解决方案: 通过 core 包传递通用类型

4. **auth 包与 crud 包**
   - 风险: 双向依赖的可能性
   - 解决方案: auth 不依赖 crud，crud 依赖 auth 获取权限接口

5. **schema 包的中心化风险**
   - 风险: 过度依赖可能导致构建瓶颈
   - 解决方案: 保持 schema 包的轻量化

---

## 🎯 架构决策记录

### 已确定决策
- ✅ 废弃 @linch-kit/types 包，合并到 core
- ✅ auth 包不依赖 crud 包，避免循环依赖
- ✅ workflow 作为插件实现，不作为核心包
- ✅ AI 集成独立为 @linch-kit/ai 插件包
- ✅ 插件系统保持在 @linch-kit/core 内
- ✅ 企业级基础设施功能从 console 迁移到 core 包
- ✅ console 包重新定位为纯企业级管理平台
- ✅ 建立分层的企业级特性架构：基础设施(core) + 管理平台(console)

---

**重要提醒**: 本文档是 LinchKit 架构的核心设计，所有包的开发都必须严格遵循这里定义的架构原则、依赖关系和技术约束。
