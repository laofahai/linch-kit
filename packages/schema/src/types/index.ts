/**
 * @linch-kit/schema 类型定义统一导出
 *
 * 这个文件作为类型定义的统一入口，按功能模块分组导出所有类型定义
 * 保持向后兼容性，同时提供分类的类型导入
 *
 * @module types
 */

// ==================== 字段相关类型 ====================
/**
 * 字段类型定义
 * 包含所有字段类型、选项、验证规则等
 */
export type {
    ArrayFieldOptions, BaseFieldDefinition, BooleanFieldOptions, CustomFieldTypeConfig, DateFieldOptions, EmailFieldOptions, EnumFieldOptions, FieldDefinition, FieldPermissions, FieldType, I18nFieldConfig, I18nFieldOptions, JsonFieldOptions, NumberFieldOptions, PermissionRule, RelationFieldOptions, StringFieldOptions, TextFieldOptions, UrlFieldOptions,
    UuidFieldOptions, ValidationRule
} from './field'

// ==================== 实体相关类型 ====================
/**
 * 实体类型定义
 * 包含实体定义、权限、索引、钩子等
 */
export type {
    CreateInput, Entity, EntityDefinition, EntityHooks,
    EntityOptions, EntityPermissions,
    IndexDefinition, Migration,
    MigrationOperation, UpdateInput
} from './entity'

// ==================== 插件相关类型 ====================
/**
 * 插件系统类型定义
 * 包含代码生成器、插件接口等
 */
export type {
    CodeGeneratorOptions, GeneratedFile, Generator, GeneratorContext, GeneratorHooks, SchemaContext, SchemaPlugin
} from './plugin'

