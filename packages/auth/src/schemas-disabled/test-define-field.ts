import { z } from 'zod'
import { defineField } from '@linch-kit/schema'

/**
 * 测试 defineField 函数是否导致 DTS 构建超时
 */

// 只使用 defineField，不使用 defineEntity
export const testField1 = defineField(z.string(), {
  label: 'test.field1',
})

export const testField2 = defineField(z.string().optional(), {
  label: 'test.field2',
  unique: true,
})

export const testField3 = defineField(z.date(), {
  label: 'test.field3',
  createdAt: true,
})

// 简单的对象，不使用 defineEntity
export const TestObject = {
  field1: testField1,
  field2: testField2,
  field3: testField3,
}
