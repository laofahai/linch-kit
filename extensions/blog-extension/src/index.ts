/**
 * Blog Extension
 * 完整的博客功能实现，展示LinchKit Extension系统的所有能力
 */

import type { Extension } from '@linch-kit/core'

import { schema } from './schema'
import { api } from './api'
import { components } from './components'
import { hooks } from './hooks'

/**
 * Extension配置
 */
export const metadata = {
  id: 'blog-extension',
  name: 'Blog Extension',
  version: '0.1.0',
  description: '完整的博客功能实现，包含文章管理、分类标签、评论系统等',
  displayName: 'Blog Extension',
  category: 'content',
  capabilities: {
    hasSchema: true,
    hasAPI: true,
    hasUI: true,
    hasHooks: true,
  },
  permissions: [
    'database:read',
    'database:write',
    'api:read',
    'api:write',
    'ui:render',
    'system:hooks',
  ],
  entries: {
    schema: 'schema.ts',
    api: 'api.ts',
    components: 'components.ts',
    hooks: 'hooks.ts',
  },
  dependencies: ['@linch-kit/core', '@linch-kit/platform', '@linch-kit/ui'],
} as const

/**
 * Extension实现
 */
const extension: Extension = {
  metadata: {
    ...metadata,
    permissions: [...metadata.permissions] as string[],
    dependencies: [...metadata.dependencies] as string[],
  },

  async init(config) {
    console.log(`${metadata.name} Extension initialized`, config)
  },

  async start(config) {
    console.log(`${metadata.name} Extension started`, config)
  },

  async stop(config) {
    console.log(`${metadata.name} Extension stopped`, config)
  },

  async destroy(config) {
    console.log(`${metadata.name} Extension destroyed`, config)
  },
}

export default extension

// 导出能力
export { schema }
export { api }
export { components }
export { hooks }
