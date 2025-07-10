'use client'

import { ConsoleIntegrationStatus } from '@/components/console-integration'

/**
 * Extension 管理页面
 * 简洁的 Extension 管理界面
 */
export default function ExtensionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Extension 管理</h1>
        <p className="text-gray-600 dark:text-gray-400">管理和配置已安装的 Extension</p>
      </div>

      <ConsoleIntegrationStatus />
    </div>
  )
}
