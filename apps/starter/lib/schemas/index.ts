// 用户相关Schema - 使用LinchKit标准类型
export {
  type User,
  type UserCreate,
  type UserUpdate,
  type LinchKitUser,
  UserSchema,
  getUserDisplayName,
  isAdminUser,
  isActiveUser,
} from './user'

// 文章相关Schema
export { PostEntity, PostCreateSchema, PostUpdateSchema, type Post } from './post'

// 重新导入PostEntity用于entities对象
import { PostEntity } from './post'

// 统一导出所有实体（为了向后兼容）
export const entities = {
  Post: PostEntity,
} as const

// 类型定义
export type EntityNames = keyof typeof entities
export type AllEntities = typeof entities
