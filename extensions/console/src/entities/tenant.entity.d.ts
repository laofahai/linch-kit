/**
 * 租户管理实体定义
 *
 * 多租户架构的核心实体，包括租户和配额管理
 */
import { z } from 'zod';
export interface TenantSettings {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    features?: string[];
}
export interface TenantMetadata {
    industry?: string;
    size?: 'small' | 'medium' | 'large' | 'enterprise';
    contactEmail?: string;
    contactPhone?: string;
    [key: string]: unknown;
}
/**
 * 租户实体 - 核心多租户支持
 */
export declare const TenantEntity: import("@linch-kit/schema").Entity<Record<string, unknown>>;
/**
 * 租户配额实体 - 资源配额管理
 */
export declare const TenantQuotasEntity: import("@linch-kit/schema").Entity<Record<string, unknown>>;
export type Tenant = z.infer<typeof TenantEntity.zodSchema>;
export type TenantInput = z.infer<typeof TenantEntity.createSchema>;
export type TenantUpdate = z.infer<typeof TenantEntity.updateSchema>;
export type TenantQuotas = z.infer<typeof TenantQuotasEntity.zodSchema>;
export type TenantQuotasInput = z.infer<typeof TenantQuotasEntity.createSchema>;
export type TenantQuotasUpdate = z.infer<typeof TenantQuotasEntity.updateSchema>;
//# sourceMappingURL=tenant.entity.d.ts.map