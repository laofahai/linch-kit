/**
 * @linch-kit/schema Validation Validator 测试套件
 */

import { describe, it, expect, mock } from 'bun:test'
import { SchemaValidator } from '../validation/validator'

describe('SchemaValidator', () => {
  describe('基础功能', () => {
    it('应该创建验证器实例', () => {
      const validator = new SchemaValidator()
      expect(validator).toBeInstanceOf(SchemaValidator)
    })

    it('应该有validate方法', () => {
      const validator = new SchemaValidator()
      expect(typeof validator.validate).toBe('function')
    })
  })

  describe('验证功能', () => {
    it('应该验证简单对象并返回true', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      const schema = { name: 'string', age: 'number' }
      const result = validator.validate(schema)

      expect(result).toBe(true)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', schema)

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该验证复杂对象', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      const complexSchema = {
        name: 'string',
        age: 'number',
        address: {
          street: 'string',
          city: 'string',
        },
        tags: ['string'],
      }

      const result = validator.validate(complexSchema)

      expect(result).toBe(true)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', complexSchema)

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该验证基础类型', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      expect(validator.validate('string')).toBe(true)
      expect(validator.validate(42)).toBe(true)
      expect(validator.validate(true)).toBe(true)
      expect(validator.validate(false)).toBe(true)

      expect(logMock).toHaveBeenCalledTimes(4)

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该验证数组', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      const arraySchema = [1, 2, 3]
      const result = validator.validate(arraySchema)

      expect(result).toBe(true)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', arraySchema)

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该验证null和undefined', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      expect(validator.validate(null)).toBe(true)
      expect(validator.validate(undefined)).toBe(true)

      expect(logMock).toHaveBeenCalledWith('验证 schema:', null)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', undefined)

      // 恢复原始 console.log
      console.log = originalLog
    })
  })

  describe('边缘情况', () => {
    it('应该验证空对象', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      const result = validator.validate({})

      expect(result).toBe(true)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', {})

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该验证空数组', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      const result = validator.validate([])

      expect(result).toBe(true)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', [])

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该验证函数', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      const func = () => {}
      const result = validator.validate(func)

      expect(result).toBe(true)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', func)

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该验证Symbol', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      const symbol = Symbol('test')
      const result = validator.validate(symbol)

      expect(result).toBe(true)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', symbol)

      // 恢复原始 console.log
      console.log = originalLog
    })

    it('应该验证Date对象', () => {
      const validator = new SchemaValidator()

      // Mock console.log
      const originalLog = console.log
      const logMock = mock()
      console.log = logMock

      const date = new Date()
      const result = validator.validate(date)

      expect(result).toBe(true)
      expect(logMock).toHaveBeenCalledWith('验证 schema:', date)

      // 恢复原始 console.log
      console.log = originalLog
    })
  })

  describe('返回值验证', () => {
    it('总是返回true', () => {
      const validator = new SchemaValidator()

      // 测试多种输入都返回true
      expect(validator.validate(null)).toBe(true)
      expect(validator.validate(undefined)).toBe(true)
      expect(validator.validate('')).toBe(true)
      expect(validator.validate(0)).toBe(true)
      expect(validator.validate(false)).toBe(true)
      expect(validator.validate([])).toBe(true)
      expect(validator.validate({})).toBe(true)
    })
  })
})