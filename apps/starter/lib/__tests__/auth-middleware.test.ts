/**
 * 认证中间件测试
 */

/* eslint-disable import/no-unresolved */
import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { NextRequest } from 'next/server'

import { authMiddleware, validateApiAuth } from '../auth-middleware'

// Mock @linch-kit/auth
const mockAuthService = {
  validateSession: mock().mockResolvedValue(null),
  getUser: mock().mockResolvedValue(null)
}

const mockGetAuthService = mock().mockResolvedValue(mockAuthService)

// eslint-disable-next-line @typescript-eslint/no-floating-promises
mock.module('@linch-kit/auth', () => ({
  getAuthService: mockGetAuthService
}))

describe('认证中间件', () => {
  beforeEach(() => {
    mockAuthService.validateSession.mockClear()
    mockAuthService.getUser.mockClear()
    mockGetAuthService.mockClear()
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
      expect(mockGetAuthService).not.toHaveBeenCalled()
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
      expect(mockGetAuthService).not.toHaveBeenCalled()
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
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'valid-token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      }

      mockAuthService.validateSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await authMiddleware(request, {
        protectedPaths: ['/dashboard'],
        loginPath: '/auth'
      })

      expect(response.status).toBe(200)
      expect(mockAuthService.validateSession).toHaveBeenCalledWith('valid-token')
      expect(response.headers.get('X-User-ID')).toBe('user-123')
      expect(response.headers.get('X-Session-ID')).toBe('session-123')
    })

    it('应该从Cookie中获取令牌', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'cookie-token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      }

      mockAuthService.validateSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
        headers: {
          'Cookie': 'session=cookie-token'
        }
      })

      const response = await authMiddleware(request, {
        protectedPaths: ['/dashboard'],
        loginPath: '/auth'
      })

      expect(response.status).toBe(200)
      expect(mockAuthService.validateSession).toHaveBeenCalledWith('cookie-token')
    })

    it('应该重定向无效令牌的用户', async () => {
      mockAuthService.validateSession.mockResolvedValue(null)

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
      expect(mockAuthService.validateSession).toHaveBeenCalledWith('invalid-token')
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
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'api-token',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      }

      mockAuthService.validateSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/protected', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer api-token'
        }
      })

      const response = await authMiddleware(request, {
        apiPaths: ['/api'],
        protectedPaths: ['/api/protected']
      })

      expect(response.status).toBe(200)
      expect(mockAuthService.validateSession).toHaveBeenCalledWith('api-token')
    })

    it('应该返回401对无效令牌的API请求', async () => {
      mockAuthService.validateSession.mockResolvedValue(null)

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
      mockAuthService.validateSession.mockRejectedValue(new Error('Service error'))

      const request = new NextRequest('http://localhost:3000/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer some-token'
        }
      })

      const response = await authMiddleware(request, {
        protectedPaths: ['/dashboard'],
        loginPath: '/auth'
      })

      expect(response.status).toBe(307) // 重定向状态码
      expect(response.headers.get('Location')).toContain('/auth')
    })

    it('应该为API请求返回500错误', async () => {
      mockAuthService.validateSession.mockRejectedValue(new Error('Service error'))

      const request = new NextRequest('http://localhost:3000/api/protected', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer some-token'
        }
      })

      const response = await authMiddleware(request, {
        apiPaths: ['/api'],
        protectedPaths: ['/api/protected']
      })

      expect(response.status).toBe(500)
      
      const json = await response.json()
      expect(json.error).toBe('Authentication Error')
    })
  })
})

describe('validateApiAuth', () => {
  beforeEach(() => {
    mockAuthService.validateSession.mockClear()
    mockAuthService.getUser.mockClear()
    mockGetAuthService.mockClear()
  })

  it('应该验证有效的API认证', async () => {
    const mockSession = {
      id: 'session-123',
      userId: 'user-123',
      accessToken: 'valid-token',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000)
    }

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    }

    mockAuthService.validateSession.mockResolvedValue(mockSession)
    mockAuthService.getUser.mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    })

    const result = await validateApiAuth(request)

    expect(result.valid).toBe(true)
    expect(result.session).toBe(mockSession)
  })

  it('应该拒绝无令牌的请求', async () => {
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET'
    })

    const result = await validateApiAuth(request)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('No authentication token provided')
    expect(mockAuthService.validateSession).not.toHaveBeenCalled()
  })

  it('应该拒绝无效令牌', async () => {
    mockAuthService.validateSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    })

    const result = await validateApiAuth(request)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid or expired token')
    expect(mockAuthService.validateSession).toHaveBeenCalledWith('invalid-token')
  })

  it('应该处理认证服务错误', async () => {
    mockAuthService.validateSession.mockRejectedValue(new Error('Service error'))

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer some-token'
      }
    })

    const result = await validateApiAuth(request)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Authentication validation failed')
  })
})