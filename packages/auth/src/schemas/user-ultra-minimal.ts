import { z } from 'zod'

/**
 * 超级简化用户 Schema - 完全不依赖 Schema 包
 *
 * 只包含最基本的字段，使用纯 Zod 定义
 */
export const UltraMinimalUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * 用户类型
 */
export type UltraMinimalUser = z.infer<typeof UltraMinimalUserSchema>

/**
 * 简化的实体模板（兼容接口）
 */
export const UltraMinimalUserTemplate = {
  name: 'User',
  schema: UltraMinimalUserSchema,
  config: {
    tableName: 'users',
    ui: {
      displayName: 'auth.user.displayName',
      description: 'auth.user.description',
    },
  }
}

/**
 * 超级简化认证套件
 */
export const UltraMinimalAuthKit = {
  User: UltraMinimalUserTemplate,
}
