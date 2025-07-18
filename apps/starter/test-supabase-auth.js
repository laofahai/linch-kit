/**
 * Supabase认证系统集成测试
 * 使用BUN运行：bun test-supabase-auth.js
 */

console.log('🚀 LinchKit Supabase认证系统集成测试')
console.log('📋 测试环境：BUN运行时')

// 测试登录API端点
async function testLoginAPI() {
  console.log('\n=== 测试登录API ===')
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@linchkit.com',
        password: 'password123'
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('✅ 登录API响应:', JSON.stringify(result, null, 2))
    
    // 检查是否包含supabaseId
    if (result.success && result.user && result.user.supabaseId) {
      console.log('✅ Supabase集成成功 - supabaseId:', result.user.supabaseId)
    } else if (result.success && result.user && !result.user.supabaseId) {
      console.log('⚠️ 登录成功但缺少supabaseId - 可能Supabase同步失败')
    } else {
      console.log('❌ 登录失败:', result.error || 'Unknown error')
    }
    
    return result
  } catch (error) {
    console.error('❌ 登录API测试失败:', error.message)
    return null
  }
}

// 测试token验证API
async function testTokenValidation(token) {
  console.log('\n=== 测试Token验证API ===')
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('✅ Token验证API响应:', JSON.stringify(result, null, 2))
    
    return result
  } catch (error) {
    console.error('❌ Token验证API测试失败:', error.message)
    return null
  }
}

// 测试受保护的路由
async function testProtectedRoute(token) {
  console.log('\n=== 测试受保护路由 ===')
  
  try {
    const response = await fetch('http://localhost:3001/api/protected', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('✅ 受保护路由响应:', JSON.stringify(result, null, 2))
    
    return result
  } catch (error) {
    console.error('❌ 受保护路由测试失败:', error.message)
    return null
  }
}

// 主测试函数
async function runTests() {
  console.log('🔍 开始认证系统集成测试...')
  
  // 测试1: 登录API
  const loginResult = await testLoginAPI()
  
  if (loginResult && loginResult.success) {
    // 测试2: Token验证
    const token = loginResult.tokens.accessToken
    await testTokenValidation(token)
    
    // 测试3: 受保护路由
    await testProtectedRoute(token)
  }
  
  console.log('\n🎯 测试完成！')
  console.log('📊 结果总结:')
  console.log('- 登录API:', loginResult ? (loginResult.success ? '✅ 成功' : '❌ 失败') : '❌ 错误')
  console.log('- Supabase集成:', loginResult?.user?.supabaseId ? '✅ 成功' : '⚠️ 可能失败')
  
  // 检查环境变量
  console.log('\n📋 环境检查:')
  console.log('- BUN版本:', process.versions.bun || 'N/A')
  console.log('- Node.js版本:', process.version)
  console.log('- 平台:', process.platform)
}

// 运行测试
runTests().catch(console.error)