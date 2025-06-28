import { TenantDetail } from '@linch-kit/console'

interface Props {
  params: { id: string }
}

export default function TenantDetailPage({ params }: Props) {
  return <TenantDetail tenantId={params.id} />
}