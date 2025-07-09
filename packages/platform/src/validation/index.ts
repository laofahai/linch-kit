/**
 * Runtime validation module
 * @module platform/validation
 */

import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core/extension/types'

/**
 * Extension配置验证器
 */
export const extensionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  priority: z.number().min(0).max(100).default(50),
  debug: z.boolean().default(false),
})

/**
 * Extension权限验证器
 */
export const extensionPermissionSchema = z.enum([
  'database:read',
  'database:write', 
  'api:read',
  'api:write',
  'ui:render',
  'system:hooks',
])

/**
 * 运行时验证管理器
 */
export class RuntimeValidator {
  private context?: ExtensionContext

  constructor(context?: ExtensionContext) {
    this.context = context
  }

  /**
   * 验证Extension配置
   */
  validateConfig(config: unknown): boolean {
    try {
      extensionConfigSchema.parse(config)
      return true
    } catch (error) {
      this.context?.logger.error('Config validation failed:', error)
      return false
    }
  }

  /**
   * 验证Extension权限
   */
  validatePermissions(permissions: string[]): boolean {
    try {
      z.array(extensionPermissionSchema).parse(permissions)
      return true
    } catch (error) {
      this.context?.logger.error('Permissions validation failed:', error)
      return false
    }
  }

  /**
   * 创建数据验证器
   */
  createDataValidator<T>(schema: z.ZodSchema<T>) {
    return {
      validate: (data: unknown): data is T => {
        try {
          schema.parse(data)
          return true
        } catch {
          return false
        }
      },
      parse: (data: unknown): T => schema.parse(data),
      safeParse: (data: unknown) => schema.safeParse(data),
    }
  }
}