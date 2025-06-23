/* eslint-disable no-case-declarations */
import { z } from 'zod'

import type {
  PrismaFieldType,
  FieldAttributes,
  RelationAttributes,
  EntityDefinition
} from '../core/types'
import { getAllEntities } from '../core/entity'
import { getFieldMeta } from '../core/decorators'

/**
 * Zod 类型到 Prisma 类型的映射
 */
function zodTypeToPrismaType(zodSchema: z.ZodSchema, provider: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' = 'postgresql'): PrismaFieldType {
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
      // SQLite 不支持 JSON，使用 String
      return provider === 'sqlite' ? 'String' : 'Json'
    case 'ZodEnum':
      return 'String'
    case 'ZodOptional':
      return zodTypeToPrismaType((zodSchema as z.ZodOptional<any>)._def.innerType, provider)
    case 'ZodNullable':
      return zodTypeToPrismaType((zodSchema as z.ZodNullable<any>)._def.innerType, provider)
    case 'ZodDefault':
      return zodTypeToPrismaType((zodSchema as z.ZodDefault<any>)._def.innerType, provider)
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
  // 检查元数据中的默认值（支持新的 FieldConfig 格式）
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
  fieldMeta?: FieldAttributes,
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' = 'postgresql'
): string {
  const prismaType = zodTypeToPrismaType(zodSchema, provider)
  const isOptional = isOptionalField(zodSchema) && !fieldMeta?.id && !fieldMeta?.primary
  const defaultValue = getDefaultValue(zodSchema, fieldMeta)

  let fieldDef = `  ${fieldName} ${prismaType}`

  // 添加可选标记
  if (isOptional && !defaultValue) {
    fieldDef += '?'
  }

  // 添加属性
  const attributes: string[] = []

  // 支持新的 primary 字段
  if (fieldMeta?.id || fieldMeta?.primary) {
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

  if (fieldMeta?.db?.type && provider !== 'sqlite') {
    const dbType = fieldMeta.db.type

    // PostgreSQL 中，JSON 类型不需要 @db 注解，直接使用 Json 类型即可
    if (provider === 'postgresql' && dbType === 'JSON') {
      // 跳过 @db.JSON 注解，PostgreSQL 中直接使用 Json 类型
    } else {
      let typeSpec = dbType

      if (fieldMeta.db.length) {
        typeSpec += `(${fieldMeta.db.length})`
      } else if (fieldMeta.db.precision && fieldMeta.db.scale) {
        typeSpec += `(${fieldMeta.db.precision}, ${fieldMeta.db.scale})`
      } else if (fieldMeta.db.precision) {
        typeSpec += `(${fieldMeta.db.precision})`
      }

      attributes.push(`@db.${typeSpec}`)
    }
  }

  if (attributes.length > 0) {
    fieldDef += ` ${attributes.join(' ')}`
  }

  return fieldDef
}

/**
 * 生成关系字段和对应的外键字段
 */
function generateRelationField(
  fieldName: string,
  relation: RelationAttributes,
  _provider: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' = 'postgresql'
): { relationField: string; foreignKeyField?: string } {
  // 如果关系字段名与外键字段名相同，则为关系字段生成不同的名称
  // 例如：userId -> user, roleId -> role, departmentId -> department
  let relationFieldName = fieldName
  if (fieldName === relation.foreignKey) {
    // 移除 Id 后缀生成关系字段名
    relationFieldName = fieldName.replace(/Id$/, '')
    // 如果移除后为空或与原名相同，则使用模型名
    if (!relationFieldName || relationFieldName === fieldName) {
      relationFieldName = relation.model.toLowerCase()
    }
    // 特殊处理：如果是 reportTo，则使用更具描述性的名称
    if (fieldName === 'reportTo') {
      relationFieldName = 'reportToUser'
    }
  }

  let relationFieldDef = `  ${relationFieldName} ${relation.model}`

  // 根据关系类型添加数组标记
  if (relation.type === 'one-to-many' || relation.type === 'many-to-many') {
    relationFieldDef += '[]'
  } else if (relation.type === 'one-to-one' || relation.type === 'many-to-one') {
    relationFieldDef += '?'
  }

  // 生成外键字段（如果需要）
  let foreignKeyFieldDef: string | undefined

  // 添加关系属性
  const attributes: string[] = []

  if (relation.foreignKey || relation.references) {
    const relationAttr = []
    if (relation.foreignKey) {
      relationAttr.push(`fields: [${relation.foreignKey}]`)

      // 只有当关系字段名与外键字段名不同时，才生成外键字段
      // 如果关系字段本身就是外键字段（如 userId），则不需要生成额外的外键字段
      if (relation.type === 'many-to-one' || relation.type === 'one-to-one') {
        if (fieldName !== relation.foreignKey) {
          foreignKeyFieldDef = `  ${relation.foreignKey} String?`
        }
      }
    }
    if (relation.references) {
      relationAttr.push(`references: [${relation.references}]`)
    }

    // 根据数据库类型调整外键约束
    if (relation.onDelete) {
      // Prisma 使用首字母大写的操作名
      const onDeleteAction = relation.onDelete === 'CASCADE' ? 'Cascade' : relation.onDelete
      relationAttr.push(`onDelete: ${onDeleteAction}`)
    }
    if (relation.onUpdate) {
      // Prisma 使用首字母大写的操作名
      const onUpdateAction = relation.onUpdate === 'CASCADE' ? 'Cascade' : relation.onUpdate
      relationAttr.push(`onUpdate: ${onUpdateAction}`)
    }

    // 为避免关系名称冲突，为特定的关系添加名称
    let relationName = ''
    if (relationFieldName === 'reportToUser') {
      relationName = '"ReportTo", '
    } else if (relationFieldName === 'user' && relation.foreignKey === 'userId') {
      relationName = '"UserRelation", '
    } else if (relationFieldName === 'parent' && relation.foreignKey === 'parentId') {
      relationName = '"ParentChild", '
    } else if (relationFieldName === 'manager' && relation.foreignKey === 'managerId') {
      relationName = '"Manager", '
    }

    attributes.push(`@relation(${relationName}${relationAttr.join(', ')})`)
  }

  if (attributes.length > 0) {
    relationFieldDef += ` ${attributes.join(' ')}`
  }

  return {
    relationField: relationFieldDef,
    foreignKeyField: foreignKeyFieldDef
  }
}

/**
 * 生成模型定义
 */
function generateModel(entity: EntityDefinition, provider: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' = 'postgresql'): string {
  const { name, schema, meta } = entity
  const shape = schema.shape

  let modelDef = `model ${name} {\n`
  const generatedForeignKeys = new Set<string>()

  // 第一遍：生成所有普通字段和外键字段
  Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
    // 获取字段元数据（支持新的 defineField 方式）
    let fieldMeta = meta?.fields?.[fieldName]

    // 如果没有在 meta.fields 中找到，尝试从 schema 本身获取
    if (!fieldMeta) {
      fieldMeta = getFieldMeta(fieldSchema as z.ZodSchema)
    }

    const relationMeta = fieldMeta?.relation || meta?.relations?.[fieldName]

    if (relationMeta) {
      // 关系字段：检查是否需要生成外键字段
      if (relationMeta.foreignKey && !generatedForeignKeys.has(relationMeta.foreignKey)) {
        const { foreignKeyField } = generateRelationField(fieldName, relationMeta, provider)
        if (foreignKeyField) {
          modelDef += foreignKeyField + '\n'
          generatedForeignKeys.add(relationMeta.foreignKey)
        }
      }

      // 如果关系字段本身就是外键字段（字段名与 foreignKey 相同），
      // 则将其作为普通字段处理，而不是关系字段
      if (fieldName === relationMeta.foreignKey) {
        modelDef += generateField(fieldName, fieldSchema as z.ZodSchema, fieldMeta, provider) + '\n'
        generatedForeignKeys.add(fieldName) // 标记为已生成，避免重复
      }
    } else {
      // 普通字段
      modelDef += generateField(fieldName, fieldSchema as z.ZodSchema, fieldMeta, provider) + '\n'
    }
  })

  // 第二遍：生成所有关系字段
  Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
    // 获取字段元数据
    let fieldMeta = meta?.fields?.[fieldName]
    if (!fieldMeta) {
      fieldMeta = getFieldMeta(fieldSchema as z.ZodSchema)
    }

    const relationMeta = fieldMeta?.relation || meta?.relations?.[fieldName]

    if (relationMeta) {
      // 如果关系字段本身就是外键字段（如 userId），则在第一遍已经作为普通字段处理了
      // 现在需要生成对应的关系字段（如 user）
      const { relationField } = generateRelationField(fieldName, relationMeta, provider)
      modelDef += relationField + '\n'
    }
  })

  // 自动添加软删除字段（除非明确禁用或已存在）
  const hasSoftDeleteField = Object.entries(shape).some(([fieldName, fieldSchema]) => {
    // 检查字段名是否为 deletedAt
    if (fieldName === 'deletedAt') {
      return true
    }

    // 获取字段元数据（支持新的 defineField 方式）
    let fieldMeta = meta?.fields?.[fieldName]
    if (!fieldMeta) {
      fieldMeta = getFieldMeta(fieldSchema as z.ZodSchema)
    }

    // 检查字段是否有 softDelete 标记或者映射到 deleted_at
    return fieldMeta?.softDelete || fieldMeta?.map === 'deleted_at'
  })

  const softDeleteDisabled = meta?.softDelete === false

  if (!hasSoftDeleteField && !softDeleteDisabled) {
    modelDef += `  deletedAt     DateTime? @map("deleted_at")\n`
  }

  // 添加索引
  if (meta?.model?.indexes) {
    meta.model.indexes.forEach((index, _i) => {
      // 过滤出标量字段（非关系字段）
      const scalarFields = index.fields.filter(fieldName => {
        const fieldMeta = meta?.fields?.[fieldName] || getFieldMeta(shape[fieldName] as z.ZodSchema)
        const relationMeta = fieldMeta?.relation || meta?.relations?.[fieldName]
        return !relationMeta // 只包含非关系字段
      })

      if (scalarFields.length === 0) {
        // 如果没有标量字段，跳过这个索引
        return
      }

      const indexFields = scalarFields.join(', ')

      // 检查是否是单字段索引且该字段已经有 @unique 约束
      if (index.unique && scalarFields.length === 1) {
        const fieldName = scalarFields[0]
        let fieldMeta = meta?.fields?.[fieldName]
        if (!fieldMeta) {
          fieldMeta = getFieldMeta(shape[fieldName] as z.ZodSchema)
        }
        if (fieldMeta?.unique) {
          // 跳过，因为字段已经有 @unique 约束
          return
        }
      }

      // 生成索引名称
      const defaultIndexName = index.unique
        ? `${meta?.model?.tableName || name.toLowerCase()}_${scalarFields.join('_')}_key`
        : `${meta?.model?.tableName || name.toLowerCase()}_${scalarFields.join('_')}_idx`

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
 * 添加反向关系字段到相关模型
 */
function addReverseRelations(schema: string, entities: EntityDefinition[]): string {
  // 收集所有需要反向关系的信息
  const reverseRelations: Array<{
    targetModel: string
    relationName: string
    sourceModel: string
    sourceField: string
  }> = []

  entities.forEach(entity => {
    const { name, schema: entitySchema, meta } = entity
    const shape = entitySchema.shape

    Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
      let fieldMeta = meta?.fields?.[fieldName]
      if (!fieldMeta) {
        fieldMeta = getFieldMeta(fieldSchema as z.ZodSchema)
      }

      const relationMeta = fieldMeta?.relation || meta?.relations?.[fieldName]
      if (relationMeta && relationMeta.model) {
        // 生成反向关系字段名
        let reverseFieldName = name.toLowerCase() + 's'

        // 特殊处理某些关系
        if (relationMeta.foreignKey === 'userId') {
          if (name === 'Session') reverseFieldName = 'sessions'
          else if (name === 'Account') reverseFieldName = 'accounts'
          else if (name === 'UserRole') reverseFieldName = 'userRoles'
          else if (name === 'UserDepartment') reverseFieldName = 'userDepartments'
        } else if (relationMeta.foreignKey === 'roleId') {
          reverseFieldName = 'userRoles'
        } else if (relationMeta.foreignKey === 'departmentId') {
          reverseFieldName = 'userDepartments'
        } else if (relationMeta.foreignKey === 'parentId') {
          reverseFieldName = 'children'
        } else if (relationMeta.foreignKey === 'managerId') {
          reverseFieldName = 'managedDepartments'
        } else if (relationMeta.foreignKey === 'reportTo') {
          reverseFieldName = 'directReports'
        }

        // 确定关系名称
        let relationName = ''
        if (relationMeta.foreignKey === 'userId') {
          if (name === 'Session' || name === 'Account' || name === 'UserRole' || name === 'UserDepartment') {
            relationName = '"UserRelation"'
          }
        } else if (relationMeta.foreignKey === 'parentId') {
          relationName = '"ParentChild"'
        } else if (relationMeta.foreignKey === 'managerId') {
          relationName = '"Manager"'
        } else if (relationMeta.foreignKey === 'reportTo') {
          relationName = '"ReportTo"'
        }

        reverseRelations.push({
          targetModel: relationMeta.model,
          relationName,
          sourceModel: name,
          sourceField: reverseFieldName
        })
      }
    })
  })

  // 将反向关系添加到对应的模型中
  reverseRelations.forEach(({ targetModel, relationName, sourceModel, sourceField }) => {
    const modelRegex = new RegExp(`(model ${targetModel} \\{[^}]*)(\\}\\n)`, 's')
    const match = schema.match(modelRegex)

    if (match) {
      const relationDef = relationName
        ? `  ${sourceField} ${sourceModel}[] @relation(${relationName})\n`
        : `  ${sourceField} ${sourceModel}[]\n`

      const newModelDef = match[1] + relationDef + match[2]
      schema = schema.replace(modelRegex, newModelDef)
    }
  })

  return schema
}

/**
 * 生成完整的 Prisma Schema
 */
export function generatePrismaSchema(
  _databaseUrl: string = 'postgresql://localhost:5432/mydb',
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

  // 生成所有模型，传递 provider 参数
  entities.forEach(entity => {
    schema += generateModel(entity, provider) + '\n'
  })

  // 添加反向关系字段到相关模型
  schema = addReverseRelations(schema, entities)

  return schema
}

/**
 * 将 Prisma Schema 写入文件
 * 注意：此函数仅在 Node.js 环境中可用
 */
export async function writePrismaSchema(
  outputPath: string = './prisma/schema.prisma',
  options?: {
    databaseUrl?: string
    provider?: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver'
  }
): Promise<void> {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error('writePrismaSchema is only available in Node.js environment')
  }

  const fs = await import('fs/promises')
  const path = await import('path')

  const schema = generatePrismaSchema(options?.databaseUrl, options?.provider)

  // 确保目录存在
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })

  // 写入文件
  await fs.writeFile(outputPath, schema, 'utf-8')

  // 不在这里输出成功消息，由调用者输出
}
