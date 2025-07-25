/**
 * 用户扩展实体定义
 *
 * 扩展 @linch-kit/auth 的用户实体，添加 Console 特定的字段
 */
import { z } from 'zod';
export interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    notifications?: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
    };
    dashboard?: {
        layout?: string;
        widgets?: string[];
    };
}
export declare const ConsoleUserExtensions: {
    lastLoginAt: import("@linch-kit/schema").DateFieldOptions;
    lastActiveAt: import("@linch-kit/schema").DateFieldOptions;
    lastLoginIp: import("@linch-kit/schema").StringFieldOptions | import("@linch-kit/schema").TextFieldOptions | import("@linch-kit/schema").EmailFieldOptions | import("@linch-kit/schema").UrlFieldOptions | import("@linch-kit/schema").UuidFieldOptions;
    loginCount: import("@linch-kit/schema").NumberFieldOptions;
    preferences: import("@linch-kit/schema").JsonFieldOptions;
    displayBirthday: import("@linch-kit/schema").BooleanFieldOptions;
    currentTenantId: import("@linch-kit/schema").StringFieldOptions | import("@linch-kit/schema").TextFieldOptions | import("@linch-kit/schema").EmailFieldOptions | import("@linch-kit/schema").UrlFieldOptions | import("@linch-kit/schema").UuidFieldOptions;
    isSystemAdmin: import("@linch-kit/schema").BooleanFieldOptions;
    apiKey: import("@linch-kit/schema").StringFieldOptions | import("@linch-kit/schema").TextFieldOptions | import("@linch-kit/schema").EmailFieldOptions | import("@linch-kit/schema").UrlFieldOptions | import("@linch-kit/schema").UuidFieldOptions;
    apiKeyCreatedAt: import("@linch-kit/schema").DateFieldOptions;
    apiKeyLastUsedAt: import("@linch-kit/schema").DateFieldOptions;
};
/**
 * 用户活动实体 - 用户活动追踪
 */
export declare const UserActivityEntity: import("@linch-kit/schema").Entity<Record<string, unknown>>;
/**
 * 用户通知实体 - 系统通知
 */
export declare const UserNotificationEntity: import("@linch-kit/schema").Entity<Record<string, unknown>>;
export type UserActivity = z.infer<typeof UserActivityEntity.zodSchema>;
export type UserActivityInput = z.infer<typeof UserActivityEntity.createSchema>;
export type UserNotification = z.infer<typeof UserNotificationEntity.zodSchema>;
export type UserNotificationInput = z.infer<typeof UserNotificationEntity.createSchema>;
export type UserNotificationUpdate = z.infer<typeof UserNotificationEntity.updateSchema>;
//# sourceMappingURL=user-extensions.entity.d.ts.map