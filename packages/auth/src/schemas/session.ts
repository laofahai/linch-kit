import { z } from 'zod'
import { defineEntity, defineField } from '@linch-kit/schema'

/**
 * 基础会话实体模板
 */
export const SessionTemplate = defineEntity('Session', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.session.id'
  }),
  
  sessionToken: defineField(z.string(), {
    unique: true,
    label: 'auth.session.sessionToken'
  }),
  
  userId: defineField(z.string(), {
    label: 'auth.session.userId',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'userId',
      references: 'id',
      onDelete: 'CASCADE'
    }
  }),
  
  expires: defineField(z.date(), {
    label: 'auth.session.expires'
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'auth.session.createdAt'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'auth.session.updatedAt'
  })
}, {
  tableName: 'sessions',
  indexes: [
    { fields: ['sessionToken'], unique: true },
    { fields: ['userId'] },
    { fields: ['expires'] }
  ],
  ui: {
    displayName: 'auth.session.displayName',
    description: 'auth.session.description'
  }
})

/**
 * 扩展会话实体模板（包含更多信息）
 */
export const ExtendedSessionTemplate = defineEntity('Session', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.session.id'
  }),
  
  sessionToken: defineField(z.string(), {
    unique: true,
    label: 'auth.session.sessionToken'
  }),
  
  userId: defineField(z.string(), {
    label: 'auth.session.userId',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'userId',
      references: 'id',
      onDelete: 'CASCADE'
    }
  }),
  
  expires: defineField(z.date(), {
    label: 'auth.session.expires'
  }),
  
  // 设备和位置信息
  userAgent: defineField(z.string().optional(), {
    label: 'auth.session.userAgent'
  }),
  
  ipAddress: defineField(z.string().optional(), {
    label: 'auth.session.ipAddress'
  }),
  
  deviceType: defineField(z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(), {
    label: 'auth.session.deviceType'
  }),
  
  location: defineField(z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
    timezone: z.string().optional()
  }).optional(), {
    label: 'auth.session.location',
    db: { type: 'JSON' }
  }),
  
  // 多租户支持
  tenantId: defineField(z.string().optional(), {
    label: 'auth.session.tenantId'
  }),
  
  // 会话状态
  status: defineField(z.enum(['active', 'expired', 'revoked']), {
    default: 'active',
    label: 'auth.session.status'
  }),
  
  // 最后活跃时间
  lastActiveAt: defineField(z.date().optional(), {
    label: 'auth.session.lastActiveAt'
  }),
  
  // 扩展数据
  metadata: defineField(z.record(z.any()).optional(), {
    label: 'auth.session.metadata',
    db: { type: 'JSON' }
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'auth.session.createdAt'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'auth.session.updatedAt'
  })
}, {
  tableName: 'sessions',
  indexes: [
    { fields: ['sessionToken'], unique: true },
    { fields: ['userId'] },
    { fields: ['expires'] },
    { fields: ['status'] },
    { fields: ['tenantId'] },
    { fields: ['lastActiveAt'] }
  ],
  ui: {
    displayName: 'auth.session.extended.displayName',
    description: 'auth.session.extended.description',
    groups: [
      {
        name: 'basic',
        label: 'auth.session.groups.basic',
        fields: ['sessionToken', 'userId', 'expires', 'status']
      },
      {
        name: 'device',
        label: 'auth.session.groups.device',
        fields: ['userAgent', 'ipAddress', 'deviceType', 'location']
      },
      {
        name: 'tenant',
        label: 'auth.session.groups.tenant',
        fields: ['tenantId']
      }
    ]
  }
})

/**
 * OAuth 账户实体模板
 */
export const AccountTemplate = defineEntity('Account', {
  id: defineField(z.string(), {
    primary: true,
    label: 'auth.account.id'
  }),
  
  userId: defineField(z.string(), {
    label: 'auth.account.userId',
    relation: {
      type: 'many-to-one',
      model: 'User',
      foreignKey: 'userId',
      references: 'id',
      onDelete: 'CASCADE'
    }
  }),
  
  type: defineField(z.string(), {
    label: 'auth.account.type'
  }),
  
  provider: defineField(z.string(), {
    label: 'auth.account.provider'
  }),
  
  providerAccountId: defineField(z.string(), {
    label: 'auth.account.providerAccountId'
  }),
  
  refresh_token: defineField(z.string().optional(), {
    label: 'auth.account.refreshToken'
  }),
  
  access_token: defineField(z.string().optional(), {
    label: 'auth.account.accessToken'
  }),
  
  expires_at: defineField(z.number().optional(), {
    label: 'auth.account.expiresAt'
  }),
  
  token_type: defineField(z.string().optional(), {
    label: 'auth.account.tokenType'
  }),
  
  scope: defineField(z.string().optional(), {
    label: 'auth.account.scope'
  }),
  
  id_token: defineField(z.string().optional(), {
    label: 'auth.account.idToken'
  }),
  
  session_state: defineField(z.string().optional(), {
    label: 'auth.account.sessionState'
  }),
  
  createdAt: defineField(z.date(), { 
    createdAt: true,
    label: 'auth.account.createdAt'
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    label: 'auth.account.updatedAt'
  })
}, {
  tableName: 'accounts',
  indexes: [
    { fields: ['provider', 'providerAccountId'], unique: true },
    { fields: ['userId'] }
  ],
  ui: {
    displayName: 'auth.account.displayName',
    description: 'auth.account.description',
    groups: [
      {
        name: 'provider',
        label: 'auth.account.groups.provider',
        fields: ['provider', 'providerAccountId', 'type']
      },
      {
        name: 'tokens',
        label: 'auth.account.groups.tokens',
        fields: ['access_token', 'refresh_token', 'expires_at', 'token_type', 'scope']
      }
    ]
  }
})
