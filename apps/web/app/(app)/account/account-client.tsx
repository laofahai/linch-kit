'use client'

import { User } from '@linch-kit/auth'
import { Button } from '@linch-kit/ui/shadcn'
import { signOut } from 'next-auth/react'

export interface AccountClientProps {
  user: User | null
}

export function AccountClient({ user }: AccountClientProps) {
  if (!user) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h2 className="text-lg font-semibold text-yellow-800">未登录</h2>
        <p className="text-yellow-700">您当前未登录或会话已过期。</p>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/account/sign-in' })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">用户信息</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="用户ID" value={user.id || '未知'} />
            <InfoItem label="姓名" value={user.name || '未设置'} />
            <InfoItem label="邮箱" value={user.email || '未设置'} />
            <InfoItem label="身份提供商" value={user.provider || 'default'} />
          </div>

          {user.image && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-500 mb-1">头像</p>
              <img src={user.image} alt="用户头像" className="w-16 h-16 rounded-full" />
            </div>
          )}
        </div>
      </div>

      {user.permissions && user.permissions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">权限</h2>
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((permission, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleSignOut}>
          退出登录
        </Button>
      </div>
    </div>
  )
}

// 信息项组件，用于显示标签和值
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900">{value}</p>
    </div>
  )
}
