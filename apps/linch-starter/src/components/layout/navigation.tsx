'use client'

import Link from 'next/link'

import { useAuth } from '@/contexts/auth-context'

/**
 * 导航组件
 * @description 应用顶部导航栏，显示用户状态和导航链接
 * @since 2025-06-20
 */
export function Navigation() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🚀 Linch Starter
              </h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                AI-First
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Home
            </Link>

            {/* Authenticated User Links */}
            {isAuthenticated && (
              <>
                <Link 
                  href="/users" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Users
                </Link>
                <Link 
                  href="/products" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Products
                </Link>
              </>
            )}

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* Guest User Links */
              <div className="flex items-center space-x-3">
                <Link 
                  href="/auth/login" 
                  className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

/**
 * 移动端导航组件
 * @description 响应式移动端导航菜单
 * @since 2025-06-20
 */
export function MobileNavigation() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <div className="sm:hidden">
      <div className="pt-2 pb-3 space-y-1">
        <Link
          href="/"
          className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
        >
          Home
        </Link>

        {isAuthenticated && (
          <>
            <Link
              href="/users"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
            >
              Users
            </Link>
            <Link
              href="/products"
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900"
            >
              Products
            </Link>
          </>
        )}
      </div>

      {/* User Section */}
      {isAuthenticated && user ? (
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">{user.name}</div>
              <div className="text-sm font-medium text-gray-500">{user.email}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <button
              onClick={logout}
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 w-full text-left"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="space-y-1">
            <Link
              href="/auth/login"
              className="block px-4 py-2 text-base font-medium text-blue-600 hover:text-blue-900"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="block px-4 py-2 text-base font-medium text-blue-600 hover:text-blue-900"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
