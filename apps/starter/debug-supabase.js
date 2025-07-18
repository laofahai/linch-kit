/**
 * 调试Supabase集成 - 详细检查配置和连接
 */

import { supabase } from './lib/supabase.js'

console.log('🔍 Supabase配置调试')
console.log('环境变量:')
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET')
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')

// 测试Supabase连接
async function testSupabaseConnection() {
  console.log('\n🔗 测试Supabase连接...')
  
  try {
    // 测试基本连接
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.error('❌ Supabase连接错误:', error.message)
      console.error('错误详情:', error)
      return false
    }
    
    console.log('✅ Supabase连接成功')
    return true
  } catch (error) {
    console.error('❌ Supabase连接异常:', error.message)
    return false
  }
}

// 测试用户表结构
async function testUserTable() {
  console.log('\n📋 测试用户表结构...')
  
  try {
    // 尝试插入测试数据
    const testUser = {
      email: 'test@example.com',
      name: 'Test User'
    }
    
    const { data, error } = await supabase
      .from('users')
      .upsert(testUser, { onConflict: 'email' })
      .select()
    
    if (error) {
      console.error('❌ 用户表操作错误:', error.message)
      console.error('错误详情:', error)
      return false
    }
    
    console.log('✅ 用户表操作成功:', data)
    return true
  } catch (error) {
    console.error('❌ 用户表操作异常:', error.message)
    return false
  }
}

// 主函数
async function main() {
  const connectionOk = await testSupabaseConnection()
  
  if (connectionOk) {
    await testUserTable()
  }
  
  // 测试登录API
  console.log('\n🔐 测试登录API...')
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@linchkit.com',
        password: 'password123'
      })
    })
    
    const result = await response.json()
    console.log('登录API响应:', result)
    
    if (result.user?.supabaseId) {
      console.log('✅ Supabase用户ID已返回:', result.user.supabaseId)
    } else {
      console.log('⚠️ 未返回Supabase用户ID')
    }
  } catch (error) {
    console.error('❌ 登录API测试失败:', error.message)
  }
}

main().catch(console.error)