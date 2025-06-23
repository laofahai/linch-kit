import { z } from 'zod'

/**
 * 测试简化版本的 defineField 函数
 * 
 * 不使用复杂的类型推导，直接返回原始的 Zod schema
 */

// 简化的字段配置接口
interface SimpleConfig {
  label?: string
  unique?: boolean
  primary?: boolean
  createdAt?: boolean
  updatedAt?: boolean
}

// 简化的 defineField 函数 - 不进行复杂的类型操作
function simpleDefineField<T extends z.ZodSchema>(
  schema: T,
  config?: SimpleConfig
): T {
  // 简单地返回原始 schema，不添加任何元数据
  return schema
}

// 测试使用简化版本
export const testField1 = simpleDefineField(z.string(), {
  label: 'test.field1',
})

export const testField2 = simpleDefineField(z.string().optional(), {
  label: 'test.field2',
  unique: true,
})

export const testField3 = simpleDefineField(z.date(), {
  label: 'test.field3',
  createdAt: true,
})

// 简单的对象
export const TestObject = {
  field1: testField1,
  field2: testField2,
  field3: testField3,
}
