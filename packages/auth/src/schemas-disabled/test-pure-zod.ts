/**
 * 测试：完全使用纯 Zod，不使用任何 Schema 包功能
 */

import { z } from 'zod'

/**
 * 纯 Zod 用户 Schema
 */
export const PureZodUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * 用户类型
 */
export type PureZodUser = z.infer<typeof PureZodUserSchema>

/**
 * 认证配置
 */
export interface PureZodAuthConfig {
  userSchema: typeof PureZodUserSchema
  providers: string[]
}

/**
 * 创建认证配置
 */
export function createPureZodAuthConfig(): PureZodAuthConfig {
  return {
    userSchema: PureZodUserSchema,
    providers: ['credentials']
  }
}

export const testConfig = createPureZodAuthConfig()
