import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// 导入翻译资源
const resources = {
  en: {
    translation: {
      // 通用
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        export: 'Export',
        import: 'Import',
        refresh: 'Refresh',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        submit: 'Submit',
        reset: 'Reset',
        clear: 'Clear',
        select: 'Select',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        noData: 'No data available',
        noResults: 'No results found',
        actions: 'Actions',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        enabled: 'Enabled',
        disabled: 'Disabled',
        yes: 'Yes',
        no: 'No',
        or: 'or'
      },

      // 认证
      auth: {
        signIn: {
          title: 'Sign In',
          subtitle: 'Sign in to your account',
          email: 'Email',
          password: 'Password',
          submit: 'Sign In',
          loading: 'Signing in...',
          forgotPassword: 'Forgot password?',
          noAccount: "Don't have an account?",
          signUp: 'Sign up',
          googleSignIn: 'Sign in with Google',
          error: 'Sign in failed, please check your email and password',
          networkError: 'Network error, please try again later'
        },
        signOut: {
          title: 'Sign Out',
          confirm: 'Are you sure you want to sign out?',
          success: 'Signed out successfully'
        },
        user: {
          profile: 'Profile',
          settings: 'Settings',
          signOut: 'Sign Out',
          unnamed: 'Unnamed User'
        },
        permissions: {
          accessDenied: 'Access Denied',
          noPermission: 'You do not have permission to access this page'
        }
      },

      // 导航
      nav: {
        dashboard: 'Dashboard',
        users: 'User Management',
        data: 'Data Management',
        reports: 'Reports',
        docs: 'Documentation',
        settings: 'Settings',
        notifications: 'Notifications',
        viewNotifications: 'View notifications',
        openSidebar: 'Open sidebar',
        closeSidebar: 'Close sidebar'
      },

      // 应用
      app: {
        title: 'Linch Kit',
        subtitle: 'Enterprise Development Framework',
        welcome: 'Welcome to Linch Kit',
        description: 'AI-First enterprise development framework'
      },

      // 表单
      form: {
        required: 'This field is required',
        invalid: 'Invalid format',
        tooShort: 'Too short',
        tooLong: 'Too long',
        emailInvalid: 'Invalid email format',
        passwordTooWeak: 'Password is too weak',
        confirmPassword: 'Confirm password',
        passwordMismatch: 'Passwords do not match'
      },

      // 表格
      table: {
        noData: 'No data available',
        loading: 'Loading data...',
        error: 'Failed to load data',
        rowsPerPage: 'Rows per page',
        page: 'Page',
        of: 'of',
        rows: 'rows',
        selected: 'selected',
        selectRow: 'Select row',
        selectAll: 'Select all rows',
        sortBy: 'Sort by',
        filterBy: 'Filter by'
      },

      // 操作反馈
      feedback: {
        createSuccess: 'Created successfully',
        updateSuccess: 'Updated successfully',
        deleteSuccess: 'Deleted successfully',
        createError: 'Failed to create',
        updateError: 'Failed to update',
        deleteError: 'Failed to delete',
        networkError: 'Network error, please try again',
        unknownError: 'Unknown error occurred'
      }
    }
  },
  'zh-CN': {
    translation: {
      // 通用
      common: {
        loading: '加载中...',
        error: '错误',
        success: '成功',
        cancel: '取消',
        confirm: '确认',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        create: '创建',
        search: '搜索',
        filter: '筛选',
        export: '导出',
        import: '导入',
        refresh: '刷新',
        close: '关闭',
        back: '返回',
        next: '下一步',
        previous: '上一步',
        submit: '提交',
        reset: '重置',
        clear: '清空',
        select: '选择',
        selectAll: '全选',
        deselectAll: '取消全选',
        noData: '暂无数据',
        noResults: '未找到结果',
        actions: '操作',
        status: '状态',
        active: '激活',
        inactive: '未激活',
        enabled: '启用',
        disabled: '禁用',
        yes: '是',
        no: '否',
        or: '或'
      },

      // 认证
      auth: {
        signIn: {
          title: '登录',
          subtitle: '使用您的邮箱和密码登录',
          email: '邮箱',
          password: '密码',
          submit: '登录',
          loading: '登录中...',
          forgotPassword: '忘记密码？',
          noAccount: '还没有账户？',
          signUp: '注册',
          googleSignIn: '使用 Google 登录',
          error: '登录失败，请检查您的邮箱和密码',
          networkError: '网络错误，请稍后重试'
        },
        signOut: {
          title: '退出登录',
          confirm: '确定要退出登录吗？',
          success: '退出登录成功'
        },
        user: {
          profile: '个人资料',
          settings: '设置',
          signOut: '退出登录',
          unnamed: '未命名用户'
        },
        permissions: {
          accessDenied: '访问被拒绝',
          noPermission: '您没有访问此页面的权限'
        }
      },

      // 导航
      nav: {
        dashboard: '仪表板',
        users: '用户管理',
        data: '数据管理',
        reports: '报表',
        docs: '文档',
        settings: '设置',
        notifications: '通知',
        viewNotifications: '查看通知',
        openSidebar: '打开侧边栏',
        closeSidebar: '关闭侧边栏'
      },

      // 应用
      app: {
        title: 'Linch Kit',
        subtitle: '企业级开发框架',
        welcome: '欢迎使用 Linch Kit',
        description: 'AI-First 企业级开发框架'
      },

      // 表单
      form: {
        required: '此字段为必填项',
        invalid: '格式不正确',
        tooShort: '内容过短',
        tooLong: '内容过长',
        emailInvalid: '邮箱格式不正确',
        passwordTooWeak: '密码强度不够',
        confirmPassword: '确认密码',
        passwordMismatch: '两次输入的密码不一致'
      },

      // 表格
      table: {
        noData: '暂无数据',
        loading: '数据加载中...',
        error: '数据加载失败',
        rowsPerPage: '每页行数',
        page: '第',
        of: '页，共',
        rows: '条',
        selected: '已选择',
        selectRow: '选择行',
        selectAll: '全选',
        sortBy: '排序',
        filterBy: '筛选'
      },

      // 操作反馈
      feedback: {
        createSuccess: '创建成功',
        updateSuccess: '更新成功',
        deleteSuccess: '删除成功',
        createError: '创建失败',
        updateError: '更新失败',
        deleteError: '删除失败',
        networkError: '网络错误，请重试',
        unknownError: '发生未知错误'
      }
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh-CN', // 默认语言
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React 已经安全处理了
    },

    // 调试模式
    debug: process.env.NODE_ENV === 'development'
  })

export default i18n
