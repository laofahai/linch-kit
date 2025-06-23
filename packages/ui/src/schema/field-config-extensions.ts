/**
 * Schema 包的模块扩展
 *
 * 通过 TypeScript 模块扩展的方式，将复杂的 UI 类型添加到 FieldConfig 接口中
 * 这样可以显著提升 Schema 包的 DTS 构建性能，同时保持功能完整性
 */

import type {
  TableFieldConfig,
  FormFieldConfig,
  PermissionFieldConfig,
  TransformFieldConfig,
  VirtualFieldConfig,
} from '@linch-kit/schema'

// 扩展 @linch-kit/schema 包中的 FieldConfig 接口
declare module '@linch-kit/schema' {
  interface FieldConfig {
    /** DataTable 列配置 */
    table?: TableFieldConfig
    /** FormBuilder 字段配置 */
    form?: FormFieldConfig
    /** 字段级别权限 */
    permissions?: PermissionFieldConfig
    /** 数据转换配置 */
    transform?: TransformFieldConfig
    /** 虚拟字段配置 */
    virtual?: VirtualFieldConfig
  }
}

// 重新导出扩展的类型，确保类型可用
export type {
  TableFieldConfig,
  FormFieldConfig,
  PermissionFieldConfig,
  TransformFieldConfig,
  VirtualFieldConfig,
} from '@linch-kit/schema'
