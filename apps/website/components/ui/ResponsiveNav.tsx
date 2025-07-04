'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  children?: NavItem[]
}

interface ResponsiveNavProps {
  items: NavItem[]
  brand?: React.ReactNode
  className?: string
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  items,
  brand,
  className = ''
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const router = useRouter()

  // 关闭移动菜单当路由变化时
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false)
      setActiveDropdown(null)
    }

    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
    }

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleDropdown = (label: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setActiveDropdown(activeDropdown === label ? null : label)
  }

  const isActiveLink = (href: string) => {
    return router.asPath === href || router.asPath.startsWith(href + '/')
  }

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const hasChildren = item.children && item.children.length > 0
    const isActive = isActiveLink(item.href)
    const isDropdownOpen = activeDropdown === item.label

    if (hasChildren) {
      return (
        <div key={item.label} className={`relative ${isMobile ? 'w-full' : ''}`}>
          <button
            onClick={(e) => toggleDropdown(item.label, e)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive 
                ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700'
            } ${isMobile ? 'w-full justify-between' : ''}`}
          >
            <div className="flex items-center space-x-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 下拉菜单 */}
          {isDropdownOpen && (
            <div className={`${
              isMobile 
                ? 'mt-2 ml-4 space-y-1' 
                : 'absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50'
            }`}>
              {item.children?.map((child) => (
                <a
                  key={child.href}
                  href={child.href}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm transition-colors ${
                    isActiveLink(child.href)
                      ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700'
                  } ${isMobile ? 'rounded-md' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  {child.icon}
                  <span>{child.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <a
        key={item.href}
        href={item.href}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive 
            ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' 
            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-700'
        }`}
      >
        {item.icon}
        <span>{item.label}</span>
      </a>
    )
  }

  return (
    <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 品牌logo */}
          <div className="flex items-center">
            {brand && (
              <div className="flex-shrink-0">
                {brand}
              </div>
            )}
          </div>

          {/* 桌面端导航 */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {items.map(item => renderNavItem(item))}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMobileMenuOpen}
              aria-label="主菜单"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            {items.map(item => renderNavItem(item, true))}
          </div>
        </div>
      )}
    </nav>
  )
}

export default ResponsiveNav