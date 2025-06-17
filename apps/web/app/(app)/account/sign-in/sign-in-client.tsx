'use client'

import { SignInProvider, useSignIn, type AuthSource } from '@flex-report/auth/react'
import { Button } from '@flex-report/ui/shadcn'
import { redirectToSSO } from '@flex-report/auth/react'
import { SSO_CALLBACK_URL } from '@/_lib/constants'

interface SignInClientPageProps {
  ssoSources: AuthSource[]
  availableProviders: string[]
}

// 登录界面内容组件，使用 useSignIn hook 来访问认证上下文
function SignInContent() {
  const { isLoading, providers, ssoSources, redirectUrl, callbackParamName } = useSignIn()

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">加载登录选项中...</p>
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-500">未配置任何登录方式，请联系管理员</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Clerk 登录按钮 */}
      {providers.includes('clerk') && (
        <Button variant="outline" className="w-full" onClick={() => {}}>
          使用 Clerk 登录
        </Button>
      )}

      {/* SSO 登录按钮 */}
      {providers.includes('shared-token') &&
        ssoSources.map(source => (
          <Button
            key={source.id}
            variant="outline"
            className="w-full"
            onClick={() => redirectToSSO(source, redirectUrl, { callbackParamName })}
          >
            使用 {source.name} 登录
          </Button>
        ))}
    </div>
  )
}

// 主组件，包含整个登录页面的结构和布局
export function SignInClientPage({ ssoSources, availableProviders }: SignInClientPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">欢迎使用</h1>
          <p className="text-sm text-muted-foreground mt-1">请选择登录方式继续</p>
        </div>

        <SignInProvider
          redirectUrl={SSO_CALLBACK_URL}
          autoRedirectIfSingleProvider={true}
          ssoSources={ssoSources}
          availableProviders={availableProviders}
        >
          <SignInContent />
        </SignInProvider>
      </div>
    </div>
  )
}
