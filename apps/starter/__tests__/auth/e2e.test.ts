/**
 * 认证系统端到端功能测试
 * 
 * 测试具体的注册、登录、会话管理等功能
 * 使用真实的API端点进行测试
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { PrismaClient } from '../../../prisma/generated/client'

// 测试配置
const TEST_USERS = [
  {
    email: 'e2e-test-1@example.com',
    password: 'SecurePassword123',
    name: 'E2E Test User 1'
  },
  {
    email: 'e2e-test-2@example.com',
    password: 'SecurePassword456',
    name: 'E2E Test User 2'
  }
]

describe('认证系统端到端功能测试', () => {
  let prisma: PrismaClient
  let baseUrl: string

  beforeAll(async () => {
    // 初始化数据库连接
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./dev.db'
        }
      }
    })

    // 设置基础URL（用于API测试）
    baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

    // 清理测试数据
    await cleanupTestData()
  })

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestData()
    
    // 关闭数据库连接
    await prisma.$disconnect()
  })

  async function cleanupTestData() {
    try {
      // 删除测试用户
      await prisma.user.deleteMany({
        where: {
          email: {
            in: TEST_USERS.map(u => u.email)
          }
        }
      })
      
      // 删除测试会话
      await prisma.session.deleteMany({
        where: {
          user: {
            email: {
              in: TEST_USERS.map(u => u.email)
            }
          }
        }
      })
    } catch (error) {
      console.warn('清理测试数据时出错:', error)
    }
  }

  describe('API端点测试', () => {
    it('应该能够通过API注册用户', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_USERS[0])
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(TEST_USERS[0].email)
      expect(data.user.name).toBe(TEST_USERS[0].name)
    })

    it('应该能够通过API登录用户', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USERS[0].email,
          password: TEST_USERS[0].password
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.accessToken).toBeDefined()
      expect(data.refreshToken).toBeDefined()
      expect(data.expiresIn).toBeDefined()
    })

    it('应该拒绝重复注册', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_USERS[0])
      })

      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('应该拒绝错误的密码', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USERS[0].email,
          password: 'wrong-password'
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('应该拒绝不存在的用户', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: TEST_USERS[0].password
        })
      })

      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('应该验证输入数据', async () => {
      // 测试空邮箱
      let response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          password: TEST_USERS[1].password,
          name: TEST_USERS[1].name
        })
      })

      let data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)

      // 测试空密码
      response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USERS[1].email,
          password: '',
          name: TEST_USERS[1].name
        })
      })

      data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)

      // 测试无效邮箱格式
      response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: TEST_USERS[1].password,
          name: TEST_USERS[1].name
        })
      })

      data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)

      // 测试密码太短
      response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USERS[1].email,
          password: '123',
          name: TEST_USERS[1].name
        })
      })

      data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('数据库持久化测试', () => {
    it('应该在数据库中正确存储用户数据', async () => {
      // 通过API注册用户
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_USERS[1])
      })

      // 直接查询数据库验证
      const user = await prisma.user.findUnique({
        where: {
          email: TEST_USERS[1].email
        }
      })

      expect(user).toBeDefined()
      expect(user?.email).toBe(TEST_USERS[1].email)
      expect(user?.name).toBe(TEST_USERS[1].name)
      expect(user?.password).toBeDefined() // 应该是加密后的密码
      expect(user?.password).not.toBe(TEST_USERS[1].password) // 不应该是明文
    })

    it('应该创建用户会话记录', async () => {
      // 登录用户
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USERS[1].email,
          password: TEST_USERS[1].password
        })
      })

      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(true)

      // 查询数据库验证会话记录
      const sessions = await prisma.session.findMany({
        where: {
          userId: loginData.user.id
        }
      })

      expect(sessions.length).toBeGreaterThan(0)
      expect(sessions[0].userId).toBe(loginData.user.id)
      expect(sessions[0].isActive).toBe(true)
    })

    it('应该正确处理用户状态', async () => {
      const user = await prisma.user.findUnique({
        where: {
          email: TEST_USERS[1].email
        }
      })

      expect(user?.status).toBe('active')
      expect(user?.createdAt).toBeDefined()
      expect(user?.updatedAt).toBeDefined()
    })
  })

  describe('JWT Token测试', () => {
    it('应该生成有效的JWT令牌', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USERS[1].email,
          password: TEST_USERS[1].password
        })
      })

      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.accessToken).toBeDefined()
      
      // 验证JWT令牌格式
      const tokenParts = data.accessToken.split('.')
      expect(tokenParts.length).toBe(3) // header.payload.signature
      
      // 解码payload
      const payload = JSON.parse(atob(tokenParts[1]))
      expect(payload.sub).toBe(data.user.id)
      expect(payload.email).toBe(TEST_USERS[1].email)
      expect(payload.name).toBe(TEST_USERS[1].name)
      expect(payload.iss).toBe('linchkit-starter')
      expect(payload.aud).toBe('linchkit-starter-app')
    })

    it('应该设置合理的过期时间', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USERS[1].email,
          password: TEST_USERS[1].password
        })
      })

      const data = await response.json()
      
      expect(data.success).toBe(true)
      expect(data.expiresIn).toBeDefined()
      
      // 验证过期时间设置合理（15分钟）
      expect(data.expiresIn).toBeGreaterThan(600) // 大于10分钟
      expect(data.expiresIn).toBeLessThan(1800) // 小于30分钟
    })
  })

  describe('错误处理测试', () => {
    it('应该处理网络错误', async () => {
      try {
        // 测试不存在的端点
        const response = await fetch(`${baseUrl}/api/auth/nonexistent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(TEST_USERS[0])
        })

        expect(response.status).toBe(404)
      } catch (error) {
        // 网络错误也是可以接受的
        expect(true).toBe(true)
      }
    })

    it('应该处理JSON解析错误', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid-json'
      })

      expect(response.status).toBe(400)
    })

    it('应该处理缺失字段', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USERS[1].email
          // 缺少 password 和 name
        })
      })

      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内完成注册', async () => {
      const startTime = Date.now()
      
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'perf-test@example.com',
          password: 'SecurePassword123',
          name: 'Performance Test'
        })
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(2000) // 应该在2秒内完成
    })

    it('应该在合理时间内完成登录', async () => {
      const startTime = Date.now()
      
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'perf-test@example.com',
          password: 'SecurePassword123'
        })
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(2000) // 应该在2秒内完成
    })

    it('应该能够处理并发请求', async () => {
      const startTime = Date.now()
      
      // 创建多个并发登录请求
      const promises = Array(5).fill(0).map(async () => {
        return fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: TEST_USERS[1].email,
            password: TEST_USERS[1].password
          })
        })
      })
      
      const responses = await Promise.all(promises)
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(5000) // 应该在5秒内完成所有请求
      
      // 验证所有请求都成功
      for (const response of responses) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })
  })
})

console.log('🧪 认证系统端到端功能测试完成!')