import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * Product Entity
 * 
 * Example entity demonstrating various field types and configurations
 */
export const Product = defineEntity('Product', {
  // Primary key
  id: defineField(z.string().uuid(), {
    primary: true,
    label: 'Product ID'
  }),

  // Basic product information
  name: defineField(z.string().min(1).max(200), {
    label: 'Product Name',
    description: 'The name of the product',
    required: true
  }),

  description: defineField(z.string().max(1000).optional(), {
    label: 'Description',
    description: 'Detailed product description'
  }),

  // SKU (Stock Keeping Unit)
  sku: defineField(z.string().min(1).max(50), {
    unique: true,
    label: 'SKU',
    description: 'Stock Keeping Unit - unique product identifier'
  }),

  // Pricing
  price: defineField(z.number().positive(), {
    label: 'Price',
    description: 'Product price in cents'
  }),

  currency: defineField(z.enum(['USD', 'EUR', 'GBP', 'CNY']), {
    default: 'USD',
    label: 'Currency',
    description: 'Price currency'
  }),

  // Inventory
  stock: defineField(z.number().int().nonnegative(), {
    default: 0,
    label: 'Stock Quantity',
    description: 'Available inventory count'
  }),

  // Product status
  status: defineField(z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED']), {
    default: 'DRAFT',
    label: 'Status',
    description: 'Product availability status'
  }),

  // Categories (JSON field example)
  categories: defineField(z.array(z.string()).default([]), {
    label: 'Categories',
    description: 'Product categories'
  }),

  // Metadata (JSON field example)
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'Metadata',
    description: 'Additional product metadata'
  }),

  // Timestamps
  createdAt: defineField(z.date(), {
    createdAt: true,
    label: 'Created At'
  }),

  updatedAt: defineField(z.date(), {
    updatedAt: true,
    label: 'Updated At'
  })
}, {
  tableName: 'products',
  indexes: [
    {
      fields: ['sku'],
      unique: true
    },
    {
      fields: ['status']
    },
    {
      fields: ['price']
    }
  ]
})

// Export types
export type ProductType = z.infer<typeof Product.schema>
export type CreateProductInput = z.infer<typeof Product.createSchema>
export type UpdateProductInput = z.infer<typeof Product.updateSchema>
export type ProductResponse = z.infer<typeof Product.responseSchema>

export default Product
