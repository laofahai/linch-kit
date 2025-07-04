import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { hostname } from 'os'

import { LinchKitLogger, createLogger, logger } from '../../observability/logger'
import type { Logger, LogLevel } from '../../types'

// Mock pino
const mockPinoLogger = {
  debug: mock(),
  info: mock(),
  warn: mock(),
  error: mock(),
  fatal: mock(),
  child: mock(),
  level: 'info' as LogLevel
}

const mockPino = mock().mockReturnValue(mockPinoLogger)
const mockPinoDestination = mock()
const mockPinoTransport = mock()

mock.module('pino', () => {
  const pinoModule = {
    default: mockPino,
    destination: mockPinoDestination,
    transport: mockPinoTransport,
    stdTimeFunctions: {
      isoTime: () => '"2023-01-01T00:00:00.000Z"'
    }
  }
  // Attach functions to the default export too
  mockPino.stdTimeFunctions = pinoModule.stdTimeFunctions
  mockPino.destination = mockPinoDestination
  mockPino.transport = mockPinoTransport
  return pinoModule
})

describe('Logger System', () => {
  beforeEach(() => {
    // Clear all mocks
    mockPino.mockClear()
    mockPinoDestination.mockClear()
    mockPinoTransport.mockClear()
    mockPinoLogger.debug.mockClear()
    mockPinoLogger.info.mockClear()
    mockPinoLogger.warn.mockClear()
    mockPinoLogger.error.mockClear()
    mockPinoLogger.fatal.mockClear()
    mockPinoLogger.child.mockClear()
    mockPinoLogger.level = 'info'
  })

  afterEach(() => {
    // Mocks are automatically restored by Bun
  })

  describe('LinchKitLogger', () => {
    let linchLogger: Logger

    beforeEach(() => {
      linchLogger = new LinchKitLogger(mockPinoLogger as any)
    })

    describe('Log Level Methods', () => {
      it('should log debug messages', () => {
        const message = 'Debug message'
        const data = { userId: 123 }

        linchLogger.debug(message, data)

        expect(mockPinoLogger.debug).toHaveBeenCalledWith(data, message)
      })

      it('should log debug messages without data', () => {
        const message = 'Debug message'

        linchLogger.debug(message)

        expect(mockPinoLogger.debug).toHaveBeenCalledWith(undefined, message)
      })

      it('should log info messages', () => {
        const message = 'Info message'
        const data = { requestId: 'req123' }

        linchLogger.info(message, data)

        expect(mockPinoLogger.info).toHaveBeenCalledWith(data, message)
      })

      it('should log warn messages', () => {
        const message = 'Warning message'
        const data = { warning: true }

        linchLogger.warn(message, data)

        expect(mockPinoLogger.warn).toHaveBeenCalledWith(data, message)
      })

      it('should log error messages with error object', () => {
        const message = 'Error occurred'
        const error = new Error('Test error')
        const data = { context: 'test' }

        linchLogger.error(message, error, data)

        expect(mockPinoLogger.error).toHaveBeenCalledWith({
          ...data,
          error: {
            message: error.message,
            stack: error.stack
          }
        }, message)
      })

      it('should log error messages without error object', () => {
        const message = 'Error occurred'
        const data = { context: 'test' }

        linchLogger.error(message, undefined, data)

        expect(mockPinoLogger.error).toHaveBeenCalledWith(data, message)
      })

      it('should log fatal messages with error object', () => {
        const message = 'Fatal error'
        const error = new Error('Fatal test error')
        const data = { critical: true }

        linchLogger.fatal(message, error, data)

        expect(mockPinoLogger.fatal).toHaveBeenCalledWith({
          ...data,
          error: {
            message: error.message,
            stack: error.stack
          }
        }, message)
      })

      it('should log fatal messages without error object', () => {
        const message = 'Fatal error'
        const data = { critical: true }

        linchLogger.fatal(message, undefined, data)

        expect(mockPinoLogger.fatal).toHaveBeenCalledWith(data, message)
      })
    })

    describe('Child Logger', () => {
      it('should create child logger with bindings', () => {
        const bindings = { module: 'auth', version: '1.0.0' }
        const mockChildLogger = { ...mockPinoLogger }
        mockPinoLogger.child.mockReturnValue(mockChildLogger)

        const childLogger = linchLogger.child(bindings)

        expect(mockPinoLogger.child).toHaveBeenCalledWith(bindings)
        expect(childLogger).toBeInstanceOf(LinchKitLogger)
      })
    })

    describe('Log Level Management', () => {
      it('should set log level', () => {
        const level: LogLevel = 'debug'
        
        linchLogger.setLevel(level)

        expect(mockPinoLogger.level).toBe(level)
      })

      it('should get current log level', () => {
        mockPinoLogger.level = 'warn'

        const level = linchLogger.getLevel()

        expect(level).toBe('warn')
      })
    })
  })

  describe('createLogger Factory', () => {
    it('should create logger with default configuration', () => {
      createLogger()

      expect(mockPino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          name: 'linchkit',
          redact: ['password', 'token', 'secret', 'authorization'],
          base: expect.objectContaining({
            pid: process.pid,
            hostname: hostname()
          })
        })
      )
    })

    it('should create logger with custom configuration', () => {
      const config = {
        level: 'debug' as LogLevel,
        name: 'custom-app',
        redact: ['custom-secret'],
        base: { appVersion: '1.0.0' }
      }

      createLogger(config)

      expect(mockPino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
          name: 'custom-app',
          redact: ['custom-secret'],
          base: { appVersion: '1.0.0' }
        })
      )
    })

    it('should create logger with pretty print in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      createLogger({ prettyPrint: true })

      expect(mockPinoTransport).toHaveBeenCalledWith({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname'
        }
      })

      process.env.NODE_ENV = originalEnv
    })

    it('should create logger with custom destination', () => {
      const destination = '/var/log/app.log'
      mockPinoDestination.mockReturnValue('mock-destination')

      createLogger({ destination })

      expect(mockPinoDestination).toHaveBeenCalledWith(destination)
      expect(mockPino).toHaveBeenCalledWith(
        expect.any(Object),
        'mock-destination'
      )
    })

    it('should create logger with custom serializers', () => {
      const serializers = {
        user: (user: any) => ({ id: user.id, name: user.name })
      }

      createLogger({ serializers })

      expect(mockPino).toHaveBeenCalledWith(
        expect.objectContaining({
          serializers
        })
      )
    })

    it('should use pretty print when explicitly enabled', () => {
      createLogger({ prettyPrint: true })

      expect(mockPinoTransport).toHaveBeenCalled()
    })

    it('should not use pretty print when explicitly disabled', () => {
      createLogger({ prettyPrint: false })

      expect(mockPinoTransport).not.toHaveBeenCalled()
    })

    it('should handle production environment correctly', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      createLogger()

      expect(mockPinoTransport).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Default Logger Instance', () => {
    it('should export a default logger instance', () => {
      expect(logger).toBeDefined()
      expect(logger).toBeInstanceOf(LinchKitLogger)
    })

    it('should create default logger with core name', () => {
      // The logger is created during module import, so we can't directly test the call
      // But we can verify it exists and has the expected interface
      expect(typeof logger.debug).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.fatal).toBe('function')
      expect(typeof logger.child).toBe('function')
      expect(typeof logger.setLevel).toBe('function')
      expect(typeof logger.getLevel).toBe('function')
    })
  })

  describe('Logger Configuration Options', () => {
    it('should handle all log levels', () => {
      const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
      
      levels.forEach(level => {
        createLogger({ level })
        
        expect(mockPino).toHaveBeenCalledWith(
          expect.objectContaining({ level })
        )
      })
    })

    it('should handle empty configuration', () => {
      createLogger({})

      expect(mockPino).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          name: 'linchkit'
        })
      )
    })

    it('should preserve custom base properties', () => {
      const customBase = {
        service: 'api',
        version: '2.0.0',
        env: 'staging'
      }

      createLogger({ base: customBase })

      expect(mockPino).toHaveBeenCalledWith(
        expect.objectContaining({
          base: customBase
        })
      )
    })

    it('should include standard formatters', () => {
      createLogger()

      const [pinoOptions] = mockPino.mock.calls[mockPino.mock.calls.length - 1]
      
      expect(pinoOptions.formatters).toBeDefined()
      expect(typeof pinoOptions.formatters.level).toBe('function')
      expect(typeof pinoOptions.formatters.log).toBe('function')
    })

    it('should include timestamp formatter', () => {
      createLogger()

      const [pinoOptions] = mockPino.mock.calls[mockPino.mock.calls.length - 1]
      
      expect(pinoOptions.timestamp).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle undefined error in error method', () => {
      const linchLogger = new LinchKitLogger(mockPinoLogger as any)
      const message = 'Error message'
      
      linchLogger.error(message, undefined)

      expect(mockPinoLogger.error).toHaveBeenCalledWith(undefined, message)
    })

    it('should handle undefined error in fatal method', () => {
      const linchLogger = new LinchKitLogger(mockPinoLogger as any)
      const message = 'Fatal message'
      
      linchLogger.fatal(message, undefined)

      expect(mockPinoLogger.fatal).toHaveBeenCalledWith(undefined, message)
    })

    it('should handle error with no stack trace', () => {
      const linchLogger = new LinchKitLogger(mockPinoLogger as any)
      const message = 'Error message'
      const error = new Error('Test error')
      delete error.stack
      
      linchLogger.error(message, error)

      expect(mockPinoLogger.error).toHaveBeenCalledWith({
        error: {
          message: error.message,
          stack: undefined
        }
      }, message)
    })
  })
})