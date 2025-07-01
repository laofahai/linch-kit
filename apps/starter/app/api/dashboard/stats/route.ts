import { NextRequest, NextResponse } from 'next/server'
import { DataService } from '@/lib/services/data'
import { Logger } from '@linch-kit/core'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 验证用户登录状态
    await requireAuth()
    
    Logger.info('API: 开始获取仪表板统计数据')
    
    const stats = await DataService.getStats()
    
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