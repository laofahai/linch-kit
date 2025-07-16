'use client'

import React, { useState } from 'react'
import {
  Play,
  Square,
  RotateCcw,
  Settings,
  MoreHorizontal,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../server/card'
import { Badge } from '../server/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../server/table'

import { Button } from './button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { LoadingOverlay } from './loading-overlay'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

/**
 * Extension 状态类型
 */
export type ExtensionStatus =
  | 'registered'
  | 'loading'
  | 'loaded'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'error'

/**
 * Extension 信息接口
 */
export interface ExtensionInfo {
  /** Extension 名称 */
  name: string
  /** 显示名称 */
  displayName: string
  /** 版本 */
  version: string
  /** 描述 */
  description?: string
  /** 作者 */
  author?: string
  /** 状态 */
  status: ExtensionStatus
  /** 是否正在运行 */
  running: boolean
  /** 注册时间 */
  registeredAt: number
  /** 最后更新时间 */
  lastUpdated: number
  /** 错误信息 */
  error?: {
    code: string
    message: string
    stack?: string
  }
  /** 权限列表 */
  permissions: string[]
  /** 能力配置 */
  capabilities: {
    hasUI?: boolean
    hasAPI?: boolean
    hasSchema?: boolean
    hasHooks?: boolean
    standalone?: boolean
  }
  /** 分类 */
  category?: string
  /** 标签 */
  tags?: string[]
}

/**
 * Extension 管理器操作接口
 */
export interface ExtensionManagerActions {
  /** 启动 Extension */
  startExtension: (name: string) => Promise<boolean>
  /** 停止 Extension */
  stopExtension: (name: string) => Promise<boolean>
  /** 重启 Extension */
  restartExtension: (name: string) => Promise<boolean>
  /** 卸载 Extension */
  unloadExtension: (name: string) => Promise<boolean>
  /** 重新加载 Extension */
  reloadExtension: (name: string) => Promise<boolean>
  /** 获取 Extension 详情 */
  getExtensionDetails: (name: string) => Promise<ExtensionInfo | null>
  /** 获取 Extension 配置 */
  getExtensionConfig: (name: string) => Promise<Record<string, unknown> | null>
  /** 更新 Extension 配置 */
  updateExtensionConfig: (name: string, config: Record<string, unknown>) => Promise<boolean>
}

/**
 * Extension 管理器组件属性
 */
export interface ExtensionManagerProps {
  /** Extension 列表 */
  extensions: ExtensionInfo[]
  /** 操作接口 */
  actions: ExtensionManagerActions
  /** 是否正在加载 */
  loading?: boolean
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 刷新回调 */
  onRefresh?: () => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 自定义样式类名 */
  className?: string
}

/**
 * Extension 状态图标组件
 */
function ExtensionStatusIcon({ status }: { status: ExtensionStatus }) {
  switch (status) {
    case 'running':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'stopped':
      return <XCircle className="h-4 w-4 text-gray-500" />
    case 'loading':
    case 'starting':
    case 'stopping':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />
    default:
      return <Package className="h-4 w-4 text-blue-500" />
  }
}

/**
 * Extension 状态标签组件
 */
function ExtensionStatusBadge({ status }: { status: ExtensionStatus }) {
  const variants: Record<ExtensionStatus, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    registered: 'outline',
    loading: 'secondary',
    loaded: 'secondary',
    starting: 'secondary',
    running: 'default',
    stopping: 'secondary',
    stopped: 'outline',
    error: 'destructive',
  }

  const labels: Record<ExtensionStatus, string> = {
    registered: 'Registered',
    loading: 'Loading',
    loaded: 'Loaded',
    starting: 'Starting',
    running: 'Running',
    stopping: 'Stopping',
    stopped: 'Stopped',
    error: 'Error',
  }

  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

/**
 * Extension 操作菜单组件
 */
function ExtensionActionMenu({
  extension,
  onAction,
}: {
  extension: ExtensionInfo
  onAction: (action: string, extensionName: string) => Promise<void>
}) {
  const canStart = ['stopped', 'loaded', 'error'].includes(extension.status)
  const canStop = ['running'].includes(extension.status)
  const canRestart = ['running'].includes(extension.status)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canStart && (
          <DropdownMenuItem onClick={() => onAction('start', extension.name)}>
            <Play className="mr-2 h-4 w-4" />
            Start
          </DropdownMenuItem>
        )}
        {canStop && (
          <DropdownMenuItem onClick={() => onAction('stop', extension.name)}>
            <Square className="mr-2 h-4 w-4" />
            Stop
          </DropdownMenuItem>
        )}
        {canRestart && (
          <DropdownMenuItem onClick={() => onAction('restart', extension.name)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onAction('reload', extension.name)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reload
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('configure', extension.name)}>
          <Settings className="mr-2 h-4 w-4" />
          Configure
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onAction('unload', extension.name)}
          className="text-destructive"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Unload
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Extension 详情对话框组件
 */
function ExtensionDetailsDialog({
  extension,
  open,
  onOpenChange,
}: {
  extension: ExtensionInfo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!extension) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExtensionStatusIcon status={extension.status} />
            {extension.displayName}
          </DialogTitle>
          <DialogDescription>{extension.description || 'No description'}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList>
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            {extension.error && <TabsTrigger value="error">Error Info</TabsTrigger>}
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Version</h4>
                <p className="text-sm text-muted-foreground">{extension.version}</p>
              </div>
              <div>
                <h4 className="font-medium">Author</h4>
                <p className="text-sm text-muted-foreground">{extension.author || 'Unknown'}</p>
              </div>
              <div>
                <h4 className="font-medium">Category</h4>
                <p className="text-sm text-muted-foreground">{extension.category || 'Uncategorized'}</p>
              </div>
              <div>
                <h4 className="font-medium">Status</h4>
                <ExtensionStatusBadge status={extension.status} />
              </div>
            </div>

            {extension.tags && extension.tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex gap-2 flex-wrap">
                  {extension.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-4">
            <div className="space-y-2">
              {Object.entries(extension.capabilities).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{key}</span>
                  <Badge variant={value ? 'default' : 'outline'}>{value ? 'Yes' : 'No'}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div className="space-y-2">
              {extension.permissions.map(permission => (
                <div key={permission} className="flex items-center gap-2">
                  <Badge variant="outline">{permission}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          {extension.error && (
            <TabsContent value="error" className="space-y-4">
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium">Error Code</h4>
                  <p className="text-sm text-muted-foreground">{extension.error.code}</p>
                </div>
                <div>
                  <h4 className="font-medium">Error Message</h4>
                  <p className="text-sm text-muted-foreground">{extension.error.message}</p>
                </div>
                {extension.error.stack && (
                  <div>
                    <h4 className="font-medium">Stack Trace</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {extension.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Extension 管理器主组件
 */
export function ExtensionManager({
  extensions,
  actions,
  loading = false,
  showDetails = true,
  onRefresh,
  onError,
  className = '',
}: ExtensionManagerProps) {
  const [selectedExtension, setSelectedExtension] = useState<ExtensionInfo | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [_actionLoading, setActionLoading] = useState<string | null>(null)

  // 处理 Extension 操作
  const handleAction = async (action: string, extensionName: string) => {
    try {
      setActionLoading(`${action}-${extensionName}`)

      let result = false
      switch (action) {
        case 'start':
          result = await actions.startExtension(extensionName)
          break
        case 'stop':
          result = await actions.stopExtension(extensionName)
          break
        case 'restart':
          result = await actions.restartExtension(extensionName)
          break
        case 'reload':
          result = await actions.reloadExtension(extensionName)
          break
        case 'unload':
          result = await actions.unloadExtension(extensionName)
          break
        case 'configure':
          // 配置操作暂时跳过
          return
        default:
          throw new Error(`Unknown action: ${action}`)
      }

      if (!result) {
        throw new Error(`Operation failed: ${action}`)
      }

      // 刷新列表
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      if (onError) {
        onError(error as Error)
      }
    } finally {
      setActionLoading(null)
    }
  }

  // 查看详情
  const handleViewDetails = async (extension: ExtensionInfo) => {
    try {
      const details = await actions.getExtensionDetails(extension.name)
      if (details) {
        setSelectedExtension(details)
        setDetailsOpen(true)
      }
    } catch (error) {
      if (onError) {
        onError(error as Error)
      }
    }
  }

  const runningCount = extensions.filter(ext => ext.status === 'running').length
  const errorCount = extensions.filter(ext => ext.status === 'error').length

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Extensions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extensions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{runningCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Extension 列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Extension List</CardTitle>
              <CardDescription>Manage all extensions in the system</CardDescription>
            </div>
            <Button onClick={onRefresh} disabled={loading}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {loading && <LoadingOverlay isVisible={loading} />}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extensions.map(extension => (
                  <TableRow key={extension.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ExtensionStatusIcon status={extension.status} />
                        <div>
                          <div className="font-medium">{extension.displayName}</div>
                          <div className="text-sm text-muted-foreground">{extension.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{extension.version}</TableCell>
                    <TableCell>
                      <ExtensionStatusBadge status={extension.status} />
                    </TableCell>
                    <TableCell>{extension.category || '-'}</TableCell>
                    <TableCell>{new Date(extension.lastUpdated).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {showDetails && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(extension)}
                          >
                            Details
                          </Button>
                        )}
                        <ExtensionActionMenu extension={extension} onAction={handleAction} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {extensions.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">No Extensions</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extension 详情对话框 */}
      <ExtensionDetailsDialog
        extension={selectedExtension}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}
