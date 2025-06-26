'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function UserProfile() {
  const { user, session, isLoading, refreshSession, validateAuth, getAuthStats } = useAuth()
  const [validationResult, setValidationResult] = useState<string>('')
  const [authStats, setAuthStats] = useState<{ sessionCount: number; lastActivity: Date | null; permissions: string[] } | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!user || !session) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">⚪</span>
          <span className="text-gray-600">未登录</span>
        </div>
        <p className="text-gray-500 text-sm mt-2">
          请先登录以查看用户信息
        </p>
      </div>
    )
  }

  const handleRefreshSession = async () => {
    try {
      await refreshSession()
    } catch (error) {
      console.error('刷新会话失败:', error)
    }
  }

  const handleValidateAuth = () => {
    const result = validateAuth()
    setValidationResult(result.isValid ? `✅ ${result.message}` : `❌ ${result.message}`)
  }

  const handleGetStats = () => {
    const stats = getAuthStats()
    setAuthStats(stats)
  }

  return (
    <div className="space-y-4">
      {/* 用户基本信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">基本信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">用户ID:</span>
            <span className="font-mono text-blue-800">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">姓名:</span>
            <span className="text-blue-800">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">邮箱:</span>
            <span className="text-blue-800">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">角色:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              user.role === 'admin' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* 会话信息 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-3">会话信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">会话ID:</span>
            <span className="font-mono text-green-800 truncate ml-2">
              {session.id.substring(0, 12)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">创建时间:</span>
            <span className="text-green-800">
              {formatDistanceToNow(session.createdAt, { 
                addSuffix: true, 
                locale: zhCN 
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">过期时间:</span>
            <span className="text-green-800">
              {formatDistanceToNow(session.expiresAt, { 
                addSuffix: true, 
                locale: zhCN 
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">状态:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              session.expiresAt > new Date() 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {session.expiresAt > new Date() ? '有效' : '已过期'}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <button
            onClick={handleRefreshSession}
            className="w-full bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
          >
            刷新会话
          </button>
          <button
            onClick={handleValidateAuth}
            className="w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
          >
            🔍 验证认证状态
          </button>
          <button
            onClick={handleGetStats}
            className="w-full bg-purple-600 text-white py-1 px-3 rounded text-sm hover:bg-purple-700"
          >
            📊 获取统计信息
          </button>
        </div>
      </div>

      {/* 验证结果显示 */}
      {validationResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">验证结果</h3>
          <p className="text-sm">{validationResult}</p>
        </div>
      )}

      {/* 统计信息显示 */}
      {authStats && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">认证统计</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">活跃会话数:</span>
              <span className="font-medium">{authStats.sessionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">最后活动:</span>
              <span className="font-medium">
                {authStats.lastActivity 
                  ? formatDistanceToNow(authStats.lastActivity, { addSuffix: true, locale: zhCN })
                  : '无'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 block mb-2">用户权限:</span>
              <div className="flex flex-wrap gap-1">
                {authStats.permissions.map((perm, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 权限信息 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-3">权限信息</h3>
        <div className="text-sm text-purple-800">
          <div className="mb-2">
            <span className="text-gray-600">当前权限:</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>基础功能访问</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <span>个人信息查看</span>
            </div>
            {user.role === 'admin' && (
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>管理员功能</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-500">系统设置 (需要管理员权限)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}