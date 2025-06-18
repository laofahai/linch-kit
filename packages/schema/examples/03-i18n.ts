import { z } from 'zod'
import { 
  defineEntity, 
  defineField, 
  setTranslateFunction,
  getFieldLabel,
  getEntityDisplayName
} from '@linch-kit/schema'

/**
 * 国际化示例
 * 
 * 展示如何在 Schema 中使用国际化功能
 */

// === 1. 设置翻译函数 ===

// 模拟翻译数据
const translations: Record<string, Record<string, string>> = {
  en: {
    'user.name.label': 'Full Name',
    'user.email.label': 'Email Address',
    'user.email.placeholder': 'Enter your email',
    'user.role.label': 'Role',
    'user.profile.label': 'Profile Information',
    'user.management.title': 'User Management',
    'user.management.description': 'Manage system users and their permissions',
    'user.groups.basic': 'Basic Information',
    'user.groups.profile': 'Profile Details',
    'role.user': 'User',
    'role.admin': 'Administrator',
    'role.moderator': 'Moderator',
    'schema.User.displayName': 'User',
    'schema.User.fields.createdAt.label': 'Created At'
  },
  'zh-CN': {
    'user.name.label': '姓名',
    'user.email.label': '邮箱地址',
    'user.email.placeholder': '请输入邮箱',
    'user.role.label': '角色',
    'user.profile.label': '个人资料',
    'user.management.title': '用户管理',
    'user.management.description': '管理系统用户及其权限',
    'user.groups.basic': '基本信息',
    'user.groups.profile': '个人资料',
    'role.user': '用户',
    'role.admin': '管理员',
    'role.moderator': '版主',
    'schema.User.displayName': '用户',
    'schema.User.fields.createdAt.label': '创建时间'
  }
}

let currentLocale = 'en'

// 模拟翻译函数
const mockT = (key: string): string => {
  const localeTranslations = translations[currentLocale] || translations.en
  return localeTranslations[key] || key
}

// 设置翻译函数
setTranslateFunction(mockT)

// === 2. 使用自定义 i18n key 的 Schema ===

const User = defineEntity('User', {
  id: defineField(z.string().uuid(), {
    primary: true
  }),
  
  // 使用自定义翻译 key
  name: defineField(z.string().min(1), {
    label: 'user.name.label',  // 会被翻译
    order: 1,
    group: 'basic'
  }),
  
  email: defineField(z.string().email(), {
    unique: true,
    label: 'user.email.label',
    placeholder: 'user.email.placeholder',
    order: 2,
    group: 'basic'
  }),
  
  role: defineField(z.enum(['USER', 'ADMIN', 'MODERATOR']), {
    default: 'USER',
    label: 'user.role.label',
    order: 3,
    group: 'basic'
  }),
  
  profile: defineField(z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional()
  }).optional(), {
    label: 'user.profile.label',
    order: 4,
    group: 'profile'
  }),
  
  // 没有自定义 label，会自动生成 schema.User.fields.createdAt.label
  createdAt: defineField(z.date(), { 
    createdAt: true,
    order: 5
  }),
  
  updatedAt: defineField(z.date(), { 
    updatedAt: true,
    hidden: true
  })
}, {
  tableName: 'users',
  ui: {
    displayName: 'user.management.title',
    description: 'user.management.description',
    groups: [
      {
        name: 'basic',
        label: 'user.groups.basic',
        fields: ['name', 'email', 'role']
      },
      {
        name: 'profile',
        label: 'user.groups.profile',
        fields: ['profile']
      }
    ]
  }
})

// === 3. 依赖默认 key 生成的 Schema ===

const Product = defineEntity('Product', {
  id: defineField(z.string().uuid(), { primary: true }),
  
  // 没有指定 label，会生成 schema.Product.fields.name.label
  name: z.string().min(1),
  
  // 没有指定 label，会生成 schema.Product.fields.description.label
  description: z.string().optional(),
  
  price: defineField(z.number().positive(), {
    // 没有 label，会生成 schema.Product.fields.price.label
  }),
  
  createdAt: defineField(z.date(), { createdAt: true })
}, {
  // 没有指定 displayName，会生成 schema.Product.displayName
  tableName: 'products'
})

// === 4. 使用翻译函数 ===

function demonstrateI18n() {
  console.log('=== English ===')
  currentLocale = 'en'
  
  console.log('User name label:', getFieldLabel('User', 'name'))
  console.log('User email label:', getFieldLabel('User', 'email'))
  console.log('Entity display name:', getEntityDisplayName('User'))
  
  console.log('\n=== 中文 ===')
  currentLocale = 'zh-CN'
  
  console.log('User name label:', getFieldLabel('User', 'name'))
  console.log('User email label:', getFieldLabel('User', 'email'))
  console.log('Entity display name:', getEntityDisplayName('User'))
  
  // 测试默认 key 生成
  console.log('\n=== Default Key Generation ===')
  currentLocale = 'en'
  console.log('Product name label (auto-generated):', getFieldLabel('Product', 'name'))
  console.log('Product entity name (auto-generated):', getEntityDisplayName('Product'))
}

// === 5. 实际项目集成示例 ===

/*
// Vue.js 集成
import { createI18n } from 'vue-i18n'
import { setTranslateFunction } from '@linch-kit/schema'

const i18n = createI18n({
  locale: 'en',
  messages: {
    en: { ... },
    'zh-CN': { ... }
  }
})

setTranslateFunction(i18n.global.t)

// React 集成
import { useTranslation } from 'react-i18next'
import { setTranslateFunction } from '@linch-kit/schema'

function App() {
  const { t } = useTranslation()
  
  useEffect(() => {
    setTranslateFunction(t)
  }, [t])
  
  return <YourApp />
}
*/

// === 6. 翻译文件结构示例 ===

export const translationExample = {
  en: {
    // 自定义 key
    user: {
      name: { label: 'Full Name' },
      email: { 
        label: 'Email Address',
        placeholder: 'Enter your email'
      },
      management: {
        title: 'User Management',
        description: 'Manage system users'
      }
    },
    
    // 默认 key 结构
    schema: {
      User: {
        displayName: 'User',
        fields: {
          createdAt: { label: 'Created At' },
          updatedAt: { label: 'Updated At' }
        }
      },
      Product: {
        displayName: 'Product',
        fields: {
          name: { label: 'Product Name' },
          description: { label: 'Description' }
        }
      }
    }
  },
  
  'zh-CN': {
    user: {
      name: { label: '姓名' },
      email: { 
        label: '邮箱地址',
        placeholder: '请输入邮箱'
      },
      management: {
        title: '用户管理',
        description: '管理系统用户'
      }
    },
    
    schema: {
      User: {
        displayName: '用户',
        fields: {
          createdAt: { label: '创建时间' },
          updatedAt: { label: '更新时间' }
        }
      },
      Product: {
        displayName: '产品',
        fields: {
          name: { label: '产品名称' },
          description: { label: '产品描述' }
        }
      }
    }
  }
}

// 运行演示
demonstrateI18n()

export { User, Product }
