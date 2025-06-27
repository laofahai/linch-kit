/**
 * @linch-kit/auth 国际化支持
 * 使用LinchKit Core的国际化系统
 */

import { createPackageI18n, type TranslationFunction } from '@linch-kit/core'

/**
 * Auth包的国际化实例
 */
export const authI18n = createPackageI18n({
  packageName: '@linch-kit/auth',
  defaultLocale: 'en',
  defaultMessages: {
    en: {
      // 认证相关
      'auth.success': 'Authentication successful',
      'auth.failed': 'Authentication failed',
      'auth.invalid_provider': 'Invalid authentication provider',
      'auth.provider_not_found': 'Authentication provider not found',
      'auth.user_disabled': 'User account is disabled',
      'auth.user_inactive': 'User account is inactive',
      'auth.email_not_verified': 'Email verification required',
      'auth.invalid_credentials': 'Invalid email or password',
      'auth.account_locked': 'Account temporarily locked',
      'auth.mfa_required': 'Multi-factor authentication required',
      'auth.session_expired': 'Session has expired',
      'auth.insufficient_permissions': 'Insufficient permissions',

      // 权限相关
      'permission.access_denied': 'Access denied',
      'permission.resource_not_found': 'Resource not found',
      'permission.invalid_action': 'Invalid action',
      'permission.role_required': 'Role required',

      // MFA相关
      'mfa.totp_setup_success': 'TOTP setup completed successfully',
      'mfa.totp_verify_success': 'TOTP verification successful',
      'mfa.totp_verify_failed': 'TOTP verification failed',
      'mfa.backup_code_used': 'Backup code used successfully',
      'mfa.backup_codes_low': 'Warning: Only {count} backup codes remaining',

      // 会话相关
      'session.created': 'Session created successfully',
      'session.refreshed': 'Session refreshed successfully',
      'session.revoked': 'Session revoked successfully',
      'session.invalid_token': 'Invalid session token',

      // 审计相关
      'audit.event_logged': 'Audit event logged',
      'audit.log_failed': 'Failed to log audit event',

      // OAuth相关
      'oauth.google.domain_not_allowed': 'Domain not allowed for Google authentication',
      'oauth.github.org_membership_required': 'Organization membership required',
      'oauth.callback_error': 'OAuth callback error',

      // CLI相关
      'cli.init.starting': 'Initializing authentication system...',
      'cli.init.success': 'Authentication system initialized successfully',
      'cli.init.error': 'Failed to initialize authentication system: {error}',
      'cli.user.creating': 'Creating user: {email}',
      'cli.user.created': 'User created successfully: {email}',
      'cli.user.create.error': 'Failed to create user: {error}',
      'cli.user.listing': 'Listing users...',
      'cli.user.list.error': 'Failed to list users: {error}',
      'cli.password.resetting': 'Resetting password for: {email}',
      'cli.password.reset': 'Password reset successfully for: {email}',
      'cli.password.reset.error': 'Failed to reset password: {error}',
      'cli.mfa.setting': 'Setting up MFA for {email} (type: {type})',
      'cli.mfa.setup': 'MFA setup completed for: {email}',
      'cli.mfa.setup.error': 'Failed to setup MFA: {error}',
      'cli.audit.querying': 'Querying audit logs...',
      'cli.audit.error': 'Failed to query audit logs: {error}'
    },
    'zh-CN': {
      // 认证相关
      'auth.success': '认证成功',
      'auth.failed': '认证失败',
      'auth.invalid_provider': '无效的认证提供商',
      'auth.provider_not_found': '认证提供商未找到',
      'auth.user_disabled': '用户账户已禁用',
      'auth.user_inactive': '用户账户未激活',
      'auth.email_not_verified': '需要邮箱验证',
      'auth.invalid_credentials': '邮箱或密码错误',
      'auth.account_locked': '账户暂时锁定',
      'auth.mfa_required': '需要多因子认证',
      'auth.session_expired': '会话已过期',
      'auth.insufficient_permissions': '权限不足',

      // 权限相关
      'permission.access_denied': '访问被拒绝',
      'permission.resource_not_found': '资源未找到',
      'permission.invalid_action': '无效的操作',
      'permission.role_required': '需要角色权限',

      // MFA相关
      'mfa.totp_setup_success': 'TOTP设置成功完成',
      'mfa.totp_verify_success': 'TOTP验证成功',
      'mfa.totp_verify_failed': 'TOTP验证失败',
      'mfa.backup_code_used': '备用码使用成功',
      'mfa.backup_codes_low': '警告：仅剩 {count} 个备用码',

      // 会话相关
      'session.created': '会话创建成功',
      'session.refreshed': '会话刷新成功',
      'session.revoked': '会话撤销成功',
      'session.invalid_token': '无效的会话令牌',

      // 审计相关
      'audit.event_logged': '审计事件已记录',
      'audit.log_failed': '审计事件记录失败',

      // OAuth相关
      'oauth.google.domain_not_allowed': 'Google认证不允许该域名',
      'oauth.github.org_membership_required': '需要组织成员身份',
      'oauth.callback_error': 'OAuth回调错误',

      // CLI相关
      'cli.init.starting': '正在初始化认证系统...',
      'cli.init.success': '认证系统初始化成功',
      'cli.init.error': '认证系统初始化失败: {error}',
      'cli.user.creating': '正在创建用户: {email}',
      'cli.user.created': '用户创建成功: {email}',
      'cli.user.create.error': '用户创建失败: {error}',
      'cli.user.listing': '正在列出用户...',
      'cli.user.list.error': '用户列表获取失败: {error}',
      'cli.password.resetting': '正在重置密码: {email}',
      'cli.password.reset': '密码重置成功: {email}',
      'cli.password.reset.error': '密码重置失败: {error}',
      'cli.mfa.setting': '正在为 {email} 设置MFA (类型: {type})',
      'cli.mfa.setup': 'MFA设置完成: {email}',
      'cli.mfa.setup.error': 'MFA设置失败: {error}',
      'cli.audit.querying': '正在查询审计日志...',
      'cli.audit.error': '审计日志查询失败: {error}'
    }
  }
})

/**
 * 获取Auth包的翻译函数
 * @param userT 用户提供的翻译函数
 * @returns 翻译函数
 */
export const useAuthTranslation = (userT?: TranslationFunction) =>
  authI18n.getTranslation(userT)