import { z } from 'zod'

/**
 * 完全不依赖 Schema 包的测试
 * 
 * 用于测试是否是 Schema 包导致的 DTS 构建超时
 */

// 简单的 Zod schema，不使用任何 LinchKit 的函数
const SimpleUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type SimpleUser = z.infer<typeof SimpleUserSchema>

export { SimpleUserSchema }

// 简单的配置对象
export const SimpleConfig = {
  tableName: 'users',
  displayName: 'Simple User',
}

// 简单的函数
export function createSimpleUser(data: Partial<SimpleUser>): SimpleUser {
  return {
    id: data.id || 'default-id',
    name: data.name,
    email: data.email,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  }
}
