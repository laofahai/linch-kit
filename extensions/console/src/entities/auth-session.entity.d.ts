/**
 * 认证会话实体定义
 *
 * 用于Console认证管理功能的会话数据模型
 */
/**
 * 认证会话状态
 */
export declare const AuthSessionStatusEnum: readonly ["active", "expired", "revoked", "inactive"];
export type AuthSessionStatus = typeof AuthSessionStatusEnum[number];
/**
 * 认证会话实体
 */
export declare const AuthSessionEntity: import("@linch-kit/schema").Entity<Record<string, unknown>>;
/**
 * 认证性能指标实体
 */
export declare const AuthMetricsEntity: import("@linch-kit/schema").Entity<Record<string, unknown>>;
/**
 * 认证配置实体
 */
export declare const AuthConfigEntity: import("@linch-kit/schema").Entity<Record<string, unknown>>;
/**
 * 导出认证管理实体集合
 */
export declare const AuthManagementEntities: {
    readonly AuthSession: import("@linch-kit/schema").Entity<Record<string, unknown>>;
    readonly AuthMetrics: import("@linch-kit/schema").Entity<Record<string, unknown>>;
    readonly AuthConfig: import("@linch-kit/schema").Entity<Record<string, unknown>>;
};
//# sourceMappingURL=auth-session.entity.d.ts.map