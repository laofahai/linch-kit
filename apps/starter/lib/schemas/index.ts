// 导入实体定义
import { UserEntity } from './user'
import { PostEntity } from './post'

// 用户相关Schema
export {
  UserEntity,
  UserCreateSchema,
  UserUpdateSchema,
  type User
} from './user'

// 文章相关Schema  
export {
  PostEntity,
  PostCreateSchema,
  PostUpdateSchema,
  type Post
} from './post'

// 统一导出所有实体
export const entities = {
  User: UserEntity,
  Post: PostEntity
} as const

// 类型定义
export type EntityNames = keyof typeof entities
export type AllEntities = typeof entities