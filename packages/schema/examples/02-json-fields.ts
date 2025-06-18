import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * JSON Fields Example
 *
 * Demonstrates how to use nested objects, arrays, and other complex data types
 * These are automatically mapped to database JSON fields
 */

const User = defineEntity('User', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  email: defineField(z.string().email(), {
    unique: true,
    label: 'Email'
  }),
  
  // === 嵌套对象 → JSON 字段 ===
  address: defineField(z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('US')
  }).optional(), {
    label: 'Address'
  }),
  
  // === 复杂嵌套对象 → JSON 字段 ===
  profile: defineField(z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.string().url().optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark']).default('light'),
      language: z.string().default('en'),
      notifications: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        push: z.boolean().default(true)
      })
    })
  }).optional(), {
    label: 'User Profile'
  }),
  
  // === 数组 → JSON 字段 ===
  tags: defineField(z.array(z.string()).optional(), {
    label: 'Tags'
  }),
  
  // === 对象数组 → JSON 字段 ===
  phoneNumbers: defineField(z.array(z.object({
    type: z.enum(['mobile', 'home', 'work']),
    number: z.string(),
    isPrimary: z.boolean().default(false)
  })).optional(), {
    label: 'Phone Numbers'
  }),
  
  // === Record 类型 → JSON 字段 ===
  metadata: defineField(z.record(z.string(), z.any()).optional(), {
    label: 'Metadata'
  }),
  
  // === 明确指定 JSON 类型 ===
  customData: defineField(z.any().optional(), {
    label: 'Custom Data',
    db: {
      type: 'JSON'
    }
  }),
  
  createdAt: defineField(z.date(), { createdAt: true }),
  updatedAt: defineField(z.date(), { updatedAt: true })
}, {
  tableName: 'users'
})

// === 产品示例 ===

const Product = defineEntity('Product', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  name: defineField(z.string().min(1), {
    label: 'Product Name'
  }),
  
  // 产品规格 → JSON 字段
  specifications: defineField(z.object({
    weight: z.number(),
    dimensions: z.object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
      unit: z.enum(['cm', 'inch']).default('cm')
    }),
    materials: z.array(z.string()),
    features: z.array(z.string()),
    warranty: z.object({
      duration: z.number(),
      unit: z.enum(['months', 'years']),
      coverage: z.array(z.string())
    })
  }), {
    label: 'Specifications'
  }),
  
  // 产品变体 → JSON 字段
  variants: defineField(z.array(z.object({
    id: z.string(),
    name: z.string(),
    sku: z.string(),
    price: z.number(),
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  })).optional(), {
    label: 'Product Variants'
  }),
  
  // 库存信息 → JSON 字段
  inventory: defineField(z.object({
    quantity: z.number().int().min(0),
    reserved: z.number().int().min(0).default(0),
    reorderLevel: z.number().int().min(0).default(10),
    locations: z.array(z.object({
      warehouse: z.string(),
      quantity: z.number().int().min(0)
    })).optional()
  }), {
    label: 'Inventory'
  }),
  
  createdAt: defineField(z.date(), { createdAt: true })
}, {
  tableName: 'products'
})

// === 生成的 Prisma Schema 示例 ===

/*
model User {
  id           String    @id
  email        String    @unique
  address      Json?     // 嵌套对象自动映射为 JSON
  profile      Json?     // 复杂嵌套对象自动映射为 JSON
  tags         Json?     // 数组自动映射为 JSON
  phoneNumbers Json?     // 对象数组自动映射为 JSON
  metadata     Json?     // Record 类型自动映射为 JSON
  customData   Json?     @db.JSON  // 明确指定的 JSON 类型
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("users")
}

model Product {
  id             String   @id
  name           String
  specifications Json     // 复杂嵌套对象
  variants       Json?    // 对象数组
  inventory      Json     // 嵌套对象
  createdAt      DateTime @default(now())

  @@map("products")
}
*/

// === 类型推导和验证 ===

export const CreateUserSchema = User.createSchema
export const UpdateUserSchema = User.updateSchema

export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>

// 使用示例
const userData: CreateUser = {
  email: 'user@example.com',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  },
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  },
  tags: ['developer', 'admin'],
  phoneNumbers: [
    {
      type: 'mobile',
      number: '+1-555-0123',
      isPrimary: true
    }
  ],
  metadata: {
    source: 'web',
    campaign: 'summer2024'
  }
}

// 验证数据
const validatedUser = CreateUserSchema.parse(userData)

export { User, Product, validatedUser }
