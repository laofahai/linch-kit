import { z } from 'zod';

/**
 * 核心类型定义 - 零依赖的基础类型
 *
 * 这个文件包含最基础的类型定义，避免复杂的类型推导
 * 目标：提升 DTS 构建性能，保持类型安全
 */

/**
 * 字段元数据（简化版）
 */
interface FieldMetadata {
    /** 字段名 */
    name?: string;
    /** 字段类型 */
    type?: string;
    /** 是否为主键 */
    isPrimary?: boolean;
    /** 是否唯一 */
    isUnique?: boolean;
    /** 是否可空 */
    isOptional?: boolean;
    /** 默认值 */
    defaultValue?: unknown;
}
/**
 * 实体元数据（简化版）
 */
interface EntityMetadata {
    /** 实体名称 */
    name: string;
    /** 表名 */
    tableName?: string;
    /** 字段元数据 */
    fields?: Record<string, FieldMetadata>;
    /** 索引配置 */
    indexes?: Array<{
        fields: string[];
        unique?: boolean;
        name?: string;
    }>;
}
/**
 * 简化的 Zod Schema 扩展
 * 移除复杂的泛型参数，防止无限类型递归
 */
type CoreSchema = z.ZodObject<any> & {
    _meta?: EntityMetadata;
};
/**
 * 简化的实体定义接口
 */
interface CoreEntityDefinition {
    /** 实体名称 */
    name: string;
    /** Zod Schema */
    schema: CoreSchema;
    /** 元数据 */
    meta?: EntityMetadata;
}

/**
 * 多个实体测试 - 验证批量定义的性能
 */
declare const TestEntities: {
    User1: CoreEntityDefinition;
    User2: CoreEntityDefinition;
    User3: CoreEntityDefinition;
    User4: CoreEntityDefinition;
    User5: CoreEntityDefinition;
};
/**
 * 简单用户实体 - 使用优化版 API
 */
declare const SimpleUser: CoreEntityDefinition;
/**
 * 类型导出
 */
type SimpleUser = z.infer<typeof SimpleUser.schema>;
/**
 * 复杂用户实体 - 使用优化版 API，包含更多字段
 */
declare const ComplexUser: CoreEntityDefinition;
type ComplexUser = z.infer<typeof ComplexUser.schema>;
/**
 * Schema 导出
 */
declare const CreateSimpleUserSchema: z.ZodObject<Omit<any, "id" | "createdAt" | "updatedAt">, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    [x: number]: any;
    [x: symbol]: any;
}, {
    [x: string]: any;
    [x: number]: any;
    [x: symbol]: any;
}>;
declare const CreateComplexUserSchema: z.ZodObject<Omit<any, "id" | "createdAt" | "updatedAt">, z.UnknownKeysParam, z.ZodTypeAny, {
    [x: string]: any;
    [x: number]: any;
    [x: symbol]: any;
}, {
    [x: string]: any;
    [x: number]: any;
    [x: symbol]: any;
}>;
type CreateSimpleUser = z.infer<typeof CreateSimpleUserSchema>;
type CreateComplexUser = z.infer<typeof CreateComplexUserSchema>;
/**
 * 默认导出
 */
declare const _default: {
    SimpleUser: CoreEntityDefinition;
    ComplexUser: CoreEntityDefinition;
    TestEntities: {
        User1: CoreEntityDefinition;
        User2: CoreEntityDefinition;
        User3: CoreEntityDefinition;
        User4: CoreEntityDefinition;
        User5: CoreEntityDefinition;
    };
};

export { ComplexUser, type CreateComplexUser, CreateComplexUserSchema, type CreateSimpleUser, CreateSimpleUserSchema, SimpleUser, TestEntities, _default as default };
