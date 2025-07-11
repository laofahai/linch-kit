/**
 * Post 实体定义 - 使用 LinchKit Schema 标准
 */

import { defineEntity } from '@linch-kit/schema'
import { z } from 'zod'

/**
 * Post 实体定义
 */
export const PostEntity = defineEntity(
  'Post',
  {
    id: {
      type: 'string',
      primaryKey: true,
      generated: 'cuid',
      description: '文章唯一标识符',
    },
    title: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 200,
      description: '文章标题',
    },
    content: {
      type: 'text',
      required: true,
      description: '文章内容',
    },
    excerpt: {
      type: 'string',
      optional: true,
      maxLength: 500,
      description: '文章摘要',
    },
    authorId: {
      type: 'string',
      required: true,
      description: '作者ID',
    },
    status: {
      type: 'enum',
      values: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      description: '文章状态',
    },
    tags: {
      type: 'json',
      default: [],
      description: '文章标签',
    },
    viewCount: {
      type: 'int',
      default: 0,
      description: '浏览次数',
    },
    likeCount: {
      type: 'int',
      default: 0,
      description: '点赞次数',
    },
    publishedAt: {
      type: 'datetime',
      optional: true,
      description: '发布时间',
    },
  },
  {
    timestamps: true,
    softDelete: false,
    tableName: 'posts',
  }
)

// 导出类型定义
export type Post = z.infer<typeof PostEntity.zodSchema>
export type PostCreate = z.infer<typeof PostEntity.createSchema>
export type PostUpdate = z.infer<typeof PostEntity.updateSchema>

// 导出 Schema 用于验证
export const PostSchema = PostEntity.zodSchema
export const PostCreateSchema = PostEntity.createSchema
export const PostUpdateSchema = PostEntity.updateSchema
