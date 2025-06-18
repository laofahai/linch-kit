# 插件系统核心设计

## 🎯 设计目标

基于 Odoo 模块化架构理念，构建灵活的业务应用插件系统：

1. **模块化架构**: 应用模块和功能插件统一管理
2. **类型安全**: 插件接口完全类型化
3. **运行时加载**: 支持动态加载/卸载业务模块
4. **依赖管理**: 自动解析模块依赖关系
5. **生命周期**: 完整的插件生命周期管理
6. **配置驱动**: 通过配置文件管理模块组合
7. **扩展点系统**: 支持模块间的钩子通信

## 🏗️ 核心概念

### 模块 vs 插件
- **应用模块**: 完整的业务功能模块（如 WMS、CRM、HR）
- **功能插件**: 对现有模块的功能增强或扩展
- **统一接口**: 两者都实现相同的插件接口，便于统一管理

## 🏗️ 核心架构

### 插件接口设计

```typescript
// packages/plugin-system/src/types.ts
export interface Plugin {
  name: string
  version: string
  type: 'module' | 'plugin'  // 区分应用模块和功能插件

  // 依赖关系
  dependencies?: string[]     // 依赖的其他模块/插件
  extends?: string[]         // 扩展的模块（仅插件使用）

  // 生命周期钩子
  install?(context: PluginContext): Promise<void>
  activate?(context: PluginContext): Promise<void>
  deactivate?(context: PluginContext): Promise<void>
  uninstall?(context: PluginContext): Promise<void>

  // 提供的功能
  provides?: {
    models?: ModelDefinition[]      // 数据模型 (基于 @linch-kit/schema)
    views?: ViewDefinition[]        // UI 视图 (基于 @linch-kit/ui + @linch-kit/crud)
    apis?: APIDefinition[]          // API 接口 (基于 @linch-kit/trpc)
    permissions?: PermissionDefinition[] // 权限定义 (基于 @linch-kit/auth-core)
    workflows?: WorkflowDefinition[] // 工作流
    reports?: ReportDefinition[]    // 报表
    menus?: MenuDefinition[]        // 菜单项
  }

  // 同步钩子：用于数据处理和验证
  hooks?: {
    [hookName: string]: HookHandler
  }

  // 异步事件：用于业务流程通知
  events?: {
    [eventName: string]: EventHandler
  }

  // 配置 Schema
  configSchema?: ConfigSchema
}

export interface PluginContext {
  // 核心服务
  registry: PluginRegistry
  config: PluginConfig
  logger: Logger
  events: EventEmitter

  // 扩展点注册器
  registerModel: (model: ModelDefinition) => void
  registerView: (view: ViewDefinition) => void
  registerAPI: (api: APIDefinition) => void
  registerPermission: (permission: PermissionDefinition) => void
  registerHook: (name: string, handler: HookHandler) => void
  registerEvent: (name: string, handler: EventHandler) => void
  registerTransaction: (participant: TransactionParticipant) => void

  // 钩子调用器：同步，可以获取返回值和阻止执行
  callHook: (name: string, data: any) => Promise<any>

  // 事件发布器：异步，不关心返回值
  emit: (event: string, data: any) => Promise<void>

  // 事件监听器：注册事件处理器
  on: (event: string, handler: EventHandler) => void

  // 事务管理器
  transactionManager: TransactionManager
}

// 钩子处理器：同步数据处理
export type HookHandler = (data: any) => any | Promise<any>

// 事件处理器：异步业务流程
export type EventHandler = (data: any) => Promise<void>
```

## 📦 模块/插件包结构

### 应用模块结构
```
@linch-kit/module-wms/          # 完整的 WMS 业务模块
├── package.json
├── plugin.config.js            # 模块配置
├── src/
│   ├── index.ts                # 模块入口
│   ├── models/                 # 数据模型 (@linch-kit/schema)
│   │   ├── warehouse.ts
│   │   ├── inventory.ts
│   │   └── index.ts
│   ├── views/                  # UI 视图 (@linch-kit/ui + @linch-kit/crud)
│   │   ├── warehouse-list.tsx
│   │   ├── inventory-form.tsx
│   │   └── index.ts
│   ├── apis/                   # API 路由 (@linch-kit/trpc)
│   │   ├── warehouse.ts
│   │   ├── inventory.ts
│   │   └── index.ts
│   ├── permissions/            # 权限定义 (@linch-kit/auth-core)
│   │   └── index.ts
│   ├── hooks/                  # 钩子处理器
│   │   └── index.ts
│   └── services/               # 业务逻辑
│       └── index.ts
├── docs/
└── tests/
```

### 功能插件结构
```
@linch-kit/plugin-wms-barcode/  # WMS 条码扫描插件
├── package.json
├── plugin.config.js            # 插件配置
├── src/
│   ├── index.ts                # 插件入口
│   ├── components/             # 扩展组件
│   │   └── barcode-scanner.tsx
│   ├── hooks/                  # 钩子处理器
│   │   └── scan-hooks.ts
│   └── services/               # 扩展服务
│       └── barcode-service.ts
└── tests/
```

## 🔧 插件注册机制

```typescript
// packages/plugin-system/src/registry.ts
export class PluginRegistry {
  private plugins = new Map<string, Plugin>()
  private loadOrder: string[] = []
  
  async register(plugin: Plugin): Promise<void> {
    // 依赖检查
    await this.checkDependencies(plugin)
    
    // 注册插件
    this.plugins.set(plugin.name, plugin)
    
    // 计算加载顺序
    this.calculateLoadOrder()
  }
  
  async load(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) throw new Error(`Plugin ${pluginName} not found`)
    
    // 执行生命周期
    await plugin.install?.(this.createContext(plugin))
    await plugin.activate?.(this.createContext(plugin))
  }
}
```

## 🎛️ 配置系统集成

```javascript
// linch-kit.config.js - 基于现有配置系统扩展
export default {
  // 启用的模块和插件
  modules: [
    '@linch-kit/module-wms',
    '@linch-kit/module-crm',
    '@linch-kit/plugin-wms-barcode',
    '@linch-kit/plugin-multi-company'
  ],

  // 模块配置
  moduleConfigs: {
    '@linch-kit/module-wms': {
      enabled: true,
      config: {
        warehouseCount: 5,
        features: ['inventory', 'shipping']
      }
    },
    '@linch-kit/module-crm': {
      enabled: false
    },
    '@linch-kit/plugin-wms-barcode': {
      enabled: true,
      config: {
        scannerType: 'zebra',
        autoScan: true
      }
    }
  },

  // 模块加载顺序（自动解析依赖关系）
  moduleOrder: [
    '@linch-kit/module-auth',      // 基础认证模块
    '@linch-kit/module-wms',       // WMS 业务模块
    '@linch-kit/plugin-wms-barcode' // WMS 扩展插件
  ],

  // 集成现有配置
  auth: {
    // auth-core 配置
  },
  database: {
    // 数据库配置
  },
  schema: {
    // schema 配置
  }
}
```

## 🔌 扩展点设计

### 1. 数据模型扩展 (基于 @linch-kit/schema)
```typescript
// 模块定义数据模型
export const WMSModule: Plugin = {
  name: '@linch-kit/module-wms',
  type: 'module',
  provides: {
    models: [
      {
        name: 'Warehouse',
        definition: defineEntity('Warehouse', {
          id: primary(z.string().uuid()),
          name: z.string(),
          location: z.string(),
          capacity: z.number().optional(),
          createdAt: createdAt(),
          updatedAt: updatedAt()
        })
      },
      {
        name: 'Inventory',
        definition: defineEntity('Inventory', {
          id: primary(z.string().uuid()),
          warehouseId: z.string().uuid(),
          productId: z.string().uuid(),
          quantity: z.number(),
          // 关联关系
          warehouse: relation('Warehouse'),
          product: relation('Product')
        })
      }
    ]
  }
}
```

### 2. API 扩展 (基于 @linch-kit/trpc)
```typescript
// 模块注册 tRPC 路由
export const WMSModule: Plugin = {
  provides: {
    apis: [
      {
        name: 'warehouse',
        router: warehouseRouter // tRPC 路由定义
      },
      {
        name: 'inventory',
        router: inventoryRouter
      }
    ]
  }
}

// 具体的 tRPC 路由实现
const warehouseRouter = trpcRouter({
  list: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      // 查询仓库列表
    }),

  create: protectedProcedure
    .input(WarehouseCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // 创建仓库
    })
})
```

### 3. UI 视图扩展 (基于 @linch-kit/ui + @linch-kit/crud)
```typescript
// 模块注册 UI 视图
export const WMSModule: Plugin = {
  provides: {
    views: [
      {
        name: 'WarehouseList',
        type: 'list',
        component: WarehouseListView,
        route: '/warehouses',
        permissions: ['warehouse.read']
      },
      {
        name: 'WarehouseForm',
        type: 'form',
        component: WarehouseFormView,
        route: '/warehouses/new',
        permissions: ['warehouse.create']
      },
      {
        name: 'WarehouseDashboard',
        type: 'widget',
        component: WarehouseDashboardWidget,
        slot: 'dashboard',
        permissions: ['warehouse.read']
      }
    ]
  }
}
```

### 4. 权限扩展 (基于 @linch-kit/auth-core)
```typescript
// 模块定义权限
export const WMSModule: Plugin = {
  provides: {
    permissions: [
      {
        resource: 'warehouse',
        actions: ['create', 'read', 'update', 'delete'],
        description: '仓库管理权限'
      },
      {
        resource: 'inventory',
        actions: ['create', 'read', 'update', 'delete', 'transfer'],
        description: '库存管理权限'
      }
    ]
  }
}
```

### 5. 钩子系统 (模块间通信)
```typescript
// 模块定义钩子处理器
export const WMSModule: Plugin = {
  hooks: {
    // 库存变更钩子
    'inventory.changed': async (data: InventoryChangeData) => {
      // 处理库存变更事件
      await updateWarehouseCapacity(data.warehouseId)
    },

    // 订单创建钩子 (来自其他模块)
    'order.created': async (order: Order) => {
      // 自动分配库存
      await allocateInventory(order)
    }
  }
}

// 插件扩展现有模块的钩子
export const BarcodePlugin: Plugin = {
  name: '@linch-kit/plugin-wms-barcode',
  type: 'plugin',
  extends: ['@linch-kit/module-wms'],
  hooks: {
    // 扩展库存扫描功能
    'inventory.scan': async (barcode: string) => {
      const product = await scanBarcode(barcode)
      return product
    }
  }
}
```

### 6. 跨模块事务扩展 (基于 Prisma Interactive Transactions)
```typescript
// 使用 Prisma 现有的事务系统，无需自定义 TransactionManager
import { PrismaClient } from '@prisma/client'
import * as cls from 'cls-hooked'

// 事务上下文管理 (基于 cls-hooked)
export class TransactionScope {
  private readonly prisma: PrismaClient
  private readonly transactionContext: cls.Namespace

  constructor(prisma: PrismaClient, transactionContext: cls.Namespace) {
    this.prisma = prisma
    this.transactionContext = transactionContext
  }

  async run(fn: () => Promise<void>): Promise<void> {
    // 检查是否已在事务中
    const existingTx = this.transactionContext.get('PRISMA_TX')

    if (existingTx) {
      // 已在事务中，直接执行
      await fn()
    } else {
      // 创建新的 Prisma 事务
      await this.prisma.$transaction(async (tx) => {
        await this.transactionContext.runPromise(async () => {
          // 将事务客户端存储在 CLS 中
          this.transactionContext.set('PRISMA_TX', tx)

          try {
            await fn()
          } finally {
            // 清理事务上下文
            this.transactionContext.set('PRISMA_TX', null)
          }
        })
      })
    }
  }
}

// 获取当前事务客户端
export function getCurrentTransaction(): PrismaClient | null {
  const namespace = cls.getNamespace('transaction')
  return namespace?.get('PRISMA_TX') || null
}

// 模块方法支持事务传播
export const WMSModule: Plugin = {
  provides: {
    services: [
      {
        name: 'InventoryService',
        methods: {
          async deductInventory(items: InventoryItem[]) {
            // 自动获取当前事务客户端，如果没有则使用默认客户端
            const prisma = getCurrentTransaction() || defaultPrisma

            return await prisma.inventory.updateMany({
              // 库存扣减逻辑
            })
          }
        }
      }
    ]
  }
}

// 跨模块事务使用示例 (使用 Prisma Interactive Transactions)
async function processOrder(orderData: OrderData) {
  const transactionScope = getTransactionScope()

  await transactionScope.run(async () => {
    // 所有模块操作自动在同一事务中执行

    // 1. 订单模块：创建订单
    await orderService.create(orderData)

    // 2. 库存模块：扣减库存
    await inventoryService.deduct(orderData.items)

    // 3. 财务模块：记录应收
    await financeService.record(orderData.amount)

    // 4. 物流模块：创建发货单
    await shippingService.create(orderData)

    // Prisma 自动处理提交/回滚
  })
}

// 或者直接使用 Prisma 的 Interactive Transactions
async function processOrderDirect(orderData: OrderData) {
  await prisma.$transaction(async (tx) => {
    // 将事务客户端传递给各个模块
    await orderService.create(orderData, tx)
    await inventoryService.deduct(orderData.items, tx)
    await financeService.record(orderData.amount, tx)
    await shippingService.create(orderData, tx)
  })
}
```

## 🔗 技术栈集成

### 包依赖关系
```
@linch-kit/plugin-system     # 插件系统核心 (独立包)
├── 依赖: @linch-kit/core    # 基础设施 (配置、CLI、工具)
├── 集成: @linch-kit/schema  # 数据模型系统
├── 集成: @linch-kit/trpc    # API 层 (独立包)
├── 集成: @linch-kit/auth-core # 权限系统
├── 集成: @linch-kit/ui      # UI 组件库
├── 集成: @linch-kit/crud    # 通用视图 (待创建)
└── 集成: Prisma Client      # 数据库事务支持
```

### 应用启动流程
```typescript
// 应用启动时的插件加载流程
async function startApplication() {
  // 1. 初始化核心系统
  const core = await initializeCore()

  // 2. 加载插件系统
  const pluginSystem = await initializePluginSystem(core)

  // 3. 发现和验证模块/插件
  const modules = await pluginSystem.discoverModules()

  // 4. 解析依赖关系
  const sortedModules = await pluginSystem.resolveDependencies(modules)

  // 5. 按顺序安装和激活模块
  for (const module of sortedModules) {
    await pluginSystem.installModule(module)
    await pluginSystem.activateModule(module)
  }

  // 6. 合并所有模块的扩展点
  await pluginSystem.mergeExtensions()

  // 7. 初始化事务管理器
  const transactionManager = await initializeTransactionManager()
  await pluginSystem.registerTransactionParticipants(transactionManager)

  // 8. 启动应用服务
  await startApplicationServices()
}
```

## 🔑 关键问题解决方案

### 1. 模块发现机制
- **扩展现有 CLI 插件发现**：复用 `packages/core` 中的插件发现逻辑
- **支持多种发现方式**：node_modules 扫描、配置文件、本地目录
- **模块验证**：检查模块接口、依赖关系、版本兼容性

### 2. 数据隔离和共享
- **Schema 合并**：各模块的 Schema 自动合并到统一的 Prisma Schema
- **命名空间**：模块数据表使用前缀避免冲突
- **关联关系**：支持跨模块的数据关联

### 3. 权限系统 (基于 @linch-kit/auth-core)
- **模块化权限**：每个模块定义自己的权限资源和操作
- **权限合并**：系统启动时合并所有模块的权限定义
- **tRPC 集成**：权限检查集成到 tRPC 中间件

### 4. UI 组合 (基于 @linch-kit/ui + @linch-kit/crud)
- **视图注册**：模块注册自己的页面和组件
- **路由合并**：动态生成应用路由
- **组件插槽**：支持组件扩展和替换

### 5. 跨模块事务管理 ⭐ **关键特性**
- **两阶段提交 (2PC)**：实现分布式事务的标准协议
- **事务协调器**：统一管理跨模块事务的生命周期
- **补偿事务 (Saga)**：长事务的补偿机制
- **事务钩子**：模块注册事务参与者和回调
- **数据库事务**：基于 Prisma 的数据库事务支持
- **失败恢复**：事务失败时的自动重试和恢复机制

#### 事务实现策略
1. **数据库级事务**：单数据库内的 ACID 事务
2. **应用级事务**：跨模块的业务事务协调
3. **补偿事务**：长时间运行的业务流程事务
4. **事件驱动**：基于事件的最终一致性

## 🔄 生命周期管理

```typescript
export class PluginLifecycle {
  async installPlugin(plugin: Plugin): Promise<void> {
    // 1. 验证插件
    await this.validatePlugin(plugin)
    
    // 2. 安装依赖
    await this.installDependencies(plugin)
    
    // 3. 运行安装钩子
    await plugin.install?.(this.context)
    
    // 4. 注册到系统
    await this.registry.register(plugin)
  }
  
  async activatePlugin(pluginName: string): Promise<void> {
    const plugin = this.registry.get(pluginName)
    
    // 1. 激活依赖
    await this.activateDependencies(plugin)
    
    // 2. 运行激活钩子
    await plugin.activate?.(this.context)
    
    // 3. 注册扩展点
    await this.registerExtensions(plugin)
  }
}
```

## 📊 插件发现机制

```typescript
// packages/cli/src/commands/plugin.ts
export class PluginDiscovery {
  async discoverPlugins(): Promise<Plugin[]> {
    const plugins: Plugin[] = []
    
    // 1. 扫描 node_modules 中的插件
    const nodeModulesPlugins = await this.scanNodeModules()
    plugins.push(...nodeModulesPlugins)
    
    // 2. 扫描本地插件目录
    const localPlugins = await this.scanLocalPlugins()
    plugins.push(...localPlugins)
    
    // 3. 从配置文件读取
    const configPlugins = await this.loadFromConfig()
    plugins.push(...configPlugins)
    
    return plugins
  }
}
```

## 🛡️ 安全和隔离

```typescript
export class PluginSandbox {
  createSandbox(plugin: Plugin): PluginContext {
    return {
      // 限制插件访问权限
      app: this.createRestrictedApp(),
      config: this.getPluginConfig(plugin.name),
      logger: this.createPluginLogger(plugin.name),
      events: this.createPluginEventBus(plugin.name)
    }
  }
  
  private createRestrictedApp() {
    // 只暴露插件需要的 API
    return {
      registerRoute: this.registerRoute.bind(this),
      registerComponent: this.registerComponent.bind(this),
      // 不暴露敏感的系统 API
    }
  }
}
```

## 🔧 开发工具

```typescript
// packages/plugin-system/src/dev-tools.ts
export class PluginDevTools {
  async createPlugin(name: string): Promise<void> {
    // 生成插件模板
    await this.generateTemplate(name)
  }
  
  async validatePlugin(pluginPath: string): Promise<ValidationResult> {
    // 验证插件结构和配置
    return await this.validator.validate(pluginPath)
  }
  
  async testPlugin(pluginPath: string): Promise<TestResult> {
    // 在沙箱环境中测试插件
    return await this.tester.test(pluginPath)
  }
}
```

## 🔑 关键设计原则

### 1. 少重复造轮子 ⭐ **核心原则**
- **优先使用现有成熟方案**：如 Prisma 事务系统、cls-hooked、NextAuth.js 等
- **避免重新实现已有功能**：充分利用生态系统中的优秀工具
- **谨慎评估自研需求**：只有在现有方案无法满足需求时才考虑自研
- **集成而非替代**：通过适配器模式集成现有方案
- **示例**：使用 Prisma Interactive Transactions 而非自研 TransactionManager

### 2. AI-First 设计
- 所有接口和配置都便于 AI 理解
- 完整的类型定义和文档注释
- 标准化的命名和结构

### 3. 类型安全
- 完整的 TypeScript 支持
- 编译时类型检查
- 运行时类型验证

### 4. 灵活性优先
- 支持多种扩展方式
- 最小化强制约束
- 向后兼容性考虑

## 📈 性能考虑

1. **懒加载**: 插件按需加载，不影响启动性能
2. **代码分割**: 插件代码独立打包
3. **缓存机制**: 插件元数据和依赖关系缓存
4. **并行加载**: 无依赖关系的插件并行加载

## 🚀 实施优先级

### 第一阶段：基础设施完善
1. **确定 tRPC 位置**：保持 `@linch-kit/trpc` 独立包 ✅
2. **完善权限系统**：调整 `@linch-kit/auth-core` 支持模块化权限
3. **创建 CRUD 包**：实现 `@linch-kit/crud` 通用视图组件
4. **事务管理设计**：设计跨模块事务管理机制

### 第二阶段：插件系统核心
1. **创建插件系统包**：`@linch-kit/plugin-system`
2. **实现核心功能**：插件注册、生命周期、扩展点
3. **事务管理器**：实现分布式事务协调器
4. **集成现有系统**：与 schema、auth、ui、事务系统集成

### 第三阶段：开发工具和优化
1. **CLI 集成**：插件管理命令
2. **开发工具**：插件脚手架、验证、测试
3. **性能优化**：懒加载、缓存、并行处理

## 🔮 未来扩展

1. **插件市场**: 在线插件商店
2. **版本管理**: 插件版本兼容性检查
3. **热更新**: 开发环境下的插件热更新
4. **监控**: 插件性能和错误监控
5. **多租户**: 租户级别的模块启用/禁用
6. **国际化**: 模块级别的多语言支持
