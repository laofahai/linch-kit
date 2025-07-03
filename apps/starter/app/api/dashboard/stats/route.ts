import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Logger } from '@linch-kit/core'

export async function GET() {
  try {
    Logger.info('API: 开始获取仪表板统计数据')
    
    const [
      totalUsers,
      activeUsers,
      totalSessions,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天内登录
          },
        },
      }),
      db.session.count({
        where: {
          expiresAt: {
            gte: new Date(), // 有效会话
          },
        },
      }),
    ])

    const stats = {
      totalUsers,
      totalPosts: 0, // 保持兼容性，但设为0
      publishedPosts: 0, // 保持兼容性，但设为0  
      draftPosts: 0, // 保持兼容性，但设为0
      lastUpdated: new Date().toISOString(),
      // 新增统计字段
      activeUsers,
      totalSessions,
    }
    
    Logger.info('API: 仪表板统计数据获取成功', stats)
    
    return NextResponse.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    Logger.error('API: 仪表板统计数据获取失败', 
      error instanceof Error ? error : new Error(String(error))
    )
    
    return NextResponse.json({
      success: false,
      error: 'STATS_FETCH_FAILED',
      message: '获取统计数据失败'
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}