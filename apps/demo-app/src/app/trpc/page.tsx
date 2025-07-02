/**
 * tRPC 演示页面
 */

'use client'

import { useState } from 'react'

import { trpc } from '../../components/providers/TRPCProvider'

export default function TRPCDemo() {
  const [userInput, setUserInput] = useState('')
  
  // 健康检查查询
  const healthPing = trpc.health.ping.useQuery()
  const healthStatus = trpc.health.status.useQuery()
  
  // 系统信息查询
  const systemInfo = trpc.system.info.useQuery()
  
  // 用户管理查询
  const userList = trpc.user.list.useQuery({
    page: 1,
    limit: 5
  })
  
  // 用户搜索
  const [searchQuery, setSearchQuery] = useState('')
  const userSearch = trpc.user.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  )
  
  // 创建用户 mutation
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // 重新获取用户列表
      userList.refetch()
      setUserInput('')
    }
  })
  
  // Starter app 特定查询
  const starterHello = trpc.starter.hello.world.useQuery()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          tRPC API 演示
        </h1>
        
        <div className="space-y-8">
          {/* 健康检查 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">健康检查</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Ping</h3>
                {healthPing.isLoading ? (
                  <div className="text-gray-500">加载中...</div>
                ) : healthPing.error ? (
                  <div className="text-red-500">错误: {healthPing.error.message}</div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <pre>{JSON.stringify(healthPing.data, null, 2)}</pre>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">系统状态</h3>
                {healthStatus.isLoading ? (
                  <div className="text-gray-500">加载中...</div>
                ) : healthStatus.error ? (
                  <div className="text-red-500">错误: {healthStatus.error.message}</div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex items-center mb-2">
                      <span className={`w-3 h-3 rounded-full mr-2 ${
                        healthStatus.data?.status === 'healthy' ? 'bg-green-500' :
                        healthStatus.data?.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      <span className="font-medium">{healthStatus.data?.status}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {Object.entries(healthStatus.data?.checks || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span className={value.status === 'pass' ? 'text-green-600' : 'text-red-600'}>
                            {value.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 系统信息 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">系统信息</h2>
            {systemInfo.isLoading ? (
              <div className="text-gray-500">加载中...</div>
            ) : systemInfo.error ? (
              <div className="text-red-500">错误: {systemInfo.error.message}</div>
            ) : (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div><strong>名称:</strong> {systemInfo.data?.name}</div>
                    <div><strong>版本:</strong> {systemInfo.data?.version}</div>
                    <div><strong>环境:</strong> {systemInfo.data?.environment}</div>
                  </div>
                  <div>
                    <div><strong>Node版本:</strong> {systemInfo.data?.nodeVersion}</div>
                    <div><strong>平台:</strong> {systemInfo.data?.platform}</div>
                    <div><strong>运行时间:</strong> {Math.round((systemInfo.data?.uptime || 0) / 60)}分钟</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 用户管理 CRUD */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">用户管理 CRUD</h2>
            
            {/* 创建用户 */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">创建用户</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="输入邮箱地址"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (userInput) {
                      createUser.mutate({
                        email: userInput,
                        name: userInput.split('@')[0],
                        roles: ['user']
                      })
                    }
                  }}
                  disabled={!userInput || createUser.isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {createUser.isLoading ? '创建中...' : '创建用户'}
                </button>
              </div>
              {createUser.error && (
                <div className="text-red-500 text-sm mt-2">
                  错误: {createUser.error.message}
                </div>
              )}
            </div>

            {/* 搜索用户 */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">搜索用户</h3>
              <input
                type="text"
                placeholder="输入搜索关键词 (至少3个字符)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {userSearch.data && (
                <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
                  <div>找到 {userSearch.data.total} 个用户</div>
                  {userSearch.data.data.map((user, index) => (
                    <div key={index} className="mt-1">
                      {user.name} ({user.email})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 用户列表 */}
            <div>
              <h3 className="font-medium mb-2">用户列表</h3>
              {userList.isLoading ? (
                <div className="text-gray-500">加载中...</div>
              ) : userList.error ? (
                <div className="text-red-500">错误: {userList.error.message}</div>
              ) : (
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="mb-2">
                    总共 {userList.data?.total} 个用户，当前第 {userList.data?.page} 页
                  </div>
                  {userList.data?.data.map((user, index) => (
                    <div key={index} className="py-1 border-b border-gray-200 last:border-0">
                      <div className="flex justify-between">
                        <span>{user.name}</span>
                        <span className="text-gray-600">{user.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Starter App 特定功能 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Starter App 功能</h2>
            {starterHello.isLoading ? (
              <div className="text-gray-500">加载中...</div>
            ) : starterHello.error ? (
              <div className="text-red-500">错误: {starterHello.error.message}</div>
            ) : (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div className="mb-2 font-medium">{starterHello.data?.message}</div>
                <div className="text-gray-600 mb-2">
                  时间: {starterHello.data?.timestamp}
                </div>
                <div>
                  <strong>特性:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {starterHello.data?.features?.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    )) || <li>暂无特性数据</li>}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}