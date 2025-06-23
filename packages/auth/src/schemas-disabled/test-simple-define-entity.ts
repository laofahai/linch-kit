import { z } from 'zod'

/**
 * 测试简化版本的 defineEntity 函数
 * 
 * 不使用复杂的类型推导，直接返回简单的对象
 */

// 简化的实体配置接口
interface SimpleEntityConfig {
  tableName?: string
  ui?: {
    displayName?: string
    description?: string
  }
}

// 简化的实体类
class SimpleEntity {
  constructor(
    public readonly name: string,
    public readonly schema: z.ZodObject<any>,
    public readonly config?: SimpleEntityConfig
  ) {}
}

// 简化的 defineEntity 函数 - 不进行复杂的类型操作
function simpleDefineEntity(
  name: string,
  fields: Record<string, z.ZodSchema>,
  config?: SimpleEntityConfig
): SimpleEntity {
  // 简单地创建 Zod object schema
  const schema = z.object(fields)
  
  // 返回简单的实体对象
  return new SimpleEntity(name, schema, config)
}

// 测试使用简化版本
export const TestUser = simpleDefineEntity(
  'User',
  {
    id: z.string(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  },
  {
    tableName: 'users',
    ui: {
      displayName: 'Test User',
      description: 'A test user entity',
    },
  }
)

// 简单的认证套件
export const SimpleTestAuthKit = {
  User: TestUser,
}
