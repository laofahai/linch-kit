'use client'

export default function AdminExtensionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Extension Management</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Extension 管理功能开发中，将在后续版本中提供完整的 Extension 系统集成
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-2">Extension 系统</h2>
        <p className="text-sm text-muted-foreground">
          Extension 管理界面将集成 @linch-kit/console 的完整功能，
          包括动态加载、配置管理和运行时控制。
        </p>
      </div>
    </div>
  )
}
