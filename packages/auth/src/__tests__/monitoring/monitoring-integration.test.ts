/**
 * @linch-kit/auth 监控集成测试
 * 
 * 测试监控系统与JWT认证服务的集成
 * 
 * @author LinchKit Team
 * @since 2.0.3
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { JWTAuthService } from '../../services/jwt-auth.service'
import { createAuthPerformanceMonitor, type IAuthPerformanceMonitor } from '../../monitoring/auth-performance-monitor'
import type { AuthRequest, ILogger } from '../../types'

// Clear prometheus registry before each test
import { register, Registry } from 'prom-client'
import { createServerMetricCollector } from '@linch-kit/core/server'

// Mock logger
const mockLogger: ILogger = {
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {})
}

describe('Monitoring Integration Tests', () => {
  let authService: JWTAuthService
  let performanceMonitor: IAuthPerformanceMonitor
  let testRegistry: Registry

  beforeEach(() => {
    // Create isolated test registry
    testRegistry = new Registry()
    
    // Clear default registry
    register.clear()
    
    // Reset mock call counts
    mockLogger.info.mockClear?.()
    mockLogger.warn.mockClear?.()
    mockLogger.error.mockClear?.()
    
    // Create isolated metric collector
    const testMetricCollector = createServerMetricCollector({ 
      registry: testRegistry,
      enableDefaultMetrics: false 
    })
    
    // Create performance monitor with isolated metric collector
    performanceMonitor = createAuthPerformanceMonitor(mockLogger, testMetricCollector)
    
    // Create JWT auth service with test config and isolated performance monitor
    authService = new JWTAuthService({
      jwtSecret: 'test-secret-key-that-is-at-least-32-characters-long',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      algorithm: 'HS256',
      issuer: 'test-issuer',
      audience: 'test-audience'
    }, performanceMonitor)
  })

  afterEach(() => {
    // Clean up registries
    testRegistry.clear()
    register.clear()
  })

  describe('JWT Authentication with Monitoring', () => {
    it('should record successful login metrics', async () => {
      const request: AuthRequest = {
        provider: 'jwt',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      }

      const result = await authService.authenticate(request)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.tokens).toBeDefined()

      // Check that monitoring was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'login',
          status: 'success',
          authMethod: 'jwt'
        })
      )
    })

    it('should record failed login metrics', async () => {
      const request: AuthRequest = {
        provider: 'jwt',
        credentials: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        }
      }

      const result = await authService.authenticate(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')

      // Check that monitoring was called
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'login',
          status: 'failure',
          errorCode: 'INVALID_CREDENTIALS',
          authMethod: 'jwt'
        })
      )
    })

    it('should record token validation metrics', async () => {
      // First authenticate to get a token
      const loginRequest: AuthRequest = {
        provider: 'jwt',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      }

      const loginResult = await authService.authenticate(loginRequest)
      expect(loginResult.success).toBe(true)

      // Clear previous calls
      mockLogger.info.mockClear?.()

      // Validate the token
      const session = await authService.validateSession(loginResult.tokens!.accessToken)

      expect(session).toBeDefined()
      expect(session!.userId).toBe('test-user-id')

      // Check that monitoring was called for token validation
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'validate_token',
          status: 'success',
          authMethod: 'jwt'
        })
      )
    })

    it('should record token refresh metrics', async () => {
      // First authenticate to get tokens
      const loginRequest: AuthRequest = {
        provider: 'jwt',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      }

      const loginResult = await authService.authenticate(loginRequest)
      expect(loginResult.success).toBe(true)

      // Clear previous calls
      mockLogger.info.mockClear?.()

      // Refresh the token
      const refreshedSession = await authService.refreshToken(loginResult.tokens!.refreshToken)

      expect(refreshedSession).toBeDefined()
      expect(refreshedSession!.userId).toBe('test-user-id')

      // Check that monitoring was called for token refresh
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'refresh_token',
          status: 'success',
          authMethod: 'jwt'
        })
      )
    })

    it('should record session revocation metrics', async () => {
      // First authenticate to get a session
      const loginRequest: AuthRequest = {
        provider: 'jwt',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      }

      const loginResult = await authService.authenticate(loginRequest)
      expect(loginResult.success).toBe(true)

      // Get session ID from token payload
      const token = loginResult.tokens!.accessToken
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      const sessionId = payload.jti

      // Clear previous calls
      mockLogger.info.mockClear?.()

      // Revoke the session
      const result = await authService.revokeSession(sessionId)

      expect(result).toBe(true)

      // Check that monitoring was called for session revocation
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'session_destroy',
          status: 'success',
          authMethod: 'jwt'
        })
      )
    })

    it('should record metrics for invalid token validation', async () => {
      const invalidToken = 'invalid.token.here'

      const session = await authService.validateSession(invalidToken)

      expect(session).toBe(null)

      // Check that monitoring was called for failed validation
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'validate_token',
          status: 'error',
          authMethod: 'jwt'
        })
      )
    })

    it('should record metrics for invalid refresh token', async () => {
      const invalidRefreshToken = 'invalid-refresh-token'

      const session = await authService.refreshToken(invalidRefreshToken)

      expect(session).toBe(null)

      // Check that monitoring was called for failed refresh
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'refresh_token',
          status: 'failure',
          errorCode: 'REFRESH_TOKEN_NOT_FOUND',
          authMethod: 'jwt'
        })
      )
    })
  })

  describe('Performance Metrics Collection', () => {
    it('should collect timing data for authentication operations', async () => {
      const request: AuthRequest = {
        provider: 'jwt',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      }

      const startTime = Date.now()
      await authService.authenticate(request)
      const endTime = Date.now()

      // Check that duration was recorded
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'login',
          status: 'success',
          duration: expect.any(Number)
        })
      )

      // Get the recorded duration
      const recordedCall = mockLogger.info.mock.calls.find(
        (call: any) => call[0] === 'Auth performance metric recorded'
      )
      const recordedDuration = recordedCall[1].duration

      // Duration should be reasonable (between 0 and elapsed time)
      expect(recordedDuration).toBeGreaterThanOrEqual(0)
      expect(recordedDuration).toBeLessThanOrEqual(endTime - startTime)
    })

    it('should include user and session context in metrics', async () => {
      const request: AuthRequest = {
        provider: 'jwt',
        credentials: {
          email: 'test@example.com',
          password: 'password123'
        }
      }

      const result = await authService.authenticate(request)
      expect(result.success).toBe(true)

      // Check that user ID and session ID were recorded
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auth performance metric recorded',
        expect.objectContaining({
          operation: 'login',
          status: 'success',
          userId: 'test-user-id',
          sessionId: expect.any(String),
          authMethod: 'jwt'
        })
      )
    })

    it('should handle authentication errors gracefully', async () => {
      const request: AuthRequest = {
        provider: 'jwt',
        credentials: {
          email: 'test@example.com',
          password: 'wrong-password'
        }
      }

      const result = await authService.authenticate(request)
      expect(result.success).toBe(false)

      // Check that error was recorded with proper context
      const performanceLogCalls = (mockLogger.info as any).mock.calls.filter(
        (call: any) => call[0] === 'Auth performance metric recorded'
      )
      
      expect(performanceLogCalls.length).toBeGreaterThan(0)
      expect(performanceLogCalls[performanceLogCalls.length - 1][1]).toMatchObject({
        operation: 'login',
        status: 'failure',
        errorCode: 'INVALID_CREDENTIALS',
        authMethod: 'jwt'
      })
    })
  })
})