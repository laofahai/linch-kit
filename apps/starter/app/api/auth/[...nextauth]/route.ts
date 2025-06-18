import { auth } from '@linch-kit/auth'

// 导出 API 处理函数
// 这会捕获所有对 /api/auth/* 的请求并交由 NextAuth 处理
export const GET = auth
export const POST = auth
