// 演示模式：使用简化的TypeScript类型定义
// 在真实环境中，这里会使用 @linch-kit/schema 的完整功能

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
  lastActiveAt?: string | null
}

// 简化的创建和更新类型
export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>

// 为了保持一致性的导出
export const UserEntity = {
  type: {} as User,
  createSchema: {} as UserCreate,
  updateSchema: {} as UserUpdate,
}

export const UserCreateSchema = UserEntity.createSchema
export const UserUpdateSchema = UserEntity.updateSchema
