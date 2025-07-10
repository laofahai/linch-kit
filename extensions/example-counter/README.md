# Counter Extension 示例

这是一个LinchKit Extension的完整示例，展示了如何创建一个简单但功能完整的计数器Extension。

## 功能特性

- ✅ 基础计数功能（增加、减少、重置）
- ✅ 可配置的步长和初始值
- ✅ 历史记录追踪
- ✅ 事件系统集成
- ✅ 命令系统支持
- ✅ React组件封装

## Extension结构

```
example-counter/
├── package.json          # Extension包配置
├── tsconfig.json         # TypeScript配置
├── tsup.config.ts        # 构建配置
├── README.md             # 文档
└── src/
    ├── index.ts          # Extension入口和注册
    ├── components/       # UI组件
    │   └── CounterWidget.tsx
    └── services/         # 业务逻辑服务
        └── CounterService.ts
```

## 如何使用

### 1. 在应用中加载Extension

```typescript
import { ExtensionManager } from '@linch-kit/core'
import counterExtension from '@linch-kit/example-counter'

// 注册Extension
const extensionManager = new ExtensionManager()
await extensionManager.register(counterExtension)

// 激活Extension
await extensionManager.activate('@linch-kit/example-counter', {
  initialValue: 0,
  step: 1,
  allowNegative: true,
})
```

### 2. 使用Extension组件

```tsx
import { useExtension } from '@linch-kit/core'

function App() {
  const { getComponent } = useExtension('@linch-kit/example-counter')
  const CounterWidget = getComponent('counter-widget')
  
  return (
    <div>
      <CounterWidget title="我的计数器" showHistory={true} />
    </div>
  )
}
```

### 3. 使用Extension服务

```typescript
import { useExtension } from '@linch-kit/core'

function useCounter() {
  const { getService } = useExtension('@linch-kit/example-counter')
  const counterService = getService('counter-service')
  
  return {
    increment: () => counterService.increment(),
    decrement: () => counterService.decrement(),
    reset: () => counterService.reset(),
    getValue: () => counterService.getValue(),
  }
}
```

### 4. 执行Extension命令

```typescript
import { useExtension } from '@linch-kit/core'

function CounterControls() {
  const { executeCommand } = useExtension('@linch-kit/example-counter')
  
  return (
    <div>
      <button onClick={() => executeCommand('increment')}>+</button>
      <button onClick={() => executeCommand('decrement')}>-</button>
      <button onClick={() => executeCommand('reset')}>Reset</button>
    </div>
  )
}
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `initialValue` | number | 0 | 计数器的初始值 |
| `step` | number | 1 | 每次增加或减少的步长 |
| `allowNegative` | boolean | true | 是否允许负数 |

## 事件

Counter Extension会触发以下事件：

- `valueChanged`: 当计数值改变时触发
  ```typescript
  {
    oldValue: number
    newValue: number
    action: 'increment' | 'decrement' | 'reset' | 'set'
  }
  ```

- `configChanged`: 当配置更新时触发

## 开发指南

### 构建Extension

```bash
# 开发模式
bun run dev

# 生产构建
bun run build

# 类型检查
bun run type-check

# 代码检查
bun run lint
```

### 测试Extension

```typescript
import { ExtensionTester } from '@linch-kit/core/testing'
import counterExtension from '../src'

describe('Counter Extension', () => {
  it('should increment value', async () => {
    const tester = new ExtensionTester(counterExtension)
    await tester.activate()
    
    const service = tester.getService('counter-service')
    service.increment()
    
    expect(service.getValue()).toBe(1)
  })
})
```

## 最佳实践

1. **服务与UI分离**: 将业务逻辑放在Service中，UI组件只负责展示和交互
2. **使用事件系统**: 通过事件实现松耦合的组件通信
3. **配置验证**: 使用Schema验证配置的合法性
4. **资源清理**: 在`dispose`方法中清理所有资源
5. **错误处理**: 妥善处理各种异常情况

## 扩展功能

这个示例可以扩展以下功能：

- 持久化存储（保存计数值到本地存储）
- 多实例支持（创建多个独立的计数器）
- 主题定制（支持不同的UI主题）
- 快捷键支持（键盘操作）
- 动画效果（数字变化动画）
- 导出功能（导出历史记录）

## 许可证

MIT