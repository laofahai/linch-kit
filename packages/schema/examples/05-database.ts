import { z } from 'zod'
import { defineEntity, defineField, generatePrismaSchema } from '@linch-kit/schema'

/**
 * 数据库生成示例
 * 
 * 展示如何使用 Schema 生成 Prisma Schema 和其他数据库相关功能
 */

// === 1. 基础实体定义 ===

const User = defineEntity('User', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  email: defineField(z.string().email(), {
    unique: true,
    label: 'Email'
  }),
  
  username: defineField(z.string().min(3).max(20), {
    unique: true,
    label: 'Username',
    db: {
      type: 'VARCHAR',
      length: 20
    }
  }),
  
  // 密码字段 - 数据库中存储哈希值
  passwordHash: defineField(z.string(), {
    label: 'Password Hash',
    db: {
      type: 'VARCHAR',
      length: 255
    },
    map: 'password_hash'  // 数据库字段名映射
  }),
  
  // JSON 字段
  profile: defineField(z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.string().url().optional()
  }).optional(), {
    label: 'Profile'
  }),
  
  // 枚举字段
  status: defineField(z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']), {
    default: 'ACTIVE',
    label: 'Status'
  }),
  
  // 软删除字段
  deletedAt: defineField(z.date().optional(), {
    softDelete: true,
    hidden: true
  }),
  
  createdAt: defineField(z.date(), { createdAt: true }),
  updatedAt: defineField(z.date(), { updatedAt: true })
}, {
  tableName: 'users',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['username'], unique: true },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
})

// === 2. 关系实体 ===

const Post = defineEntity('Post', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  title: defineField(z.string().min(1).max(200), {
    label: 'Title',
    db: {
      type: 'VARCHAR',
      length: 200
    }
  }),
  
  content: defineField(z.string().min(1), {
    label: 'Content',
    db: {
      type: 'TEXT'
    }
  }),
  
  published: defineField(z.boolean(), {
    default: false,
    label: 'Published'
  }),
  
  // 外键关系
  authorId: defineField(z.string().uuid(), {
    label: 'Author ID',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'authorId',
      references: 'id',
      onDelete: 'CASCADE'
    }
  }),
  
  // JSON 字段 - 元数据
  metadata: defineField(z.object({
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    readTime: z.number().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional()
  }).optional(), {
    label: 'Metadata'
  }),
  
  // 软删除
  deletedAt: defineField(z.date().optional(), {
    softDelete: true,
    hidden: true
  }),
  
  createdAt: defineField(z.date(), { createdAt: true }),
  updatedAt: defineField(z.date(), { updatedAt: true })
}, {
  tableName: 'posts',
  indexes: [
    { fields: ['authorId'] },
    { fields: ['published'] },
    { fields: ['createdAt'] },
    { fields: ['authorId', 'published'], name: 'author_published_idx' }
  ]
})

// === 3. 复杂数据类型示例 ===

const Order = defineEntity('Order', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  orderNumber: defineField(z.string(), {
    unique: true,
    label: 'Order Number',
    db: {
      type: 'VARCHAR',
      length: 50
    }
  }),
  
  // 精确数值 - 金额
  totalAmount: defineField(z.number().positive(), {
    label: 'Total Amount',
    db: {
      type: 'DECIMAL',
      precision: 10,
      scale: 2
    }
  }),
  
  // JSON 字段 - 复杂嵌套数据
  items: defineField(z.array(z.object({
    productId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive()
  })), {
    label: 'Order Items'
  }),
  
  // JSON 字段 - 地址信息
  shippingAddress: defineField(z.object({
    name: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }), {
    label: 'Shipping Address'
  }),
  
  // 大文本字段
  notes: defineField(z.string().optional(), {
    label: 'Notes',
    db: {
      type: 'TEXT'
    }
  }),
  
  createdAt: defineField(z.date(), { createdAt: true }),
  updatedAt: defineField(z.date(), { updatedAt: true })
}, {
  tableName: 'orders',
  indexes: [
    { fields: ['orderNumber'], unique: true },
    { fields: ['createdAt'] }
  ]
})

// === 4. 生成 Prisma Schema ===

const entities = [User, Post, Order]
const prismaSchema = generatePrismaSchema(entities)

console.log('Generated Prisma Schema:')
console.log(prismaSchema)

/*
生成的 Prisma Schema 示例：

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id
  email        String    @unique
  username     String    @unique @db.VarChar(20)
  password_hash String   @map("password_hash") @db.VarChar(255)
  profile      Json?
  status       String    @default("ACTIVE")
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // Relations
  posts        Post[]

  @@index([status])
  @@index([createdAt])
  @@map("users")
}

model Post {
  id        String    @id
  title     String    @db.VarChar(200)
  content   String    @db.Text
  published Boolean   @default(false)
  authorId  String
  metadata  Json?
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  // Relations
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@index([published])
  @@index([createdAt])
  @@index([authorId, published], map: "author_published_idx")
  @@map("posts")
}

model Order {
  id              String   @id
  orderNumber     String   @unique @db.VarChar(50)
  totalAmount     Decimal  @db.Decimal(10, 2)
  items           Json
  shippingAddress Json
  notes           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([createdAt])
  @@map("orders")
}
*/

// === 5. 其他生成器示例 ===

/*
// Mock 数据生成
import { generateMockData } from '@linch-kit/schema'

const mockUser = generateMockData(User)
const mockUsers = generateMockData(User, { count: 10 })

console.log('Mock user:', mockUser)

// OpenAPI 规范生成
import { generateOpenAPISpec } from '@linch-kit/schema'

const openApiSpec = generateOpenAPISpec(entities, {
  title: 'My API',
  version: '1.0.0',
  description: 'Generated API documentation'
})

console.log('OpenAPI spec:', openApiSpec)
*/

// === 6. 数据库迁移辅助 ===

/*
// 生成迁移 SQL（概念示例）
import { generateMigrationSQL } from '@linch-kit/schema'

const migrationSQL = generateMigrationSQL(entities, {
  from: 'previous-schema.prisma',
  to: 'current-schema.prisma',
  database: 'postgresql'
})

console.log('Migration SQL:', migrationSQL)
*/

export { User, Post, Order, prismaSchema }

/**
 * 数据库特性总结：
 * 
 * 🗄️ 数据库类型支持：
 * - VARCHAR, TEXT, DECIMAL, JSON 等
 * - 长度、精度、小数位数配置
 * - 自动类型推断
 * 
 * 🔗 关系支持：
 * - 一对一、一对多、多对多关系
 * - 外键约束和级联操作
 * - 关系字段自动生成
 * 
 * 📊 索引支持：
 * - 单字段和复合索引
 * - 唯一索引
 * - 自定义索引名称
 * 
 * 🔄 代码生成：
 * - Prisma Schema 生成
 * - Mock 数据生成
 * - OpenAPI 规范生成
 * - 迁移 SQL 生成（计划中）
 * 
 * 🎯 最佳实践：
 * - 使用语义化的字段名
 * - 合理设置数据库类型和长度
 * - 添加必要的索引
 * - 使用软删除而不是硬删除
 */
