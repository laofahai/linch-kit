import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { UserProfile } from '@/components/auth/UserProfile'

export default function AuthPage() {
  return (
    <AuthProvider>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">LinchKit 认证系统演示</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 登录/注销区域 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">🔐 用户认证</h2>
            <LoginForm />
          </div>

          {/* 用户信息区域 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">👤 用户信息</h2>
            <UserProfile />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">🚀 LinchKit Auth 特性</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>多提供商支持:</strong>
              <span className="text-gray-600"> JWT、OAuth2、第三方登录</span>
            </div>
            <div>
              <strong>会话管理:</strong>
              <span className="text-gray-600"> 安全的令牌存储和刷新</span>
            </div>
            <div>
              <strong>权限控制:</strong>
              <span className="text-gray-600"> RBAC/ABAC 角色权限管理</span>
            </div>
            <div>
              <strong>安全特性:</strong>
              <span className="text-gray-600"> 防CSRF、XSS保护、速率限制</span>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
