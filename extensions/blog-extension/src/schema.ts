/**
 * Blog Extension Schema定义
 * 包含文章、分类、标签、评论等实体
 */

import { defineEntity } from '@linch-kit/platform'
import { z } from 'zod'

/**
 * 文章实体
 */
export const BlogPost = defineEntity({
  name: 'BlogPost',
  schema: z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200),
    content: z.string(),
    excerpt: z.string().optional(),
    coverImage: z.string().url().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    publishedAt: z.date().optional(),
    categoryId: z.string().uuid().optional(),
    tags: z.array(z.string()).default([]),
    authorId: z.string().uuid(),
    viewCount: z.number().int().min(0).default(0),
    likeCount: z.number().int().min(0).default(0),
    commentCount: z.number().int().min(0).default(0),
    featured: z.boolean().default(false),
    allowComments: z.boolean().default(true),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    seoKeywords: z.array(z.string()).default([]),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),
  config: {
    tableName: 'blog_posts',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['status'] },
      { fields: ['categoryId'] },
      { fields: ['authorId'] },
      { fields: ['publishedAt'] },
      { fields: ['featured'] },
    ],
  },
})

/**
 * 分类实体
 */
export const BlogCategory = defineEntity({
  name: 'BlogCategory',
  schema: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(50),
    slug: z.string().min(1).max(50),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    icon: z.string().optional(),
    parentId: z.string().uuid().optional(),
    sortOrder: z.number().int().min(0).default(0),
    postCount: z.number().int().min(0).default(0),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),
  config: {
    tableName: 'blog_categories',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['parentId'] },
      { fields: ['sortOrder'] },
    ],
  },
})

/**
 * 标签实体
 */
export const BlogTag = defineEntity({
  name: 'BlogTag',
  schema: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(30),
    slug: z.string().min(1).max(30),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    postCount: z.number().int().min(0).default(0),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),
  config: {
    tableName: 'blog_tags',
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['name'] },
    ],
  },
})

/**
 * 评论实体
 */
export const BlogComment = defineEntity({
  name: 'BlogComment',
  schema: z.object({
    id: z.string().uuid(),
    postId: z.string().uuid(),
    authorId: z.string().uuid().optional(),
    authorName: z.string().min(1).max(50),
    authorEmail: z.string().email(),
    authorWebsite: z.string().url().optional(),
    content: z.string().min(1),
    status: z.enum(['pending', 'approved', 'rejected', 'spam']).default('pending'),
    parentId: z.string().uuid().optional(),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().optional(),
    likeCount: z.number().int().min(0).default(0),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),
  config: {
    tableName: 'blog_comments',
    indexes: [
      { fields: ['postId'] },
      { fields: ['authorId'] },
      { fields: ['status'] },
      { fields: ['parentId'] },
      { fields: ['createdAt'] },
    ],
  },
})

/**
 * 文章标签关联实体
 */
export const BlogPostTag = defineEntity({
  name: 'BlogPostTag',
  schema: z.object({
    id: z.string().uuid(),
    postId: z.string().uuid(),
    tagId: z.string().uuid(),
    createdAt: z.date().default(() => new Date()),
  }),
  config: {
    tableName: 'blog_post_tags',
    indexes: [
      { fields: ['postId', 'tagId'], unique: true },
      { fields: ['postId'] },
      { fields: ['tagId'] },
    ],
  },
})

/**
 * 文章统计实体
 */
export const BlogPostStats = defineEntity({
  name: 'BlogPostStats',
  schema: z.object({
    id: z.string().uuid(),
    postId: z.string().uuid(),
    date: z.date(),
    views: z.number().int().min(0).default(0),
    likes: z.number().int().min(0).default(0),
    shares: z.number().int().min(0).default(0),
    comments: z.number().int().min(0).default(0),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),
  config: {
    tableName: 'blog_post_stats',
    indexes: [
      { fields: ['postId', 'date'], unique: true },
      { fields: ['postId'] },
      { fields: ['date'] },
    ],
  },
})

/**
 * 导出所有实体
 */
export const schema = {
  entities: [
    BlogPost,
    BlogCategory,
    BlogTag,
    BlogComment,
    BlogPostTag,
    BlogPostStats,
  ],
}