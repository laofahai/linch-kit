import React from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppSidebarLayout } from '../../components/layout/AppSidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/sign-in?redirect=/dashboard')
  }

  return (
    <AppSidebarLayout
      title="Dashboard"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' }
      ]}
    >
      {children}
    </AppSidebarLayout>
  )
}