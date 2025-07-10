# LinchKit Extension System Architecture

**版本**: v2.0  
**更新时间**: 2025-07-09  
**状态**: ✅ Phase 1 完成 - 生命周期管理和权限验证系统

## 🎯 系统概述

LinchKit Extension System 是一个完整的插件化扩展系统，基于现有的Plugin架构扩展而来，提供了安全的运行时环境、细粒度的权限管理和完整的生命周期控制。

### 核心特性

- **🔄 完整生命周期管理**: 动态加载、卸载、热重载
- **🔒 安全权限验证**: 运行时权限检查和沙箱隔离
- **📊 状态监控**: 性能指标收集和健康状态检查
- **🔥 热重载支持**: 开发时自动重载和缓存清理
- **🛡️ 沙箱执行**: VM2隔离执行环境（可选）

## 📁 核心组件架构

```
packages/core/src/extension/
├── types.ts                  # Extension类型定义
├── manager.ts                # Extension管理器
├── hot-reload.ts             # 热重载管理
├── state-manager.ts          # 状态监控管理
├── permission-manager.ts     # 权限管理系统
├── sandbox.ts                # 沙箱执行环境
├── enhanced-plugin.ts        # Plugin系统扩展
└── index.ts                  # 统一导出
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
  | 'registered'
  | 'loading'
  | 'loaded'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error'
```

**关键特性:**

- 自动manifest加载和验证
- 权限授权集成
- Plugin系统兼容
- 完整的错误处理和状态管理

### 2. ExtensionPermissionManager - 权限管理

细粒度的权限管理系统，支持策略配置、运行时检查和权限审计。

```typescript
// 权限类型
type ExtensionPermission =
  | 'database:read'
  | 'database:write'
  | 'api:read'
  | 'api:write'
  | 'ui:render'
  | 'system:hooks'
  | string

// 权限策略
interface PermissionPolicy {
  name: ExtensionPermission
  description: string
  level: 'low' | 'medium' | 'high' | 'critical'
  requiresUserConfirmation: boolean
  dependencies?: ExtensionPermission[]
  validator?: (context: PermissionContext) => Promise<boolean>
}
```

**核心功能:**

- 权限策略注册和管理
- 运行时权限检查和缓存
- 权限授权和撤销
- 权限依赖检查
- 使用统计和审计

### 3. ExtensionSandbox - 沙箱执行

安全的代码执行环境，支持VM2隔离和资源限制。

```typescript
interface SandboxConfig {
  enabled: boolean
  timeout: number
  memoryLimit: number
  allowedModules: string[]
  blockedGlobals: string[]
  allowNetworkAccess: boolean
  allowFileSystemAccess: boolean
}
```

**安全特性:**

- VM2虚拟机隔离（可选）
- 受限的全局变量访问
- 网络和文件系统访问控制
- 超时和内存限制
- 执行历史追踪

### 4. HotReloadManager - 热重载

开发时的自动重载系统，支持文件监听和批量重载。

```typescript
class HotReloadManager {
  enableForExtension(extensionName: string): void
  disableForExtension(extensionName: string): void
  private async reloadExtension(extensionName: string): Promise<void>
  private async clearModuleCache(extensionName: string): Promise<void>
}
```

**特性:**

- 文件变化监听（chokidar）
- 防抖处理避免频繁重载
- 模块缓存清理
- 重载队列管理

### 5. ExtensionStateManager - 状态监控

Extension运行状态监控和健康检查系统。

```typescript
interface ExtensionMetrics {
  initializationTime: number
  startupTime: number
  memoryUsage: number
  cpuUsage: number
  activeConnections: number
  requestCount: number
  errorCount: number
  lastActivity: number
}

interface ExtensionHealth {
  score: number // 0-100
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  checks: HealthCheck[]
  lastCheckTime: number
}
```

**监控功能:**

- 性能指标自动收集
- 健康状态评估
- 周期性健康检查
- 状态变更事件通知

## 🚀 Extension开发流程

### 1. Extension结构

```
extensions/my-extension/
├── package.json          # Extension manifest
├── src/
│   ├── index.ts          # 主入口
│   ├── schema.ts         # 数据模型（可选）
│   ├── api.ts           # API路由（可选）
│   ├── components.tsx    # UI组件（可选）
│   └── hooks.ts         # 系统钩子（可选）
├── tests/
└── README.md
```

### 2. package.json配置

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "linchkit": {
    "displayName": "My Extension",
    "capabilities": {
      "hasUI": true,
      "hasAPI": true,
      "hasSchema": true,
      "hasHooks": false
    },
    "permissions": ["database:read", "database:write", "ui:render"],
    "entries": {
      "api": "api.ts",
      "schema": "schema.ts",
      "components": "components.tsx"
    }
  }
}
```

### 3. Extension实现

```typescript
// src/index.ts
import type { Extension } from '@linch-kit/core'

const myExtension: Extension = {
  metadata: {
    id: 'my-extension',
    name: 'My Extension',
    version: '1.0.0',
    displayName: 'My Extension',
    capabilities: {
      hasUI: true,
      hasAPI: true,
      hasSchema: true,
    },
    permissions: ['database:read', 'database:write', 'ui:render'],
  },

  async init(config) {
    console.log('Extension initialized:', config)
  },

  async start(config) {
    console.log('Extension started:', config)
  },

  async stop(config) {
    console.log('Extension stopped:', config)
  },

  async destroy(config) {
    console.log('Extension destroyed:', config)
  },
}

export default myExtension
```

## 🔐 权限和安全

### 权限级别

- **low**: 基础只读操作（如UI渲染、API读取）
- **medium**: 标准操作（如数据库读取）
- **high**: 敏感操作（如数据库写入、API写入）
- **critical**: 系统级操作（如系统钩子）

### 安全隔离

1. **沙箱执行**: VM2虚拟机隔离（可选）
2. **权限检查**: 运行时权限验证
3. **资源限制**: 内存、CPU、超时限制
4. **API控制**: 受限的系统API访问

## 📊 监控和可观测性

### 性能指标

- 初始化和启动时间
- 内存和CPU使用量
- 请求处理统计
- 错误计数和类型

### 健康检查

- 状态检查（运行/错误）
- 内存使用检查
- 响应时间检查
- 错误率检查

### 事件系统

```typescript
// Extension管理器事件
extensionManager.on('extensionLoaded', ({ name, instance }) => {})
extensionManager.on('extensionUnloaded', ({ name }) => {})
extensionManager.on('extensionError', ({ name, error }) => {})

// 权限管理器事件
permissionManager.on('permissionGranted', event => {})
permissionManager.on('permissionRevoked', event => {})

// 热重载事件
hotReloadManager.on('reloading', event => {})
hotReloadManager.on('reloaded', event => {})
```

## 🛠️ API参考

### 核心导出

```typescript
import {
  // 管理器
  ExtensionManager,
  extensionManager,
  HotReloadManager,
  ExtensionStateManager,
  ExtensionPermissionManager,
  permissionManager,
  ExtensionSandbox,

  // 类型
  Extension,
  ExtensionInstance,
  ExtensionMetadata,
  ExtensionPermission,

  // 配置
  HotReloadConfig,
  SandboxConfig,
  PermissionPolicy,
} from '@linch-kit/core'
```

### 使用示例

```typescript
// 加载Extension
const result = await extensionManager.loadExtension('my-extension')
if (result.success) {
  console.log('Extension loaded:', result.instance)
}

// 权限检查
const hasPermission = await permissionManager.checkPermission('my-extension', 'database:write')

// 启用热重载
const hotReload = createHotReloadManager(extensionManager)
hotReload.enable()
```

## 🚧 路线图

### ✅ Phase 1 (已完成)

- Extension生命周期管理
- 权限验证系统
- 沙箱执行环境
- 热重载支持
- 状态监控

### 🔄 Phase 2 (进行中)

- CLI工具扩展
- 参考Extension实现
- 测试框架建立

### 📋 Phase 3 (计划中)

- Extension市场集成
- 依赖管理系统
- 版本管理和更新
- 性能优化

## 📚 相关文档

- [Extension Schema规范](../03_Reference/04_Extension_Schema.md)
- [开发工作流程](../02_Guides/01_Development_Workflow.md)
- [Package架构](./03_Package_Architecture.md)
- [AI协作指南](../02_Guides/03_AI_Collaboration.md)
