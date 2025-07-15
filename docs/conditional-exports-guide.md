# LinchKit 条件导出使用指南

## 概述

LinchKit 现已全面支持条件导出 (Conditional Exports)，实现了服务端和客户端代码的完全分离。这确保了客户端构建不会包含服务端专用依赖，大幅减少了构建产物大小并提高了安全性。

## 条件导出结构

### @linch-kit/core 包导出

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./client": {
      "import": "./dist/client.mjs", 
      "require": "./dist/client.js"
    },
    "./server": {
      "import": "./dist/server.mjs",
      "require": "./dist/server.js"
    }
  }
}
```

## 导入规范

### 服务端导入

```typescript
// tRPC 路由、API 路由、中间件等服务端代码
import { logger } from '@linch-kit/core/server'
import { ConfigManager } from '@linch-kit/core/server'
import { HotReloadManager } from '@linch-kit/core/server'

// 使用示例
logger.info('服务端日志')
```

### 客户端导入

```typescript
// React 组件、hooks、客户端逻辑
import { Logger } from '@linch-kit/core/client'
import { ExtensionRegistry } from '@linch-kit/core/client'

// 使用示例
Logger.info('客户端日志')
```

### 通用导入

```typescript
// 同时在服务端和客户端使用的功能
import { createLogger } from '@linch-kit/core'
import { metrics } from '@linch-kit/core'
```

## 关键差异

### 客户端版本特点

- ✅ 纯 JavaScript，无 Node.js 依赖
- ✅ 构建产物小 (约 15KB)
- ✅ 支持 webpack、Vite 等现代打包工具
- ✅ 浏览器环境安全

### 服务端版本特点

- ✅ 完整功能，包括文件系统、进程管理
- ✅ 支持 Pino 日志器、配置监听等
- ✅ 热重载、CLI 工具等开发功能
- ❌ 不能在客户端使用

## 修复的问题

### 1. 构建大小优化

- **修复前**: 客户端构建包含服务端依赖，约 51KB
- **修复后**: 客户端构建纯净，约 15KB (减少 70%)

### 2. 运行时错误修复

- **修复前**: `TypeError: a.createContext is not a function`
- **修复后**: 通过正确的 React 导入方式解决

### 3. 构建警告消除

- **修复前**: Critical dependency warnings
- **修复后**: 无构建警告

## 最佳实践

### 1. 环境特定导入

```typescript
// 根据运行环境选择正确的导入
if (typeof window !== 'undefined') {
  // 客户端
  import('@linch-kit/core/client').then(({ Logger }) => {
    Logger.info('客户端初始化')
  })
} else {
  // 服务端
  import('@linch-kit/core/server').then(({ logger }) => {
    logger.info('服务端初始化')
  })
}
```

### 2. React 组件导入

```typescript
// ✅ 正确 - 直接导入 React 函数
import { createContext, useContext } from 'react'

const MyContext = createContext(undefined)

// ❌ 错误 - 可能导致构建错误
import React from 'react'
const MyContext = React.createContext(undefined)
```

### 3. 构建验证

```bash
# 构建所有包
bun run build:packages

# 验证客户端构建
cd apps/starter && bun run build

# 检查客户端构建产物纯净性
grep -r "isolated-vm\|fs/promises\|chokidar\|pino" packages/*/dist/client.*
```

## 迁移指南

### 现有代码迁移

1. **服务端代码** (API 路由、中间件等):
   ```typescript
   // 旧
   import { Logger } from '@linch-kit/core'
   
   // 新
   import { logger } from '@linch-kit/core/server'
   ```

2. **客户端代码** (React 组件、hooks):
   ```typescript
   // 旧
   import { Logger } from '@linch-kit/core'
   
   // 新
   import { Logger } from '@linch-kit/core/client'
   ```

### 测试迁移

```bash
# 测试服务端功能
cd apps/starter && bun run build && bun run start

# 测试客户端功能
cd apps/starter && bun run dev
```

## 故障排除

### 常见错误

1. **导入错误**:
   ```
   Error: 'Logger' is not exported from '@linch-kit/core/server'
   ```
   **解决**: 使用小写的 `logger` 而不是 `Logger`

2. **构建错误**:
   ```
   TypeError: a.createContext is not a function
   ```
   **解决**: 直接从 React 导入 `createContext`

3. **依赖警告**:
   ```
   Critical dependency: require function is used in a way...
   ```
   **解决**: 使用条件导出，避免混合导入

### 验证步骤

1. 构建成功：`bun run build:packages`
2. 客户端构建成功：`cd apps/starter && bun run build`
3. 开发服务器正常：`cd apps/starter && bun run dev`
4. 没有构建警告
5. 客户端代码纯净

## 总结

条件导出的实施为 LinchKit 带来了：

- 🎯 **精准分离**: 服务端和客户端代码完全分离
- 📦 **构建优化**: 客户端构建大小减少 70%
- 🔒 **安全提升**: 客户端不包含服务端敏感依赖
- 🚀 **性能改善**: 更快的加载和执行速度
- 🛠️ **开发体验**: 更清晰的导入结构和错误提示

这为未来的 LinchKit 发展奠定了坚实的基础，确保了架构的可扩展性和维护性。