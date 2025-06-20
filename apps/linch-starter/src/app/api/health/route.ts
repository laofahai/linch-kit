import { NextResponse } from 'next/server'

import { db } from '../../../lib/db'

export async function GET() {
  try {
    // Test database connection
    const userCount = await db.user.count()
    const roleCount = await db.role.count()
    const departmentCount = await db.department.count()

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      stats: {
        users: userCount,
        roles: roleCount,
        departments: departmentCount,
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
