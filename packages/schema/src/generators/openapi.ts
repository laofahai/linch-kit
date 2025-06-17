import { z } from 'zod'
import type { EntityDefinition } from '../core/types'
import { getAllEntities } from '../core/entity'
import { ValidatorGenerator } from './validators'

/**
 * OpenAPI 3.0 规范类型
 */
export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  paths: Record<string, any>
  components: {
    schemas: Record<string, any>
    responses?: Record<string, any>
    parameters?: Record<string, any>
  }
}

/**
 * 将 Zod Schema 转换为 OpenAPI Schema
 */
function zodToOpenAPISchema(schema: z.ZodSchema): any {
  const zodType = (schema as any)._def.typeName

  switch (zodType) {
    case 'ZodString':
      const stringSchema = schema as z.ZodString
      const stringDef: any = { type: 'string' }
      
      // 检查字符串约束
      if ((stringSchema as any)._def.checks) {
        for (const check of (stringSchema as any)._def.checks) {
          switch (check.kind) {
            case 'email':
              stringDef.format = 'email'
              break
            case 'url':
              stringDef.format = 'uri'
              break
            case 'uuid':
              stringDef.format = 'uuid'
              break
            case 'min':
              stringDef.minLength = check.value
              break
            case 'max':
              stringDef.maxLength = check.value
              break
          }
        }
      }
      return stringDef

    case 'ZodNumber':
      const numberSchema = schema as z.ZodNumber
      const numberDef: any = { type: 'number' }
      
      if ((numberSchema as any)._def.checks) {
        for (const check of (numberSchema as any)._def.checks) {
          switch (check.kind) {
            case 'int':
              numberDef.type = 'integer'
              break
            case 'min':
              numberDef.minimum = check.value
              break
            case 'max':
              numberDef.maximum = check.value
              break
          }
        }
      }
      return numberDef

    case 'ZodBoolean':
      return { type: 'boolean' }

    case 'ZodDate':
      return { type: 'string', format: 'date-time' }

    case 'ZodEnum':
      const enumSchema = schema as z.ZodEnum<any>
      return {
        type: 'string',
        enum: (enumSchema as any)._def.values
      }

    case 'ZodArray':
      const arraySchema = schema as z.ZodArray<any>
      return {
        type: 'array',
        items: zodToOpenAPISchema((arraySchema as any)._def.type)
      }

    case 'ZodObject':
      const objectSchema = schema as z.ZodObject<any>
      const properties: Record<string, any> = {}
      const required: string[] = []

      Object.entries(objectSchema.shape).forEach(([key, fieldSchema]) => {
        properties[key] = zodToOpenAPISchema(fieldSchema as z.ZodSchema)
        
        // 检查是否为必填字段
        const fieldType = (fieldSchema as any)._def.typeName
        if (fieldType !== 'ZodOptional' && fieldType !== 'ZodNullable') {
          required.push(key)
        }
      })

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      }

    case 'ZodOptional':
      const optionalSchema = schema as z.ZodOptional<any>
      return zodToOpenAPISchema((optionalSchema as any)._def.innerType)

    case 'ZodNullable':
      const nullableSchema = schema as z.ZodNullable<any>
      const innerSchema = zodToOpenAPISchema((nullableSchema as any)._def.innerType)
      return {
        ...innerSchema,
        nullable: true
      }

    case 'ZodDefault':
      const defaultSchema = schema as z.ZodDefault<any>
      const defaultInnerSchema = zodToOpenAPISchema((defaultSchema as any)._def.innerType)
      return {
        ...defaultInnerSchema,
        default: (defaultSchema as any)._def.defaultValue()
      }

    case 'ZodRecord':
      const recordSchema = schema as z.ZodRecord<any>
      return {
        type: 'object',
        additionalProperties: zodToOpenAPISchema((recordSchema as any)._def.valueType)
      }

    default:
      return { type: 'string' }
  }
}

/**
 * 生成完整的 OpenAPI 规范
 */
export function generateOpenAPISpec(options: {
  title?: string
  version?: string
  description?: string
  servers?: Array<{ url: string; description?: string }>
} = {}): OpenAPISpec {
  const entities = getAllEntities()
  
  const spec: OpenAPISpec = {
    openapi: '3.0.3',
    info: {
      title: options.title || 'Linch Kit API',
      version: options.version || '1.0.0',
      description: options.description || 'Auto-generated API documentation from Linch Kit schema'
    },
    servers: options.servers || [
      { url: 'http://localhost:3000/api', description: 'Development server' }
    ],
    paths: {},
    components: {
      schemas: {}
    }
  }

  // 生成每个实体的 schemas
  entities.forEach(entity => {
    const generator = new ValidatorGenerator(entity)
    const entityName = entity.name

    // 生成 schemas
    spec.components.schemas[`${entityName}Create`] = zodToOpenAPISchema(generator.generateCreateValidator())
    spec.components.schemas[`${entityName}Update`] = zodToOpenAPISchema(generator.generateUpdateValidator())
    spec.components.schemas[`${entityName}Response`] = zodToOpenAPISchema(generator.generateResponseValidator())
    spec.components.schemas[`${entityName}Query`] = zodToOpenAPISchema(generator.generateQueryValidator())
  })

  return spec
}

/**
 * 将 OpenAPI 规范写入文件
 */
export async function writeOpenAPISpec(
  outputPath: string = './docs/api.json',
  options?: Parameters<typeof generateOpenAPISpec>[0]
): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const spec = generateOpenAPISpec(options)
  
  // 确保目录存在
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })
  
  // 写入文件
  await fs.writeFile(outputPath, JSON.stringify(spec, null, 2), 'utf-8')
  
  console.log(`✅ OpenAPI specification generated at: ${outputPath}`)
}
