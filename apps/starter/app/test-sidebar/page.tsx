"use client"

import { AppSidebarLayout } from '../../components/layout/ModernAppSidebar'

export default function TestSidebarPage() {
  return (
    <AppSidebarLayout
      title="测试 Sidebar"
      description="测试新的现代化 Sidebar 布局组件的功能"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Test Sidebar' }
      ]}
      user={{
        name: 'Test User',
        email: 'test@linchkit.com'
      }}
      showCard={true}
      padding="lg"
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            🎉 现代化 Sidebar 测试页面
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            这个页面用于测试新的现代化 Sidebar 布局组件。你可以：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>点击左侧的折叠按钮来收起/展开 Sidebar</li>
            <li>在移动设备上查看响应式侧边栏</li>
            <li>测试导航项的激活状态和徽章显示</li>
            <li>尝试悬停效果和过渡动画</li>
            <li>测试主题切换功能</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">响应式设计</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sidebar 在桌面端和移动端有不同的表现。在移动端会自动切换为抽屉式布局。
            </p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">折叠功能</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              桌面端可以通过右上角的箭头按钮来折叠/展开 Sidebar，节省空间。
            </p>
          </div>

          <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">现代化设计</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              使用渐变色、阴影和动画效果，提供现代化的用户体验。
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            💡 提示
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            这个 Sidebar 组件完全基于 @linch-kit/ui 的原子组件构建，具有高度的可定制性和可复用性。
          </p>
        </div>
      </div>
    </AppSidebarLayout>
  )
}