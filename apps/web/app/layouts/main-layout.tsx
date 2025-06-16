import { getSessionUser } from '@/_lib/trpc/server/middleware/auth'
import { redirect } from 'next/navigation'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  // 未认证用户重定向到登录页
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">{children}</main>
      </div>
    </div>
  )
}
