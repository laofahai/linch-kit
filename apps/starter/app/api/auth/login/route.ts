/**
 * 登录API端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthService } from '@linch-kit/auth/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const authService = await getAuthService({
      type: 'jwt',
      fallbackToMock: true,
      config: {
        jwtSecret: process.env.NEXT_PUBLIC_JWT_SECRET || 'your-super-secret-jwt-key-with-at-least-32-characters',
        accessTokenExpiry: '15m',
        refreshTokenExpiry: '7d'
      }
    })

    const result = await authService.authenticate({
      provider: 'credentials',
      credentials: {
        email,
        password
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { success: false, error: '登录失败' },
      { status: 500 }
    )
  }
}