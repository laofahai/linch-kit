# LinchKit Extension 系统架构

**版本**: v1.0  
**更新**: 2025-07-10  
**状态**: Extension系统架构设计文档

## 🎯 Extension系统概述

LinchKit Extension 系统是一个基于插件架构的可扩展框架，允许开发者创建可复用的功能模块，动态扩展应用的核心能力。

### 设计原则

- **松耦合**: Extension之间通过标准化接口通信，避免直接依赖
- **高内聚**: 每个Extension封装完整的功能域，包括UI、业务逻辑和数据
- **生命周期管理**: 完整的加载、激活、运行、停止生命周期
- **权限控制**: 基于CASL的细粒度权限管理
- **性能优化**: 延迟加载、缓存、批量通信等性能优化策略

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
  start?(config: ExtensionConfig): Promise<void> | void
  ready?(config: ExtensionConfig): Promise<void> | void
  stop?(config: ExtensionConfig): Promise<void> | void
  destroy?(config: ExtensionConfig): Promise<void> | void
}
```

**特点**:
- 基于Plugin接口扩展
- 声明式元数据配置
- 标准化生命周期
- 配置驱动的功能控制

### L2: Extension实现层

```
extensions/
├── console/                 # 管理控制台Extension
├── example-counter/         # 计数器示例Extension
└── blog/                   # 博客系统Extension (规划中)
```

**Extension项目结构**:
```
extension-name/
├── package.json            # Extension包配置
├── src/
│   ├── index.ts           # Extension入口和注册
│   ├── components/        # UI组件
│   ├── services/          # 业务逻辑服务
│   ├── types.ts          # 类型定义
│   └── hooks/            # React Hooks
├── tests/                # 测试文件
└── README.md            # Extension文档
```

## 🔄 Extension生命周期

### 状态转换图

```
   register()
Unregistered ────────→ Registered
      ↑                    │
      │                    │ loadExtension()
      │                    ↓
   unregister()         Loading ←──── (错误) ────→ Error
      ↑                    │                        ↑
      │                    │ success                │
      │                    ↓                        │
    Stopped ←─ stop() ── Loaded ─── start() ──→ Starting
      ↑                    ↑                        │
      │                    │                        │ success
      │                    │                        ↓
      └── deactivate() ── Ready ←─── activate() ── Running
                           ↑                        │
                           │                        │ error
                           └────── (错误) ────────←─┘
```

### 生命周期钩子详解

1. **init()** - Extension初始化
   - 注册服务和组件
   - 设置事件监听器
   - 初始化内部状态

2. **setup()** - Extension设置
   - 配置验证和处理
   - 依赖项检查
   - 资源预加载

3. **start()** - Extension启动
   - 启动服务
   - 注册路由和API
   - 开始监听事件

4. **ready()** - Extension就绪
   - 所有初始化完成
   - 可以接收外部调用
   - 发送就绪事件

5. **stop()** - Extension停止
   - 停止服务
   - 清理资源
   - 取消事件监听

6. **destroy()** - Extension销毁
   - 彻底清理内存
   - 关闭连接
   - 释放所有资源

## 🔐 权限管理架构

### Permission Model

```typescript
interface ExtensionPermission {
  resource: string     // 资源标识符 (e.g., 'user', 'tenant')
  action: string       // 操作类型 (e.g., 'read', 'write', 'delete')
  conditions?: object  // 条件限制 (e.g., { ownerId: userId })
}
```

### 权限层次

```
系统权限 (System Permissions)
├── database:read          # 数据库读取权限
├── database:write         # 数据库写入权限
├── api:read              # API读取权限
├── api:write             # API写入权限
├── ui:render             # UI渲染权限
├── system:hooks          # 系统钩子权限
└── admin:*               # 管理员权限
```

### 权限检查流程

```
Extension API调用
       ↓
PermissionManager.checkPermission()
       ↓
CASL ability.can(action, resource)
       ↓
Permission granted? ─── No ──→ AccessDenied
       ↓ Yes
继续执行API调用
```

## 🚀 性能优化架构

### 1. Extension加载缓存

```typescript
class ExtensionLoadCache {
  private cache = Map<string, CachedExtension>
  
  // 缓存Extension实例和元数据
  // 避免重复加载和解析
  // 支持TTL和LRU策略
}
```

### 2. 延迟加载管理器

```typescript
class LazyLoadManager {
  // 基于触发器的按需加载
  // 减少应用启动时间
  // 支持预加载策略
}
```

### 3. 批量通信优化

```typescript
class ExtensionCommunicationOptimizer {
  // 批量处理Extension间消息
  // 减少通信开销
  // 支持消息优先级
}
```

### 4. 性能监控

```typescript
class ExtensionPerformanceMonitor {
  // 监控Extension性能指标
  // 加载时间、内存使用、API调用频率
  // 性能问题自动告警
}
```

## 🔗 Extension通信架构

### 通信方式

1. **事件总线** (推荐)
```typescript
// Extension A 发送事件
eventBus.emit('user.created', { userId: '123' })

// Extension B 监听事件
eventBus.on('user.created', handleUserCreated)
```

2. **服务注册表**
```typescript
// Extension A 注册服务
serviceRegistry.register('userService', userService)

// Extension B 使用服务
const userService = serviceRegistry.get('userService')
```

3. **消息传递**
```typescript
// Extension A 发送消息
messaging.send('targetExtension', { type: 'command', data: {} })

// Extension B 接收消息
messaging.onMessage(handleMessage)
```

### 通信协议

```typescript
interface ExtensionMessage {
  id: string              // 消息ID
  from: string           // 发送者Extension ID
  to: string             // 接收者Extension ID
  type: 'event' | 'command' | 'query' | 'response'
  payload: unknown       // 消息负载
  timestamp: number      // 时间戳
  correlationId?: string // 关联ID (用于请求-响应)
}
```

## 🧪 测试架构

### 测试层次

```
tools/testing/
├── e2e/                   # 端到端测试
│   ├── extension-system.test.ts
│   └── extension-integration.test.ts
├── e2e-playwright/        # Playwright E2E测试
│   ├── tests/
│   └── playwright.config.ts
└── unit/                  # 单元测试
    ├── extension-manager.test.ts
    └── permission-manager.test.ts
```

### 测试策略

1. **单元测试**: 测试Extension组件和服务的独立功能
2. **集成测试**: 测试Extension与框架的集成
3. **E2E测试**: 测试完整的Extension生命周期
4. **性能测试**: 测试Extension加载和运行时性能

## 📚 开发工具生态

### 开发时工具

```
tools/
├── cli/                   # LinchKit CLI
├── schema/               # Schema代码生成工具
├── testing/              # 测试工具和框架
└── dev/                  # 开发辅助工具
```

### Extension开发流程

1. **脚手架生成**: 使用CLI创建Extension模板
2. **开发调试**: 热重载和开发服务器
3. **测试验证**: 自动化测试和手动测试
4. **构建打包**: TypeScript编译和打包
5. **发布分发**: npm发布和版本管理

## 🔮 未来扩展

### 计划中的功能

1. **Extension Store**: Extension市场和分发平台
2. **Visual Extension Builder**: 可视化Extension构建器
3. **Extension Templates**: 丰富的Extension模板库
4. **Performance Analytics**: 深度性能分析和优化建议
5. **Security Scanning**: Extension安全扫描和漏洞检测

### 技术演进

1. **WebAssembly支持**: 支持WASM Extension
2. **微前端集成**: 与微前端框架集成
3. **云原生部署**: 支持容器化和Kubernetes部署
4. **AI辅助开发**: AI驱动的Extension开发助手

---

这份架构文档定义了LinchKit Extension系统的核心设计和实现原则，为Extension开发提供了完整的技术框架。