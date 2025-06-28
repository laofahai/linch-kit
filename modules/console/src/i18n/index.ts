/**
 * Console 包国际化配置
 * 
 * 使用 @linch-kit/core 的 i18n 系统，遵循 LinchKit 包级 i18n 模式
 */

import { createPackageI18n, type TranslationFunction } from '@linch-kit/core'

/**
 * Console 包的默认翻译消息
 */
const defaultMessages = {
  'zh-CN': {
    // 通用
    'common.loading': '加载中...',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.create': '创建',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.export': '导出',
    'common.import': '导入',
    'common.refresh': '刷新',
    'common.actions': '操作',
    'common.status': '状态',
    'common.name': '名称',
    'common.description': '描述',
    'common.createdAt': '创建时间',
    'common.updatedAt': '更新时间',
    
    // 租户管理
    'tenant.title': '租户管理',
    'tenant.name': '租户名称',
    'tenant.domain': '自定义域名',
    'tenant.slug': 'URL标识符',
    'tenant.description': '租户描述',
    'tenant.status': '租户状态',
    'tenant.planType': '计费计划',
    'tenant.maxUsers': '最大用户数',
    'tenant.maxStorage': '最大存储空间',
    'tenant.status.active': '活跃',
    'tenant.status.suspended': '暂停',
    'tenant.status.deleted': '已删除',
    'tenant.status.pending': '待审核',
    'tenant.create': '创建租户',
    'tenant.edit': '编辑租户',
    'tenant.delete': '删除租户',
    'tenant.quotas': '配额管理',
    'tenant.settings': '租户设置',
    
    // 用户管理
    'user.title': '用户管理',
    'user.email': '邮箱地址',
    'user.name': '用户姓名',
    'user.avatar': '头像',
    'user.status': '用户状态',
    'user.tenantId': '所属租户',
    'user.employeeId': '员工编号',
    'user.department': '部门',
    'user.position': '职位',
    'user.manager': '直属主管',
    'user.lastLoginAt': '最后登录',
    'user.status.active': '活跃',
    'user.status.inactive': '非活跃',
    'user.status.suspended': '暂停',
    'user.status.pending': '待激活',
    'user.status.deleted': '已删除',
    'user.create': '创建用户',
    'user.edit': '编辑用户',
    'user.delete': '删除用户',
    'user.resetPassword': '重置密码',
    'user.enableMfa': '启用多因子认证',
    'user.disableMfa': '禁用多因子认证',
    
    // 权限管理
    'permission.title': '权限管理',
    'permission.roles': '角色管理',
    'permission.permissions': '权限列表',
    'permission.userRoles': '用户角色',
    'permission.role.name': '角色名称',
    'permission.role.description': '角色描述',
    'permission.role.isSystemRole': '系统角色',
    'permission.permission.name': '权限名称',
    'permission.permission.action': '操作类型',
    'permission.permission.subject': '资源类型',
    'permission.permission.conditions': '条件',
    'permission.create': '创建权限',
    'permission.edit': '编辑权限',
    'permission.assign': '分配权限',
    'permission.revoke': '撤销权限',
    
    // 插件管理
    'plugin.title': '插件管理',
    'plugin.marketplace': '插件市场',
    'plugin.installed': '已安装插件',
    'plugin.name': '插件名称',
    'plugin.version': '版本',
    'plugin.author': '作者',
    'plugin.category': '分类',
    'plugin.description': '描述',
    'plugin.status': '状态',
    'plugin.downloads': '下载次数',
    'plugin.rating': '评分',
    'plugin.status.draft': '草稿',
    'plugin.status.published': '已发布',
    'plugin.status.deprecated': '已弃用',
    'plugin.status.removed': '已移除',
    'plugin.install': '安装',
    'plugin.uninstall': '卸载',
    'plugin.enable': '启用',
    'plugin.disable': '禁用',
    'plugin.configure': '配置',
    'plugin.update': '更新',
    
    // 监控相关
    'monitoring.title': '系统监控',
    'monitoring.dashboard': '监控面板',
    'monitoring.metrics': '性能指标',
    'monitoring.alerts': '告警管理',
    'monitoring.logs': '日志查看',
    'monitoring.health': '健康检查',
    'monitoring.cpu': 'CPU使用率',
    'monitoring.memory': '内存使用率',
    'monitoring.disk': '磁盘使用率',
    'monitoring.network': '网络流量',
    'monitoring.database': '数据库性能',
    'monitoring.api': 'API响应时间',
    
    // 错误消息
    'error.validation.required': '此字段为必填项',
    'error.validation.email': '请输入有效的邮箱地址',
    'error.validation.minLength': '长度不能少于 {min} 个字符',
    'error.validation.maxLength': '长度不能超过 {max} 个字符',
    'error.validation.unique': '此值已存在，请使用其他值',
    'error.permission.denied': '权限不足，无法执行此操作',
    'error.tenant.notFound': '租户不存在',
    'error.user.notFound': '用户不存在',
    'error.plugin.notFound': '插件不存在',
    'error.plugin.installFailed': '插件安装失败',
    'error.server.internal': '服务器内部错误，请稍后重试',
    
    // 成功消息
    'success.tenant.created': '租户创建成功',
    'success.tenant.updated': '租户更新成功',
    'success.tenant.deleted': '租户删除成功',
    'success.user.created': '用户创建成功',
    'success.user.updated': '用户更新成功',
    'success.user.deleted': '用户删除成功',
    'success.plugin.installed': '插件安装成功',
    'success.plugin.uninstalled': '插件卸载成功',
    'success.plugin.enabled': '插件启用成功',
    'success.plugin.disabled': '插件禁用成功'
  },
  
  'en': {
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.refresh': 'Refresh',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.name': 'Name',
    'common.description': 'Description',
    'common.createdAt': 'Created At',
    'common.updatedAt': 'Updated At',
    
    // Tenant Management
    'tenant.title': 'Tenant Management',
    'tenant.name': 'Tenant Name',
    'tenant.domain': 'Custom Domain',
    'tenant.slug': 'URL Identifier',
    'tenant.description': 'Tenant Description',
    'tenant.status': 'Tenant Status',
    'tenant.planType': 'Plan Type',
    'tenant.maxUsers': 'Max Users',
    'tenant.maxStorage': 'Max Storage',
    'tenant.status.active': 'Active',
    'tenant.status.suspended': 'Suspended',
    'tenant.status.deleted': 'Deleted',
    'tenant.status.pending': 'Pending',
    'tenant.create': 'Create Tenant',
    'tenant.edit': 'Edit Tenant',
    'tenant.delete': 'Delete Tenant',
    'tenant.quotas': 'Quota Management',
    'tenant.settings': 'Tenant Settings',
    
    // User Management
    'user.title': 'User Management',
    'user.email': 'Email Address',
    'user.name': 'User Name',
    'user.avatar': 'Avatar',
    'user.status': 'User Status',
    'user.tenantId': 'Tenant',
    'user.employeeId': 'Employee ID',
    'user.department': 'Department',
    'user.position': 'Position',
    'user.manager': 'Manager',
    'user.lastLoginAt': 'Last Login',
    'user.status.active': 'Active',
    'user.status.inactive': 'Inactive',
    'user.status.suspended': 'Suspended',
    'user.status.pending': 'Pending',
    'user.status.deleted': 'Deleted',
    'user.create': 'Create User',
    'user.edit': 'Edit User',
    'user.delete': 'Delete User',
    'user.resetPassword': 'Reset Password',
    'user.enableMfa': 'Enable MFA',
    'user.disableMfa': 'Disable MFA',
    
    // Permission Management
    'permission.title': 'Permission Management',
    'permission.roles': 'Role Management',
    'permission.permissions': 'Permission List',
    'permission.userRoles': 'User Roles',
    'permission.role.name': 'Role Name',
    'permission.role.description': 'Role Description',
    'permission.role.isSystemRole': 'System Role',
    'permission.permission.name': 'Permission Name',
    'permission.permission.action': 'Action Type',
    'permission.permission.subject': 'Resource Type',
    'permission.permission.conditions': 'Conditions',
    'permission.create': 'Create Permission',
    'permission.edit': 'Edit Permission',
    'permission.assign': 'Assign Permission',
    'permission.revoke': 'Revoke Permission',
    
    // Plugin Management
    'plugin.title': 'Plugin Management',
    'plugin.marketplace': 'Plugin Marketplace',
    'plugin.installed': 'Installed Plugins',
    'plugin.name': 'Plugin Name',
    'plugin.version': 'Version',
    'plugin.author': 'Author',
    'plugin.category': 'Category',
    'plugin.description': 'Description',
    'plugin.status': 'Status',
    'plugin.downloads': 'Downloads',
    'plugin.rating': 'Rating',
    'plugin.status.draft': 'Draft',
    'plugin.status.published': 'Published',
    'plugin.status.deprecated': 'Deprecated',
    'plugin.status.removed': 'Removed',
    'plugin.install': 'Install',
    'plugin.uninstall': 'Uninstall',
    'plugin.enable': 'Enable',
    'plugin.disable': 'Disable',
    'plugin.configure': 'Configure',
    'plugin.update': 'Update',
    
    // Monitoring
    'monitoring.title': 'System Monitoring',
    'monitoring.dashboard': 'Dashboard',
    'monitoring.metrics': 'Metrics',
    'monitoring.alerts': 'Alerts',
    'monitoring.logs': 'Logs',
    'monitoring.health': 'Health Check',
    'monitoring.cpu': 'CPU Usage',
    'monitoring.memory': 'Memory Usage',
    'monitoring.disk': 'Disk Usage',
    'monitoring.network': 'Network Traffic',
    'monitoring.database': 'Database Performance',
    'monitoring.api': 'API Response Time',
    
    // Error Messages
    'error.validation.required': 'This field is required',
    'error.validation.email': 'Please enter a valid email address',
    'error.validation.minLength': 'Must be at least {min} characters',
    'error.validation.maxLength': 'Must be no more than {max} characters',
    'error.validation.unique': 'This value already exists',
    'error.permission.denied': 'Permission denied',
    'error.tenant.notFound': 'Tenant not found',
    'error.user.notFound': 'User not found',
    'error.plugin.notFound': 'Plugin not found',
    'error.plugin.installFailed': 'Plugin installation failed',
    'error.server.internal': 'Internal server error, please try again',
    
    // Success Messages
    'success.tenant.created': 'Tenant created successfully',
    'success.tenant.updated': 'Tenant updated successfully',
    'success.tenant.deleted': 'Tenant deleted successfully',
    'success.user.created': 'User created successfully',
    'success.user.updated': 'User updated successfully',
    'success.user.deleted': 'User deleted successfully',
    'success.plugin.installed': 'Plugin installed successfully',
    'success.plugin.uninstalled': 'Plugin uninstalled successfully',
    'success.plugin.enabled': 'Plugin enabled successfully',
    'success.plugin.disabled': 'Plugin disabled successfully'
  }
}

/**
 * Console 包的国际化实例
 */
export const consoleI18n = createPackageI18n({
  packageName: 'console',
  defaultLocale: 'zh-CN',
  defaultMessages,
  keyPrefix: 'console'
})

/**
 * 获取 Console 包的翻译函数
 * @param userT 用户提供的翻译函数
 * @returns 翻译函数
 */
export const useConsoleTranslation = (userT?: TranslationFunction) =>
  consoleI18n.getTranslation(userT)

/**
 * 导出类型
 */
export type { TranslationFunction } from '@linch-kit/core'