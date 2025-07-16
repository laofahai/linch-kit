/**
 * 动态扩展客户端组件
 * 智能处理扩展加载和渲染
 */

'use client'

import { Logger, clientExtensionManager } from '@linch-kit/core/client'
import type { ClientExtensionRegistration } from '@linch-kit/core/client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import type { ComponentType } from 'react'

import type { ExtensionUIComponentProps } from '../../../lib/extension-ui-registry'
import { extensionUIRegistry } from '../../../lib/extension-ui-registry'
import { initializeExtensions } from '../../../lib/extensions-loader'

// 声明 window 对象类型
declare global {
  interface Window {
    location: Location
  }
}

interface DynamicExtensionClientProps {
  extensionName: string
  subPath: string
  fullPath: string
}

interface ExtensionState {
  loading: boolean
  loaded: boolean
  error: string | null
  registration: ClientExtensionRegistration | null
}

// 动态获取扩展配置
const getExtensionConfig = (extensionName: string) => {
  // 尝试从扩展管理器获取注册信息
  const registration = clientExtensionManager.getRegistration(extensionName)
  
  if (registration?.metadata) {
    return {
      displayName: registration.metadata.displayName,
      icon: registration.metadata.icon ?? '📦',
      description: registration.metadata.description ?? 'Extension',
      color: registration.metadata.color ?? 'gray'
    }
  }
  
  // 默认配置
  return {
    displayName: extensionName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    icon: '📦',
    description: `${extensionName} extension`,
    color: 'gray'
  }
}

export function DynamicExtensionClient({ 
  extensionName, 
  subPath, 
  fullPath 
}: DynamicExtensionClientProps) {
  const [state, setState] = useState<ExtensionState>({
    loading: true,
    loaded: false,
    error: null,
    registration: null
  })
  
  const router = useRouter()
  const [config, setConfig] = useState(() => getExtensionConfig(extensionName))
  
  // 扩展已加载 - 智能获取组件（带重试机制）
  const [ExtensionComponent, setExtensionComponent] = useState<ComponentType<ExtensionUIComponentProps> | null>(null)

  useEffect(() => {
    const loadExtension = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        Logger.info(`Loading extension: ${extensionName}`)

        // 检查扩展是否已注册
        let registration = clientExtensionManager.getRegistration(extensionName)
        
        // 强制等待初始化完成（特别是在页面刷新后）
        if (!registration || !extensionUIRegistry.getDefaultComponent(extensionName)) {
          Logger.info(`Extension ${extensionName} not ready, forcing initialization...`)
          
          // 等待一短时间，让ExtensionsInitializer有机会执行
          await new Promise(resolve => window.setTimeout(resolve, 300))
          
          // 强制重新初始化
          await initializeExtensions(true)
          
          // 再次检查
          registration = clientExtensionManager.getRegistration(extensionName)
        }
        
        if (!registration) {
          Logger.warn(`Extension ${extensionName} not registered after initialization attempts`)
          setState({
            loading: false,
            loaded: false,
            error: null,
            registration: null
          })
          return
        }
        
        // 更新配置信息 - registration.metadata 在 ClientExtensionRegistration 中总是存在
        setConfig({
          displayName: registration.metadata.displayName,
          icon: registration.metadata.icon ?? '📦',
          description: registration.metadata.description ?? 'Extension',
          color: registration.metadata.color ?? 'gray'
        })

        // 启动扩展
        if (registration.status !== 'running') {
          Logger.info(`Starting extension: ${extensionName}`)
          const startResult = await clientExtensionManager.start(extensionName)
          
          if (!startResult.success) {
            throw new Error(startResult.error?.message ?? 'Failed to start extension')
          }
          
          registration = clientExtensionManager.getRegistration(extensionName)
          if (!registration) {
            throw new Error('Extension registration lost after start')
          }
        }

        setState({
          loading: false,
          loaded: true,
          error: null,
          registration
        })
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        Logger.error(`Failed to load extension ${extensionName}:`, error instanceof Error ? error : new Error(String(error)))
        
        setState({
          loading: false,
          loaded: false,
          error: errorMessage,
          registration: null
        })
      }
    }

    loadExtension().catch(error => { Logger.error('Extension loading error:', error) })
  }, [extensionName, subPath])
  
  useEffect(() => {
    if (state.loaded && state.registration) {
      const getComponent = () => {
        const component = extensionUIRegistry.getDefaultComponent(extensionName)
        if (component) {
          Logger.info(`Found UI component for ${extensionName}`)
          setExtensionComponent(() => component)
        } else {
          Logger.warn(`UI component for ${extensionName} not found, will show placeholder`)
          // 延迟重试获取组件
          window.setTimeout(() => {
            const retryComponent = extensionUIRegistry.getDefaultComponent(extensionName)
            if (retryComponent) {
              Logger.info(`Extension ${extensionName} component found on retry`)
              setExtensionComponent(() => retryComponent)
            }
          }, 100)
        }
      }
      getComponent()
    }
  }, [state.loaded, state.registration, extensionName])

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">{config.icon}</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading {config.displayName}...
          </p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Extension Error
            </h2>
            <p className="text-gray-600 mb-4">
              Failed to load {config.displayName}
            </p>
            <p className="text-red-600 text-sm mb-6">{state.error}</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => { 
                  location.reload()
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button 
                onClick={() => { router.push('/') }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 扩展未安装或正在开发中
  if (!state.loaded || !state.registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className={`bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 text-white p-12`}>
                <div className="flex items-center gap-6">
                  <div className="text-6xl drop-shadow-lg">{config.icon}</div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">
                      {config.displayName}
                    </h1>
                    <p className="text-lg opacity-90">
                      {config.description}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚧</span>
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1">
                        Extension Under Development
                      </h3>
                      <p className="text-amber-700 text-sm">
                        This extension is currently being developed. The dynamic routing system is working perfectly!
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-500">🔗</span> Route Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-1">
                      <div>Extension: <span className="text-blue-600 font-semibold">{extensionName}</span></div>
                      <div>Sub-path: <span className="text-blue-600">{subPath || '(root)'}</span></div>
                      <div>Full URL: <span className="text-blue-600">{fullPath}</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-green-500">📱</span> Registered Extensions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(clientExtensionManager.getExtensions().values()).map((reg) => {
                        const extConfig = {
                          displayName: reg.metadata.displayName,
                          icon: reg.metadata.icon ?? '📦',
                          description: reg.metadata.description ?? 'Extension',
                          color: reg.metadata.color ?? 'gray'
                        }
                        return (
                          <button
                            key={reg.id}
                            onClick={() => { router.push(`/${reg.metadata.name}`) }}
                            className={`group relative p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                              reg.metadata.name === extensionName 
                                ? 'border-blue-500 bg-blue-50 shadow-lg' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
                            }`}
                          >
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                              {extConfig.icon}
                            </div>
                            <div className="font-semibold text-gray-900 mb-1">
                              {extConfig.displayName}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">/{reg.metadata.name}</div>
                            {reg.metadata.name === extensionName && (
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Current
                                </span>
                              </div>
                            )}
                          </button>
                        )
                      })}
                      {clientExtensionManager.getExtensions().size === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <p>No extensions registered yet.</p>
                          <p className="text-sm mt-1">Extensions will appear here once they are installed.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (ExtensionComponent) {
    // 渲染实际的扩展组件
    return (
      <div className="min-h-screen">
        <ExtensionComponent 
          extensionName={extensionName} 
          subPath={subPath}
          fullPath={fullPath}
          registration={state.registration}
        />
      </div>
    )
  }
  
  // 如果没有找到UI组件，显示占位符
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b">
              <div className="text-5xl">{config.icon}</div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {config.displayName}
                </h1>
                <p className="text-gray-600 mt-1">{config.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                  Running
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span>✅</span> Extension Status
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Status:</span>
                    <span className="font-medium text-green-800">{state.registration.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Version:</span>
                    <span className="font-medium text-green-800">{state.registration.metadata.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">ID:</span>
                    <span className="font-medium text-green-800 font-mono text-xs">{state.registration.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <span>🔗</span> Route Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Extension:</span>
                    <span className="font-medium text-blue-800">{extensionName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Sub-path:</span>
                    <span className="font-medium text-blue-800">{subPath || '(root)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Full URL:</span>
                    <span className="font-medium text-blue-800 font-mono text-xs">{fullPath}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-gray-600 text-lg">
                Extension is running but no UI components are registered.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                The extension developer needs to register UI components using the extensionUIRegistry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}