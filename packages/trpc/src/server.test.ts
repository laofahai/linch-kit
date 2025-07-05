/**
 * @linch-kit/trpc 服务器核心功能测试
 * 基于 Session 7-8 成功模式，企业级测试覆盖率
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
// import { TRPCError } from '@trpc/server'

import {
  healthRouter,
  systemRouter,
  appRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  createLinchKitContext,
  createTRPCContext,
  router,
  middleware,
  procedure,
  type TRPCRouterFactory,
  type AppRouter
} from './server'

// Mock 服务依赖
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

const mockConfig = {
  get: vi.fn((key: string) => {
    const configs: Record<string, unknown> = {
      'NODE_ENV': 'test',
      'API_KEY': 'test-api-key'
    }
    return configs[key]
  })
}

const mockServices = {
  logger: mockLogger,
  config: mockConfig
}

const mockContext = {
  user: undefined,
  services: mockServices
}

const mockAuthenticatedContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  },
  services: mockServices
}

describe('@linch-kit/trpc Server Core', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础导出和类型', () => {
    it('should export core tRPC primitives', () => {
      expect(router).toBeDefined()
      expect(middleware).toBeDefined()
      expect(procedure).toBeDefined()
      expect(publicProcedure).toBeDefined()
      expect(protectedProcedure).toBeDefined()
      expect(adminProcedure).toBeDefined()
    })

    it('should export router factories', () => {
      expect(healthRouter).toBeDefined()
      expect(systemRouter).toBeDefined()
      expect(appRouter).toBeDefined()
    })

    it('should export context creators', () => {
      expect(createLinchKitContext).toBeDefined()
      expect(createTRPCContext).toBeDefined()
      expect(typeof createLinchKitContext).toBe('function')
      expect(typeof createTRPCContext).toBe('function')
    })

    it('should have correct AppRouter type', () => {
      // 类型检查通过编译时验证
      const testRouter: AppRouter = appRouter
      expect(testRouter).toBeDefined()
    })
  })

  describe('健康检查路由器 (healthRouter)', () => {
    it('should return pong message and uptime for ping query', async () => {
      const _caller = healthRouter.createCaller(mockContext)
      const result = await _caller.ping()

      expect(result).toHaveProperty('message', 'pong')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('uptime')
      expect(typeof result.uptime).toBe('number')
      expect(typeof result.timestamp).toBe('string')
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0)
    })

    it('should return healthy status for status query', async () => {
      const _caller = healthRouter.createCaller(mockContext)
      const result = await _caller.status()

      expect(result).toHaveProperty('status', 'healthy')
      expect(result).toHaveProperty('timestamp')
      expect(typeof result.timestamp).toBe('string')
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0)
    })

    it('should validate output schema for ping', async () => {
      const _caller = healthRouter.createCaller(mockContext)
      const result = await _caller.ping()

      // 验证输出符合 Zod schema
      const schema = z.object({
        message: z.string(),
        timestamp: z.string(),
        uptime: z.number()
      })
      
      expect(() => schema.parse(result)).not.toThrow()
    })

    it('should validate output schema for status', async () => {
      const _caller = healthRouter.createCaller(mockContext)
      const result = await _caller.status()

      // 验证输出符合 Zod schema
      const schema = z.object({
        status: z.enum(['healthy', 'degraded', 'unhealthy']),
        timestamp: z.string()
      })
      
      expect(() => schema.parse(result)).not.toThrow()
    })
  })

  describe('系统信息路由器 (systemRouter)', () => {
    it('should return system info', async () => {
      const _caller = systemRouter.createCaller(mockContext)
      const result = await _caller.info()

      expect(result).toHaveProperty('name', '@linch-kit/trpc')
      expect(result).toHaveProperty('version', '0.1.0')
      expect(result).toHaveProperty('environment')
      expect(result).toHaveProperty('nodeVersion')
      expect(result).toHaveProperty('uptime')
      expect(result).toHaveProperty('timestamp')
      
      expect(typeof result.uptime).toBe('number')
      expect(typeof result.timestamp).toBe('string')
      expect(result.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/)
    })

    it('should return correct environment from NODE_ENV', async () => {
      const _caller = systemRouter.createCaller(mockContext)
      const result = await _caller.info()

      expect(result.environment).toBe('test')
    })

    it('should validate output schema for info', async () => {
      const _caller = systemRouter.createCaller(mockContext)
      const result = await _caller.info()

      const schema = z.object({
        name: z.string(),
        version: z.string(),
        environment: z.string(),
        nodeVersion: z.string(),
        uptime: z.number(),
        timestamp: z.string()
      })
      
      expect(() => schema.parse(result)).not.toThrow()
    })
  })

  describe('应用路由器 (appRouter)', () => {
    it('should combine health and system routers', async () => {
      const _caller = appRouter.createCaller(mockContext)
      
      // 测试健康检查路由
      const healthResult = await _caller.health.ping()
      expect(healthResult.message).toBe('pong')
      
      // 测试系统信息路由
      const systemResult = await _caller.system.info()
      expect(systemResult.name).toBe('@linch-kit/trpc')
    })

    it('should be accessible through nested routes', async () => {
      const _caller = appRouter.createCaller(mockContext)
      
      // 测试嵌套路由访问
      const statusResult = await _caller.health.status()
      expect(statusResult.status).toBe('healthy')
    })
  })

  describe('中间件系统', () => {
    describe('受保护过程 (protectedProcedure)', () => {
      it('should allow access with authenticated user', async () => {
        const testRouter = router({
          test: protectedProcedure.query(() => ({ success: true }))
        })
        
        const _caller = testRouter.createCaller(mockAuthenticatedContext)
        const result = await _caller.test()
        
        expect(result).toEqual({ success: true })
      })

      it('should throw error without authenticated user', async () => {
        const testRouter = router({
          test: protectedProcedure.query(() => ({ success: true }))
        })
        
        const _caller = testRouter.createCaller(mockContext)
        
        await expect(_caller.test()).rejects.toThrow('需要登录才能访问此资源')
      })

      it('should pass user context to protected procedures', async () => {
        const testRouter = router({
          test: protectedProcedure.query(({ ctx }) => ({ userId: ctx.user.id }))
        })
        
        const _caller = testRouter.createCaller(mockAuthenticatedContext)
        const result = await _caller.test()
        
        expect(result).toEqual({ userId: 'test-user-id' })
      })
    })

    describe('管理员过程 (adminProcedure)', () => {
      it('should allow access for authenticated users', async () => {
        const testRouter = router({
          test: adminProcedure.query(() => ({ isAdmin: true }))
        })
        
        const _caller = testRouter.createCaller(mockAuthenticatedContext)
        const result = await _caller.test()
        
        expect(result).toEqual({ isAdmin: true })
      })

      it('should require authentication first', async () => {
        const testRouter = router({
          test: adminProcedure.query(() => ({ isAdmin: true }))
        })
        
        const _caller = testRouter.createCaller(mockContext)
        
        await expect(_caller.test()).rejects.toThrow('需要登录才能访问此资源')
      })
    })

    describe('公共过程 (publicProcedure)', () => {
      it('should allow access without authentication', async () => {
        const testRouter = router({
          test: publicProcedure.query(() => ({ public: true }))
        })
        
        const _caller = testRouter.createCaller(mockContext)
        const result = await _caller.test()
        
        expect(result).toEqual({ public: true })
      })

      it('should work with authenticated users too', async () => {
        const testRouter = router({
          test: publicProcedure.query(() => ({ public: true }))
        })
        
        const _caller = testRouter.createCaller(mockAuthenticatedContext)
        const result = await _caller.test()
        
        expect(result).toEqual({ public: true })
      })
    })
  })

  describe('上下文创建器', () => {
    describe('createLinchKitContext', () => {
      it('should create context with provided services', async () => {
        const contextCreator = createLinchKitContext({
          services: mockServices
        })
        
        const context = await contextCreator({ req: {}, res: {} })
        
        expect(context).toHaveProperty('services')
        expect(context.services).toBe(mockServices)
        expect(context.user).toBeUndefined()
      })

      it('should return function that creates context', () => {
        const contextCreator = createLinchKitContext({
          services: mockServices
        })
        
        expect(typeof contextCreator).toBe('function')
      })
    })

    describe('createTRPCContext', () => {
      it('should create default context', async () => {
        const context = await createTRPCContext({ req: {}, res: {} })
        
        expect(context).toHaveProperty('services')
        expect(context).toHaveProperty('user')
        expect(context.user).toBeUndefined()
        expect(context.services).toHaveProperty('logger')
        expect(context.services).toHaveProperty('config')
      })

      it('should have working logger service', async () => {
        const context = await createTRPCContext({ req: {}, res: {} })
        
        // 测试日志服务可用性
        expect(typeof context.services.logger.info).toBe('function')
        expect(typeof context.services.logger.error).toBe('function')
        expect(typeof context.services.logger.warn).toBe('function')
        expect(typeof context.services.logger.debug).toBe('function')
      })

      it('should have working config service', async () => {
        const context = await createTRPCContext({ req: {}, res: {} })
        
        expect(typeof context.services.config.get).toBe('function')
      })
    })
  })

  describe('路由器工厂类型', () => {
    it('should provide correct factory types', () => {
      const factory: TRPCRouterFactory = {
        router,
        publicProcedure,
        protectedProcedure,
        adminProcedure
      }
      
      expect(factory.router).toBe(router)
      expect(factory.publicProcedure).toBe(publicProcedure)
      expect(factory.protectedProcedure).toBe(protectedProcedure)
      expect(factory.adminProcedure).toBe(adminProcedure)
    })
  })

  describe('错误处理', () => {
    it('should handle middleware errors gracefully', async () => {
      const errorMiddleware = middleware(({ next: _next }) => {
        throw new Error('Middleware error')
      })
      
      const testProcedure = procedure.use(errorMiddleware)
      const testRouter = router({
        test: testProcedure.query(() => ({ success: true }))
      })
      
      const _caller = testRouter.createCaller(mockContext)
      
      await expect(_caller.test()).rejects.toThrow('Middleware error')
    })

    it('should handle procedure errors gracefully', async () => {
      const testRouter = router({
        test: publicProcedure.query(() => {
          throw new Error('Procedure error')
        })
      })
      
      const _caller = testRouter.createCaller(mockContext)
      
      await expect(_caller.test()).rejects.toThrow('Procedure error')
    })
  })

  describe('SuperJSON 序列化支持', () => {
    it('should handle Date objects correctly', async () => {
      const testDate = new Date('2023-01-01T00:00:00.000Z')
      const testRouter = router({
        test: publicProcedure.query(() => ({ date: testDate }))
      })
      
      const _caller = testRouter.createCaller(mockContext)
      const result = await _caller.test()
      
      expect(result.date).toBeInstanceOf(Date)
      expect(result.date.getTime()).toBe(testDate.getTime())
    })

    it('should handle undefined values correctly', async () => {
      const testRouter = router({
        test: publicProcedure.query(() => ({ value: undefined }))
      })
      
      const _caller = testRouter.createCaller(mockContext)
      const result = await _caller.test()
      
      expect(result).toHaveProperty('value')
      expect(result.value).toBeUndefined()
    })
  })
})