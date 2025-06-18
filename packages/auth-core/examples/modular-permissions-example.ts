/**
 * 模块化权限系统使用示例
 */

import {
  createPermissionRegistry,
  createModularPermissionChecker,
  type ModulePermissionDefinition
} from '@linch-kit/auth-core'

// 示例：WMS 模块权限定义
const wmsModulePermissions: ModulePermissionDefinition = {
  moduleName: 'wms',
  resources: [
    {
      name: 'warehouse',
      description: '仓库管理',
      actions: [
        { name: 'create', description: '创建仓库' },
        { name: 'read', description: '查看仓库' },
        { name: 'update', description: '更新仓库' },
        { name: 'delete', description: '删除仓库', dangerous: true }
      ]
    },
    {
      name: 'inventory',
      description: '库存管理',
      actions: [
        { name: 'create', description: '创建库存记录' },
        { name: 'read', description: '查看库存' },
        { name: 'update', description: '更新库存' },
        { name: 'transfer', description: '库存转移' },
        { name: 'adjust', description: '库存调整', dangerous: true }
      ]
    }
  ],
  defaultRoles: [
    {
      name: 'warehouse-manager',
      description: '仓库管理员',
      permissions: [
        { resource: 'warehouse', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'inventory', actions: ['create', 'read', 'update', 'transfer', 'adjust'] }
      ]
    },
    {
      name: 'warehouse-operator',
      description: '仓库操作员',
      permissions: [
        { resource: 'warehouse', actions: ['read'] },
        { resource: 'inventory', actions: ['read', 'update', 'transfer'] }
      ]
    }
  ]
}

// 示例：CRM 模块权限定义
const crmModulePermissions: ModulePermissionDefinition = {
  moduleName: 'crm',
  resources: [
    {
      name: 'customer',
      description: '客户管理',
      actions: [
        { name: 'create', description: '创建客户' },
        { name: 'read', description: '查看客户' },
        { name: 'update', description: '更新客户' },
        { name: 'delete', description: '删除客户', dangerous: true }
      ]
    },
    {
      name: 'order',
      description: '订单管理',
      actions: [
        { name: 'create', description: '创建订单' },
        { name: 'read', description: '查看订单' },
        { name: 'update', description: '更新订单' },
        { name: 'cancel', description: '取消订单' }
      ]
    }
  ],
  defaultRoles: [
    {
      name: 'sales-manager',
      description: '销售经理',
      permissions: [
        { resource: 'customer', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'order', actions: ['create', 'read', 'update', 'cancel'] }
      ]
    },
    {
      name: 'sales-rep',
      description: '销售代表',
      permissions: [
        { resource: 'customer', actions: ['create', 'read', 'update'] },
        { resource: 'order', actions: ['create', 'read', 'update'] }
      ]
    }
  ]
}

async function demonstrateModularPermissions() {
  console.log('🔐 模块化权限系统示例\n')

  // 1. 创建权限注册表
  const registry = createPermissionRegistry()
  
  // 2. 注册模块权限
  console.log('📋 注册模块权限...')
  await registry.registerModule(wmsModulePermissions)
  await registry.registerModule(crmModulePermissions)
  console.log('✅ 模块权限注册完成\n')

  // 3. 验证依赖关系
  const validation = await registry.validateDependencies()
  if (validation.valid) {
    console.log('✅ 权限依赖关系验证通过')
  } else {
    console.log('❌ 权限依赖关系验证失败:', validation.errors)
  }

  // 4. 合并权限
  const mergedPermissions = await registry.mergePermissions()
  console.log(`📊 合并后的权限统计:`)
  console.log(`  - 资源数量: ${mergedPermissions.resources.length}`)
  console.log(`  - 角色数量: ${mergedPermissions.roles.length}`)
  console.log()

  // 5. 创建权限检查器
  const permissionChecker = createModularPermissionChecker(registry)

  // 6. 模拟权限检查
  console.log('🔍 权限检查示例:')
  
  // 模拟用户权限检查
  const userId = 'user-123'
  
  // 检查 WMS 模块权限
  const hasWarehouseRead = await permissionChecker.hasModulePermission(
    userId, 'wms', 'warehouse', 'read'
  )
  console.log(`  - WMS仓库读取权限: ${hasWarehouseRead ? '✅' : '❌'}`)

  const hasInventoryAdjust = await permissionChecker.hasModulePermission(
    userId, 'wms', 'inventory', 'adjust'
  )
  console.log(`  - WMS库存调整权限: ${hasInventoryAdjust ? '✅' : '❌'}`)

  // 检查 CRM 模块权限
  const hasCustomerCreate = await permissionChecker.hasModulePermission(
    userId, 'crm', 'customer', 'create'
  )
  console.log(`  - CRM客户创建权限: ${hasCustomerCreate ? '✅' : '❌'}`)

  // 7. 获取用户模块权限
  console.log('\n📋 用户模块权限摘要:')
  
  const wmsPermissions = await permissionChecker.getUserModulePermissions(userId, 'wms')
  console.log('  WMS模块权限:', JSON.stringify(wmsPermissions, null, 2))

  const crmPermissions = await permissionChecker.getUserModulePermissions(userId, 'crm')
  console.log('  CRM模块权限:', JSON.stringify(crmPermissions, null, 2))

  // 8. 获取用户可访问的模块
  const accessibleModules = await permissionChecker.getUserAccessibleModules(userId)
  console.log(`\n🎯 用户可访问的模块: ${accessibleModules.join(', ')}`)

  console.log('\n✨ 示例完成!')
}

// 运行示例
if (require.main === module) {
  demonstrateModularPermissions().catch(console.error)
}

export { demonstrateModularPermissions }
