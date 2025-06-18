import { getSessionUser } from '@linch-kit/auth'
import { AccountClient } from './account-client'

// 服务器组件，获取用户会话数据
export default async function AccountPage() {
  // 在服务器端获取用户信息
  const user = await getSessionUser()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">账户信息</h1>

      {/* 传递用户数据到客户端组件 */}
      <AccountClient user={user} />
    </div>
  )
}
