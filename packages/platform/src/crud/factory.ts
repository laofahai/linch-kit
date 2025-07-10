/**
 * CRUD Factory - 创建实体CRUD管理器的工厂函数
 * @module platform/crud/factory
 */

import { z } from 'zod'
import type { ExtensionContext } from '@linch-kit/core'
import { CrudManager } from './crud-manager'
import type { BaseEntity, QueryOptions } from './types'

/**
 * 实体定义接口
 */
export interface EntityDefinition<T extends BaseEntity = BaseEntity> {
  /** 实体名称 */
  name: string
  /** Zod Schema 验证 */
  schema: z.ZodSchema<T>
  /** 配置选项 */
  config?: {
    /** 数据表名 */
    tableName?: string
    /** 主键字段 */
    primaryKey?: string
    /** 是否启用时间戳 */
    timestamps?: boolean
  }
}

/**
 * CRUD操作接口
 */
export interface CRUDOperations<T extends BaseEntity = BaseEntity> {
  /** 创建记录 */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: T; error?: string }>
  
  /** 根据ID查找记录 */
  findById(id: string | number): Promise<{ success: boolean; data?: T; error?: string }>
  
  /** 查找第一条记录 */
  findFirst(options?: { where?: Partial<T> }): Promise<{ success: boolean; data?: T; error?: string }>
  
  /** 查找多条记录 */
  findMany(options?: QueryOptions<T>): Promise<{ success: boolean; data?: T[]; error?: string }>
  
  /** 更新记录 */
  update(id: string | number, data: Partial<T>): Promise<{ success: boolean; data?: T; error?: string }>
  
  /** 删除记录 */
  delete(id: string | number): Promise<{ success: boolean; error?: string }>
  
  /** 计数 */
  count(options?: { where?: Partial<T> }): Promise<{ success: boolean; data?: number; error?: string }>
}

/**
 * CRUD选项
 */
export interface CRUDOptions {
  /** Extension上下文 */
  extensionContext?: ExtensionContext
  /** 是否启用缓存 */
  enableCache?: boolean
  /** 是否启用权限检查 */
  enablePermissions?: boolean
  /** 是否启用审计日志 */
  enableAudit?: boolean
}

/**
 * 创建CRUD管理器
 */
export function createCRUD<T extends BaseEntity = BaseEntity>(
  entityDef: EntityDefinition<T>,
  options: CRUDOptions = {}
): CRUDOperations<T> {
  // 创建底层CrudManager实例
  const _manager = new CrudManager({
    extensionContext: options.extensionContext,
    enableCache: options.enableCache ?? true,
    enablePermissions: options.enablePermissions ?? true,
    enableAudit: options.enableAudit ?? true,
  })

  // 模拟数据存储（实际项目中应该连接真实数据库）
  const mockDataStore = new Map<string | number, T>()
  let nextId = 1

  // 返回CRUD操作接口
  return {
    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: T; error?: string }> {
      try {
        // 验证数据
        const validationResult = entityDef.schema.safeParse({
          ...data,
          id: nextId++,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        if (!validationResult.success) {
          return {
            success: false,
            error: `Validation failed: ${validationResult.error.message}`,
          }
        }

        const record = validationResult.data as T
        mockDataStore.set(record.id, record)

        return {
          success: true,
          data: record,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },

    async findById(id: string | number): Promise<{ success: boolean; data?: T; error?: string }> {
      try {
        const record = mockDataStore.get(id)
        return {
          success: true,
          data: record,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },

    async findFirst(options?: { where?: Partial<T> }): Promise<{ success: boolean; data?: T; error?: string }> {
      try {
        const records = Array.from(mockDataStore.values())
        
        if (!options?.where) {
          return {
            success: true,
            data: records[0],
          }
        }

        const record = records.find(record => {
          return Object.entries(options.where!).every(([key, value]) => {
            return (record as any)[key] === value
          })
        })

        return {
          success: true,
          data: record,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },

    async findMany(options?: QueryOptions<T>): Promise<{ success: boolean; data?: T[]; error?: string }> {
      try {
        let records = Array.from(mockDataStore.values())

        // 应用where条件
        if (options?.where) {
          records = records.filter(record => {
            return Object.entries(options.where!).every(([key, value]) => {
              return (record as any)[key] === value
            })
          })
        }

        // 应用排序
        if (options?.orderBy && options.orderBy.length > 0) {
          records.sort((a, b) => {
            for (const sort of options.orderBy!) {
              const aVal = (a as any)[sort.field]
              const bVal = (b as any)[sort.field]
              
              if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
              if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
            }
            return 0
          })
        }

        // 应用分页
        if (options?.limit || options?.offset) {
          const offset = options.offset || 0
          const limit = options.limit
          records = records.slice(offset, limit ? offset + limit : undefined)
        }

        return {
          success: true,
          data: records,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },

    async update(id: string | number, data: Partial<T>): Promise<{ success: boolean; data?: T; error?: string }> {
      try {
        const existingRecord = mockDataStore.get(id)
        if (!existingRecord) {
          return {
            success: false,
            error: 'Record not found',
          }
        }

        const updatedRecord = {
          ...existingRecord,
          ...data,
          updatedAt: new Date(),
        } as T

        // 验证更新后的数据
        const validationResult = entityDef.schema.safeParse(updatedRecord)
        if (!validationResult.success) {
          return {
            success: false,
            error: `Validation failed: ${validationResult.error.message}`,
          }
        }

        mockDataStore.set(id, validationResult.data as T)

        return {
          success: true,
          data: validationResult.data as T,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },

    async delete(id: string | number): Promise<{ success: boolean; error?: string }> {
      try {
        const existed = mockDataStore.has(id)
        if (!existed) {
          return {
            success: false,
            error: 'Record not found',
          }
        }

        mockDataStore.delete(id)
        return {
          success: true,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },

    async count(options?: { where?: Partial<T> }): Promise<{ success: boolean; data?: number; error?: string }> {
      try {
        let records = Array.from(mockDataStore.values())

        if (options?.where) {
          records = records.filter(record => {
            return Object.entries(options.where!).every(([key, value]) => {
              return (record as any)[key] === value
            })
          })
        }

        return {
          success: true,
          data: records.length,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },
  }
}