# LinchKit 模块化架构设计

**版本**: v1.0  
**创建日期**: 2025-06-28  
**状态**: 🚀 架构确定，开始实施  

---

## 🏗️ 整体架构概览

### 架构层次
```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (Applications)                 │
├─────────────────────────────────────────────────────────┤
│  apps/starter        │  apps/demo-app   │  用户自定义应用  │
│  (生产级基础应用)      │  (功能演示)       │                 │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    模块层 (Modules)                      │
├─────────────────────────────────────────────────────────┤
│  modules/console     │  modules/crm     │  modules/cms    │
│  (管理控制台)        │  (客户管理)       │  (内容管理)      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    插件层 (Plugins)                      │
├─────────────────────────────────────────────────────────┤
│  plugins/analytics  │  plugins/auth    │  plugins/storage │
│  (数据分析)         │  (认证插件)       │  (文件存储)      │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                    包层 (Packages)                       │
├─────────────────────────────────────────────────────────┤
│  @linch-kit/core   │  @linch-kit/schema │  @linch-kit/ui │
│  @linch-kit/auth   │  @linch-kit/crud   │  @linch-kit/trpc│
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Console 模块设计 (主要模块)

### 定位与职责
- **定位**: 企业级管理控制台主模块，作为 npm 包独立发布
- **职责**: 提供多租户管理、用户管理、权限控制、插件市场、系统监控等核心功能
- **发布**: 独立 npm 包 `@linch-kit/console`
- **集成方式**: 不重复实现包功能，仅组合和扩展现有包

### 使用方式
```typescript
// 在 starter 或其他应用中
import { ConsoleModule } from '@linch-kit/console'

// 配置 Console 模块
const consoleConfig = {
  baseRoute: '/admin',
  features: ['tenant', 'user', 'plugin', 'monitoring'],
  permissions: {
    access: ['admin', 'super-admin']
  }
}

// 注册 Console 路由 (由 Console 提供)
app.use('/admin', ConsoleModule.createRoutes(consoleConfig))
```

### 功能范围
1. **多租户管理** - 租户生命周期、配额管理、计费
2. **用户权限管理** - 用户 CRUD、角色分配、权限控制
3. **插件市场** - 插件发现、安装、配置、生命周期管理
4. **系统监控** - 实时监控、告警、健康检查、审计日志
5. **Schema 管理** - 数据模型管理、代码生成

### 技术实现
- **Schema**: 使用 `@linch-kit/schema` 定义实体模型
- **数据操作**: 使用 `@linch-kit/crud` 进行数据 CRUD
- **API**: 使用 `@linch-kit/trpc` 提供类型安全 API
- **UI**: 使用 `@linch-kit/ui` 构建管理界面
- **权限**: 集成 `@linch-kit/auth` 的权限系统

---

## 🚀 Starter 应用集成模式

### Starter 职责
1. **基础设施**: 数据库连接、环境配置、部署配置
2. **布局系统**: 整体页面布局、导航结构、主题配置
3. **Prisma Schema**: 基于模块的 Schema 定义生成具体数据库结构
4. **路由集成**: 集成各模块提供的路由
5. **自定义扩展**: 业务特定的功能和页面

### 集成示例
```typescript
// apps/starter/src/app/layout.tsx
import { ConsoleModule } from '@linch-kit/console'
import { CRMModule } from '@linch-kit/crm' // 假设的其他模块

export default function RootLayout() {
  return (
    <html>
      <body>
        <MainLayout>
          <Sidebar>
            {/* Starter 定义的主导航 */}
            <NavItem href="/dashboard">仪表板</NavItem>
            
            {/* Console 模块导航 */}
            <NavSection title="系统管理">
              {ConsoleModule.getNavigationItems()}
            </NavSection>
            
            {/* 其他模块导航 */}
            <NavSection title="客户管理">
              {CRMModule.getNavigationItems()}
            </NavSection>
          </Sidebar>
          
          <MainContent>
            {children}
          </MainContent>
        </MainLayout>
      </body>
    </html>
  )
}

// apps/starter/src/app/admin/[...slug]/page.tsx
import { ConsoleModule } from '@linch-kit/console'

export default function AdminPage({ params }) {
  return <ConsoleModule.Router params={params} />
}
```

### Schema 生成流程
```bash
# 在 starter 应用中
# 1. 导入各模块的 Schema 定义
import { ConsoleEntities } from '@linch-kit/console/entities'
import { CRMEntities } from '@linch-kit/crm/entities'

# 2. 使用 Schema 生成器生成 Prisma schema
pnpm linch schema:generate --output=prisma/schema.prisma

# 3. 运行数据库迁移
pnpm prisma migrate dev

# 4. 生成 Prisma 客户端
pnpm prisma generate
```

---

## 🔌 插件化架构设计

### 插件分类
1. **功能插件** (`plugins/`目录) - 独立功能扩展
2. **模块插件** (`modules/`目录) - 完整业务模块
3. **UI插件** - 界面组件和主题扩展
4. **集成插件** - 第三方服务集成

### 插件标准接口
```typescript
// plugins/analytics/index.ts
export const AnalyticsPlugin = {
  id: 'analytics',
  name: '数据分析',
  version: '1.0.0',
  
  // 插件注册
  register: async (app: LinchKitApp) => {
    // 注册路由
    app.addRoutes('/analytics', analyticsRoutes)
    
    // 注册导航
    app.addNavigation({
      title: '数据分析',
      items: [
        { title: '报表', href: '/analytics/reports' },
        { title: '统计', href: '/analytics/stats' }
      ]
    })
    
    // 注册权限
    app.addPermissions([
      { action: 'read', subject: 'Analytics' },
      { action: 'manage', subject: 'Reports' }
    ])
  },
  
  // 插件配置 Schema
  configSchema: z.object({
    provider: z.enum(['google', 'baidu', 'custom']),
    apiKey: z.string(),
    trackingId: z.string()
  }),
  
  // 依赖声明
  dependencies: ['@linch-kit/core', '@linch-kit/auth'],
  
  // 生命周期钩子
  hooks: {
    onInstall: async (config) => { /* 安装逻辑 */ },
    onEnable: async (config) => { /* 启用逻辑 */ },
    onDisable: async () => { /* 禁用逻辑 */ },
    onUninstall: async () => { /* 卸载逻辑 */ }
  }
}
```

### 目录结构
```
linch-kit/
├── packages/           # 核心包
│   ├── core/
│   ├── schema/
│   ├── auth/
│   ├── crud/
│   ├── trpc/
│   └── ui/
├── modules/            # 业务模块 (作为 npm 包发布)
│   ├── console/        # 管理控制台 (主模块)
│   ├── crm/           # 客户关系管理
│   ├── cms/           # 内容管理系统
│   ├── ecommerce/     # 电商模块
│   └── hrm/           # 人力资源管理
├── plugins/           # 功能插件
│   ├── analytics/     # 数据分析插件
│   ├── storage/       # 文件存储插件
│   ├── payment/       # 支付插件
│   └── notification/  # 通知插件
└── apps/              # 应用实例
    ├── starter/       # 生产级基础应用
    └── demo-app/      # 功能演示应用
```

---

## 🔄 开发工作流程

### 模块开发流程
1. **Schema 定义** - 使用 `@linch-kit/schema` 定义数据模型
2. **服务层实现** - 使用 `@linch-kit/crud` 实现数据操作
3. **API 层实现** - 使用 `@linch-kit/trpc` 创建类型安全 API
4. **UI 层实现** - 使用 `@linch-kit/ui` 构建界面组件
5. **集成测试** - 在 starter 应用中测试模块功能
6. **打包发布** - 作为独立 npm 包发布

### 插件开发流程
1. **插件定义** - 实现标准插件接口
2. **功能实现** - 开发具体功能逻辑
3. **配置 Schema** - 定义插件配置项
4. **权限定义** - 声明插件所需权限
5. **生命周期实现** - 实现安装、启用、禁用等钩子
6. **文档编写** - 插件使用说明和 API 文档

### 应用开发流程
1. **基础搭建** - 基于 starter 创建新应用
2. **模块选择** - 安装需要的业务模块
3. **布局定制** - 自定义应用布局和主题
4. **功能扩展** - 开发应用特定功能
5. **插件集成** - 集成需要的功能插件
6. **部署配置** - 配置生产环境部署

---

## 📋 开发优先级

### Phase 1: Console 模块 (当前)
- ✅ Schema 定义完成
- 🚧 服务层实现 (当前任务)
- ⏳ API 层实现
- ⏳ UI 层实现
- ⏳ Starter 集成验证

### Phase 2: 插件系统完善
- ⏳ 插件注册和管理系统
- ⏳ 插件生命周期管理
- ⏳ 插件权限隔离
- ⏳ 插件市场界面

### Phase 3: 其他模块开发
- ⏳ CRM 模块
- ⏳ CMS 模块
- ⏳ 电商模块

### Phase 4: 功能插件开发
- ⏳ 数据分析插件
- ⏳ 文件存储插件
- ⏳ 支付插件
- ⏳ 通知插件

---

## 🎯 设计原则

1. **模块化** - 每个模块独立开发、测试、发布
2. **可插拔** - 应用可以选择性集成模块和插件
3. **类型安全** - 所有模块和插件都有完整的 TypeScript 类型
4. **权限隔离** - 模块和插件的权限严格隔离
5. **配置驱动** - 通过配置控制模块和插件的行为
6. **生产就绪** - 所有模块都支持企业级部署和扩展

这个架构设计确保了 LinchKit 的高度模块化和可扩展性，同时保持了开发和使用的简便性。