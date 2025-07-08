// 演示模式：使用简化的TypeScript类型定义
// 在真实环境中，这里会使用 @linch-kit/schema 的完整功能

export interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  authorId: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  tags: string[]
  viewCount: number
  likeCount: number
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

// 简化的创建和更新类型
export type PostCreate = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount'>
export type PostUpdate = Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>

// 为了保持一致性的导出
export const PostEntity = {
  type: {} as Post,
  createSchema: {} as PostCreate,
  updateSchema: {} as PostUpdate,
}

export const PostCreateSchema = PostEntity.createSchema
export const PostUpdateSchema = PostEntity.updateSchema
