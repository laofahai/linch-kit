import { Suspense } from 'react'
import { SignInClientPage } from './sign-in-client'
import { loadSharedTokenSources, getAuthProviders } from '@flex-report/auth'

export default function SignInPage() {
  // 在服务器端获取认证提供者信息
  const providers = getAuthProviders()

  // 在服务器端获取 SSO 源
  const sources = loadSharedTokenSources().map((source: any) => ({
    id: source.id,
    name: source.name,
    loginUrl: source.loginUrl,
  }))

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
          <div className="w-full max-w-sm space-y-6 text-center">
            <p className="text-sm text-muted-foreground">加载登录选项中...</p>
          </div>
        </div>
      }
    >
      <SignInClientPage availableProviders={providers} ssoSources={sources} />
    </Suspense>
  )
}
