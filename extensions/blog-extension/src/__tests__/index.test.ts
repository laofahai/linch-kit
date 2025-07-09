/**
 * Blog Extension 测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'

import extension, { metadata, schema, api, components, hooks } from '../index'

describe('Blog Extension', () => {
  describe('metadata', () => {
    it('should have correct extension metadata', () => {
      expect(metadata.id).toBe('blog-extension')
      expect(metadata.name).toBe('Blog Extension')
      expect(metadata.version).toBe('0.1.0')
      expect(metadata.category).toBe('content')
    })

    it('should have all required capabilities', () => {
      expect(metadata.capabilities.hasSchema).toBe(true)
      expect(metadata.capabilities.hasAPI).toBe(true)
      expect(metadata.capabilities.hasUI).toBe(true)
      expect(metadata.capabilities.hasHooks).toBe(true)
    })

    it('should have all required permissions', () => {
      const permissions = metadata.permissions
      expect(permissions).toContain('database:read')
      expect(permissions).toContain('database:write')
      expect(permissions).toContain('api:read')
      expect(permissions).toContain('api:write')
      expect(permissions).toContain('ui:render')
      expect(permissions).toContain('system:hooks')
    })
  })

  describe('extension lifecycle', () => {
    const mockConfig = { enabled: true }
    const mockLogger = {
      info: console.log,
      error: console.error,
    }

    beforeEach(() => {
      // Reset any state before each test
    })

    afterEach(() => {
      // Clean up after each test
    })

    it('should initialize successfully', async () => {
      expect(async () => {
        await extension.init(mockConfig)
      }).not.toThrow()
    })

    it('should start successfully', async () => {
      await extension.init(mockConfig)
      
      expect(async () => {
        await extension.start(mockConfig)
      }).not.toThrow()
    })

    it('should stop successfully', async () => {
      await extension.init(mockConfig)
      await extension.start(mockConfig)
      
      expect(async () => {
        await extension.stop(mockConfig)
      }).not.toThrow()
    })

    it('should destroy successfully', async () => {
      await extension.init(mockConfig)
      await extension.start(mockConfig)
      await extension.stop(mockConfig)
      
      expect(async () => {
        await extension.destroy(mockConfig)
      }).not.toThrow()
    })
  })

  describe('schema', () => {
    it('should export schema entities', () => {
      expect(schema).toBeDefined()
      expect(schema.entities).toBeArray()
      expect(schema.entities.length).toBeGreaterThan(0)
    })

    it('should have BlogPost entity', () => {
      const blogPost = schema.entities.find(entity => entity.name === 'BlogPost')
      expect(blogPost).toBeDefined()
      expect(blogPost?.config.tableName).toBe('blog_posts')
    })

    it('should have BlogCategory entity', () => {
      const blogCategory = schema.entities.find(entity => entity.name === 'BlogCategory')
      expect(blogCategory).toBeDefined()
      expect(blogCategory?.config.tableName).toBe('blog_categories')
    })

    it('should have BlogTag entity', () => {
      const blogTag = schema.entities.find(entity => entity.name === 'BlogTag')
      expect(blogTag).toBeDefined()
      expect(blogTag?.config.tableName).toBe('blog_tags')
    })

    it('should have BlogComment entity', () => {
      const blogComment = schema.entities.find(entity => entity.name === 'BlogComment')
      expect(blogComment).toBeDefined()
      expect(blogComment?.config.tableName).toBe('blog_comments')
    })
  })

  describe('api', () => {
    it('should export api router', () => {
      expect(api).toBeDefined()
      expect(typeof api).toBe('function')
    })

    it('should have posts router', () => {
      expect(api.posts).toBeDefined()
    })

    it('should have categories router', () => {
      expect(api.categories).toBeDefined()
    })

    it('should have tags router', () => {
      expect(api.tags).toBeDefined()
    })

    it('should have comments router', () => {
      expect(api.comments).toBeDefined()
    })

    it('should have blog extended router', () => {
      expect(api.blog).toBeDefined()
    })
  })

  describe('components', () => {
    it('should export components', () => {
      expect(components).toBeDefined()
      expect(typeof components).toBe('object')
    })

    it('should have BlogPostCard component', () => {
      expect(components.BlogPostCard).toBeDefined()
      expect(typeof components.BlogPostCard).toBe('function')
    })

    it('should have BlogPostList component', () => {
      expect(components.BlogPostList).toBeDefined()
      expect(typeof components.BlogPostList).toBe('function')
    })

    it('should have BlogCategoryList component', () => {
      expect(components.BlogCategoryList).toBeDefined()
      expect(typeof components.BlogCategoryList).toBe('function')
    })

    it('should have BlogTagCloud component', () => {
      expect(components.BlogTagCloud).toBeDefined()
      expect(typeof components.BlogTagCloud).toBe('function')
    })

    it('should have BlogHomepage component', () => {
      expect(components.BlogHomepage).toBeDefined()
      expect(typeof components.BlogHomepage).toBe('function')
    })
  })

  describe('hooks', () => {
    it('should export hooks', () => {
      expect(hooks).toBeDefined()
      expect(typeof hooks).toBe('object')
    })

    it('should have useBlogPosts hook', () => {
      expect(hooks.useBlogPosts).toBeDefined()
      expect(typeof hooks.useBlogPosts).toBe('function')
    })

    it('should have useBlogPost hook', () => {
      expect(hooks.useBlogPost).toBeDefined()
      expect(typeof hooks.useBlogPost).toBe('function')
    })

    it('should have useBlogCategories hook', () => {
      expect(hooks.useBlogCategories).toBeDefined()
      expect(typeof hooks.useBlogCategories).toBe('function')
    })

    it('should have useBlogTags hook', () => {
      expect(hooks.useBlogTags).toBeDefined()
      expect(typeof hooks.useBlogTags).toBe('function')
    })

    it('should have useBlogSearch hook', () => {
      expect(hooks.useBlogSearch).toBeDefined()
      expect(typeof hooks.useBlogSearch).toBe('function')
    })
  })
})