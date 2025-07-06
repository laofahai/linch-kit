/**
 * Schema 提取器
 * 
 * 分析 LinchKit 项目中的 Zod schema 定义，提取：
 * - 实体定义（Entity）
 * - 字段定义（Field）
 * - 验证规则（Validation Rules）
 * - Schema 之间的关联关系
 */

import { readdir, readFile } from 'fs/promises'
import { join, relative } from 'path'

import { createLogger } from '@linch-kit/core/server'

import type { 
  GraphNode, 
  GraphRelationship, 
  ExtractionResult,
  Logger,
  NodeType,
  RelationType
} from '../types/index.js'
import { NodeType as NodeTypeEnum, RelationType as RelationTypeEnum } from '../types/index.js'

import { BaseExtractor } from './base-extractor.js'

interface SchemaInfo {
  name: string
  file: string
  type: 'entity' | 'field' | 'validator' | 'zod-schema'
  properties: Record<string, unknown>
  dependencies: string[]
  zodTypes: string[]
}

interface FieldInfo {
  name: string
  type: string
  isOptional: boolean
  isArray: boolean
  validationRules: string[]
}

interface EntityInfo {
  name: string
  fields: FieldInfo[]
  options: Record<string, unknown>
  extends?: string
}

/**
 * Schema 提取器实现
 */
export class SchemaExtractor extends BaseExtractor<SchemaInfo[]> {
  
  constructor() {
    super('SchemaExtractor')
  }

  /**
   * 提取原始数据
   */
  async extractRawData(): Promise<SchemaInfo[]> {
    // 1. 扫描 schema 相关文件
    const schemaFiles = await this.scanSchemaFiles()
    
    // 2. 解析每个文件中的 schema 定义
    const schemas = await this.parseSchemaFiles(schemaFiles)
    
    return schemas
  }

  /**
   * 转换为图数据
   */
  async transformToGraph(schemas: SchemaInfo[]): Promise<{ nodes: GraphNode[], relationships: GraphRelationship[] }> {
    return this.buildGraphData(schemas)
  }

  /**
   * 获取节点类型
   */
  getNodeType(): NodeType[] {
    return [NodeTypeEnum.SCHEMA_ENTITY, NodeTypeEnum.SCHEMA_FIELD]
  }

  /**
   * 获取关系类型
   */
  getRelationTypes(): RelationType[] {
    return [RelationTypeEnum.DEPENDS_ON, RelationTypeEnum.HAS_FIELD, RelationTypeEnum.EXTENDS, RelationTypeEnum.IMPLEMENTS]
  }

  /**
   * 扫描项目中的 schema 相关文件
   */
  private async scanSchemaFiles(): Promise<string[]> {
    const files: string[] = []
    
    // 扫描路径
    const scanPaths = [
      'packages/schema/src',
      'packages/*/src',
      'apps/*/src', 
      'modules/*/src'
    ]
    
    for (const scanPath of scanPaths) {
      try {
        const resolvedFiles = await this.scanDirectory(scanPath)
        files.push(...resolvedFiles)
      } catch (error) {
        this.logger.debug(`扫描目录失败: ${scanPath}`, { error: error instanceof Error ? error.message : String(error) })
      }
    }
    
    // 过滤 schema 相关文件
    const schemaFiles = files.filter(file => 
      file.endsWith('.ts') && 
      !file.includes('.test.') &&
      !file.includes('.spec.') &&
      (
        file.includes('schema') ||
        file.includes('entity') ||
        file.includes('field') ||
        file.includes('validation') ||
        file.includes('zod')
      )
    )
    
    this.logger.debug(`发现 ${schemaFiles.length} 个 schema 相关文件`)
    return schemaFiles
  }

  /**
   * 递归扫描目录
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = []
    const fullPath = join(process.cwd(), dirPath)
    
    try {
      const items = await readdir(fullPath, { withFileTypes: true })
      
      for (const item of items) {
        const itemPath = join(fullPath, item.name)
        const relativePath = relative(process.cwd(), itemPath)
        
        if (item.isDirectory()) {
          // 跳过常见的忽略目录
          if (!['node_modules', '.git', 'dist', 'build'].includes(item.name)) {
            const subFiles = await this.scanDirectory(relativePath)
            files.push(...subFiles)
          }
        } else if (item.isFile()) {
          files.push(relativePath)
        }
      }
    } catch (error) {
      // 目录不存在或无权限访问
      this.logger.debug(`无法访问目录: ${dirPath}`)
    }
    
    return files
  }

  /**
   * 解析 schema 文件
   */
  private async parseSchemaFiles(files: string[]): Promise<SchemaInfo[]> {
    const schemas: SchemaInfo[] = []
    
    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8')
        const fileSchemas = this.parseSchemaContent(file, content)
        schemas.push(...fileSchemas)
      } catch (error) {
        this.logger.debug(`解析文件失败: ${file}`, { error: error instanceof Error ? error.message : String(error) })
      }
    }
    
    return schemas
  }

  /**
   * 解析单个文件的 schema 内容
   */
  private parseSchemaContent(filePath: string, content: string): SchemaInfo[] {
    const schemas: SchemaInfo[] = []
    
    // 1. 查找 Entity 定义
    const entityMatches = content.matchAll(
      /(?:export\s+(?:const|class)\s+)(\w+)(?:\s*=\s*new\s+EntityImpl|(?:\s+extends\s+EntityImpl|\s+implements\s+Entity))/g
    )
    
    for (const match of entityMatches) {
      const entityName = match[1]
      const entityInfo = this.parseEntityDefinition(content, entityName)
      
      schemas.push({
        name: entityName,
        file: filePath,
        type: 'entity',
        properties: entityInfo as unknown as Record<string, unknown>,
        dependencies: this.extractDependencies(content),
        zodTypes: this.extractZodTypes(content)
      })
    }
    
    // 2. 查找 Field 定义
    const fieldMatches = content.matchAll(
      /(?:export\s+(?:const|function)\s+)(\w+Field)(?:\s*=|\s*\()/g
    )
    
    for (const match of fieldMatches) {
      const fieldName = match[1]
      
      schemas.push({
        name: fieldName,
        file: filePath,
        type: 'field',
        properties: this.parseFieldDefinition(content, fieldName),
        dependencies: this.extractDependencies(content),
        zodTypes: this.extractZodTypes(content)
      })
    }
    
    // 3. 查找 Zod Schema 定义
    const zodMatches = content.matchAll(
      /(?:export\s+(?:const|let|var)\s+)(\w+Schema)\s*=\s*z\./g
    )
    
    for (const match of zodMatches) {
      const schemaName = match[1]
      
      schemas.push({
        name: schemaName,
        file: filePath,
        type: 'zod-schema',
        properties: this.parseZodSchemaDefinition(content, schemaName),
        dependencies: this.extractDependencies(content),
        zodTypes: this.extractZodTypes(content)
      })
    }
    
    return schemas
  }

  /**
   * 解析 Entity 定义
   */
  private parseEntityDefinition(content: string, entityName: string): EntityInfo {
    const entity: EntityInfo = {
      name: entityName,
      fields: [],
      options: {}
    }
    
    // 查找 fields 定义
    const fieldsMatch = content.match(
      new RegExp(`${entityName}[^{]*{[^}]*fields\\s*:\\s*{([^}]+)}`,'s')
    )
    
    if (fieldsMatch) {
      const fieldsContent = fieldsMatch[1]
      entity.fields = this.parseFieldsDefinition(fieldsContent)
    }
    
    // 查找 options 定义
    const optionsMatch = content.match(
      new RegExp(`${entityName}[^{]*{[^}]*options\\s*:\\s*{([^}]+)}`,'s')
    )
    
    if (optionsMatch) {
      const optionsContent = optionsMatch[1]
      entity.options = this.parseOptionsDefinition(optionsContent)
    }
    
    return entity
  }

  /**
   * 解析字段定义
   */
  private parseFieldDefinition(content: string, fieldName: string): Record<string, unknown> {
    const fieldInfo: Record<string, unknown> = {
      name: fieldName,
      type: 'unknown'
    }
    
    // 查找字段类型和配置
    const fieldMatch = content.match(
      new RegExp(`${fieldName}[^=]*=\\s*([^;\\n]+)`,'s')
    )
    
    if (fieldMatch) {
      const fieldContent = fieldMatch[1]
      
      // 提取类型信息
      if (fieldContent.includes('string')) fieldInfo.type = 'string'
      else if (fieldContent.includes('number')) fieldInfo.type = 'number'
      else if (fieldContent.includes('boolean')) fieldInfo.type = 'boolean'
      else if (fieldContent.includes('date')) fieldInfo.type = 'date'
      else if (fieldContent.includes('array')) fieldInfo.type = 'array'
      else if (fieldContent.includes('object')) fieldInfo.type = 'object'
      
      // 提取验证规则
      const validationRules = []
      if (fieldContent.includes('required')) validationRules.push('required')
      if (fieldContent.includes('optional')) validationRules.push('optional')
      if (fieldContent.includes('min')) validationRules.push('min')
      if (fieldContent.includes('max')) validationRules.push('max')
      if (fieldContent.includes('email')) validationRules.push('email')
      if (fieldContent.includes('url')) validationRules.push('url')
      
      fieldInfo.validationRules = validationRules
    }
    
    return fieldInfo
  }

  /**
   * 解析 Zod Schema 定义
   */
  private parseZodSchemaDefinition(content: string, schemaName: string): Record<string, unknown> {
    const schemaInfo: Record<string, unknown> = {
      name: schemaName,
      type: 'zod-schema'
    }
    
    // 查找 schema 定义
    const schemaMatch = content.match(
      new RegExp(`${schemaName}\\s*=\\s*z\\.([^;\\n]+)`,'s')
    )
    
    if (schemaMatch) {
      const schemaContent = schemaMatch[1]
      
      // 提取 Zod 类型
      if (schemaContent.includes('object')) schemaInfo.zodType = 'object'
      else if (schemaContent.includes('string')) schemaInfo.zodType = 'string'
      else if (schemaContent.includes('number')) schemaInfo.zodType = 'number'
      else if (schemaContent.includes('boolean')) schemaInfo.zodType = 'boolean'
      else if (schemaContent.includes('array')) schemaInfo.zodType = 'array'
      else if (schemaContent.includes('union')) schemaInfo.zodType = 'union'
      else if (schemaContent.includes('record')) schemaInfo.zodType = 'record'
      
      // 提取字段（如果是 object）
      if (schemaContent.includes('object')) {
        const fields = this.extractZodObjectFields(schemaContent)
        schemaInfo.fields = fields
      }
    }
    
    return schemaInfo
  }

  /**
   * 提取字段定义
   */
  private parseFieldsDefinition(fieldsContent: string): FieldInfo[] {
    const fields: FieldInfo[] = []
    
    // 简单的字段解析（可以根据实际情况完善）
    const fieldMatches = fieldsContent.matchAll(/(\w+)\s*:\s*([^,}]+)/g)
    
    for (const match of fieldMatches) {
      const fieldName = match[1]
      const fieldDef = match[2]
      
      fields.push({
        name: fieldName,
        type: this.extractFieldType(fieldDef),
        isOptional: fieldDef.includes('optional'),
        isArray: fieldDef.includes('array'),
        validationRules: this.extractValidationRules(fieldDef)
      })
    }
    
    return fields
  }

  /**
   * 提取选项定义
   */
  private parseOptionsDefinition(optionsContent: string): Record<string, unknown> {
    const options: Record<string, unknown> = {}
    
    // 提取常见选项
    if (optionsContent.includes('timestamps')) options.timestamps = true
    if (optionsContent.includes('softDelete')) options.softDelete = true
    if (optionsContent.includes('tableName')) {
      const tableMatch = optionsContent.match(/tableName\s*:\s*['"]([^'"]+)['"]/)
      if (tableMatch) options.tableName = tableMatch[1]
    }
    
    return options
  }

  /**
   * 提取字段类型
   */
  private extractFieldType(fieldDef: string): string {
    if (fieldDef.includes('string')) return 'string'
    if (fieldDef.includes('number')) return 'number'
    if (fieldDef.includes('boolean')) return 'boolean'
    if (fieldDef.includes('date')) return 'date'
    if (fieldDef.includes('array')) return 'array'
    if (fieldDef.includes('object')) return 'object'
    return 'unknown'
  }

  /**
   * 提取验证规则
   */
  private extractValidationRules(fieldDef: string): string[] {
    const rules: string[] = []
    
    if (fieldDef.includes('required')) rules.push('required')
    if (fieldDef.includes('optional')) rules.push('optional')
    if (fieldDef.includes('min')) rules.push('min')
    if (fieldDef.includes('max')) rules.push('max')
    if (fieldDef.includes('email')) rules.push('email')
    if (fieldDef.includes('url')) rules.push('url')
    
    return rules
  }

  /**
   * 提取依赖关系
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = []
    
    // 提取 import 语句
    const importMatches = content.matchAll(/import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g)
    
    for (const match of importMatches) {
      const importPath = match[1]
      if (importPath.startsWith('@linch-kit/')) {
        dependencies.push(importPath)
      }
    }
    
    return dependencies
  }

  /**
   * 提取 Zod 类型
   */
  private extractZodTypes(content: string): string[] {
    const zodTypes: string[] = []
    
    // 查找 z.xxx 模式
    const zodMatches = content.matchAll(/z\.(\w+)/g)
    
    for (const match of zodMatches) {
      const zodType = match[1]
      if (!zodTypes.includes(zodType)) {
        zodTypes.push(zodType)
      }
    }
    
    return zodTypes
  }

  /**
   * 提取 Zod Object 字段
   */
  private extractZodObjectFields(schemaContent: string): Record<string, unknown> {
    const fields: Record<string, unknown> = {}
    
    // 查找 object 内的字段定义
    const objectMatch = schemaContent.match(/object\s*\(\s*{([^}]+)}\s*\)/)
    
    if (objectMatch) {
      const objectContent = objectMatch[1]
      const fieldMatches = objectContent.matchAll(/(\w+)\s*:\s*z\.([^,}]+)/g)
      
      for (const match of fieldMatches) {
        const fieldName = match[1]
        const fieldType = match[2]
        
        fields[fieldName] = {
          type: fieldType.split('(')[0], // 去掉参数部分
          isOptional: fieldType.includes('optional'),
          isArray: fieldType.includes('array')
        }
      }
    }
    
    return fields
  }

  /**
   * 构建图数据
   */
  private buildGraphData(schemas: SchemaInfo[]): { nodes: GraphNode[], relationships: GraphRelationship[] } {
    const nodes: GraphNode[] = []
    const relationships: GraphRelationship[] = []
    
    // 创建 schema 节点
    for (const schema of schemas) {
      const node: GraphNode = {
        id: `schema:${schema.name}`,
        type: NodeTypeEnum.SCHEMA_ENTITY,
        name: schema.name,
        properties: {
          file: schema.file,
          schema_type: schema.type,
          zod_types: schema.zodTypes,
          ...schema.properties
        },
        metadata: {
          source_file: schema.file,
          created_at: new Date().toISOString()
        }
      }
      
      nodes.push(node)
      
      // 创建依赖关系
      for (const dep of schema.dependencies) {
        const relationship: GraphRelationship = {
          id: `schema:${schema.name}:depends_on:${dep}`,
          type: RelationTypeEnum.DEPENDS_ON,
          source: `schema:${schema.name}`,
          target: `package:${dep}`,
          properties: {
            dependency_type: 'import'
          },
          metadata: {
            created_at: new Date().toISOString()
          }
        }
        
        relationships.push(relationship)
      }
      
      // 为 entity 创建字段关系
      if (schema.type === 'entity' && schema.properties.fields) {
        const fields = schema.properties.fields as FieldInfo[]
        
        for (const field of fields) {
          const fieldRelationship: GraphRelationship = {
            id: `schema:${schema.name}:has_field:${field.name}`,
            type: RelationTypeEnum.HAS_FIELD,
            source: `schema:${schema.name}`,
            target: `field:${field.name}`,
            properties: {
              field_type: field.type,
              is_optional: field.isOptional,
              is_array: field.isArray,
              validation_rules: field.validationRules
            },
            metadata: {
              created_at: new Date().toISOString()
            }
          }
          
          relationships.push(fieldRelationship)
        }
      }
    }
    
    return { nodes, relationships }
  }
}