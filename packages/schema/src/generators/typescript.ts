/**
 * @linch-kit/schema TypeScript 类型生成器
 */

import type { Entity, FieldDefinition, GeneratedFile } from '../types'

import { BaseGenerator } from './base'

/**
 * TypeScript 类型生成器
 */
export class TypeScriptGenerator extends BaseGenerator {
  readonly name = 'typescript'

  /**
   * 生成TypeScript类型文件
   */
  async generate(entities: Entity[]): Promise<GeneratedFile[]> {
    this.validateEntities(entities)

    const files: GeneratedFile[] = []

    // 为每个实体生成单独的类型文件
    entities.forEach(entity => {
      const content = this.generateEntityTypes(entity)
      const fileName = `${this.toKebabCase(entity.name)}.types.ts`
      files.push(this.createGeneratedFile(fileName, content, 'types'))
    })

    // 生成索引文件
    const indexContent = this.generateIndexFile(entities)
    files.push(this.createGeneratedFile('index.ts', indexContent, 'types'))

    // 生成通用类型文件
    const commonContent = this.generateCommonTypes()
    files.push(this.createGeneratedFile('common.types.ts', commonContent, 'types'))

    return files
  }

  protected getFileExtension(): string {
    return '.ts'
  }

  /**
   * 生成单个实体的TypeScript类型
   */
  private generateEntityTypes(entity: Entity): string {
    const sections = [
      this.generateImports(entity),
      this.generateBaseInterface(entity),
      this.generateCreateInput(entity),
      this.generateUpdateInput(entity),
      this.generatePartialTypes(entity),
      this.generateFilterTypes(entity),
      this.generateRelationTypes(entity)
    ].filter(Boolean)

    return sections.join('\n\n')
  }

  /**
   * 生成导入语句
   */
  private generateImports(entity: Entity): string {
    const imports: string[] = []
    
    // 检查是否需要导入其他实体类型
    const relationTargets = new Set<string>()
    Object.values(entity.fields).forEach(field => {
      if (field.type === 'relation' && field.target !== entity.name) {
        relationTargets.add(field.target)
      }
    })

    if (relationTargets.size > 0) {
      const targets = Array.from(relationTargets)
        .map(target => this.toKebabCase(target))
        .map(target => `type { ${this.toPascalCase(target)} } from './${target}.types'`)
        .join('\n')
      imports.push(targets)
    }

    // 导入通用类型
    imports.push("import type { BaseEntity, TimestampFields, SoftDeleteFields } from './common.types'")

    return imports.join('\n')
  }

  /**
   * 生成基础接口
   */
  private generateBaseInterface(entity: Entity): string {
    const fields: string[] = []
    
    // 用户定义的字段
    Object.entries(entity.fields).forEach(([name, field]) => {
      const fieldType = this.mapFieldTypeToTypeScript(field as FieldDefinition)
      const optional = field.required ? '' : '?'
      const comment = field.description ? `\n  /** ${field.description} */` : ''
      
      fields.push(`${comment}
  ${name}${optional}: ${fieldType}`)
    })

    let extendsClause = 'BaseEntity'
    
    // 添加时间戳
    if (entity.options.timestamps) {
      extendsClause += ', TimestampFields'
    }
    
    // 添加软删除
    if (entity.options.softDelete) {
      extendsClause += ', SoftDeleteFields'
    }

    const fieldsString = fields.length > 0 ? fields.join('') + '\n' : ''

    return `/**
 * ${entity.name} entity interface
 */
export interface ${entity.name} extends ${extendsClause} {${fieldsString}}`
  }

  /**
   * 生成创建输入类型
   */
  private generateCreateInput(entity: Entity): string {
    const fields: string[] = []
    
    Object.entries(entity.fields).forEach(([name, field]) => {
      // 跳过反向关系字段
      if (field.type === 'relation' && field.relation === 'one-to-many') {
        return
      }
      
      const fieldType = this.mapFieldTypeToTypeScript(field as FieldDefinition, 'create')
      const optional = field.required ? '' : '?'
      const comment = field.description ? `\n  /** ${field.description} */` : ''
      
      fields.push(`${comment}
  ${name}${optional}: ${fieldType}`)
    })

    const fieldsString = fields.length > 0 ? fields.join('') + '\n' : ''

    return `/**
 * Input type for creating ${entity.name}
 */
export interface Create${entity.name}Input {${fieldsString}}`
  }

  /**
   * 生成更新输入类型
   */
  private generateUpdateInput(entity: Entity): string {
    return `/**
 * Input type for updating ${entity.name}
 */
export interface Update${entity.name}Input extends Partial<Create${entity.name}Input> {}`
  }

  /**
   * 生成部分类型
   */
  private generatePartialTypes(entity: Entity): string {
    return `/**
 * Partial ${entity.name} type
 */
export type Partial${entity.name} = Partial<${entity.name}>

/**
 * ${entity.name} without relations
 */
export type ${entity.name}WithoutRelations = Omit<${entity.name}, ${this.getRelationFieldNames(entity).map(name => `'${name}'`).join(' | ') || 'never'}>

/**
 * ${entity.name} with selected fields
 */
export type ${entity.name}Select<T extends keyof ${entity.name}> = Pick<${entity.name}, T>`
  }

  /**
   * 生成过滤器类型
   */
  private generateFilterTypes(entity: Entity): string {
    const filterFields: string[] = []
    
    Object.entries(entity.fields).forEach(([name, field]) => {
      const baseType = this.mapFieldTypeToTypeScript(field as FieldDefinition)
      let filterType = baseType
      
      // 根据字段类型生成不同的过滤选项
      switch (field.type) {
        case 'string':
        case 'email':
        case 'url':
        case 'text':
          filterType = `StringFilter | ${baseType}`
          break
        case 'number':
          filterType = `NumberFilter | ${baseType}`
          break
        case 'date':
          filterType = `DateFilter | ${baseType}`
          break
        case 'boolean':
          filterType = `BooleanFilter | ${baseType}`
          break
        case 'enum':
          filterType = `EnumFilter<${baseType}> | ${baseType}`
          break
        default:
          filterType = `${baseType} | null`
      }
      
      filterFields.push(`  ${name}?: ${filterType}`)
    })

    const fieldsString = filterFields.length > 0 ? '\n' + filterFields.join('\n') + '\n' : ''

    return `/**
 * Filter type for ${entity.name}
 */
export interface ${entity.name}Filter {${fieldsString}}

/**
 * Where input for ${entity.name}
 */
export interface ${entity.name}Where extends ${entity.name}Filter {
  AND?: ${entity.name}Where[]
  OR?: ${entity.name}Where[]
  NOT?: ${entity.name}Where
}`
  }

  /**
   * 生成关系类型
   */
  private generateRelationTypes(entity: Entity): string {
    const relationFields = this.getRelationFields(entity)
    
    if (relationFields.length === 0) {
      return ''
    }

    const includeFields = relationFields.map(([name, field]) => {
      if (field.relation === 'one-to-many' || field.relation === 'many-to-many') {
        return `  ${name}?: boolean | ${field.target}FindManyArgs`
      } else {
        return `  ${name}?: boolean | ${field.target}FindUniqueArgs`
      }
    }).join('\n')

    return `/**
 * Include relations for ${entity.name}
 */
export interface ${entity.name}Include {
${includeFields}
}

/**
 * ${entity.name} with relations
 */
export type ${entity.name}WithRelations<T extends ${entity.name}Include = {}> = ${entity.name} & {
  [K in keyof T]: T[K] extends true
    ? K extends keyof ${entity.name}
      ? ${entity.name}[K]
      : never
    : never
}`
  }

  /**
   * 生成索引文件
   */
  private generateIndexFile(entities: Entity[]): string {
    const exports = entities.map(entity => {
      const fileName = this.toKebabCase(entity.name)
      return `export * from './${fileName}.types'`
    }).join('\n')

    return `${exports}
export * from './common.types'`
  }

  /**
   * 生成通用类型文件
   */
  private generateCommonTypes(): string {
    return `/**
 * Common types used across all entities
 */

/**
 * Base entity interface
 */
export interface BaseEntity {
  id: string
}

/**
 * Timestamp fields
 */
export interface TimestampFields {
  createdAt: Date
  updatedAt: Date
}

/**
 * Soft delete fields
 */
export interface SoftDeleteFields {
  deletedAt?: Date | null
}

/**
 * String filter operations
 */
export interface StringFilter {
  equals?: string
  not?: string | StringFilter
  in?: string[]
  notIn?: string[]
  contains?: string
  startsWith?: string
  endsWith?: string
  mode?: 'default' | 'insensitive'
}

/**
 * Number filter operations
 */
export interface NumberFilter {
  equals?: number
  not?: number | NumberFilter
  in?: number[]
  notIn?: number[]
  lt?: number
  lte?: number
  gt?: number
  gte?: number
}

/**
 * Date filter operations
 */
export interface DateFilter {
  equals?: Date | string
  not?: Date | string | DateFilter
  in?: Date[] | string[]
  notIn?: Date[] | string[]
  lt?: Date | string
  lte?: Date | string
  gt?: Date | string
  gte?: Date | string
}

/**
 * Boolean filter operations
 */
export interface BooleanFilter {
  equals?: boolean
  not?: boolean | BooleanFilter
}

/**
 * Enum filter operations
 */
export interface EnumFilter<T> {
  equals?: T
  not?: T | EnumFilter<T>
  in?: T[]
  notIn?: T[]
}

/**
 * Pagination arguments
 */
export interface PaginationArgs {
  skip?: number
  take?: number
}

/**
 * Ordering arguments
 */
export interface OrderByArgs {
  [key: string]: 'asc' | 'desc'
}

/**
 * Find many arguments
 */
export interface FindManyArgs<T = any> extends PaginationArgs {
  where?: T
  orderBy?: OrderByArgs | OrderByArgs[]
  include?: any
  select?: any
}

/**
 * Find unique arguments
 */
export interface FindUniqueArgs<T = any> {
  where: T
  include?: any
  select?: any
}`
  }

  /**
   * 映射字段类型到TypeScript类型
   */
  private mapFieldTypeToTypeScript(field: FieldDefinition, context: 'read' | 'create' = 'read'): string {
    switch (field.type) {
      case 'string':
      case 'email':
      case 'url':
      case 'uuid':
      case 'text':
        return 'string'
      
      case 'number':
        return 'number'
      
      case 'boolean':
        return 'boolean'
      
      case 'date':
        return 'Date'
      
      case 'json':
        return 'Record<string, unknown>'
      
      case 'enum':
        return field.values.map(v => `'${v}'`).join(' | ')
      
      case 'array': {
        const itemType = this.mapFieldTypeToTypeScript(field.items, context)
        return `${itemType}[]`
      }
      
      case 'relation':
        if (context === 'create') {
          // 创建时通常只需要ID
          if (field.relation === 'one-to-many' || field.relation === 'many-to-many') {
            return 'string[]'
          }
          return 'string'
        }
        
        // 读取时返回完整对象
        if (field.relation === 'one-to-many' || field.relation === 'many-to-many') {
          return `${field.target}[]`
        }
        return field.target
      
      case 'i18n':
        if (field.i18n) {
          const locales = field.i18n.locales.map(l => `'${l}'`).join(' | ')
          return `Partial<Record<${locales}, string>>`
        }
        return 'Record<string, string>'
      
      default:
        return 'unknown'
    }
  }

  /**
   * 获取关系字段
   */
  private getRelationFields(entity: Entity): Array<[string, FieldDefinition]> {
    return Object.entries(entity.fields)
      .filter(([_, field]) => field.type === 'relation') as Array<[string, FieldDefinition]>
  }

  /**
   * 获取关系字段名称
   */
  private getRelationFieldNames(entity: Entity): string[] {
    return this.getRelationFields(entity).map(([name]) => name)
  }
}