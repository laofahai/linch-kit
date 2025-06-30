import { NextResponse } from 'next/server'

// 模拟会话API，用于演示
export async function GET() {
  try {
    // 模拟会话数据
    const session = {
      user: {
        id: 'demo-user-1',
        name: 'Demo User',
        email: 'demo@linchkit.com',
        role: 'admin'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
    }

    return NextResponse.json(session)
  } catch {
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { message: 'Session management not implemented yet' },
    { status: 501 }
  )
}