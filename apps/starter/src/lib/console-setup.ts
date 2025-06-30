/**
 * Console 模块初始化
 * 
 * 设置数据库连接和服务依赖注入
 */

import { prisma } from './prisma'
// import { TenantService, setTenantService } from '@linch-kit/console'

// 创建 Prisma 适配器的简化版本
function createPrismaAdapter(prismaClient: typeof prisma) {
  return {
    tenant: {
      create: (args: unknown) => prismaClient.tenant.create(args as never),
      update: (args: unknown) => prismaClient.tenant.update(args as never),
      findUnique: (args: unknown) => prismaClient.tenant.findUnique(args as never),
      findMany: (args: unknown) => prismaClient.tenant.findMany(args as never),
      findFirst: (args: unknown) => prismaClient.tenant.findFirst(args as never),
      delete: (args: unknown) => prismaClient.tenant.delete(args as never),
      count: (args?: unknown) => prismaClient.tenant.count(args as never),
    },
    tenantQuotas: {
      create: (args: unknown) => prismaClient.tenantQuotas.create(args as never),
      update: (args: unknown) => prismaClient.tenantQuotas.update(args as never),
      upsert: (args: unknown) => prismaClient.tenantQuotas.upsert(args as never),
    }
  }
}

/**
 * 初始化 Console 服务
 */
export function initializeConsoleServices() {
  // 创建数据库适配器
  const _dbAdapter = createPrismaAdapter(prisma)
  
  // TODO: 创建租户服务实例
  // const tenantService = new TenantService()
  // tenantService.setDatabase(dbAdapter)
  
  // TODO: 注入到路由器
  // setTenantService(tenantService)
  
  console.log('✅ Console services initialized (simplified)')
}

// 自动初始化（在模块加载时执行）
initializeConsoleServices()