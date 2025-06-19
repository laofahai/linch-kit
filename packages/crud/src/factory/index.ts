/**
 * CRUD 工厂函数
 */

import { CRUDManager } from '../core/crud-manager'
import { withTRPC } from '../trpc'
import type {
  CRUDConfig,
  DataSource,
  CRUDPermissions,
  ValidationConfig,
  TRPCRouterOptions
} from '../types'

/**
 * 创建 CRUD 管理器
 */
export function createCRUD<T>(config: CRUDConfig<T>): CRUDManager<T> {
  return new CRUDManager<T>(config)
}

/**
 * 从 Schema 创建 CRUD 管理器
 */
export function createCRUDFromSchema<T>(
  entity: any, // EntityDefinition<T> from @linch-kit/schema
  options: {
    dataSource: DataSource<T>
    permissions?: CRUDPermissions
    validation?: ValidationConfig
    name?: string
    resource?: string
  }
): CRUDManager<T> {
  const config: CRUDConfig<T> = {
    name: options.name || entity.name || 'crud',
    resource: options.resource || entity.name || 'resource',
    dataSource: options.dataSource,
    ...(options.permissions && { permissions: options.permissions }),
    ...(options.validation && { validation: options.validation }),
    schema: {
      entity,
      autoInfer: {
        fields: true,
        relations: true,
        permissions: false,
        validation: true
      }
    }
  }

  return new CRUDManager<T>(config)
}

/**
 * 创建带认证的 CRUD 管理器
 */
export function createCRUDWithAuth<T>(
  config: CRUDConfig<T>,
  authConfig: {
    permissions: CRUDPermissions
    validation?: ValidationConfig
  }
): CRUDManager<T> {
  const enhancedConfig: CRUDConfig<T> = {
    ...config,
    permissions: authConfig.permissions,
    ...(authConfig.validation && { validation: authConfig.validation })
  }

  return new CRUDManager<T>(enhancedConfig)
}

/**
 * 创建带 tRPC 集成的 CRUD 管理器
 */
export function createCRUDWithTRPC<T>(
  config: CRUDConfig<T>,
  trpcOptions: Partial<TRPCRouterOptions> = {}
): CRUDManager<T> & { 
  generateTRPCRouter: (opts?: Partial<TRPCRouterOptions>) => any 
} {
  const manager = new CRUDManager<T>(config)
  return withTRPC(manager, trpcOptions)
}

/**
 * 创建完整的 CRUD 解决方案
 */
export function createFullCRUD<T>(options: {
  // 基础配置
  name: string
  resource: string
  dataSource: DataSource<T>
  
  // Schema 集成
  entity?: any
  
  // 权限配置
  permissions?: CRUDPermissions
  
  // 验证配置
  validation?: ValidationConfig
  
  // tRPC 集成
  trpc?: {
    enabled: boolean
    basePath?: string
    options?: Partial<TRPCRouterOptions>
  }
  
  // 调试模式
  debug?: boolean
}): CRUDManager<T> & { 
  generateTRPCRouter?: (opts?: Partial<TRPCRouterOptions>) => any 
} {
  // 构建基础配置
  const config: CRUDConfig<T> = {
    name: options.name,
    resource: options.resource,
    dataSource: options.dataSource,
    ...(options.permissions && { permissions: options.permissions }),
    ...(options.validation && { validation: options.validation }),
    ...(options.debug !== undefined && { debug: options.debug })
  }

  // 添加 Schema 集成
  if (options.entity) {
    config.schema = {
      entity: options.entity,
      autoInfer: {
        fields: true,
        relations: true,
        permissions: !!options.permissions,
        validation: !!options.validation
      }
    }
  }

  // 创建基础管理器
  let manager = new CRUDManager<T>(config)

  // 添加 tRPC 集成
  if (options.trpc?.enabled) {
    const trpcOptions: Partial<TRPCRouterOptions> = {
      basePath: options.trpc.basePath || options.resource,
      ...options.trpc.options
    }
    manager = withTRPC(manager, trpcOptions) as any
  }

  return manager as any
}

/**
 * 创建内存数据源
 */
export function createMemoryDataSource<T>(
  initialData: T[] = [],
  options: {
    idField?: keyof T
    generateId?: () => string
  } = {}
): DataSource<T> {
  const data = [...initialData]
  const idField = options.idField || ('id' as keyof T)
  const generateId = options.generateId || (() => Math.random().toString(36).substring(7))

  return {
    async list(options) {
      const page = options?.pagination?.page || 1
      const limit = options?.pagination?.limit || 10
      const offset = (page - 1) * limit

      let filteredData = [...data]

      // 应用筛选
      if (options?.filters) {
        for (const filter of options.filters) {
          filteredData = filteredData.filter(item => {
            const value = (item as any)[filter.field]
            switch (filter.operator) {
              case 'eq':
                return value === filter.value
              case 'ne':
                return value !== filter.value
              case 'like':
                return String(value).includes(String(filter.value))
              default:
                return true
            }
          })
        }
      }

      // 应用排序
      if (options?.sort) {
        for (const sort of options.sort) {
          filteredData.sort((a, b) => {
            const aVal = (a as any)[sort.field]
            const bVal = (b as any)[sort.field]
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
            return sort.direction === 'desc' ? -comparison : comparison
          })
        }
      }

      const total = filteredData.length
      const paginatedData = filteredData.slice(offset, offset + limit)

      return {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: page > 1,
          offset
        }
      }
    },

    async get(id) {
      return data.find(item => (item as any)[idField] === id) || null
    },

    async search(options) {
      const query = options.query.toLowerCase()
      const searchFields = options.fields || Object.keys(data[0] || {})
      
      const filteredData = data.filter(item => {
        return searchFields.some(field => {
          const value = String((item as any)[field]).toLowerCase()
          return value.includes(query)
        })
      })

      return {
        data: filteredData,
        pagination: {
          page: 1,
          limit: filteredData.length,
          total: filteredData.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
          offset: 0
        }
      }
    },

    async count() {
      return data.length
    },

    async create(input) {
      const id = generateId()
      const item = { ...input, [idField]: id } as T
      data.push(item)
      return item
    },

    async update(id, updates) {
      const index = data.findIndex(item => (item as any)[idField] === id)
      if (index === -1) {
        throw new Error(`Item with id ${id} not found`)
      }

      data[index] = { ...data[index], ...updates } as T
      return data[index]
    },

    async delete(id) {
      const index = data.findIndex(item => (item as any)[idField] === id)
      if (index === -1) {
        throw new Error(`Item with id ${id} not found`)
      }
      
      data.splice(index, 1)
    }
  }
}

/**
 * 创建 REST 数据源
 */
export function createRESTDataSource<T>(config: {
  baseURL: string
  endpoints?: {
    list?: string
    get?: string
    create?: string
    update?: string
    delete?: string
    search?: string
  }
  headers?: Record<string, string>
}): DataSource<T> {
  const endpoints = {
    list: '',
    get: '/:id',
    create: '',
    update: '/:id',
    delete: '/:id',
    search: '/search',
    ...config.endpoints
  }

  const headers = {
    'Content-Type': 'application/json',
    ...config.headers
  }

  return {
    async list(options) {
      const url = new URL(config.baseURL + endpoints.list)
      
      if (options?.pagination) {
        url.searchParams.set('page', String(options.pagination.page))
        url.searchParams.set('limit', String(options.pagination.limit))
      }

      const response = await fetch(url.toString(), { headers })
      return response.json()
    },

    async get(id) {
      const url = config.baseURL + endpoints.get.replace(':id', id)
      const response = await fetch(url, { headers })
      return response.json()
    },

    async search(options) {
      const url = new URL(config.baseURL + endpoints.search)
      url.searchParams.set('q', options.query)
      
      const response = await fetch(url.toString(), { headers })
      return response.json()
    },

    async count() {
      const result = await this.list({ pagination: { page: 1, limit: 1 } })
      return result.pagination.total
    },

    async create(data) {
      const url = config.baseURL + endpoints.create
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      })
      return response.json()
    },

    async update(id, data) {
      const url = config.baseURL + endpoints.update.replace(':id', id)
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      })
      return response.json()
    },

    async delete(id) {
      const url = config.baseURL + endpoints.delete.replace(':id', id)
      await fetch(url, {
        method: 'DELETE',
        headers
      })
    }
  }
}
