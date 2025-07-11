/**
 * Extension示例：计数器功能
 *
 * 这个示例展示了如何创建一个简单的LinchKit Extension，包括：
 * 1. Extension的基本结构
 * 2. 如何暴露组件和服务
 * 3. 如何管理状态
 * 4. 如何与其他Extension通信
 */

import type { Extension, ExtensionConfig } from '@linch-kit/core'

import { CounterService, type CounterConfig } from './services/CounterService'

// Export components for external use
export { CounterWidget } from './components/CounterWidget'
export { CounterService } from './services/CounterService'

/**
 * Extension定义
 */
export const extension: Extension = {
  metadata: {
    id: '@linch-kit/example-counter',
    name: '计数器示例',
    version: '1.0.0',
    description: 'LinchKit Extension示例 - 展示如何创建一个简单的计数器功能',
    displayName: '计数器示例',
    capabilities: {
      hasUI: true,
      hasAPI: false,
      hasSchema: false,
      hasHooks: false,
      standalone: true,
    },
    category: 'examples',
    tags: ['counter', 'example', 'demo'],
    permissions: ['ui:render'],
    configuration: {
      initialValue: {
        type: 'number',
        default: 0,
        description: '计数器的初始值',
      },
      step: {
        type: 'number',
        default: 1,
        description: '每次增加或减少的步长',
      },
      allowNegative: {
        type: 'boolean',
        default: true,
        description: '是否允许负数',
      },
    },
  },

  defaultConfig: {
    initialValue: 0,
    step: 1,
    allowNegative: true,
  },

  // Extension的生命周期方法
  async start(config: ExtensionConfig) {
    console.log('Counter Extension started with config:', config)

    // 注册服务
    const _counterService = new CounterService(config as CounterConfig)

    // 这里可以进行初始化工作
    // 在实际应用中，这些注册工作会通过Extension Manager进行

    return Promise.resolve()
  },

  async stop() {
    console.log('Counter Extension stopped')
    return Promise.resolve()
  },
}

// 默认导出
export default extension
