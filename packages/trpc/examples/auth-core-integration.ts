/**
 * @linch-kit/auth 与 tRPC 集成示例
 */

import { z } from 'zod'
import {
  createTRPCRouter,
  router,
  procedure,
  protectedProcedure,
  createAuthIntegration,
  type PermissionRequirement,
} from '@linch-kit/trpc'
import { createPermissionRegistry, createModularPermissionChecker } from '@linch-kit/auth'

// 1. 创建权限注册表并注册模块权限
async function setupPermissions() {
  const registry = createPermissionRegistry()

  // 注册 WMS 模块权限
  await registry.registerModule({
    moduleName: 'wms',
    description: '仓储管理系统',
    resources: [
      {
        name: 'warehouse',
        description: '仓库管理',
        actions: [
          { name: 'create', description: '创建仓库' },
          { name: 'read', description: '查看仓库' },
          { name: 'update', description: '更新仓库' },
          { name: 'delete', description: '删除仓库' },
        ],
      },
      {
        name: 'inventory',
        description: '库存管理',
        actions: [
          { name: 'read', description: '查看库存' },
          { name: 'adjust', description: '调整库存' },
          { name: 'transfer', description: '库存转移' },
        ],
      },
    ],
    defaultRoles: [
      {
        name: 'wms.manager',
        description: 'WMS 管理员',
        permissions: [
          { resource: 'warehouse', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'inventory', actions: ['read', 'adjust', 'transfer'] },
        ],
      },
      {
        name: 'wms.operator',
        description: 'WMS 操作员',
        permissions: [
          { resource: 'warehouse', actions: ['read'] },
          { resource: 'inventory', actions: ['read', 'adjust'] },
        ],
      },
    ],
  })

  // 注册 CRM 模块权限
  await registry.registerModule({
    moduleName: 'crm',
    description: '客户关系管理',
    resources: [
      {
        name: 'customer',
        description: '客户管理',
        actions: [
          { name: 'create', description: '创建客户' },
          { name: 'read', description: '查看客户' },
          { name: 'update', description: '更新客户' },
          { name: 'delete', description: '删除客户' },
        ],
      },
      {
        name: 'order',
        description: '订单管理',
        actions: [
          { name: 'create', description: '创建订单' },
          { name: 'read', description: '查看订单' },
          { name: 'update', description: '更新订单' },
          { name: 'cancel', description: '取消订单' },
        ],
      },
    ],
    defaultRoles: [
      {
        name: 'crm.manager',
        description: 'CRM 管理员',
        permissions: [
          { resource: 'customer', actions: ['create', 'read', 'update', 'delete'] },
          { resource: 'order', actions: ['create', 'read', 'update', 'cancel'] },
        ],
      },
      {
        name: 'crm.sales',
        description: 'CRM 销售员',
        permissions: [
          { resource: 'customer', actions: ['create', 'read', 'update'] },
          { resource: 'order', actions: ['create', 'read', 'update'] },
        ],
      },
    ],
  })

  return registry
}

// 2. 创建 Auth Core 集成
async function createAuthIntegration() {
  const registry = await setupPermissions()
  const permissionChecker = createModularPermissionChecker(registry)

  return createAuthCoreIntegration({
    permissionRegistry: registry,
    permissionChecker,
    skipInDevelopment: true,
    unauthorizedMessage: '权限不足，请联系管理员',
  })
}

// 3. 创建带权限控制的路由
export async function createAppRouter() {
  const auth = await createAuthIntegration()

  // WMS 模块路由
  const wmsRouter = router({
    // 查看仓库列表 - 需要 WMS 仓库读取权限
    listWarehouses: procedure
      .use(auth.requireModulePermission('wms', 'warehouse', 'read'))
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        // 业务逻辑
        return {
          warehouses: [
            { id: '1', name: '主仓库', location: '北京' },
            { id: '2', name: '分仓库', location: '上海' },
          ],
          pagination: {
            page: input.page,
            limit: input.limit,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        }
      }),

    // 创建仓库 - 需要 WMS 仓库创建权限
    createWarehouse: procedure
      .use(auth.requireModulePermission('wms', 'warehouse', 'create'))
      .input(
        z.object({
          name: z.string().min(1),
          location: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 业务逻辑
        return {
          success: true,
          data: {
            id: Math.random().toString(36).substring(7),
            name: input.name,
            location: input.location,
            createdAt: new Date().toISOString(),
          },
          message: '仓库创建成功',
        }
      }),

    // 调整库存 - 需要 WMS 库存调整权限
    adjustInventory: procedure
      .use(auth.requireModulePermission('wms', 'inventory', 'adjust'))
      .input(
        z.object({
          warehouseId: z.string(),
          productId: z.string(),
          quantity: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 业务逻辑
        return {
          success: true,
          message: '库存调整成功',
        }
      }),
  })

  // CRM 模块路由
  const crmRouter = router({
    // 查看客户列表 - 需要 CRM 客户读取权限
    listCustomers: procedure
      .use(auth.requireModulePermission('crm', 'customer', 'read'))
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
        })
      )
      .query(async ({ input, ctx }) => {
        return {
          customers: [
            { id: '1', name: '客户A', email: 'a@example.com' },
            { id: '2', name: '客户B', email: 'b@example.com' },
          ],
          pagination: {
            page: input.page,
            limit: input.limit,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        }
      }),

    // 创建订单 - 需要 CRM 订单创建权限
    createOrder: procedure
      .use(auth.requireModulePermission('crm', 'order', 'create'))
      .input(
        z.object({
          customerId: z.string(),
          products: z.array(
            z.object({
              productId: z.string(),
              quantity: z.number().min(1),
              price: z.number().min(0),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return {
          success: true,
          data: {
            id: Math.random().toString(36).substring(7),
            customerId: input.customerId,
            products: input.products,
            total: input.products.reduce((sum, p) => sum + p.price * p.quantity, 0),
            createdAt: new Date().toISOString(),
          },
          message: '订单创建成功',
        }
      }),
  })

  // 管理员路由 - 需要多种权限
  const adminRouter = router({
    // 获取用户权限摘要
    getUserPermissions: protectedProcedure
      .input(
        z.object({
          userId: z.string().optional(),
          module: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const targetUserId = input.userId || ctx.user!.id

        // 检查是否有权限查看其他用户的权限
        if (targetUserId !== ctx.user!.id) {
          const canViewUserPermissions = await auth.helpers.checkPermission(
            ctx,
            'user',
            'read',
            'admin'
          )

          if (!canViewUserPermissions) {
            throw new Error('无权限查看其他用户权限')
          }
        }

        return auth.helpers.getUserPermissions(ctx, input.module)
      }),

    // 获取用户可访问的模块
    getUserAccessibleModules: protectedProcedure.query(async ({ ctx }) => {
      return auth.helpers.getUserAccessibleModules(ctx)
    }),

    // 复合权限示例 - 需要多个权限中的任一个
    complexPermissionExample: procedure
      .use(
        auth.requirePermissions([
          { module: 'wms', resource: 'warehouse', action: 'read' },
          { module: 'crm', resource: 'customer', action: 'read' },
        ])
      )
      .query(async ({ ctx }) => {
        return {
          message: '您有 WMS 仓库读取权限或 CRM 客户读取权限',
          permissions: ctx.permissions,
        }
      }),
  })

  // 组合应用路由
  const appRouter = router({
    wms: wmsRouter,
    crm: crmRouter,
    admin: adminRouter,

    // 健康检查 - 无需权限
    health: procedure.query(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      modules: ['wms', 'crm', 'admin'],
    })),
  })

  return {
    appRouter,
    auth,
    registry: auth.registry,
    permissionChecker: auth.permissionChecker,
  }
}

// 4. 使用示例
export async function exampleUsage() {
  const { appRouter, auth } = await createAppRouter()

  console.log('🚀 tRPC + Auth Core 集成示例')
  console.log('✅ 权限注册表已创建')
  console.log('✅ 模块化权限检查器已创建')
  console.log('✅ tRPC 路由已创建，包含权限控制')

  // 获取已注册的模块
  const modules = await auth.registry.getRegisteredModules()
  console.log(`📋 已注册模块: ${modules.map(m => m.moduleName).join(', ')}`)

  return appRouter
}

// 导出类型
export type AppRouter = Awaited<ReturnType<typeof createAppRouter>>['appRouter']
