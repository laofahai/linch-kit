'use client'

import { useSession } from 'next-auth/react'
import { useAuthContext } from '../AuthProvider'

/**
 * 自定义hook，用于获取当前的用户会话信息
 * 相比next-auth的useSession，这个hook提供了更具体的类型和更便捷的访问方式
 */
export function useAuth() {
  const { user, isLoading, isAuthenticated, signOut, checkPermission } = useAuthContext()

  return {
    user,
    isLoading,
    isAuthenticated,
    signOut,
    checkPermission,
  }
}

/**
 * 获取原始的next-auth会话
 * 当需要访问原始会话数据时使用
 */
export function useRawSession() {
  return useSession()
}
