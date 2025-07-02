'use client'

import { useState } from 'react'

import { useAuth } from './AuthProvider'

export function LoginForm() {
  const { user, signIn, signOut, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }

    try {
      await signIn(email, password)
    } catch {
      setError('登录失败，请重试')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      setError('注销失败，请重试')
    }
  }

  if (user) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-green-800 font-medium">已登录</span>
          </div>
          <p className="text-green-700 mt-2">欢迎，{user.name}！</p>
        </div>
        
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? '注销中...' : '注销'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          邮箱地址
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入邮箱"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          密码
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入密码"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <span className="text-red-600 text-sm">{error}</span>
        </div>
      )}
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? '登录中...' : '登录'}
      </button>
      
      <div className="text-xs text-gray-500 mt-2">
        <p>演示账号: 任意邮箱格式 + 任意密码</p>
        <p>例如: demo@example.com / 123456</p>
      </div>
    </form>
  )
}