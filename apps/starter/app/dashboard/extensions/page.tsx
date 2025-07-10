'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/server'
import { Badge } from '@linch-kit/ui/server'
import { Alert, AlertDescription } from '@linch-kit/ui/server'
// 使用客户端导出版本
import { extensionManager } from '@linch-kit/core/client'

import { ConsoleIntegrationStatus } from '@/components/console-integration'

// 临时本地类型定义，避免构建错误
interface ExtensionInstance {
  name: string
  metadata: {
    id: string
    displayName: string
    description: string
    version: string
    category: string
    capabilities: {
      hasSchema: boolean
      hasAPI: boolean
      hasUI: boolean
      hasHooks: boolean
    }
    permissions: string[]
  }
  initialized: boolean
  running: boolean
}

interface ExtensionInfo {
  name: string
  instance: ExtensionInstance
  status: string
  error?: Error
}

export default function ExtensionsPage() {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({})
  const [operationResults, setOperationResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({})

  const refreshExtensions = async () => {
    setLoading(true)
    try {
      const allExtensions = extensionManager.getAllExtensions()
      const extensionInfos: ExtensionInfo[] = allExtensions.map(extension => {
        // 将Extension转换为ExtensionInstance格式
        const instance: ExtensionInstance = {
          name: extension.metadata.id,
          metadata: {
            id: extension.metadata.id,
            displayName: extension.metadata.displayName,
            description: extension.metadata.description || '',
            version: extension.metadata.version,
            category: extension.metadata.category || 'general',
            capabilities: extension.metadata.capabilities,
            permissions: extension.metadata.permissions,
          },
          initialized: true, // 已注册的Extension视为已初始化
          running: true, // 简化的状态管理
        }

        return {
          name: extension.metadata.id,
          instance,
          status: 'loaded', // 简化的状态，实际状态需要更复杂的状态管理
        }
      })
      setExtensions(extensionInfos)
    } catch (error) {
      console.error('Failed to refresh extensions:', error)
      // 如果获取失败，使用备用模拟数据
      const mockExtensions: ExtensionInfo[] = [
        {
          name: 'console',
          instance: {
            name: 'console',
            metadata: {
              id: '@linch-kit/console',
              displayName: 'Console Management',
              description: '企业级管理控制台扩展',
              version: '1.0.0',
              category: 'management',
              capabilities: {
                hasSchema: true,
                hasAPI: true,
                hasUI: true,
                hasHooks: true,
              },
              permissions: ['admin', 'read', 'write'],
            },
            initialized: true,
            running: true,
          },
          status: 'loaded',
        },
      ]
      setExtensions(mockExtensions)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshExtensions()
  }, [])

  const handleLoadExtension = async (extensionName: string) => {
    setOperationLoading(prev => ({ ...prev, [extensionName]: true }))
    try {
      // TODO: 实现Extension加载逻辑
      const success = Math.random() > 0.3 // 模拟成功/失败
      setOperationResults(prev => ({
        ...prev,
        [extensionName]: {
          success,
          message: success ? 'Extension loaded successfully' : 'Failed to load extension',
        },
      }))
      if (success) {
        await refreshExtensions()
      }
    } catch (error) {
      setOperationResults(prev => ({
        ...prev,
        [extensionName]: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }))
    } finally {
      setOperationLoading(prev => ({ ...prev, [extensionName]: false }))
    }
  }

  const handleUnloadExtension = async (extensionName: string) => {
    setOperationLoading(prev => ({ ...prev, [extensionName]: true }))
    try {
      // TODO: 实现Extension卸载逻辑
      const success = Math.random() > 0.3 // 模拟成功/失败
      setOperationResults(prev => ({
        ...prev,
        [extensionName]: {
          success,
          message: success ? 'Extension unloaded successfully' : 'Failed to unload extension',
        },
      }))
      if (success) {
        await refreshExtensions()
      }
    } catch (error) {
      setOperationResults(prev => ({
        ...prev,
        [extensionName]: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }))
    } finally {
      setOperationLoading(prev => ({ ...prev, [extensionName]: false }))
    }
  }

  const handleReloadExtension = async (extensionName: string) => {
    setOperationLoading(prev => ({ ...prev, [extensionName]: true }))
    try {
      // TODO: 实现Extension重载逻辑
      const success = Math.random() > 0.3 // 模拟成功/失败
      setOperationResults(prev => ({
        ...prev,
        [extensionName]: {
          success,
          message: success ? 'Extension reloaded successfully' : 'Failed to reload extension',
        },
      }))
      if (success) {
        await refreshExtensions()
      }
    } catch (error) {
      setOperationResults(prev => ({
        ...prev,
        [extensionName]: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }))
    } finally {
      setOperationLoading(prev => ({ ...prev, [extensionName]: false }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'loaded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Extension Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">管理和监控LinchKit Extension系统</p>
        </div>
        <Button onClick={refreshExtensions} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Console 集成状态 */}
      <ConsoleIntegrationStatus />

      {/* 测试区域 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Extension测试</CardTitle>
          <CardDescription>测试Extension系统的基本功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => handleLoadExtension('blog-extension')}
                disabled={operationLoading['blog-extension']}
              >
                {operationLoading['blog-extension'] ? 'Loading...' : 'Load Blog Extension'}
              </Button>
              <Button
                onClick={() => handleUnloadExtension('blog-extension')}
                disabled={operationLoading['blog-extension']}
                variant="destructive"
              >
                {operationLoading['blog-extension'] ? 'Loading...' : 'Unload Blog Extension'}
              </Button>
              <Button
                onClick={() => handleReloadExtension('blog-extension')}
                disabled={operationLoading['blog-extension']}
                variant="outline"
              >
                {operationLoading['blog-extension'] ? 'Loading...' : 'Reload Blog Extension'}
              </Button>
            </div>

            {/* 操作结果显示 */}
            {operationResults['blog-extension'] && (
              <Alert
                className={
                  operationResults['blog-extension'].success ? 'border-green-500' : 'border-red-500'
                }
              >
                <AlertDescription>{operationResults['blog-extension'].message}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extension列表 */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading extensions...</p>
          </div>
        ) : extensions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">No extensions loaded</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Try loading the blog-extension to see it in action
              </p>
            </CardContent>
          </Card>
        ) : (
          extensions.map(extensionInfo => (
            <Card key={extensionInfo.name}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {extensionInfo.instance.metadata.displayName || extensionInfo.name}
                      <Badge className={getStatusColor(extensionInfo.status)}>
                        {extensionInfo.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{extensionInfo.instance.metadata.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReloadExtension(extensionInfo.name)}
                      disabled={operationLoading[extensionInfo.name]}
                    >
                      Reload
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUnloadExtension(extensionInfo.name)}
                      disabled={operationLoading[extensionInfo.name]}
                    >
                      Unload
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">基本信息</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-300">ID:</dt>
                        <dd className="font-mono">{extensionInfo.instance.metadata.id}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-300">Version:</dt>
                        <dd className="font-mono">{extensionInfo.instance.metadata.version}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-300">Category:</dt>
                        <dd>{extensionInfo.instance.metadata.category}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-300">Initialized:</dt>
                        <dd>{extensionInfo.instance.initialized ? 'Yes' : 'No'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600 dark:text-gray-300">Running:</dt>
                        <dd>{extensionInfo.instance.running ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">功能</h4>
                    <div className="flex flex-wrap gap-2">
                      {extensionInfo.instance.metadata.capabilities.hasSchema && (
                        <Badge variant="outline">Schema</Badge>
                      )}
                      {extensionInfo.instance.metadata.capabilities.hasAPI && (
                        <Badge variant="outline">API</Badge>
                      )}
                      {extensionInfo.instance.metadata.capabilities.hasUI && (
                        <Badge variant="outline">UI</Badge>
                      )}
                      {extensionInfo.instance.metadata.capabilities.hasHooks && (
                        <Badge variant="outline">Hooks</Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <h5 className="font-medium text-sm mb-1">Permissions:</h5>
                      <div className="flex flex-wrap gap-1">
                        {extensionInfo.instance.metadata.permissions.map(permission => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 操作结果显示 */}
                {operationResults[extensionInfo.name] && (
                  <Alert
                    className={`mt-4 ${operationResults[extensionInfo.name].success ? 'border-green-500' : 'border-red-500'}`}
                  >
                    <AlertDescription>
                      {operationResults[extensionInfo.name].message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
