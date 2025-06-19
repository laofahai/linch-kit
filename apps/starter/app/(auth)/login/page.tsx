'use client'

import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '@/_components/auth/LoginForm'

interface LoginPageProps {
  searchParams: {
    callbackUrl?: string
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('app.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('app.subtitle')}
          </p>
        </div>
        
        <Suspense fallback={<div>{t('common.loading')}</div>}>
          <LoginForm
            callbackUrl={searchParams.callbackUrl}
            error={searchParams.error}
          />
        </Suspense>
      </div>
    </div>
  )
}
