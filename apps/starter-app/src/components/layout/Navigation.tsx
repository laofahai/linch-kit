'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigationItems = [
  {
    name: '首页',
    href: '/',
    icon: '🏠',
    description: '功能概览'
  },
  {
    name: 'Schema',
    href: '/schema',
    icon: '🏗️',
    description: 'Schema驱动开发'
  },
  {
    name: '认证',
    href: '/auth',
    icon: '🔐',
    description: '认证权限系统'
  },
  {
    name: 'tRPC API',
    href: '/trpc',
    icon: '🚀',
    description: 'API层演示'
  },
  {
    name: '配置',
    href: '/config',
    icon: '⚙️',
    description: '配置管理'
  },
  {
    name: '插件',
    href: '/plugins',
    icon: '🧩',
    description: '插件系统'
  },
  {
    name: '国际化',
    href: '/i18n',
    icon: '🌍',
    description: '多语言支持'
  }
]

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LK</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">LinchKit</h1>
              <p className="text-xs text-gray-500 -mt-1">功能验证演示</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={item.description}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-2 space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active page indicator (breadcrumb style) */}
      {pathname !== '/' && (
        <div className="bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                首页
              </Link>
              <span>›</span>
              <span className="text-gray-900 font-medium">
                {navigationItems.find(item => item.href === pathname)?.name || '页面'}
              </span>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}