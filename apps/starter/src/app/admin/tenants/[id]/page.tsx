'use client'

// import { TenantDetail } from '@linch-kit/console'

interface Props {
  params: { id: string }
}

export default function TenantDetailPage({ params }: Props) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">租户详情</h1>
      <p className="text-muted-foreground">租户ID: {params.id}</p>
      <p className="text-muted-foreground">Console租户详情功能正在开发中...</p>
    </div>
  )
}