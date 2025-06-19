import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 产品实体定义
 * 用于测试 @linch-kit/schema 的功能
 */
export const ProductEntity = defineEntity('Product', {
  id: defineField(z.string().uuid(), {
    primary: true,
    label: 'product.id.label'
  }),

  name: defineField(z.string().min(1).max(200), {
    label: 'product.name.label',
    required: true,
    order: 1
  }),

  description: defineField(z.string().optional(), {
    label: 'product.description.label',
    order: 2
  }),

  price: defineField(z.number().positive(), {
    label: 'product.price.label',
    required: true,
    order: 3
  }),

  category: defineField(z.enum(['electronics', 'clothing', 'books', 'home', 'sports']), {
    default: 'electronics',
    label: 'product.category.label',
    order: 4
  }),

  status: defineField(z.enum(['active', 'inactive', 'discontinued']), {
    default: 'active',
    label: 'product.status.label',
    order: 5
  }),

  tags: defineField(z.array(z.string()).optional(), {
    label: 'product.tags.label',
    db: { type: 'JSON' },
    order: 6
  }),

  metadata: defineField(z.record(z.any()).optional(), {
    label: 'product.metadata.label',
    db: { type: 'JSON' },
    order: 7
  }),

  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'product.createdAt.label'
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'product.updatedAt.label'
  })
}, {
  tableName: 'products',
  indexes: [
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['name'], unique: true }
  ],
  ui: {
    displayName: 'product.displayName',
    description: 'product.description'
  }
})

export default ProductEntity
