// Common type definitions

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

/**
 * 基础模型类，提供通用方法
 */
export abstract class BaseModel implements BaseEntity {
  id!: string
  createdAt!: Date
  updatedAt!: Date
  deletedAt?: Date | null

  /**
   * 检查实体是否被软删除
   */
  isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined
  }

  /**
   * 软删除实体
   */
  softDelete(): void {
    this.deletedAt = new Date()
  }

  /**
   * 恢复软删除的实体
   */
  restore(): void {
    this.deletedAt = null
  }

  /**
   * 获取实体的JSON表示
   */
  toJSON(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(this)) {
      if (value !== undefined) {
        result[key] = value
      }
    }
    return result
  }

  /**
   * 从普通对象创建实体实例
   */
  static fromJSON<T extends BaseModel>(this: new () => T, data: Record<string, any>): T {
    const instance = new this()
    Object.assign(instance, data)
    return instance
  }

  /**
   * 克隆实体
   */
  clone<T extends BaseModel>(this: T): T {
    const Constructor = this.constructor as new () => T
    return Constructor.prototype.constructor.fromJSON(this.toJSON())
  }

  /**
   * 比较两个实体是否相等（基于ID）
   */
  equals(other: BaseEntity): boolean {
    return this.id === other.id
  }

  /**
   * 获取实体的字符串表示
   */
  toString(): string {
    return `${this.constructor.name}(id=${this.id})`
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
