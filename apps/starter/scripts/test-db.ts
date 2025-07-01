import { config } from 'dotenv'
import { schemaClient } from '../src/lib/schema-client.js'

// 加载环境变量
config({ path: '.env' })

async function main() {
  try {
    // 测试连接
    await schemaClient.$connect()
    console.log('✅ 数据库连接成功')
    
    // 测试查询
    const userCount = await schemaClient.user.count()
    console.log(`✅ 用户数: ${userCount}`)
    
    console.log('✅ PostgreSQL/Supabase 完全兼容!')
  } catch (error) {
    console.error('❌ 连接失败:', error)
    process.exit(1)
  } finally {
    await schemaClient.$disconnect()
  }
}

main()