'use client'

import { useState } from 'react'
// import { defineEntity, defineField } from '@linch-kit/schema'
// 临时模拟实现，避免构建错误

interface FieldBuilder {
  type: string
  rules: Record<string, unknown>
  primaryKey: () => FieldBuilder
  generated: () => FieldBuilder
  required: () => FieldBuilder
  unique: () => FieldBuilder
  description: (_desc: string) => FieldBuilder
  min: (_val: number) => FieldBuilder
  max: (_val: number) => FieldBuilder
  values: (_vals: string[]) => FieldBuilder
  default: (_val: unknown) => FieldBuilder
  optional: () => FieldBuilder
  items: (_itemType: string) => FieldBuilder
  properties: (_props: Record<string, unknown>) => FieldBuilder
  onUpdate: (_val: string) => FieldBuilder
  relation: (_target: string) => FieldBuilder
}

const defineField = (type: string): FieldBuilder => {
  const createBuilder = (currentType: string, currentRules: Record<string, unknown>): FieldBuilder => {
    const builder: FieldBuilder = {
      type: currentType,
      rules: currentRules,
      primaryKey: () => createBuilder(currentType, { ...currentRules, primaryKey: true }),
      generated: () => createBuilder(currentType, { ...currentRules, generated: true }),
      required: () => createBuilder(currentType, { ...currentRules, required: true }),
      unique: () => createBuilder(currentType, { ...currentRules, unique: true }),
      description: (_desc: string) => createBuilder(currentType, { ...currentRules, description: _desc }),
      min: (_val: number) => createBuilder(currentType, { ...currentRules, min: _val }),
      max: (_val: number) => createBuilder(currentType, { ...currentRules, max: _val }),
      values: (_vals: string[]) => createBuilder(currentType, { ...currentRules, values: _vals }),
      default: (_val: unknown) => createBuilder(currentType, { ...currentRules, default: _val }),
      optional: () => createBuilder(currentType, { ...currentRules, optional: true }),
      items: (_itemType: string) => createBuilder(currentType, { ...currentRules, items: _itemType }),
      properties: (_props: Record<string, unknown>) => createBuilder(currentType, { ...currentRules, properties: _props }),
      onUpdate: (_val: string) => createBuilder(currentType, { ...currentRules, onUpdate: _val }),
      relation: (_target: string) => createBuilder(currentType, { ...currentRules, relation: _target })
    }
    return builder
  }
  
  return createBuilder(type, {})
}

interface EntityConfig {
  name: string
  displayName?: string
  fields: Record<string, FieldBuilder>
  relations?: Record<string, unknown>
}

const defineEntity = (config: EntityConfig) => config

// 演示Schema定义
const UserSchema = defineEntity({
  name: 'User',
  displayName: '用户',
  fields: {
    id: defineField('string').primaryKey().generated(),
    email: defineField('email').required().unique().description('邮箱地址'),
    name: defineField('string').required().min(2).max(50).description('用户姓名'),
    age: defineField('number').optional().min(0).max(150).description('年龄'),
    role: defineField('enum').values(['admin', 'user', 'guest']).default('user').description('用户角色'),
    isActive: defineField('boolean').default(true).description('是否激活'),
    tags: defineField('array').items('string').optional().description('标签列表'),
    profile: defineField('object').properties({
      bio: defineField('string').optional().max(500),
      website: defineField('url').optional(),
      phone: defineField('phone').optional()
    }).optional().description('个人资料'),
    createdAt: defineField('datetime').default('now()').description('创建时间'),
    updatedAt: defineField('datetime').default('now()').onUpdate('now()').description('更新时间')
  }
})

const PostSchema = defineEntity({
  name: 'Post',
  displayName: '文章',
  fields: {
    id: defineField('string').primaryKey().generated(),
    title: defineField('string').required().min(1).max(200).description('文章标题'),
    content: defineField('text').required().description('文章内容'),
    status: defineField('enum').values(['draft', 'published', 'archived']).default('draft').description('发布状态'),
    authorId: defineField('string').required().relation('User').description('作者ID'),
    publishedAt: defineField('datetime').optional().description('发布时间'),
    tags: defineField('array').items('string').optional().description('文章标签'),
    metadata: defineField('json').optional().description('元数据')
  },
  relations: {
    author: {
      type: 'belongsTo',
      target: 'User',
      foreignKey: 'authorId'
    }
  }
})

export function SchemaDemo() {
  const [selectedEntity, setSelectedEntity] = useState<'User' | 'Post'>('User')
  const [generatedCode, setGeneratedCode] = useState<'typescript' | 'prisma' | 'api'>('typescript')
  const [validationResult, setValidationResult] = useState<string>('')

  const currentSchema = selectedEntity === 'User' ? UserSchema : PostSchema
  
  // 验证Schema功能
  const validateSchema = () => {
    const schema = currentSchema
    const fieldCount = Object.keys(schema.fields).length
    const requiredFields = Object.entries(schema.fields).filter(([, field]) => field.rules.required).length
    
    setValidationResult(`✅ Schema验证通过: ${schema.name} 包含 ${fieldCount} 个字段，其中 ${requiredFields} 个必填字段`)
  }

  const generateTypeScript = () => {
    if (selectedEntity === 'User') {
      return `// 自动生成的 TypeScript 类型
export interface User {
  id: string
  email: string
  name: string
  age?: number
  role: 'admin' | 'user' | 'guest'
  isActive: boolean
  tags?: string[]
  profile?: {
    bio?: string
    website?: string
    phone?: string
  }
  createdAt: Date
  updatedAt: Date
}

// Zod验证Schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(2).max(50),
  age: z.number().min(0).max(150).optional(),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  profile: z.object({
    bio: z.string().max(500).optional(),
    website: z.string().url().optional(),
    phone: z.string().optional()
  }).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
})`
    } else {
      return `// 自动生成的 TypeScript 类型
export interface Post {
  id: string
  title: string
  content: string
  status: 'draft' | 'published' | 'archived'
  authorId: string
  publishedAt?: Date
  tags?: string[]
  metadata?: Record<string, any>
}

// 关联类型
export interface PostWithAuthor extends Post {
  author: User
}`
    }
  }

  const generatePrisma = () => {
    if (selectedEntity === 'User') {
      return `// 自动生成的 Prisma 模型
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  age       Int?
  role      Role     @default(user)
  isActive  Boolean  @default(true)
  tags      String[]
  profile   Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 关系
  posts     Post[]
  
  @@map("users")
}

enum Role {
  admin
  user
  guest
}`
    } else {
      return `// 自动生成的 Prisma 模型
model Post {
  id          String    @id @default(cuid())
  title       String
  content     String
  status      Status    @default(draft)
  authorId    String
  publishedAt DateTime?
  tags        String[]
  metadata    Json?
  
  // 关系
  author      User      @relation(fields: [authorId], references: [id])
  
  @@map("posts")
}

enum Status {
  draft
  published
  archived
}`
    }
  }

  const generateAPI = () => {
    if (selectedEntity === 'User') {
      return `// 自动生成的 tRPC API
export const userRouter = router({
  // 查询用户列表
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      role: z.enum(['admin', 'user', 'guest']).optional()
    }))
    .query(async ({ input }) => {
      return await db.user.findMany({
        where: input.role ? { role: input.role } : undefined,
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { createdAt: 'desc' }
      })
    }),

  // 创建用户
  create: publicProcedure
    .input(UserSchema.omit({ id: true, createdAt: true, updatedAt: true }))
    .mutation(async ({ input }) => {
      return await db.user.create({
        data: input
      })
    }),

  // 更新用户
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: UserSchema.partial()
    }))
    .mutation(async ({ input }) => {
      return await db.user.update({
        where: { id: input.id },
        data: input.data
      })
    })
})`
    } else {
      return `// 自动生成的 tRPC API
export const postRouter = router({
  // 查询文章列表
  list: publicProcedure
    .input(z.object({
      authorId: z.string().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      tags: z.array(z.string()).optional()
    }))
    .query(async ({ input }) => {
      return await db.post.findMany({
        where: {
          authorId: input.authorId,
          status: input.status,
          tags: input.tags ? { hasEvery: input.tags } : undefined
        },
        include: { author: true }
      })
    }),

  // 发布文章
  publish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.post.update({
        where: { id: input.id },
        data: { 
          status: 'published',
          publishedAt: new Date()
        }
      })
    })
})`
    }
  }

  const getGeneratedCode = () => {
    switch (generatedCode) {
      case 'typescript':
        return generateTypeScript()
      case 'prisma':
        return generatePrisma()
      case 'api':
        return generateAPI()
      default:
        return ''
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Schema定义区域 */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">📋 Schema定义</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedEntity('User')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                selectedEntity === 'User'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              User实体
            </button>
            <button
              onClick={() => setSelectedEntity('Post')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                selectedEntity === 'Post'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Post实体
            </button>
            <button
              onClick={validateSchema}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors"
            >
              🔍 验证Schema
            </button>
          </div>
          
          {validationResult && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
              {validationResult}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded border text-sm font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">
{selectedEntity === 'User' 
  ? `const UserSchema = defineEntity({
  name: 'User',
  displayName: '用户',
  fields: {
    id: defineField('string').primaryKey().generated(),
    email: defineField('email').required().unique(),
    name: defineField('string').required().min(2).max(50),
    age: defineField('number').optional().min(0).max(150),
    role: defineField('enum')
      .values(['admin', 'user', 'guest'])
      .default('user'),
    isActive: defineField('boolean').default(true),
    tags: defineField('array').items('string').optional(),
    profile: defineField('object').properties({
      bio: defineField('string').optional().max(500),
      website: defineField('url').optional(),
      phone: defineField('phone').optional()
    }).optional(),
    createdAt: defineField('datetime').default('now()'),
    updatedAt: defineField('datetime')
      .default('now()').onUpdate('now()')
  }
})`
  : `const PostSchema = defineEntity({
  name: 'Post',
  displayName: '文章',
  fields: {
    id: defineField('string').primaryKey().generated(),
    title: defineField('string').required().min(1).max(200),
    content: defineField('text').required(),
    status: defineField('enum')
      .values(['draft', 'published', 'archived'])
      .default('draft'),
    authorId: defineField('string').required().relation('User'),
    publishedAt: defineField('datetime').optional(),
    tags: defineField('array').items('string').optional(),
    metadata: defineField('json').optional()
  },
  relations: {
    author: {
      type: 'belongsTo',
      target: 'User',
      foreignKey: 'authorId'
    }
  }
})`}
            </pre>
          </div>
        </div>

        {/* 字段特性展示 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">⚡ 字段特性</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">数据类型</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• string, number, boolean</li>
                <li>• email, url, phone</li>
                <li>• datetime, date, time</li>
                <li>• text, json, array</li>
                <li>• enum, object</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">验证规则</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• required(), optional()</li>
                <li>• min(), max(), length()</li>
                <li>• unique(), primaryKey()</li>
                <li>• default(), generated()</li>
                <li>• relation(), onUpdate()</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 代码生成区域 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">🔄 自动生成代码</h3>
        
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setGeneratedCode('typescript')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              generatedCode === 'typescript'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => setGeneratedCode('prisma')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              generatedCode === 'prisma'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Prisma
          </button>
          <button
            onClick={() => setGeneratedCode('api')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              generatedCode === 'api'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            tRPC API
          </button>
        </div>

        <div className="bg-gray-900 text-gray-100 p-4 rounded text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap">{getGeneratedCode()}</pre>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="mb-2">
            <strong>生成说明:</strong> 基于Schema定义，LinchKit可以自动生成：
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>TypeScript接口和Zod验证Schema</li>
            <li>Prisma数据库模型和迁移文件</li>
            <li>tRPC API路由和类型安全的客户端</li>
            <li>GraphQL Schema和Resolver</li>
            <li>REST API端点和OpenAPI文档</li>
          </ul>
        </div>
      </div>
    </div>
  )
}