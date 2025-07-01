import { config } from 'dotenv'
import { prisma } from '../src/lib/prisma.js'

// 加载环境变量
config({ path: '.env' })

async function main() {
  try {
    // 测试连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功')
    
    // 测试查询
    const userCount = await prisma.user.count()
    console.log(`✅ 用户数: ${userCount}`)
    
    console.log('✅ PostgreSQL/Supabase 完全兼容!')
  } catch (error) {
    console.error('❌ 连接失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()