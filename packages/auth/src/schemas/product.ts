import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 产品分类实体模板
 * @description 产品分类管理，支持层级结构
 * @since 2025-06-20
 */
export const ProductCategoryTemplate = defineEntity('ProductCategory', {
  id: defineField(z.string(), {
    primary: true,
    label: 'product.category.id'
  }),
  
  name: defineField(z.string(), {
    label: 'product.category.name'
  }),
  
  slug: defineField(z.string(), {
    unique: true,
    label: 'product.category.slug'
  }),
  
  description: defineField(z.string().optional(), {
    label: 'product.category.description'
  }),
  
  // 父分类ID，支持层级结构
  parentId: defineField(z.string().optional(), {
    label: 'product.category.parentId',
    relation: {
      type: 'many-to-one',
      model: 'ProductCategory',
      foreignKey: 'parentId',
      references: 'id',
      onDelete: 'SET_NULL'
    }
  }),
  
  // 分类图标
  icon: defineField(z.string().optional(), {
    label: 'product.category.icon'
  }),
  
  // 分类图片
  image: defineField(z.string().url().optional(), {
    label: 'product.category.image'
  }),
  
  // 排序权重
  sortOrder: defineField(z.number().int(), {
    default: 0,
    label: 'product.category.sortOrder'
  }),
  
  // 是否启用
  isActive: defineField(z.boolean(), {
    default: true,
    label: 'product.category.isActive'
  }),
  
  // 扩展数据
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'product.category.metadata',
    db: { type: 'JSON' }
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'product.category.createdAt'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'product.category.updatedAt'
  }),
  
  deletedAt: defineField(z.date().optional(), { 
    softDelete: true,
    label: 'product.category.deletedAt'
  })
}, {
  tableName: 'product_categories',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['parentId'] },
    { fields: ['isActive'] },
    { fields: ['sortOrder'] },
    { fields: ['deletedAt'] }
  ],
  ui: {
    displayName: 'product.category.displayName',
    description: 'product.category.description',
    groups: [
      {
        name: 'basic',
        label: 'product.category.groups.basic',
        fields: ['name', 'slug', 'description', 'parentId']
      },
      {
        name: 'media',
        label: 'product.category.groups.media',
        fields: ['icon', 'image']
      },
      {
        name: 'settings',
        label: 'product.category.groups.settings',
        fields: ['sortOrder', 'isActive']
      }
    ]
  }
})

/**
 * 产品实体模板
 * @description 产品信息管理，包含基本信息、库存、价格等
 * @since 2025-06-20
 */
export const ProductTemplate = defineEntity('Product', {
  id: defineField(z.string(), {
    primary: true,
    label: 'product.id'
  }),
  
  // 基本信息
  name: defineField(z.string(), {
    label: 'product.name'
  }),
  
  slug: defineField(z.string(), {
    unique: true,
    label: 'product.slug'
  }),
  
  description: defineField(z.string().optional(), {
    label: 'product.description'
  }),
  
  shortDescription: defineField(z.string().optional(), {
    label: 'product.shortDescription'
  }),
  
  // 产品编码
  sku: defineField(z.string(), {
    unique: true,
    label: 'product.sku'
  }),
  
  // 条形码
  barcode: defineField(z.string().optional(), {
    unique: true,
    label: 'product.barcode'
  }),
  
  // 分类关联
  categoryId: defineField(z.string().optional(), {
    label: 'product.categoryId',
    relation: {
      type: 'many-to-one',
      model: 'ProductCategory',
      foreignKey: 'categoryId',
      references: 'id',
      onDelete: 'SET_NULL'
    }
  }),
  
  // 价格信息
  price: defineField(z.number(), {
    label: 'product.price'
  }),
  
  comparePrice: defineField(z.number().optional(), {
    label: 'product.comparePrice'
  }),
  
  costPrice: defineField(z.number().optional(), {
    label: 'product.costPrice'
  }),
  
  // 库存信息
  stockQuantity: defineField(z.number().int(), {
    default: 0,
    label: 'product.stockQuantity'
  }),
  
  lowStockThreshold: defineField(z.number().int().optional(), {
    label: 'product.lowStockThreshold'
  }),
  
  // 库存管理
  trackInventory: defineField(z.boolean(), {
    default: true,
    label: 'product.trackInventory'
  }),
  
  allowBackorder: defineField(z.boolean(), {
    default: false,
    label: 'product.allowBackorder'
  }),
  
  // 产品状态
  status: defineField(z.enum(['draft', 'active', 'inactive', 'archived']), {
    default: 'draft',
    label: 'product.status'
  }),
  
  // 产品类型
  type: defineField(z.enum(['physical', 'digital', 'service']), {
    default: 'physical',
    label: 'product.type'
  }),
  
  // 重量和尺寸
  weight: defineField(z.number().optional(), {
    label: 'product.weight'
  }),
  
  dimensions: defineField(z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    unit: z.enum(['cm', 'in']).default('cm')
  }).optional(), {
    label: 'product.dimensions',
    db: { type: 'JSON' }
  }),
  
  // 产品图片
  images: defineField(z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    sortOrder: z.number().int().default(0)
  })).optional(), {
    label: 'product.images',
    db: { type: 'JSON' }
  }),
  
  // 产品标签
  tags: defineField(z.array(z.string()).optional(), {
    label: 'product.tags',
    db: { type: 'JSON' }
  }),
  
  // SEO 信息
  seoTitle: defineField(z.string().optional(), {
    label: 'product.seoTitle'
  }),
  
  seoDescription: defineField(z.string().optional(), {
    label: 'product.seoDescription'
  }),
  
  // 创建者
  createdBy: defineField(z.string().optional(), {
    label: 'product.createdBy',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'createdBy',
      references: 'id',
      onDelete: 'SET_NULL'
    }
  }),
  
  // 扩展数据
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'product.metadata',
    db: { type: 'JSON' }
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'product.createdAt'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'product.updatedAt'
  }),
  
  deletedAt: defineField(z.date().optional(), { 
    softDelete: true,
    label: 'product.deletedAt'
  })
}, {
  tableName: 'products',
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['sku'], unique: true },
    { fields: ['barcode'], unique: true },
    { fields: ['categoryId'] },
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['createdBy'] },
    { fields: ['stockQuantity'] },
    { fields: ['price'] },
    { fields: ['deletedAt'] }
  ],
  ui: {
    displayName: 'product.displayName',
    description: 'product.description',
    groups: [
      {
        name: 'basic',
        label: 'product.groups.basic',
        fields: ['name', 'slug', 'description', 'shortDescription', 'sku', 'barcode', 'categoryId']
      },
      {
        name: 'pricing',
        label: 'product.groups.pricing',
        fields: ['price', 'comparePrice', 'costPrice']
      },
      {
        name: 'inventory',
        label: 'product.groups.inventory',
        fields: ['stockQuantity', 'lowStockThreshold', 'trackInventory', 'allowBackorder']
      },
      {
        name: 'details',
        label: 'product.groups.details',
        fields: ['status', 'type', 'weight', 'dimensions', 'tags']
      },
      {
        name: 'media',
        label: 'product.groups.media',
        fields: ['images']
      },
      {
        name: 'seo',
        label: 'product.groups.seo',
        fields: ['seoTitle', 'seoDescription']
      }
    ]
  }
})
