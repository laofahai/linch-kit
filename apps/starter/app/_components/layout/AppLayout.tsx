'use client'

import { useState } from 'react'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { cn } from '@linch-kit/ui/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* 主内容区域 */}
      <div className="lg:pl-64">
        {/* 顶部导航栏 */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* 页面内容 */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
