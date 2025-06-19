/**
 * @linch-kit/trpc React 客户端使用示例
 */

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createTRPCClient,
  createTrpcClient,
  trpc,
  type RouterInputs,
  type RouterOutputs
} from '@linch-kit/trpc'

// 假设这是从服务端导入的路由类型
type AppRouter = any // 实际使用时应该从服务端导入

// 1. 创建 tRPC 客户端
const trpcClient = createTrpcClient({
  url: '/api/trpc',
  headers: async () => {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
})

// 2. 创建 Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1
    }
  }
})

// 3. 应用根组件
export function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <Header />
          <UserList />
          <CreateUserForm />
          <PostList />
        </div>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

// 4. 用户列表组件
function UserList() {
  const [page, setPage] = useState(1)
  
  const { data, isLoading, error } = trpc.user.list.useQuery({
    page,
    limit: 10
  })

  if (isLoading) return <div>Loading users...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="user-list">
      <h2>Users</h2>
      {data?.users.map(user => (
        <div key={user.id} className="user-card">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
      
      <div className="pagination">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={!data?.pagination.hasPrev}
        >
          Previous
        </button>
        <span>Page {page} of {data?.pagination.totalPages}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.pagination.hasNext}
        >
          Next
        </button>
      </div>
    </div>
  )
}

// 5. 创建用户表单组件
function CreateUserForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  
  const utils = trpc.useUtils()
  
  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      // 重新获取用户列表
      utils.user.list.invalidate()
      setName('')
      setEmail('')
      alert('User created successfully!')
    },
    onError: (error) => {
      alert(`Error: ${error.message}`)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createUser.mutate({ name, email })
  }

  return (
    <form onSubmit={handleSubmit} className="create-user-form">
      <h2>Create User</h2>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
      </div>
      <button 
        type="submit" 
        disabled={createUser.isLoading}
      >
        {createUser.isLoading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}

// 6. 文章列表组件
function PostList() {
  const { data, isLoading } = trpc.post.list.useQuery({
    published: true,
    page: 1,
    limit: 5
  })

  if (isLoading) return <div>Loading posts...</div>

  return (
    <div className="post-list">
      <h2>Recent Posts</h2>
      {data?.posts.map(post => (
        <article key={post.id} className="post-card">
          <h3>{post.title}</h3>
          <p>{post.content.substring(0, 100)}...</p>
          <small>By User {post.authorId} on {post.createdAt}</small>
        </article>
      ))}
    </div>
  )
}

// 7. 头部组件 - 显示当前用户信息
function Header() {
  const { data: user, isLoading } = trpc.user.me.useQuery(undefined, {
    retry: false,
    onError: () => {
      // 用户未登录，可以重定向到登录页
      console.log('User not authenticated')
    }
  })

  return (
    <header className="header">
      <h1>My App</h1>
      <div className="user-info">
        {isLoading ? (
          <span>Loading...</span>
        ) : user ? (
          <span>Welcome, {user.name}!</span>
        ) : (
          <span>Not logged in</span>
        )}
      </div>
    </header>
  )
}

// 8. 类型安全的输入输出示例
type UserListInput = RouterInputs['user']['list']
type UserListOutput = RouterOutputs['user']['list']

// 9. 自定义 Hook 示例
function useUserList(input: UserListInput) {
  return trpc.user.list.useQuery(input, {
    keepPreviousData: true,
    staleTime: 30000 // 30 seconds
  })
}

// 10. 错误处理示例
function ErrorBoundaryExample() {
  const { data, error, isError } = trpc.user.list.useQuery({ page: 1 })

  if (isError) {
    return (
      <div className="error-boundary">
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
        <details>
          <summary>Error Details</summary>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </details>
      </div>
    )
  }

  return <div>Content loaded successfully</div>
}
