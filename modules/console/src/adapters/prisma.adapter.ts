/**
 * Prisma 数据库适配器
 * 
 * 将 Prisma 客户端适配为 Console 服务接口
 */

import type { DatabaseClient } from '../services/tenant.service'

// 暴露 Prisma 客户端类型（避免直接依赖）
export interface PrismaClient {
  tenant: any
  tenantQuotas: any
  user: any
  plugin: any
  tenantPlugin: any
  $transaction: (fn: any) => Promise<any>
}

/**
 * 创建 Prisma 适配器
 */
export function createPrismaAdapter(prisma: PrismaClient): DatabaseClient {
  return {
    tenant: {
      create: (args: any) => prisma.tenant.create(args),
      update: (args: any) => prisma.tenant.update(args),
      findUnique: (args: any) => prisma.tenant.findUnique(args),
      findMany: (args: any) => prisma.tenant.findMany(args),
      findFirst: (args: any) => prisma.tenant.findFirst(args),
      delete: (args: any) => prisma.tenant.delete(args),
      count: (args?: any) => prisma.tenant.count(args),
    },
    tenantQuotas: {
      create: (args: any) => prisma.tenantQuotas.create(args),
      update: (args: any) => prisma.tenantQuotas.update(args),
      upsert: (args: any) => prisma.tenantQuotas.upsert(args),
    }
  }
}