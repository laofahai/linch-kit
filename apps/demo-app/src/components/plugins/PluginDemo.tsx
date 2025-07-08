'use client'

import { useState } from 'react'
// import { PluginManager } from '@linch-kit/core'

// 模拟PluginManager类
class PluginManager {
  constructor(_config: unknown) {}
}

// 模拟插件数据
interface MockPlugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  status: 'active' | 'inactive' | 'error' | 'loading'
  dependencies: string[]
  permissions: string[]
  size: string
  installDate: string
  config?: Record<string, unknown>
}

const mockPlugins: MockPlugin[] = [
  {
    id: 'email-service',
    name: '邮件服务插件',
    version: '1.2.0',
    description: '提供SMTP邮件发送功能，支持模板渲染和批量发送',
    author: 'LinchKit Team',
    category: 'communication',
    status: 'active',
    dependencies: ['logger', 'config'],
    permissions: ['network', 'file:read'],
    size: '1.2 MB',
    installDate: '2025-06-20',
    config: {
      provider: 'smtp',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      templatesEnabled: true,
    },
  },
  {
    id: 'analytics',
    name: '数据分析插件',
    version: '2.1.3',
    description: '用户行为分析和业务指标统计，支持实时图表展示',
    author: 'Analytics Inc',
    category: 'analytics',
    status: 'active',
    dependencies: ['database', 'cache'],
    permissions: ['database:read', 'api:external'],
    size: '3.8 MB',
    installDate: '2025-06-18',
    config: {
      trackingEnabled: true,
      retentionDays: 90,
      realtimeUpdates: true,
      dashboardTheme: 'light',
    },
  },
  {
    id: 'payment-gateway',
    name: '支付网关',
    version: '1.0.5',
    description: '集成多种支付方式：支付宝、微信支付、Stripe等',
    author: 'Payment Solutions',
    category: 'payment',
    status: 'inactive',
    dependencies: ['auth', 'logger'],
    permissions: ['network', 'crypto', 'database:write'],
    size: '2.5 MB',
    installDate: '2025-06-15',
  },
  {
    id: 'cache-redis',
    name: 'Redis缓存',
    version: '3.0.1',
    description: '高性能Redis缓存集成，支持集群和哨兵模式',
    author: 'LinchKit Team',
    category: 'infrastructure',
    status: 'active',
    dependencies: [],
    permissions: ['network', 'memory'],
    size: '0.8 MB',
    installDate: '2025-06-25',
    config: {
      host: 'localhost',
      port: 6379,
      cluster: false,
      maxConnections: 10,
    },
  },
  {
    id: 'file-storage',
    name: '文件存储',
    version: '1.5.2',
    description: '统一文件存储接口，支持本地、AWS S3、阿里云OSS',
    author: 'Storage Team',
    category: 'storage',
    status: 'error',
    dependencies: ['config'],
    permissions: ['file:read', 'file:write', 'network'],
    size: '4.1 MB',
    installDate: '2025-06-22',
  },
  {
    id: 'notification',
    name: '消息通知',
    version: '0.9.0',
    description: '多渠道推送通知：邮件、短信、推送、钉钉、企业微信',
    author: 'Notification Co',
    category: 'communication',
    status: 'loading',
    dependencies: ['email-service', 'logger'],
    permissions: ['network', 'notification'],
    size: '1.9 MB',
    installDate: '2025-06-26',
  },
]

const categories = [
  { key: 'all', name: '全部插件', icon: '📦' },
  { key: 'communication', name: '通信服务', icon: '📧' },
  { key: 'analytics', name: '数据分析', icon: '📊' },
  { key: 'payment', name: '支付服务', icon: '💳' },
  { key: 'infrastructure', name: '基础设施', icon: '🏗️' },
  { key: 'storage', name: '存储服务', icon: '💾' },
]

export function PluginDemo() {
  const [plugins, setPlugins] = useState<MockPlugin[]>(mockPlugins)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPlugin, setSelectedPlugin] = useState<MockPlugin | null>(null)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [_pluginManager] = useState(
    () =>
      new PluginManager({
        pluginDir: './plugins',
        autoLoad: true,
        security: {
          sandbox: true,
          permissionCheck: true,
        },
      })
  )

  const filteredPlugins =
    selectedCategory === 'all' ? plugins : plugins.filter(p => p.category === selectedCategory)

  const togglePlugin = async (pluginId: string) => {
    setPlugins(prev =>
      prev.map(plugin => {
        if (plugin.id === pluginId) {
          const newStatus = plugin.status === 'active' ? 'inactive' : 'active'

          // 模拟插件加载过程
          if (newStatus === 'active') {
            setTimeout(() => {
              setPlugins(current =>
                current.map(p => (p.id === pluginId ? { ...p, status: 'active' as const } : p))
              )
            }, 1500)
            return { ...plugin, status: 'loading' as const }
          }

          return { ...plugin, status: newStatus }
        }
        return plugin
      })
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'loading':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '✅'
      case 'inactive':
        return '⏸️'
      case 'error':
        return '❌'
      case 'loading':
        return '⏳'
      default:
        return '❓'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* 插件分类 */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold mb-4">📋 插件分类</h3>
        {categories.map(category => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              selectedCategory === category.key
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } shadow-sm border`}
          >
            <div className="flex items-center space-x-3">
              <span>{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </div>
          </button>
        ))}

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => setShowInstallModal(true)}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + 安装新插件
          </button>
        </div>
      </div>

      {/* 插件列表 */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {categories.find(c => c.key === selectedCategory)?.icon}{' '}
            {categories.find(c => c.key === selectedCategory)?.name}
            <span className="text-sm text-gray-500 ml-2">({filteredPlugins.length} 个插件)</span>
          </h3>

          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              批量操作
            </button>
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
              检查更新
            </button>
          </div>
        </div>

        {filteredPlugins.map(plugin => (
          <div key={plugin.id} className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{plugin.name}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(plugin.status)}`}
                  >
                    {getStatusIcon(plugin.status)} {plugin.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">v{plugin.version}</span>
                </div>

                <p className="text-gray-600 mb-3">{plugin.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                  <div>
                    <strong>作者:</strong> {plugin.author}
                  </div>
                  <div>
                    <strong>大小:</strong> {plugin.size}
                  </div>
                  <div>
                    <strong>安装时间:</strong> {plugin.installDate}
                  </div>
                  <div>
                    <strong>依赖:</strong> {plugin.dependencies.length || 0} 个
                  </div>
                </div>

                {plugin.dependencies.length > 0 && (
                  <div className="mt-3">
                    <strong className="text-sm text-gray-700">依赖插件:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {plugin.dependencies.map(dep => (
                        <span
                          key={dep}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {plugin.permissions.length > 0 && (
                  <div className="mt-3">
                    <strong className="text-sm text-gray-700">权限要求:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {plugin.permissions.map(perm => (
                        <span
                          key={perm}
                          className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => togglePlugin(plugin.id)}
                  disabled={plugin.status === 'loading' || plugin.status === 'error'}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    plugin.status === 'active'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : plugin.status === 'loading'
                        ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                        : plugin.status === 'error'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {plugin.status === 'active'
                    ? '停用'
                    : plugin.status === 'loading'
                      ? '加载中...'
                      : plugin.status === 'error'
                        ? '错误'
                        : '启用'}
                </button>

                <button
                  onClick={() => setSelectedPlugin(plugin)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200"
                >
                  配置
                </button>

                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200">
                  详情
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* 插件配置模态框 */}
        {selectedPlugin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">配置 {selectedPlugin.name}</h3>
                <button
                  onClick={() => setSelectedPlugin(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {selectedPlugin.config ? (
                <div className="space-y-4">
                  {Object.entries(selectedPlugin.config).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                      {typeof value === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={value}
                          className="rounded border-gray-300"
                        />
                      ) : typeof value === 'number' ? (
                        <input
                          type="number"
                          value={value}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      ) : (
                        <input
                          type="text"
                          value={String(value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex space-x-2 pt-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      保存配置
                    </button>
                    <button
                      onClick={() => setSelectedPlugin(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">此插件暂无可配置项</p>
              )}
            </div>
          </div>
        )}

        {/* 安装插件模态框 */}
        {showInstallModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">安装新插件</h3>
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">插件来源</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2">
                    <option>NPM Registry</option>
                    <option>本地文件</option>
                    <option>Git仓库</option>
                    <option>插件市场</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">插件标识</label>
                  <input
                    type="text"
                    placeholder="例如: @linchkit/plugin-example"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                    安装插件
                  </button>
                  <button
                    onClick={() => setShowInstallModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
