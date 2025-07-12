/**
 * Blog Extension Schema定义
 * 包含文章、分类、标签、评论等实体
 */

import { z } from 'zod'

/**
 * 文章实体的Zod Schema
 */
export const BlogPost = z.object({
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
})

/**
 * 分类实体的Zod Schema
 */
export const BlogCategory = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  postCount: z.number().int().min(0).default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

/**
 * 标签实体的Zod Schema
 */
export const BlogTag = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  description: z.string().optional(),
  postCount: z.number().int().min(0).default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

/**
 * 评论实体的Zod Schema
 */
export const BlogComment = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email(),
  authorWebsite: z.string().url().optional(),
  content: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected', 'spam']).default('pending'),
  parentId: z.string().uuid().optional(), // 回复评论的父ID
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  isAuthorReply: z.boolean().default(false), // 是否是作者回复
  likeCount: z.number().int().min(0).default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

/**
 * 文章标签关联的Zod Schema
 */
export const BlogPostTag = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  tagId: z.string().uuid(),
  createdAt: z.date().default(() => new Date()),
})

/**
 * 文章统计的Zod Schema
 */
export const BlogPostStats = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  viewCount: z.number().int().min(0).default(0),
  likeCount: z.number().int().min(0).default(0),
  shareCount: z.number().int().min(0).default(0),
  commentCount: z.number().int().min(0).default(0),
  lastViewedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

// 导出类型定义
export type BlogPostType = z.infer<typeof BlogPost>
export type BlogCategoryType = z.infer<typeof BlogCategory>
export type BlogTagType = z.infer<typeof BlogTag>
export type BlogCommentType = z.infer<typeof BlogComment>
export type BlogPostTagType = z.infer<typeof BlogPostTag>
export type BlogPostStatsType = z.infer<typeof BlogPostStats>
