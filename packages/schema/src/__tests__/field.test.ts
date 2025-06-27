/**
 * @linch-kit/schema 字段系统测试
 */

import { describe, it, expect } from 'vitest'

import { defineField } from '../core/field'

describe('Field System', () => {
  describe('String Fields', () => {
    it('should create basic string field', () => {
      const field = defineField.string()
      expect(field.build().type).toBe('string')
    })

    it('should create required string field', () => {
      const field = defineField.string().required()
      const definition = field.build()
      expect(definition.required).toBe(true)
    })

    it('should create string field with length constraints', () => {
      const field = defineField.string().min(2).max(50)
      const definition = field.build()
      expect(definition.min).toBe(2)
      expect(definition.max).toBe(50)
    })

    it('should create unique string field', () => {
      const field = defineField.string().unique()
      const definition = field.build()
      expect(definition.unique).toBe(true)
    })

    it('should create indexed string field', () => {
      const field = defineField.string().index()
      const definition = field.build()
      expect(definition.index).toBe(true)
    })
  })

  describe('Number Fields', () => {
    it('should create basic number field', () => {
      const field = defineField.number()
      expect(field.build().type).toBe('number')
    })

    it('should create required number field', () => {
      const field = defineField.number().required()
      const definition = field.build()
      expect(definition.required).toBe(true)
    })

    it('should create number field with range constraints', () => {
      const field = defineField.number().min(0).max(100)
      const definition = field.build()
      expect(definition.min).toBe(0)
      expect(definition.max).toBe(100)
    })

    it('should create integer field', () => {
      const field = defineField.number().setInteger()
      const definition = field.build()
      expect(definition.integer).toBe(true)
    })

    it('should create number field with precision', () => {
      const field = defineField.number().precision(2)
      const definition = field.build()
      expect(definition.precision).toBe(2)
    })
  })

  describe('Boolean Fields', () => {
    it('should create basic boolean field', () => {
      const field = defineField.boolean()
      expect(field.build().type).toBe('boolean')
    })

    it('should create required boolean field', () => {
      const field = defineField.boolean().required()
      const definition = field.build()
      expect(definition.required).toBe(true)
    })
  })

  describe('Date Fields', () => {
    it('should create basic date field', () => {
      const field = defineField.date()
      expect(field.build().type).toBe('date')
    })

    it('should create required date field', () => {
      const field = defineField.date().required()
      const definition = field.build()
      expect(definition.required).toBe(true)
    })
  })

  describe('Email Fields', () => {
    it('should create email field', () => {
      const field = defineField.email()
      expect(field.build().type).toBe('email')
    })

    it('should create required email field', () => {
      const field = defineField.email().required()
      const definition = field.build()
      expect(definition.required).toBe(true)
    })
  })

  describe('URL Fields', () => {
    it('should create URL field', () => {
      const field = defineField.url()
      expect(field.build().type).toBe('url')
    })
  })

  describe('UUID Fields', () => {
    it('should create UUID field', () => {
      const field = defineField.uuid()
      expect(field.build().type).toBe('uuid')
    })

    it('should create auto-generated UUID field', () => {
      const field = defineField.uuid().auto()
      const definition = field.build()
      expect(definition.auto).toBe(true)
    })
  })

  describe('JSON Fields', () => {
    it('should create JSON field', () => {
      const field = defineField.json()
      expect(field.build().type).toBe('json')
    })
  })

  describe('Text Fields', () => {
    it('should create text field', () => {
      const field = defineField.text()
      expect(field.build().type).toBe('text')
    })
  })

  describe('Enum Fields', () => {
    it('should create enum field', () => {
      const field = defineField.enum(['active', 'inactive', 'pending'])
      const definition = field.build()
      expect(definition.type).toBe('enum')
      expect(definition.values).toEqual(['active', 'inactive', 'pending'])
    })
  })

  describe('Array Fields', () => {
    it('should create array field', () => {
      const itemField = defineField.string()
      const field = defineField.array(itemField.build())
      expect(field.build().type).toBe('array')
    })
  })

  describe('Relation Fields', () => {
    it('should create relation field', () => {
      const field = defineField.relation('User')
      const definition = field.build()
      expect(definition.type).toBe('relation')
      expect(definition.target).toBe('User')
    })
  })

  describe('I18n Fields', () => {
    it('should create i18n field', () => {
      const field = defineField.i18n(['en', 'zh-CN'])
      const definition = field.build()
      expect(definition.type).toBe('i18n')
      expect(definition.locales).toEqual(['en', 'zh-CN'])
    })

    it('should create i18n field with default locales', () => {
      const field = defineField.i18n()
      const definition = field.build()
      expect(definition.locales).toEqual(['en', 'zh-CN'])
    })
  })
})
