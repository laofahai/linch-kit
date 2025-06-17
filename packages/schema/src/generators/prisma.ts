import { z } from 'zod'
import type { 
  PrismaFieldType, 
  FieldAttributes, 
  RelationAttributes,
  EntityDefinition 
} from '../core/types'
import { getAllEntities } from '../core/entity'

/**
 * Zod 类型到 Prisma 类型的映射
 */
function zodTypeToPrismaType(zodSchema: z.ZodSchema): PrismaFieldType {
  const zodType = (zodSchema as any)._def.typeName

  switch (zodType) {
    case 'ZodString':
      // 检查是否是整数类型的字符串（如 UUID）
      const stringSchema = zodSchema as z.ZodString
      if ((stringSchema as any)._def.checks) {
        for (const check of (stringSchema as any)._def.checks) {
          if (check.kind === 'uuid') {
            return 'String'
          }
        }
      }
      return 'String'
    case 'ZodNumber':
      // 检查是否是整数
      const numberSchema = zodSchema as z.ZodNumber
      if ((numberSchema as any)._def.checks) {
        for (const check of (numberSchema as any)._def.checks) {
          if (check.kind === 'int') {
            return 'Int'
          }
        }
      }
      return 'Float'
    case 'ZodBigInt':
      return 'BigInt'
    case 'ZodBoolean':
      return 'Boolean'
    case 'ZodDate':
      return 'DateTime'
    case 'ZodArray':
    case 'ZodObject':
    case 'ZodRecord':
      return 'Json'
    case 'ZodEnum':
      return 'String'
    case 'ZodOptional':
      return zodTypeToPrismaType((zodSchema as z.ZodOptional<any>)._def.innerType)
    case 'ZodNullable':
      return zodTypeToPrismaType((zodSchema as z.ZodNullable<any>)._def.innerType)
    case 'ZodDefault':
      return zodTypeToPrismaType((zodSchema as z.ZodDefault<any>)._def.innerType)
    default:
      return 'String'
  }
}

/**
 * 检查字段是否可选
 */
function isOptionalField(zodSchema: z.ZodSchema): boolean {
  const zodType = (zodSchema as any)._def.typeName
  return zodType === 'ZodOptional' || zodType === 'ZodNullable'
}

/**
 * 获取默认值
 */
function getDefaultValue(zodSchema: z.ZodSchema, fieldMeta?: FieldAttributes): string | undefined {
  // 检查元数据中的默认值
  if (fieldMeta?.default !== undefined) {
    if (typeof fieldMeta.default === 'string') {
      return `"${fieldMeta.default}"`
    }
    if (typeof fieldMeta.default === 'boolean' || typeof fieldMeta.default === 'number') {
      return String(fieldMeta.default)
    }
  }

  // 检查 Zod schema 中的默认值
  const zodType = (zodSchema as any)._def.typeName
  if (zodType === 'ZodDefault') {
    const defaultValue = (zodSchema as z.ZodDefault<any>)._def.defaultValue()
    if (typeof defaultValue === 'string') {
      return `"${defaultValue}"`
    }
    if (typeof defaultValue === 'boolean' || typeof defaultValue === 'number') {
      return String(defaultValue)
    }
  }

  // 特殊处理时间戳
  if (fieldMeta?.createdAt) {
    return 'now()'
  }
  if (fieldMeta?.updatedAt) {
    return 'now()'
  }

  // 软删除字段默认为 null
  if (fieldMeta?.softDelete) {
    return undefined // 软删除字段不设置默认值，保持为可选
  }

  return undefined
}

/**
 * 生成字段定义
 */
function generateField(
  fieldName: string, 
  zodSchema: z.ZodSchema, 
  fieldMeta?: FieldAttributes
): string {
  const prismaType = zodTypeToPrismaType(zodSchema)
  const isOptional = isOptionalField(zodSchema) && !fieldMeta?.id
  const defaultValue = getDefaultValue(zodSchema, fieldMeta)

  let fieldDef = `  ${fieldName} ${prismaType}`

  // 添加可选标记
  if (isOptional && !defaultValue) {
    fieldDef += '?'
  }

  // 添加属性
  const attributes: string[] = []

  if (fieldMeta?.id) {
    attributes.push('@id')
  }

  if (fieldMeta?.unique) {
    attributes.push('@unique')
  }

  if (defaultValue) {
    attributes.push(`@default(${defaultValue})`)
  }

  if (fieldMeta?.updatedAt) {
    attributes.push('@updatedAt')
  }

  if (fieldMeta?.map) {
    attributes.push(`@map("${fieldMeta.map}")`)
  }

  if (fieldMeta?.db?.type) {
    const dbType = fieldMeta.db.type
    const length = fieldMeta.db.length ? `(${fieldMeta.db.length})` : ''
    attributes.push(`@db.${dbType}${length}`)
  }

  if (attributes.length > 0) {
    fieldDef += ` ${attributes.join(' ')}`
  }

  return fieldDef
}

/**
 * 生成关系字段
 */
function generateRelationField(
  fieldName: string,
  relation: RelationAttributes
): string {
  let fieldDef = `  ${fieldName} ${relation.model}`

  // 根据关系类型添加数组标记
  if (relation.type === 'one-to-many' || relation.type === 'many-to-many') {
    fieldDef += '[]'
  } else if (relation.type === 'one-to-one' || relation.type === 'many-to-one') {
    fieldDef += '?'
  }

  // 添加关系属性
  const attributes: string[] = []
  
  if (relation.foreignKey || relation.references) {
    const relationAttr = []
    if (relation.foreignKey) {
      relationAttr.push(`fields: [${relation.foreignKey}]`)
    }
    if (relation.references) {
      relationAttr.push(`references: [${relation.references}]`)
    }
    if (relation.onDelete) {
      relationAttr.push(`onDelete: ${relation.onDelete}`)
    }
    if (relation.onUpdate) {
      relationAttr.push(`onUpdate: ${relation.onUpdate}`)
    }
    
    attributes.push(`@relation(${relationAttr.join(', ')})`)
  }

  if (attributes.length > 0) {
    fieldDef += ` ${attributes.join(' ')}`
  }

  return fieldDef
}

/**
 * 生成模型定义
 */
function generateModel(entity: EntityDefinition): string {
  const { name, schema, meta } = entity
  const shape = schema.shape
  
  let modelDef = `model ${name} {\n`

  // 生成普通字段
  Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
    const fieldMeta = meta?.fields?.[fieldName]
    const relationMeta = meta?.relations?.[fieldName]

    if (relationMeta) {
      // 关系字段
      modelDef += generateRelationField(fieldName, relationMeta) + '\n'
    } else {
      // 普通字段
      modelDef += generateField(fieldName, fieldSchema as z.ZodSchema, fieldMeta) + '\n'
    }
  })

  // 添加索引
  if (meta?.model?.indexes) {
    meta.model.indexes.forEach((index, i) => {
      const indexFields = index.fields.join(', ')

      // 检查是否是单字段索引且该字段已经有 @unique 约束
      if (index.unique && index.fields.length === 1) {
        const fieldName = index.fields[0]
        const fieldMeta = meta?.fields?.[fieldName]
        if (fieldMeta?.unique) {
          // 跳过，因为字段已经有 @unique 约束
          return
        }
      }

      // 生成索引名称
      const defaultIndexName = index.unique
        ? `${meta?.model?.tableName || name.toLowerCase()}_${index.fields.join('_')}_key`
        : `${meta?.model?.tableName || name.toLowerCase()}_${index.fields.join('_')}_idx`

      const indexName = index.name || defaultIndexName
      const mapClause = `, map: "${indexName}"`

      if (index.unique) {
        // 唯一索引使用 @@unique
        modelDef += `\n  @@unique([${indexFields}]${mapClause})\n`
      } else {
        // 普通索引使用 @@index
        modelDef += `\n  @@index([${indexFields}]${mapClause})\n`
      }
    })
  }

  // 添加复合主键
  if (meta?.model?.compositePrimaryKey) {
    const pkFields = meta.model.compositePrimaryKey.join(', ')
    modelDef += `\n  @@id([${pkFields}])\n`
  }

  // 添加表名映射
  if (meta?.model?.tableName && meta.model.tableName !== name.toLowerCase()) {
    modelDef += `\n  @@map("${meta.model.tableName}")\n`
  }

  modelDef += '}\n'
  return modelDef
}

/**
 * 生成完整的 Prisma Schema
 */
export function generatePrismaSchema(
  databaseUrl: string = 'postgresql://localhost:5432/mydb',
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' = 'postgresql'
): string {
  const entities = getAllEntities()
  
  let schema = `// This file is auto-generated. Do not edit manually.
// Generated from @linch-kit/schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

`

  // 生成所有模型
  entities.forEach(entity => {
    schema += generateModel(entity) + '\n'
  })

  return schema
}

/**
 * 将 Prisma Schema 写入文件
 */
export async function writePrismaSchema(
  outputPath: string = './prisma/schema.prisma',
  options?: {
    databaseUrl?: string
    provider?: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver'
  }
): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const schema = generatePrismaSchema(options?.databaseUrl, options?.provider)
  
  // 确保目录存在
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })
  
  // 写入文件
  await fs.writeFile(outputPath, schema, 'utf-8')
  
  console.log(`✅ Prisma schema generated at: ${outputPath}`)
}
