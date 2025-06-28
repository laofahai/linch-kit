'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'
import superjson from 'superjson'
import { AuthProvider } from '@linch-kit/auth'
// import { ConsoleProvider } from '@linch-kit/console' // TODO: Fix server imports in console
import type { AppRouter } from '@/server/routers/app'

export const trpc = createTRPCReact<AppRouter>()

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: false,
          },
        },
      })
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* <ConsoleProvider> */}
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          {/* </ConsoleProvider> */}
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}