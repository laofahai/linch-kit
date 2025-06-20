import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

/**
 * @description 密码哈希工具函数
 * @since 2025-06-20
 */

/**
 * @description 哈希密码
 * @param password - 明文密码
 * @returns Promise<string> 哈希后的密码
 * @since 2025-06-20
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * @description 验证密码
 * @param password - 明文密码
 * @param hashedPassword - 哈希后的密码
 * @returns Promise<boolean> 密码是否匹配
 * @since 2025-06-20
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * @description 生成会话令牌
 * @returns string 随机会话令牌
 * @since 2025-06-20
 */
export function generateSessionToken(): string {
  return nanoid(32)
}

/**
 * @description 生成会话过期时间
 * @param days - 天数，默认30天
 * @returns Date 过期时间
 * @since 2025-06-20
 */
export function generateSessionExpiry(days: number = 30): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

/**
 * @description 验证邮箱格式
 * @param email - 邮箱地址
 * @returns boolean 邮箱格式是否有效
 * @since 2025-06-20
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * @description 验证密码强度
 * @param password - 密码
 * @returns object 验证结果和错误信息
 * @since 2025-06-20
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('密码长度至少6位')
  }
  
  if (password.length > 100) {
    errors.push('密码长度不能超过100位')
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('密码必须包含字母')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * @description 生成用户名（如果未提供）
 * @param email - 邮箱地址
 * @returns string 生成的用户名
 * @since 2025-06-20
 */
export function generateUsername(email: string): string {
  const localPart = email.split('@')[0]
  const randomSuffix = nanoid(4)
  return `${localPart}_${randomSuffix}`
}
