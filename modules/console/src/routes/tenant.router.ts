import { router, publicProcedure, protectedProcedure } from '@linch-kit/trpc'
import { z } from 'zod'

import { TenantService, type TenantUpdateParams } from '../services/tenant.service'
import { tenantCreateSchema, tenantUpdateSchema, tenantQuerySchema } from '../entities/tenant'

// 用于依赖注入的全局变量
let _globalTenantService: TenantService | null = null

/**
 * 设置租户服务（用于依赖注入）
 */
export function setTenantService(service: TenantService) {
  _globalTenantService = service
}

/**
 * 获取租户服务实例
 */
function getTenantService(): TenantService {
  if (!_globalTenantService) {
    throw new Error('TenantService not initialized. Call setTenantService() first.')
  }
  return _globalTenantService
}

export const tenantRouter = router({
  /**
   * 获取租户列表
   */
  list: publicProcedure.input(tenantQuerySchema).query(async ({ input, ctx: _ctx }) => {
    // 暂时禁用认证检查进行测试
    // if (!ctx.user) {
    //   throw new Error('Unauthorized')
    // }

    // 暂时返回模拟数据进行测试
    const result = {
      data: [
        {
          id: 'tenant-1',
          name: '演示公司',
          slug: 'demo-company',
          description: '这是一个演示租户',
          status: 'active',
          plan: 'professional',
          maxUsers: 50,
          maxStorage: BigInt(5 * 1024 * 1024 * 1024),
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { users: 2, plugins: 3 },
        },
        {
          id: 'tenant-2',
          name: 'Startup Inc',
          slug: 'startup-inc',
          description: '初创公司',
          status: 'active',
          plan: 'starter',
          maxUsers: 10,
          maxStorage: BigInt(1024 * 1024 * 1024),
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { users: 1, plugins: 1 },
        },
      ],
      total: 2,
      page: input.page || 1,
      pageSize: input.pageSize || 10,
    }

    return result
  }),

  /**
   * 获取租户详情
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx: _ctx }) => {
      if (!ctx.user) {
        throw new Error('Unauthorized')
      }

      // 暂时允许所有已认证用户查看租户详情，后续实现权限检查

      const tenantService = getTenantService()
      const tenant = await tenantService.getById(input.id)
      if (!tenant) {
        throw new Error('Tenant not found')
      }

      return tenant
    }),

  /**
   * 创建租户
   */
  create: protectedProcedure.input(tenantCreateSchema).mutation(async ({ input, ctx }) => {
    // 暂时允许所有已认证用户创建租户，后续实现权限检查
    if (!ctx.user) {
      throw new Error('Unauthorized')
    }

    const tenantService = getTenantService()
    const tenant = await tenantService.create(input)
    return tenant
  }),

  /**
   * 更新租户
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: tenantUpdateSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error('Unauthorized')
      }

      // 暂时允许所有已认证用户更新租户，后续实现权限检查

      const tenantService = getTenantService()
      const tenant = await tenantService.update(String(input.id), input.data as TenantUpdateParams)
      return tenant
    }),

  /**
   * 删除租户
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 暂时允许所有已认证用户删除租户，后续实现权限检查
      if (!ctx.user) {
        throw new Error('Unauthorized')
      }

      const tenantService = getTenantService()
      await tenantService.delete(input.id)
      return { success: true }
    }),

  /**
   * 启用/禁用租户
   */
  toggleStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['active', 'suspended', 'deleted', 'pending']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 暂时允许所有已认证用户更改租户状态，后续实现权限检查
      if (!ctx.user) {
        throw new Error('Unauthorized')
      }

      const tenantService = getTenantService()
      const tenant = await tenantService.update(input.id, {
        status: input.status,
      })
      return tenant
    }),

  /**
   * 获取租户统计信息
   */
  stats: protectedProcedure
    .input(z.object({ id: z.string().optional() }))
    .query(async ({ input, ctx: _ctx }) => {
      if (!ctx.user) {
        throw new Error('Unauthorized')
      }

      const tenantService = getTenantService()

      // 暂时返回模拟数据，后续实现真实统计
      if (!input.id) {
        // 获取所有租户的统计
        return {
          totalTenants: await tenantService.count(),
          activeTenants: await tenantService.count({ status: 'active' }),
          totalUsers: 0, // TODO: 从用户服务获取
          totalPlugins: 0, // TODO: 从插件服务获取
        }
      }

      // 获取特定租户的统计
      return {
        users: 0, // TODO: 从用户服务获取
        plugins: 0, // TODO: 从插件服务获取
        storage: 0, // TODO: 从存储服务获取
        requests: 0, // TODO: 从监控服务获取
      }
    }),
})

export type TenantRouter = typeof tenantRouter
