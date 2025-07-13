/**
 * Post 实体定义 - 简化版本以避免类型递归问题
 */

import { z } from 'zod'

/**
 * 文章 Schema 定义
 */
const PostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  authorId: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  tags: z.array(z.string()).default([]),
  viewCount: z.number().int().min(0).default(0),
  likeCount: z.number().int().min(0).default(0),
  publishedAt: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]).transform(val => 
    typeof val === 'string' ? val : val.toISOString()
  ),
  updatedAt: z.union([z.string(), z.date()]).transform(val => 
    typeof val === 'string' ? val : val.toISOString()
  ),
})

const PostCreateSchema = PostSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  viewCount: true,
  likeCount: true 
})

const PostUpdateSchema = PostCreateSchema.partial()

// 简化的实体对象
export const PostEntity = {
  zodSchema: PostSchema,
  createSchema: PostCreateSchema,
  updateSchema: PostUpdateSchema,
}

// 导出类型定义
export type Post = z.infer<typeof PostSchema>
export type PostCreate = z.infer<typeof PostCreateSchema>
export type PostUpdate = z.infer<typeof PostUpdateSchema>

// 导出 Schema 用于验证
export { PostSchema, PostCreateSchema, PostUpdateSchema }
