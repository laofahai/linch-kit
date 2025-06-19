/**
 * tRPC 路由生成器
 */

import { z } from 'zod'

import type { CRUDManager } from '../core/crud-manager'
import type {
  TRPCRouterOptions,
  ProcedureConfig,
  MiddlewareConfig
} from '../types/trpc-integration'

/**
 * tRPC 路由生成器类
 */
export class CRUDTRPCRouter<T> {
  constructor(private manager: CRUDManager<T>) {}

  /**
   * 生成完整的 tRPC 路由
   */
  generateRouter(options: TRPCRouterOptions): any {
    const procedures = this.generateProcedures(options.procedures)
    const middleware = this.generateMiddleware(options.middleware)
    
    return {
      ...procedures,
      _meta: {
        basePath: options.basePath,
        middleware,
        auth: options.auth
      }
    }
  }

  /**
   * 生成所有程序
   */
  generateProcedures(config: ProcedureConfig): Record<string, any> {
    const procedures: Record<string, any> = {}

    if (config.list) {
      procedures.list = this.generateListProcedure()
    }

    if (config.get) {
      procedures.get = this.generateGetProcedure()
    }

    if (config.create) {
      procedures.create = this.generateCreateProcedure()
    }

    if (config.update) {
      procedures.update = this.generateUpdateProcedure()
    }

    if (config.delete) {
      procedures.delete = this.generateDeleteProcedure()
    }

    if (config.search) {
      procedures.search = this.generateSearchProcedure()
    }

    if (config.bulkOperations) {
      procedures.bulkCreate = this.generateBulkCreateProcedure()
      procedures.bulkUpdate = this.generateBulkUpdateProcedure()
      procedures.bulkDelete = this.generateBulkDeleteProcedure()
    }

    return procedures
  }

  /**
   * 生成列表查询程序
   */
  generateListProcedure(): any {
    return {
      input: z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        sort: z.array(z.object({
          field: z.string(),
          direction: z.enum(['asc', 'desc'])
        })).optional(),
        filters: z.array(z.object({
          field: z.string(),
          operator: z.string(),
          value: z.any()
        })).optional(),
        search: z.object({
          query: z.string(),
          fields: z.array(z.string()).optional()
        }).optional(),
        fields: z.array(z.string()).optional(),
        include: z.array(z.string()).optional()
      }).optional(),
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        const options = input ? {
          pagination: {
            page: input.page,
            limit: input.limit,
            offset: (input.page - 1) * input.limit
          },
          sort: input.sort,
          filters: input.filters,
          search: input.search,
          fields: input.fields,
          include: input.include
        } : undefined

        return operations.list(options, ctx)
      }
    }
  }

  /**
   * 生成获取单项程序
   */
  generateGetProcedure(): any {
    return {
      input: z.object({
        id: z.string()
      }),
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        return operations.get(input.id, ctx)
      }
    }
  }

  /**
   * 生成创建程序
   */
  generateCreateProcedure(): any {
    return {
      input: z.record(z.any()), // 动态输入，基于 Schema
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        return operations.create(input, ctx)
      }
    }
  }

  /**
   * 生成更新程序
   */
  generateUpdateProcedure(): any {
    return {
      input: z.object({
        id: z.string(),
        data: z.record(z.any()) // 动态输入，基于 Schema
      }),
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        return operations.update(input.id, input.data, ctx)
      }
    }
  }

  /**
   * 生成删除程序
   */
  generateDeleteProcedure(): any {
    return {
      input: z.object({
        id: z.string()
      }),
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        return operations.delete(input.id, ctx)
      }
    }
  }

  /**
   * 生成搜索程序
   */
  generateSearchProcedure(): any {
    return {
      input: z.object({
        query: z.string(),
        fields: z.array(z.string()).optional(),
        fuzzy: z.boolean().optional(),
        highlight: z.boolean().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10)
      }),
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        return operations.search(input, ctx)
      }
    }
  }

  /**
   * 生成批量创建程序
   */
  generateBulkCreateProcedure(): any {
    return {
      input: z.object({
        data: z.array(z.record(z.any()))
      }),
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        return operations.bulkCreate(input.data, ctx)
      }
    }
  }

  /**
   * 生成批量更新程序
   */
  generateBulkUpdateProcedure(): any {
    return {
      input: z.object({
        updates: z.array(z.object({
          id: z.string(),
          data: z.record(z.any())
        }))
      }),
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        return operations.bulkUpdate(input.updates, ctx)
      }
    }
  }

  /**
   * 生成批量删除程序
   */
  generateBulkDeleteProcedure(): any {
    return {
      input: z.object({
        ids: z.array(z.string())
      }),
      
      async resolve({ input, ctx }: any) {
        const operations = this.manager.operations()
        return operations.bulkDelete(input.ids, ctx)
      }
    }
  }

  /**
   * 生成中间件配置
   */
  generateMiddleware(config: MiddlewareConfig): any {
    const middleware: any[] = []

    if (config.auth) {
      middleware.push(this.createAuthMiddleware())
    }

    if (config.permissions) {
      middleware.push(this.createPermissionMiddleware())
    }

    if (config.validation) {
      middleware.push(this.createValidationMiddleware())
    }

    if (config.logging) {
      middleware.push(this.createLoggingMiddleware())
    }

    return middleware
  }

  /**
   * 创建认证中间件
   */
  private createAuthMiddleware(): any {
    return async ({ ctx, next }: any) => {
      // 基础认证检查
      if (!ctx?.user) {
        throw new Error('Authentication required')
      }
      return next()
    }
  }

  /**
   * 创建权限中间件
   */
  private createPermissionMiddleware(): any {
    return async ({ ctx, next }: any) => {
      const permissionManager = this.manager.permissions()
      if (permissionManager) {
        // 这里可以添加具体的权限检查逻辑
        // 基于操作类型和上下文进行权限验证
        console.log('Permission check for user:', ctx.user?.id)
      }
      return next()
    }
  }

  /**
   * 创建验证中间件
   */
  private createValidationMiddleware(): any {
    return async ({ next }: any) => {
      // 基于 Schema 进行输入验证
      const schemaAdapter = this.manager.schema()
      if (schemaAdapter) {
        // 这里可以添加基于 Schema 的验证逻辑
      }
      return next()
    }
  }

  /**
   * 创建日志中间件
   */
  private createLoggingMiddleware(): any {
    return async ({ ctx, next }: any) => {
      const start = Date.now()
      try {
        const result = await next()
        const duration = Date.now() - start
        console.log(`CRUD operation completed in ${duration}ms`, {
          user: ctx.user?.id,
          duration
        })
        return result
      } catch (error) {
        const duration = Date.now() - start
        console.error(`CRUD operation failed in ${duration}ms`, {
          user: ctx.user?.id,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    }
  }

  /**
   * 基于 Schema 生成输入验证
   */
  generateInputSchema(operation: 'create' | 'update'): z.ZodSchema {
    const schemaAdapter = this.manager.schema()
    if (!schemaAdapter) {
      return z.record(z.any())
    }

    const fields = schemaAdapter.getFields()
    const schemaObject: Record<string, z.ZodTypeAny> = {}

    for (const field of fields) {
      if (operation === 'update' || !field.readonly) {
        let fieldSchema: z.ZodTypeAny

        switch (field.type) {
          case 'string':
            fieldSchema = z.string()
            if (field.validation?.minLength) {
              fieldSchema = (fieldSchema as z.ZodString).min(field.validation.minLength)
            }
            if (field.validation?.maxLength) {
              fieldSchema = (fieldSchema as z.ZodString).max(field.validation.maxLength)
            }
            break
          case 'number':
            fieldSchema = z.number()
            if (field.validation?.min !== undefined) {
              fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min)
            }
            if (field.validation?.max !== undefined) {
              fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max)
            }
            break
          case 'boolean':
            fieldSchema = z.boolean()
            break
          case 'date':
          case 'datetime':
            fieldSchema = z.date()
            break
          case 'email':
            fieldSchema = z.string().email()
            break
          case 'url':
            fieldSchema = z.string().url()
            break
          default:
            fieldSchema = z.any()
        }

        if (!field.required || operation === 'update') {
          fieldSchema = fieldSchema.optional()
        }

        schemaObject[String(field.name)] = fieldSchema
      }
    }

    return z.object(schemaObject)
  }
}
