/**
 * Extension 管理页面
 *
 * 提供完整的 Extension 管理功能，包括：
 * - Extension 列表展示
 * - 启用/禁用 Extension
 * - 安装/卸载 Extension
 * - Extension 详情查看
 * - 状态监控
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@linch-kit/ui/server'
import { Button } from '@linch-kit/ui/client'
import { Badge } from '@linch-kit/ui/server'
import { Input } from '@linch-kit/ui/client'
import { Alert, AlertDescription } from '@linch-kit/ui/server'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@linch-kit/ui/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@linch-kit/ui/client'
import {
  Puzzle,
  Plus,
  Search,
  Settings,
  Download,
  Power,
  PowerOff,
  Info,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Package,
  Zap,
  SortAsc,
  SortDesc,
} from 'lucide-react'

// import { DataTable } from '../components/shared/DataTable'
import { useConsoleTranslation } from '../i18n'
import { useConsolePermission } from '../providers/ConsoleProvider'
import { extensionLoader } from '../core/extension-loader'
import type { ConsoleExtensionState } from '../core/extension-loader'

/**
 * Extension 管理主页面
 */
export function ExtensionManager() {
  const t = useConsoleTranslation()
  const canManageExtensions = useConsolePermission('extension:manage')
  const canInstallExtensions = useConsolePermission('extension:install')
  const canViewExtensions = useConsolePermission('extension:view')

  // 状态管理
  const [extensions, setExtensions] = useState<ConsoleExtensionState[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'error' | 'stopped'>('all')
  const [sortBy, _setSortBy] = useState<'name' | 'status' | 'startedAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedExtension, setSelectedExtension] = useState<ConsoleExtensionState | null>(null)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [availableExtensions, _setAvailableExtensions] = useState<string[]>([])

  // 检查权限
  if (!canViewExtensions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('error.permission.denied')}
          </h2>
          <p className="text-gray-600">{t('error.permission.description')}</p>
        </div>
      </div>
    )
  }

  // 加载扩展列表
  const loadExtensions = async () => {
    setLoading(true)
    try {
      const extensionsList = extensionLoader.getAllExtensionStates()
      setExtensions(extensionsList)
    } catch (error) {
      console.error('Failed to load extensions:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化
  useEffect(() => {
    loadExtensions()

    // 监听扩展状态变化
    const handleStatusUpdate = ({ state }: { state: ConsoleExtensionState }) => {
      setExtensions(prev => {
        const index = prev.findIndex(ext => ext.name === state.name)
        if (index >= 0) {
          const newExtensions = [...prev]
          newExtensions[index] = state
          return newExtensions
        }
        return [...prev, state]
      })
    }

    extensionLoader.on('statusUpdated', handleStatusUpdate)
    return () => {
      extensionLoader.off('statusUpdated', handleStatusUpdate)
    }
  }, [])

  // 过滤和排序扩展
  const filteredAndSortedExtensions = extensions
    .filter(ext => {
      const matchesSearch = ext.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || ext.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'startedAt':
          comparison = (a.startedAt || 0) - (b.startedAt || 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  // 启用/禁用扩展
  const toggleExtension = async (extensionName: string, currentStatus: string) => {
    if (!canManageExtensions) return

    try {
      if (currentStatus === 'running') {
        await extensionLoader.unloadExtension(extensionName)
      } else {
        await extensionLoader.loadExtension(extensionName)
      }
      await loadExtensions()
    } catch (error) {
      console.error(`Failed to toggle extension ${extensionName}:`, error)
    }
  }

  // 重新加载扩展
  const reloadExtension = async (extensionName: string) => {
    if (!canManageExtensions) return

    try {
      await extensionLoader.reloadExtension(extensionName)
      await loadExtensions()
    } catch (error) {
      console.error(`Failed to reload extension ${extensionName}:`, error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('extension.manager.title')}</h1>
          <p className="text-muted-foreground">{t('extension.manager.description')}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadExtensions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('extension.manager.refresh')}
          </Button>

          {canInstallExtensions && (
            <Button variant="outline" size="sm" onClick={() => setShowInstallDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('extension.manager.install')}
            </Button>
          )}

          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t('extension.manager.settings')}
          </Button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('extension.manager.search')}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">{t('extension.manager.filter.all')}</option>
            <option value="running">{t('extension.manager.filter.running')}</option>
            <option value="error">{t('extension.manager.filter.error')}</option>
            <option value="stopped">{t('extension.manager.filter.stopped')}</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('extension.manager.stats.total')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extensions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('extension.manager.stats.loaded')}
            </CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {extensions.filter(ext => ext.status === 'running').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('extension.manager.stats.failed')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {extensions.filter(ext => ext.status === 'error').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('extension.manager.stats.stopped')}
            </CardTitle>
            <PowerOff className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {extensions.filter(ext => ext.status === 'stopped').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 扩展列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('extension.manager.list.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ExtensionList
              extensions={filteredAndSortedExtensions}
              onToggle={toggleExtension}
              onReload={reloadExtension}
              onViewDetails={setSelectedExtension}
              canManage={canManageExtensions}
            />
          )}
        </CardContent>
      </Card>

      {/* 扩展详情对话框 */}
      {selectedExtension && (
        <ExtensionDetailsDialog
          extension={selectedExtension}
          open={!!selectedExtension}
          onClose={() => setSelectedExtension(null)}
        />
      )}

      {/* 安装扩展对话框 */}
      {showInstallDialog && (
        <InstallExtensionDialog
          open={showInstallDialog}
          onClose={() => setShowInstallDialog(false)}
          availableExtensions={availableExtensions}
          onInstall={async extensionName => {
            await extensionLoader.loadExtension(extensionName)
            await loadExtensions()
            setShowInstallDialog(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * 扩展列表组件
 */
interface ExtensionListProps {
  extensions: ConsoleExtensionState[]
  onToggle: (name: string, status: string) => void
  onReload: (name: string) => void
  onViewDetails: (extension: ConsoleExtensionState) => void
  canManage: boolean
}

function ExtensionList({
  extensions,
  onToggle,
  onReload,
  onViewDetails,
  canManage,
}: ExtensionListProps) {
  const t = useConsoleTranslation()

  if (extensions.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('extension.manager.empty.title')}</h3>
        <p className="text-muted-foreground">{t('extension.manager.empty.description')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {extensions.map(extension => {
        const StatusIcon = getStatusIcon(extension.status)

        return (
          <div
            key={extension.name}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Puzzle className="h-5 w-5 text-primary" />
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{extension.name}</h3>
                  <Badge
                    variant={extension.status === 'running' ? 'default' : 'secondary'}
                    className={getStatusColor(extension.status)}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {t(`extension.manager.status.${extension.status}`)}
                  </Badge>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <span>
                    {t('extension.manager.routes')}: {extension.routeCount}
                  </span>
                  <span>
                    {t('extension.manager.components')}: {extension.componentCount}
                  </span>
                  {extension.startedAt && (
                    <span>
                      {t('extension.manager.startedAt')}:{' '}
                      {new Date(extension.startedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {extension.error && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {extension.error.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(extension)}>
                <Info className="h-4 w-4" />
              </Button>

              {canManage && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReload(extension.name)}
                    disabled={extension.status === 'loading'}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${extension.status === 'loading' ? 'animate-spin' : ''}`}
                    />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggle(extension.name, extension.status)}
                    disabled={extension.status === 'loading'}
                  >
                    {extension.status === 'running' ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * 扩展详情对话框
 */
interface ExtensionDetailsDialogProps {
  extension: ConsoleExtensionState
  open: boolean
  onClose: () => void
}

function ExtensionDetailsDialog({ extension, open, onClose }: ExtensionDetailsDialogProps) {
  const t = useConsoleTranslation()
  const StatusIcon = getStatusIcon(extension.status)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Puzzle className="h-5 w-5" />
            <span>{extension.name}</span>
            <Badge
              variant={extension.status === 'running' ? 'default' : 'secondary'}
              className={getStatusColor(extension.status)}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {t(`extension.manager.status.${extension.status}`)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t('extension.details.overview')}</TabsTrigger>
            <TabsTrigger value="resources">{t('extension.details.resources')}</TabsTrigger>
            <TabsTrigger value="logs">{t('extension.details.logs')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-2">{t('extension.details.basic')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('extension.details.name')}:</span>
                    <span className="font-medium">{extension.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('extension.details.status')}:</span>
                    <Badge variant={extension.status === 'running' ? 'default' : 'secondary'}>
                      {t(`extension.manager.status.${extension.status}`)}
                    </Badge>
                  </div>
                  {extension.startedAt && (
                    <div className="flex justify-between">
                      <span>{t('extension.details.startedAt')}:</span>
                      <span>{new Date(extension.startedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {extension.error && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">{t('extension.details.error')}</h4>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{extension.error.message}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-2">{t('extension.details.resources')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('extension.manager.routes')}:</span>
                    <span className="font-medium">{extension.routeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('extension.manager.components')}:</span>
                    <span className="font-medium">{extension.componentCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {t('extension.details.logsContent.empty')}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 安装扩展对话框
 */
interface InstallExtensionDialogProps {
  open: boolean
  onClose: () => void
  availableExtensions: string[]
  onInstall: (extensionName: string) => Promise<void>
}

function InstallExtensionDialog({
  open,
  onClose,
  availableExtensions,
  onInstall,
}: InstallExtensionDialogProps) {
  const t = useConsoleTranslation()
  const [selectedExtension, setSelectedExtension] = useState('')
  const [installing, setInstalling] = useState(false)

  const handleInstall = async () => {
    if (!selectedExtension) return

    setInstalling(true)
    try {
      await onInstall(selectedExtension)
      onClose()
    } catch (error) {
      console.error('Failed to install extension:', error)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('extension.install.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('extension.install.selectExtension')}
            </label>
            <select
              value={selectedExtension}
              onChange={e => setSelectedExtension(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="">{t('extension.install.pleaseSelect')}</option>
              {availableExtensions.map(ext => (
                <option key={ext} value={ext}>
                  {ext}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleInstall} disabled={!selectedExtension || installing}>
              {installing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t('extension.install.install')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 辅助函数
function getStatusIcon(status: string) {
  switch (status) {
    case 'running':
      return CheckCircle
    case 'loading':
      return RefreshCw
    case 'error':
      return AlertTriangle
    case 'stopped':
      return PowerOff
    default:
      return Clock
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'running':
      return 'text-green-600'
    case 'loading':
      return 'text-blue-600'
    case 'error':
      return 'text-red-600'
    case 'stopped':
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
}

export default ExtensionManager
