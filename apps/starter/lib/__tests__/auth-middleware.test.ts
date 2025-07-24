/**
 * 认证中间件测试
 */

/* eslint-disable import/no-unresolved */
import { describe, it, expect, beforeEach } from 'bun:test'
import { NextRequest } from 'next/server'

import { authMiddleware, validateApiAuth } from '../auth-middleware'

describe('认证中间件', () => {
  beforeEach(() => {
    // 清理测试环境
  })

  describe('公共路径', () => {
    it('应该允许访问公共路径', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        method: 'GET'
      })

      const response = await authMiddleware(request, {
        publicPaths: ['/'],
        protectedPaths: ['/dashboard']
      })

      expect(response.status).toBe(200)
    })

    it('应该允许访问认证页面', async () => {
      const request = new NextRequest('http://localhost:3000/auth', {
        method: 'GET'
      })

      const response = await authMiddleware(request, {
        publicPaths: ['/auth'],
        protectedPaths: ['/dashboard']
      })

      expect(response.status).toBe(200)
    })
  })

  describe('受保护路径', () => {
    it('应该重定向未认证用户到登录页面', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET'
      })

      const response = await authMiddleware(request, {
        protectedPaths: ['/dashboard'],
        loginPath: '/auth'
      })

      expect(response.status).toBe(307) // 重定向状态码
      expect(response.headers.get('Location')).toContain('/auth')
      expect(response.headers.get('Location')).toContain('callbackUrl=%2Fdashboard')
    })

    it('应该允许有效令牌的用户访问', async () => {
      // 使用有效的mock token格式
      const validToken = `mock-access-token-${Date.now()}`
      
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await authMiddleware(request, {
        protectedPaths: ['/dashboard'],
        loginPath: '/auth'
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('X-User-ID')).toBe('test-user-123')
      expect(response.headers.get('X-Session-ID')).toBe('mock-session-id')
    })

    it('应该从Cookie中获取令牌', async () => {
      // 使用有效的mock token格式
      const validToken = `mock-access-token-${Date.now()}`
      
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
        headers: {
          'Cookie': `session=${validToken}`
        }
      })

      const response = await authMiddleware(request, {
        protectedPaths: ['/dashboard'],
        loginPath: '/auth'
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('X-User-ID')).toBe('test-user-123')
    })

    it('应该重定向无效令牌的用户', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })

      const response = await authMiddleware(request, {
        protectedPaths: ['/dashboard'],
        loginPath: '/auth'
      })

      expect(response.status).toBe(307) // 重定向状态码
      expect(response.headers.get('Location')).toContain('/auth')
    })
  })

  describe('API路径', () => {
    it('应该返回401对未认证的API请求', async () => {
      const request = new NextRequest('http://localhost:3000/api/protected', {
        method: 'GET'
      })

      const response = await authMiddleware(request, {
        apiPaths: ['/api'],
        protectedPaths: ['/api/protected']
      })

      expect(response.status).toBe(401)
      
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('应该允许有效令牌的API请求', async () => {
      // 使用有效的mock token格式
      const validToken = `mock-access-token-${Date.now()}`
      
      const request = new NextRequest('http://localhost:3000/api/protected', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const response = await authMiddleware(request, {
        apiPaths: ['/api'],
        protectedPaths: ['/api/protected']
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('X-User-ID')).toBe('test-user-123')
    })

    it('应该返回401对无效令牌的API请求', async () => {
      const request = new NextRequest('http://localhost:3000/api/protected', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-api-token'
        }
      })

      const response = await authMiddleware(request, {
        apiPaths: ['/api'],
        protectedPaths: ['/api/protected']
      })

      expect(response.status).toBe(401)
      
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
      expect(json.message).toBe('Invalid or expired token')
    })
  })

  describe('错误处理', () => {
    it('应该处理认证服务错误', async () => {
      // 测试恶意构造的token引起的解析错误
      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer malformed-token-without-proper-format'
        }
      })

      const response = await authMiddleware(request, {
        protectedPaths: ['/dashboard'],
        loginPath: '/auth'
      })

      expect(response.status).toBe(307) // 重定向状态码
      expect(response.headers.get('Location')).toContain('/auth')
    })

    it('应该为API请求返回401错误对于无效token', async () => {
      const request = new NextRequest('http://localhost:3000/api/protected', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer malformed-token'
        }
      })

      const response = await authMiddleware(request, {
        apiPaths: ['/api'],
        protectedPaths: ['/api/protected']
      })

      expect(response.status).toBe(401)
      
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
    })
  })
})

describe('validateApiAuth', () => {
  beforeEach(() => {
    // 清理测试环境
  })

  it('应该验证有效的API认证', async () => {
    // 使用有效的mock token格式
    const validToken = `mock-access-token-${Date.now()}`
    
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
    })

    const result = await validateApiAuth(request)

    expect(result.valid).toBe(true)
    expect(result.session).toBeDefined()
    expect(result.session?.userId).toBe('test-user-123')
  })

  it('应该拒绝无令牌的请求', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET'
    })

    const result = await validateApiAuth(request)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('No authentication token provided')
  })

  it('应该拒绝无效令牌', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    })

    const result = await validateApiAuth(request)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid or expired token')
  })

  it('应该处理认证服务错误', async () => {
    // 测试恶意构造的token引起的解析错误
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer malformed-token'
      }
    })

    const result = await validateApiAuth(request)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid or expired token')
  })
})