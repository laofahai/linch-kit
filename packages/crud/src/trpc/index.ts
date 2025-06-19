/**
 * tRPC 集成主入口
 */

export * from './router-generator'
export * from '../types/trpc-integration'

import type { CRUDManager } from '../core/crud-manager'
import type {
  TRPCRouterOptions,
  TRPCRouter,
  TRPCClientOptions,
  TRPCClient
} from '../types/trpc-integration'

import { CRUDTRPCRouter } from './router-generator'

/**
 * 从 CRUD 管理器生成 tRPC 路由
 */
export function generateCRUDRouter<T>(
  manager: CRUDManager<T>,
  options: TRPCRouterOptions
): TRPCRouter {
  const generator = new CRUDTRPCRouter(manager)
  return generator.generateRouter(options)
}

/**
 * 创建默认的 tRPC 路由选项
 */
export function createDefaultTRPCOptions(basePath: string): TRPCRouterOptions {
  return {
    basePath,
    procedures: {
      list: true,
      get: true,
      create: true,
      update: true,
      delete: true,
      search: true,
      bulkOperations: false,
      count: true,
      export: false,
      import: false
    },
    middleware: {
      auth: true,
      permissions: true,
      validation: true,
      logging: false,
      rateLimit: false,
      cache: false
    }
  }
}

/**
 * 创建完整的 CRUD tRPC 路由选项
 */
export function createFullCRUDTRPCOptions(basePath: string): TRPCRouterOptions {
  return {
    basePath,
    procedures: {
      list: true,
      get: true,
      create: true,
      update: true,
      delete: true,
      search: true,
      bulkOperations: true,
      count: true,
      export: true,
      import: true
    },
    middleware: {
      auth: true,
      permissions: true,
      validation: true,
      logging: true,
      rateLimit: true,
      cache: true
    }
  }
}

/**
 * 创建只读的 tRPC 路由选项
 */
export function createReadOnlyTRPCOptions(basePath: string): TRPCRouterOptions {
  return {
    basePath,
    procedures: {
      list: true,
      get: true,
      create: false,
      update: false,
      delete: false,
      search: true,
      bulkOperations: false,
      count: true,
      export: true,
      import: false
    },
    middleware: {
      auth: true,
      permissions: true,
      validation: false,
      logging: false,
      rateLimit: true,
      cache: true
    }
  }
}

/**
 * 为 CRUD 管理器添加 tRPC 支持
 */
export function withTRPC<T>(
  manager: CRUDManager<T>,
  options: Partial<TRPCRouterOptions> = {}
): CRUDManager<T> & { 
  generateTRPCRouter: (opts?: Partial<TRPCRouterOptions>) => TRPCRouter 
} {
  const defaultOptions = createDefaultTRPCOptions(options.basePath || 'crud')
  const finalOptions = { ...defaultOptions, ...options }

  // 扩展管理器，添加 tRPC 生成方法
  const extendedManager = manager as any
  
  extendedManager.generateTRPCRouter = (opts?: Partial<TRPCRouterOptions>) => {
    const routerOptions = opts ? { ...finalOptions, ...opts } : finalOptions
    return generateCRUDRouter(manager, routerOptions)
  }

  return extendedManager
}

/**
 * 批量生成多个 CRUD 路由
 */
export function generateMultipleCRUDRouters(
  managers: Array<{
    name: string
    manager: CRUDManager<any>
    options?: Partial<TRPCRouterOptions>
  }>
): Record<string, TRPCRouter> {
  const routers: Record<string, TRPCRouter> = {}

  for (const { name, manager, options = {} } of managers) {
    const defaultOptions = createDefaultTRPCOptions(name)
    const finalOptions = { ...defaultOptions, ...options }
    routers[name] = generateCRUDRouter(manager, finalOptions)
  }

  return routers
}

/**
 * 创建 tRPC 客户端工厂
 */
export function createTRPCClientFactory<T>(
  _options: TRPCClientOptions
): (basePath: string) => TRPCClient<T> {
  return (basePath: string) => {
    // 这里应该集成实际的 tRPC 客户端
    // 临时返回一个模拟的客户端接口
    return {
      list: {
        query: async (input?: any) => {
          // 实际的 tRPC 客户端调用
          console.log('tRPC list query:', { basePath, input })
          return { data: [], pagination: { page: 1, limit: 10, total: 0 } }
        },
        useQuery: (input?: any) => {
          // React Query hook
          console.log('tRPC list useQuery:', { basePath, input })
          return { data: null, isLoading: false, error: null }
        }
      },
      get: {
        query: async (input: { id: string }) => {
          console.log('tRPC get query:', { basePath, input })
          return null
        },
        useQuery: (input: { id: string }) => {
          console.log('tRPC get useQuery:', { basePath, input })
          return { data: null, isLoading: false, error: null }
        }
      },
      create: {
        mutate: async (input: any) => {
          console.log('tRPC create mutation:', { basePath, input })
          return { success: true, data: input }
        },
        useMutation: () => {
          console.log('tRPC create useMutation:', { basePath })
          return { mutate: () => {}, isLoading: false, error: null }
        }
      },
      update: {
        mutate: async (input: { id: string; data: any }) => {
          console.log('tRPC update mutation:', { basePath, input })
          return { success: true, data: input.data }
        },
        useMutation: () => {
          console.log('tRPC update useMutation:', { basePath })
          return { mutate: () => {}, isLoading: false, error: null }
        }
      },
      delete: {
        mutate: async (input: { id: string }) => {
          console.log('tRPC delete mutation:', { basePath, input })
          return { success: true }
        },
        useMutation: () => {
          console.log('tRPC delete useMutation:', { basePath })
          return { mutate: () => {}, isLoading: false, error: null }
        }
      }
    } as TRPCClient<T>
  }
}

/**
 * 验证 tRPC 路由配置
 */
export function validateTRPCOptions(options: TRPCRouterOptions): string[] {
  const errors: string[] = []

  if (!options.basePath) {
    errors.push('basePath is required')
  }

  if (!options.procedures) {
    errors.push('procedures configuration is required')
  }

  if (!options.middleware) {
    errors.push('middleware configuration is required')
  }

  // 检查程序配置
  const procedures = options.procedures
  if (procedures) {
    const hasAnyProcedure = Object.values(procedures).some(Boolean)
    if (!hasAnyProcedure) {
      errors.push('At least one procedure must be enabled')
    }
  }

  return errors
}

/**
 * 创建 tRPC 路由元数据
 */
export function createTRPCRouterMeta(options: TRPCRouterOptions) {
  return {
    basePath: options.basePath,
    procedures: Object.entries(options.procedures)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name),
    middleware: Object.entries(options.middleware)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name),
    auth: options.auth,
    createdAt: new Date().toISOString()
  }
}
