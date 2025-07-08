/**
 * @linch-kit/schema 装饰器系统导出
 *
 * 提供基于装饰器的Schema定义方式，支持类和属性装饰器
 *
 * @module decorators
 */

// ==================== 装饰器系统导出 ====================
/**
 * 完整的装饰器系统实现
 * 包含实体装饰器、字段装饰器、链式装饰器等
 */
export {
  ChainField,
  Default,
  Description,
  Entity,
  Field,
  getEntitiesFromClasses,
  getEntityFromClass,
  Index,
  Required,
  SoftDelete,
  Table,
  Timestamps,
  Unique,
} from './minimal'
