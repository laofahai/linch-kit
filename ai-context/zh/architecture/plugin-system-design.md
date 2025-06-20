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
      }
    ]
  }
}
```

### 2. 钩子系统 (模块间通信)
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

### 3. 跨模块事务扩展 (基于 Prisma Interactive Transactions)
```typescript
// 使用 Prisma 现有的事务系统
import { PrismaClient } from '@prisma/client'
import * as cls from 'cls-hooked'

// 事务上下文管理 (基于 cls-hooked)
export class TransactionScope {
  private readonly prisma: PrismaClient
  private readonly transactionContext: cls.Namespace

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

// 跨模块事务使用示例
async function processOrder(orderData: OrderData) {
  const transactionScope = getTransactionScope()

  await transactionScope.run(async () => {
    // 所有模块操作自动在同一事务中执行
    await orderService.create(orderData)
    await inventoryService.deduct(orderData.items)
    await financeService.record(orderData.amount)
    await shippingService.create(orderData)
  })
}
```

---

**相关文档**:
- [系统架构详解](./system-architecture.md)
- [技术选型](../decisions/technology-choices.md)
- [架构决策记录](../decisions/architecture-decisions.md)
