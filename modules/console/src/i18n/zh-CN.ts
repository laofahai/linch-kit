/**
 * Console 模块中文语言包
 */

export const zhCN = {
  console: {
    // 模块名称
    name: '控制台',
    description: '企业级管理控制台',
    
    // 导航菜单
    nav: {
      dashboard: '仪表板',
      tenants: '租户管理',
      users: '用户管理',
      permissions: '权限管理',
      plugins: '插件市场',
      monitoring: '系统监控',
      schemas: 'Schema管理',
      settings: '系统设置'
    },
    
    // 实体相关
    entities: {
      // 租户实体
      tenant: {
        name: '租户',
        plural: '租户',
        fields: {
          name: '租户名称',
          domain: '自定义域名',
          slug: 'URL标识',
          description: '描述',
          status: '状态',
          plan: '订阅计划',
          billingCycle: '计费周期',
          maxUsers: '最大用户数',
          maxStorage: '最大存储空间',
          settings: '设置',
          metadata: '元数据',
          createdAt: '创建时间',
          updatedAt: '更新时间',
          deletedAt: '删除时间'
        },
        status: {
          active: '活跃',
          suspended: '已暂停',
          deleted: '已删除',
          pending: '待激活'
        },
        plan: {
          free: '免费版',
          starter: '入门版',
          professional: '专业版',
          enterprise: '企业版'
        }
      },
      
      // 租户配额实体
      tenantQuotas: {
        name: '租户配额',
        fields: {
          tenant: '租户',
          maxUsers: '最大用户数',
          currentUsers: '当前用户数',
          maxStorage: '最大存储空间',
          currentStorage: '当前存储使用',
          maxApiCalls: '最大API调用次数',
          currentApiCalls: '当前API调用次数',
          apiResetAt: 'API配额重置时间',
          maxPlugins: '最大插件数',
          currentPlugins: '当前插件数',
          maxSchemas: '最大Schema数',
          currentSchemas: '当前Schema数',
          createdAt: '创建时间',
          updatedAt: '更新时间'
        }
      },
      
      // 插件实体
      plugin: {
        name: '插件',
        plural: '插件',
        fields: {
          name: '插件名称',
          version: '版本',
          description: '描述',
          author: '作者',
          category: '分类',
          tags: '标签',
          homepage: '主页',
          repository: '源码仓库',
          documentation: '文档',
          license: '许可证',
          downloadUrl: '下载地址',
          configSchema: '配置架构',
          defaultConfig: '默认配置',
          minLinchKitVersion: '最低LinchKit版本',
          maxLinchKitVersion: '最高LinchKit版本',
          dependencies: '依赖项',
          status: '状态',
          isOfficial: '官方插件',
          isFeatured: '推荐插件',
          downloads: '下载次数',
          weeklyDownloads: '周下载量',
          rating: '评分',
          ratingCount: '评分人数',
          reviewStatus: '审核状态',
          reviewNotes: '审核备注',
          reviewedAt: '审核时间',
          reviewedBy: '审核人',
          createdAt: '创建时间',
          updatedAt: '更新时间',
          publishedAt: '发布时间'
        },
        category: {
          ui: 'UI组件',
          data: '数据处理',
          integration: '集成',
          security: '安全',
          monitoring: '监控',
          automation: '自动化',
          workflow: '工作流',
          other: '其他'
        },
        status: {
          draft: '草稿',
          published: '已发布',
          deprecated: '已弃用',
          removed: '已移除'
        }
      },
      
      // 系统指标实体
      systemMetric: {
        name: '系统指标',
        plural: '系统指标',
        fields: {
          type: '指标类型',
          name: '指标名称',
          data: '指标数据',
          source: '来源',
          hostname: '主机名',
          tenant: '租户',
          timestamp: '时间戳'
        },
        type: {
          cpu: 'CPU',
          memory: '内存',
          disk: '磁盘',
          network: '网络',
          database: '数据库',
          api: 'API',
          cache: '缓存',
          queue: '队列',
          custom: '自定义'
        }
      },
      
      // 审计日志实体
      auditLog: {
        name: '审计日志',
        plural: '审计日志',
        fields: {
          action: '操作',
          resource: '资源',
          resourceId: '资源ID',
          status: '状态',
          message: '消息',
          changes: '变更',
          context: '上下文',
          user: '用户',
          tenant: '租户',
          createdAt: '创建时间'
        },
        status: {
          success: '成功',
          failure: '失败',
          warning: '警告'
        }
      },
      
      // 告警规则实体
      alertRule: {
        name: '告警规则',
        plural: '告警规则',
        fields: {
          name: '规则名称',
          description: '描述',
          metricType: '指标类型',
          condition: '条件',
          threshold: '阈值',
          duration: '持续时间(分钟)',
          severity: '严重程度',
          enabled: '已启用',
          notificationChannels: '通知渠道',
          tenant: '租户',
          createdAt: '创建时间',
          updatedAt: '更新时间'
        },
        severity: {
          low: '低',
          medium: '中',
          high: '高',
          critical: '紧急'
        }
      },
      
      // 告警事件实体
      alertEvent: {
        name: '告警事件',
        plural: '告警事件',
        fields: {
          rule: '告警规则',
          status: '状态',
          value: '触发值',
          message: '消息',
          acknowledgedBy: '确认人',
          acknowledgedAt: '确认时间',
          resolvedBy: '解决人',
          resolvedAt: '解决时间',
          triggeredAt: '触发时间'
        },
        status: {
          triggered: '已触发',
          acknowledged: '已确认',
          resolved: '已解决'
        }
      },
      
      // 用户扩展字段
      user: {
        fields: {
          lastLoginAt: '最后登录时间',
          lastLoginIp: '最后登录IP',
          loginCount: '登录次数',
          preferences: '偏好设置',
          currentTenantId: '当前租户',
          isSystemAdmin: '系统管理员',
          apiKey: 'API密钥',
          apiKeyCreatedAt: 'API密钥创建时间',
          apiKeyLastUsedAt: 'API密钥最后使用时间'
        }
      },
      
      // 用户活动实体
      userActivity: {
        name: '用户活动',
        plural: '用户活动',
        fields: {
          user: '用户',
          tenant: '租户',
          type: '活动类型',
          action: '操作',
          resource: '资源',
          resourceId: '资源ID',
          ipAddress: 'IP地址',
          userAgent: '用户代理',
          metadata: '元数据',
          createdAt: '创建时间'
        },
        type: {
          login: '登录',
          logout: '登出',
          page_view: '页面访问',
          api_call: 'API调用',
          data_export: '数据导出',
          settings_change: '设置变更',
          password_change: '密码变更',
          role_change: '角色变更'
        }
      },
      
      // 用户通知实体
      userNotification: {
        name: '用户通知',
        plural: '用户通知',
        fields: {
          user: '用户',
          type: '通知类型',
          title: '标题',
          message: '消息',
          actionUrl: '操作链接',
          actionLabel: '操作标签',
          isRead: '已读',
          readAt: '阅读时间',
          metadata: '元数据',
          createdAt: '创建时间',
          expiresAt: '过期时间'
        },
        type: {
          info: '信息',
          warning: '警告',
          error: '错误',
          success: '成功',
          system: '系统',
          security: '安全'
        }
      }
    },
    
    // 通用操作
    actions: {
      create: '创建',
      edit: '编辑',
      delete: '删除',
      view: '查看',
      save: '保存',
      cancel: '取消',
      search: '搜索',
      filter: '筛选',
      export: '导出',
      import: '导入',
      refresh: '刷新',
      suspend: '暂停',
      activate: '激活',
      install: '安装',
      uninstall: '卸载',
      configure: '配置',
      acknowledge: '确认',
      resolve: '解决'
    },
    
    // 消息提示
    messages: {
      success: {
        created: '{{entity}}创建成功',
        updated: '{{entity}}更新成功',
        deleted: '{{entity}}删除成功',
        suspended: '租户暂停成功',
        activated: '租户激活成功',
        installed: '插件安装成功',
        uninstalled: '插件卸载成功'
      },
      error: {
        createFailed: '创建{{entity}}失败',
        updateFailed: '更新{{entity}}失败',
        deleteFailed: '删除{{entity}}失败',
        notFound: '{{entity}}不存在',
        unauthorized: '您没有权限执行此操作',
        quotaExceeded: '{{resource}}配额已超限',
        notification: {
          markReadFailed: '标记通知已读失败',
          createFailed: '创建通知失败'
        },
        tenant: {
          switchFailed: '切换租户失败'
        },
        export: {
          failed: '数据导出失败'
        }
      },
      success: {
        notification: {
          created: '通知创建成功'
        },
        tenant: {
          switched: '租户切换成功'
        },
        export: {
          completed: '数据导出完成'
        }
      },
      confirm: {
        delete: '确定要删除此{{entity}}吗？',
        suspend: '确定要暂停此租户吗？',
        uninstall: '确定要卸载此插件吗？'
      }
    },
    
    // 仪表板
    dashboard: {
      title: '仪表板',
      description: '系统概览和关键指标监控',
      overview: '系统概览',
      settings: '设置',
      reports: '报表',
      
      stats: {
        totalTenants: '租户总数',
        activeTenants: '活跃租户',
        totalUsers: '用户总数',
        activeUsers: '活跃用户',
        activePlugins: '活跃插件',
        installedPlugins: '已安装插件',
        systemLoad: '系统负载',
        systemHealth: '系统健康度',
        tenantGrowth: '租户增长',
        userGrowth: '用户增长',
        pluginGrowth: '插件增长'
      },
      
      charts: {
        userGrowth: '用户增长',
        apiUsage: 'API使用情况',
        resourceUsage: '资源使用情况',
        tenantActivity: '租户活跃度'
      },
      
      systemHealth: {
        title: '系统健康状态',
        status: {
          healthy: '健康',
          warning: '警告',
          error: '错误',
          unknown: '未知'
        },
        lastCheck: '最后检查'
      },
      
      quickActions: {
        title: '快速操作',
        createTenant: '创建租户',
        manageUsers: '管理用户',
        managePlugins: '管理插件',
        viewMonitoring: '查看监控',
        viewLogs: '查看日志'
      },
      
      recentActivity: {
        title: '最近活动',
        empty: '暂无最近活动'
      },
      
      systemResources: {
        title: '系统资源',
        cpu: 'CPU使用率',
        memory: '内存使用率',
        disk: '磁盘使用率'
      },
      
      tenantOverview: {
        title: '租户概览',
        empty: '暂无租户数据',
        columns: {
          name: '名称',
          status: '状态',
          users: '用户数',
          plugins: '插件数'
        }
      },
      
      pluginStatus: {
        title: '插件状态',
        empty: '暂无插件数据',
        status: {
          active: '运行中',
          inactive: '已停用',
          error: '错误'
        }
      },
      
      recentAlerts: {
        title: '最近告警'
      }
    },
    
    // 租户管理
    tenants: {
      title: '租户管理',
      createTenant: '创建租户',
      editTenant: '编辑租户',
      tenantDetails: '租户详情',
      quotaManagement: '配额管理',
      billingInfo: '计费信息'
    },
    
    // 用户管理
    users: {
      title: '用户管理',
      createUser: '创建用户',
      editUser: '编辑用户',
      userProfile: '用户资料',
      roleAssignment: '角色分配',
      activityLog: '活动日志'
    },
    
    // 权限管理
    permissions: {
      title: '权限管理',
      roles: '角色',
      createRole: '创建角色',
      editRole: '编辑角色',
      permissions: '权限',
      assignPermissions: '分配权限'
    },
    
    // 插件市场
    plugins: {
      title: '插件市场',
      browse: '浏览插件',
      installed: '已安装',
      featured: '推荐',
      categories: '分类',
      details: '插件详情',
      reviews: '评价',
      installation: '安装',
      configuration: '配置'
    },
    
    // 系统监控
    monitoring: {
      title: '系统监控',
      metrics: '指标',
      alerts: '告警',
      logs: '日志',
      health: '健康检查',
      performance: '性能',
      createAlert: '创建告警规则',
      alertHistory: '告警历史'
    },
    
    // Schema 管理
    schemas: {
      title: 'Schema管理',
      designer: 'Schema设计器',
      entities: '实体',
      createEntity: '创建实体',
      editEntity: '编辑实体',
      generateCode: '生成代码',
      migrations: '数据迁移'
    }
  }
}