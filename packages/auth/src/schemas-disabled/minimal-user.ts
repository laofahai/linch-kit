/**
 * 极简用户模板 - 用于测试 DTS 构建性能
 */

import { z } from 'zod'
import { defineField, defineEntity, primary, unique } from '@linch-kit/schema'

/**
 * 极简用户实体 - 只包含最基本的字段
 */
export const MinimalUser = defineEntity('MinimalUser', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string().min(1).max(100)
}, {
  tableName: 'minimal_users'
})

/**
 * 类型导出
 */
export type MinimalUser = z.infer<typeof MinimalUser.schema>

/**
 * 创建 Schema
 */
export const CreateMinimalUserSchema = MinimalUser.schema.omit({ id: true })
export type CreateMinimalUser = z.infer<typeof CreateMinimalUserSchema>

/**
 * 更新 Schema
 */
export const UpdateMinimalUserSchema = CreateMinimalUserSchema.partial()
export type UpdateMinimalUser = z.infer<typeof UpdateMinimalUserSchema>

/**
 * 默认导出
 */
export default MinimalUser
