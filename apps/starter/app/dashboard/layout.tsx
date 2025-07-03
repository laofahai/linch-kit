"use client"

import React from 'react'
import { AppSidebarLayout } from '../../components/layout/AppSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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