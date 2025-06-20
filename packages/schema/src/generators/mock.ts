/* eslint-disable no-case-declarations */
import { z } from 'zod'

import type { EntityDefinition } from '../core/types'
import { getAllEntities } from '../core/entity'
import { getFieldMeta } from '../core/decorators'

/**
 * Mock 数据生成器配置
 */
export interface MockConfig {
  /** 生成数据的数量 */
  count?: number
  /** 自定义字段生成器 */
  fieldGenerators?: Record<string, () => any>
  /** 是否包含关系数据 */
  includeRelations?: boolean
  /** 随机种子 */
  seed?: number
}

/**
 * 默认的字段值生成器
 */
const defaultGenerators = {
  string: () => `mock_${Math.random().toString(36).substring(7)}`,
  email: () => `user${Math.floor(Math.random() * 1000)}@example.com`,
  url: () => `https://example.com/${Math.random().toString(36).substring(7)}`,
  uuid: () => crypto.randomUUID(),
  number: () => Math.floor(Math.random() * 100),
  float: () => Math.random() * 100,
  boolean: () => Math.random() > 0.5,
  date: () => new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
  enum: (options: string[]) => options[Math.floor(Math.random() * options.length)],
}

/**
 * 根据 Zod Schema 生成 Mock 数据
 */
export function generateMockValue(schema: z.ZodSchema, _fieldName?: string): any {
  const zodType = (schema as any)._def.typeName

   
  switch (zodType) {
    case 'ZodString':
      const stringSchema = schema as z.ZodString
      // 检查是否有特殊格式
      if ((stringSchema as any)._def.checks) {
        for (const check of (stringSchema as any)._def.checks) {
          if (check.kind === 'email') {
            return defaultGenerators.email()
          }
          if (check.kind === 'url') {
            return defaultGenerators.url()
          }
          if (check.kind === 'uuid') {
            return defaultGenerators.uuid()
          }
        }
      }
      return defaultGenerators.string()

    case 'ZodNumber':
      const numberSchema = schema as z.ZodNumber
      if ((numberSchema as any)._def.checks) {
        for (const check of (numberSchema as any)._def.checks) {
          if (check.kind === 'int') {
            return Math.floor(defaultGenerators.number())
          }
        }
      }
      return defaultGenerators.float()

    case 'ZodBigInt':
      return BigInt(Math.floor(Math.random() * 1000000))

    case 'ZodBoolean':
      return defaultGenerators.boolean()

    case 'ZodDate':
      return defaultGenerators.date()

    case 'ZodEnum':
      const enumSchema = schema as z.ZodEnum<any>
      return defaultGenerators.enum((enumSchema as any)._def.values)

    case 'ZodArray':
      const arraySchema = schema as z.ZodArray<any>
      const arrayLength = Math.floor(Math.random() * 3) + 1
      return Array.from({ length: arrayLength }, () =>
        generateMockValue((arraySchema as any)._def.type)
      )

    case 'ZodObject':
      const objectSchema = schema as z.ZodObject<any>
      const mockObject: Record<string, any> = {}
      Object.entries(objectSchema.shape).forEach(([key, fieldSchema]) => {
        mockObject[key] = generateMockValue(fieldSchema as z.ZodSchema, key)
      })
      return mockObject

    case 'ZodOptional':
      const optionalSchema = schema as z.ZodOptional<any>
      // 70% 概率生成值
      return Math.random() > 0.3 ? generateMockValue((optionalSchema as any)._def.innerType) : undefined

    case 'ZodNullable':
      const nullableSchema = schema as z.ZodNullable<any>
      // 80% 概率生成值
      return Math.random() > 0.2 ? generateMockValue((nullableSchema as any)._def.innerType) : null

    case 'ZodDefault':
      const defaultSchema = schema as z.ZodDefault<any>
      // 50% 概率使用默认值
      return Math.random() > 0.5
        ? (defaultSchema as any)._def.defaultValue()
        : generateMockValue((defaultSchema as any)._def.innerType)

    case 'ZodRecord':
      const recordSchema = schema as z.ZodRecord<any>
      const recordSize = Math.floor(Math.random() * 3) + 1
      const mockRecord: Record<string, any> = {}
      for (let i = 0; i < recordSize; i++) {
        const key = `key_${i}`
        mockRecord[key] = generateMockValue((recordSchema as any)._def.valueType)
      }
      return mockRecord

    default:
      return null
  }
}

/**
 * 为实体生成 Mock 数据
 */
export function generateMockData<T extends Record<string, any> = any>(
  entity: EntityDefinition,
  config: MockConfig = {}
): T[] {
  const { count = 1, fieldGenerators = {}, includeRelations = false } = config
  const shape = entity.schema.shape
  const mockData: T[] = []

  for (let i = 0; i < count; i++) {
    const mockItem: Record<string, any> = {}

    Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
      const meta = getFieldMeta(fieldSchema as z.ZodSchema)
      const relationMeta = meta?.relation || entity.meta?.relations?.[fieldName]

      // 跳过关系字段（除非明确要求包含）
      if (relationMeta && !includeRelations) {
        return
      }

      // 使用自定义生成器
      if (fieldGenerators[fieldName]) {
        mockItem[fieldName] = fieldGenerators[fieldName]()
        return
      }

      // 处理特殊字段（支持新的 primary 字段）
      if (meta?.id || meta?.primary) {
        mockItem[fieldName] = defaultGenerators.uuid()
        return
      }

      if (meta?.createdAt || meta?.updatedAt) {
        mockItem[fieldName] = defaultGenerators.date()
        return
      }

      // 跳过软删除字段
      if (meta?.softDelete) {
        return
      }

      // 处理默认值
      if (meta?.default !== undefined) {
        // 80% 概率使用默认值
        if (Math.random() > 0.2) {
          mockItem[fieldName] = meta.default
          return
        }
      }

      // 生成普通字段值
      mockItem[fieldName] = generateMockValue(fieldSchema as z.ZodSchema, fieldName)
    })

    mockData.push(mockItem as T)
  }

  return mockData
}

/**
 * 为所有实体生成 Mock 数据
 */
export function generateAllMockData(config: MockConfig = {}): Record<string, any[]> {
  const entities = getAllEntities()
  const mockData: Record<string, any[]> = {}

  entities.forEach(entity => {
    mockData[entity.name] = generateMockData(entity, config)
  })

  return mockData
}

/**
 * 生成 Mock 数据工厂函数代码
 */
export function generateMockFactoryCode(): string {
  const entities = getAllEntities()
  let code = `// This file is auto-generated. Do not edit manually.
// Generated from @linch-kit/schema

import { generateMockData } from '@linch-kit/schema'

`

  entities.forEach(entity => {
    const entityName = entity.name
    
    code += `// ${entityName} Mock Factory\n`
    code += `export function create${entityName}Mock(overrides: Partial<${entityName}> = {}) {\n`
    code += `  const mockData = generateMockData(${entityName}Entity, { count: 1 })[0]\n`
    code += `  return { ...mockData, ...overrides }\n`
    code += `}\n\n`
    
    code += `export function create${entityName}ListMock(count: number = 5, overrides: Partial<${entityName}> = {}) {\n`
    code += `  return generateMockData(${entityName}Entity, { count }).map(item => ({ ...item, ...overrides }))\n`
    code += `}\n\n`
  })

  return code
}

/**
 * 写入 Mock 工厂文件
 * 注意：此函数仅在 Node.js 环境中可用
 */
export async function writeMockFactories(outputPath: string = './src/mocks/index.ts'): Promise<void> {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error('writeMockFactories is only available in Node.js environment')
  }

  const fs = await import('fs/promises')
  const path = await import('path')

  const code = generateMockFactoryCode()

  // 确保目录存在
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })

  // 写入文件
  await fs.writeFile(outputPath, code, 'utf-8')

  console.log(`✅ Mock factories generated at: ${outputPath}`)
}

/**
 * 生成测试数据 JSON 文件
 * 注意：此函数仅在 Node.js 环境中可用
 */
export async function generateTestDataFiles(
  outputDir: string = './test-data',
  config: MockConfig = { count: 10 }
): Promise<void> {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error('generateTestDataFiles is only available in Node.js environment')
  }

  const fs = await import('fs/promises')
  const path = await import('path')

  const allMockData = generateAllMockData(config)

  // 确保目录存在
  await fs.mkdir(outputDir, { recursive: true })

  // 为每个实体生成单独的 JSON 文件
  for (const [entityName, data] of Object.entries(allMockData)) {
    const filePath = path.join(outputDir, `${entityName.toLowerCase()}.json`)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`✅ Test data for ${entityName} generated at: ${filePath}`)
  }

  // 生成合并的数据文件
  const allDataPath = path.join(outputDir, 'all.json')
  await fs.writeFile(allDataPath, JSON.stringify(allMockData, null, 2), 'utf-8')
  console.log(`✅ All test data generated at: ${allDataPath}`)
}
