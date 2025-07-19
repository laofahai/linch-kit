/**
 * 认证页面布局
 * 使用@linch-kit/auth的正确架构方式
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '用户认证 - LinchKit',
  description: 'LinchKit 平台认证系统',
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>
}