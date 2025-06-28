'use client'

import { useState, useEffect } from 'react'
// import { ConfigManager } from '@linch-kit/core'

// 模拟ConfigManager类
class ConfigManager {
  constructor(_config: unknown) {}
}

// 模拟配置数据
const mockConfigs = {
  database: {
    host: 'localhost',
    port: 5432,
    name: 'linchkit_dev',
    ssl: false,
    poolSize: 10,
    timeout: 5000
  },
  auth: {
    jwt: {
      secret: 'demo-jwt-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d'
    },
    oauth: {
      google: {
        clientId: 'google-client-id',
        clientSecret: '***hidden***',
        enabled: true
      },
      github: {
        clientId: 'github-client-id',
        clientSecret: '***hidden***',
        enabled: false
      }
    },
    rateLimit: {
      windowMs: 900000,
      maxRequests: 100
    }
  },
  monitoring: {
    metrics: {
      enabled: true,
      port: 9090,
      path: '/metrics'
    },
    logging: {
      level: 'info',
      format: 'json',
      outputs: ['console', 'file']
    },
    tracing: {
      enabled: true,
      serviceName: 'linchkit-app',
      endpoint: 'http://localhost:14268/api/traces'
    }
  },
  features: {
    userRegistration: true,
    emailVerification: true,
    twoFactorAuth: false,
    socialLogin: true,
    darkMode: true,
    maintenanceMode: false
  }
}

interface ConfigSection {
  key: string
  name: string
  description: string
  icon: string
}

const configSections: ConfigSection[] = [
  {
    key: 'database',
    name: '数据库配置',
    description: '数据库连接和性能设置',
    icon: '🗄️'
  },
  {
    key: 'auth',
    name: '认证配置',
    description: 'JWT、OAuth和安全设置',
    icon: '🔐'
  },
  {
    key: 'monitoring',
    name: '监控配置',
    description: '指标、日志和链路追踪',
    icon: '📊'
  },
  {
    key: 'features',
    name: '功能开关',
    description: '特性标志和功能控制',
    icon: '🎛️'
  }
]

export function ConfigDemo() {
  const [selectedSection, setSelectedSection] = useState<string>('database')
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development')
  const [tenant, setTenant] = useState<string>('default')
  const [configs, setConfigs] = useState(mockConfigs)
  const [validationResult, setValidationResult] = useState<string>('')
  const [configStats, setConfigStats] = useState<{ totalConfigs: number; validConfigs: number; lastUpdated: string } | null>(null)
  const [_configManager] = useState(() => new ConfigManager({
    sources: [
      { type: 'env', priority: 1 },
      { type: 'file', path: './config/default.json', priority: 2 },
      { type: 'database', priority: 3 }
    ],
    environment: 'development',
    tenant: 'default'
  }))

  useEffect(() => {
    // 模拟配置加载
    loadConfig()
  }, [environment, tenant])

  const loadConfig = async () => {
    try {
      // 模拟异步配置加载
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 根据环境和租户调整配置
      const envConfigs = { ...mockConfigs }
      
      if (environment === 'production') {
        envConfigs.database.host = 'prod-db.example.com'
        envConfigs.database.ssl = true
        envConfigs.monitoring.logging.level = 'warn'
      } else if (environment === 'staging') {
        envConfigs.database.host = 'staging-db.example.com'
        envConfigs.monitoring.logging.level = 'debug'
      }
      
      if (tenant !== 'default') {
        envConfigs.database.name = `linchkit_${tenant}_${environment}`
      }
      
      setConfigs(envConfigs)
    } catch (error) {
      console.error('配置加载失败:', error)
    }
  }

  const getCurrentConfig = () => {
    return configs[selectedSection as keyof typeof configs]
  }

  // 验证配置功能
  const validateConfig = () => {
    const currentConfig = getCurrentConfig()
    const configKeys = Object.keys(currentConfig)
    const validKeys = configKeys.filter(key => currentConfig[key] !== undefined && currentConfig[key] !== '')
    
    setValidationResult(`✅ 配置验证完成: ${selectedSection} 包含 ${configKeys.length} 项配置，其中 ${validKeys.length} 项有效`)
  }

  const getConfigStats = () => {
    const allConfigs = Object.values(configs).reduce((total, section) => {
      return total + Object.keys(section).length
    }, 0)
    
    const validConfigs = Object.values(configs).reduce((total, section) => {
      return total + Object.values(section).filter(val => val !== undefined && val !== '').length
    }, 0)

    setConfigStats({
      totalConfigs: allConfigs,
      validConfigs,
      lastUpdated: new Date().toLocaleString('zh-CN')
    })
  }

  const updateConfig = (path: string, value: unknown) => {
    setConfigs(prev => {
      const updated = { ...prev }
      const keys = path.split('.')
      let current = updated as Record<string, unknown>
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return updated
    })
  }

  const renderConfigValue = (key: string, value: unknown, path: string = '') => {
    const fullPath = path ? `${path}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={key} className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
          <div className="pl-4 border-l-2 border-gray-200">
            {Object.entries(value).map(([subKey, subValue]) =>
              renderConfigValue(subKey, subValue, fullPath)
            )}
          </div>
        </div>
      )
    }

    if (Array.isArray(value)) {
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {key}
          </label>
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
            [{value.map(item => `"${item}"`).join(', ')}]
          </div>
        </div>
      )
    }

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="mb-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => updateConfig(fullPath, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">{key}</span>
          </label>
        </div>
      )
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {key}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => updateConfig(fullPath, parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )
    }

    // String values
    const isSecret = key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')
    return (
      <div key={key} className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {key}
        </label>
        <input
          type={isSecret ? 'password' : 'text'}
          value={isSecret && typeof value === 'string' && value.includes('*') ? value : value}
          onChange={(e) => updateConfig(fullPath, e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={isSecret ? '••••••••' : ''}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* 环境和租户选择器 */}
      <div className="lg:col-span-4 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">🌍 环境和租户</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              环境
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as 'development' | 'staging' | 'production')}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="development">开发环境 (Development)</option>
              <option value="staging">测试环境 (Staging)</option>
              <option value="production">生产环境 (Production)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              租户
            </label>
            <select
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">默认租户</option>
              <option value="acme">ACME公司</option>
              <option value="tech">科技公司</option>
              <option value="startup">创业公司</option>
            </select>
          </div>
        </div>
      </div>

      {/* 配置分类导航 */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold mb-4">📋 配置分类</h3>
        {configSections.map((section) => (
          <button
            key={section.key}
            onClick={() => setSelectedSection(section.key)}
            className={`w-full text-left p-4 rounded-lg transition-colors ${
              selectedSection === section.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } shadow-sm border`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{section.icon}</span>
              <div>
                <div className="font-medium">{section.name}</div>
                <div className={`text-sm ${
                  selectedSection === section.key ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {section.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 配置详情 */}
      <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {configSections.find(s => s.key === selectedSection)?.icon}{' '}
            {configSections.find(s => s.key === selectedSection)?.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setValidationResult('✅ 配置已保存到本地存储')}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              保存配置
            </button>
            <button 
              onClick={loadConfig}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              重新加载
            </button>
            <button 
              onClick={validateConfig}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              🔍 验证配置
            </button>
            <button 
              onClick={getConfigStats}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              📊 获取统计
            </button>
          </div>
        </div>

        {/* 验证结果显示 */}
        {validationResult && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
            {validationResult}
          </div>
        )}

        {/* 统计信息显示 */}
        {configStats && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-900 mb-2">配置统计信息</h4>
            <div className="grid grid-cols-3 gap-4 text-sm text-blue-800">
              <div>
                <span className="block font-medium">总配置项</span>
                <span className="text-lg">{configStats.totalConfigs}</span>
              </div>
              <div>
                <span className="block font-medium">有效配置</span>
                <span className="text-lg">{configStats.validConfigs}</span>
              </div>
              <div>
                <span className="block font-medium">最后更新</span>
                <span className="text-xs">{configStats.lastUpdated}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
        </div>

        <div className="space-y-4">
        </div>

        <div className="space-y-4">
          {getCurrentConfig() && Object.entries(getCurrentConfig()).map(([key, value]) =>
            renderConfigValue(key, value, selectedSection)
          )}
        </div>

        {/* 配置来源信息 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">📍 配置来源优先级</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-red-700 font-medium">环境变量 (优先级: 1)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-yellow-700 font-medium">配置文件 (优先级: 2)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-green-700 font-medium">数据库配置 (优先级: 3)</span>
            </div>
            <div className="text-gray-600 text-xs mt-2">
              当前环境: <strong>{environment}</strong> | 租户: <strong>{tenant}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}