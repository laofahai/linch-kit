"use client"

import React from 'react'
import { AppSidebarLayout } from '../../components/layout/ModernAppSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppSidebarLayout
      title="Dashboard"
      description="Welcome to your LinchKit Starter application"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' }
      ]}
      user={{
        name: 'Demo User',
        email: 'demo@linchkit.com'
      }}
      showCard={false}
      padding="lg"
    >
      {children}
    </AppSidebarLayout>
  )
}