/**
 * @linch-kit/trpc CLI命令集成
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import type { CLICommand } from '@linch-kit/core/cli'

// CLI 上下文类型
interface CLIContext {
  options: Record<string, unknown>
}

// 临时翻译函数
const useTrpcTranslation = () => (key: string, params?: Record<string, unknown>) => {
  const messages: Record<string, string> = {
    'trpc.generate.start': 'Starting tRPC router generation...',
    'trpc.generate.success': 'tRPC router generation completed successfully',
    'trpc.generate.error': 'tRPC router generation failed',
    'trpc.generate.noEntities': 'No entities found in schema',
    'trpc.generate.generating': 'Generating tRPC routers...',
    'trpc.generate.fileGenerated': 'Generated: {path}',
    'trpc.generate.completed': 'Generated {count} tRPC router files',
  }

  let message = messages[key] || key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      message = message.replace(`{${k}}`, String(v))
    })
  }
  return message
}

/**
 * tRPC路由生成命令
 */
export const generateTrpcCommand: CLICommand = {
  name: 'trpc:generate',
  description: 'Generate tRPC routers from schema definitions',
  category: 'trpc',
  options: [
    {
      name: '--schema',
      alias: '-s',
      description: 'Schema file or directory',
      defaultValue: './src/schema',
    },
    {
      name: '--output',
      alias: '-o',
      description: 'Output directory for generated tRPC routers',
      defaultValue: './src/trpc',
    },
    {
      name: '--crud',
      description: 'Generate CRUD operations for each entity',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--auth',
      description: 'Include authentication middleware',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--permissions',
      description: 'Include permission checks',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--validation',
      description: 'Include input validation',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: '--openapi',
      description: 'Generate OpenAPI documentation',
      type: 'boolean',
    },
    {
      name: '--client',
      description: 'Generate TypeScript client',
      type: 'boolean',
    },
  ],
  handler: async (context: CLIContext) => {
    const { options } = context
    const t = useTrpcTranslation()

    try {
      const {
        schema,
        output,
        crud,
        auth,
        permissions,
        validation,
        openapi,
        client,
      } = options as {
        schema: string
        output: string
        crud: boolean
        auth: boolean
        permissions: boolean
        validation: boolean
        openapi: boolean
        client: boolean
      }

      console.log(t('trpc.generate.start'))

      // 读取Schema定义
      const entities = await loadSchemaEntities(schema)
      
      if (entities.length === 0) {
        console.warn(t('trpc.generate.noEntities'))
        return { success: true, entities: [], files: [] }
      }

      console.log(t('trpc.generate.generating'))

      // 确保输出目录存在
      if (!existsSync(output)) {
        mkdirSync(output, { recursive: true })
      }

      // 生成配置
      const generationConfig = {
        entities,
        outputDir: output,
        crud,
        auth,
        permissions,
        validation,
        openapi,
        client,
      }

      // 生成文件
      const files = await generateTrpcFiles(generationConfig)

      // 写入文件
      for (const file of files) {
        const filePath = join(output, file.path)
        const dir = join(filePath, '..')
        
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
        
        writeFileSync(filePath, file.content, 'utf8')
        console.log(t('trpc.generate.fileGenerated', { path: file.path }))
      }

      console.log(t('trpc.generate.completed', { count: files.length }))
      console.log(t('trpc.generate.success'))

      return { success: true, entities, files }
    } catch (error) {
      console.error(
        t('trpc.generate.error', {
          message: error instanceof Error ? error.message : String(error),
        })
      )
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
}

// 辅助函数

/**
 * 加载Schema实体
 */
async function loadSchemaEntities(_schemaPath: string): Promise<Array<{ name: string; fields: Record<string, any> }>> {
  // 这里应该实现实际的Schema加载逻辑
  // 与 @linch-kit/schema 集成
  return []
}

/**
 * 生成tRPC文件
 */
async function generateTrpcFiles(config: {
  entities: Array<{ name: string; fields: Record<string, any> }>
  outputDir: string
  crud: boolean
  auth: boolean
  permissions: boolean
  validation: boolean
  openapi: boolean
  client: boolean
}): Promise<Array<{ path: string; content: string }>> {
  const files: Array<{ path: string; content: string }> = []

  // 生成根路由器
  files.push({
    path: 'index.ts',
    content: generateRootRouter(config),
  })

  // 为每个实体生成路由器
  for (const entity of config.entities) {
    files.push({
      path: `routers/${entity.name.toLowerCase()}.ts`,
      content: generateEntityRouter(entity, config),
    })
  }

  // 生成中间件
  if (config.auth) {
    files.push({
      path: 'middleware/auth.ts',
      content: generateAuthMiddleware(config),
    })
  }

  if (config.permissions) {
    files.push({
      path: 'middleware/permissions.ts',
      content: generatePermissionsMiddleware(config),
    })
  }

  // 生成类型定义
  files.push({
    path: 'types.ts',
    content: generateTrpcTypes(config),
  })

  // 生成OpenAPI文档
  if (config.openapi) {
    files.push({
      path: 'openapi.ts',
      content: generateOpenApiSpec(config),
    })
  }

  // 生成TypeScript客户端
  if (config.client) {
    files.push({
      path: 'client.ts',
      content: generateTrpcClient(config),
    })
  }

  return files
}

/**
 * 生成根路由器
 */
function generateRootRouter(config: {
  entities: Array<{ name: string; fields: Record<string, any> }>
  auth: boolean
  permissions: boolean
}): string {
  const imports = [
    `import { createTRPCRouter } from '@linch-kit/trpc'`,
  ]

  if (config.auth) {
    imports.push(`import { authMiddleware } from './middleware/auth'`)
  }

  if (config.permissions) {
    imports.push(`import { permissionsMiddleware } from './middleware/permissions'`)
  }

  // 导入实体路由器
  const entityImports = config.entities.map(entity => 
    `import { ${entity.name.toLowerCase()}Router } from './routers/${entity.name.toLowerCase()}'`
  )

  const entityRouters = config.entities.map(entity => 
    `  ${entity.name.toLowerCase()}: ${entity.name.toLowerCase()}Router,`
  ).join('\n')

  return `${imports.join('\n')}
${entityImports.join('\n')}

/**
 * 主tRPC路由器
 * 自动生成，请勿手动修改
 */
export const appRouter = createTRPCRouter({
${entityRouters}
})

export type AppRouter = typeof appRouter
`
}

/**
 * 生成实体路由器
 */
function generateEntityRouter(
  entity: { name: string; fields: Record<string, any> },
  config: {
    crud: boolean
    auth: boolean
    permissions: boolean
    validation: boolean
  }
): string {
  const imports = [
    `import { createTRPCRouter } from '@linch-kit/trpc'`,
    `import { z } from 'zod'`,
  ]

  if (config.crud) {
    imports.push(`import { ${entity.name.toLowerCase()}Crud } from '@linch-kit/crud'`)
  }

  if (config.auth) {
    imports.push(`import { authMiddleware } from '../middleware/auth'`)
  }

  if (config.permissions) {
    imports.push(`import { permissionsMiddleware } from '../middleware/permissions'`)
  }

  const middleware = []
  if (config.auth) middleware.push('authMiddleware')
  if (config.permissions) middleware.push('permissionsMiddleware')
  
  const middlewareChain = middleware.length > 0 ? 
    `.use(${middleware.join(').use(')})` : ''

  return `${imports.join('\n')}

/**
 * ${entity.name} tRPC路由器
 * 自动生成，请勿手动修改
 */
export const ${entity.name.toLowerCase()}Router = createTRPCRouter({
  create: createTRPCRouter()${middlewareChain}
    .mutation({
      input: z.object({
        // 根据Schema生成输入验证
      }),
      async resolve({ input, ctx }) {
        return await ${entity.name.toLowerCase()}Crud.create(input, ctx)
      },
    }),

  findMany: createTRPCRouter()${middlewareChain}
    .query({
      input: z.object({
        // 根据Schema生成查询参数
      }).optional(),
      async resolve({ input, ctx }) {
        return await ${entity.name.toLowerCase()}Crud.findMany(input, ctx)
      },
    }),

  findOne: createTRPCRouter()${middlewareChain}
    .query({
      input: z.object({
        id: z.string().or(z.number()),
      }),
      async resolve({ input, ctx }) {
        return await ${entity.name.toLowerCase()}Crud.findOne(input.id, ctx)
      },
    }),

  update: createTRPCRouter()${middlewareChain}
    .mutation({
      input: z.object({
        id: z.string().or(z.number()),
        data: z.object({
          // 根据Schema生成更新数据
        }),
      }),
      async resolve({ input, ctx }) {
        return await ${entity.name.toLowerCase()}Crud.update(input.id, input.data, ctx)
      },
    }),

  delete: createTRPCRouter()${middlewareChain}
    .mutation({
      input: z.object({
        id: z.string().or(z.number()),
      }),
      async resolve({ input, ctx }) {
        return await ${entity.name.toLowerCase()}Crud.delete(input.id, ctx)
      },
    }),
})
`
}

/**
 * 生成认证中间件
 */
function generateAuthMiddleware(_config: any): string {
  return `import { TRPCError } from '@trpc/server'
import { middleware } from '@linch-kit/trpc'

/**
 * 认证中间件
 * 自动生成，请勿手动修改
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
`
}

/**
 * 生成权限中间件
 */
function generatePermissionsMiddleware(_config: any): string {
  return `import { TRPCError } from '@trpc/server'
import { middleware } from '@linch-kit/trpc'
import { PermissionChecker } from '@linch-kit/crud/permissions'

/**
 * 权限中间件
 * 自动生成，请勿手动修改
 */
export const permissionsMiddleware = middleware(async ({ ctx, next }) => {
  const checker = new PermissionChecker(ctx.user)
  
  // 这里应该实现权限检查逻辑
  if (!checker.hasPermission('access')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Insufficient permissions',
    })
  }

  return next({
    ctx: {
      ...ctx,
      permissions: checker,
    },
  })
})
`
}

/**
 * 生成类型定义
 */
function generateTrpcTypes(config: {
  entities: Array<{ name: string; fields: Record<string, any> }>
}): string {
  const entityTypes = config.entities.map(entity => `
export interface ${entity.name}CreateInput {
  // 根据Schema生成
}

export interface ${entity.name}UpdateInput {
  // 根据Schema生成
}

export interface ${entity.name}WhereInput {
  // 根据Schema生成
}

export interface ${entity.name}OrderByInput {
  // 根据Schema生成
}
`).join('\n')

  return `/**
 * tRPC类型定义
 * 自动生成，请勿手动修改
 */

${entityTypes}

export interface TRPCContext {
  user?: any
  permissions?: any
  // 其他上下文类型
}
`
}

/**
 * 生成OpenAPI规范
 */
function generateOpenApiSpec(_config: any): string {
  return `/**
 * OpenAPI规范生成
 * 自动生成，请勿手动修改
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'LinchKit API',
    version: '1.0.0',
    description: 'Auto-generated API documentation',
  },
  paths: {
    // 根据tRPC路由生成
  },
}
`
}

/**
 * 生成TypeScript客户端
 */
function generateTrpcClient(_config: any): string {
  return `/**
 * tRPC TypeScript客户端
 * 自动生成，请勿手动修改
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from './index'

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
})

export type TRPCClient = typeof trpcClient
`
}

/**
 * 所有tRPC相关命令
 */
export const trpcCommands: CLICommand[] = [
  generateTrpcCommand,
]