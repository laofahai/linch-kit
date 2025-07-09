'use client'

import { ExtensionManagement } from '@linch-kit/console/client'
import { extensionManager } from '@linch-kit/core'

export default function AdminExtensionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Extension Management
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          管理系统中的所有Extensions - 完整的生命周期管理
        </p>
      </div>

      <ExtensionManagement 
        extensionManager={extensionManager}
        permissions={['extension:read', 'extension:write', 'extension:manage']}
      />
    </div>
  )
}