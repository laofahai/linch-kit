import { z } from 'zod'
import type { EntityDefinition } from '../core/types'
import { getAllEntities } from '../core/entity'
import { getFieldMeta } from '../core/decorators'

/**
 * 生成实体的各种验证器
 */
export class ValidatorGenerator {
  constructor(private entity: EntityDefinition<any>) {}

  /**
   * 生成创建输入验证器
   */
  generateCreateValidator(): z.ZodSchema {
    const shape = this.entity.schema.shape
    const filteredShape: Record<string, z.ZodSchema> = {}

    Object.entries(shape).forEach(([key, fieldSchema]) => {
      const meta = getFieldMeta(fieldSchema as z.ZodSchema)
      const relationMeta = meta?.relation || this.entity.meta?.relations?.[key]

      // 排除主键、时间戳和关系字段（支持新的 primary 字段）
      if (!meta?.id && !meta?.primary && !meta?.createdAt && !meta?.updatedAt && !relationMeta) {
        filteredShape[key] = fieldSchema as z.ZodSchema
      }
    })

    return z.object(filteredShape)
  }

  /**
   * 生成更新输入验证器
   */
  generateUpdateValidator(): z.ZodSchema {
    const shape = this.entity.schema.shape
    const filteredShape: Record<string, z.ZodSchema> = {}

    Object.entries(shape).forEach(([key, fieldSchema]) => {
      const meta = getFieldMeta(fieldSchema as z.ZodSchema)
      const relationMeta = meta?.relation || this.entity.meta?.relations?.[key]

      // 排除主键、时间戳和关系字段，所有字段变为可选（支持新的 primary 字段）
      if (!meta?.id && !meta?.primary && !meta?.createdAt && !meta?.updatedAt && !relationMeta) {
        filteredShape[key] = (fieldSchema as z.ZodSchema).optional()
      }
    })

    return z.object(filteredShape)
  }

  /**
   * 生成响应验证器（排除敏感字段）
   */
  generateResponseValidator(excludeFields: string[] = []): z.ZodSchema {
    const shape = this.entity.schema.shape
    const filteredShape: Record<string, z.ZodSchema> = {}

    Object.entries(shape).forEach(([key, fieldSchema]) => {
      if (!excludeFields.includes(key)) {
        filteredShape[key] = fieldSchema as z.ZodSchema
      }
    })

    return z.object(filteredShape)
  }

  /**
   * 生成查询参数验证器
   */
  generateQueryValidator(): z.ZodSchema {
    const shape = this.entity.schema.shape
    const whereShape: Record<string, z.ZodSchema> = {}

    // 为每个字段生成查询条件
    Object.entries(shape).forEach(([key, fieldSchema]) => {
      const meta = getFieldMeta(fieldSchema as z.ZodSchema)
      const relationMeta = meta?.relation || this.entity.meta?.relations?.[key]

      if (!relationMeta) {
        // 普通字段支持等值查询
        whereShape[key] = (fieldSchema as z.ZodSchema).optional()
        
        // 字符串字段支持模糊查询
        const zodType = (fieldSchema as any)._def.typeName
        if (zodType === 'ZodString') {
          whereShape[`${key}_contains`] = z.string().optional()
          whereShape[`${key}_startsWith`] = z.string().optional()
          whereShape[`${key}_endsWith`] = z.string().optional()
        }

        // 数字和日期字段支持范围查询
        if (['ZodNumber', 'ZodDate'].includes(zodType)) {
          whereShape[`${key}_gt`] = (fieldSchema as z.ZodSchema).optional()
          whereShape[`${key}_gte`] = (fieldSchema as z.ZodSchema).optional()
          whereShape[`${key}_lt`] = (fieldSchema as z.ZodSchema).optional()
          whereShape[`${key}_lte`] = (fieldSchema as z.ZodSchema).optional()
        }
      }
    })

    return z.object({
      where: z.object(whereShape).partial().optional(),
      orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
      take: z.number().int().positive().max(100).default(10),
      skip: z.number().int().nonnegative().default(0),
      include: z.record(z.boolean()).optional(),
    })
  }

  /**
   * 生成分页响应验证器
   */
  generatePaginatedResponseValidator(itemValidator: z.ZodSchema): z.ZodSchema {
    return z.object({
      data: z.array(itemValidator),
      pagination: z.object({
        total: z.number().int().nonnegative(),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        totalPages: z.number().int().nonnegative(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      })
    })
  }
}

/**
 * 生成所有实体的验证器
 */
export function generateAllValidators(): Record<string, {
  create: z.ZodSchema
  update: z.ZodSchema
  response: z.ZodSchema
  query: z.ZodSchema
  paginatedResponse: z.ZodSchema
}> {
  const entities = getAllEntities()
  const validators: Record<string, any> = {}

  entities.forEach(entity => {
    const generator = new ValidatorGenerator(entity)
    const responseValidator = generator.generateResponseValidator()
    
    validators[entity.name] = {
      create: generator.generateCreateValidator(),
      update: generator.generateUpdateValidator(),
      response: responseValidator,
      query: generator.generateQueryValidator(),
      paginatedResponse: generator.generatePaginatedResponseValidator(responseValidator)
    }
  })

  return validators
}

/**
 * 生成验证器 TypeScript 代码
 */
export function generateValidatorCode(): string {
  const entities = getAllEntities()
  let code = `// This file is auto-generated. Do not edit manually.
// Generated from @linch-kit/schema

import { z } from 'zod'

`

  entities.forEach(entity => {
    const generator = new ValidatorGenerator(entity)
    const entityName = entity.name
    
    code += `// ${entityName} Validators\n`
    code += `export const ${entityName}CreateSchema = ${schemaToCode(generator.generateCreateValidator())}\n\n`
    code += `export const ${entityName}UpdateSchema = ${schemaToCode(generator.generateUpdateValidator())}\n\n`
    code += `export const ${entityName}ResponseSchema = ${schemaToCode(generator.generateResponseValidator())}\n\n`
    code += `export const ${entityName}QuerySchema = ${schemaToCode(generator.generateQueryValidator())}\n\n`
    
    const responseValidator = generator.generateResponseValidator()
    code += `export const ${entityName}PaginatedResponseSchema = ${schemaToCode(generator.generatePaginatedResponseValidator(responseValidator))}\n\n`
    
    // 生成类型定义
    code += `// ${entityName} Types\n`
    code += `export type ${entityName}Create = z.infer<typeof ${entityName}CreateSchema>\n`
    code += `export type ${entityName}Update = z.infer<typeof ${entityName}UpdateSchema>\n`
    code += `export type ${entityName}Response = z.infer<typeof ${entityName}ResponseSchema>\n`
    code += `export type ${entityName}Query = z.infer<typeof ${entityName}QuerySchema>\n`
    code += `export type ${entityName}PaginatedResponse = z.infer<typeof ${entityName}PaginatedResponseSchema>\n\n`
  })

  return code
}

/**
 * 将 Zod Schema 转换为代码字符串（简化版本）
 */
function schemaToCode(schema: z.ZodSchema): string {
  // 这是一个简化的实现，实际项目中可能需要更复杂的序列化逻辑
  return 'z.object({ /* schema definition */ })'
}

/**
 * 写入验证器文件
 */
export async function writeValidators(outputPath: string = './src/validators/index.ts'): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const code = generateValidatorCode()
  
  // 确保目录存在
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })
  
  // 写入文件
  await fs.writeFile(outputPath, code, 'utf-8')
  
  console.log(`✅ Validators generated at: ${outputPath}`)
}
