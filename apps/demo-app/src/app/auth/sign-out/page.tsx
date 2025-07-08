'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'

function SignOutContent() {
  const { signOut, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut()
        // 延迟跳转，让用户看到注销成功的消息
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } catch (error) {
        console.error('注销失败:', error)
      }
    }

    performSignOut()
  }, [signOut, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">正在注销...</h2>

          {isLoading ? (
            <div className="mt-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">正在安全注销您的账户</p>
            </div>
          ) : (
            <div className="mt-8">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <p className="text-gray-600">注销成功！正在跳转到首页...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SignOutPage() {
  return (
    <AuthProvider>
      <SignOutContent />
    </AuthProvider>
  )
}
