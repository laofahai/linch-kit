'use client'

import { SSOCallbackHandler } from '@flex-report/auth/react'

export default function SSOCallbackPage() {
  return (
    <SSOCallbackHandler
      redirectUrl="/account"
      errorRedirectUrl="/account/sign-in"
      className="flex items-center justify-center min-h-[calc(100vh-200px)]"
    />
  )
}
