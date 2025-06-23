/**
 * 测试：完全不依赖 Schema 包，验证 DTS 构建性能
 */

import { z } from 'zod'

/**
 * 简单的用户 Schema - 不使用 defineEntity 或 defineField
 */
export const SimpleUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * 用户类型
 */
export type SimpleUser = z.infer<typeof SimpleUserSchema>

/**
 * 简单的认证配置
 */
export interface SimpleAuthConfig {
  userSchema: typeof SimpleUserSchema
  providers: string[]
}

/**
 * 创建简单的认证配置
 */
export function createSimpleAuthConfig(): SimpleAuthConfig {
  return {
    userSchema: SimpleUserSchema,
    providers: ['credentials']
  }
}

export const testConfig = createSimpleAuthConfig()
