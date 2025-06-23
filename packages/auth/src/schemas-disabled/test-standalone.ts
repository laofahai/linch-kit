/**
 * 完全独立的测试文件
 * 
 * 不依赖 Auth 包的任何其他文件，只测试 Schema 包的性能
 */

import { z } from 'zod'
import { defineField, defineEntity, primary, unique } from '@linch-kit/schema'

/**
 * 独立用户实体 - 完全不依赖 Auth 包的其他部分
 */
export const StandaloneUser = defineEntity('StandaloneUser', {
  id: primary(z.string().uuid()),
  email: unique(z.string().email()),
  name: z.string().min(1).max(100)
}, {
  tableName: 'standalone_users'
})

/**
 * 类型导出
 */
export type StandaloneUser = z.infer<typeof StandaloneUser.schema>

/**
 * 默认导出
 */
export default StandaloneUser
