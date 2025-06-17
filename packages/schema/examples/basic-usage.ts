#!/usr/bin/env tsx

/**
 * 基础使用示例
 * 演示如何定义实体、生成验证器和使用类型
 */

import { z } from 'zod'
import { 
  defineEntity, 
  primary, 
  unique, 
  createdAt, 
  updatedAt, 
  defaultValue,
  softDelete,
  generatePrismaSchema,
  generateMockData,
  ValidatorGenerator
} from '../src/index'

console.log('🎯 基础使用示例')
console.log('===============\n')

// 定义用户实体
const User = defineEntity('User', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  username: unique(z.string().min(3).max(20)),
  password: z.string().min(8),
  profile: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
  }).optional(),
  role: defaultValue(z.enum(['USER', 'ADMIN', 'MODERATOR']), 'USER'),
  isActive: defaultValue(z.boolean(), true),
  isEmailVerified: defaultValue(z.boolean(), false),
  lastLoginAt: z.date().optional(),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
  deletedAt: softDelete(z.date().optional()),
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['role', 'isActive'] },
    { fields: ['deletedAt'] }, // 软删除索引
  ]
})

// 定义文章实体
const Post = defineEntity('Post', {
  id: primary(z.string().uuid()),
  title: z.string().min(1).max(200),
  slug: unique(z.string().min(1).max(200)),
  content: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  status: defaultValue(z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']), 'DRAFT'),
  publishedAt: z.date().optional(),
  authorId: z.string().uuid(),
  viewCount: defaultValue(z.number().int().nonnegative(), 0),
  likeCount: defaultValue(z.number().int().nonnegative(), 0),
  featured: defaultValue(z.boolean(), false),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
  deletedAt: softDelete(z.date().optional()),
}, {
  tableName: 'posts',
  indexes: [
    { fields: ['authorId'] },
    { fields: ['status', 'publishedAt'] },
    { fields: ['featured', 'publishedAt'] },
    { fields: ['deletedAt'] },
  ]
})

// 生成验证器
const userGenerator = new ValidatorGenerator(User)
const postGenerator = new ValidatorGenerator(Post)

// 用户验证器
const CreateUserSchema = User.createSchema.extend({
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "密码不匹配",
  path: ["confirmPassword"],
})

const UpdateUserSchema = User.updateSchema.omit({ password: true })
const UserResponseSchema = User.responseSchema.omit({ password: true, deletedAt: true })

// 文章验证器
const CreatePostSchema = Post.createSchema
const UpdatePostSchema = Post.updateSchema
const PostResponseSchema = Post.responseSchema.omit({ deletedAt: true })

// 类型推断测试
type CreateUser = z.infer<typeof CreateUserSchema>
type UpdateUser = z.infer<typeof UpdateUserSchema>
type UserResponse = z.infer<typeof UserResponseSchema>

type CreatePost = z.infer<typeof CreatePostSchema>
type UpdatePost = z.infer<typeof UpdatePostSchema>
type PostResponse = z.infer<typeof PostResponseSchema>

console.log('📝 验证器测试')
console.log('-------------')

// 测试用户创建验证
const createUserData: CreateUser = {
  email: 'john@example.com',
  username: 'john_doe',
  password: 'securePassword123',
  confirmPassword: 'securePassword123',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    bio: '全栈开发者'
  }
  // isActive, isEmailVerified, role 有默认值，可选
}

const createUserResult = CreateUserSchema.safeParse(createUserData)
if (createUserResult.success) {
  console.log('✅ 用户创建验证通过')
} else {
  console.log('❌ 用户创建验证失败:', createUserResult.error.errors)
}

// 测试文章创建验证
const createPostData: CreatePost = {
  title: '我的第一篇文章',
  slug: 'my-first-post',
  content: '这是文章内容...',
  excerpt: '这是文章摘要',
  authorId: '123e4567-e89b-12d3-a456-426614174000',
  // status, viewCount, likeCount, featured 有默认值
}

const createPostResult = CreatePostSchema.safeParse(createPostData)
if (createPostResult.success) {
  console.log('✅ 文章创建验证通过')
} else {
  console.log('❌ 文章创建验证失败:', createPostResult.error.errors)
}

console.log('\n🗄️ 生成的 Prisma Schema')
console.log('------------------------')
try {
  const prismaSchema = generatePrismaSchema()
  console.log(prismaSchema)
} catch (error) {
  console.error('生成 Prisma schema 时出错:', error)
}

console.log('\n🎭 Mock 数据生成')
console.log('----------------')
try {
  const mockUsers = generateMockData(User, { count: 2 })
  console.log('Mock 用户数据:')
  console.log(JSON.stringify(mockUsers, null, 2))
  
  const mockPosts = generateMockData(Post, { count: 2 })
  console.log('\nMock 文章数据:')
  console.log(JSON.stringify(mockPosts, null, 2))
} catch (error) {
  console.error('生成 Mock 数据时出错:', error)
}

console.log('\n🎉 基础示例完成!')
console.log('\n💡 提示:')
console.log('- 软删除字段 deletedAt 会自动从创建和更新验证器中排除')
console.log('- 响应验证器可以使用 .omit() 排除敏感字段')
console.log('- 所有验证器都有完整的 TypeScript 类型支持')
