import { redirect } from 'next/navigation'

export default function Home() {
  // 重定向到仪表板
  redirect('/dashboard')
}
