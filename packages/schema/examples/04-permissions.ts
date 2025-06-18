import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 权限和高级特性示例
 * 
 * 展示 Schema 包中预留的权限接口和其他高级特性
 * 注意：这些是预留接口，具体实现在 CRUD 包中
 */

// === 1. 字段级别权限 ===

const User = defineEntity('User', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  // 公开字段 - 无权限限制
  username: defineField(z.string().min(3), {
    unique: true,
    label: 'Username'
  }),
  
  // 敏感字段 - 需要特定权限
  email: defineField(z.string().email(), {
    unique: true,
    label: 'Email',
    permissions: {
      read: 'users:read-email',
      write: 'users:write-email'
    }
  }),
  
  // 高度敏感字段 - 多重权限和数据转换
  socialSecurityNumber: defineField(z.string().optional(), {
    label: 'SSN',
    permissions: {
      read: ['users:read-pii', 'admin:full-access'],
      write: ['users:write-pii', 'admin:full-access'],
      custom: (user, context) => {
        // 自定义权限逻辑：管理员或本人可访问
        return user.roles?.includes('admin') || user.id === context?.targetUserId
      }
    },
    // 敏感字段审计
    audit: {
      enabled: true,
      sensitive: true
    },
    // 输出时脱敏
    transform: {
      output: (value) => value ? `***-**-${value.slice(-4)}` : undefined
    }
  }),
  
  // 计算字段
  displayName: defineField(z.string().optional(), {
    label: 'Display Name',
    readonly: true,
    virtual: {
      computed: true,
      dependencies: ['profile'],
      compute: (entity) => {
        const profile = entity.profile
        return profile ? `${profile.firstName} ${profile.lastName}` : entity.username
      }
    }
  }),
  
  // JSON 字段带权限
  profile: defineField(z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.string().url().optional(),
    phoneNumber: z.string().optional()
  }).optional(), {
    label: 'Profile',
    permissions: {
      read: 'users:read-profile',
      write: 'users:write-profile'
    },
    // 输入数据清理
    transform: {
      input: (value) => {
        if (!value) return value
        return {
          ...value,
          // 清理电话号码格式
          phoneNumber: value.phoneNumber?.replace(/\D/g, '')
        }
      }
    }
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    audit: true
  }),
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    audit: true
  })
}, {
  tableName: 'users',
  
  // 实体级别权限
  permissions: {
    create: 'users:create',
    read: 'users:read',
    update: 'users:update',
    delete: ['users:delete', 'admin:full-access'],
    custom: {
      // 自己只能修改自己的数据
      updateSelf: (user, context) => {
        return user.id === context?.targetUserId
      }
    }
  },
  
  // 跨字段验证
  validation: {
    crossField: [
      {
        name: 'profileCompleteness',
        fields: ['email', 'profile'],
        validate: (values) => {
          if (values.email && !values.profile?.firstName) {
            return 'Profile first name is required when email is provided'
          }
          return true
        },
        message: 'user.validation.profileRequired'
      }
    ]
  },
  
  // 审计配置
  audit: {
    enabled: true,
    fields: {
      createdBy: 'createdBy',
      updatedBy: 'updatedBy',
      version: 'version'
    },
    sensitiveOperations: ['create', 'update', 'delete']
  }
})

// === 2. 财务数据示例 - 高安全性 ===

const BankAccount = defineEntity('BankAccount', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  userId: defineField(z.string().uuid(), {
    label: 'User ID',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'userId',
      references: 'id'
    }
  }),
  
  // 高度敏感 - 账户号码
  accountNumber: defineField(z.string(), {
    unique: true,
    label: 'Account Number',
    permissions: {
      read: ['finance:read-account', 'admin:full-access'],
      write: ['finance:write-account', 'admin:full-access']
    },
    audit: {
      enabled: true,
      sensitive: true
    },
    transform: {
      // 输出时只显示后4位
      output: (value) => `****-****-****-${value.slice(-4)}`
    }
  }),
  
  // 余额 - 敏感财务数据
  balance: defineField(z.number().min(0), {
    label: 'Balance',
    permissions: {
      read: ['finance:read-balance', 'account:owner'],
      write: ['finance:write-balance']
    },
    transform: {
      // 输入时转换为分（避免浮点精度问题）
      input: (value) => Math.round(value * 100),
      // 输出时转换回元
      output: (value) => value / 100
    },
    audit: true
  }),
  
  status: defineField(z.enum(['ACTIVE', 'SUSPENDED', 'CLOSED']), {
    default: 'ACTIVE',
    label: 'Status',
    permissions: {
      read: 'accounts:read-status',
      write: 'accounts:manage-status'
    }
  }),
  
  createdAt: defineField(z.date(), { createdAt: true }),
  updatedAt: defineField(z.date(), { updatedAt: true })
}, {
  tableName: 'bank_accounts',
  
  permissions: {
    create: 'accounts:create',
    read: 'accounts:read',
    update: 'accounts:update',
    delete: 'accounts:delete',
    custom: {
      // 用户只能访问自己的账户
      accessOwn: (user, context) => {
        return context?.account?.userId === user.id
      }
    }
  },
  
  validation: {
    crossField: [
      {
        name: 'balanceValidation',
        fields: ['balance', 'status'],
        validate: (values) => {
          if (values.status === 'CLOSED' && values.balance > 0) {
            return 'Cannot close account with positive balance'
          }
          return true
        }
      }
    ]
  },
  
  audit: {
    enabled: true,
    fields: {
      createdBy: 'createdBy',
      updatedBy: 'updatedBy',
      version: 'version'
    },
    sensitiveOperations: ['create', 'update', 'delete']
  }
})

// === 3. 产品目录示例 - 计算字段 ===

const Product = defineEntity('Product', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  name: defineField(z.string().min(1), {
    label: 'Product Name'
  }),
  
  basePrice: defineField(z.number().positive(), {
    label: 'Base Price'
  }),
  
  discountPercentage: defineField(z.number().min(0).max(100), {
    default: 0,
    label: 'Discount %'
  }),
  
  // 计算字段 - 最终价格
  finalPrice: defineField(z.number().optional(), {
    label: 'Final Price',
    readonly: true,
    virtual: {
      computed: true,
      dependencies: ['basePrice', 'discountPercentage'],
      compute: (entity) => {
        const discount = entity.discountPercentage || 0
        return entity.basePrice * (1 - discount / 100)
      }
    }
  }),
  
  // 库存信息
  inventory: defineField(z.object({
    quantity: z.number().int().min(0),
    reserved: z.number().int().min(0).default(0),
    reorderLevel: z.number().int().min(0).default(10)
  }), {
    label: 'Inventory',
    permissions: {
      read: 'inventory:read',
      write: 'inventory:write'
    }
  }),
  
  // 可用库存 - 计算字段
  availableStock: defineField(z.number().optional(), {
    label: 'Available Stock',
    readonly: true,
    virtual: {
      computed: true,
      dependencies: ['inventory'],
      compute: (entity) => {
        const inv = entity.inventory
        return inv ? inv.quantity - inv.reserved : 0
      }
    }
  }),
  
  createdAt: defineField(z.date(), { createdAt: true }),
  updatedAt: defineField(z.date(), { updatedAt: true })
}, {
  tableName: 'products',
  
  permissions: {
    create: 'products:create',
    read: 'products:read',
    update: 'products:update',
    delete: 'products:delete'
  },
  
  validation: {
    crossField: [
      {
        name: 'inventoryValidation',
        fields: ['inventory'],
        validate: (values) => {
          const inv = values.inventory
          if (inv && inv.reserved > inv.quantity) {
            return 'Reserved quantity cannot exceed total quantity'
          }
          return true
        }
      }
    ]
  }
})

export { User, BankAccount, Product }

/**
 * 权限和特性总结：
 * 
 * 🔐 权限系统（预留接口）：
 * - 实体级别权限（CRUD 操作）
 * - 字段级别权限（读写控制）
 * - 自定义权限函数
 * 
 * 🔍 验证增强（预留接口）：
 * - 跨字段验证
 * - 条件验证
 * - 自定义验证规则
 * 
 * 🔄 数据转换（预留接口）：
 * - 输入清理和格式化
 * - 输出脱敏和格式化
 * 
 * 📊 虚拟字段（预留接口）：
 * - 计算字段
 * - 依赖追踪
 * - 只读派生数据
 * 
 * 📝 审计日志（预留接口）：
 * - 字段级别变更追踪
 * - 敏感操作记录
 * - 版本控制
 * 
 * 注意：这些是 Schema 包中的预留接口，
 * 具体的权限检查、数据转换、审计等功能
 * 将在 CRUD 包或业务层中实现。
 */
