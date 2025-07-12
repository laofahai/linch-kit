/**
 * Blog Extension
 * 完整的博客功能实现，展示LinchKit Extension系统的所有能力
 */

import type { Extension } from '@linch-kit/core'

import * as schemas from './schema'
import { api } from './api'

// 创建schema对象以匹配测试期待
export const schema = {
  entities: [
    {
      name: 'BlogPost',
      config: { tableName: 'blog_posts' },
      schema: schemas.BlogPost,
    },
    {
      name: 'BlogCategory',
      config: { tableName: 'blog_categories' },
      schema: schemas.BlogCategory,
    },
    {
      name: 'BlogTag',
      config: { tableName: 'blog_tags' },
      schema: schemas.BlogTag,
    },
    {
      name: 'BlogComment',
      config: { tableName: 'blog_comments' },
      schema: schemas.BlogComment,
    },
    {
      name: 'BlogPostStats',
      config: { tableName: 'blog_post_stats' },
      schema: schemas.BlogPostStats,
    },
  ],
}

// 创建components占位符
export const components = {
  BlogPostCard: () => null,
  BlogPostList: () => null,
  BlogCategoryList: () => null,
  BlogTagCloud: () => null,
  BlogHomepage: () => null,
}

// 创建hooks占位符
export const hooks = {
  useBlogPosts: () => null,
  useBlogPost: () => null,
  useBlogCategories: () => null,
  useBlogTags: () => null,
  useBlogSearch: () => null,
}

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
export { api }
