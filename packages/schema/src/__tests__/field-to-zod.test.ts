/**
 * @linch-kit/schema fieldToZod 转换功能测试
 * 
 * 测试 fieldToZod 函数将字段定义转换为 Zod Schema 的功能
 */

import { describe, it, expect } from 'bun:test'
import { z } from 'zod'

import { fieldToZod } from '../core/field'
import type { 
  FieldDefinition, 
  StringFieldOptions, 
  NumberFieldOptions, 
  BooleanFieldOptions,
  DateFieldOptions,
  EnumFieldOptions,
  ArrayFieldOptions,
  RelationFieldOptions
} from '../types'

describe('fieldToZod Conversion', () => {
  describe('String Fields', () => {
    it('should convert basic string field', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('test')).toBe('test')
      expect(() => schema.parse(123)).toThrow()
      expect(() => schema.parse(null)).toThrow()
    })

    it('should handle optional string field', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: false
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('test')).toBe('test')
      expect(schema.parse(undefined)).toBeUndefined()
    })

    it('should handle string field with minLength', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true,
        minLength: 3
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('test')).toBe('test')
      expect(() => schema.parse('ab')).toThrow()
    })

    it('should handle string field with maxLength', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true,
        maxLength: 5
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('test')).toBe('test')
      expect(() => schema.parse('toolong')).toThrow()
    })

    it('should handle string field with pattern (string)', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true,
        pattern: '^[a-zA-Z]+$'
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('test')).toBe('test')
      expect(() => schema.parse('test123')).toThrow()
    })

    it('should handle string field with pattern (RegExp)', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true,
        pattern: /^[a-zA-Z]+$/
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('test')).toBe('test')
      expect(() => schema.parse('test123')).toThrow()
    })

    it('should handle string field with transform', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true,
        transform: (value: string) => value.toUpperCase()
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('test')).toBe('TEST')
    })

    it('should handle string field with defaultValue', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: false,
        defaultValue: 'default'
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(undefined)).toBe('default')
      expect(schema.parse('custom')).toBe('custom')
    })
  })

  describe('Email Fields', () => {
    it('should convert email field', () => {
      const field: FieldDefinition = {
        type: 'email',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('test@example.com')).toBe('test@example.com')
      expect(() => schema.parse('invalid-email')).toThrow()
    })
  })

  describe('URL Fields', () => {
    it('should convert url field', () => {
      const field: FieldDefinition = {
        type: 'url',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('https://example.com')).toBe('https://example.com')
      expect(() => schema.parse('invalid-url')).toThrow()
    })
  })

  describe('UUID Fields', () => {
    it('should convert uuid field', () => {
      const field: FieldDefinition = {
        type: 'uuid',
        required: true
      }
      const schema = fieldToZod(field)
      
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(schema.parse(validUuid)).toBe(validUuid)
      expect(() => schema.parse('invalid-uuid')).toThrow()
    })
  })

  describe('Text Fields', () => {
    it('should convert text field', () => {
      const field: FieldDefinition = {
        type: 'text',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('long text content')).toBe('long text content')
      expect(() => schema.parse(123)).toThrow()
    })
  })

  describe('Number Fields', () => {
    it('should convert basic number field', () => {
      const field: NumberFieldOptions = {
        type: 'number',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(123)).toBe(123)
      expect(schema.parse(123.45)).toBe(123.45)
      expect(() => schema.parse('123')).toThrow()
    })

    it('should handle number field with min', () => {
      const field: NumberFieldOptions = {
        type: 'number',
        required: true,
        min: 10
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(15)).toBe(15)
      expect(() => schema.parse(5)).toThrow()
    })

    it('should handle number field with max', () => {
      const field: NumberFieldOptions = {
        type: 'number',
        required: true,
        max: 100
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(50)).toBe(50)
      expect(() => schema.parse(150)).toThrow()
    })

    it('should handle integer number field', () => {
      const field: NumberFieldOptions = {
        type: 'number',
        required: true,
        integer: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(123)).toBe(123)
      expect(() => schema.parse(123.45)).toThrow()
    })

    it('should handle positive number field', () => {
      const field: NumberFieldOptions = {
        type: 'number',
        required: true,
        positive: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(1)).toBe(1)
      expect(() => schema.parse(-1)).toThrow()
      expect(() => schema.parse(0)).toThrow()
    })

    it('should handle negative number field', () => {
      const field: NumberFieldOptions = {
        type: 'number',
        required: true,
        negative: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(-1)).toBe(-1)
      expect(() => schema.parse(1)).toThrow()
      expect(() => schema.parse(0)).toThrow()
    })

    it('should handle combined number constraints', () => {
      const field: NumberFieldOptions = {
        type: 'number',
        required: true,
        min: 10,
        max: 100,
        integer: true,
        positive: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(50)).toBe(50)
      expect(() => schema.parse(5)).toThrow() // below min
      expect(() => schema.parse(150)).toThrow() // above max
      expect(() => schema.parse(50.5)).toThrow() // not integer
      expect(() => schema.parse(-50)).toThrow() // not positive
    })
  })

  describe('Boolean Fields', () => {
    it('should convert boolean field', () => {
      const field: BooleanFieldOptions = {
        type: 'boolean',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse(false)).toBe(false)
      expect(() => schema.parse('true')).toThrow()
      expect(() => schema.parse(1)).toThrow()
    })

    it('should handle optional boolean field', () => {
      const field: BooleanFieldOptions = {
        type: 'boolean',
        required: false
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse(undefined)).toBeUndefined()
    })

    it('should handle boolean field with default', () => {
      const field: BooleanFieldOptions = {
        type: 'boolean',
        required: false,
        defaultValue: false
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(undefined)).toBe(false)
      expect(schema.parse(true)).toBe(true)
    })
  })

  describe('Date Fields', () => {
    it('should convert basic date field', () => {
      const field: DateFieldOptions = {
        type: 'date',
        required: true
      }
      const schema = fieldToZod(field)
      
      const date = new Date()
      expect(schema.parse(date)).toBe(date)
      expect(() => schema.parse('2023-01-01')).toThrow()
    })

    it('should handle date field with min', () => {
      const minDate = new Date('2023-01-01')
      const field: DateFieldOptions = {
        type: 'date',
        required: true,
        min: minDate
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(new Date('2023-06-01'))).toEqual(new Date('2023-06-01'))
      expect(() => schema.parse(new Date('2022-01-01'))).toThrow()
    })

    it('should handle date field with max', () => {
      const maxDate = new Date('2023-12-31')
      const field: DateFieldOptions = {
        type: 'date',
        required: true,
        max: maxDate
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(new Date('2023-06-01'))).toEqual(new Date('2023-06-01'))
      expect(() => schema.parse(new Date('2024-01-01'))).toThrow()
    })

    it('should handle date field with min and max', () => {
      const minDate = new Date('2023-01-01')
      const maxDate = new Date('2023-12-31')
      const field: DateFieldOptions = {
        type: 'date',
        required: true,
        min: minDate,
        max: maxDate
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(new Date('2023-06-01'))).toEqual(new Date('2023-06-01'))
      expect(() => schema.parse(new Date('2022-01-01'))).toThrow()
      expect(() => schema.parse(new Date('2024-01-01'))).toThrow()
    })
  })

  describe('Enum Fields', () => {
    it('should convert enum field', () => {
      const field: EnumFieldOptions = {
        type: 'enum',
        required: true,
        values: ['active', 'inactive', 'pending']
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('active')).toBe('active')
      expect(schema.parse('inactive')).toBe('inactive')
      expect(schema.parse('pending')).toBe('pending')
      expect(() => schema.parse('invalid')).toThrow()
    })

    it('should handle optional enum field', () => {
      const field: EnumFieldOptions = {
        type: 'enum',
        required: false,
        values: ['active', 'inactive']
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('active')).toBe('active')
      expect(schema.parse(undefined)).toBeUndefined()
    })

    it('should handle enum field with default', () => {
      const field: EnumFieldOptions = {
        type: 'enum',
        required: false,
        values: ['active', 'inactive'],
        defaultValue: 'inactive'
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(undefined)).toBe('inactive')
      expect(schema.parse('active')).toBe('active')
    })
  })

  describe('Array Fields', () => {
    it('should convert array field with string items', () => {
      const field: ArrayFieldOptions = {
        type: 'array',
        required: true,
        items: {
          type: 'string',
          required: true
        }
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
      expect(() => schema.parse([1, 2, 3])).toThrow()
      expect(() => schema.parse('not-array')).toThrow()
    })

    it('should convert array field with number items', () => {
      const field: ArrayFieldOptions = {
        type: 'array',
        required: true,
        items: {
          type: 'number',
          required: true
        }
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3])
      expect(() => schema.parse(['a', 'b', 'c'])).toThrow()
    })

    it('should handle array field with min length', () => {
      const field: ArrayFieldOptions = {
        type: 'array',
        required: true,
        min: 2,
        items: {
          type: 'string',
          required: true
        }
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(['a', 'b'])).toEqual(['a', 'b'])
      expect(() => schema.parse(['a'])).toThrow()
    })

    it('should handle array field with max length', () => {
      const field: ArrayFieldOptions = {
        type: 'array',
        required: true,
        max: 3,
        items: {
          type: 'string',
          required: true
        }
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
      expect(() => schema.parse(['a', 'b', 'c', 'd'])).toThrow()
    })

    it('should handle nested array field', () => {
      const field: ArrayFieldOptions = {
        type: 'array',
        required: true,
        items: {
          type: 'array',
          required: true,
          items: {
            type: 'string',
            required: true
          }
        }
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse([['a', 'b'], ['c', 'd']])).toEqual([['a', 'b'], ['c', 'd']])
      expect(() => schema.parse([['a', 'b'], [1, 2]])).toThrow()
    })
  })

  describe('JSON Fields', () => {
    it('should convert json field', () => {
      const field: FieldDefinition = {
        type: 'json',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse({ key: 'value' })).toEqual({ key: 'value' })
      expect(schema.parse({ nested: { key: 'value' } })).toEqual({ nested: { key: 'value' } })
      expect(schema.parse({})).toEqual({})
    })

    it('should handle optional json field', () => {
      const field: FieldDefinition = {
        type: 'json',
        required: false
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse({ key: 'value' })).toEqual({ key: 'value' })
      expect(schema.parse(undefined)).toBeUndefined()
    })
  })

  describe('Relation Fields', () => {
    it('should convert relation field', () => {
      const field: RelationFieldOptions = {
        type: 'relation',
        required: true,
        target: 'User',
        relationType: 'manyToOne'
      }
      const schema = fieldToZod(field)
      
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(schema.parse(validUuid)).toBe(validUuid)
      expect(() => schema.parse('invalid-uuid')).toThrow()
    })

    it('should handle optional relation field', () => {
      const field: RelationFieldOptions = {
        type: 'relation',
        required: false,
        target: 'User',
        relationType: 'manyToOne'
      }
      const schema = fieldToZod(field)
      
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      expect(schema.parse(validUuid)).toBe(validUuid)
      expect(schema.parse(undefined)).toBeUndefined()
    })
  })

  describe('I18n Fields', () => {
    it('should convert i18n field with locale configuration', () => {
      const field: FieldDefinition = {
        type: 'i18n',
        required: true,
        i18n: {
          locales: ['en', 'zh', 'ja'],
          required: ['en']
        }
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse({ en: 'Hello', zh: '你好' })).toEqual({ en: 'Hello', zh: '你好' })
      expect(() => schema.parse({ zh: '你好' })).toThrow() // missing required 'en'
    })

    it('should convert i18n field without locale configuration', () => {
      const field: FieldDefinition = {
        type: 'i18n',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse({ en: 'Hello', zh: '你好' })).toEqual({ en: 'Hello', zh: '你好' })
    })

    it('should handle optional i18n field', () => {
      const field: FieldDefinition = {
        type: 'i18n',
        required: false,
        i18n: {
          locales: ['en', 'zh'],
          required: []
        }
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse({ en: 'Hello' })).toEqual({ en: 'Hello' })
      expect(schema.parse(undefined)).toBeUndefined()
    })
  })

  describe('Unknown Fields', () => {
    it('should convert unknown field type to z.unknown()', () => {
      const field: FieldDefinition = {
        type: 'unknown' as any,
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('anything')).toBe('anything')
      expect(schema.parse(123)).toBe(123)
      expect(schema.parse({})).toEqual({})
    })
  })

  describe('Complex Field Configurations', () => {
    it('should handle field with multiple constraints', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 10,
        pattern: '^[a-zA-Z]+$'
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('hello')).toBe('hello')
      expect(() => schema.parse('ab')).toThrow() // too short
      expect(() => schema.parse('verylongstring')).toThrow() // too long
      expect(() => schema.parse('hello123')).toThrow() // doesn't match pattern
    })

    it('should handle optional field with default and constraints', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: false,
        defaultValue: 'default',
        minLength: 3,
        maxLength: 10
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(undefined)).toBe('default')
      expect(schema.parse('hello')).toBe('hello')
      expect(() => schema.parse('ab')).toThrow() // too short
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values for required fields', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(() => schema.parse(null)).toThrow()
    })

    it('should handle undefined values for required fields', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(() => schema.parse(undefined)).toThrow()
    })

    it('should handle empty string for required string field', () => {
      const field: StringFieldOptions = {
        type: 'string',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse('')).toBe('')
    })

    it('should handle zero for required number field', () => {
      const field: NumberFieldOptions = {
        type: 'number',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(0)).toBe(0)
    })

    it('should handle false for required boolean field', () => {
      const field: BooleanFieldOptions = {
        type: 'boolean',
        required: true
      }
      const schema = fieldToZod(field)
      
      expect(schema.parse(false)).toBe(false)
    })
  })
})