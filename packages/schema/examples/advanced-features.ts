#!/usr/bin/env tsx

/**
 * 高级功能示例
 * 演示复杂验证、自定义装饰器、多种数据类型等
 */

import { z } from 'zod'
import { 
  defineEntity, 
  primary, 
  unique, 
  createdAt, 
  updatedAt, 
  defaultValue,
  softDelete,
  dbType,
  dbField,
  generatePrismaSchema,
  ValidatorGenerator
} from '../src/index'

console.log('🚀 高级功能示例')
console.log('===============\n')

// 定义商品实体 - 展示复杂数据类型和验证
const Product = defineEntity('Product', {
  id: primary(z.string().uuid()),
  sku: unique(z.string().regex(/^[A-Z0-9-]+$/, 'SKU 格式无效')),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  
  // 价格相关 - 使用 Decimal 类型
  price: dbType(z.number().positive(), 'Decimal', { precision: 10, scale: 2 }),
  originalPrice: dbType(z.number().positive().optional(), 'Decimal', { precision: 10, scale: 2 }),
  
  // 库存
  stock: defaultValue(z.number().int().nonnegative(), 0),
  lowStockThreshold: defaultValue(z.number().int().nonnegative(), 10),
  
  // 分类和标签
  categoryId: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  
  // 产品属性 - JSON 字段
  attributes: z.record(z.string(), z.any()).default({}),
  
  // 图片
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    order: z.number().int().nonnegative(),
  })).default([]),
  
  // 状态
  status: defaultValue(z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']), 'ACTIVE'),
  isDigital: defaultValue(z.boolean(), false),
  isFeatured: defaultValue(z.boolean(), false),
  
  // 重量和尺寸
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['cm', 'inch']).default('cm'),
  }).optional(),
  
  // SEO
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).default([]),
  
  // 时间戳
  publishedAt: z.date().optional(),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
  deletedAt: softDelete(z.date().optional()),
}, {
  tableName: 'products',
  indexes: [
    { fields: ['sku'], unique: true },
    { fields: ['categoryId'] },
    { fields: ['status', 'publishedAt'] },
    { fields: ['isFeatured', 'status'] },
    { fields: ['stock'] },
    { fields: ['deletedAt'] },
  ]
})

// 定义订单实体 - 展示复杂关系和状态管理
const Order = defineEntity('Order', {
  id: primary(z.string().uuid()),
  orderNumber: unique(z.string().regex(/^ORD-\d{8}-[A-Z0-9]{6}$/, '订单号格式无效')),
  
  // 客户信息
  customerId: z.string().uuid(),
  customerEmail: z.string().email(),
  
  // 订单状态
  status: defaultValue(z.enum([
    'PENDING',
    'CONFIRMED', 
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
  ]), 'PENDING'),
  
  // 金额信息
  subtotal: dbType(z.number().nonnegative(), 'Decimal', { precision: 10, scale: 2 }),
  taxAmount: dbType(z.number().nonnegative(), 'Decimal', { precision: 10, scale: 2 }),
  shippingAmount: dbType(z.number().nonnegative(), 'Decimal', { precision: 10, scale: 2 }),
  discountAmount: dbType(z.number().nonnegative().default(0), 'Decimal', { precision: 10, scale: 2 }),
  totalAmount: dbType(z.number().positive(), 'Decimal', { precision: 10, scale: 2 }),
  
  // 地址信息
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    company: z.string().optional(),
    address1: z.string().min(1),
    address2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2), // ISO 国家代码
    phone: z.string().optional(),
  }),
  
  billingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    company: z.string().optional(),
    address1: z.string().min(1),
    address2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2),
    phone: z.string().optional(),
  }),
  
  // 支付信息
  paymentMethod: z.enum(['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH_ON_DELIVERY']),
  paymentStatus: defaultValue(z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']), 'PENDING'),
  
  // 物流信息
  shippingMethod: z.string(),
  trackingNumber: z.string().optional(),
  
  // 备注
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
  
  // 时间戳
  confirmedAt: z.date().optional(),
  shippedAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  createdAt: createdAt(z.date()),
  updatedAt: updatedAt(z.date()),
  deletedAt: softDelete(z.date().optional()),
}, {
  tableName: 'orders',
  indexes: [
    { fields: ['orderNumber'], unique: true },
    { fields: ['customerId'] },
    { fields: ['status', 'createdAt'] },
    { fields: ['paymentStatus'] },
    { fields: ['trackingNumber'] },
    { fields: ['deletedAt'] },
  ]
})

// 生成验证器
const productGenerator = new ValidatorGenerator(Product)
const orderGenerator = new ValidatorGenerator(Order)

// 商品验证器
const CreateProductSchema = Product.createSchema.refine(data => {
  // 自定义验证：如果有原价，原价必须大于等于现价
  if (data.originalPrice && data.originalPrice < data.price) {
    return false
  }
  return true
}, {
  message: "原价不能低于现价",
  path: ["originalPrice"],
})

const UpdateProductSchema = Product.updateSchema

// 商品响应 Schema（排除敏感信息）
const ProductResponseSchema = Product.responseSchema.omit({ 
  deletedAt: true,
  internalNotes: true 
})

// 订单验证器
const CreateOrderSchema = Order.createSchema.refine(data => {
  // 验证总金额计算是否正确
  const calculatedTotal = data.subtotal + data.taxAmount + data.shippingAmount - data.discountAmount
  return Math.abs(calculatedTotal - data.totalAmount) < 0.01 // 允许小数点误差
}, {
  message: "订单总金额计算错误",
  path: ["totalAmount"],
})

const UpdateOrderSchema = Order.updateSchema

// 订单响应 Schema
const OrderResponseSchema = Order.responseSchema.omit({ 
  deletedAt: true,
  internalNotes: true 
})

// 类型推断
type CreateProduct = z.infer<typeof CreateProductSchema>
type UpdateProduct = z.infer<typeof UpdateProductSchema>
type ProductResponse = z.infer<typeof ProductResponseSchema>

type CreateOrder = z.infer<typeof CreateOrderSchema>
type UpdateOrder = z.infer<typeof UpdateOrderSchema>
type OrderResponse = z.infer<typeof OrderResponseSchema>

console.log('📝 复杂验证测试')
console.log('---------------')

// 测试商品创建
const productData: CreateProduct = {
  sku: 'LAPTOP-001',
  name: 'MacBook Pro 16"',
  description: '强大的专业级笔记本电脑',
  price: 2999.99,
  originalPrice: 3299.99,
  categoryId: '123e4567-e89b-12d3-a456-426614174000',
  tags: ['laptop', 'apple', 'professional'],
  attributes: {
    brand: 'Apple',
    model: 'MacBook Pro',
    screenSize: '16 inch',
    processor: 'M3 Pro',
    memory: '32GB',
    storage: '1TB SSD'
  },
  images: [
    {
      url: 'https://example.com/macbook-1.jpg',
      alt: 'MacBook Pro 正面图',
      order: 0
    }
  ],
  weight: 2.1,
  dimensions: {
    length: 35.57,
    width: 24.81,
    height: 1.68,
    unit: 'cm'
  },
  seoTitle: 'MacBook Pro 16" - 专业级笔记本电脑',
  seoDescription: '配备 M3 Pro 芯片的 MacBook Pro，为专业用户提供卓越性能',
  seoKeywords: ['MacBook', 'Pro', '笔记本', 'Apple']
}

const productResult = CreateProductSchema.safeParse(productData)
if (productResult.success) {
  console.log('✅ 商品创建验证通过')
} else {
  console.log('❌ 商品创建验证失败:', productResult.error.errors)
}

// 测试订单创建
const orderData: CreateOrder = {
  orderNumber: 'ORD-20241217-ABC123',
  customerId: '456e7890-e89b-12d3-a456-426614174000',
  customerEmail: 'customer@example.com',
  subtotal: 2999.99,
  taxAmount: 299.99,
  shippingAmount: 50.00,
  discountAmount: 100.00,
  totalAmount: 3249.98,
  shippingAddress: {
    firstName: '张',
    lastName: '三',
    address1: '北京市朝阳区建国路1号',
    city: '北京',
    state: '北京',
    postalCode: '100000',
    country: 'CN'
  },
  billingAddress: {
    firstName: '张',
    lastName: '三',
    address1: '北京市朝阳区建国路1号',
    city: '北京',
    state: '北京',
    postalCode: '100000',
    country: 'CN'
  },
  paymentMethod: 'CREDIT_CARD',
  shippingMethod: '顺丰快递'
}

const orderResult = CreateOrderSchema.safeParse(orderData)
if (orderResult.success) {
  console.log('✅ 订单创建验证通过')
} else {
  console.log('❌ 订单创建验证失败:', orderResult.error.errors)
}

console.log('\n🗄️ 生成的 Prisma Schema')
console.log('------------------------')
try {
  const prismaSchema = generatePrismaSchema()
  console.log(prismaSchema)
} catch (error) {
  console.error('生成 Prisma schema 时出错:', error)
}

console.log('\n🎉 高级功能示例完成!')
console.log('\n💡 高级功能特性:')
console.log('- 复杂数据类型验证（价格、地址、JSON 等）')
console.log('- 自定义验证规则（价格关系、金额计算等）')
console.log('- 数据库特定类型映射（Decimal、JSON 等）')
console.log('- 软删除支持')
console.log('- 复合索引和约束')
console.log('- SEO 字段和元数据管理')
