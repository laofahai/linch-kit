import { describe, it, expect } from 'vitest'
import { defineField } from '../core/field'

describe('Field System', () => {
  describe('String Fields', () => {
    it('should create basic string field', () => {
      const field = defineField.string()
      expect(field.type).toBe('string')
      expect(field.isRequired).toBe(false)
    })

    it('should create required string field', () => {
      const field = defineField.string().required()
      expect(field.isRequired).toBe(true)
    })

    it('should create string field with min length', () => {
      const field = defineField.string().min(5)
      expect(field.minLength).toBe(5)
    })

    it('should create string field with max length', () => {
      const field = defineField.string().max(100)
      expect(field.maxLength).toBe(100)
    })

    it('should create string field with pattern', () => {
      const pattern = /^[a-zA-Z]+$/
      const field = defineField.string().pattern(pattern)
      expect(field.regexPattern).toBe(pattern)
    })

    it('should create unique string field', () => {
      const field = defineField.string().unique()
      expect(field.isUnique).toBe(true)
    })

    it('should create indexed string field', () => {
      const field = defineField.string().index()
      expect(field.hasIndex).toBe(true)
    })

    it('should create string field with default value', () => {
      const field = defineField.string().default('test')
      expect(field.defaultValue).toBe('test')
    })

    it('should support method chaining', () => {
      const field = defineField.string()
        .required()
        .min(3)
        .max(50)
        .unique()
        .index()
        .default('default')
      
      expect(field.isRequired).toBe(true)
      expect(field.minLength).toBe(3)
      expect(field.maxLength).toBe(50)
      expect(field.isUnique).toBe(true)
      expect(field.hasIndex).toBe(true)
      expect(field.defaultValue).toBe('default')
    })
  })

  describe('Number Fields', () => {
    it('should create basic number field', () => {
      const field = defineField.number()
      expect(field.type).toBe('number')
      expect(field.required).toBe(false)
    })

    it('should create required number field', () => {
      const field = defineField.number().required()
      expect(field.required).toBe(true)
    })

    it('should create number field with min value', () => {
      const field = defineField.number().min(0)
      expect(field.min).toBe(0)
    })

    it('should create number field with max value', () => {
      const field = defineField.number().max(100)
      expect(field.max).toBe(100)
    })

    it('should create integer field', () => {
      const field = defineField.number().integer()
      expect(field.integer).toBe(true)
    })

    it('should create positive number field', () => {
      const field = defineField.number().positive()
      expect(field.positive).toBe(true)
    })

    it('should create number field with precision', () => {
      const field = defineField.number().precision(2)
      expect(field.precision).toBe(2)
    })
  })

  describe('Boolean Fields', () => {
    it('should create basic boolean field', () => {
      const field = defineField.boolean()
      expect(field.type).toBe('boolean')
    })

    it('should create boolean field with default value', () => {
      const field = defineField.boolean().default(true)
      expect(field.defaultValue).toBe(true)
    })
  })

  describe('Date Fields', () => {
    it('should create basic date field', () => {
      const field = defineField.date()
      expect(field.type).toBe('date')
    })

    it('should create date field with min date', () => {
      const minDate = new Date('2023-01-01')
      const field = defineField.date().min(minDate)
      expect(field.min).toBe(minDate)
    })

    it('should create date field with max date', () => {
      const maxDate = new Date('2023-12-31')
      const field = defineField.date().max(maxDate)
      expect(field.max).toBe(maxDate)
    })
  })

  describe('Email Fields', () => {
    it('should create email field', () => {
      const field = defineField.email()
      expect(field.type).toBe('email')
    })

    it('should create required email field', () => {
      const field = defineField.email().required()
      expect(field.required).toBe(true)
    })
  })

  describe('URL Fields', () => {
    it('should create URL field', () => {
      const field = defineField.url()
      expect(field.type).toBe('url')
    })
  })

  describe('UUID Fields', () => {
    it('should create UUID field', () => {
      const field = defineField.uuid()
      expect(field.type).toBe('uuid')
    })

    it('should create UUID field with auto generation', () => {
      const field = defineField.uuid().auto()
      expect(field.auto).toBe(true)
    })
  })

  describe('JSON Fields', () => {
    it('should create JSON field', () => {
      const field = defineField.json()
      expect(field.type).toBe('json')
    })
  })

  describe('Text Fields', () => {
    it('should create text field', () => {
      const field = defineField.text()
      expect(field.type).toBe('text')
    })
  })

  describe('Enum Fields', () => {
    it('should create enum field', () => {
      const field = defineField.enum(['active', 'inactive'])
      expect(field.type).toBe('enum')
      expect(field.values).toEqual(['active', 'inactive'])
    })
  })

  describe('Array Fields', () => {
    it('should create array field', () => {
      const itemField = defineField.string()
      const field = defineField.array(itemField)
      expect(field.type).toBe('array')
      expect(field.items).toBe(itemField)
    })
  })

  describe('Relation Fields', () => {
    it('should create relation field', () => {
      const field = defineField.relation('User')
      expect(field.type).toBe('relation')
      expect(field.target).toBe('User')
    })

    it('should create one-to-many relation', () => {
      const field = defineField.relation('User').oneToMany()
      expect(field.relationType).toBe('oneToMany')
    })

    it('should create many-to-one relation', () => {
      const field = defineField.relation('User').manyToOne()
      expect(field.relationType).toBe('manyToOne')
    })

    it('should create many-to-many relation', () => {
      const field = defineField.relation('User').manyToMany()
      expect(field.relationType).toBe('manyToMany')
    })
  })

  describe('I18n Fields', () => {
    it('should create i18n field', () => {
      const field = defineField.i18n()
      expect(field.type).toBe('i18n')
    })

    it('should create i18n field with locales', () => {
      const field = defineField.i18n(['en', 'zh-CN'])
      expect(field.locales).toEqual(['en', 'zh-CN'])
    })
  })
})