/**
 * Console 模块英文语言包
 */

export const en = {
  console: {
    // 模块名称
    name: 'Console',
    description: 'Enterprise management console',

    // 导航菜单
    nav: {
      dashboard: 'Dashboard',
      tenants: 'Tenants',
      users: 'Users',
      permissions: 'Permissions',
      plugins: 'Plugins',
      extensions: 'Extensions',
      monitoring: 'Monitoring',
      schemas: 'Schemas',
      settings: 'Settings',
    },

    // 实体相关
    entities: {
      // 租户实体
      tenant: {
        name: 'Tenant',
        plural: 'Tenants',
        fields: {
          name: 'Tenant Name',
          domain: 'Custom Domain',
          slug: 'URL Slug',
          description: 'Description',
          status: 'Status',
          plan: 'Subscription Plan',
          billingCycle: 'Billing Cycle',
          maxUsers: 'Max Users',
          maxStorage: 'Max Storage',
          settings: 'Settings',
          metadata: 'Metadata',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
          deletedAt: 'Deleted At',
        },
        status: {
          active: 'Active',
          suspended: 'Suspended',
          deleted: 'Deleted',
          pending: 'Pending',
        },
        plan: {
          free: 'Free',
          starter: 'Starter',
          professional: 'Professional',
          enterprise: 'Enterprise',
        },
      },

      // 租户配额实体
      tenantQuotas: {
        name: 'Tenant Quotas',
        fields: {
          tenant: 'Tenant',
          maxUsers: 'Max Users',
          currentUsers: 'Current Users',
          maxStorage: 'Max Storage',
          currentStorage: 'Current Storage',
          maxApiCalls: 'Max API Calls',
          currentApiCalls: 'Current API Calls',
          apiResetAt: 'API Reset At',
          maxPlugins: 'Max Plugins',
          currentPlugins: 'Current Plugins',
          maxSchemas: 'Max Schemas',
          currentSchemas: 'Current Schemas',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
      },

      // 插件实体
      plugin: {
        name: 'Plugin',
        plural: 'Plugins',
        fields: {
          name: 'Plugin Name',
          version: 'Version',
          description: 'Description',
          author: 'Author',
          category: 'Category',
          tags: 'Tags',
          homepage: 'Homepage',
          repository: 'Repository',
          documentation: 'Documentation',
          license: 'License',
          downloadUrl: 'Download URL',
          configSchema: 'Config Schema',
          defaultConfig: 'Default Config',
          minLinchKitVersion: 'Min LinchKit Version',
          maxLinchKitVersion: 'Max LinchKit Version',
          dependencies: 'Dependencies',
          status: 'Status',
          isOfficial: 'Official Plugin',
          isFeatured: 'Featured Plugin',
          downloads: 'Downloads',
          weeklyDownloads: 'Weekly Downloads',
          rating: 'Rating',
          ratingCount: 'Rating Count',
          reviewStatus: 'Review Status',
          reviewNotes: 'Review Notes',
          reviewedAt: 'Reviewed At',
          reviewedBy: 'Reviewed By',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
          publishedAt: 'Published At',
        },
        category: {
          ui: 'UI Components',
          data: 'Data Processing',
          integration: 'Integration',
          security: 'Security',
          monitoring: 'Monitoring',
          automation: 'Automation',
          workflow: 'Workflow',
          other: 'Other',
        },
        status: {
          draft: 'Draft',
          published: 'Published',
          deprecated: 'Deprecated',
          removed: 'Removed',
        },
      },

      // 系统指标实体
      systemMetric: {
        name: 'System Metric',
        plural: 'System Metrics',
        fields: {
          type: 'Metric Type',
          name: 'Metric Name',
          data: 'Metric Data',
          source: 'Source',
          hostname: 'Hostname',
          tenant: 'Tenant',
          timestamp: 'Timestamp',
        },
        type: {
          cpu: 'CPU',
          memory: 'Memory',
          disk: 'Disk',
          network: 'Network',
          database: 'Database',
          api: 'API',
          cache: 'Cache',
          queue: 'Queue',
          custom: 'Custom',
        },
      },

      // 审计日志实体
      auditLog: {
        name: 'Audit Log',
        plural: 'Audit Logs',
        fields: {
          action: 'Action',
          resource: 'Resource',
          resourceId: 'Resource ID',
          status: 'Status',
          message: 'Message',
          changes: 'Changes',
          context: 'Context',
          user: 'User',
          tenant: 'Tenant',
          createdAt: 'Created At',
        },
        status: {
          success: 'Success',
          failure: 'Failure',
          warning: 'Warning',
        },
      },

      // 告警规则实体
      alertRule: {
        name: 'Alert Rule',
        plural: 'Alert Rules',
        fields: {
          name: 'Rule Name',
          description: 'Description',
          metricType: 'Metric Type',
          condition: 'Condition',
          threshold: 'Threshold',
          duration: 'Duration (minutes)',
          severity: 'Severity',
          enabled: 'Enabled',
          notificationChannels: 'Notification Channels',
          tenant: 'Tenant',
          createdAt: 'Created At',
          updatedAt: 'Updated At',
        },
        severity: {
          low: 'Low',
          medium: 'Medium',
          high: 'High',
          critical: 'Critical',
        },
      },

      // 告警事件实体
      alertEvent: {
        name: 'Alert Event',
        plural: 'Alert Events',
        fields: {
          rule: 'Alert Rule',
          status: 'Status',
          value: 'Triggered Value',
          message: 'Message',
          acknowledgedBy: 'Acknowledged By',
          acknowledgedAt: 'Acknowledged At',
          resolvedBy: 'Resolved By',
          resolvedAt: 'Resolved At',
          triggeredAt: 'Triggered At',
        },
        status: {
          triggered: 'Triggered',
          acknowledged: 'Acknowledged',
          resolved: 'Resolved',
        },
      },

      // 用户扩展字段
      user: {
        fields: {
          lastLoginAt: 'Last Login At',
          lastActiveAt: 'Last Active At',
          lastLoginIp: 'Last Login IP',
          loginCount: 'Login Count',
          preferences: 'Preferences',
          currentTenantId: 'Current Tenant',
          isSystemAdmin: 'System Admin',
          apiKey: 'API Key',
          apiKeyCreatedAt: 'API Key Created At',
          apiKeyLastUsedAt: 'API Key Last Used At',
        },
      },

      // 用户活动实体
      userActivity: {
        name: 'User Activity',
        plural: 'User Activities',
        fields: {
          user: 'User',
          tenant: 'Tenant',
          type: 'Activity Type',
          action: 'Action',
          resource: 'Resource',
          resourceId: 'Resource ID',
          ipAddress: 'IP Address',
          userAgent: 'User Agent',
          metadata: 'Metadata',
          createdAt: 'Created At',
        },
        type: {
          login: 'Login',
          logout: 'Logout',
          page_view: 'Page View',
          api_call: 'API Call',
          data_export: 'Data Export',
          settings_change: 'Settings Change',
          password_change: 'Password Change',
          role_change: 'Role Change',
        },
      },

      // 用户通知实体
      userNotification: {
        name: 'User Notification',
        plural: 'User Notifications',
        fields: {
          user: 'User',
          type: 'Notification Type',
          title: 'Title',
          message: 'Message',
          actionUrl: 'Action URL',
          actionLabel: 'Action Label',
          isRead: 'Read',
          readAt: 'Read At',
          metadata: 'Metadata',
          createdAt: 'Created At',
          expiresAt: 'Expires At',
        },
        type: {
          info: 'Information',
          warning: 'Warning',
          error: 'Error',
          success: 'Success',
          system: 'System',
          security: 'Security',
        },
      },
    },

    // 通用操作
    actions: {
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      refresh: 'Refresh',
      suspend: 'Suspend',
      activate: 'Activate',
      install: 'Install',
      uninstall: 'Uninstall',
      configure: 'Configure',
      acknowledge: 'Acknowledge',
      resolve: 'Resolve',
      enable: 'Enable',
      disable: 'Disable',
      reload: 'Reload',
    },

    // 消息提示
    messages: {
      success: {
        created: '{{entity}} created successfully',
        updated: '{{entity}} updated successfully',
        deleted: '{{entity}} deleted successfully',
        suspended: 'Tenant suspended successfully',
        activated: 'Tenant activated successfully',
        installed: 'Plugin installed successfully',
        uninstalled: 'Plugin uninstalled successfully',
        enabled: 'Extension enabled successfully',
        disabled: 'Extension disabled successfully',
        loaded: 'Extension loaded successfully',
        unloaded: 'Extension unloaded successfully',
        reloaded: 'Extension reloaded successfully',
      },
      error: {
        createFailed: 'Failed to create {{entity}}',
        updateFailed: 'Failed to update {{entity}}',
        deleteFailed: 'Failed to delete {{entity}}',
        notFound: '{{entity}} not found',
        unauthorized: 'You are not authorized to perform this action',
        quotaExceeded: 'Quota exceeded for {{resource}}',
        loadFailed: 'Failed to load extension',
        unloadFailed: 'Failed to unload extension',
        reloadFailed: 'Failed to reload extension',
        installFailed: 'Failed to install extension',
        uninstallFailed: 'Failed to uninstall extension',
      },
      confirm: {
        delete: 'Are you sure you want to delete this {{entity}}?',
        suspend: 'Are you sure you want to suspend this tenant?',
        uninstall: 'Are you sure you want to uninstall this plugin?',
        unloadExtension: 'Are you sure you want to unload this extension?',
        reloadExtension: 'Are you sure you want to reload this extension?',
        installExtension: 'Are you sure you want to install this extension?',
        uninstallExtension: 'Are you sure you want to uninstall this extension?',
      },
    },

    // 仪表板
    dashboard: {
      title: 'Dashboard',
      overview: 'System Overview',
      stats: {
        totalTenants: 'Total Tenants',
        activeTenants: 'Active Tenants',
        totalUsers: 'Total Users',
        activeUsers: 'Active Users',
        installedPlugins: 'Installed Plugins',
        systemHealth: 'System Health',
      },
      charts: {
        userGrowth: 'User Growth',
        apiUsage: 'API Usage',
        resourceUsage: 'Resource Usage',
        tenantActivity: 'Tenant Activity',
      },
    },

    // 租户管理
    tenants: {
      title: 'Tenant Management',
      createTenant: 'Create Tenant',
      editTenant: 'Edit Tenant',
      tenantDetails: 'Tenant Details',
      quotaManagement: 'Quota Management',
      billingInfo: 'Billing Information',
    },

    // 用户管理
    users: {
      title: 'User Management',
      createUser: 'Create User',
      editUser: 'Edit User',
      userProfile: 'User Profile',
      roleAssignment: 'Role Assignment',
      activityLog: 'Activity Log',
    },

    // 权限管理
    permissions: {
      title: 'Permission Management',
      roles: 'Roles',
      createRole: 'Create Role',
      editRole: 'Edit Role',
      permissions: 'Permissions',
      assignPermissions: 'Assign Permissions',
    },

    // 插件市场
    plugins: {
      title: 'Plugin Marketplace',
      browse: 'Browse Plugins',
      installed: 'Installed Plugins',
      featured: 'Featured',
      categories: 'Categories',
      details: 'Plugin Details',
      reviews: 'Reviews',
      installation: 'Installation',
      configuration: 'Configuration',
    },

    // 系统监控
    monitoring: {
      title: 'System Monitoring',
      metrics: 'Metrics',
      alerts: 'Alerts',
      logs: 'Logs',
      health: 'Health Check',
      performance: 'Performance',
      createAlert: 'Create Alert Rule',
      alertHistory: 'Alert History',
    },

    // Schema 管理
    schemas: {
      title: 'Schema Management',
      designer: 'Schema Designer',
      entities: 'Entities',
      createEntity: 'Create Entity',
      editEntity: 'Edit Entity',
      generateCode: 'Generate Code',
      migrations: 'Migrations',
    },

    // Extension 管理
    extension: {
      manager: {
        title: 'Extension Manager',
        description: 'Manage and configure system extensions',
        refresh: 'Refresh',
        install: 'Install Extension',
        settings: 'Extension Settings',
        search: 'Search extensions...',
        filter: {
          all: 'All Extensions',
          loaded: 'Loaded',
          failed: 'Failed',
          unloaded: 'Unloaded',
        },
        stats: {
          total: 'Total Extensions',
          loaded: 'Loaded Extensions',
          failed: 'Failed Extensions',
          unloaded: 'Unloaded Extensions',
        },
        list: {
          title: 'Extension List',
        },
        empty: {
          title: 'No Extensions Found',
          description: 'No extensions are currently installed or match your search criteria.',
        },
        status: {
          loading: 'Loading',
          loaded: 'Loaded',
          failed: 'Failed',
          unloaded: 'Unloaded',
        },
        routes: 'Routes',
        components: 'Components',
        loadedAt: 'Loaded at',
      },
      details: {
        overview: 'Overview',
        resources: 'Resources',
        logs: 'Logs',
        basic: 'Basic Information',
        name: 'Name',
        status: 'Status',
        loadedAt: 'Loaded At',
        error: 'Error Information',
        logsContent: {
          empty: 'No logs available for this extension',
        },
      },
      install: {
        title: 'Install Extension',
        selectExtension: 'Select Extension',
        pleaseSelect: 'Please select an extension',
        install: 'Install',
      },
    },

    // 通用词汇
    common: {
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      close: 'Close',
      open: 'Open',
      enable: 'Enable',
      disable: 'Disable',
    },

    // 错误处理
    error: {
      permission: {
        denied: 'Permission Denied',
        description: 'You do not have permission to access this page.',
      },
      network: {
        title: 'Network Error',
        description: 'Unable to connect to the server. Please check your network connection.',
      },
      server: {
        title: 'Server Error',
        description: 'An internal server error occurred. Please try again later.',
      },
      notFound: {
        title: 'Page Not Found',
        description: 'The page you are looking for does not exist.',
      },
    },
  },
}
