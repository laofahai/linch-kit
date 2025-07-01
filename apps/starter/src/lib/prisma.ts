/**
 * @deprecated 此文件已被 schema-client.ts 替代
 * 请使用 import { schemaClient } from '@/lib/schema-client' 代替
 */

import { prisma, schemaClient } from './schema-client'

// 向后兼容导出
export { prisma, schemaClient }