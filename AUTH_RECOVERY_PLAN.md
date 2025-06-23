# LinchKit Auth 包复杂实体恢复计划

## 🎯 目标
逐步恢复被临时移除的复杂实体定义，同时保持 DTS 构建性能在 30 秒以内。

## 📋 恢复阶段

### 阶段 1：基础实体优化恢复 (预计 1-2 天)

#### 1.1 恢复 BasicUserTemplate 的完整功能
```typescript
// 目标：从简化版本恢复到完整版本，但使用优化的类型定义
export const BasicUserTemplate = defineEntity(
  'User',
  {
    id: defineField(z.string(), { primary: true }),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().url().optional(),
    
    // 使用简化的 JSON 字段定义
    profile: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      bio: z.string().optional(),
    }).optional(),
    
    createdAt: defineField(z.date(), { createdAt: true }),
    updatedAt: defineField(z.date(), { updatedAt: true }),
  },
  {
    tableName: 'users',
    ui: {
      displayName: 'auth.user.displayName',
      description: 'auth.user.description',
    },
  }
)
```

#### 1.2 性能验证标准
- DTS 构建时间 < 10 秒
- 功能完整性 100%
- 类型推导正确性验证

### 阶段 2：企业用户模板恢复 (预计 2-3 天)

#### 2.1 创建优化版 EnterpriseUserTemplate
```typescript
// 策略：拆分复杂嵌套类型，使用预定义 Schema
const UserRoleSchema = z.object({
  roleId: z.string(),
  assignedAt: z.date(),
  expiresAt: z.date().optional(),
})

const UserDepartmentSchema = z.object({
  departmentId: z.string(),
  position: z.string().optional(),
  isManager: z.boolean().default(false),
})

export const EnterpriseUserTemplate = defineEntity(
  'User',
  {
    // 基础字段继承 BasicUserTemplate
    ...BasicUserTemplate.schema.shape,
    
    // 企业特有字段
    employeeId: z.string().optional(),
    department: z.string().optional(),
    jobTitle: z.string().optional(),
    
    // 使用预定义 Schema 避免嵌套复杂度
    roles: z.array(UserRoleSchema).optional(),
    departments: z.array(UserDepartmentSchema).optional(),
    
    // 简化的权限字段
    permissions: z.array(z.string()).optional(),
    
    status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  },
  {
    tableName: 'users',
    ui: {
      displayName: 'auth.user.enterprise.displayName',
      description: 'auth.user.enterprise.description',
    },
  }
)
```

#### 2.2 性能验证标准
- DTS 构建时间 < 15 秒
- 企业功能完整性验证
- 与现有代码兼容性测试

### 阶段 3：多租户模板恢复 (预计 3-4 天)

#### 3.1 实施模块扩展架构
```typescript
// 在 packages/ui 中扩展 FieldConfig
declare module '@linch-kit/schema' {
  interface FieldConfig {
    multiTenant?: {
      tenantField?: string
      tenantResolver?: 'subdomain' | 'header' | 'custom'
      isolation?: 'strict' | 'shared'
    }
  }
}
```

#### 3.2 创建 MultiTenantUserTemplate
```typescript
const TenantAssociationSchema = z.object({
  tenantId: z.string(),
  roles: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  joinedAt: z.date(),
})

export const MultiTenantUserTemplate = defineEntity(
  'User',
  {
    // 全局身份字段
    globalId: defineField(z.string(), { primary: true }),
    globalEmail: z.string().email().optional(),
    globalUsername: z.string().optional(),
    
    // 基础信息
    name: z.string().optional(),
    avatar: z.string().url().optional(),
    
    // 租户关联（使用预定义 Schema）
    tenants: z.array(TenantAssociationSchema).optional(),
    currentTenantId: z.string().optional(),
    
    globalStatus: z.enum(['active', 'inactive', 'suspended']).default('active'),
    
    createdAt: defineField(z.date(), { createdAt: true }),
    updatedAt: defineField(z.date(), { updatedAt: true }),
  },
  {
    tableName: 'users',
    ui: {
      displayName: 'auth.user.multiTenant.displayName',
      description: 'auth.user.multiTenant.description',
    },
  }
)
```

## 🔧 执行步骤

### 步骤 1：准备工作
1. 创建性能监控脚本
2. 建立回滚机制
3. 准备测试用例

### 步骤 2：逐个恢复
1. 从 `src/schemas-disabled/` 恢复一个文件
2. 应用优化策略
3. 运行性能测试
4. 验证功能完整性
5. 如果通过，继续下一个；如果失败，回滚并优化

### 步骤 3：集成测试
1. 恢复所有实体后进行完整测试
2. 验证 Auth 套件功能
3. 更新文档和示例

## ✅ 成功标准

### 性能标准
- Auth 包 DTS 构建时间 < 30 秒
- Schema 包 DTS 构建时间 < 10 秒
- 完整项目构建时间 < 2 分钟

### 功能标准
- 所有原有功能 100% 恢复
- 类型推导精度保持
- 向后兼容性保证
- IDE 智能提示完全可用

### 质量标准
- 单元测试覆盖率 > 90%
- 集成测试全部通过
- 文档同步更新
- 示例代码可运行
