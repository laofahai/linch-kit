/**
 * Console 模块验证器
 * 
 * 基于实体定义生成验证器，使用内置的 Zod schemas
 */

import { 
  TenantEntity, 
  TenantQuotasEntity,
  PluginEntity,
  SystemMetricEntity,
  AuditLogEntity 
} from '../entities'

/**
 * 基于实体内置 Zod schemas 的验证器
 */
function createEntityValidators<T>(entity: any) {
  return {
    create: entity.createSchema,
    update: entity.updateSchema,
    validate: entity.zodSchema,
    
    // 便捷验证方法
    validateCreate: (data: unknown) => entity.createSchema.safeParse(data),
    validateUpdate: (data: unknown) => entity.updateSchema.safeParse(data),
    assertCreate: (data: unknown) => entity.createSchema.parse(data),
    assertUpdate: (data: unknown) => entity.updateSchema.parse(data),
    assert: (data: unknown) => entity.zodSchema.parse(data)
  }
}

// 租户验证器
export const tenantValidators = createEntityValidators(TenantEntity)
export const tenantQuotasValidators = createEntityValidators(TenantQuotasEntity)

// 插件验证器  
export const pluginValidators = createEntityValidators(PluginEntity)

// 监控验证器
export const systemMetricValidators = createEntityValidators(SystemMetricEntity)
export const auditLogValidators = createEntityValidators(AuditLogEntity)

/**
 * 统一的验证器导出
 */
export const consoleValidators = {
  tenant: tenantValidators,
  tenantQuotas: tenantQuotasValidators,
  plugin: pluginValidators,
  systemMetric: systemMetricValidators,
  auditLog: auditLogValidators
} as const

/**
 * 验证器类型
 */
export type ConsoleValidators = typeof consoleValidators

/**
 * 便捷的验证函数
 */
export function validateTenantInput(data: unknown) {
  return tenantValidators.create.safeParse(data)
}

export function validateTenantUpdate(data: unknown) {
  return tenantValidators.update.safeParse(data)
}

export function validatePluginInput(data: unknown) {
  return pluginValidators.create.safeParse(data)
}

// ... 其他验证函数

/**
 * 批量验证函数
 */
export function validateBatch<T>(
  validator: (data: unknown) => { success: boolean; data?: T; error?: any },
  dataList: unknown[]
): { valid: T[]; invalid: { data: unknown; error: any }[] } {
  const valid: T[] = []
  const invalid: { data: unknown; error: any }[] = []
  
  dataList.forEach(data => {
    const result = validator(data)
    if (result.success && result.data) {
      valid.push(result.data)
    } else {
      invalid.push({ data, error: result.error })
    }
  })
  
  return { valid, invalid }
}