# LinchKit Extension System 统一架构

**版本**: v2.0.3 - 整合文档  
**更新**: 2025-07-11  
**状态**: 统一Extension系统架构设计文档

## 🎯 Extension系统概述

LinchKit Extension 系统是一个基于插件架构的可扩展框架，允许开发者创建可复用的功能模块，动态扩展应用的核心能力。

### 设计原则

- **松耦合**: Extension之间通过标准化接口通信，避免直接依赖
- **高内聚**: 每个Extension封装完整的功能域，包括UI、业务逻辑和数据
- **生命周期管理**: 完整的加载、激活、运行、停止生命周期
- **权限控制**: 基于CASL的细粒度权限管理
- **性能优化**: 延迟加载、缓存、批量通信等性能优化策略

### 核心特性

- **🔄 完整生命周期管理**: 动态加载、卸载、热重载
- **🔒 安全权限验证**: 运行时权限检查和沙箱隔离
- **📊 状态监控**: 性能指标收集和健康状态检查
- **🔥 热重载支持**: 开发时自动重载和缓存清理
- **🛡️ 沙箱执行**: VM2隔离执行环境（可选）

## 🏗️ 架构层次

### L0: Extension Runtime (Extension运行时)

```
@linch-kit/core/extension/
├── manager.ts                # Extension管理器
├── types.ts                 # 类型定义
├── enhanced-plugin.ts       # 增强插件系统
├── permission-manager.ts    # 权限管理
├── state-manager.ts         # 状态管理
├── hot-reload.ts           # 热重载
├── sandbox.ts              # 沙箱环境
└── performance-optimizations.ts  # 性能优化
```

**职责**:

- Extension生命周期管理
- 权限控制和沙箱环境
- Extension间通信
- 性能监控和优化

### L1: Extension Definition (Extension定义)

```typescript
interface Extension extends Plugin {
  metadata: ExtensionMetadata
  defaultConfig?: ExtensionConfig

  // 生命周期钩子
  init?(config: ExtensionConfig): Promise<void> | void
  setup?(config: ExtensionConfig): Promise<void> | void
  teardown?(): Promise<void> | void

  // 权限声明
  permissions: ExtensionPermissions

  // UI组件
  components?: ExtensionComponents

  // API端点
  apis?: ExtensionApis
}
```

## 🔧 核心组件详解

### 1. ExtensionManager - 生命周期管理

Extension管理器是整个系统的核心，负责Extension的完整生命周期管理。

```typescript
// 核心功能
class ExtensionManager {
  async loadExtension(extensionName: string): Promise<ExtensionLoadResult>
  async unloadExtension(extensionName: string): Promise<boolean>
  async reloadExtension(extensionName: string): Promise<ExtensionLoadResult>
  getExtension(extensionName: string): ExtensionInstance | undefined
  getAllExtensions(): ExtensionInstance[]
}

// 生命周期状态
type ExtensionStatus =
  | 'loading'
  | 'loaded'
  | 'initializing'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed'
```

### 2. PermissionManager - 权限管理

```typescript
class PermissionManager {
  validatePermissions(extension: Extension, operation: string): boolean
  grantPermissions(extensionName: string, permissions: string[]): void
  revokePermissions(extensionName: string, permissions: string[]): void
  getPermissions(extensionName: string): string[]
}
```

### 3. StateManager - 状态监控

```typescript
class StateManager {
  getExtensionState(extensionName: string): ExtensionState
  getHealthStatus(extensionName: string): HealthStatus
  getPerformanceMetrics(extensionName: string): PerformanceMetrics
}
```

### 4. HotReloadManager - 热重载

```typescript
class HotReloadManager {
  enableHotReload(extensionName: string): void
  disableHotReload(extensionName: string): void
  reloadExtension(extensionName: string): Promise<void>
  clearCache(extensionName: string): void
}
```

## 🛡️ 安全架构

### 权限系统

Extension系统使用CASL进行权限管理，支持细粒度的权限控制：

```typescript
interface ExtensionPermissions {
  // 数据访问权限
  data: {
    read: string[] // 可读取的数据源
    write: string[] // 可写入的数据源
    delete: string[] // 可删除的数据源
  }

  // API访问权限
  api: {
    internal: string[] // 内部API权限
    external: string[] // 外部API权限
  }

  // UI渲染权限
  ui: {
    routes: string[] // 可访问的路由
    components: string[] // 可使用的组件
  }
}
```

### 沙箱环境

使用VM2提供隔离的JavaScript执行环境：

```typescript
class SandboxManager {
  createSandbox(extensionName: string): VM2Sandbox
  destroySandbox(extensionName: string): void
  executeInSandbox(extensionName: string, code: string): any
}
```

## 📊 性能优化

### 延迟加载

```typescript
// Extension按需加载
const extensionLoader = {
  async loadWhenNeeded(extensionName: string): Promise<Extension> {
    // 检查是否已加载
    if (this.isLoaded(extensionName)) {
      return this.getExtension(extensionName)
    }

    // 动态导入
    const module = await import(`./extensions/${extensionName}`)
    return this.registerExtension(module.default)
  },
}
```

### 缓存策略

```typescript
class ExtensionCache {
  private cache = new Map<string, ExtensionInstance>()

  get(extensionName: string): ExtensionInstance | undefined
  set(extensionName: string, extension: ExtensionInstance): void
  clear(extensionName?: string): void

  // 缓存清理策略
  cleanup(): void {
    // 清理未使用的Extension实例
  }
}
```

## 🔄 Extension开发流程

### 1. 创建Extension

```typescript
// extensions/my-extension/index.ts
import { defineExtension } from '@linch-kit/core/extension'

export default defineExtension({
  name: 'my-extension',
  version: '1.0.0',

  metadata: {
    displayName: '我的扩展',
    description: '示例扩展',
    author: 'Developer',
  },

  permissions: {
    data: { read: ['users'], write: [] },
    api: { internal: ['user-management'] },
    ui: { routes: ['/my-extension'] },
  },

  async init(config) {
    // 初始化逻辑
  },

  async setup(config) {
    // 设置逻辑
  },

  components: {
    'my-component': () => import('./components/MyComponent'),
  },

  apis: {
    'get-data': async params => {
      // API实现
    },
  },
})
```

### 2. 注册Extension

```typescript
// 在应用启动时注册
import { extensionManager } from '@linch-kit/core/extension'
import myExtension from './extensions/my-extension'

await extensionManager.registerExtension(myExtension)
```

### 3. 使用Extension

```typescript
// 在组件中使用Extension
import { useExtension } from '@linch-kit/core/extension'

function MyComponent() {
  const extension = useExtension('my-extension')

  if (!extension) {
    return <div>Extension not loaded</div>
  }

  return <extension.components.MyComponent />
}
```

## 🎯 未来规划

### Phase 2: 高级特性

- **Extension市场**: 支持Extension的发布、安装和更新
- **版本管理**: Extension版本兼容性和迁移
- **监控和分析**: 更详细的性能监控和使用分析
- **A/B测试**: 支持Extension的A/B测试功能

### Phase 3: 生态系统

- **第三方Extension**: 支持社区开发的Extension
- **Extension模板**: 提供标准化的Extension开发模板
- **开发工具**: Extension开发和调试工具链
- **文档和教程**: 完善的Extension开发文档

## 🚀 最佳实践

### Extension设计原则

1. **单一职责**: 每个Extension只处理一个特定的功能域
2. **向后兼容**: 确保Extension升级不会破坏现有功能
3. **错误处理**: 完善的错误处理和恢复机制
4. **性能考虑**: 避免阻塞主线程，合理使用资源
5. **用户体验**: 提供清晰的加载状态和错误提示

### 开发建议

1. **模块化设计**: 将Extension拆分为多个小模块
2. **测试覆盖**: 确保Extension有完整的测试覆盖
3. **文档完整**: 提供详细的使用文档和API说明
4. **性能优化**: 使用懒加载和缓存策略
5. **安全考虑**: 仔细设计权限需求，遵循最小权限原则

---

**维护者**: Claude AI  
**协商伙伴**: Gemini  
**统一来源**: 本文档整合了08_Extension_Architecture.md和09_Extension_System.md的内容
