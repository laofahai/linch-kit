import { AuthGuard } from '@/_components/auth/AuthGuard'
import { AppLayout } from '@/_components/layout/AppLayout'

export default function AppLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppLayout>
        {children}
      </AppLayout>
    </AuthGuard>
  )
}
