# LinchKit 远程插件 MVP 实现方案

**文档版本**: v1.0.0
**创建日期**: 2025-06-26
**维护责任**: 架构团队
**状态**: ✅ MVP 规划

---

## 🎯 MVP 目标

### 核心原则
- **最小实现**: 仅保留核心扩展点，不实现具体功能
- **向后兼容**: 不影响现有本地插件系统
- **易于扩展**: 预留清晰的扩展接口
- **零依赖**: 不引入额外的第三方依赖

### MVP 范围
- ✅ 类型定义扩展点
- ✅ 插件注册接口预留
- ✅ 文档说明扩展方式
- ❌ 不实现具体通信协议
- ❌ 不实现进程管理
- ❌ 不实现服务发现

---

## 🏗️ MVP 设计

### 1. 最小类型扩展
```typescript
// 在 types/plugin.ts 中添加扩展点
export interface PluginMetadata {
  // ... 现有字段
  
  /** 插件类型扩展点 */
  type?: 'local' | 'remote' | string
  
  /** 扩展元数据 */
  extensions?: Record<string, unknown>
}

export interface PluginConfig {
  // ... 现有字段
  
  /** 扩展配置 */
  extensions?: Record<string, unknown>
}
```

### 2. 注册器扩展点
```typescript
// 在 PluginRegistry 中添加钩子
export class PluginRegistry {
  private extensionHandlers = new Map<string, PluginExtensionHandler>()
  
  /**
   * 注册扩展处理器
   */
  registerExtension(type: string, handler: PluginExtensionHandler): void {
    this.extensionHandlers.set(type, handler)
  }
  
  // 在 register 方法中调用扩展处理器
  async register(plugin: Plugin, config?: PluginConfig): Promise<OperationResult> {
    const type = plugin.metadata.type || 'local'
    const handler = this.extensionHandlers.get(type)
    
    if (handler) {
      return handler.register(plugin, config)
    }
    
    // 默认本地插件注册逻辑...
  }
}

// 扩展处理器接口
export interface PluginExtensionHandler {
  register(plugin: Plugin, config?: PluginConfig): Promise<OperationResult>
  // 未来可以添加更多方法
}
```

### 3. 使用示例（未来）
```typescript
// 这是未来如何使用扩展点的示例
// 不在 MVP 中实现

// 第三方实现远程插件处理器
class RemotePluginHandler implements PluginExtensionHandler {
  async register(plugin: Plugin, config?: PluginConfig) {
    // 实现远程插件注册逻辑
  }
}

// 注册处理器
pluginRegistry.registerExtension('remote', new RemotePluginHandler())

// 使用远程插件
const remotePlugin: Plugin = {
  metadata: {
    id: 'my-remote-plugin',
    name: 'Remote Plugin',
    version: '1.0.0',
    type: 'remote', // 触发远程处理器
    extensions: {
      protocol: 'grpc',
      endpoint: 'localhost:50051'
    }
  },
  // ...
}
```

---

## 📝 实施清单

### 需要修改的文件
1. **types/plugin.ts**
   - 添加 `type` 字段到 `PluginMetadata`
   - 添加 `extensions` 字段到相关接口
   - 添加 `PluginExtensionHandler` 接口

2. **plugin/registry.ts**
   - 添加 `extensionHandlers` Map
   - 添加 `registerExtension` 方法
   - 在 `register` 方法中添加扩展点调用

3. **更新文档**
   - 在 README 中说明扩展机制
   - 添加扩展开发指南

### 不需要实现的功能
- ❌ 具体的远程通信实现
- ❌ 进程管理功能
- ❌ 具体的协议适配器
- ❌ 健康检查机制
- ❌ 服务发现功能

---

## 🔮 未来扩展路径

### 社区驱动的扩展包
```
@linch-kit/plugin-remote-grpc     # gRPC 远程插件支持
@linch-kit/plugin-remote-http     # HTTP 远程插件支持
@linch-kit/plugin-docker          # Docker 容器插件支持
@linch-kit/plugin-wasm            # WebAssembly 插件支持
```

### 扩展点设计原则
1. **最小侵入**: 不修改核心逻辑
2. **类型安全**: 保持 TypeScript 类型完整性
3. **向后兼容**: 不破坏现有功能
4. **易于测试**: 扩展点可单独测试

---

## ✅ MVP 实施步骤

### Step 1: 类型定义 (10分钟)
```typescript
// 仅添加必要的类型扩展
// 保持向后兼容
```

### Step 2: 注册器扩展 (20分钟)
```typescript
// 添加最小的扩展机制
// 不影响现有功能
```

### Step 3: 文档更新 (10分钟)
```markdown
### 插件系统扩展

LinchKit 的插件系统支持扩展...
```

### Step 4: 测试验证 (10分钟)
```typescript
// 确保现有测试通过
// 添加扩展点的基础测试
```

---

## 📚 文档计划

### Core 包 README 更新
```markdown
## 插件系统

### 扩展机制
@linch-kit/core 的插件系统设计了扩展点，支持第三方实现：

- 远程插件（通过 type: 'remote'）
- 自定义插件类型
- 扩展元数据

### 扩展示例
请参考 [插件扩展开发指南] 了解如何开发自定义插件类型。
```

### 扩展开发指南
创建独立文档说明：
1. 如何实现 PluginExtensionHandler
2. 如何注册自定义处理器
3. 最佳实践和示例

---

## 🎯 总结

### MVP 交付物
1. ✅ 最小的类型扩展（2-3个字段）
2. ✅ 简单的扩展注册机制（1个方法）
3. ✅ 清晰的扩展文档
4. ✅ 不破坏现有功能

### 时间估算
- 总时间：约 50 分钟
- 代码修改：30 分钟
- 文档更新：10 分钟
- 测试验证：10 分钟

### 价值主张
- 为未来的远程插件留下扩展空间
- 不增加当前的复杂度
- 社区可以独立开发扩展包
- 保持 core 包的精简和稳定