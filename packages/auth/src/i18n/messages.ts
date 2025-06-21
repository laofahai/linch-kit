/**
 * 内置国际化消息
 * 
 * 用户可以覆盖这些消息或添加自己的翻译
 */

export const defaultMessages = {
  en: {
    // 登录相关
    'auth.signIn.title': 'Sign In',
    'auth.signIn.subtitle': 'Sign in to your account',
    'auth.signIn.email': 'Email',
    'auth.signIn.password': 'Password',
    'auth.signIn.submit': 'Sign In',
    'auth.signIn.loading': 'Signing in...',
    'auth.signIn.forgotPassword': 'Forgot password?',
    'auth.signIn.noAccount': "Don't have an account?",
    'auth.signIn.signUp': 'Sign up',

    // 注册相关
    'auth.signUp.title': 'Sign Up',
    'auth.signUp.subtitle': 'Create your account',
    'auth.signUp.name': 'Full Name',
    'auth.signUp.email': 'Email',
    'auth.signUp.password': 'Password',
    'auth.signUp.confirmPassword': 'Confirm Password',
    'auth.signUp.submit': 'Sign Up',
    'auth.signUp.loading': 'Creating account...',
    'auth.signUp.hasAccount': 'Already have an account?',
    'auth.signUp.signIn': 'Sign in',

    // 登出相关
    'auth.signOut.title': 'Sign Out',
    'auth.signOut.confirm': 'Are you sure you want to sign out?',
    'auth.signOut.submit': 'Sign Out',
    'auth.signOut.cancel': 'Cancel',
    'auth.signOut.success': 'Signed out successfully',

    // OAuth 提供者
    'auth.provider.google': 'Continue with Google',
    'auth.provider.github': 'Continue with GitHub',
    'auth.provider.microsoft': 'Continue with Microsoft',
    'auth.provider.apple': 'Continue with Apple',
    'auth.provider.facebook': 'Continue with Facebook',
    'auth.provider.twitter': 'Continue with Twitter',

    // 错误消息
    'auth.error.invalidCredentials': 'Invalid email or password',
    'auth.error.userNotFound': 'User not found',
    'auth.error.userExists': 'User already exists',
    'auth.error.emailRequired': 'Email is required',
    'auth.error.passwordRequired': 'Password is required',
    'auth.error.passwordTooShort': 'Password must be at least 8 characters',
    'auth.error.passwordMismatch': 'Passwords do not match',
    'auth.error.invalidEmail': 'Invalid email address',
    'auth.error.networkError': 'Network error, please try again',
    'auth.error.serverError': 'Server error, please try again later',
    'auth.error.sessionExpired': 'Your session has expired, please sign in again',
    'auth.error.accessDenied': 'Access denied',
    'auth.error.accountNotVerified': 'Please verify your account',

    // 权限相关
    'auth.permissions.denied': 'Permission denied',
    'auth.permissions.insufficientRights': 'Insufficient rights to perform this action',
    'auth.permissions.roleRequired': 'Required role: {role}',
    'auth.permissions.resourceAccess': 'Access to {resource} denied',

    // 会话相关
    'auth.session.expired': 'Session expired',
    'auth.session.invalid': 'Invalid session',
    'auth.session.refreshing': 'Refreshing session...',

    // 多租户相关
    'auth.tenant.notFound': 'Tenant not found',
    'auth.tenant.accessDenied': 'Access to this tenant denied',
    'auth.tenant.switchSuccess': 'Switched to {tenant}',

    // 用户管理
    'auth.user.profile': 'Profile',
    'auth.user.settings': 'Settings',
    'auth.user.preferences': 'Preferences',
    'auth.user.security': 'Security',
    'auth.user.updateSuccess': 'Profile updated successfully',
    'auth.user.updateError': 'Failed to update profile',

    // 通用
    'auth.common.loading': 'Loading...',
    'auth.common.save': 'Save',
    'auth.common.cancel': 'Cancel',
    'auth.common.confirm': 'Confirm',
    'auth.common.close': 'Close',
    'auth.common.retry': 'Retry',
    'auth.common.back': 'Back',
    'auth.common.next': 'Next',
    'auth.common.previous': 'Previous',
    'auth.common.finish': 'Finish'
  },

  'zh-CN': {
    // 登录相关
    'auth.signIn.title': '登录',
    'auth.signIn.subtitle': '登录到您的账户',
    'auth.signIn.email': '邮箱',
    'auth.signIn.password': '密码',
    'auth.signIn.submit': '登录',
    'auth.signIn.loading': '登录中...',
    'auth.signIn.forgotPassword': '忘记密码？',
    'auth.signIn.noAccount': '没有账户？',
    'auth.signIn.signUp': '注册',

    // 注册相关
    'auth.signUp.title': '注册',
    'auth.signUp.subtitle': '创建您的账户',
    'auth.signUp.name': '姓名',
    'auth.signUp.email': '邮箱',
    'auth.signUp.password': '密码',
    'auth.signUp.confirmPassword': '确认密码',
    'auth.signUp.submit': '注册',
    'auth.signUp.loading': '创建账户中...',
    'auth.signUp.hasAccount': '已有账户？',
    'auth.signUp.signIn': '登录',

    // 登出相关
    'auth.signOut.title': '退出登录',
    'auth.signOut.confirm': '确定要退出登录吗？',
    'auth.signOut.submit': '退出登录',
    'auth.signOut.cancel': '取消',
    'auth.signOut.success': '退出成功',

    // OAuth 提供者
    'auth.provider.google': '使用 Google 继续',
    'auth.provider.github': '使用 GitHub 继续',
    'auth.provider.microsoft': '使用 Microsoft 继续',
    'auth.provider.apple': '使用 Apple 继续',
    'auth.provider.facebook': '使用 Facebook 继续',
    'auth.provider.twitter': '使用 Twitter 继续',

    // 错误消息
    'auth.error.invalidCredentials': '邮箱或密码错误',
    'auth.error.userNotFound': '用户不存在',
    'auth.error.userExists': '用户已存在',
    'auth.error.emailRequired': '邮箱不能为空',
    'auth.error.passwordRequired': '密码不能为空',
    'auth.error.passwordTooShort': '密码至少需要8个字符',
    'auth.error.passwordMismatch': '密码不匹配',
    'auth.error.invalidEmail': '邮箱格式错误',
    'auth.error.networkError': '网络错误，请重试',
    'auth.error.serverError': '服务器错误，请稍后重试',
    'auth.error.sessionExpired': '会话已过期，请重新登录',
    'auth.error.accessDenied': '访问被拒绝',
    'auth.error.accountNotVerified': '请验证您的账户',

    // 权限相关
    'auth.permissions.denied': '权限不足',
    'auth.permissions.insufficientRights': '权限不足，无法执行此操作',
    'auth.permissions.roleRequired': '需要角色：{role}',
    'auth.permissions.resourceAccess': '无权访问 {resource}',

    // 会话相关
    'auth.session.expired': '会话已过期',
    'auth.session.invalid': '无效会话',
    'auth.session.refreshing': '刷新会话中...',

    // 多租户相关
    'auth.tenant.notFound': '租户不存在',
    'auth.tenant.accessDenied': '无权访问此租户',
    'auth.tenant.switchSuccess': '已切换到 {tenant}',

    // 用户管理
    'auth.user.profile': '个人资料',
    'auth.user.settings': '设置',
    'auth.user.preferences': '偏好设置',
    'auth.user.security': '安全设置',
    'auth.user.updateSuccess': '个人资料更新成功',
    'auth.user.updateError': '个人资料更新失败',

    // 通用
    'auth.common.loading': '加载中...',
    'auth.common.save': '保存',
    'auth.common.cancel': '取消',
    'auth.common.confirm': '确认',
    'auth.common.close': '关闭',
    'auth.common.retry': '重试',
    'auth.common.back': '返回',
    'auth.common.next': '下一步',
    'auth.common.previous': '上一步',
    'auth.common.finish': '完成'
  }
}

/**
 * 获取翻译消息
 */
export function getMessage(
  key: string,
  locale: string = 'en',
  params?: Record<string, string>
): string {
  const messages = defaultMessages[locale as keyof typeof defaultMessages] || defaultMessages.en
  let message = messages[key as keyof typeof messages] || key

  // 替换参数
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      message = message.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value)
    })
  }

  return message
}

/**
 * 检查是否支持指定语言
 */
export function isSupportedLocale(locale: string): boolean {
  return locale in defaultMessages
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLocales(): string[] {
  return Object.keys(defaultMessages)
}
