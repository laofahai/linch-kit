'use client'

import { type Tab } from '@/lib/stores/tabs-store'
import { cn } from '@/lib/utils'
import { useEffect, lazy, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Card, CardContent, CardHeader, CardTitle } from '@linch-kit/ui'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@linch-kit/ui'

// 懒加载页面组件
const DashboardPage = lazy(() => import('../../app/dashboard/page'))
const UsersPage = lazy(() => import('../../app/dashboard/users/page'))
const SettingsPage = lazy(() => import('../../app/dashboard/settings/page'))
const TrpcDemoPage = lazy(() => import('../../app/trpc-demo/page'))

// 页面路由映射
const pageRoutes: Record<string, React.LazyExoticComponent<React.ComponentType> | null> = {
  '/dashboard': DashboardPage,
  '/dashboard/users': UsersPage,
  '/dashboard/settings': SettingsPage,
  '/trpc-demo': TrpcDemoPage,
  '/dashboard/analytics': null, // 待实现
  '/dashboard/analytics/traffic': null, // 待实现
  '/dashboard/analytics/conversions': null, // 待实现
  '/dashboard/settings/general': null, // 待实现
  '/dashboard/settings/security': null, // 待实现
  '/dashboard/settings/billing': null, // 待实现
}

interface TabContentProps {
  tab: Tab
  isActive: boolean
}

// 错误边界组件
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900 dark:text-red-100">页面加载错误</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || '加载页面时发生了未知错误'}
          </p>
          <Button onClick={resetErrorBoundary} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            重试
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// 加载中组件
function LoadingFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">正在加载页面...</p>
      </div>
    </div>
  )
}

// 页面未找到组件
function NotFoundFallback({ path }: { path: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-muted-foreground">页面开发中</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            路径 <code className="bg-muted px-2 py-1 rounded text-xs">{path}</code> 对应的页面正在开发中
          </p>
          <p className="text-xs text-muted-foreground">
            该功能将在后续版本中提供
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function TabContent({ tab, isActive }: TabContentProps) {
  // 当标签页变为活动状态时，可以执行一些操作
  useEffect(() => {
    if (isActive) {
      // 更新浏览器标题
      document.title = `${tab.title} - LinchKit`
      
      // 更新浏览器历史记录（不触发页面刷新）
      if (window.history.pushState) {
        window.history.pushState(null, '', tab.path)
      }
    }
  }, [isActive, tab.title, tab.path])

  // 获取对应的页面组件
  const PageComponent = pageRoutes[tab.path]
  
  return (
    <div
      className={cn(
        'h-full w-full overflow-auto',
        isActive ? 'block' : 'hidden'
      )}
      data-tab-id={tab.id}
      data-tab-path={tab.path}
    >
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[tab.path]} // 当路径变化时重置错误边界
      >
        <div className="h-full w-full">
          {PageComponent ? (
            <Suspense fallback={<LoadingFallback />}>
              <div className="p-6 h-full">
                <PageComponent />
              </div>
            </Suspense>
          ) : (
            <div className="p-6 h-full">
              <NotFoundFallback path={tab.path} />
            </div>
          )}
        </div>
      </ErrorBoundary>
    </div>
  )
}