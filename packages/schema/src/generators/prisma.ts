/**
 * @linch-kit/schema Prisma Schema 生成器
 */

import type { Entity, FieldDefinition, GeneratedFile } from '../types'

import { BaseGenerator } from './base'

/**
 * Prisma Schema 生成器
 */
export class PrismaGenerator extends BaseGenerator {
  readonly name = 'prisma'

  /**
   * 生成Prisma Schema文件
   */
  async generate(entities: Entity[]): Promise<GeneratedFile[]> {
    this.validateEntities(entities)

    const schemaContent = this.generateSchema(entities)
    
    return [
      this.createGeneratedFile('schema.prisma', schemaContent, 'prisma')
    ]
  }

  protected getFileExtension(): string {
    return '.prisma'
  }

  /**
   * 生成完整的Prisma Schema
   */
  private generateSchema(entities: Entity[]): string {
    const sections = [
      this.generateGenerator(),
      this.generateDatasource(),
      ...entities.map(entity => this.generateModel(entity))
    ]

    return sections.join('\n\n')
  }

  /**
   * 生成generator配置
   */
  private generateGenerator(): string {
    return `generator client {
  provider = "prisma-client-js"
  output   = "./generated/client"
}`
  }

  /**
   * 生成datasource配置
   */
  private generateDatasource(): string {
    return `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  }

  /**
   * 生成单个模型
   */
  private generateModel(entity: Entity): string {
    const fields: string[] = []
    const modelAttributes: string[] = []

    // 添加ID字段
    fields.push('  id        String   @id @default(uuid())')

    // 添加用户定义的字段
    Object.entries(entity.fields).forEach(([name, field]) => {
      const fieldString = this.generateField(name, field as FieldDefinition)
      if (fieldString) {
        fields.push(`  ${fieldString}`)
      }
    })

    // 添加时间戳字段
    if (entity.options.timestamps) {
      fields.push('  createdAt DateTime @default(now()) @map("created_at")')
      fields.push('  updatedAt DateTime @updatedAt @map("updated_at")')
    }

    // 添加软删除字段
    if (entity.options.softDelete) {
      fields.push('  deletedAt DateTime? @map("deleted_at")')
    }

    // 添加表映射
    const tableName = entity.options.tableName || this.toSnakeCase(entity.name)
    modelAttributes.push(`  @@map("${tableName}")`)

    // 添加索引
    if (entity.options.indexes) {
      entity.options.indexes.forEach(index => {
        const indexFields = index.fields.join(', ')
        const indexName = index.name || `idx_${tableName}_${index.fields.join('_')}`
        if (index.unique) {
          modelAttributes.push(`  @@unique([${indexFields}], map: "${indexName}")`)
        } else {
          modelAttributes.push(`  @@index([${indexFields}], map: "${indexName}")`)
        }
      })
    }

    const modelBody = [...fields, '', ...modelAttributes].join('\n')
    
    return `model ${entity.name} {
${modelBody}
}`
  }

  /**
   * 生成单个字段
   */
  private generateField(name: string, field: FieldDefinition): string | null {
    // 跳过反向关系字段
    if (field.type === 'relation' && field.relation === 'one-to-many') {
      return this.generateReverseRelation(name, field)
    }

    const prismaType = this.mapFieldTypeToPrisma(field)
    const nullable = field.required ? '' : '?'
    const attributes = this.generateFieldAttributes(field)

    return `${name}${' '.repeat(Math.max(1, 12 - name.length))}${prismaType}${nullable}${attributes}`
  }

  /**
   * 映射字段类型到Prisma类型
   */
  private mapFieldTypeToPrisma(field: FieldDefinition): string {
    switch (field.type) {
      case 'string':
      case 'email':
      case 'url':
      case 'uuid':
        return 'String'
      
      case 'text':
        return 'String' // 或者使用 @db.Text 属性
      
      case 'number':
        return field.int ? 'Int' : 'Float'
      
      case 'boolean':
        return 'Boolean'
      
      case 'date':
        return 'DateTime'
      
      case 'json':
        return 'Json'
      
      case 'enum':
        return this.toPascalCase(field.values[0]) + 'Enum' // 需要生成枚举定义
      
      case 'array': {
        const itemType = this.mapFieldTypeToPrisma(field.items)
        return `${itemType}[]`
      }
      
      case 'relation':
        if (field.relation === 'many-to-many') {
          return `${field.target}[]`
        }
        return field.target
      
      case 'i18n':
        return 'Json' // 存储为JSON
      
      default:
        return 'String'
    }
  }

  /**
   * 生成字段属性
   */
  private generateFieldAttributes(field: FieldDefinition): string {
    const attributes: string[] = []

    // 唯一约束
    if (field.unique) {
      attributes.push('@unique')
    }

    // 默认值
    if (field.default !== undefined) {
      const defaultValue = this.formatDefaultValue(field.default, field.type)
      attributes.push(`@default(${defaultValue})`)
    }

    // 数据库特定属性
    switch (field.type) {
      case 'text':
        attributes.push('@db.Text')
        break
      
      case 'uuid':
        if (!field.default) {
          attributes.push('@default(uuid())')
        }
        break
      
      case 'enum':
        // 枚举类型会在模型外部定义
        break
    }

    // 关系字段属性
    if (field.type === 'relation') {
      const relationAttrs = this.generateRelationAttributes(field)
      if (relationAttrs) {
        attributes.push(relationAttrs)
      }
    }

    return attributes.length > 0 ? ' ' + attributes.join(' ') : ''
  }

  /**
   * 格式化默认值
   */
  private formatDefaultValue(value: any, fieldType: string): string {
    if (value === null) return 'null'
    
    switch (fieldType) {
      case 'string':
      case 'email':
      case 'url':
      case 'text':
        return `"${value}"`
      
      case 'number':
      case 'boolean':
        return String(value)
      
      case 'date':
        if (value === 'now') return 'now()'
        return `"${value}"`
      
      case 'uuid':
        return 'uuid()'
      
      case 'enum':
        return value
      
      default:
        return `"${value}"`
    }
  }

  /**
   * 生成关系属性
   */
  private generateRelationAttributes(field: FieldDefinition): string | null {
    if (field.type !== 'relation') return null

    const attrs: string[] = []

    // 外键字段
    if (field.foreignKey) {
      attrs.push(`fields: [${field.foreignKey}]`)
      attrs.push(`references: [id]`)
    }

    // 级联操作
    if (field.onDelete) {
      attrs.push(`onDelete: ${field.onDelete}`)
    }
    if (field.onUpdate) {
      attrs.push(`onUpdate: ${field.onUpdate}`)
    }

    return attrs.length > 0 ? `@relation(${attrs.join(', ')})` : '@relation'
  }

  /**
   * 生成反向关系字段
   */
  private generateReverseRelation(name: string, field: FieldDefinition): string {
    return `${name}${' '.repeat(Math.max(1, 12 - name.length))}${field.target}[]`
  }

  /**
   * 生成枚举定义
   */
  private generateEnums(entities: Entity[]): string[] {
    const enums: string[] = []
    
    entities.forEach(entity => {
      Object.entries(entity.fields).forEach(([fieldName, field]) => {
        if (field.type === 'enum') {
          const enumName = this.toPascalCase(fieldName) + 'Enum'
          const enumValues = field.values.map(value => `  ${value}`).join('\n')
          
          enums.push(`enum ${enumName} {
${enumValues}
}`)
        }
      })
    })

    return enums
  }

  /**
   * 重写生成方法以包含枚举
   */
  async generateWithEnums(entities: Entity[]): Promise<GeneratedFile[]> {
    this.validateEntities(entities)

    const enums = this.generateEnums(entities)
    const models = entities.map(entity => this.generateModel(entity))
    
    const sections = [
      this.generateGenerator(),
      this.generateDatasource(),
      ...enums,
      ...models
    ]

    const schemaContent = sections.join('\n\n')
    
    return [
      this.createGeneratedFile('schema.prisma', schemaContent, 'prisma')
    ]
  }
}