'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
// import { trpc, createTrpcClient } from '@/_lib/trpc' // 暂时禁用 tRPC
import { AuthProvider } from '@/_providers/authProvider'
import { I18nProvider } from '@/_providers/i18nProvider'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60 * 1000, retry: 2 },
          mutations: { retry: 1 },
        },
      })
  )

  // const [trpcClient] = useState(() => createTrpcClient()) // 暂时禁用 tRPC

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <AuthProvider>{children}</AuthProvider>
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nProvider>
  )
}
