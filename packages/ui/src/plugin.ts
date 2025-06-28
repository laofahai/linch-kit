/**
 * @fileoverview UI包Core插件注册
 */

import type { Plugin } from '@linch-kit/core'

import { logger } from './infrastructure'

/**
 * UI包插件实现
 */
export const uiPlugin: Plugin = {
  metadata: {
    id: '@linch-kit/ui',
    name: 'LinchKit UI Components',
    version: '1.0.0',
    description: 'LinchKit UI组件库 - Schema驱动的企业级React组件',
    dependencies: ['@linch-kit/core', '@linch-kit/schema']
  },
  
  async init() {
    logger.info('UI插件初始化')
  },
  
  async setup() {
    logger.info('UI插件设置完成')
  },
  
  async start() {
    logger.info('UI插件启动完成')
  },
  
  async ready() {
    logger.info('UI插件准备就绪')
  },
  
  async stop() {
    logger.info('UI插件停止')
  },
  
  async destroy() {
    logger.info('UI插件销毁')
  }
}