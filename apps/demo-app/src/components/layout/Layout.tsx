import { ReactNode } from 'react'

import { TRPCProvider } from '../providers/TRPCProvider'

import { Navigation } from './Navigation'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <TRPCProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">LK</span>
              </div>
              <span className="text-gray-600 text-sm">
                LinchKit AI-First 全栈开发框架演示
              </span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>🚀 Schema驱动</span>
              <span>🔒 类型安全</span>
              <span>🧩 插件化</span>
              <span>🌍 国际化</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center text-xs text-gray-400">
              本演示展示了LinchKit框架的核心功能和企业级特性 • 
              所有功能均可交互验证 • 
              <span className="text-blue-600">AI-First设计理念</span>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </TRPCProvider>
  )
}