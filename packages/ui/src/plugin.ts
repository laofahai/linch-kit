/**
 * @fileoverview UI包Core插件注册
 */

import type { Extension } from '@linch-kit/core'

import { logger } from './infrastructure'

/**
 * UI包Extension实现
 */
export const uiExtension: Extension = {
  metadata: {
    id: '@linch-kit/ui',
    name: 'LinchKit UI Components',
    version: '1.0.0',
    description: 'LinchKit UI组件库 - Schema驱动的企业级React组件',
    displayName: 'LinchKit UI Components',
    capabilities: {
      hasUI: true,
      hasAPI: false,
      hasSchema: false,
      hasHooks: false,
    },
    permissions: ['ui:render'],
    dependencies: ['@linch-kit/core', '@linch-kit/schema'],
  },

  async init() {
    logger.info('UI Extension初始化')
  },

  async setup() {
    logger.info('UI Extension设置完成')
  },

  async start() {
    logger.info('UI Extension启动完成')
  },

  async ready() {
    logger.info('UI Extension准备就绪')
  },

  async stop() {
    logger.info('UI Extension停止')
  },

  async destroy() {
    logger.info('UI Extension销毁')
  },
}
