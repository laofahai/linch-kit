/**
 * Console 模块初始化
 * 
 * 设置数据库连接和服务依赖注入
 */

import { prisma } from './prisma'
import { TenantService, setTenantService } from '@linch-kit/console'

// 创建 Prisma 适配器的简化版本
function createPrismaAdapter(prismaClient: typeof prisma) {
  return {
    tenant: {
      create: (args: any) => prismaClient.tenant.create(args),
      update: (args: any) => prismaClient.tenant.update(args),
      findUnique: (args: any) => prismaClient.tenant.findUnique(args),
      findMany: (args: any) => prismaClient.tenant.findMany(args),
      findFirst: (args: any) => prismaClient.tenant.findFirst(args),
      delete: (args: any) => prismaClient.tenant.delete(args),
      count: (args?: any) => prismaClient.tenant.count(args),
    },
    tenantQuotas: {
      create: (args: any) => prismaClient.tenantQuotas.create(args),
      update: (args: any) => prismaClient.tenantQuotas.update(args),
      upsert: (args: any) => prismaClient.tenantQuotas.upsert(args),
    }
  }
}

/**
 * 初始化 Console 服务
 */
export function initializeConsoleServices() {
  // 创建数据库适配器
  const dbAdapter = createPrismaAdapter(prisma)
  
  // 创建租户服务实例
  const tenantService = new TenantService()
  tenantService.setDatabase(dbAdapter)
  
  // 注入到路由器
  setTenantService(tenantService)
  
  console.log('✅ Console services initialized')
}

// 自动初始化（在模块加载时执行）
initializeConsoleServices()