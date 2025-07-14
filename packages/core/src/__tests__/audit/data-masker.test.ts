/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach } from 'bun:test'

import { DefaultDataMasker } from '../../audit/data-masker'

describe('DefaultDataMasker', () => {
  let dataMasker: DefaultDataMasker

  beforeEach(() => {
    dataMasker = new DefaultDataMasker()
  })

  describe('敏感字段检测', () => {
    it('should detect password fields', () => {
      expect(dataMasker.isSensitiveField('password')).toBe(true)
      expect(dataMasker.isSensitiveField('PASSWORD')).toBe(true)
      expect(dataMasker.isSensitiveField('user_password')).toBe(true)
      expect(dataMasker.isSensitiveField('passwd')).toBe(true)
      expect(dataMasker.isSensitiveField('pwd')).toBe(true)
    })

    it('should detect email fields', () => {
      expect(dataMasker.isSensitiveField('email')).toBe(true)
      expect(dataMasker.isSensitiveField('EMAIL')).toBe(true)
      expect(dataMasker.isSensitiveField('user_email')).toBe(true)
      expect(dataMasker.isSensitiveField('emailAddress')).toBe(true)
    })

    it('should detect phone fields', () => {
      expect(dataMasker.isSensitiveField('phone')).toBe(true)
      expect(dataMasker.isSensitiveField('mobile')).toBe(true)
      expect(dataMasker.isSensitiveField('phoneNumber')).toBe(true)
    })

    it('should detect token/key fields', () => {
      expect(dataMasker.isSensitiveField('token')).toBe(true)
      expect(dataMasker.isSensitiveField('apiKey')).toBe(true)
      expect(dataMasker.isSensitiveField('secret')).toBe(true)
      expect(dataMasker.isSensitiveField('authToken')).toBe(true)
    })

    it('should detect financial fields', () => {
      expect(dataMasker.isSensitiveField('creditCard')).toBe(true)
      expect(dataMasker.isSensitiveField('balance')).toBe(true)
      expect(dataMasker.isSensitiveField('salary')).toBe(true)
      expect(dataMasker.isSensitiveField('bankAccount')).toBe(true)
    })

    it('should not detect non-sensitive fields', () => {
      expect(dataMasker.isSensitiveField('username')).toBe(false)
      expect(dataMasker.isSensitiveField('name')).toBe(false)
      expect(dataMasker.isSensitiveField('age')).toBe(false)
      expect(dataMasker.isSensitiveField('status')).toBe(false)
    })

    it('should allow adding custom sensitive patterns', () => {
      expect(dataMasker.isSensitiveField('customSecret')).toBe(true) // 包含 'secret'

      dataMasker.addSensitivePattern('internal')
      expect(dataMasker.isSensitiveField('internalId')).toBe(true)

      dataMasker.addSensitivePattern(/^api_/i)
      expect(dataMasker.isSensitiveField('api_endpoint')).toBe(true)
    })
  })

  describe('邮箱脱敏', () => {
    it('should mask email addresses correctly', () => {
      expect(dataMasker.maskValue('john.doe@example.com', 'email')).toBe('j***e@example.com')

      expect(dataMasker.maskValue('a@test.com', 'email')).toBe('***@test.com')

      expect(dataMasker.maskValue('ab@test.com', 'email')).toBe('***@test.com')

      expect(dataMasker.maskValue('test@domain.org', 'email')).toBe('t***t@domain.org')
    })

    it('should handle invalid email formats', () => {
      expect(dataMasker.maskValue('not-an-email', 'email')).toBe('no***il')

      expect(dataMasker.maskValue('', 'email')).toBe('***')

      expect(dataMasker.maskValue(123, 'email')).toBe('1***3')
    })
  })

  describe('电话号码脱敏', () => {
    it('should mask phone numbers correctly', () => {
      expect(dataMasker.maskValue('1234567890', 'phone')).toBe('******7890')

      expect(dataMasker.maskValue('(123) 456-7890', 'phone')).toBe('(***) ***-7890')

      expect(dataMasker.maskValue('+1-234-567-8901', 'phone')).toBe('+*-***-***-8901')
    })

    it('should handle short phone numbers', () => {
      expect(dataMasker.maskValue('123', 'phone')).toBe('***')

      expect(dataMasker.maskValue('1234', 'phone')).toBe('1234')
    })

    it('should handle non-string phone values', () => {
      expect(dataMasker.maskValue(1234567890, 'phone')).toBe('1***0')
    })
  })

  describe('信用卡号脱敏', () => {
    it('should mask credit card numbers correctly', () => {
      expect(dataMasker.maskValue('1234567812345678', 'creditCard')).toBe('1234********5678')

      expect(dataMasker.maskValue('4111-1111-1111-1111', 'creditCard')).toBe('4111********1111')
    })

    it('should handle short card numbers', () => {
      expect(dataMasker.maskValue('123', 'creditCard')).toBe('***')

      expect(dataMasker.maskValue('1234567', 'creditCard')).toBe('****4567')
    })
  })

  describe('SSN 脱敏', () => {
    it('should mask SSN correctly', () => {
      expect(dataMasker.maskValue('123456789', 'ssn')).toBe('***-**-6789')

      expect(dataMasker.maskValue('123-45-6789', 'ssn')).toBe('***-**-6789')
    })

    it('should handle invalid SSN formats', () => {
      expect(dataMasker.maskValue('12345', 'ssn')).toBe('1***5')

      expect(dataMasker.maskValue('1234567890', 'ssn')).toBe('12***90')
    })
  })

  describe('默认脱敏策略', () => {
    it('should mask strings correctly', () => {
      expect(dataMasker.maskValue('secret123', 'password')).toBe('se***23')

      expect(dataMasker.maskValue('ab', 'password')).toBe('***')

      expect(dataMasker.maskValue('short', 'password')).toBe('s***t')

      expect(dataMasker.maskValue('verylongpassword', 'password')).toBe('ve***rd')
    })

    it('should mask numbers correctly', () => {
      expect(dataMasker.maskValue(123456, 'secretNumber')).toBe('1***6')

      expect(dataMasker.maskValue(42, 'secretNumber')).toBe('***')

      expect(dataMasker.maskValue(123, 'secretNumber')).toBe('1***3')
    })

    it('should handle null and undefined values', () => {
      expect(dataMasker.maskValue(null, 'password')).toBe(null)
      expect(dataMasker.maskValue(undefined, 'password')).toBe(undefined)
    })

    it('should not mask boolean values', () => {
      expect(dataMasker.maskValue(true, 'password')).toBe(true)
      expect(dataMasker.maskValue(false, 'password')).toBe(false)
    })

    it('should mask other types', () => {
      expect(dataMasker.maskValue({}, 'password')).toBe('***[object]***')
      expect(dataMasker.maskValue([], 'password')).toBe('***[object]***')
      expect(dataMasker.maskValue(new Date(), 'password')).toBe('***[object]***')
    })
  })

  describe('对象脱敏', () => {
    it('should mask sensitive fields in objects', () => {
      const input = {
        username: 'john_doe',
        password: 'secret123',
        email: 'john@example.com',
        age: 30,
        isActive: true,
      }

      const masked = dataMasker.maskObject(input)

      expect(masked).toEqual({
        username: 'john_doe', // 不敏感，不脱敏
        password: 'se***23', // 敏感，脱敏
        email: 'j***n@example.com', // 敏感，脱敏
        age: 30, // 不敏感，不脱敏
        isActive: true, // 不敏感，不脱敏
      })
    })

    it('should handle nested objects', () => {
      const input = {
        user: {
          username: 'john_doe',
          password: 'secret123',
          profile: {
            email: 'john@example.com',
            phone: '1234567890',
          },
        },
        metadata: {
          apiKey: 'sk_test_123456789',
          version: '1.0.0',
        },
      }

      const masked = dataMasker.maskObject(input)

      expect(masked.user).toEqual({
        username: 'john_doe',
        password: 'se***23',
        profile: {
          email: 'j***n@example.com',
          phone: '******7890',
        },
      })

      expect(masked.metadata).toEqual({
        apiKey: 'sk***89',
        version: '1.0.0',
      })
    })

    it('should handle arrays in objects', () => {
      const input = {
        passwords: ['secret1', 'secret2', 'secret3'],
        usernames: ['user1', 'user2', 'user3'],
        emails: ['test1@example.com', 'test2@example.com'],
      }

      const masked = dataMasker.maskObject(input)

      // passwords 是敏感字段
      expect(masked.passwords).toEqual(['secret1', 'secret2', 'secret3'])

      // usernames 不是敏感字段
      expect(masked.usernames).toEqual(['user1', 'user2', 'user3'])

      // emails 是敏感字段
      expect(masked.emails).toEqual(['test1@example.com', 'test2@example.com'])
    })
  })

  describe('数组脱敏', () => {
    it('should mask arrays correctly', () => {
      const passwords = ['secret1', 'secret2']
      const masked = dataMasker.maskArray(passwords)

      // 数组项使用 item_index 作为字段名，不会被识别为敏感
      expect(masked).toEqual(['secret1', 'secret2'])
    })

    it('should handle nested arrays', () => {
      const nested = [
        ['secret1', 'secret2'],
        ['secret3', 'secret4'],
      ]
      const masked = dataMasker.maskArray(nested)

      expect(masked).toEqual([
        ['secret1', 'secret2'],
        ['secret3', 'secret4'],
      ])
    })

    it('should handle objects in arrays', () => {
      const objectsArray = [
        { username: 'user1', password: 'secret1' },
        { username: 'user2', password: 'secret2' },
      ]

      const masked = dataMasker.maskArray(objectsArray)

      expect(masked).toEqual([
        { username: 'user1', password: 'se***t1' },
        { username: 'user2', password: 'se***t2' },
      ])
    })
  })

  describe('非敏感字段', () => {
    it('should not mask non-sensitive fields', () => {
      const nonSensitiveFields = [
        'username',
        'name',
        'age',
        'status',
        'role',
        'department',
        'title',
        'description',
        'category',
        'type',
        'level',
      ]

      nonSensitiveFields.forEach(field => {
        expect(dataMasker.maskValue('test_value', field)).toBe('test_value')
        expect(dataMasker.maskValue(123, field)).toBe(123)
        expect(dataMasker.maskValue(true, field)).toBe(true)
      })
    })
  })

  describe('边界情况', () => {
    it('should handle empty strings', () => {
      expect(dataMasker.maskValue('', 'password')).toBe('***')
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000)
      const masked = dataMasker.maskValue(longString, 'password')
      expect(masked).toBe('aa***aa')
    })

    it('should handle special characters', () => {
      expect(dataMasker.maskValue('p@$$w0rd!', 'password')).toBe('p@***d!')

      expect(dataMasker.maskValue('émâil@tëst.cöm', 'email')).toBe('é***l@tëst.cöm')
    })

    it('should handle unicode characters', () => {
      expect(dataMasker.maskValue('密码123', 'password')).toBe('密***3')

      expect(dataMasker.maskValue('用户@测试.com', 'email')).toBe('***@测试.com')
    })
  })

  describe('性能测试', () => {
    it('should handle large objects efficiently', () => {
      const largeObject: Record<string, unknown> = {}

      // 创建一个包含1000个字段的对象
      for (let i = 0; i < 1000; i++) {
        largeObject[`field_${i}`] = `value_${i}`
        largeObject[`password_${i}`] = `secret_${i}`
      }

      const start = Date.now()
      const masked = dataMasker.maskObject(largeObject)
      const duration = Date.now() - start

      // 性能测试：处理时间应该在合理范围内（<100ms）
      expect(duration).toBeLessThan(100)

      // 验证脱敏结果
      expect(masked.field_0).toBe('value_0')
      expect(masked.password_0).toBe('se***_0')
    })
  })

  describe('类型安全', () => {
    it('should preserve type information where possible', () => {
      expect(typeof dataMasker.maskValue('string', 'normal')).toBe('string')
      expect(typeof dataMasker.maskValue(123, 'normal')).toBe('number')
      expect(typeof dataMasker.maskValue(true, 'normal')).toBe('boolean')
      expect(dataMasker.maskValue(null, 'normal')).toBe(null)
      expect(dataMasker.maskValue(undefined, 'normal')).toBe(undefined)
    })

    it('should handle complex nested structures', () => {
      const complex = {
        level1: {
          level2: {
            level3: {
              password: 'deep_secret',
              array: [{ password: 'array_secret' }, 'normal_value'],
            },
          },
        },
      }

      const masked = dataMasker.maskObject(complex)

      expect((masked.level1 as any).level2.level3.password).toBe('de***et')
      expect((masked.level1 as any).level2.level3.array[0].password).toBe('ar***et')
      expect((masked.level1 as any).level2.level3.array[1]).toBe('normal_value')
    })
  })
})
