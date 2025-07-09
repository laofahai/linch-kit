/**
 * Prisma 数据库适配器
 *
 * 将 Prisma 客户端适配为 Console 服务接口
 */

import type { DatabaseClient } from '../services/tenant.service'

// 暴露 Prisma 客户端类型（避免直接依赖）
export interface PrismaClient {
  tenant: Record<string, unknown>
  tenantQuotas: Record<string, unknown>
  user: Record<string, unknown>
  plugin: Record<string, unknown>
  tenantPlugin: Record<string, unknown>
  $transaction: (fn: (tx: PrismaClient) => Promise<unknown>) => Promise<unknown>
}

/**
 * 创建 Prisma 适配器
 */
export function createPrismaAdapter(prisma: PrismaClient): DatabaseClient {
  return {
    tenant: {
      create: (args: Record<string, unknown>) =>
        (
          prisma.tenant as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).create(args),
      update: (args: Record<string, unknown>) =>
        (
          prisma.tenant as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).update(args),
      findUnique: (args: Record<string, unknown>) =>
        (
          prisma.tenant as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).findUnique(args),
      findMany: (args: Record<string, unknown>) =>
        (
          prisma.tenant as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).findMany(args),
      findFirst: (args: Record<string, unknown>) =>
        (
          prisma.tenant as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).findFirst(args),
      delete: (args: Record<string, unknown>) =>
        (
          prisma.tenant as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).delete(args),
      count: (args?: Record<string, unknown>) =>
        (
          prisma.tenant as Record<string, (args?: Record<string, unknown>) => Promise<number>>
        ).count(args),
    },
    tenantQuotas: {
      create: (args: Record<string, unknown>) =>
        (
          prisma.tenantQuotas as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).create(args),
      update: (args: Record<string, unknown>) =>
        (
          prisma.tenantQuotas as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).update(args),
      upsert: (args: Record<string, unknown>) =>
        (
          prisma.tenantQuotas as Record<string, (args: Record<string, unknown>) => Promise<unknown>>
        ).upsert(args),
    },
  }
}
