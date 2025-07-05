/**
 * 默认数据脱敏器实现
 * @module audit/data-masker
 */

import type { DataMasker } from './types'

/**
 * 默认数据脱敏器
 */
export class DefaultDataMasker implements DataMasker {
  private sensitivePatterns: (string | RegExp)[] = [
    // 密码相关
    /password/i,
    /passwd/i,
    /pwd/i,
    /secret/i,
    /token/i,
    /key/i,
    /auth/i,
    
    // 个人信息
    /email/i,
    /phone/i,
    /mobile/i,
    /ssn/i,
    /social/i,
    /credit/i,
    /card/i,
    /account/i,
    /bank/i,
    
    // 地址信息
    /address/i,
    /street/i,
    /city/i,
    /zip/i,
    /postal/i,
    
    // 身份信息
    /id_number/i,
    /identity/i,
    /passport/i,
    /license/i,
    
    // 财务信息
    /balance/i,
    /amount/i,
    /salary/i,
    /income/i,
    /payment/i,
    
    // 健康信息
    /medical/i,
    /health/i,
    /diagnosis/i,
    /prescription/i
  ]

  private maskingStrategies = new Map<string, (value: unknown) => unknown>([
    ['email', this.maskEmail.bind(this)],
    ['phone', this.maskPhone.bind(this)],
    ['creditCard', this.maskCreditCard.bind(this)],
    ['ssn', this.maskSSN.bind(this)],
    ['default', this.maskDefault.bind(this)]
  ])

  maskValue(value: unknown, fieldName: string): unknown {
    if (!this.isSensitiveField(fieldName)) {
      return value
    }

    if (value === null || value === undefined) {
      return value
    }

    // 根据字段名选择脱敏策略
    const strategy = this.getStrategyForField(fieldName)
    return strategy(value)
  }

  maskObject(obj: Record<string, unknown>): Record<string, unknown> {
    const masked: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        masked[key] = this.maskArray(value, key)
      } else if (value && typeof value === 'object') {
        masked[key] = this.maskObject(value as Record<string, unknown>)
      } else {
        masked[key] = this.maskValue(value, key)
      }
    }

    return masked
  }

  maskArray(arr: unknown[], fieldName?: string): unknown[] {
    return arr.map((item, index) => {
      if (Array.isArray(item)) {
        return this.maskArray(item, fieldName)
      } else if (item && typeof item === 'object') {
        return this.maskObject(item as Record<string, unknown>)
      } else {
        // 如果有父字段名，用它来判断是否敏感；否则使用索引
        const keyToCheck = fieldName || `item_${index}`
        return this.maskValue(item, keyToCheck)
      }
    })
  }

  isSensitiveField(fieldName: string): boolean {
    const normalizedFieldName = fieldName.toLowerCase()
    
    return this.sensitivePatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return normalizedFieldName.includes(pattern.toLowerCase())
      } else {
        return pattern.test(fieldName)
      }
    })
  }

  addSensitivePattern(pattern: string | RegExp): void {
    this.sensitivePatterns.push(pattern)
  }

  // 私有脱敏方法

  private getStrategyForField(fieldName: string): (value: unknown) => unknown {
    const normalizedFieldName = fieldName.toLowerCase()

    if (normalizedFieldName.includes('email')) {
      return this.maskingStrategies.get('email')!
    } else if (normalizedFieldName.includes('phone') || normalizedFieldName.includes('mobile')) {
      return this.maskingStrategies.get('phone')!
    } else if (normalizedFieldName.includes('credit') || normalizedFieldName.includes('card')) {
      return this.maskingStrategies.get('creditCard')!
    } else if (normalizedFieldName.includes('ssn') || normalizedFieldName.includes('social')) {
      return this.maskingStrategies.get('ssn')!
    }

    return this.maskingStrategies.get('default')!
  }

  private maskEmail(value: unknown): unknown {
    if (typeof value !== 'string' || !value.includes('@')) {
      return this.maskDefault(value)
    }

    const [localPart, domain] = value.split('@')
    if (localPart.length <= 2) {
      return `***@${domain}`
    }

    const maskedLocal = `${localPart[0]}***${localPart[localPart.length - 1]}`
    return `${maskedLocal}@${domain}`
  }

  private maskPhone(value: unknown): unknown {
    if (typeof value !== 'string') {
      return this.maskDefault(value)
    }

    // 移除非数字字符
    const numbers = value.replace(/\D/g, '')
    if (numbers.length < 4) {
      return '***'
    }

    // 保留最后4位
    const masked = '*'.repeat(numbers.length - 4) + numbers.slice(-4)
    
    // 保持原格式
    let result = value
    let numberIndex = 0
    for (let i = 0; i < value.length; i++) {
      if (/\d/.test(value[i])) {
        result = result.substring(0, i) + masked[numberIndex] + result.substring(i + 1)
        numberIndex++
      }
    }

    return result
  }

  private maskCreditCard(value: unknown): unknown {
    if (typeof value !== 'string') {
      return this.maskDefault(value)
    }

    const numbers = value.replace(/\D/g, '')
    if (numbers.length < 4) {
      return '***'
    }

    // 信用卡号通常显示前4位和后4位
    if (numbers.length >= 8) {
      const first4 = numbers.substring(0, 4)
      const last4 = numbers.slice(-4)
      const middle = '*'.repeat(numbers.length - 8)
      return `${first4}${middle}${last4}`
    }

    return `****${numbers.slice(-4)}`
  }

  private maskSSN(value: unknown): unknown {
    if (typeof value !== 'string') {
      return this.maskDefault(value)
    }

    const numbers = value.replace(/\D/g, '')
    if (numbers.length !== 9) {
      return this.maskDefault(value)
    }

    // SSN格式: XXX-XX-1234（显示后4位）
    return `***-**-${numbers.slice(-4)}`
  }

  private maskDefault(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value
    }

    if (typeof value === 'string') {
      if (value.length <= 2) {
        return '***'
      }
      if (value.length <= 6) {
        return `${value[0]}***${value[value.length - 1]}`
      }
      return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`
    }

    if (typeof value === 'number') {
      // 对数字进行部分脱敏
      const str = value.toString()
      if (str.length <= 2) {
        return '***'
      }
      return `${str[0]}***${str[str.length - 1]}`
    }

    if (typeof value === 'boolean') {
      return value // 布尔值不需要脱敏
    }

    // 对象和数组转换为字符串后脱敏
    return `***[${typeof value}]***`
  }
}