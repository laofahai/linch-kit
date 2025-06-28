// import { ConsoleLayout } from '@linch-kit/console' // TODO: Fix server imports in console
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '管理控制台 - LinchKit',
  description: '企业级管理控制台',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold">LinchKit Console</h1>
            <p className="text-sm text-gray-600 mt-2">管理控制台</p>
          </div>
          <nav className="px-4">
            <a href="/admin/dashboard" className="block py-2 px-4 text-blue-600 bg-blue-50 rounded-md">
              Dashboard
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}