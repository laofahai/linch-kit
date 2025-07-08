import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'

export default function SignInPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              登录到 LinchKit
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">使用您的账户凭据登录</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <LoginForm />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">演示账户：使用任意邮箱和密码即可登录</p>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
