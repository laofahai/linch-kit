# LinchKit 完整架构设计文档

**版本**: v2.0.3  
**更新日期**: 2025-07-04  
**设计理念**: 分层使用模式 + 包功能完整性 + 灵活集成方案

## 🎯 架构核心理念

### 设计哲学

1. **包功能完整性**：每个包都是功能完整的独立库，可单独使用
2. **分层使用模式**：支持从开箱即用到完全自定义的多种使用方式
3. **职责清晰分离**：Starter（环境）+ Console（集成）+ Packages（功能）
4. **渐进式复杂度**：用户可根据需求选择合适的使用模式

### 三层使用模式

#### 🚀 **开箱即用模式**（Starter + Console）

```
目标用户: 需要快速上线的用户
使用方式: starter + console + 内置插件
定制程度: 配置文件 + 插件商店
开发工作量: 几乎零代码
适用场景: MVP、原型验证、标准化需求
```

#### 🛠️ **定制开发模式**（Starter + Console + 自定义功能）

```
目标用户: 有特定需求的开发者
使用方式: starter + console（基础功能）+ 自定义路由和组件
定制程度: 在 Console 基础上扩展自定义功能
开发工作量: 中等，复用 Console + 开发特定功能
适用场景: 企业应用、特定行业需求、混合式需求
```

#### ⚙️ **深度集成模式**（Pure Packages）

```
目标用户: 有现有系统的企业用户
使用方式: 直接在现有项目中集成 packages/*
定制程度: 完全控制
开发工作量: 较高，但灵活性最大
适用场景: 现有系统改造、微服务架构
```

## 📦 架构组件职责定义

### **Starter：轻量级应用启动器**

**职责边界**：

- ✅ 提供 Next.js 运行环境
- ✅ 加载和管理配置文件
- ✅ 提供基础路由框架
- ✅ 集成 Console 或自定义页面
- ✅ 环境变量管理
- ❌ 不包含具体业务逻辑
- ❌ 不包含 UI 组件实现
- ❌ 不包含数据处理逻辑

**文件结构**：

```
apps/starter/
├── app/
│   ├── layout.tsx              # 全局布局
│   ├── page.tsx               # 入口页面
│   ├── globals.css            # 全局样式
│   └── dashboard/
│       └── [[...slug]]/
│           └── page.tsx       # Console/自定义页面挂载点
├── components/                 # 最小化组件（Logo等）
├── linchkit.config.ts         # 【核心】应用配置
├── package.json               # 最小依赖集
└── .env.example               # 环境变量模板
```

**依赖策略**：

```json
{
  "dependencies": {
    "@linch-kit/core": "workspace:*",
    "@linch-kit/console": "workspace:*", // 可选，开箱即用模式需要
    "next": "^15.3.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

### **Console：企业级管理控制台集成器**

**职责边界**：

- ✅ 集成所有 packages 功能
- ✅ 提供完整的管理界面
- ✅ 实现插件管理系统
- ✅ 提供最佳实践示例
- ✅ 开箱即用的企业功能
- ❌ 不实现核心业务逻辑（调用 packages）
- ❌ 不限制用户使用方式
- ❌ 不强制依赖特定 UI

**核心特点**：

1. **完全基于 Packages 构建**：Console 自身不实现业务逻辑
2. **可选择性使用**：用户可以完全绕过 Console
3. **插件化架构**：支持功能扩展和替换
4. **配置驱动**：通过配置文件控制功能和外观

**文件结构**：

```
modules/console/
├── src/
│   ├── components/            # UI 集成组件
│   │   ├── dashboard/         # 仪表板集成
│   │   ├── user-management/   # 用户管理集成
│   │   ├── tenant-management/ # 租户管理集成
│   │   └── plugin-market/     # 插件市场
│   ├── routes/               # 路由配置和管理
│   ├── plugins/              # 内置插件
│   ├── hooks/                # 业务钩子
│   ├── providers/            # Context Providers
│   └── index.ts              # 主入口：LinchKitConsole
├── plugins/                  # 官方插件包
│   ├── user-management/
│   ├── tenant-management/
│   ├── analytics/
│   └── monitoring/
```

### **Packages：功能完整的独立库**

**设计原则**：

1. **完全独立**：每个包可以单独使用，不依赖其他 LinchKit 包（除 core）
2. **功能完整**：包含该领域的所有核心功能和 API
3. **文档齐全**：每个包都有独立的使用文档和示例
4. **测试覆盖**：高质量的测试保证包的稳定性

**包设计规范**：

#### **@linch-kit/core**

```typescript
// 基础设施包，其他包的依赖基础
{
  "功能": [
    "配置管理系统",
    "日志记录系统",
    "插件管理框架",
    "事件系统",
    "工具函数库"
  ],
  "独立性": "完全独立，无外部依赖",
  "API": "完整的配置、日志、插件接口"
}
```

#### **@linch-kit/auth**

```typescript
// 认证授权包
{
  "功能": [
    "多种认证方式（JWT、OAuth、SAML）",
    "RBAC/ABAC 权限引擎",
    "会话管理",
    "安全中间件"
  ],
  "依赖": "@linch-kit/core",
  "独立使用": "可集成到任何 Node.js/Next.js 项目"
}
```

#### **@linch-kit/platform**

```typescript
// 业务开发平台包 - 一体化解决方案
{
  "功能": [
    "Schema 定义和验证",
    "基于 Schema 的 CRUD 生成器",
    "类型安全的 API 路由",
    "查询构建器",
    "批量操作",
    "关联查询",
    "数据验证和转换",
    "事务管理"
  ],
  "依赖": "@linch-kit/core + @linch-kit/auth",
  "独立使用": "一体化业务开发平台"
}
```

#### **@linch-kit/ui**

```typescript
// UI 组件包
{
  "功能": [
    "基础 UI 组件库",
    "Schema 驱动的组件",
    "表单和表格组件",
    "主题系统"
  ],
  "依赖": "@linch-kit/core + @linch-kit/platform",
  "独立使用": "可用于任何 React 项目"
}
```

## 🔧 具体实现方案

### **1. 配置文件设计**

```typescript
// apps/starter/linchkit.config.ts
export interface LinchKitConfig {
  // 基础应用信息
  app: {
    name: string
    version: string
    description?: string
  }

  // 使用模式选择
  mode: 'console' | 'hybrid' | 'packages-only'

  // Console 配置（console 和 hybrid 模式都会使用）
  console?: {
    // 启用的功能模块
    features: Array<'user-management' | 'tenant-management' | 'analytics' | 'monitoring'>

    // 插件配置
    plugins: Array<{
      name: string
      version?: string
      config?: Record<string, unknown>
    }>

    // UI 定制
    customization: {
      logo?: string
      theme?: 'light' | 'dark' | 'auto'
      colors?: Record<string, string>
      layout?: 'sidebar' | 'topbar'
    }

    // 权限配置
    permissions?: {
      roles: Array<string>
      defaultRole: string
    }
  }

  // 混合模式配置（Console + 自定义功能）
  hybrid?: {
    // 自定义路由（会添加到 Console 路由中）
    customRoutes: Array<{
      path: string
      component: string
      name: string
      permissions?: string[]
    }>

    // 自定义导航项
    customNavigation?: Array<{
      label: string
      path: string
      icon?: string
      permissions?: string[]
    }>
  }

  // 纯包模式配置（不使用 Console）
  packagesOnly?: {
    routes: Record<string, string>
    components: Record<string, string>
  }

  // 数据库配置
  database: {
    provider: 'postgresql' | 'mysql' | 'sqlite'
    url: string
    migrations?: boolean
  }

  // 认证配置
  auth: {
    providers: Array<'credentials' | 'github' | 'google' | 'azure'>
    jwt: {
      secret: string
      expiresIn: string
    }
    session: {
      strategy: 'jwt' | 'database'
      maxAge: number
    }
  }

  // 环境配置
  env: 'development' | 'production' | 'test'

  // 调试配置
  debug: boolean
}

// 使用示例 1: 开箱即用模式
const consoleConfig: LinchKitConfig = {
  app: {
    name: 'My Enterprise App',
    version: '1.0.0',
  },

  mode: 'console',

  console: {
    features: ['user-management', 'tenant-management', 'analytics'],
    plugins: [
      { name: '@linch-kit/plugin-advanced-analytics', version: '^1.0.0' },
      { name: './plugins/custom-theme' },
    ],
    customization: {
      logo: './assets/company-logo.svg',
      theme: 'dark',
      colors: {
        primary: '#1e40af',
        secondary: '#64748b',
      },
    },
  },

  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },

  auth: {
    providers: ['credentials', 'github'],
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '7d',
    },
  },
}

// 使用示例 2: 混合开发模式（Console + 自定义功能）
const hybridConfig: LinchKitConfig = {
  app: {
    name: 'Custom Enterprise App',
    version: '1.0.0',
  },

  mode: 'hybrid',

  console: {
    // 使用 Console 的基础功能
    features: ['user-management', 'tenant-management'],
    customization: {
      logo: './assets/logo.svg',
      theme: 'light',
    },
  },

  hybrid: {
    // 添加自定义路由
    customRoutes: [
      {
        path: '/inventory',
        component: './components/inventory/InventoryPage',
        name: '库存管理',
        permissions: ['inventory:read'],
      },
      {
        path: '/reports/custom',
        component: './components/reports/CustomReports',
        name: '自定义报表',
      },
    ],

    // 自定义导航项
    customNavigation: [
      {
        label: '库存管理',
        path: '/inventory',
        icon: 'Package',
        permissions: ['inventory:read'],
      },
      {
        label: '业务报表',
        path: '/reports/custom',
        icon: 'BarChart',
      },
    ],
  },

  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },

  auth: {
    providers: ['credentials'],
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '7d',
    },
  },
}

export default hybridConfig
```

### **2. Console 集成架构**

```typescript
// modules/console/src/index.ts
export interface ConsoleProps {
  config: LinchKitConfig
  children?: React.ReactNode
}

export const LinchKitConsole: React.FC<ConsoleProps> = ({ config }) => {
  return (
    <ConsoleProvider config={config}>
      <PluginProvider plugins={config.console?.plugins}>
        <ThemeProvider theme={config.console?.customization?.theme}>
          <ConsoleLayout>
            <ConsoleRouter />
          </ConsoleLayout>
        </ThemeProvider>
      </PluginProvider>
    </ConsoleProvider>
  )
}

// Console 内部完全基于 packages 构建
import { createPlatformCRUD, defineEntity } from '@linch-kit/platform'
import { SchemaTable, SchemaForm } from '@linch-kit/ui'
import { useAuth, createAuthMiddleware } from '@linch-kit/auth'
import { Logger, PluginManager } from '@linch-kit/core'
```

### **3. 灵活使用示例**

#### **开箱即用模式**

```typescript
// apps/starter/app/dashboard/[[...slug]]/page.tsx
import { LinchKitConsole } from '@linch-kit/console'
import config from '@/linchkit.config'

export default function DashboardPage() {
  return <LinchKitConsole config={config} />
}
```

#### **混合开发模式（Console + 自定义功能）**

```typescript
// apps/starter/app/dashboard/[[...slug]]/page.tsx
import { LinchKitConsole } from '@linch-kit/console'
import config from '@/linchkit.config'

// Console 会自动加载自定义路由
export default function DashboardPage() {
  return <LinchKitConsole config={config} />
}

// apps/starter/components/inventory/InventoryPage.tsx
import { SchemaTable } from '@linch-kit/ui'
import { createPlatformCRUD } from '@linch-kit/platform'
import { InventorySchema } from '@/schemas/inventory'

const inventoryCRUD = createPlatformCRUD(InventorySchema, {
  permissions: ['inventory:read', 'inventory:write']
})

export default function InventoryPage() {
  const { data, isLoading } = inventoryCRUD.useList()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">库存管理</h1>
        <InventoryCreateButton />
      </div>

      <SchemaTable
        schema={InventorySchema}
        data={data}
        loading={isLoading}
        columns={['name', 'sku', 'quantity', 'status']}
        actions={[
          { label: '编辑', action: 'edit', permission: 'inventory:update' },
          { label: '删除', action: 'delete', permission: 'inventory:delete' }
        ]}
        customRenderers={{
          status: (value) => <StockStatusBadge status={value} />,
          quantity: (value) => <QuantityIndicator quantity={value} />
        }}
      />
    </div>
  )
}
```

#### **现有项目集成**

```typescript
// 现有项目中集成认证
import { createAuthMiddleware, useAuth } from '@linch-kit/auth'
import { Logger } from '@linch-kit/core'

// Express.js 集成示例
app.use('/api', createAuthMiddleware({
  providers: ['jwt'],
  secret: process.env.JWT_SECRET
}))

// React 组件中使用
function MyExistingComponent() {
  const { user, login, logout } = useAuth()

  return (
    <div>
      {user ? (
        <div>Welcome, {user.name}!</div>
      ) : (
        <LoginForm onSubmit={login} />
      )}
    </div>
  )
}
```

## 🔌 插件系统架构

### **插件接口定义**

```typescript
// @linch-kit/core/types/plugin.ts
export interface LinchKitPlugin {
  // 基础信息
  name: string
  version: string
  description?: string
  author?: string

  // 依赖声明
  dependencies?: Array<{
    name: string
    version: string
  }>

  // 组件覆盖/扩展
  components?: Record<string, React.ComponentType<any>>

  // 路由扩展
  routes?: Array<{
    path: string
    component: React.ComponentType
    permissions?: string[]
    layout?: 'default' | 'fullscreen' | 'minimal'
  }>

  // 服务扩展
  services?: Record<
    string,
    {
      create: (options: any) => any
      extend?: (existing: any) => any
    }
  >

  // API 扩展
  api?: {
    routes: Record<string, any>
    middleware?: Array<any>
  }

  // 生命周期钩子
  hooks?: {
    onInstall?: () => Promise<void>
    onUninstall?: () => Promise<void>
    onInit?: (context: LinchKitContext) => Promise<void>
    onAuth?: (user: User) => Promise<void>
    onError?: (error: Error) => void
  }

  // 配置模式
  config?: {
    schema: z.ZodSchema
    defaults: Record<string, any>
  }
}
```

### **内置插件生态**

```typescript
// 官方插件
const officialPlugins = [
  '@linch-kit/plugin-user-management', // 用户管理
  '@linch-kit/plugin-tenant-management', // 租户管理
  '@linch-kit/plugin-role-management', // 角色权限管理
  '@linch-kit/plugin-analytics', // 数据分析
  '@linch-kit/plugin-monitoring', // 系统监控
  '@linch-kit/plugin-audit-log', // 审计日志
  '@linch-kit/plugin-file-manager', // 文件管理
  '@linch-kit/plugin-notification', // 通知系统
  '@linch-kit/plugin-backup', // 数据备份
  '@linch-kit/plugin-import-export', // 数据导入导出
]

// 第三方插件示例
const thirdPartyPlugins = [
  '@company/linchkit-crm-integration', // CRM 集成
  '@team/custom-reporting', // 自定义报表
  'linchkit-payment-gateway', // 支付网关
]
```

### **插件开发示例**

```typescript
// plugins/custom-analytics/index.ts
export default {
  name: 'custom-analytics',
  version: '1.0.0',
  description: '自定义数据分析插件',

  components: {
    // 覆盖默认仪表板
    Dashboard: () => <CustomDashboard />,
    // 新增分析组件
    AdvancedChart: () => <AdvancedChartComponent />
  },

  routes: [
    {
      path: '/analytics',
      component: () => <AnalyticsPage />,
      permissions: ['analytics:view']
    },
    {
      path: '/reports',
      component: () => <ReportsPage />,
      permissions: ['reports:view']
    }
  ],

  services: {
    analytics: {
      create: (options) => new AnalyticsService(options),
      extend: (existing) => {
        return {
          ...existing,
          customMetrics: () => { /* 自定义指标 */ }
        }
      }
    }
  },

  api: {
    routes: {
      '/api/analytics': analyticsRouter,
      '/api/reports': reportsRouter
    }
  },

  hooks: {
    onInit: async (context) => {
      Logger.info('Analytics plugin initialized')
      // 初始化数据库表
      await initAnalyticsTables()
    }
  },

  config: {
    schema: z.object({
      provider: z.enum(['google-analytics', 'mixpanel', 'custom']),
      apiKey: z.string(),
      trackingId: z.string().optional()
    }),
    defaults: {
      provider: 'custom'
    }
  }
} satisfies LinchKitPlugin
```

## 📋 迁移实施计划

### **Phase 1: 包完整性验证**（1周）

1. 审核每个 package 的独立性和功能完整性
2. 补充缺失的 API 和文档
3. 确保每个包都可以独立使用
4. 编写独立使用示例

### **Phase 2: Console 重构**（2周）

1. 将 Console 重构为纯集成器
2. 移除 Console 中的业务逻辑实现
3. 基于 packages 重新构建 Console
4. 实现插件管理系统

### **Phase 3: Starter 精简**（1周）

1. 精简 Starter 到最小依赖
2. 实现配置文件系统
3. 支持多种使用模式
4. 创建使用示例

### **Phase 4: 插件生态**（2周）

1. 实现插件系统核心功能
2. 开发官方插件
3. 创建插件开发工具
4. 编写插件开发文档

### **Phase 5: 文档和测试**（1周）

1. 完善架构文档
2. 编写使用指南
3. 创建最佳实践示例
4. 补充测试覆盖

## 🎯 架构优势

### **用户视角**

1. **灵活选择**：可根据需求选择合适的使用模式
2. **渐进升级**：从开箱即用到完全自定义的平滑升级路径
3. **生态丰富**：官方插件 + 第三方插件 + 自定义插件
4. **学习成本低**：统一的 API 设计和文档

### **开发者视角**

1. **职责清晰**：每个组件的职责边界明确
2. **易于维护**：功能集中在对应的包中
3. **扩展性强**：插件系统支持无限扩展
4. **测试友好**：独立的包便于单元测试

### **企业视角**

1. **快速上线**：开箱即用模式支持快速 MVP
2. **定制灵活**：完全的定制开发能力
3. **投资保护**：可集成到现有系统
4. **生态支持**：丰富的插件生态系统

这个架构设计确保了 LinchKit 既能满足快速开发的需求，又保持了足够的灵活性和扩展性，为不同规模和需求的用户提供了合适的解决方案。
